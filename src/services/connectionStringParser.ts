import {
  ConnectionStringItem,
  ParsedConnectionString,
  ServiceCategory,
} from '../types/connect';

/**
 * Extracts degree modifier °<0-360> and fractional subobject modifier (/3, /7, /8, /9, etc.)
 */
function extractFractionAndDegree(pathStr?: string): {
  cleanPath?: string;
  fractionalSubobject?: string;
  degreeModifier?: number;
} {
  if (!pathStr) return {};

  let current = pathStr;
  let degreeModifier: number | undefined = undefined;
  let fractionalSubobject: string | undefined = undefined;

  // Check for degree modifier: °180 or %C2%B0180 or deg180
  const degreeRegex = /(?:°|%C2%B0|deg)(\d{1,3})/i;
  const degreeMatch = current.match(degreeRegex);
  if (degreeMatch) {
    const degVal = parseInt(degreeMatch[1], 10);
    if (!isNaN(degVal)) {
      degreeModifier = Math.min(360, Math.max(0, degVal));
    }
    current = current.replace(degreeRegex, '');
  }

  // Check for fractional subobject addressing like /3, /7, /8, /9 or /1/3
  const fractionRegex = /\/([1-9](?:\/[1-9])?)$/;
  const fractionMatch = current.match(fractionRegex);
  if (fractionMatch) {
    fractionalSubobject = `/${fractionMatch[1]}`;
    current = current.replace(fractionRegex, '');
  }

  return {
    cleanPath: current || undefined,
    fractionalSubobject,
    degreeModifier,
  };
}

/**
 * Parses complex connection strings such as:
 * - fb://user:pass@facebook.net
 * - https://+15550199283@whatsapp.net/7°180
 * - user@email.host/service.social/3°90
 * - $me/3°120 or $me/8°270
 * - ivc://IVC.cx+Sn/$opers/9°360
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
    const rest = trimmed.slice(3);
    const { cleanPath, fractionalSubobject, degreeModifier } = extractFractionAndDegree(rest);
    return {
      raw: trimmed,
      scheme: '$me',
      user: '$me',
      host: 'localhost',
      path: cleanPath,
      fractionalSubobject,
      degreeModifier,
      isSelfVariable: true,
      isValid: true,
      explanation: `Self addressable entity ($me variable pointer)${
        fractionalSubobject ? ` with subobject ${fractionalSubobject}` : ''
      }${degreeModifier !== undefined ? ` at ${degreeModifier}° orientation` : ''}`,
    };
  }

  // Handle social network login URIs like fb://user:pass@facebook.net or ig://user:pass@instagram.net
  const socialLoginRegex = /^([a-zA-Z0-9+.-]+):\/\/(?:([^:@]+)(?::([^@]+))?@)?([^/?:#]+)(?::(\d+))?([^?#]*)?(?:\?([^#]*))?$/;
  const socialMatch = trimmed.match(socialLoginRegex);
  if (socialMatch && ['fb', 'facebook', 'ig', 'instagram', 'tg', 'telegram', 'tw', 'twitter', 'social'].includes(socialMatch[1].toLowerCase())) {
    const scheme = socialMatch[1];
    const user = socialMatch[2] ? decodeURIComponent(socialMatch[2]) : undefined;
    const password = socialMatch[3] ? decodeURIComponent(socialMatch[3]) : undefined;
    const host = socialMatch[4];
    const port = socialMatch[5];
    const rawPath = socialMatch[6];
    const { cleanPath, fractionalSubobject, degreeModifier } = extractFractionAndDegree(rawPath);

    return {
      raw: trimmed,
      scheme,
      user,
      password,
      host,
      port,
      path: cleanPath || undefined,
      fractionalSubobject,
      degreeModifier,
      isSelfVariable: false,
      isValid: true,
      explanation: `Social Network Service login endpoint for ${user || 'user'} on ${host}`,
    };
  }

  // Handle email / social connection strings like user@email.host/service.social/3°180
  const emailSocialRegex = /^([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(\/.*)?$/;
  const emailMatch = trimmed.match(emailSocialRegex);
  if (emailMatch) {
    const user = emailMatch[1];
    const host = emailMatch[2];
    const rawPath = emailMatch[3] || undefined;
    const { cleanPath, fractionalSubobject, degreeModifier } = extractFractionAndDegree(rawPath);

    return {
      raw: trimmed,
      scheme: 'social-email',
      user,
      host,
      path: cleanPath,
      fractionalSubobject,
      degreeModifier,
      isSelfVariable: false,
      isValid: true,
      explanation: `Social Email Service endpoint for ${user} hosted at ${host}${
        fractionalSubobject ? ` (${fractionalSubobject} subobject)` : ''
      }${degreeModifier !== undefined ? ` [°${degreeModifier}]` : ''}`,
    };
  }

  // Attempt standard URL parsing
  try {
    const url = new URL(trimmed);
    const query: Record<string, string> = {};
    url.searchParams.forEach((val, key) => {
      query[key] = val;
    });

    const { cleanPath, fractionalSubobject, degreeModifier } = extractFractionAndDegree(url.pathname);

    return {
      raw: trimmed,
      scheme: url.protocol.replace(':', ''),
      user: url.username ? decodeURIComponent(url.username) : undefined,
      password: url.password ? decodeURIComponent(url.password) : undefined,
      host: url.hostname,
      port: url.port || undefined,
      path: cleanPath !== '/' ? cleanPath : undefined,
      fractionalSubobject,
      degreeModifier,
      query: Object.keys(query).length > 0 ? query : undefined,
      isSelfVariable: false,
      isValid: true,
      explanation: `URI protocol scheme '${url.protocol.replace(':', '')}' targeting ${url.hostname}${
        fractionalSubobject ? ` subobject ${fractionalSubobject}` : ''
      }${degreeModifier !== undefined ? ` °${degreeModifier}` : ''}`,
    };
  } catch (_e) {
    // Custom scheme parsing fallback (e.g. ivc://IVC.cx+Sn/$opers/8°270)
    const customUriRegex = /^([a-zA-Z0-9+.-]+):\/\/(?:([^:@]+)(?::([^@]+))?@)?([^/?:#]+)(?::(\d+))?([^?#]*)?(?:\?([^#]*))?$/;
    const match = trimmed.match(customUriRegex);

    if (match) {
      const scheme = match[1];
      const user = match[2] ? decodeURIComponent(match[2]) : undefined;
      const password = match[3] ? decodeURIComponent(match[3]) : undefined;
      const host = match[4];
      const port = match[5];
      const rawPath = match[6];
      const queryStr = match[7];

      const { cleanPath, fractionalSubobject, degreeModifier } = extractFractionAndDegree(rawPath);

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
        password,
        host,
        port,
        path: cleanPath || undefined,
        fractionalSubobject,
        degreeModifier,
        query: Object.keys(query).length > 0 ? query : undefined,
        isSelfVariable: false,
        isValid: true,
        explanation: `Custom URI protocol '${scheme}' bound to ${host}${
          fractionalSubobject ? ` subobject ${fractionalSubobject}` : ''
        }${degreeModifier !== undefined ? ` °${degreeModifier}` : ''}`,
      };
    }
  }

  const { cleanPath, fractionalSubobject, degreeModifier } = extractFractionAndDegree(trimmed);

  return {
    raw: trimmed,
    path: cleanPath,
    fractionalSubobject,
    degreeModifier,
    isSelfVariable: false,
    isValid: true,
    explanation: 'Custom formatted connection string descriptor',
  };
}

export function detectCategory(raw: string): ServiceCategory {
  const trimmed = raw.trim();

  if (/^(fb|ig|tg|tw|facebook|instagram|telegram|twitter):\/\//i.test(trimmed)) return 'social_network';
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
    id: 'conn-social-fb-1',
    rawString: 'fb://user:pass@facebook.net',
    label: 'Facebook Service Login (fb://user:pass@facebook.net)',
    category: 'social_network',
    status: 'connected',
    description: 'Standard Facebook network service login credential string.',
    parsed: parseConnectionString('fb://user:pass@facebook.net'),
    latencyMs: 24,
    lastTested: Date.now() - 150000,
    createdAt: Date.now() - 86400000,
    isDefault: true,
  },
  {
    id: 'conn-default-1',
    rawString: 'https://+15550199283@whatsapp.net/7°180',
    label: 'WhatsApp Fractional Node (/7°180)',
    category: 'whatsapp',
    status: 'connected',
    description: 'WhatsApp direct user node address with /7 subobject partition and 180° rotation modifier.',
    parsed: parseConnectionString('https://+15550199283@whatsapp.net/7°180'),
    latencyMs: 38,
    lastTested: Date.now() - 300000,
    createdAt: Date.now() - 86400000,
    isDefault: true,
  },
  {
    id: 'conn-default-2',
    rawString: 'operator@email.host/service.social/3°90',
    label: 'Enterprise Social Email Bridge (/3°90)',
    category: 'social_email',
    status: 'active',
    description: 'Federated social messaging relay bound to /3 fractional subobject at 90° azimuth.',
    parsed: parseConnectionString('operator@email.host/service.social/3°90'),
    latencyMs: 62,
    lastTested: Date.now() - 1200000,
    createdAt: Date.now() - 86400000,
    isDefault: true,
  },
  {
    id: 'conn-default-3',
    rawString: '$me/3°120',
    label: 'Self Entity Fractional Object ($me/3°120)',
    category: 'self',
    status: 'connected',
    description: 'Addressable fractional pointer referring to local active operator identity subobject /3 at 120°.',
    parsed: parseConnectionString('$me/3°120'),
    latencyMs: 1,
    lastTested: Date.now() - 60000,
    createdAt: Date.now() - 86400000,
    isDefault: true,
  },
  {
    id: 'conn-default-4',
    rawString: 'ivc://IVC.cx+Sn/$opers/8°270',
    label: 'IVC Operations Channel Stream (/8°270)',
    category: 'ivc_protocol',
    status: 'active',
    description: 'Primary IVC protocol cluster subobject /8 at 270° orientation.',
    parsed: parseConnectionString('ivc://IVC.cx+Sn/$opers/8°270'),
    latencyMs: 14,
    lastTested: Date.now() - 900000,
    createdAt: Date.now() - 86400000,
    isDefault: true,
  },
  {
    id: 'conn-default-5',
    rawString: 'grpc://mesh.ivc.internal:9090/v1/stream/9°360',
    label: 'Mesh gRPC Subobject Node (/9°360)',
    category: 'grpc',
    status: 'active',
    description: 'Low latency gRPC connection string targeting /9 fractional subobject at 360° phase.',
    parsed: parseConnectionString('grpc://mesh.ivc.internal:9090/v1/stream/9°360'),
    latencyMs: 8,
    lastTested: Date.now() - 450000,
    createdAt: Date.now() - 86400000,
    isDefault: true,
  },
];
