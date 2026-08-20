import {
  AddressableObject,
  DeltaEventStats,
  FlowInfo,
  FlowStep,
  IVCServiceCall,
  ChatMessage,
} from '../types/ivc';

export const INITIAL_ADDRESSABLE_OBJECTS: AddressableObject[] = [
  {
    id: 'obj-whatsapp-connector-01',
    name: 'WhatsApp Bridge (+15550199283)',
    kind: 'social_connector',
    connectorAddress: '+15550199283@whatsapp.net',
    servletName: 'WhatsAppConnectorServlet',
    servletClass: 'com.enterprise.ivc.servlets.WhatsAppBridgeServlet',
    endpointPath: '/ivc/v1/social/whatsapp',
    protocol: 'IVC-REST',
    status: 'ACTIVE',
    description: 'WhatsApp social media connector for outbound media messages & voice notes.',
    attributes: { network: 'WhatsApp', phone: '+15550199283', enc: 'E2EE' },
    modes: [
      { id: 'mode-1', name: '§created', metadata: { by: 'admin', timestamp: Date.now() - 10000000 } },
      { id: 'mode-2', name: '∆owner', subparam: 'sysadmin-group', metadata: { level: 'tier-1' } }
    ],
    deltaGallery: {
      id: 'gal-wa-01',
      ownerId: 'obj-whatsapp-connector-01',
      ownerName: '+15550199283@whatsapp.net',
      ownerKind: 'social_connector',
      title: '∆gallery - +15550199283@whatsapp.net',
      description: 'Media, audio voice memos, and video attachments synced from WhatsApp connector',
      updatedAt: Date.now(),
      items: [
        {
          id: 'media-wa-1',
          type: 'audio',
          title: 'WhatsApp Incoming Voice Memo (37s)',
          url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          durationSeconds: 37,
          sizeBytes: 850000,
          mimeType: 'audio/mp3',
          description: 'Voice message received via +15550199283@whatsapp.net',
          createdAt: Date.now() - 1200000,
        },
        {
          id: 'media-wa-2',
          type: 'video',
          title: 'WhatsApp Video Attachment Capture',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
          durationSeconds: 15,
          sizeBytes: 3200000,
          mimeType: 'video/mp4',
          description: 'Video clip forwarded from WhatsApp user group.',
          createdAt: Date.now() - 3600000,
        },
      ],
    },
  },
  {
    id: 'obj-telegram-connector-01',
    name: 'Telegram Bot Connector (@IVC_Alerts_Bot)',
    kind: 'social_connector',
    connectorAddress: '@IVC_Alerts_Bot',
    servletName: 'TelegramConnectorServlet',
    servletClass: 'com.enterprise.ivc.servlets.TelegramBotServlet',
    endpointPath: '/ivc/v1/social/telegram',
    protocol: 'IVC-HTTPS',
    status: 'ACTIVE',
    description: 'Telegram bot connector for dispatching real-time system alarm recordings.',
    attributes: { network: 'Telegram', botHandle: '@IVC_Alerts_Bot', webhookStatus: 'OK' },
    deltaGallery: {
      id: 'gal-tg-01',
      ownerId: 'obj-telegram-connector-01',
      ownerName: '@IVC_Alerts_Bot',
      ownerKind: 'social_connector',
      title: '∆gallery - @IVC_Alerts_Bot',
      description: 'Media dispatch history for Telegram channel connector',
      updatedAt: Date.now(),
      items: [
        {
          id: 'media-tg-1',
          type: 'audio',
          title: 'Telegram Alert Chime Note',
          url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
          durationSeconds: 210,
          sizeBytes: 2400000,
          mimeType: 'audio/mp3',
          description: 'Telemetry notification tone.',
          createdAt: Date.now() - 5400000,
        },
      ],
    },
  },
  {
    id: 'obj-general-channel',
    name: '#general-opers',
    kind: 'channel',
    servletName: 'ChannelDispatcherServlet',
    servletClass: 'com.enterprise.ivc.servlets.ChannelDispatcherServlet',
    endpointPath: '/ivc/v1/channels/general-opers',
    protocol: 'IVC-gRPC',
    status: 'ACTIVE',
    description: 'Main system ops channel for multi-agent IVC status broadcasts.',
    attributes: { membersCount: 128, retentionDays: 90, tier: 'Broadcast Channel' },
    deltaGallery: {
      id: 'gal-general-channel',
      ownerId: 'obj-general-channel',
      ownerName: '#general-opers',
      ownerKind: 'channel',
      title: '∆gallery - #general-opers',
      description: 'Media assets and audio/video records shared in general operations channel',
      updatedAt: Date.now(),
      items: [
        {
          id: 'media-ch-1',
          type: 'audio',
          title: 'System Ingress Diagnostic Chime',
          url: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg',
          durationSeconds: 124,
          sizeBytes: 2450000,
          mimeType: 'audio/ogg',
          description: 'Telemetry raw ambient capture during high ingress strain.',
          createdAt: Date.now() - 3600000,
        },
        {
          id: 'media-ch-2',
          type: 'video',
          title: 'Cluster Topology Visualizer Stream',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
          durationSeconds: 596,
          sizeBytes: 15800000,
          mimeType: 'video/mp4',
          description: 'Live rendering of IVC servlet nodes auto-scaling.',
          createdAt: Date.now() - 7200000,
        },
        {
          id: 'media-ch-3',
          type: 'image',
          title: 'Latency Spike Analytics Graph',
          url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
          sizeBytes: 420000,
          mimeType: 'image/jpeg',
          description: 'Delta evaluation window peak latency snapshot.',
          createdAt: Date.now() - 10800000,
        },
      ],
    },
  },
  {
    id: 'obj-user-sysadmin',
    name: 'Operator_Nexus (SysAdmin)',
    kind: 'user',
    servletName: 'UserDataServlet',
    servletClass: 'com.enterprise.ivc.servlets.UserDataServlet',
    endpointPath: '/ivc/v2/users/operator-nexus',
    protocol: 'IVC-REST',
    status: 'ACTIVE',
    description: 'Lead Site Reliability Engineer profile & addressable user endpoint.',
    attributes: { role: 'Cluster Admin', level: 5, statusMessage: 'Monitoring IVC Deltas' },
    modes: [
      { id: 'mode-3', name: '§modified', subparam: 'permissions', metadata: { by: 'root', changes: ['granted_sudo'] } }
    ],
    deltaGallery: {
      id: 'gal-user-sysadmin',
      ownerId: 'obj-user-sysadmin',
      ownerName: 'Operator_Nexus (SysAdmin)',
      ownerKind: 'user',
      title: '∆gallery - Operator_Nexus',
      description: 'Personal attachments, voice memos, and incident recordings',
      updatedAt: Date.now(),
      items: [
        {
          id: 'media-usr-1',
          type: 'audio',
          title: 'Incident Post-Mortem Voice Log #42',
          url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          durationSeconds: 372,
          sizeBytes: 4500000,
          mimeType: 'audio/mp3',
          description: 'SysAdmin audio review regarding database pool exhaustion.',
          createdAt: Date.now() - 1800000,
        },
        {
          id: 'media-usr-2',
          type: 'video',
          title: 'Deployment Walkthrough Demo',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
          durationSeconds: 653,
          sizeBytes: 24000000,
          mimeType: 'video/mp4',
          description: 'Video recording showing new zero-downtime servlet deployment.',
          createdAt: Date.now() - 5400000,
        },
      ],
    },
  },
  {
    id: 'obj-user-service-bridge-1',
    name: 'Email Service Bridge (+$sS)',
    kind: 'user',
    connectorAddress: 'email_bridge+$sS@ivc.internal',
    servletName: 'UserDataServlet',
    servletClass: 'com.enterprise.ivc.servlets.UserDataServlet',
    endpointPath: '/ivc/v2/users/email-service-bridge',
    protocol: 'IVC-REST',
    status: 'ACTIVE',
    description: 'Internal service bridge user for email federation.',
    attributes: { role: 'Service Bridge', level: 1 },
    deltaGallery: {
      id: 'gal-user-service-bridge-1',
      ownerId: 'obj-user-service-bridge-1',
      ownerName: 'Email Service Bridge (+$sS)',
      ownerKind: 'user',
      title: '∆gallery - Email_Service_Bridge',
      description: 'Service logs and recordings',
      updatedAt: Date.now(),
      items: [],
    },
  },
  {
    id: 'obj-user-service-bridge-2',
    name: 'DB Sync Service Bridge (+$sS)',
    kind: 'user',
    connectorAddress: 'db_sync_bridge+$sS@ivc.internal',
    servletName: 'UserDataServlet',
    servletClass: 'com.enterprise.ivc.servlets.UserDataServlet',
    endpointPath: '/ivc/v2/users/db-sync-service-bridge',
    protocol: 'IVC-REST',
    status: 'ACTIVE',
    description: 'Internal service bridge user for database synchronization operations.',
    attributes: { role: 'Service Bridge', level: 1 },
    deltaGallery: {
      id: 'gal-user-service-bridge-2',
      ownerId: 'obj-user-service-bridge-2',
      ownerName: 'DB Sync Service Bridge (+$sS)',
      ownerKind: 'user',
      title: '∆gallery - DB_Sync_Service_Bridge',
      description: 'Service logs and recordings',
      updatedAt: Date.now(),
      items: [],
    },
  },
  {
    id: 'obj-prod-server-01',
    name: 'Server_US_East_Cluster_01',
    kind: 'server',
    servletName: 'ServerNodeHealthServlet',
    servletClass: 'com.enterprise.ivc.servlets.NodeHealthServlet',
    endpointPath: '/ivc/v1/servers/us-east-01',
    protocol: 'IVC-HTTPS',
    status: 'ACTIVE',
    description: 'Primary compute cluster host running IVC servlet containers.',
    attributes: { cpuCores: 64, ramGb: 256, region: 'us-east-1' },
    deltaGallery: {
      id: 'gal-server-01',
      ownerId: 'obj-prod-server-01',
      ownerName: 'Server_US_East_Cluster_01',
      ownerKind: 'server',
      title: '∆gallery - US East Server 01',
      description: 'Hardware diagnostics, thermal telemetry audio, and video logs',
      updatedAt: Date.now(),
      items: [
        {
          id: 'media-srv-1',
          type: 'video',
          title: 'Datacenter Server Rack LED Pulse Log',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
          durationSeconds: 15,
          sizeBytes: 3200000,
          mimeType: 'video/mp4',
          description: 'Automated optical check on drive bay swap.',
          createdAt: Date.now() - 14400000,
        },
        {
          id: 'media-srv-2',
          type: 'audio',
          title: 'Fan Speed Acoustic Resonance Scan',
          url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
          durationSeconds: 420,
          sizeBytes: 5100000,
          mimeType: 'audio/mp3',
          description: 'Acoustic sensing for cooling fan bearing wear detection.',
          createdAt: Date.now() - 28800000,
        },
      ],
    },
  },
  {
    id: 'obj-auth-dispatcher',
    name: 'AuthSessionDispatcher',
    kind: 'servlet',
    servletName: 'AuthenticationGatewayServlet',
    servletClass: 'com.enterprise.ivc.servlets.AuthGatewayServlet',
    endpointPath: '/ivc/v2/auth/session',
    protocol: 'IVC-gRPC',
    status: 'ACTIVE',
    description: 'Handles token verification and session dispatching across IVC service bounds.',
    attributes: { maxConnections: 500, timeoutMs: 1200, tier: 'Core Security' },
    deltaGallery: {
      id: 'gal-auth-dispatcher',
      ownerId: 'obj-auth-dispatcher',
      ownerName: 'AuthSessionDispatcher',
      ownerKind: 'servlet',
      title: '∆gallery - AuthSessionDispatcher',
      description: 'Security session trace records and cryptographic verification audio/video samples',
      updatedAt: Date.now(),
      items: [
        {
          id: 'media-sl-1',
          type: 'audio',
          title: 'Auth Handshake Audio Encoding Beacon',
          url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
          durationSeconds: 340,
          sizeBytes: 4100000,
          mimeType: 'audio/mp3',
          description: 'Frequency shift keying audit track for IVC-gRPC security tunnel.',
          createdAt: Date.now() - 360000,
        },
      ],
    },
  },
  {
    id: 'obj-ivc-micro-nodejs',
    name: 'ivc+micro Node.js Service',
    kind: 'servlet',
    servletName: 'MicroServiceNodeJS',
    servletClass: 'nodejs.pipe.IvcMicroServlet',
    endpointPath: '/ivc/v1/micro/node',
    protocol: 'IVC-REST',
    status: 'ACTIVE',
    description: 'ivc+micro service implemented in Node.js using pipe/IPC compatible streams.',
    attributes: { runtime: 'Node.js', transport: 'Pipe/IPC', framework: 'Express' },
  },
  {
    id: 'obj-ssn-php',
    name: 'sSN Secure Service Node (PHP)',
    kind: 'servlet',
    servletName: 'SecureServiceNodePHP',
    servletClass: 'App\\Servlets\\SSNServlet',
    endpointPath: '/ivc/v1/ssn/php',
    protocol: 'IVC-HTTPS',
    status: 'ACTIVE',
    description: 'sSN service modeled as a PHP servlet implementation over TCP.',
    attributes: { runtime: 'PHP 8.2', fpm: 'active', transport: 'TCP' },
  },
  {
    id: 'obj-model-java',
    name: 'Java Model Service',
    kind: 'servlet',
    servletName: 'JavaModelServlet',
    servletClass: 'com.enterprise.ivc.servlets.ModelServiceServlet',
    endpointPath: '/ivc/v1/model/java',
    protocol: 'IVC-RMI',
    status: 'ACTIVE',
    description: 'Model service implemented as a Java servlet, compatible with TCP/UDP and RMI.',
    attributes: { runtime: 'Java 21', jvm: 'HotSpot', transport: 'TCP/UDP/RMI' },
  },
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    senderId: 'usr-agent-alpha',
    senderName: 'Agent_Alpha',
    channelId: 'obj-general-channel',
    content: 'Initiating IVC session check. Here is the latest diagnostic audio log from the gateway.',
    timestamp: Date.now() - 600000,
    attachments: [
      {
        id: 'att-audio-1',
        type: 'audio',
        title: 'Ingress Diagnostic Audio Clip',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        durationSeconds: 372,
        sizeBytes: 4500000,
        mimeType: 'audio/mp3',
        description: 'Recorded audio log during gRPC payload dispatch.',
        createdAt: Date.now() - 600000,
      },
    ],
  },
  {
    id: 'msg-2',
    senderId: 'usr-kernel-agent',
    senderName: 'Kernel_Agent',
    channelId: 'obj-general-channel',
    content: 'Reviewing cluster video capture for the recent servlet auto-scaling event.',
    timestamp: Date.now() - 300000,
    attachments: [
      {
        id: 'att-video-1',
        type: 'video',
        title: 'Servlet Cluster Auto-scale Stream',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
        durationSeconds: 596,
        sizeBytes: 15800000,
        mimeType: 'video/mp4',
        description: 'Captured video trace of servlet container spin-up.',
        createdAt: Date.now() - 300000,
      },
    ],
  },
  {
    id: 'msg-3',
    senderId: 'usr-sysadmin',
    senderName: 'Operator_Nexus',
    channelId: 'obj-general-channel',
    content: 'WhatsApp connector +15550199283@whatsapp.net is online and streaming audio voice notes to ∆gallery.',
    timestamp: Date.now() - 120000,
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
