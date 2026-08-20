export type IVCProtocol = 'IVC-gRPC' | 'IVC-HTTPS' | 'IVC-RMI' | 'IVC-REST';

export interface AddressableObject {
  id: string;
  name: string;
  servletName: string;
  servletClass: string;
  endpointPath: string;
  protocol: IVCProtocol;
  status: 'ACTIVE' | 'DEGRADED' | 'INACTIVE';
  description: string;
  attributes: Record<string, string | number>;
}

export interface IVCServiceCall {
  callId: string;
  targetObjectId: string;
  action: string;
  callerService: string;
  payload: Record<string, any>;
  timestamp: number;
  durationMs: number;
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  responsePayload?: Record<string, any>;
  errorMessage?: string;
}

export interface DeltaEventStats {
  periodLabel: string;
  timestamp: number;
  // Delta differences relative to previous window
  deltaCount: number;         // ∆ Count of events
  deltaLatencyMs: number;     // ∆ Average latency in ms
  deltaErrorRate: number;     // ∆ Error rate percentage (-100 to +100)
  deltaPayloadBytes: number;  // ∆ Total payload volume in bytes
  deltaThroughputRps: number; // ∆ Requests per second

  // Absolute metrics for reference
  currentCount: number;
  avgLatencyMs: number;
  errorRatePercent: number;
  totalPayloadBytes: number;
  throughputRps: number;
}

export interface FlowStep {
  stepId: string;
  sequence: number;
  nodeName: string;
  nodeType: 'IVC_GATEWAY' | 'SERVLET_CONTAINER' | 'ADDRESSABLE_OBJECT' | 'EXTERNAL_SERVICE' | 'DATABASE';
  action: string;
  durationMs: number;
  status: 'SUCCESS' | 'ERROR' | 'SKIPPED';
  details: string;
  payloadSnippet?: string;
  timestamp: number;
}

export interface FlowInfo {
  traceId: string;
  callId: string;
  targetObjectId: string;
  targetObjectName: string;
  servletName: string;
  startTime: number;
  totalDurationMs: number;
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  steps: FlowStep[];
}

export interface AddressableObjectStats {
  objectId: string;
  objectName: string;
  servletName: string;
  totalCalls: number;
  activeFlowsCount: number;
  latestDeltaStats: DeltaEventStats;
  historicalDeltas: DeltaEventStats[];
  recentFlows: FlowInfo[];
}
