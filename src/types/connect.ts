export type ServiceCategory =
  | 'whatsapp'
  | 'social_email'
  | 'self'
  | 'ivc_protocol'
  | 'grpc'
  | 'websocket'
  | 'custom';

export type ConnectionStatus = 'active' | 'testing' | 'connected' | 'error' | 'untested';

export interface ParsedConnectionString {
  scheme?: string;
  user?: string;
  host?: string;
  port?: string;
  path?: string;
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
