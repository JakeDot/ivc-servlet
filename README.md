# Server deployment
this service is available under ivc+https://s.ivc.cx/&services/∆modes

# ivc-servlet

**User-extensible IVC gateway — Java servlets, managed by Node.js.**

`ivc-servlet` turns a plain HTTPS endpoint into an IVC (Internet Video Chat) protocol node. The protocol itself — `ivc://` connection URIs, the `object∆data` stream, ∆event deltas — is implemented by the default gateway servlet, [`cx.ivc.s.BrowseServlet`](src/main/java/cx/ivc/s/BrowseServlet.java). Around it sits a lightweight **Node.js servlet manager** that discovers, loads, supervises, and routes to user-contributed Java servlets.

The core design goal is **extensibility**: adding a new capability to the node — a chat macro, a custom search provider, a webhook consumer, a network service object — should mean *dropping in a servlet*. No core changes, no restarting the whole stack.

## Architecture

```
                       ┌──────────────────────────────────────────────┐
                       │            Node.js Servlet Manager           │
                       │                                              │
  HTTPS ─────────────▶ │  ┌────────────────────────────────────────┐  │
  ivc:// + object∆data │  │  Router (ivc:// URI → servlet)         │  │
                       │  └──────────────────┬─────────────────────┘  │
                       │                     │ dispatch              │
                       │  ┌──────────────────▼─────────────────────┐  │
                       │  │  cx.ivc.s.BrowseServlet  (gateway)     │  │
                       │  │  • ivc:// URI parsing (# & @ £ $, +m)  │  │
                       │  │  • object∆data stream + ∆event log     │  │
                       │  │  • POST broadcast / PUT → MemoServ     │  │
                       │  │  • Status header, WebRTC signaling,    │  │
                       │  │    Stripe webhooks, delta sanitization │  │
                       │  └──────────────────┬─────────────────────┘  │
                       │                     │ delegates / injects   │
                       │  ┌──────────────────▼─────────────────────┐  │
                       │  │       User servlets (hot-loadable)     │  │
                       │  │  search-svc • macro-svc • webhook-svc  │  │
                       │  └────────────────────────────────────────┘  │
                       └──────────────────────────────────────────────┘
```

### Why this split?

| Layer | Responsibility |
|---|---|
| **Node.js manager** | Servlet discovery, lifecycle, routing, security policy, admin interface. One process, easy to operate, language-agnostic glue. |
| **Java servlets** | Actual protocol and business logic. A small documented interface; the manager hot-loads them. |
| **BrowseServlet (default gateway)** | The reference servlet and the living documentation — read it to learn how to write your own. |

## Features

- **IVC protocol gateway** — `ivc://` URIs with object prefixes (`#` global, `&` local, `@` user, `£` network, `$` server) and `+modes` elevation requests
- **`object∆data` stream** — ∆event log served as JSON polling (with ETag revalidation) or Server-Sent Events
- **Deltas** — uniform `{type, timestamp, source, data}` events for chat, WebRTC signaling, memos, and webhooks
- **MemoServ** — `PUT` to non-channel objects (`@`, `£`, `$`) routes into the offline messaging database as `[PUT Notice]`
- **Status header** — `Status: <httpstatus>+modes:<appstatus>` for zero-poll UI state
- **Safe by default** — strict regex sanitization of `room`/`client` IDs, schema validation of deltas, constant-time HMAC verification of Stripe webhooks
- **`+m` server mode** — with the `--macros` option, servlets can inject code and messages directly into chat streams

## Quick start

```bash
# Requirements: Node.js 18+, Java 17+, Maven
git clone https://github.com/JakeDot/ivc-servlet.git
cd ivc-servlet

# Build the servlets
mvn package

# Start the Node.js servlet manager (macros/mode +m enabled)
npm install
node manager.js --macros

# Register a servlet (admin interface or config file)
curl -X POST http://localhost:8080/_ivc/servlets \
  -H 'Content-Type: application/json' \
  -d '{"name":"search-svc","jar":"build/search-svc.jar"}'
```

## The servlet contract

A servlet is a plain Java class implementing the small `IvcServlet` interface — BrowseServlet is the reference implementation and the best documentation of the contract:

```java
public interface IvcServlet {
    String name();

    /** Does this servlet handle the ivc:// object? (prefix + object + modes) */
    boolean handles(IvcUri uri);

    /** Consume a ∆event from the object∆data stream (chat, memo, signaling…) */
    void onDelta(Delta delta);

    /** Full request dispatch (GET/POST/PUT) for custom endpoints */
    IvcResponse service(IvcRequest request);
}
```

That's the entire surface. The manager handles discovery, routing, and lifecycle; your servlet just declares what it handles and what it does with deltas.

## Writing your first servlet

A servlet that replies to `ivc://@<nick>` memos and injects into `#lobby` when a channel is in `+m` mode:

```java
package cx.ivc.s.user;

import cx.ivc.s.*;

public class EchoServlet implements IvcServlet {

    public String name() { return "echo-svc"; }

    public boolean handles(IvcUri uri) {
        // @ objects are memos to users — we take them all
        return uri.prefix() == '@';
    }

    public void onDelta(Delta d) {
        // In +m (macros) mode, inject a response into the channel
        if (d.type().equals("chat") && server().hasMode(d.data().room(), 'm')) {
            server().injectChat(d.data().room(), "echo: " + d.data().text());
        }
    }

    public IvcResponse service(IvcRequest req) { … }
}
```

Compile it, hand the jar to the manager, done — the node now speaks for `@` objects.

### Extension points

| You want to… | Implement |
|---|---|
| Handle an `ivc://` object class | `handles()` + `service()` |
| React to chat / signaling / memo deltas | `onDelta()` |
| Inject into chats (requires `+m` / `--macros`) | `server().injectChat(room, text)` |
| Add a custom HTTP endpoint | `service()` on any path |
| Consume Stripe webhook deltas | `onDelta()` filtering `type.startsWith("stripe.")` |
| Provide custom search results | push `search` deltas into the `object∆data` stream |

## Server mode: `+m` / `--macros`

When a channel carries mode `+m` — or the manager is started with `--macros` — the server permits servlet code to be injected into chat streams. This is the deliberate power feature of the project: servlets become *participants*, not just responders.

```bash
node manager.js --macros
```

Use it deliberately: with great power comes great need for sanitization — which the gateway applies to every injected payload before broadcast.

## Protocol reference (condensed)

| Element | Form |
|---|---|
| Connection URI | `ivc://<host>/<prefix><object>+<modes>` e.g. `ivc://local.host/#fortress+ov` |
| Object prefixes | `#` global channel · `&` local channel · `@` user · `£` network · `$` server |
| POST | chat / WebRTC signaling → broadcast to channel peers |
| PUT | non-channel object → MemoServ `[PUT Notice]`; channel → offline notice |
| Status header | `Status: 200+modes:<nick>{subs [#room+t+o]}` |
| ∆event | `{"type","timestamp","source","data"}` — unix epoch timestamp, opaque payload |
| Streams | `GET /api/object∆data` (JSON polling, `since`/`type`/`room`, ETag) · `GET /api/object∆data/stream` (SSE) |

Full details live in [`docs/PROTOCOL.md`](docs/PROTOCOL.md) and [`docs/DELTAS.md`](docs/DELTAS.md).

## Configuration

| Setting | Where |
|---|---|
| `STRIPE_WEBHOOK_SECRET` | env var — HMAC verification of webhook deltas |
| `X-IVC-Nick` | request header — identity used in the `Status` header `appstatus` |
| `--macros` | manager flag — enables `+m` chat injection mode |

## Project layout

```
manager.js                  # Node.js servlet manager (discovery, lifecycle, routing)
src/main/java/cx/ivc/s/
  BrowseServlet.java        # default gateway servlet = living documentation
  IvcServlet.java           # the servlet contract
  IvcUri.java               # ivc:// URI model
  Delta.java                # ∆event model
docs/
  PROTOCOL.md               # IVC protocol specification
  DELTAS.md                 # ∆event object specification
```

## Contributing

Servlets are the contribution surface. Fork, write a servlet, open a PR — the core stays small; the ecosystem grows.
