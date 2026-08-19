import React, { useEffect, useState, useRef } from 'react';
import { Terminal, Activity, ShieldAlert, Cpu } from 'lucide-react';

interface IvcMessage {
  id: string;
  sender: string;
  channel: string;
  content: string;
  timestamp: number;
}

export default function App() {
  const [messages, setMessages] = useState<IvcMessage[]>([]);
  const [status, setStatus] = useState<string>('Connecting...');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
      setStatus('Connected to IVC Fabric');
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'init') {
        setMessages(data.messages);
      } else if (data.type === 'message') {
        setMessages((prev) => [...prev, data.message].slice(-50));
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      setStatus('Disconnected - Reconnecting...');
    };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeClients = Array.from(new Set(messages.map((m) => m.sender)));

  return (
    <div className="min-h-screen bg-neutral-950 text-emerald-400 font-mono p-4 md:p-8 flex flex-col md:flex-row gap-6">
      {/* Sidebar / Stats */}
      <aside className="md:w-1/4 flex flex-col gap-4">
        <div className="border border-emerald-500/30 bg-black/40 p-4 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-300">
            <Activity className="w-5 h-5" />
            IVC Node Status
          </h2>
          <div className="space-y-2 text-sm">
            <p className="flex justify-between">
              <span className="text-neutral-400">Status:</span>
              <span className={status.includes('Connected') ? 'text-emerald-500' : 'text-amber-500'}>
                {status}
              </span>
            </p>
            <p className="flex justify-between">
              <span className="text-neutral-400">Target:</span>
              <span className="text-blue-400 truncate ml-2">ivc://IVC.cx+Sn/$opers</span>
            </p>
            <p className="flex justify-between">
              <span className="text-neutral-400">Uptime:</span>
              <span>Ephermal</span>
            </p>
          </div>
        </div>

        <div className="border border-emerald-500/30 bg-black/40 p-4 rounded-lg flex-1 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-emerald-300">
            <Cpu className="w-4 h-4" />
            Active Cluster Clients
          </h3>
          <ul className="space-y-1">
            {activeClients.length === 0 ? (
              <li className="text-neutral-500 italic text-sm">Awaiting telemetry...</li>
            ) : (
              activeClients.map((client) => (
                <li key={client} className="flex items-center gap-2 text-sm bg-neutral-900/50 p-1.5 rounded">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-neutral-300">@{client}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </aside>

      {/* Main Terminal Area */}
      <main className="flex-1 flex flex-col border border-emerald-500/30 bg-black/60 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.15)]">
        <header className="bg-neutral-900 border-b border-emerald-500/30 p-3 flex items-center gap-3">
          <Terminal className="w-5 h-5 text-emerald-500" />
          <h1 className="text-lg font-semibold tracking-wide text-neutral-200">
            ΔVIEW Matrix: <span className="text-emerald-400">#$opers</span>
          </h1>
          <div className="ml-auto flex gap-2">
            <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 border border-red-500/50 rounded flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              Netadmin +n
            </span>
          </div>
        </header>

        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-neutral-600 italic">
              Listening for IVC protocol events...
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="text-sm border-l-2 border-emerald-500/50 pl-3 py-1 hover:bg-neutral-900/50 transition-colors">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-neutral-500 text-xs">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-blue-400 font-bold">@{msg.sender}</span>
                  <span className="text-neutral-600 text-xs">{msg.channel}</span>
                </div>
                <div className="text-neutral-300 whitespace-pre-wrap">{msg.content}</div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>
    </div>
  );
}
