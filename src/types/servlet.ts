import { IVCProtocol } from './ivc';

export type ServletStatus = 'RUNNING' | 'DISABLED' | 'INITIALIZING' | 'DRAINING' | 'ERROR';

export type ServletCategory =
  | 'social_connector'
  | 'telemetry'
  | 'gateway'
  | 'media'
  | 'security'
  | 'custom';

export interface ServletDefinition {
  id: string;
  name: string;
  className: string;
  urlPatterns: string[];
  protocol: IVCProtocol;
  status: ServletStatus;
  loadOnStartup: number;
  asyncSupported: boolean;
  initParams: Record<string, string>;
  description: string;
  category: ServletCategory;
  createdAt: number;
  lastModified: number;
  invocationCount: number;
  errorCount: number;
  avgExecutionTimeMs: number;
  sourceCode?: string;
  lastInvokedAt?: number;
  associatedObjectId?: string;
}

export interface JavaServerProcessStatus {
  status: 'RUNNING' | 'STOPPED' | 'STARTING' | 'RESTARTING' | 'ERROR';
  pid: number;
  mode: 'NATIVE_JVM' | 'EMBEDDED_SERVLET_ENGINE';
  port: number;
  uptimeSeconds: number;
  startTime: number;
  jvmVersion: string;
  heapMemory: {
    usedMb: number;
    maxMb: number;
    allocatedMb: number;
    freeMb: number;
    usagePercent: number;
  };
  threads: {
    activeCount: number;
    poolSize: number;
    queueSize: number;
    peakCount: number;
  };
  gcStats: {
    collectionCount: number;
    collectionTimeMs: number;
  };
  activeServletsCount: number;
  totalRequestsHandled: number;
  lastHeartbeat: number;
}

export interface ServletLogEntry {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  logger: string;
  message: string;
  servletId?: string;
}

export interface ServletDispatchRequest {
  servletId: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'IVC_CALL';
  path: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: any;
}

export interface ServletTraceStep {
  step: string;
  durationMs: number;
  detail: string;
  status: 'SUCCESS' | 'WARN' | 'ERROR';
}

export interface ServletDispatchResponse {
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  executionTimeMs: number;
  trace: ServletTraceStep[];
  timestamp: number;
}
