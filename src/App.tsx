import React, { useState, useEffect, useMemo } from 'react';
import {
  AddressableObject,
  IVCServiceCall,
  DeltaEventStats,
  FlowInfo,
  IVCProtocol,
} from './types/ivc';
import {
  INITIAL_ADDRESSABLE_OBJECTS,
  generateRandomIVCCall,
  buildFlowInfoForCall,
  computeDeltaStats,
} from './services/ivcSimulator';
import { ObjectSelector } from './components/ObjectSelector';
import { DeltaStatsView } from './components/DeltaStatsView';
import { FlowTraceView } from './components/FlowTraceView';
import {
  Radio,
  Play,
  RotateCcw,
  Sparkles,
  Server,
  Activity,
  Layers,
  X,
  SlidersHorizontal,
} from 'lucide-react';

export default function App() {
  const [objects, setObjects] = useState<AddressableObject[]>(INITIAL_ADDRESSABLE_OBJECTS);
  const [selectedObjectId, setSelectedObjectId] = useState<string>(INITIAL_ADDRESSABLE_OBJECTS[0].id);
  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(false);

  // Calls per object history store
  const [callsStore, setCallsStore] = useState<Record<string, IVCServiceCall[]>>({});
  // Historical delta stats per object
  const [deltaHistoryStore, setDeltaHistoryStore] = useState<Record<string, DeltaEventStats[]>>({});
  // Recent flow traces per object
  const [flowsStore, setFlowsStore] = useState<Record<string, FlowInfo[]>>({});

  // New object modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newObjName, setNewObjName] = useState('');
  const [newServletName, setNewServletName] = useState('');
  const [newServletClass, setNewServletClass] = useState('');
  const [newEndpointPath, setNewEndpointPath] = useState('');
  const [newProtocol, setNewProtocol] = useState<IVCProtocol>('IVC-gRPC');

  const selectedObject = useMemo(
    () => objects.find((o) => o.id === selectedObjectId) || objects[0],
    [objects, selectedObjectId]
  );

  // Helper to recompute deltas immediately for object
  const refreshDeltasForObject = (objId: string, currentCalls: IVCServiceCall[]) => {
    const currentWindowCalls = currentCalls.slice(0, 10);
    const previousWindowCalls = currentCalls.slice(10, 20);

    const timeString = new Date().toLocaleTimeString([], {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const newDelta = computeDeltaStats(
      currentWindowCalls,
      previousWindowCalls,
      `T-${timeString}`
    );

    setDeltaHistoryStore((prev) => ({
      ...prev,
      [objId]: [newDelta, ...(prev[objId] || [])].slice(0, 15),
    }));
  };

  // Trigger a single IVC Call for target object
  const handleTriggerIVCCall = (targetObj: AddressableObject = selectedObject) => {
    const newCall = generateRandomIVCCall(targetObj);
    const flow = buildFlowInfoForCall(newCall, targetObj);

    setCallsStore((prev) => {
      const updatedCalls = [newCall, ...(prev[targetObj.id] || [])].slice(0, 100);
      refreshDeltasForObject(targetObj.id, updatedCalls);
      return {
        ...prev,
        [targetObj.id]: updatedCalls,
      };
    });

    setFlowsStore((prev) => ({
      ...prev,
      [targetObj.id]: [flow, ...(prev[targetObj.id] || [])].slice(0, 20),
    }));
  };

  // Trigger batch IVC load test
  const handleBatchIVCLoad = (count: number = 5) => {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        handleTriggerIVCCall(selectedObject);
      }, i * 100);
    }
  };

  // Periodic delta computation timer
  useEffect(() => {
    const interval = setInterval(() => {
      objects.forEach((obj) => {
        const objCalls = callsStore[obj.id] || [];
        refreshDeltasForObject(obj.id, objCalls);
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [objects, callsStore]);

  // Auto traffic simulation
  useEffect(() => {
    if (!isAutoSimulating) return;

    const simInterval = setInterval(() => {
      const randomObj = objects[Math.floor(Math.random() * objects.length)];
      handleTriggerIVCCall(randomObj);
    }, 1200);

    return () => clearInterval(simInterval);
  }, [isAutoSimulating, objects]);

  // Handle adding new addressable servlet object
  const handleRegisterObject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjName || !newServletName) return;

    const id = `obj-${Date.now()}`;
    const newObj: AddressableObject = {
      id,
      name: newObjName,
      servletName: newServletName,
      servletClass: newServletClass || `com.enterprise.ivc.servlets.${newServletName}`,
      endpointPath: newEndpointPath || `/ivc/v1/${newObjName.toLowerCase()}`,
      protocol: newProtocol,
      status: 'ACTIVE',
      description: 'Custom registered addressable servlet object instance',
      attributes: { created: 'Dynamic', tier: 'Custom' },
    };

    setObjects((prev) => [...prev, newObj]);
    setSelectedObjectId(id);
    setShowAddModal(false);

    setNewObjName('');
    setNewServletName('');
    setNewServletClass('');
    setNewEndpointPath('');
  };

  const selectedObjectDeltas = deltaHistoryStore[selectedObject.id] || [];
  const latestDelta = selectedObjectDeltas.length > 0 ? selectedObjectDeltas[0] : null;
  const selectedObjectFlows = flowsStore[selectedObject.id] || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-indigo-400">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center space-x-2">
                <span>IVC Addressable Object Control Plane</span>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 font-mono border border-indigo-800 px-2 py-0.5 rounded-full">
                  v2.4
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Servlet Object Invocations, ∆Event Statistics, & Execution Flow Traces
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsAutoSimulating(!isAutoSimulating)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                isAutoSimulating
                  ? 'bg-rose-950/80 border-rose-700 text-rose-300 hover:bg-rose-900'
                  : 'bg-emerald-950/80 border-emerald-700 text-emerald-300 hover:bg-emerald-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAutoSimulating ? 'Stop Auto-Traffic' : 'Simulate Live Traffic'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Addressable Object Selector Grid */}
        <ObjectSelector
          objects={objects}
          selectedObjectId={selectedObjectId}
          onSelectObject={setSelectedObjectId}
          onAddNewObject={() => setShowAddModal(true)}
        />

        {/* Selected Object Active Controls & Summary Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-mono text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                {selectedObject.protocol}
              </span>
              <h2 className="text-xl font-bold text-slate-100">{selectedObject.name}</h2>
              <span className="text-xs text-slate-500 font-mono">({selectedObject.id})</span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Servlet Class: <span className="text-slate-300 font-mono">{selectedObject.servletClass}</span> | Endpoint Path:{' '}
              <span className="text-slate-300 font-mono">{selectedObject.endpointPath}</span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleTriggerIVCCall(selectedObject)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Fire IVC Call</span>
            </button>
            <button
              onClick={() => handleBatchIVCLoad(5)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Burst (5x)</span>
            </button>
          </div>
        </div>

        {/* ∆Event Stats Dashboard */}
        <DeltaStatsView
          currentStats={latestDelta}
          history={selectedObjectDeltas}
          objectName={selectedObject.name}
        />

        {/* Execution Flow Traces Visualizer */}
        <FlowTraceView flows={selectedObjectFlows} />
      </main>

      {/* Modal for registering new addressable servlet object */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center space-x-2">
              <Server className="w-5 h-5 text-indigo-400" />
              <span>Register Addressable Servlet Object</span>
            </h3>

            <form onSubmit={handleRegisterObject} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Object Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OrderProcessingManager"
                  value={newObjName}
                  onChange={(e) => setNewObjName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Servlet Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OrderServlet"
                  value={newServletName}
                  onChange={(e) => setNewServletName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Servlet Class Path</label>
                <input
                  type="text"
                  placeholder="e.g. com.enterprise.ivc.servlets.OrderServlet"
                  value={newServletClass}
                  onChange={(e) => setNewServletClass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Endpoint Path</label>
                <input
                  type="text"
                  placeholder="e.g. /ivc/v1/orders"
                  value={newEndpointPath}
                  onChange={(e) => setNewEndpointPath(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">IVC Protocol Binding</label>
                <select
                  value={newProtocol}
                  onChange={(e) => setNewProtocol(e.target.value as IVCProtocol)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="IVC-gRPC">IVC-gRPC</option>
                  <option value="IVC-HTTPS">IVC-HTTPS</option>
                  <option value="IVC-REST">IVC-REST</option>
                  <option value="IVC-RMI">IVC-RMI</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg cursor-pointer"
                >
                  Register Object
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
