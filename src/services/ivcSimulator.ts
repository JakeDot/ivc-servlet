import {
  AddressableObject,
  DeltaEventStats,
  FlowInfo,
  FlowStep,
  IVCServiceCall,
} from '../types/ivc';

export const INITIAL_ADDRESSABLE_OBJECTS: AddressableObject[] = [
  {
    id: 'obj-auth-dispatcher',
    name: 'AuthSessionDispatcher',
    servletName: 'AuthenticationGatewayServlet',
    servletClass: 'com.enterprise.ivc.servlets.AuthGatewayServlet',
    endpointPath: '/ivc/v2/auth/session',
    protocol: 'IVC-gRPC',
    status: 'ACTIVE',
    description: 'Handles token verification and session dispatching across IVC service bounds.',
    attributes: { maxConnections: 500, timeoutMs: 1200, tier: 'Core Security' },
  },
  {
    id: 'obj-payment-processor',
    name: 'PaymentTxProcessor',
    servletName: 'PaymentTransactionServlet',
    servletClass: 'com.enterprise.ivc.servlets.PaymentTransactionServlet',
    endpointPath: '/ivc/v1/payments/process',
    protocol: 'IVC-HTTPS',
    status: 'ACTIVE',
    description: 'Executes financial settlement and external payment gateway calls via IVC bridge.',
    attributes: { retryLimit: 3, isolationLevel: 'SERIALIZABLE', currencySupport: 'USD,EUR,GBP' },
  },
  {
    id: 'obj-user-profile-cache',
    name: 'UserProfileEntityCache',
    servletName: 'UserProfileDataServlet',
    servletClass: 'com.enterprise.ivc.servlets.UserProfileDataServlet',
    endpointPath: '/ivc/v3/user/profile',
    protocol: 'IVC-REST',
    status: 'ACTIVE',
    description: 'Addressable user profile state store with in-memory caching servlet endpoint.',
    attributes: { cacheSizeMb: 2048, ttlSeconds: 300, strategy: 'LRU' },
  },
  {
    id: 'obj-inventory-manager',
    name: 'InventoryStockAggregator',
    servletName: 'StockManagementServlet',
    servletClass: 'com.enterprise.ivc.servlets.StockManagementServlet',
    endpointPath: '/ivc/v2/inventory/stock',
    protocol: 'IVC-RMI',
    status: 'DEGRADED',
    description: 'Coordinates multi-warehouse stock reservation calls via remote IVC invocation.',
    attributes: { warehouseNodes: 12, syncIntervalMs: 500, errorThresholdPercent: 5 },
  },
  {
    id: 'obj-order-fulfillment',
    name: 'OrderFulfillmentCoordinator',
    servletName: 'FulfillmentEngineServlet',
    servletClass: 'com.enterprise.ivc.servlets.FulfillmentEngineServlet',
    endpointPath: '/ivc/v1/fulfillment/order',
    protocol: 'IVC-gRPC',
    status: 'ACTIVE',
    description: 'Orchestrates logistics and shipment creation via addressable IVC servlet dispatchers.',
    attributes: { maxQueueDepth: 1000, priorityLevels: 4 },
  },
];

const CALLER_SERVICES = [
  'IVC-ClientGateway',
  'BillingMicroservice',
  'MobileAppBackend',
  'ExternalPartnerAPI',
  'AnalyticsCollectorService',
];

export function generateRandomIVCCall(targetObject: AddressableObject): IVCServiceCall {
  const callId = `call-${Math.random().toString(36).substr(2, 9)}`;
  const callerService = CALLER_SERVICES[Math.floor(Math.random() * CALLER_SERVICES.length)];
  const actions = ['FETCH_ENTITY', 'UPDATE_STATE', 'DISPATCH_EVENT', 'QUERY_STATUS', 'EXECUTE_TX'];
  const action = actions[Math.floor(Math.random() * actions.length)];

  const isError = Math.random() < (targetObject.status === 'DEGRADED' ? 0.25 : 0.05);
  const baseLatency = targetObject.status === 'DEGRADED' ? 320 : 65;
  const durationMs = Math.round(baseLatency + Math.random() * 150);

  return {
    callId,
    targetObjectId: targetObject.id,
    action,
    callerService,
    payload: {
      action,
      caller: callerService,
      protocol: targetObject.protocol,
      reqId: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    },
    timestamp: Date.now(),
    durationMs,
    status: isError ? 'ERROR' : 'SUCCESS',
    errorMessage: isError ? `IVC_CALL_EXCEPTION: Target servlet object '${targetObject.name}' returned non-zero response code (500).` : undefined,
    responsePayload: isError
      ? { errorCode: 'ERR_IVC_SERVLET_FAILURE', message: 'Internal Servlet Execution Error' }
      : { code: 200, status: 'OK', recordsProcessed: Math.floor(Math.random() * 50) + 1 },
  };
}

export function buildFlowInfoForCall(
  call: IVCServiceCall,
  targetObject: AddressableObject
): FlowInfo {
  const traceId = `trace-${call.callId}`;
  const now = call.timestamp;

  const step1Duration = Math.round(call.durationMs * 0.15);
  const step2Duration = Math.round(call.durationMs * 0.25);
  const step3Duration = Math.round(call.durationMs * 0.40);
  const step4Duration = Math.round(call.durationMs * 0.20);

  const steps: FlowStep[] = [
    {
      stepId: `step-1-${call.callId}`,
      sequence: 1,
      nodeName: 'IVC Service Ingress Gateway',
      nodeType: 'IVC_GATEWAY',
      action: 'Receive External IVC Call',
      durationMs: step1Duration,
      status: 'SUCCESS',
      details: `Received ${targetObject.protocol} call from ${call.callerService} targeted at servlet path '${targetObject.endpointPath}'`,
      payloadSnippet: JSON.stringify(call.payload),
      timestamp: now,
    },
    {
      stepId: `step-2-${call.callId}`,
      sequence: 2,
      nodeName: targetObject.servletName,
      nodeType: 'SERVLET_CONTAINER',
      action: 'Servlet Container Dispatch',
      durationMs: step2Duration,
      status: 'SUCCESS',
      details: `Servlet container invoking '${targetObject.servletClass}.service()'`,
      timestamp: now + step1Duration,
    },
    {
      stepId: `step-3-${call.callId}`,
      sequence: 3,
      nodeName: targetObject.name,
      nodeType: 'ADDRESSABLE_OBJECT',
      action: `Execute Object Handler [${call.action}]`,
      durationMs: step3Duration,
      status: call.status === 'ERROR' ? 'ERROR' : 'SUCCESS',
      details: call.status === 'ERROR'
        ? `Error executing addressable servlet object logic: ${call.errorMessage}`
        : `Successfully executed object logic for ${targetObject.name}`,
      payloadSnippet: call.status === 'ERROR' ? JSON.stringify(call.responsePayload) : undefined,
      timestamp: now + step1Duration + step2Duration,
    },
    {
      stepId: `step-4-${call.callId}`,
      sequence: 4,
      nodeName: 'IVC Service Egress',
      nodeType: 'IVC_GATEWAY',
      action: 'Return Response to Caller',
      durationMs: step4Duration,
      status: call.status === 'ERROR' ? 'ERROR' : 'SUCCESS',
      details: call.status === 'ERROR'
        ? 'Propagated servlet error response to caller service'
        : 'Constructed IVC response payload and returned to client caller',
      payloadSnippet: JSON.stringify(call.responsePayload),
      timestamp: now + step1Duration + step2Duration + step3Duration,
    },
  ];

  return {
    traceId,
    callId: call.callId,
    targetObjectId: targetObject.id,
    targetObjectName: targetObject.name,
    servletName: targetObject.servletName,
    startTime: call.timestamp,
    totalDurationMs: call.durationMs,
    status: call.status,
    steps,
  };
}

export function computeDeltaStats(
  currentCalls: IVCServiceCall[],
  previousCalls: IVCServiceCall[],
  periodLabel: string
): DeltaEventStats {
  const currentCount = currentCalls.length;
  const previousCount = previousCalls.length;
  const deltaCount = currentCount - previousCount;

  const currentTotalLatency = currentCalls.reduce((sum, c) => sum + c.durationMs, 0);
  const avgLatencyMs = currentCount > 0 ? currentTotalLatency / currentCount : 0;

  const previousTotalLatency = previousCalls.reduce((sum, c) => sum + c.durationMs, 0);
  const previousAvgLatency = previousCount > 0 ? previousTotalLatency / previousCount : 0;
  const deltaLatencyMs = currentCount > 0 || previousCount > 0 ? avgLatencyMs - previousAvgLatency : 0;

  const currentErrors = currentCalls.filter((c) => c.status === 'ERROR').length;
  const errorRatePercent = currentCount > 0 ? (currentErrors / currentCount) * 100 : 0;

  const previousErrors = previousCalls.filter((c) => c.status === 'ERROR').length;
  const previousErrorRate = previousCount > 0 ? (previousErrors / previousCount) * 100 : 0;
  const deltaErrorRate = currentCount > 0 || previousCount > 0 ? errorRatePercent - previousErrorRate : 0;

  const getPayloadSize = (c: IVCServiceCall) => JSON.stringify(c.payload).length + JSON.stringify(c.responsePayload || {}).length;
  const totalPayloadBytes = currentCalls.reduce((sum, c) => sum + getPayloadSize(c), 0);
  const previousPayloadBytes = previousCalls.reduce((sum, c) => sum + getPayloadSize(c), 0);
  const deltaPayloadBytes = totalPayloadBytes - previousPayloadBytes;

  const windowSeconds = 10;
  const throughputRps = currentCount / windowSeconds;
  const previousThroughput = previousCount / windowSeconds;
  const deltaThroughputRps = throughputRps - previousThroughput;

  return {
    periodLabel,
    timestamp: Date.now(),
    deltaCount,
    deltaLatencyMs,
    deltaErrorRate,
    deltaPayloadBytes,
    deltaThroughputRps,
    currentCount,
    avgLatencyMs: Math.round(avgLatencyMs * 10) / 10,
    errorRatePercent: Math.round(errorRatePercent * 10) / 10,
    totalPayloadBytes,
    throughputRps: Math.round(throughputRps * 10) / 10,
  };
}
