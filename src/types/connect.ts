export type ServiceCategory =
  | 'whatsapp'
  | 'social_email'
  | 'social_network'
  | 'self'
  | 'ivc_protocol'
  | 'grpc'
  | 'websocket'
  | 'custom';

export type ConnectionStatus = 'active' | 'testing' | 'connected' | 'error' | 'untested';

export interface ParsedConnectionString {
  scheme?: string;
  user?: string;
  password?: string;
  host?: string;
  port?: string;
  path?: string;
  fractionalSubobject?: string; // e.g. /3, /7, /8, /9
  degreeModifier?: number;      // °<0-360>
  query?: Record<string, string>;
  raw: string;
  isSelfVariable: boolean;
  isValid: boolean;
  explanation: string;
}

export interface ConnectionStringItem {
  id: string;
  rawString: string;
  label: string;
  category: ServiceCategory;
  status: ConnectionStatus;
  description: string;
  parsed: ParsedConnectionString;
  latencyMs?: number;
  lastTested?: number;
  createdAt: number;
  isDefault?: boolean;
}
