import {
  ConnectionStringItem,
  ParsedConnectionString,
  ServiceCategory,
} from '../types/connect';

/**
 * Parses complex connection strings such as:
 * - https://+15550199283@whatsapp.net
 * - user@email.host/service.social
 * - $me or $me/audio or $me/devices
 * - ivc://IVC.cx+Sn/$opers
 * - grpc://mesh.ivc.internal:9090/v1/stream
 * - wss://gateway.ivc.io/ws/v2?token=auth
 */
export function parseConnectionString(raw: string): ParsedConnectionString {
  const trimmed = raw.trim();

  if (!trimmed) {
    return {
      raw: '',
      isSelfVariable: false,
      isValid: false,
      explanation: 'Empty connection string',
    };
  }

  // Handle $me / self variable strings
  if (trimmed.startsWith('$me')) {
    const parts = trimmed.split('/');
    const path = parts.length > 1 ? '/' + parts.slice(1).join('/') : undefined;
    return {
      raw: trimmed,
      scheme: '$me',
      user: '$me',
      host: 'localhost',
      path,
      isSelfVariable: true,
      isValid: true,
      explanation: 'Self addressable entity ($me variable pointer)',
    };
  }

  // Handle email / social connection strings like user@email.host/service.social
  const emailSocialRegex = /^([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(\/.*)?$/;
  const emailMatch = trimmed.match(emailSocialRegex);
  if (emailMatch) {
    const user = emailMatch[1];
    const host = emailMatch[2];
    const path = emailMatch[3] || undefined;
    return {
      raw: trimmed,
      scheme: 'social-email',
      user,
      host,
      path,
      isSelfVariable: false,
      isValid: true,
      explanation: `Social Email Service endpoint for ${user} hosted at ${host}`,
    };
  }

  // Attempt URL parsing
  try {
    const url = new URL(trimmed);
    const query: Record<string, string> = {};
    url.searchParams.forEach((val, key) => {
      query[key] = val;
    });

    return {
      raw: trimmed,
      scheme: url.protocol.replace(':', ''),
      user: url.username ? decodeURIComponent(url.username) : undefined,
      host: url.hostname,
      port: url.port || undefined,
      path: url.pathname !== '/' ? url.pathname : undefined,
      query: Object.keys(query).length > 0 ? query : undefined,
      isSelfVariable: false,
      isValid: true,
      explanation: `Standard URI protocol scheme '${url.protocol.replace(':', '')}' targeting ${url.hostname}`,
    };
  } catch (_e) {
    // Custom scheme parsing fallback (e.g. ivc://IVC.cx+Sn/$opers)
    const customUriRegex = /^([a-zA-Z0-9+.-]+):\/\/(?:([^@]+)@)?([^/?:#]+)(?::(\d+))?([^?#]*)?(?:\?([^#]*))?$/;
    const match = trimmed.match(customUriRegex);

    if (match) {
      const scheme = match[1];
      const user = match[2] ? decodeURIComponent(match[2]) : undefined;
      const host = match[3];
      const port = match[4];
      const path = match[5];
      const queryStr = match[6];

      const query: Record<string, string> = {};
      if (queryStr) {
        queryStr.split('&').forEach((pair) => {
          const [k, v] = pair.split('=');
          if (k) query[decodeURIComponent(k)] = v ? decodeURIComponent(v) : '';
        });
      }

      return {
        raw: trimmed,
        scheme,
        user,
        host,
        port,
        path: path || undefined,
        query: Object.keys(query).length > 0 ? query : undefined,
        isSelfVariable: false,
        isValid: true,
        explanation: `Custom IVC URI protocol '${scheme}' bound to ${host}`,
      };
    }
  }

  return {
    raw: trimmed,
    isSelfVariable: false,
    isValid: true, // Allow generic input string
    explanation: 'Custom formatted connection string descriptor',
  };
}

export function detectCategory(raw: string): ServiceCategory {
  const trimmed = raw.trim();

  if (trimmed.includes('@whatsapp.net')) return 'whatsapp';
  if (trimmed.startsWith('$me')) return 'self';
  if (trimmed.startsWith('grpc://')) return 'grpc';
  if (trimmed.startsWith('wss://') || trimmed.startsWith('ws://')) return 'websocket';
  if (trimmed.startsWith('ivc://')) return 'ivc_protocol';
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed)) return 'social_email';

  return 'custom';
}

export const DEFAULT_CONNECTION_STRINGS: ConnectionStringItem[] = [
  {
    id: 'conn-default-1',
    rawString: 'https://+15550199283@whatsapp.net',
    label: 'WhatsApp Gateway Connector',
    category: 'whatsapp',
    status: 'connected',
    description: 'WhatsApp direct user node address for voice memos & media dispatch.',
    parsed: parseConnectionString('https://+15550199283@whatsapp.net'),
    latencyMs: 38,
    lastTested: Date.now() - 300000,
    createdAt: Date.now() - 86400000,
    isDefault: true,
  },
  {
    id: 'conn-default-2',
    rawString: 'operator@email.host/service.social',
    label: 'Enterprise Social Email Bridge',
    category: 'social_email',
    status: 'active',
    description: 'Federated social messaging endpoint for enterprise email relay.',
    parsed: parseConnectionString('operator@email.host/service.social'),
    latencyMs: 62,
    lastTested: Date.now() - 1200000,
    createdAt: Date.now() - 86400000,
    isDefault: true,
  },
  {
    id: 'conn-default-3',
    rawString: '$me',
    label: 'Self Entity Loopback ($me)',
    category: 'self',
    status: 'connected',
    description: 'Addressable pointer referring to local active operator identity.',
    parsed: parseConnectionString('$me'),
    latencyMs: 1,
    lastTested: Date.now() - 60000,
    createdAt: Date.now() - 86400000,
    isDefault: true,
  },
  {
    id: 'conn-default-4',
    rawString: 'ivc://IVC.cx+Sn/$opers',
    label: 'IVC Operations Channel Stream',
    category: 'ivc_protocol',
    status: 'active',
    description: 'Primary IVC protocol cluster stream for operator delta notifications.',
    parsed: parseConnectionString('ivc://IVC.cx+Sn/$opers'),
    latencyMs: 14,
    lastTested: Date.now() - 900000,
    createdAt: Date.now() - 86400000,
    isDefault: true,
  },
  {
    id: 'conn-default-5',
    rawString: 'grpc://mesh.ivc.internal:9090/v1/stream',
    label: 'Mesh gRPC High-Throughput Node',
    category: 'grpc',
    status: 'active',
    description: 'Low latency gRPC connection string for servlet container mesh.',
    parsed: parseConnectionString('grpc://mesh.ivc.internal:9090/v1/stream'),
    latencyMs: 8,
    lastTested: Date.now() - 450000,
    createdAt: Date.now() - 86400000,
    isDefault: true,
  },
];
