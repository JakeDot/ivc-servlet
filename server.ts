import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { servletEngine } from './src/server/servletEngine';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Ephemeral memory
  const messages: any[] = [];
  const clients: Set<express.Response> = new Set();
  const modelDb = new Map<string, any>();

  // ==========================================
  // Java Servlet Management Engine API Routes
  // ==========================================

  // JVM Process Engine Status
  app.get('/api/engine/status', (_req, res) => {
    res.json(servletEngine.getStatus());
  });

  // Start JVM Process
  app.post('/api/engine/start', (_req, res) => {
    const success = servletEngine.start();
    res.json({ success, status: servletEngine.getStatus() });
  });

  // Stop JVM Process
  app.post('/api/engine/stop', (_req, res) => {
    const success = servletEngine.stop();
    res.json({ success, status: servletEngine.getStatus() });
  });

  // Restart JVM Process
  app.post('/api/engine/restart', (_req, res) => {
    const success = servletEngine.restart();
    res.json({ success, status: servletEngine.getStatus() });
  });

  // Server Console Logs
  app.get('/api/engine/logs', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 100;
    res.json({ logs: servletEngine.getLogs(limit) });
  });

  // List all Servlets
  app.get('/api/servlets', (_req, res) => {
    res.json({ servlets: servletEngine.getServlets() });
  });

  // Get specific servlet
  app.get('/api/servlets/:id', (req, res) => {
    const servlet = servletEngine.getServlet(req.params.id);
    if (!servlet) {
      res.status(404).json({ error: 'Servlet not found' });
      return;
    }
    res.json(servlet);
  });

  // Dynamically add / deploy new servlet
  app.post('/api/servlets', (req, res) => {
    try {
      const { name, className, urlPatterns, protocol, initParams, description, category, loadOnStartup, asyncSupported } = req.body;
      if (!name || !className) {
        res.status(400).json({ error: 'Servlet name and className are required.' });
        return;
      }
      const newServlet = servletEngine.addServlet({
        name,
        className,
        urlPatterns: urlPatterns || [`/ivc/v1/${name.toLowerCase()}/*`],
        protocol: protocol || 'IVC-REST',
        initParams: initParams || {},
        description: description || `Dynamic ${name} servlet endpoint`,
        category: category || 'custom',
        loadOnStartup: loadOnStartup || 1,
        asyncSupported: asyncSupported ?? true,
      });
      res.status(201).json(newServlet);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Dynamically Enable / Disable servlet
  app.put('/api/servlets/:id/state', (req, res) => {
    try {
      const { status } = req.body;
      if (status !== 'RUNNING' && status !== 'DISABLED') {
        res.status(400).json({ error: 'Status must be RUNNING or DISABLED' });
        return;
      }
      const updated = servletEngine.setServletStatus(req.params.id, status);
      res.json(updated);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  });

  // Update servlet configuration & init parameters
  app.put('/api/servlets/:id/config', (req, res) => {
    try {
      const updated = servletEngine.updateServletConfig(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  });

  // Undeploy / remove servlet
  app.delete('/api/servlets/:id', (req, res) => {
    const success = servletEngine.removeServlet(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Servlet not found' });
      return;
    }
    res.json({ success: true, message: `Servlet ${req.params.id} undeployed and removed.` });
  });

  // Dispatch request to servlet
  app.post('/api/servlets/:id/dispatch', (req, res) => {
    const { method = 'GET', path = '/', headers = {}, queryParams = {}, body = null } = req.body;
    const result = servletEngine.dispatchRequest({
      servletId: req.params.id,
      method,
      path,
      headers,
      queryParams,
      body,
    });
    res.status(result.statusCode).json(result);
  });

  // Universal dynamic servlet route catch
  app.all('/ivc/servlet/:servletName', (req, res) => {
    const servletName = req.params.servletName;
    const matched = servletEngine.getServlets().find(
      (s) => s.name.toLowerCase() === servletName.toLowerCase() || s.id === servletName
    );

    if (!matched) {
      res.status(404).json({ error: `Servlet ${servletName} not found.` });
      return;
    }

    const result = servletEngine.dispatchRequest({
      servletId: matched.id,
      method: (req.method as any) || 'GET',
      path: req.originalUrl,
      headers: req.headers as Record<string, string>,
      queryParams: req.query as Record<string, string>,
      body: req.body,
    });

    res.status(result.statusCode).json(result);
  });

  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    clients.add(res);

    // Send initial state
    res.write(`data: ${JSON.stringify({ type: 'init', messages })}\n\n`);

    req.on('close', () => {
      clients.delete(res);
    });
  });

  app.put(/^\/ivc:\/\/([a-zA-Z0-9.-]+)\+([a-zA-Z]+)\/\$model\.([a-zA-Z0-9.-]+)\/?$/, (req, res) => {
    const host = req.params[0];
    const modes = req.params[1];
    const tld = req.params[2];

    const uri = `ivc://${host}+${modes}/$model.${tld}/`;
    const payload = req.body;

    if (!modelDb.has(uri)) {
      modelDb.set(uri, payload);
      res.status(201).json({ status: 'created', uri, data: payload });
    } else {
      const existing = modelDb.get(uri);
      const updated = { ...existing, ...payload };
      modelDb.set(uri, updated);
      res.json({ status: 'updated', uri, data: updated });
    }
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Mock Clients Logic
  const ivcDefaultChannel = 'ivc://IVC.cx+Sn/$opers';
  const mockClients = ['Bot_Alpha', 'Bot_Beta', 'Kernel_Agent', 'System_Ops'];

  setInterval(() => {
    if (clients.size > 0) {
      const randomClient = mockClients[Math.floor(Math.random() * mockClients.length)];
      const newMessage = {
        id: Date.now().toString(),
        sender: randomClient,
        channel: ivcDefaultChannel,
        content: `System status update from ${randomClient} at ${new Date().toISOString()}`,
        timestamp: Date.now(),
      };
      messages.push(newMessage);

      // Keep memory bounded
      if (messages.length > 50) {
        messages.shift();
      }

      const payload = `data: ${JSON.stringify({ type: 'message', message: newMessage })}\n\n`;
      for (const client of clients) {
        client.write(payload);
      }
    }
  }, 3000);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
