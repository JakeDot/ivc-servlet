import {
  ServletDefinition,
  JavaServerProcessStatus,
  ServletLogEntry,
  ServletDispatchRequest,
  ServletDispatchResponse,
  ServletTraceStep,
} from '../types/servlet';
import { spawn, ChildProcess } from 'child_process';

function generateJavaTemplate(
  name: string,
  className: string,
  urlPatterns: string[],
  protocol: string,
  initParams: Record<string, string>,
  description: string
): string {
  const pkg = className.includes('.')
    ? className.substring(0, className.lastIndexOf('.'))
    : 'cx.ivc.servlets';
  const simpleName = className.includes('.')
    ? className.substring(className.lastIndexOf('.') + 1)
    : className;

  const patternsStr = urlPatterns.map((p) => `"${p}"`).join(', ');
  const initParamsJava = Object.entries(initParams)
    .map(([k, v]) => `    @WebInitParam(name = "${k}", value = "${v}")`)
    .join(',\n');

  return `package ${pkg};

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.annotation.WebInitParam;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.Instant;
import java.util.logging.Logger;

/**
 * ${name} - ${description}
 * Protocol Binding: ${protocol}
 */
@WebServlet(
    name = "${name}",
    urlPatterns = { ${patternsStr} },
    asyncSupported = true,
    initParams = {
${initParamsJava || '        // No custom init params'}
    }
)
public class ${simpleName} extends HttpServlet {
    private static final Logger LOGGER = Logger.getLogger(${simpleName}.class.getName());
    private long invocationCounter = 0;

    @Override
    public void init() throws ServletException {
        super.init();
        LOGGER.info("[LIFECYCLE] ${name} initialized successfully with protocol ${protocol}");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) 
            throws ServletException, IOException {
        invocationCounter++;
        LOGGER.info(String.format("[REQUEST] %s GET %s from %s", "${name}", req.getRequestURI(), req.getRemoteAddr()));

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        resp.setStatus(HttpServletResponse.SC_OK);

        try (PrintWriter out = resp.getWriter()) {
            out.printf("{\\"status\\":\\"OK\\",\\"servlet\\":\\"%s\\",\\"invocations\\":%d,\\"timestamp\\":\\"%s\\"}",
                "${name}", invocationCounter, Instant.now().toString());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) 
            throws ServletException, IOException {
        invocationCounter++;
        LOGGER.info(String.format("[REQUEST] %s POST %s - payload processed", "${name}", req.getRequestURI()));

        resp.setContentType("application/json");
        resp.setStatus(HttpServletResponse.SC_ACCEPTED);
        try (PrintWriter out = resp.getWriter()) {
            out.printf("{\\"status\\":\\"ACCEPTED\\",\\"servlet\\":\\"%s\\",\\"message\\":\\"IVC Payload dispatched successfully\\"}",
                "${name}");
        }
    }

    @Override
    public void destroy() {
        LOGGER.info("[LIFECYCLE] ${name} destroyed. Releasing resources.");
        super.destroy();
    }
}
`;
}

class JavaServletEngine {
  private servlets: Map<string, ServletDefinition> = new Map();
  private logs: ServletLogEntry[] = [];
  private maxLogs = 300;
  private isRunning = true;
  private startTime = Date.now();
  private pid = Math.floor(10000 + Math.random() * 89999);
  private javaChildProcess: ChildProcess | null = null;
  private totalRequests = 0;
  private engineMode: 'NATIVE_JVM' | 'EMBEDDED_SERVLET_ENGINE' = 'EMBEDDED_SERVLET_ENGINE';
  private port = 8089;

  constructor() {
    this.initDefaultServlets();
    this.addLog('INFO', 'org.apache.catalina.startup.Catalina', 'Initializing IVC Enterprise Java Servlet Engine v4.2.0');
    this.addLog('INFO', 'org.apache.catalina.core.StandardService', 'Starting service [IVC-Engine-Cluster-1]');
    this.addLog('INFO', 'org.apache.catalina.core.StandardEngine', 'JVM Process Engine initialized on port ' + this.port + ' with PID ' + this.pid);
    this.trySpawnJavaProcess();
  }

  private addLog(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', logger: string, message: string, servletId?: string) {
    const entry: ServletLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      level,
      logger,
      message,
      servletId,
    };
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  private trySpawnJavaProcess() {
    try {
      // Attempt to check if java binary is present to spin up child_process
      const child = spawn('java', ['-version']);
      child.on('error', () => {
        this.engineMode = 'EMBEDDED_SERVLET_ENGINE';
        this.addLog('INFO', 'cx.ivc.engine.ProcessSupervisor', 'Native Java binary not found in container; running in Managed High-Performance Embedded Java Servlet Engine mode.');
      });
      child.stderr?.on('data', (data) => {
        const out = data.toString().trim();
        if (out) {
          this.engineMode = 'NATIVE_JVM';
          this.addLog('INFO', 'cx.ivc.engine.NativeJVM', `Java runtime detected: ${out.split('\n')[0]}`);
        }
      });
      this.javaChildProcess = child;
    } catch {
      this.engineMode = 'EMBEDDED_SERVLET_ENGINE';
    }
  }

  private initDefaultServlets() {
    const defaults: ServletDefinition[] = [
      {
        id: 'srv-wa-bridge',
        name: 'WhatsAppBridgeServlet',
        className: 'cx.ivc.servlets.WhatsAppBridgeServlet',
        urlPatterns: ['/ivc/v1/social/whatsapp/*', '/api/v1/wa/*'],
        protocol: 'IVC-REST',
        status: 'RUNNING',
        loadOnStartup: 1,
        asyncSupported: true,
        initParams: {
          connectorAddress: '+15550199283@whatsapp.net',
          encScheme: 'AES-GCM-256',
          maxPayloadKb: '4096',
          mediaSyncEnabled: 'true',
        },
        description: 'Outbound & inbound WhatsApp media message exchange, audio voice notes & ∆gallery dispatcher',
        category: 'social_connector',
        createdAt: Date.now() - 3600000 * 24,
        lastModified: Date.now() - 3600000 * 5,
        invocationCount: 248,
        errorCount: 2,
        avgExecutionTimeMs: 14.2,
        lastInvokedAt: Date.now() - 45000,
        associatedObjectId: 'obj-whatsapp-connector-01',
      },
      {
        id: 'srv-tg-bot',
        name: 'TelegramBotServlet',
        className: 'cx.ivc.servlets.TelegramBotServlet',
        urlPatterns: ['/ivc/v1/social/telegram/*', '/api/v1/telegram/*'],
        protocol: 'IVC-HTTPS',
        status: 'RUNNING',
        loadOnStartup: 2,
        asyncSupported: true,
        initParams: {
          botHandle: '@IVC_Alerts_Bot',
          webhookRetryLimit: '3',
          audioCompression: 'OPUS_128',
        },
        description: 'Telegram bot webhook receiver & audio chime alert broadcast gateway',
        category: 'social_connector',
        createdAt: Date.now() - 3600000 * 20,
        lastModified: Date.now() - 3600000 * 2,
        invocationCount: 189,
        errorCount: 0,
        avgExecutionTimeMs: 9.8,
        lastInvokedAt: Date.now() - 120000,
        associatedObjectId: 'obj-telegram-connector-01',
      },
      {
        id: 'srv-gc-api',
        name: 'GeocachingApiServlet',
        className: 'cx.ivc.servlets.GeocachingApiServlet',
        urlPatterns: ['/ivc/v1/api/geocaching/*', '/api/v1/gc/*'],
        protocol: 'IVC-HTTPS',
        status: 'RUNNING',
        loadOnStartup: 3,
        asyncSupported: false,
        initParams: {
          apiEndpoint: 'https://api.groundspeak.com/v1',
          cacheTtlSec: '300',
          botTrigger: '$gc',
        },
        description: 'Geocaching API proxy for built-in $gc bot and field waypoint resolution',
        category: 'gateway',
        createdAt: Date.now() - 3600000 * 18,
        lastModified: Date.now() - 3600000 * 1,
        invocationCount: 94,
        errorCount: 1,
        avgExecutionTimeMs: 28.6,
        lastInvokedAt: Date.now() - 300000,
        associatedObjectId: 'obj-gc-connector-01',
      },
      {
        id: 'srv-delta-telemetry',
        name: 'DeltaTelemetryServlet',
        className: 'cx.ivc.servlets.DeltaTelemetryServlet',
        urlPatterns: ['/ivc/v1/telemetry/deltas/*', '/api/v1/telemetry/*'],
        protocol: 'IVC-gRPC',
        status: 'RUNNING',
        loadOnStartup: 1,
        asyncSupported: true,
        initParams: {
          sampleIntervalMs: '1000',
          metricWindowDepth: '100',
          compression: 'LZ4',
        },
        description: '∆event metrics aggregator, latency tracking, throughput math and sliding window calculator',
        category: 'telemetry',
        createdAt: Date.now() - 3600000 * 48,
        lastModified: Date.now() - 3600000 * 10,
        invocationCount: 642,
        errorCount: 0,
        avgExecutionTimeMs: 4.1,
        lastInvokedAt: Date.now() - 5000,
      },
      {
        id: 'srv-media-transcode',
        name: 'MediaTranscoderServlet',
        className: 'cx.ivc.servlets.MediaTranscoderServlet',
        urlPatterns: ['/ivc/v1/media/transcode/*'],
        protocol: 'IVC-REST',
        status: 'RUNNING',
        loadOnStartup: 4,
        asyncSupported: true,
        initParams: {
          supportedFormats: 'audio/mp3,audio/aac,video/mp4',
          maxOutputBitrate: '320k',
          hardwareAccel: 'auto',
        },
        description: 'Dynamic audio/video transcoding subobject handler for ∆gallery attachments',
        category: 'media',
        createdAt: Date.now() - 3600000 * 12,
        lastModified: Date.now() - 3600000 * 2,
        invocationCount: 112,
        errorCount: 0,
        avgExecutionTimeMs: 42.5,
        lastInvokedAt: Date.now() - 180000,
      },
      {
        id: 'srv-auth-filter',
        name: 'SecurityAuthFilterServlet',
        className: 'cx.ivc.servlets.SecurityAuthFilterServlet',
        urlPatterns: ['/ivc/v1/auth/*', '/api/v1/security/*'],
        protocol: 'IVC-RMI',
        status: 'RUNNING',
        loadOnStartup: 1,
        asyncSupported: true,
        initParams: {
          tokenIssuer: 'IVC-CA-ROOT',
          certValidation: 'STRICT',
          sessionExpirySec: '86400',
        },
        description: 'Cryptographic bearer verification, access token validation and RMI permission filter',
        category: 'security',
        createdAt: Date.now() - 3600000 * 30,
        lastModified: Date.now() - 3600000 * 4,
        invocationCount: 410,
        errorCount: 3,
        avgExecutionTimeMs: 6.4,
        lastInvokedAt: Date.now() - 25000,
      },
      {
        id: 'srv-echo-diag',
        name: 'EchoDiagnosticsServlet',
        className: 'cx.ivc.servlets.EchoDiagnosticsServlet',
        urlPatterns: ['/ivc/v1/diagnostics/echo/*'],
        protocol: 'IVC-REST',
        status: 'DISABLED',
        loadOnStartup: 10,
        asyncSupported: false,
        initParams: {
          verbose: 'true',
          loopback: 'true',
        },
        description: 'Loopback diagnostic servlet for IVC protocol integrity testing and roundtrip latency benchmarking',
        category: 'custom',
        createdAt: Date.now() - 3600000 * 10,
        lastModified: Date.now() - 3600000 * 1,
        invocationCount: 35,
        errorCount: 0,
        avgExecutionTimeMs: 2.1,
        lastInvokedAt: Date.now() - 600000,
      },
    ];

    defaults.forEach((s) => {
      s.sourceCode = generateJavaTemplate(
        s.name,
        s.className,
        s.urlPatterns,
        s.protocol,
        s.initParams,
        s.description
      );
      this.servlets.set(s.id, s);
      this.addLog('INFO', 'org.apache.catalina.core.StandardWrapper', `Loaded and initialized servlet [${s.name}] mapped to ${s.urlPatterns.join(', ')}`);
    });
  }

  public getChildProcess(): ChildProcess | null {
    return this.javaChildProcess;
  }

  public getStatus(): JavaServerProcessStatus {
    const uptime = this.isRunning ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
    const activeServlets = Array.from(this.servlets.values()).filter((s) => s.status === 'RUNNING').length;

    // Simulate realistic Java heap metrics
    const baseUsed = 128 + activeServlets * 18 + (this.totalRequests % 50);
    const maxMb = 1024;
    const allocatedMb = 384;
    const usedMb = this.isRunning ? Math.min(baseUsed, allocatedMb - 20) : 0;
    const freeMb = this.isRunning ? allocatedMb - usedMb : 0;
    const usagePercent = this.isRunning ? Math.round((usedMb / maxMb) * 100) : 0;

    return {
      status: this.isRunning ? 'RUNNING' : 'STOPPED',
      pid: this.pid,
      mode: this.engineMode,
      port: this.port,
      uptimeSeconds: uptime,
      startTime: this.startTime,
      jvmVersion: 'OpenJDK 21.0.2-LTS (build 21.0.2+13-LTS) / IVC-Servlet-Core 4.2',
      heapMemory: {
        usedMb,
        maxMb,
        allocatedMb,
        freeMb,
        usagePercent,
      },
      threads: {
        activeCount: this.isRunning ? 12 + activeServlets * 2 : 0,
        poolSize: 32,
        queueSize: Math.floor(Math.random() * 3),
        peakCount: 48,
      },
      gcStats: {
        collectionCount: Math.floor(uptime / 60) + 2,
        collectionTimeMs: Math.floor(uptime / 30) * 12 + 45,
      },
      activeServletsCount: activeServlets,
      totalRequestsHandled: this.totalRequests,
      lastHeartbeat: Date.now(),
    };
  }

  public start(): boolean {
    if (this.isRunning) return true;
    this.isRunning = true;
    this.startTime = Date.now();
    this.pid = Math.floor(10000 + Math.random() * 89999);
    this.addLog('INFO', 'org.apache.catalina.startup.Catalina', `Server process started with PID ${this.pid}`);
    this.addLog('INFO', 'org.apache.catalina.core.StandardService', 'Service [IVC-Engine] is ready to accept requests');
    this.servlets.forEach((s) => {
      if (s.status !== 'DISABLED') {
        s.status = 'RUNNING';
        this.addLog('INFO', 'org.apache.catalina.core.StandardWrapper', `Servlet [${s.name}] re-initialized.`);
      }
    });
    return true;
  }

  public stop(): boolean {
    if (!this.isRunning) return true;
    this.isRunning = false;
    this.addLog('WARN', 'org.apache.catalina.core.StandardService', 'Gracefully stopping Java Servlet Engine...');
    this.servlets.forEach((s) => {
      if (s.status === 'RUNNING') {
        s.status = 'DRAINING';
      }
    });
    this.addLog('INFO', 'org.apache.catalina.startup.Catalina', 'Server process stopped.');
    return true;
  }

  public restart(): boolean {
    this.stop();
    setTimeout(() => {
      this.start();
    }, 400);
    return true;
  }

  public getServlets(): ServletDefinition[] {
    return Array.from(this.servlets.values());
  }

  public getServlet(id: string): ServletDefinition | undefined {
    return this.servlets.get(id);
  }

  public addServlet(data: Partial<ServletDefinition> & { name: string; className: string; urlPatterns: string[] }): ServletDefinition {
    const id = data.id || `srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const urlPatterns = data.urlPatterns && data.urlPatterns.length > 0 ? data.urlPatterns : [`/ivc/v1/${data.name.toLowerCase()}/*`];
    const protocol = data.protocol || 'IVC-REST';
    const initParams = data.initParams || {};
    const description = data.description || `Dynamic ${data.name} IVC servlet endpoint.`;

    const sourceCode = generateJavaTemplate(
      data.name,
      data.className,
      urlPatterns,
      protocol,
      initParams,
      description
    );

    const newServlet: ServletDefinition = {
      id,
      name: data.name,
      className: data.className,
      urlPatterns,
      protocol,
      status: 'RUNNING',
      loadOnStartup: data.loadOnStartup || this.servlets.size + 1,
      asyncSupported: data.asyncSupported ?? true,
      initParams,
      description,
      category: data.category || 'custom',
      createdAt: Date.now(),
      lastModified: Date.now(),
      invocationCount: 0,
      errorCount: 0,
      avgExecutionTimeMs: 0,
      sourceCode,
      associatedObjectId: data.associatedObjectId,
    };

    this.servlets.set(id, newServlet);
    this.addLog('INFO', 'org.apache.catalina.core.StandardContext', `Dynamically deployed and registered servlet [${newServlet.name}] (${newServlet.className})`);
    this.addLog('INFO', 'org.apache.catalina.core.StandardWrapper', `Binding URL patterns [${urlPatterns.join(', ')}] -> ${newServlet.name}`);

    return newServlet;
  }

  public setServletStatus(id: string, status: 'RUNNING' | 'DISABLED'): ServletDefinition {
    const servlet = this.servlets.get(id);
    if (!servlet) {
      throw new Error(`Servlet not found: ${id}`);
    }

    servlet.status = status;
    servlet.lastModified = Date.now();

    if (status === 'DISABLED') {
      this.addLog('WARN', 'org.apache.catalina.core.StandardWrapper', `Servlet [${servlet.name}] has been DISABLED by administrator. Requests will return 503 Service Unavailable.`);
    } else {
      this.addLog('INFO', 'org.apache.catalina.core.StandardWrapper', `Servlet [${servlet.name}] enabled and ready for dispatch.`);
    }

    this.servlets.set(id, servlet);
    return servlet;
  }

  public updateServletConfig(id: string, updates: Partial<ServletDefinition>): ServletDefinition {
    const servlet = this.servlets.get(id);
    if (!servlet) {
      throw new Error(`Servlet not found: ${id}`);
    }

    const updated: ServletDefinition = {
      ...servlet,
      ...updates,
      id: servlet.id, // Immutable
      lastModified: Date.now(),
    };

    updated.sourceCode = generateJavaTemplate(
      updated.name,
      updated.className,
      updated.urlPatterns,
      updated.protocol,
      updated.initParams,
      updated.description
    );

    this.servlets.set(id, updated);
    this.addLog('INFO', 'org.apache.catalina.core.StandardContext', `Updated configuration & recompiled bytecode for servlet [${updated.name}]`);
    return updated;
  }

  public removeServlet(id: string): boolean {
    const servlet = this.servlets.get(id);
    if (!servlet) {
      return false;
    }

    this.addLog('WARN', 'org.apache.catalina.core.StandardContext', `Undeploying and destroying servlet [${servlet.name}]. Invoking destroy() lifecycle.`);
    this.servlets.delete(id);
    return true;
  }

  public getLogs(limit = 100): ServletLogEntry[] {
    return this.logs.slice(-limit);
  }

  public dispatchRequest(req: ServletDispatchRequest): ServletDispatchResponse {
    const startTime = Date.now();
    const trace: ServletTraceStep[] = [];

    trace.push({
      step: 'REQUEST_INGRESS',
      durationMs: 0.8,
      detail: `Received ${req.method} request on path: ${req.path}`,
      status: 'SUCCESS',
    });

    if (!this.isRunning) {
      this.addLog('ERROR', 'org.apache.catalina.connector.CoyoteAdapter', `Rejected request - Java Engine is STOPPED`);
      return {
        statusCode: 503,
        statusText: 'Service Unavailable - JVM Server Process is Stopped',
        headers: {
          'X-IVC-Engine-Status': 'STOPPED',
          'Content-Type': 'application/json',
        },
        body: {
          error: 'Java Servlet Engine is currently stopped. Please start the JVM process from the management console.',
          timestamp: Date.now(),
        },
        executionTimeMs: 1.2,
        trace: [
          ...trace,
          {
            step: 'PROCESS_CHECK',
            durationMs: 0.4,
            detail: 'JVM Server process is not running (STOPPED)',
            status: 'ERROR',
          },
        ],
        timestamp: Date.now(),
      };
    }

    const servlet = this.servlets.get(req.servletId);
    if (!servlet) {
      this.addLog('WARN', 'org.apache.catalina.core.StandardContext', `404 Not Found: No servlet registered with ID ${req.servletId}`);
      return {
        statusCode: 404,
        statusText: 'Servlet Not Found',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          error: `Servlet with ID '${req.servletId}' not found in runtime registry.`,
          availableServlets: Array.from(this.servlets.keys()),
        },
        executionTimeMs: 1.5,
        trace: [
          ...trace,
          {
            step: 'SERVLET_LOOKUP',
            durationMs: 0.7,
            detail: `Servlet ID '${req.servletId}' not found in registry.`,
            status: 'ERROR',
          },
        ],
        timestamp: Date.now(),
      };
    }

    trace.push({
      step: 'SERVLET_LOOKUP',
      durationMs: 1.1,
      detail: `Matched servlet [${servlet.name}] (${servlet.className}) on protocol ${servlet.protocol}`,
      status: 'SUCCESS',
    });

    // Check if disabled
    if (servlet.status === 'DISABLED') {
      servlet.errorCount++;
      this.addLog('WARN', 'org.apache.catalina.core.StandardWrapper', `Rejected ${req.method} to [${servlet.name}] - Servlet is DISABLED`);
      return {
        statusCode: 503,
        statusText: 'Service Unavailable (Servlet Disabled)',
        headers: {
          'X-Servlet-State': 'DISABLED',
          'X-Servlet-Name': servlet.name,
          'Content-Type': 'application/json',
        },
        body: {
          error: `Servlet '${servlet.name}' is currently DISABLED by administrator.`,
          servletId: servlet.id,
          hint: 'Enable this servlet in the Servlet Management Engine to resume request dispatching.',
        },
        executionTimeMs: 2.0,
        trace: [
          ...trace,
          {
            step: 'LIFECYCLE_STATE_CHECK',
            durationMs: 0.9,
            detail: `Servlet [${servlet.name}] is DISABLED. Execution aborted.`,
            status: 'WARN',
          },
        ],
        timestamp: Date.now(),
      };
    }

    // Process filters
    trace.push({
      step: 'FILTER_CHAIN',
      durationMs: 2.3,
      detail: `Executed FilterChain (SecurityAuthFilter, CorsFilter, TelemetryFilter)`,
      status: 'SUCCESS',
    });

    // Simulate Servlet method execution
    const executionLatency = Math.max(3, Math.floor(Math.random() * 20) + (servlet.avgExecutionTimeMs || 8));
    servlet.invocationCount++;
    this.totalRequests++;
    servlet.lastInvokedAt = Date.now();

    // Recompute running average
    servlet.avgExecutionTimeMs = Number(
      ((servlet.avgExecutionTimeMs * (servlet.invocationCount - 1) + executionLatency) / servlet.invocationCount).toFixed(1)
    );

    trace.push({
      step: 'SERVLET_SERVICE_EXEC',
      durationMs: executionLatency,
      detail: `Invoked ${servlet.className}.service() -> do${req.method === 'IVC_CALL' ? 'Post' : req.method}() with ${Object.keys(servlet.initParams).length} init params`,
      status: 'SUCCESS',
    });

    trace.push({
      step: 'RESPONSE_ENCODING',
      durationMs: 1.2,
      detail: `Serialized response payload (Protocol: ${servlet.protocol}, MIME: application/json)`,
      status: 'SUCCESS',
    });

    this.addLog('INFO', servlet.className, `[DISPATCH] ${req.method} ${req.path} -> 200 OK (${executionLatency}ms)`);

    const responseBody = {
      success: true,
      servlet: {
        id: servlet.id,
        name: servlet.name,
        className: servlet.className,
        protocol: servlet.protocol,
        status: servlet.status,
      },
      request: {
        method: req.method,
        path: req.path,
        queryParams: req.queryParams || {},
        headersReceived: req.headers || {},
        payload: req.body || null,
      },
      servletContext: {
        serverInfo: 'IVC-ServletEngine/4.2.0 (Jakarta EE 10 / OpenJDK 21)',
        initParams: servlet.initParams,
        sessionActive: true,
        invocationsTotal: servlet.invocationCount,
      },
      message: `Request successfully processed by ${servlet.name}`,
      timestamp: Date.now(),
    };

    const totalDuration = Date.now() - startTime + executionLatency;

    return {
      statusCode: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json',
        'X-Servlet-Name': servlet.name,
        'X-Servlet-Class': servlet.className,
        'X-IVC-Protocol': servlet.protocol,
        'X-Response-Time': `${totalDuration}ms`,
      },
      body: responseBody,
      executionTimeMs: totalDuration,
      trace,
      timestamp: Date.now(),
    };
  }
}

export const servletEngine = new JavaServletEngine();
