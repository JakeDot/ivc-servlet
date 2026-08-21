/**
 * Browse Servlet for ivc://urls
 */
package cx.ivc.s;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * cx.ivc.s.BrowseServlet — IVC gateway over HTTPS (PROTOCOL.md + Deltas).
 *
 * IVC "object∆data" stream: a log of ∆event objects:
 *   { "type": string, "timestamp": integer (unix epoch),
 *     "source": string, "data": object }
 *
 * Endpoints:
 *   GET  /api/object∆data            -> JSON polling of ∆events (since/type/room filters, ETag)
 *   GET  /api/object∆data/stream     -> Server-Sent Events broadcast of ∆events
 *   POST /api/signal.php             -> WebRTC signaling deltas (offer/answer/candidate/join/leave)
 *   POST /api/webhook/stripe         -> Stripe webhook deltas (HMAC-verified)
 *   POST /api/* (channel object)     -> chat message delta, broadcast
 *   PUT  /api/* (non-channel object) -> [PUT Notice] memo -> MemoServ
 *   GET  /api/?uri=ivc://...         -> resolve ivc:// object
 *
 * Every response carries the IVC Status header:
 *   Status: <httpstatus>+modes:<appstatus>
 */
@WebServlet("/api/*")
public class BrowseServlet extends HttpServlet implements cx.ivc.IvcServlet {

    public String name() {
        return "browse";
    }

    boolean handles(IvcUri uri) {
        return true; // can handle any ivc:// URI
    }
    
    /* ---------- config ---------- */

    private static final String STRIPE_WEBHOOK_SECRET =
            System.getenv().getOrDefault("STRIPE_WEBHOOK_SECRET", "whsec_test_replace_me");

    // Strict regex filtering per "Handling Deltas Safely"
    private static final Pattern SAFE_ID   = Pattern.compile("^[A-Za-z0-9_\\-]{1,64}$");
    private static final Pattern SAFE_TYPE = Pattern.compile("^[a-z][a-z0-9_.\\-]{0,63}$");
    private static final Pattern JSON_FIELD = Pattern.compile("\"([A-Za-z0-9_]+)\"\\s*:\\s*\"([^\"]*)\"");
    private static final Pattern TYPE_FIELD = Pattern.compile("\"type\"\\s*:\\s*\"([^\"]+)\"");

    /* ---------- stores ---------- */

    private final CopyOnWriteArrayList<Delta> deltaLog = new CopyOnWriteArrayList<>();
    private final Map<String, String> memoServ = new ConcurrentHashMap<>();
    private final Map<String, String> subscriptions = new ConcurrentHashMap<>();
    private final List<BlockingQueue<String>> sseSubscribers = new CopyOnWriteArrayList<>();

    /* ================= GET ================= */

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = decodePath(req.getPathInfo());

        if (path.equals("/object∆data") || path.equals("/object%E2%88%86data")) {
            serveDeltaStream(req, resp);            // polling JSON
            return;
        }
        if (path.equals("/object∆data/stream") || path.equals("/object%E2%88%86data/stream")) {
            serveSseStream(resp);                   // Server-Sent Events
            return;
        }
        String uri = req.getParameter("uri");
        if (uri != null) {
            serveObject(req, resp, IvcUri.parse(uri));
            return;
        }
        send(req, resp, 400, "text/plain", "Missing ivc:// uri or /object∆data path", null);
    }

    /* ---------- object∆data stream: JSON polling ---------- */

    private void serveDeltaStream(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        long since = parseLong(req.getParameter("since"), 0L);   // unix epoch
        String type = req.getParameter("type");
        String room = req.getParameter("room");

        List<Delta> out = new ArrayList<>();
        for (Delta d : deltaLog) {
            if (d.timestamp() < since) continue;
            if (type != null && !type.equals(d.type())) continue;
            if (room != null && !containsField(d.dataJson(), "room", room)) continue;
            out.add(d);
        }

        long last = deltaLog.isEmpty() ? 0 : deltaLog.get(deltaLog.size() - 1).timestamp();
        resp.setHeader("ETag", "\"v" + last + "\"");
        if (("\"v" + last + "\"").equals(req.getHeader("If-None-Match"))) {
            resp.setStatus(HttpServletResponse.SC_NOT_MODIFIED);
            return;
        }
        send(req, resp, 200, "application/json; charset=utf-8", deltasToJson(out), null);
    }

    /* ---------- object∆data stream: Server-Sent Events ---------- */

    private void serveSseStream(HttpServletResponse resp) throws IOException {
        resp.setContentType("text/event-stream");
        resp.setCharacterEncoding("UTF-8");
        resp.setHeader("Cache-Control", "no-cache");
        resp.setHeader("Connection", "keep-alive");
        resp.setHeader("Access-Control-Allow-Origin", "*");

        BlockingQueue<String> queue = new LinkedBlockingQueue<>();
        sseSubscribers.add(queue);
        PrintWriter w = resp.getWriter();
        try {
            w.write(": connected\n\n");
            w.flush();
            while (true) {
                String payload = queue.poll(25, TimeUnit.SECONDS);
                if (payload != null) {
                    w.write("data: " + payload + "\n\n");
                    w.flush();
                } else {
                    w.write(": ping\n\n");   // keepalive
                    w.flush();
                }
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            sseSubscribers.remove(queue);
        }
    }

    /* ================= POST ================= */

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = decodePath(req.getPathInfo());

        if (path.equals("/webhook/stripe")) {
            handleStripeWebhook(req, resp);
            return;
        }

        IvcUri ivc = requireUri(req, resp);
        if (ivc == null) return;
        String body = readBody(req);
        String nick = nick(req);

        String bodyType = firstGroup(TYPE_FIELD, body);
        boolean signaling = bodyType != null && List.of(
                "offer", "answer", "candidate", "join", "leave", "peer-joined").contains(bodyType);

        if (signaling) {
            // WebRTC signaling delta — channel only, sanitized room/client
            if (!isChannel(ivc.prefix()) || !sanitizeSignal(body)) {
                send(req, resp, 400, "application/json",
                     "{\"status\":\"error\",\"reason\":\"signaling requires a channel object and sanitized room/client\"}", ivc);
                return;
            }
            broadcast(new Delta(bodyType, Instant.now().getEpochSecond(), nick, asDataJson(body)));
            send(req, resp, 200, "application/json", "{\"status\":\"signal-relayed\"}", ivc);
            return;
        }

        if (isChannel(ivc.prefix())) {
            // Standard chat message delta -> broadcast to channel peers
            Delta d = validateAndBuild("chat", nick, asDataJson(body), ivc.object());
            if (d == null) {
                send(req, resp, 400, "application/json",
                     "{\"status\":\"error\",\"reason\":\"delta failed validation\"}", ivc);
                return;
            }
            broadcast(d);
            send(req, resp, 200, "application/json",
                 "{\"status\":\"broadcast\",\"object\":\"" + json(ivc.object()) + "\"}", ivc);
        } else {
            send(req, resp, 400, "application/json",
                 "{\"status\":\"error\",\"reason\":\"POST requires a channel object (# or &); use PUT for memos\"}", ivc);
        }
    }

    /* ================= PUT: memos -> MemoServ ================= */

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        IvcUri ivc = requireUri(req, resp);
        if (ivc == null) return;
        String body = readBody(req);
        String nick = nick(req);

        if (!isChannel(ivc.prefix())) {
            // @, £, $ -> halt broadcast, route into MemoServ as [PUT Notice]
            memoServ.put(ivc.object(), "[PUT Notice] " + body);
            broadcast(new Delta("memo", Instant.now().getEpochSecond(), nick,
                    "{\"object\":\"" + json(ivc.object()) + "\",\"text\":\"" + json(body) + "\"}"));
            send(req, resp, 200, "application/json",
                 "{\"status\":\"memo-stored\",\"object\":\"" + json(ivc.object()) + "\"}", ivc);
        } else {
            // Channel PUT -> offline notice/comment broadcast
            broadcast(new Delta("notice", Instant.now().getEpochSecond(), nick,
                    "{\"room\":\"" + json(ivc.object()) + "\",\"text\":\"" + json(body) + "\"}"));
            send(req, resp, 200, "application/json",
                 "{\"status\":\"notice-broadcast\",\"object\":\"" + json(ivc.object()) + "\"}", ivc);
        }
    }

    /* ================= Stripe webhook deltas ================= */

    private void handleStripeWebhook(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String signature = req.getHeader("Stripe-Signature");
        String payload = readBody(req);

        // Cryptographic verification per "Handling Deltas Safely"
        if (signature == null || !verifyStripeSignature(signature, payload)) {
            send(req, resp, 400, "application/json",
                 "{\"status\":\"error\",\"reason\":\"invalid stripe signature\"}", null);
            return;
        }

        String type = firstGroup(TYPE_FIELD, payload);
        if (type == null) type = "unknown";
        String status = extractField(payload, "status");
        String customer = extractField(payload, "customer");
        if (customer == null) customer = "unknown";

        // Apply delta to local state (StripeService::handleWebhookEvent equivalent)
        subscriptions.put(type, status == null ? "processed" : status);

        broadcast(new Delta("stripe." + type, Instant.now().getEpochSecond(), "stripe",
                "{\"customer\":\"" + json(customer) + "\",\"status\":\"" + json(status == null ? "" : status) + "\"}"));
        send(req, resp, 200, "application/json",
             "{\"status\":\"webhook-processed\",\"type\":\"" + json(type) + "\"}", null);
    }

    private boolean verifyStripeSignature(String sigHeader, String payload) {
        // Format: t=<timestamp>,v1=<hex hmac of "t.<payload>" with webhook secret
        String t = null, v1 = null;
        for (String part : sigHeader.split(",")) {
            String[] kv = part.split("=", 2);
            if (kv.length == 2) {
                if (kv[0].equals("t")) t = kv[1];
                if (kv[0].equals("v1")) v1 = kv[1];
            }
        }
        if (t == null || v1 == null) return false;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(STRIPE_WEBHOOK_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] expected = mac.doFinal((t + "." + payload).getBytes(StandardCharsets.UTF_8));
            byte[] provided = HexFormat.of().parseHex(v1);
            return MessageDigest.isEqual(expected, provided);   // constant-time compare
        } catch (Exception e) {
            return false;
        }
    }

    /* ================= object resolution ================= */

    private void serveObject(HttpServletRequest req, HttpServletResponse resp, IvcUri ivc)
            throws IOException {
        switch (ivc.prefix()) {
            case '#', '&' -> send(req, resp, 200, "application/json",
                    "{\"object\":\"" + json(ivc.object()) + "\",\"peers\":{}}", ivc);
            case '@' -> {
                String memo = memoServ.get(ivc.object());
                send(req, resp, 200, "application/json",
                     "{\"user\":\"" + json(ivc.object()) + "\",\"memo\":"
                     + (memo == null ? "null" : "\"" + json(memo) + "\"") + "}", ivc);
            }
            case '£', '$' -> send(req, resp, 200, "application/json",
                    "{\"service\":\"" + json(ivc.object()) + "\",\"status\":\"ok\"}", ivc);
            default -> send(req, resp, 400, "application/json",
                    "{\"status\":\"error\",\"reason\":\"unknown object prefix\"}", ivc);
        }
    }

    /* ================= delta validation & broadcast ================= */

    private Delta validateAndBuild(String type, String source, String dataJson, String room) {
        if (!SAFE_TYPE.matcher(type).matches()) return null;
        if (!SAFE_ID.matcher(source).matches()) return null;
        if (!looksLikeJsonObject(dataJson)) return null;
        if (room != null && !SAFE_ID.matcher(room).matches()) return null;
        return new Delta(type, Instant.now().getEpochSecond(), source, dataJson);
    }

    private boolean sanitizeSignal(String body) {
        // Signaling deltas: strict regex filtering on room and client IDs
        String room = extractField(body, "room");
        String client = extractField(body, "client");
        if (room != null && !SAFE_ID.matcher(room).matches()) return false;
        return client == null || SAFE_ID.matcher(client).matches();
    }

    private void broadcast(Delta d) {
        deltaLog.add(d);
        String payload = deltaToJson(d);
        for (BlockingQueue<String> q : sseSubscribers) {
            q.offer(payload);
        }
    }

    /* ================= JSON rendering ================= */

    private String deltasToJson(List<Delta> deltas) {
        StringBuilder sb = new StringBuilder("[\n");
        for (int i = 0; i < deltas.size(); i++) {
            sb.append(deltaToJson(deltas.get(i)));
            sb.append(i < deltas.size() - 1 ? ",\n" : "\n");
        }
        return sb.append("]").toString();
    }

    private String deltaToJson(Delta d) {
        return "  {\"type\":\"" + json(d.type())
             + "\",\"timestamp\":" + d.timestamp()
             + ",\"source\":\"" + json(d.source())
             + "\",\"data\":" + d.dataJson() + "}";
    }

    /* ================= helpers ================= */

    private IvcUri requireUri(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String uri = req.getParameter("uri");
        if (uri == null) {
            send(req, resp, 400, "application/json",
                 "{\"status\":\"error\",\"reason\":\"missing uri parameter\"}", null);
            return null;
        }
        return IvcUri.parse(uri);
    }

    private String nick(HttpServletRequest req) {
        String n = req.getHeader("X-IVC-Nick");
        return (n == null || n.isBlank()) ? "anonymous" : n;
    }

    private String readBody(HttpServletRequest req) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader r = req.getReader()) {
            String line;
            while ((line = r.readLine()) != null) sb.append(line).append('\n');
        }
        return sb.toString().trim();
    }

    private String asDataJson(String body) {
        String t = body.trim();
        return looksLikeJsonObject(t) ? t : "{\"text\":\"" + json(t) + "\"}";
    }

    private boolean looksLikeJsonObject(String s) {
        String t = s.trim();
        if (!t.startsWith("{") || !t.endsWith("}")) return false;
        int depth = 0;
        for (int i = 0; i < t.length(); i++) {
            char c = t.charAt(i);
            if (c == '{') depth++;
            else if (c == '}') depth--;
            if (depth < 0) return false;
        }
        return depth == 0;   // TODO: replace with a real JSON parser in production
    }

    private String decodePath(String pathInfo) {
        if (pathInfo == null) return "";
        if (!pathInfo.contains("%")) return pathInfo;
        try {
            return URLDecoder.decode(pathInfo, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return pathInfo;
        }
    }

    private long parseLong(String s, long def) {
        try {
            return s == null ? def : Long.parseLong(s);
        } catch (NumberFormatException e) {
            return def;
        }
    }

    private String firstGroup(Pattern p, String s) {
        Matcher m = p.matcher(s);
        return m.find() ? m.group(1
