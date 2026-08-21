import {
  ServletDefinition,
  JavaServerProcessStatus,
  ServletLogEntry,
  ServletDispatchRequest,
  ServletDispatchResponse,
} from '../types/servlet';

export const servletService = {
  async getStatus(): Promise<JavaServerProcessStatus> {
    const res = await fetch('/api/engine/status');
    if (!res.ok) throw new Error('Failed to fetch JVM engine status');
    return res.json();
  },

  async startEngine(): Promise<{ success: boolean; status: JavaServerProcessStatus }> {
    const res = await fetch('/api/engine/start', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to start JVM engine');
    return res.json();
  },

  async stopEngine(): Promise<{ success: boolean; status: JavaServerProcessStatus }> {
    const res = await fetch('/api/engine/stop', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to stop JVM engine');
    return res.json();
  },

  async restartEngine(): Promise<{ success: boolean; status: JavaServerProcessStatus }> {
    const res = await fetch('/api/engine/restart', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to restart JVM engine');
    return res.json();
  },

  async getServlets(): Promise<ServletDefinition[]> {
    const res = await fetch('/api/servlets');
    if (!res.ok) throw new Error('Failed to list servlets');
    const data = await res.json();
    return data.servlets;
  },

  async getServlet(id: string): Promise<ServletDefinition> {
    const res = await fetch(`/api/servlets/${id}`);
    if (!res.ok) throw new Error('Failed to get servlet');
    return res.json();
  },

  async createServlet(payload: Partial<ServletDefinition> & { name: string; className: string }): Promise<ServletDefinition> {
    const res = await fetch('/api/servlets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to deploy servlet');
    }
    return res.json();
  },

  async setServletStatus(id: string, status: 'RUNNING' | 'DISABLED'): Promise<ServletDefinition> {
    const res = await fetch(`/api/servlets/${id}/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to change servlet state');
    }
    return res.json();
  },

  async updateServletConfig(id: string, updates: Partial<ServletDefinition>): Promise<ServletDefinition> {
    const res = await fetch(`/api/servlets/${id}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update servlet config');
    }
    return res.json();
  },

  async removeServlet(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/servlets/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to remove servlet');
    }
    return res.json();
  },

  async dispatchRequest(payload: ServletDispatchRequest): Promise<ServletDispatchResponse> {
    const res = await fetch(`/api/servlets/${payload.servletId}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getLogs(limit = 100): Promise<ServletLogEntry[]> {
    const res = await fetch(`/api/engine/logs?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch engine logs');
    const data = await res.json();
    return data.logs;
  },
};
