import express from 'express';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

app.use(express.json());

// Ephemeral memory
const messages: any[] = [];
const clients: Set<express.Response> = new Set();
const modelDb = new Map<string, any>();

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

export const broadcast = (data: any) => {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    client.write(payload);
  }
};

// Mock Clients Logic
const ivcDefaultChannel = "ivc://IVC.cx+Sn/$opers";
const mockClients = ["Bot_Alpha", "Bot_Beta", "Kernel_Agent", "System_Ops"];

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

    broadcast({ type: 'message', message: newMessage });
  }
}, 3000);

app.listen(PORT, () => {
  console.log(`Ephemeral IVC Server running on port ${PORT}`);
});
