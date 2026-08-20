import React, { useState, useEffect, useMemo } from 'react';
import {
  AddressableObject,
  IVCServiceCall,
  DeltaEventStats,
  FlowInfo,
  IVCProtocol,
  ChatMessage,
  MediaAttachment,
  ObjectKind,
} from './types/ivc';
import {
  INITIAL_ADDRESSABLE_OBJECTS,
  INITIAL_CHAT_MESSAGES,
  generateRandomIVCCall,
  buildFlowInfoForCall,
  computeDeltaStats,
} from './services/ivcSimulator';
import { ObjectSelector } from './components/ObjectSelector';
import { DeltaStatsView } from './components/DeltaStatsView';
import { FlowTraceView } from './components/FlowTraceView';
import { DeltaGalleryView } from './components/DeltaGalleryView';
import { ChatView } from './components/ChatView';
import {
  Radio,
  Play,
  Sparkles,
  Server,
  Activity,
  MessageSquare,
  Images,
  X,
  SlidersHorizontal,
  Share2,
} from 'lucide-react';

export default function App() {
  const [objects, setObjects] = useState<AddressableObject[]>(INITIAL_ADDRESSABLE_OBJECTS);
  const [selectedObjectId, setSelectedObjectId] = useState<string>(INITIAL_ADDRESSABLE_OBJECTS[0].id);
  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'gallery' | 'chat'>('gallery');

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);

  // Calls per object history store
  const [callsStore, setCallsStore] = useState<Record<string, IVCServiceCall[]>>({});
  // Historical delta stats per object
  const [deltaHistoryStore, setDeltaHistoryStore] = useState<Record<string, DeltaEventStats[]>>({});
  // Recent flow traces per object
  const [flowsStore, setFlowsStore] = useState<Record<string, FlowInfo[]>>({});

  // New object modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newObjName, setNewObjName] = useState('');
  const [newObjKind, setNewObjKind] = useState<ObjectKind>('social_connector');
  const [newConnectorAddress, setNewConnectorAddress] = useState('+15550199283@whatsapp.net');
  const [newServletName, setNewServletName] = useState('WhatsAppConnectorServlet');
  const [newServletClass, setNewServletClass] = useState('com.enterprise.ivc.servlets.WhatsAppBridgeServlet');
  const [newEndpointPath, setNewEndpointPath] = useState('/ivc/v1/social/whatsapp');
  const [newProtocol, setNewProtocol] = useState<IVCProtocol>('IVC-REST');

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

  // Handle adding media items to an object's ∆gallery subobject
  const handleAddMediaToGallery = (item: MediaAttachment) => {
    setObjects((prev) =>
      prev.map((obj) => {
        if (obj.id === selectedObject.id) {
          const currentGallery = obj.deltaGallery || {
            id: `gal-${obj.id}`,
            ownerId: obj.id,
            ownerName: obj.name,
            ownerKind: obj.kind,
            title: `∆gallery - ${obj.name}`,
            description: `Media subobjects associated with ${obj.name}`,
            items: [],
            updatedAt: Date.now(),
          };

          return {
            ...obj,
            deltaGallery: {
              ...currentGallery,
              items: [item, ...currentGallery.items],
              updatedAt: Date.now(),
            },
          };
        }
        return obj;
      })
    );
  };

  // Send a chat message
  const handleSendChatMessage = (content: string, attachments?: MediaAttachment[]) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'usr-sysadmin',
      senderName: 'Operator_Nexus',
      channelId: selectedObject.id,
      content,
      attachments,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, newMsg]);

    // If message contains media attachments, also append them to the selected object's ∆gallery
    if (attachments && attachments.length > 0) {
      attachments.forEach((att) => handleAddMediaToGallery(att));
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

  // Handle adding new addressable object or social connector
  const handleRegisterObject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjName || !newServletName) return;

    const id = `obj-${Date.now()}`;
    const newObj: AddressableObject = {
      id,
      name: newObjName,
      kind: newObjKind,
      connectorAddress: newObjKind === 'social_connector' ? newConnectorAddress : undefined,
      servletName: newServletName,
      servletClass: newServletClass || `com.enterprise.ivc.servlets.${newServletName}`,
      endpointPath: newEndpointPath || `/ivc/v1/${newObjName.toLowerCase()}`,
      protocol: newProtocol,
      status: 'ACTIVE',
      description: newObjKind === 'social_connector' ? `Social connector binding to ${newConnectorAddress}` : 'Custom registered addressable object instance',
      attributes: { created: 'Dynamic', address: newConnectorAddress || 'Local' },
      deltaGallery: {
        id: `gal-${id}`,
        ownerId: id,
        ownerName: newObjKind === 'social_connector' && newConnectorAddress ? newConnectorAddress : newObjName,
        ownerKind: newObjKind,
        title: `∆gallery - ${newObjName}`,
        description: `Subobject gallery for ${newObjName}`,
        updatedAt: Date.now(),
        items: [
          {
            id: `media-init-${Date.now()}`,
            type: 'audio',
            title: `${newObjName} Audio Signal Track`,
            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            durationSeconds: 180,
            sizeBytes: 2100000,
            mimeType: 'audio/mp3',
            description: 'Default voice note / startup telemetry track.',
            createdAt: Date.now(),
          },
        ],
      },
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
                <span>IVC Control Plane & Social Connectors</span>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 font-mono border border-indigo-800 px-2 py-0.5 rounded-full">
                  v2.6
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Audio/Video Chat Playback, Social Connectors (+<span className="text-purple-300">number</span>@whatsapp.net), & ∆galleries
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
              <span>{isAutoSimulating ? 'Stop Traffic Sim' : 'Simulate Traffic'}</span>
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
              <span className="text-xs font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 capitalize">
                {selectedObject.kind.replace('_', ' ')}
              </span>
              {selectedObject.connectorAddress && (
                <span className="text-xs font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800 flex items-center space-x-1">
                  <Share2 className="w-3 h-3 text-purple-400" />
                  <span>{selectedObject.connectorAddress}</span>
                </span>
              )}
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

        {/* View Switcher Tabs */}
        <div className="flex space-x-3 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'gallery'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Images className="w-4 h-4" />
            <span>∆gallery Subobject Media ({selectedObject.deltaGallery?.items.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'chat'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat Dispatch (Audio/Video Support)</span>
          </button>

          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'metrics'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>∆Event Metrics & Flow Traces</span>
          </button>
        </div>

        {/* Dynamic Tab Panels */}
        {activeTab === 'gallery' && (
          <DeltaGalleryView
            gallery={selectedObject.deltaGallery}
            ownerName={selectedObject.connectorAddress || selectedObject.name}
            ownerKind={selectedObject.kind}
            onAddItem={handleAddMediaToGallery}
          />
        )}

        {activeTab === 'chat' && (
          <ChatView
            messages={chatMessages}
            channelName={selectedObject.connectorAddress || selectedObject.name}
            onSendMessage={handleSendChatMessage}
          />
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <DeltaStatsView
              currentStats={latestDelta}
              history={selectedObjectDeltas}
              objectName={selectedObject.name}
            />
            <FlowTraceView flows={selectedObjectFlows} />
          </div>
        )}
      </main>

      {/* Modal for registering new addressable object or social connector */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center space-x-2">
              <Server className="w-5 h-5 text-indigo-400" />
              <span>Register Object or Social Connector</span>
            </h3>

            <form onSubmit={handleRegisterObject} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Object Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WhatsApp Ops Connector or #dev-ops"
                  value={newObjName}
                  onChange={(e) => setNewObjName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Object Kind</label>
                <select
                  value={newObjKind}
                  onChange={(e) => setNewObjKind(e.target.value as ObjectKind)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="social_connector">Social Connector (WhatsApp / Telegram / Matrix)</option>
                  <option value="channel">Channel (#channel)</option>
                  <option value="user">User (User Profile)</option>
                  <option value="server">Server (Server Host)</option>
                  <option value="servlet">Servlet (Servlet Container)</option>
                </select>
              </div>

              {newObjKind === 'social_connector' && (
                <div>
                  <label className="block text-slate-400 mb-1">
                    Connector Address (e.g. +phonenumber@whatsapp.net)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+15550199283@whatsapp.net"
                    value={newConnectorAddress}
                    onChange={(e) => setNewConnectorAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">Servlet Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WhatsAppConnectorServlet"
                  value={newServletName}
                  onChange={(e) => setNewServletName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Servlet Class Path</label>
                <input
                  type="text"
                  placeholder="e.g. com.enterprise.ivc.servlets.WhatsAppBridgeServlet"
                  value={newServletClass}
                  onChange={(e) => setNewServletClass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Endpoint Path</label>
                <input
                  type="text"
                  placeholder="e.g. /ivc/v1/social/whatsapp"
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
                  <option value="IVC-REST">IVC-REST</option>
                  <option value="IVC-HTTPS">IVC-HTTPS</option>
                  <option value="IVC-gRPC">IVC-gRPC</option>
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
    </div>
  );
}
