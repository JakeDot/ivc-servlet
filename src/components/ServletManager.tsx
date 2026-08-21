import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ServletDefinition,
  JavaServerProcessStatus,
  ServletLogEntry,
  ServletDispatchResponse,
  ServletCategory,
} from '../types/servlet';
import { IVCProtocol } from '../types/ivc';
import { servletService } from '../services/servletService';
import {
  Server,
  Play,
  Square,
  RotateCw,
  Plus,
  Power,
  Trash2,
  Settings,
  Code2,
  Send,
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Layers,
  Search,
  Copy,
  Check,
  Cpu,
  Zap,
  FileCode,
  X,
  RefreshCw,
} from 'lucide-react';

interface ServletManagerProps {
  onNavigateToConnect?: (connStr?: string) => void;
  onServletDeployed?: (servlet: ServletDefinition) => void;
}

export function ServletManager({ onServletDeployed }: ServletManagerProps) {
  // Main Engine State
  const [engineStatus, setEngineStatus] = useState<JavaServerProcessStatus | null>(null);
  const [servlets, setServlets] = useState<ServletDefinition[]>([]);
  const [logs, setLogs] = useState<ServletLogEntry[]>([]);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'registry' | 'dispatcher' | 'logs'>('registry');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState<ServletDefinition | null>(null);
  const [showConfigModal, setShowConfigModal] = useState<ServletDefinition | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // New Servlet Form
  const [newName, setNewName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newUrlPattern, setNewUrlPattern] = useState('');
  const [newProtocol, setNewProtocol] = useState<IVCProtocol>('IVC-REST');
  const [newCategory, setNewCategory] = useState<ServletCategory>('custom');
  const [newDescription, setNewDescription] = useState('');
  const [newLoadOnStartup, setNewLoadOnStartup] = useState<number>(1);
  const [newAsyncSupported, setNewAsyncSupported] = useState<boolean>(true);
  const [newInitParams, setNewInitParams] = useState<{ key: string; value: string }[]>([
    { key: 'timeoutMs', value: '5000' },
    { key: 'maxConnections', value: '50' },
  ]);

  // Dispatcher Sandbox State
  const [dispatchServletId, setDispatchServletId] = useState<string>('');
  const [dispatchMethod, setDispatchMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'IVC_CALL'>('GET');
  const [dispatchPath, setDispatchPath] = useState<string>('/ivc/v1/social/whatsapp/messages');
  const [dispatchHeaders, setDispatchHeaders] = useState<string>('{\n  "Authorization": "Bearer ivc-token-9981",\n  "X-Client-Version": "2.6"\n}');
  const [dispatchQueryParams, setDispatchQueryParams] = useState<string>('{\n  "channel": "outbound",\n  "format": "json"\n}');
  const [dispatchBody, setDispatchBody] = useState<string>('{\n  "recipient": "+15550199283@whatsapp.net",\n  "message": "Dispatching IVC payload to enterprise servlet",\n  "priority": "HIGH"\n}');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchResponse, setDispatchResponse] = useState<ServletDispatchResponse | null>(null);

  // Logs filter
  const [logFilterLevel, setLogFilterLevel] = useState<string>('ALL');
  const [logSearch, setLogSearch] = useState<string>('');

  // Action status message
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Fetch all engine data
  const refreshData = useCallback(async () => {
    try {
      const [status, servletsList, logsList] = await Promise.all([
        servletService.getStatus(),
        servletService.getServlets(),
        servletService.getLogs(150),
      ]);
      setEngineStatus(status);
      setServlets(servletsList);
      setLogs(logsList);

      if (!dispatchServletId && servletsList.length > 0) {
        setDispatchServletId(servletsList[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching servlet data:', err);
    }
  }, [dispatchServletId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Polling loop
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      refreshData();
    }, 2500);
    return () => clearInterval(timer);
  }, [autoRefresh, refreshData]);

  // Auto-fill class name as user types servlet name
  const handleNameChange = (val: string) => {
    setNewName(val);
    if (!newClassName || newClassName.startsWith('cx.ivc.servlets.')) {
      const clean = val.replace(/[^a-zA-Z0-9]/g, '');
      setNewClassName(`cx.ivc.servlets.${clean || 'MyServlet'}`);
    }
    if (!newUrlPattern || newUrlPattern.startsWith('/ivc/v1/')) {
      const clean = val.toLowerCase().replace(/servlet$/, '').replace(/[^a-z0-9]/g, '-');
      setNewUrlPattern(`/ivc/v1/${clean || 'service'}/*`);
    }
  };

  // Toggle Servlet State (RUNNING / DISABLED)
  const handleToggleState = async (servlet: ServletDefinition) => {
    const nextState = servlet.status === 'RUNNING' ? 'DISABLED' : 'RUNNING';
    try {
      const updated = await servletService.setServletStatus(servlet.id, nextState);
      setServlets((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      showFeedback(`Servlet '${servlet.name}' is now ${nextState}`);
      refreshData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // Delete Servlet
  const handleDeleteServlet = async (servlet: ServletDefinition) => {
    if (!window.confirm(`Are you sure you want to undeploy and destroy servlet '${servlet.name}'?`)) {
      return;
    }
    try {
      await servletService.removeServlet(servlet.id);
      setServlets((prev) => prev.filter((s) => s.id !== servlet.id));
      showFeedback(`Servlet '${servlet.name}' successfully undeployed and removed`);
      refreshData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // Start JVM Engine
  const handleStartEngine = async () => {
    try {
      await servletService.startEngine();
      showFeedback('Java Servlet Engine process started successfully');
      refreshData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // Stop JVM Engine
  const handleStopEngine = async () => {
    if (!window.confirm('Stop the Java Servlet Engine process? All active servlets will be suspended and return 503.')) {
      return;
    }
    try {
      await servletService.stopEngine();
      showFeedback('Java Servlet Engine process stopped');
      refreshData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // Restart JVM Engine
  const handleRestartEngine = async () => {
    try {
      await servletService.restartEngine();
      showFeedback('Java Servlet Engine process restarted');
      refreshData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // Deploy New Servlet
  const handleDeployServlet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newClassName) return;

    const initParamsObj: Record<string, string> = {};
    newInitParams.forEach((p) => {
      if (p.key.trim()) {
        initParamsObj[p.key.trim()] = p.value;
      }
    });

    try {
      const created = await servletService.createServlet({
        name: newName.trim(),
        className: newClassName.trim(),
        urlPatterns: newUrlPattern ? [newUrlPattern.trim()] : [`/ivc/v1/${newName.toLowerCase()}/*`],
        protocol: newProtocol,
        category: newCategory,
        description: newDescription || `Enterprise dynamic servlet endpoint for ${newName}`,
        loadOnStartup: newLoadOnStartup,
        asyncSupported: newAsyncSupported,
        initParams: initParamsObj,
      });

      setServlets((prev) => [...prev, created]);
      showFeedback(`Servlet '${created.name}' successfully deployed into Java Engine!`);
      setShowDeployModal(false);

      if (onServletDeployed) {
        onServletDeployed(created);
      }

      // Reset form
      setNewName('');
      setNewClassName('');
      setNewUrlPattern('');
      setNewDescription('');

      refreshData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // Execute Dispatch Sandbox Test
  const handleExecuteDispatch = async () => {
    if (!dispatchServletId) {
      showFeedback('Please select a target servlet', 'error');
      return;
    }

    setIsDispatching(true);
    setDispatchResponse(null);

    let parsedHeaders: Record<string, string> = {};
    let parsedQueryParams: Record<string, string> = {};
    let parsedBody: any = null;

    try {
      if (dispatchHeaders.trim()) parsedHeaders = JSON.parse(dispatchHeaders);
    } catch {
      showFeedback('Invalid JSON in Headers field', 'error');
      setIsDispatching(false);
      return;
    }

    try {
      if (dispatchQueryParams.trim()) parsedQueryParams = JSON.parse(dispatchQueryParams);
    } catch {
      showFeedback('Invalid JSON in Query Params field', 'error');
      setIsDispatching(false);
      return;
    }

    if (dispatchMethod !== 'GET') {
      try {
        if (dispatchBody.trim()) parsedBody = JSON.parse(dispatchBody);
      } catch {
        showFeedback('Invalid JSON in Request Body field', 'error');
        setIsDispatching(false);
        return;
      }
    }

    try {
      const response = await servletService.dispatchRequest({
        servletId: dispatchServletId,
        method: dispatchMethod,
        path: dispatchPath,
        headers: parsedHeaders,
        queryParams: parsedQueryParams,
        body: parsedBody,
      });

      setDispatchResponse(response);
      refreshData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setIsDispatching(false);
    }
  };

  // Quick switch to dispatcher for a servlet
  const handleQuickTest = (servlet: ServletDefinition) => {
    setDispatchServletId(servlet.id);
    setDispatchPath(servlet.urlPatterns[0] ? servlet.urlPatterns[0].replace('/*', '') : `/ivc/v1/${servlet.name.toLowerCase()}`);
    setActiveTab('dispatcher');
  };

  // Copy code helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Filtered Servlets
  const filteredServlets = useMemo(() => {
    return servlets.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.urlPatterns.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = categoryFilter === 'all' || s.category === categoryFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'RUNNING' && s.status === 'RUNNING') ||
        (statusFilter === 'DISABLED' && s.status === 'DISABLED');

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [servlets, searchQuery, categoryFilter, statusFilter]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const matchesLevel = logFilterLevel === 'ALL' || l.level === logFilterLevel;
      const matchesSearch =
        !logSearch ||
        l.message.toLowerCase().includes(logSearch.toLowerCase()) ||
        l.logger.toLowerCase().includes(logSearch.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [logs, logFilterLevel, logSearch]);

  const targetServlet = useMemo(
    () => servlets.find((s) => s.id === dispatchServletId) || servlets[0],
    [servlets, dispatchServletId]
  );

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-xs font-semibold shadow-2xl flex items-center space-x-2 border transition-all animate-bounce ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700'
              : 'bg-rose-950/90 text-rose-200 border-rose-700'
          }`}
        >
          {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* JVM Server Process Supervisor Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <div
                className={`p-3 rounded-xl border ${
                  engineStatus?.status === 'RUNNING'
                    ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-400'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-400'
                }`}
              >
                <Server className="w-6 h-6" />
              </div>
              <span
                className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                  engineStatus?.status === 'RUNNING' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-tight">Java Servlet Engine</h2>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    engineStatus?.status === 'RUNNING'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border-rose-800'
                  }`}
                >
                  {engineStatus?.status || 'UNKNOWN'}
                </span>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  PID: {engineStatus?.pid || '---'}
                </span>
                <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                  Port: {engineStatus?.port || 8089}
                </span>
                <span className="text-[10px] font-mono bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800">
                  {engineStatus?.mode === 'NATIVE_JVM' ? 'Native JVM Process' : 'Embedded Java Engine'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {engineStatus?.jvmVersion || 'OpenJDK 21.0.2 / Servlet 6.0 Engine'} | Uptime: {engineStatus ? `${Math.floor(engineStatus.uptimeSeconds / 60)}m ${engineStatus.uptimeSeconds % 60}s` : '0s'}
              </p>
            </div>
          </div>

          {/* JVM Process Actions */}
          <div className="flex items-center space-x-2 self-stretch lg:self-auto justify-end">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center space-x-1.5 ${
                autoRefresh
                  ? 'bg-indigo-950/60 border-indigo-800 text-indigo-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Auto-refresh metrics every 2.5 seconds"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
              <span>{autoRefresh ? 'Live' : 'Paused'}</span>
            </button>

            {engineStatus?.status === 'RUNNING' ? (
              <button
                onClick={handleStopEngine}
                className="px-3.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow transition-all cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Engine</span>
              </button>
            ) : (
              <button
                onClick={handleStartEngine}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Engine</span>
              </button>
            )}

            <button
              onClick={handleRestartEngine}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Restart Java Process"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>

            <button
              onClick={() => setShowDeployModal(true)}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Deploy Servlet</span>
            </button>
          </div>
        </div>

        {/* Telemetry Meters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>Heap Memory</span>
              </span>
              <span className="font-mono text-indigo-300 font-semibold">{engineStatus?.heapMemory.usagePercent || 0}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-1">
              <div
                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, engineStatus?.heapMemory.usagePercent || 0)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              {engineStatus?.heapMemory.usedMb || 0}MB / {engineStatus?.heapMemory.maxMb || 1024}MB Max ({engineStatus?.heapMemory.freeMb || 0}MB free)
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Worker Threads</span>
              </span>
              <span className="font-mono text-amber-300 font-semibold">{engineStatus?.threads.activeCount || 0} active</span>
            </div>
            <p className="text-lg font-bold font-mono text-white">
              {engineStatus?.threads.activeCount || 0}{' '}
              <span className="text-xs font-normal text-slate-500">/ {engineStatus?.threads.poolSize || 32} pool</span>
            </p>
            <p className="text-[10px] text-slate-500 font-mono">Queue backlog: {engineStatus?.threads.queueSize || 0} tasks</p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Deployed Servlets</span>
              </span>
              <span className="font-mono text-emerald-300 font-semibold">{servlets.length} total</span>
            </div>
            <p className="text-lg font-bold font-mono text-white">
              {servlets.filter((s) => s.status === 'RUNNING').length}{' '}
              <span className="text-xs font-normal text-emerald-400">RUNNING</span>
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              {servlets.filter((s) => s.status === 'DISABLED').length} disabled | {servlets.filter((s) => s.category === 'social_connector').length} social connectors
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Total Dispatched</span>
              </span>
              <span className="font-mono text-cyan-300 font-semibold">Live</span>
            </div>
            <p className="text-lg font-bold font-mono text-white">
              {engineStatus?.totalRequestsHandled || servlets.reduce((acc, s) => acc + s.invocationCount, 0)}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              GC cycles: {engineStatus?.gcStats.collectionCount || 0} ({engineStatus?.gcStats.collectionTimeMs || 0}ms)
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('registry')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'registry'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Servlet Registry & Lifecycles ({servlets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('dispatcher')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dispatcher'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Request Dispatcher Sandbox</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>JVM Server Logs ({logs.length})</span>
          </button>
        </div>

        {activeTab === 'registry' && (
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search servlets, classes, routes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="social_connector">Social Connectors</option>
              <option value="telemetry">Telemetry & Deltas</option>
              <option value="gateway">Gateways</option>
              <option value="media">Media / Transcoding</option>
              <option value="security">Security & Auth</option>
              <option value="custom">Custom</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="RUNNING">Running Only</option>
              <option value="DISABLED">Disabled Only</option>
            </select>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: SERVLET REGISTRY & LIFECYCLES                     */}
      {/* ======================================================== */}
      {activeTab === 'registry' && (
        <div className="space-y-4">
          {filteredServlets.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <Layers className="w-12 h-12 mx-auto text-slate-600 mb-3 animate-pulse" />
              <h3 className="text-base font-semibold text-slate-200">No matching servlets found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {searchQuery ? 'Try adjusting your search criteria or filter tags.' : 'Deploy a new servlet into the Java engine using the button above.'}
              </p>
              <button
                onClick={() => setShowDeployModal(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Deploy New Servlet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredServlets.map((servlet) => {
                const isRunning = servlet.status === 'RUNNING';
                return (
                  <div
                    key={servlet.id}
                    className={`bg-slate-900 border rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all duration-200 ${
                      isRunning
                        ? 'border-slate-800 hover:border-slate-700'
                        : 'border-amber-900/40 bg-slate-900/60 opacity-80'
                    }`}
                  >
                    <div>
                      {/* Card Header with Status & Category */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                              isRunning
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : 'bg-amber-950 text-amber-300 border-amber-800'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                            <span>{servlet.status}</span>
                          </span>

                          <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                            {servlet.protocol}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded capitalize">
                          {servlet.category.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Title & Class */}
                      <h3 className="text-base font-bold text-slate-100 flex items-center justify-between">
                        <span>{servlet.name}</span>
                      </h3>
                      <p className="text-[11px] font-mono text-indigo-400/90 break-all mb-2">
                        {servlet.className}
                      </p>

                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                        {servlet.description}
                      </p>

                      {/* URL Mappings */}
                      <div className="mb-3 space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Mapped Paths:</span>
                        <div className="flex flex-wrap gap-1">
                          {servlet.urlPatterns.map((pat, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono bg-slate-950 text-cyan-300 px-2 py-0.5 rounded border border-slate-800"
                            >
                              {pat}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Init params preview */}
                      {Object.keys(servlet.initParams).length > 0 && (
                        <div className="mb-4 bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 text-[10px] font-mono">
                          <span className="text-slate-500 font-semibold block mb-1">Init Params ({Object.keys(servlet.initParams).length}):</span>
                          <div className="space-y-0.5">
                            {Object.entries(servlet.initParams).slice(0, 2).map(([k, v]) => (
                              <div key={k} className="flex justify-between text-slate-400">
                                <span className="text-slate-400">{k}:</span>
                                <span className="text-amber-300 font-bold truncate max-w-[120px]">{v}</span>
                              </div>
                            ))}
                            {Object.keys(servlet.initParams).length > 2 && (
                              <span className="text-slate-600 block text-[9px]">+{Object.keys(servlet.initParams).length - 2} more parameters</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Invocation Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 text-center bg-slate-950/60 border border-slate-800/60 rounded-xl p-2 mb-4">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase block">Calls</span>
                          <span className="text-xs font-mono font-bold text-white">{servlet.invocationCount}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase block">Errors</span>
                          <span className={`text-xs font-mono font-bold ${servlet.errorCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                            {servlet.errorCount}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase block">Avg Latency</span>
                          <span className="text-xs font-mono font-bold text-cyan-300">{servlet.avgExecutionTimeMs}ms</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1">
                      {/* Dynamic Enable / Disable Toggle Switch */}
                      <button
                        onClick={() => handleToggleState(servlet)}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isRunning
                            ? 'bg-amber-950/60 hover:bg-amber-900 border border-amber-700/60 text-amber-200'
                            : 'bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-200'
                        }`}
                        title={isRunning ? 'Disable servlet (Reject incoming calls)' : 'Enable servlet (Accept incoming calls)'}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{isRunning ? 'Disable' : 'Enable'}</span>
                      </button>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleQuickTest(servlet)}
                          className="p-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 rounded-lg text-xs transition-all cursor-pointer"
                          title="Open Request Dispatcher Sandbox"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setShowSourceModal(servlet)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs transition-all cursor-pointer"
                          title="Inspect Java Servlet Source Code"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setShowConfigModal(servlet)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs transition-all cursor-pointer"
                          title="Edit Init Parameters & Config"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteServlet(servlet)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-900/60 border border-slate-700 hover:border-rose-700 text-slate-400 hover:text-rose-300 rounded-lg text-xs transition-all cursor-pointer"
                          title="Undeploy and Destroy Servlet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: REQUEST DISPATCHER SANDBOX                        */}
      {/* ======================================================== */}
      {activeTab === 'dispatcher' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Dispatch Form Controls */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Send className="w-4 h-4 text-indigo-400" />
                <span>Servlet Dispatch Sandbox</span>
              </h3>
              <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                Direct Ingress Tester
              </span>
            </div>

            {/* Target Servlet Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Servlet</label>
              <select
                value={dispatchServletId}
                onChange={(e) => {
                  setDispatchServletId(e.target.value);
                  const s = servlets.find((item) => item.id === e.target.value);
                  if (s && s.urlPatterns[0]) {
                    setDispatchPath(s.urlPatterns[0].replace('/*', ''));
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              >
                {servlets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status}) - {s.className}
                  </option>
                ))}
              </select>
            </div>

            {/* Method & Path */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Method</label>
                <select
                  value={dispatchMethod}
                  onChange={(e) => setDispatchMethod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="IVC_CALL">IVC_CALL</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Path / URI</label>
                <input
                  type="text"
                  value={dispatchPath}
                  onChange={(e) => setDispatchPath(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  placeholder="/ivc/v1/social/whatsapp"
                />
              </div>
            </div>

            {/* Headers JSON */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">Request Headers (JSON)</label>
                <button
                  type="button"
                  onClick={() => setDispatchHeaders('{\n  "Authorization": "Bearer ivc-token-9981",\n  "Content-Type": "application/json"\n}')}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  Reset Sample
                </button>
              </div>
              <textarea
                value={dispatchHeaders}
                onChange={(e) => setDispatchHeaders(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Query Params JSON */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">Query Parameters (JSON)</label>
                <button
                  type="button"
                  onClick={() => setDispatchQueryParams('{\n  "channel": "outbound",\n  "format": "json"\n}')}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  Reset Sample
                </button>
              </div>
              <textarea
                value={dispatchQueryParams}
                onChange={(e) => setDispatchQueryParams(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Request Body (For POST/PUT/IVC_CALL) */}
            {dispatchMethod !== 'GET' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300">Request Body Payload (JSON)</label>
                  <button
                    type="button"
                    onClick={() =>
                      setDispatchBody(
                        '{\n  "recipient": "+15550199283@whatsapp.net",\n  "message": "Outbound telemetry audio broadcast via servlet",\n  "mediaId": "media-wa-1"\n}'
                      )
                    }
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    Reset Sample
                  </button>
                </div>
                <textarea
                  value={dispatchBody}
                  onChange={(e) => setDispatchBody(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <button
              onClick={handleExecuteDispatch}
              disabled={isDispatching}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {isDispatching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Dispatching to JVM Servlet...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Execute Servlet Call ({dispatchMethod})</span>
                </>
              )}
            </button>
          </div>

          {/* Dispatch Results Panel */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Servlet Response & Trace</span>
                </h3>
                {dispatchResponse && (
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                      dispatchResponse.statusCode >= 200 && dispatchResponse.statusCode < 300
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : dispatchResponse.statusCode === 503
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}
                  >
                    HTTP {dispatchResponse.statusCode} {dispatchResponse.statusText}
                  </span>
                )}
              </div>

              {!dispatchResponse ? (
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-10 text-center text-slate-500 space-y-2">
                  <Cpu className="w-10 h-10 mx-auto text-slate-700 animate-pulse" />
                  <p className="text-xs">No request dispatched yet.</p>
                  <p className="text-[11px] text-slate-600">
                    Configure your headers, method, and payload on the left, then click &quot;Execute Servlet Call&quot;.
                  </p>
                </div>
              ) : (
                <>
                  {/* Execution Metrics Bar */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Status Code</span>
                      <span
                        className={`text-sm font-mono font-bold ${
                          dispatchResponse.statusCode === 200
                            ? 'text-emerald-400'
                            : dispatchResponse.statusCode === 503
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {dispatchResponse.statusCode}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Execution Latency</span>
                      <span className="text-sm font-mono font-bold text-cyan-300">
                        {dispatchResponse.executionTimeMs}ms
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Timestamp</span>
                      <span className="text-xs font-mono text-slate-300">
                        {new Date(dispatchResponse.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* Execution Trace Steps */}
                  <div>
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                      JVM Container Execution Trace:
                    </span>
                    <div className="space-y-1.5">
                      {dispatchResponse.trace.map((t, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-950 border border-slate-800/80 rounded-lg p-2 flex items-start justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center space-x-2">
                            {t.status === 'SUCCESS' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : t.status === 'WARN' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            )}
                            <div>
                              <span className="font-mono font-bold text-slate-200">{t.step}</span>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{t.detail}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-cyan-400/80 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                            {t.durationMs}ms
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Response Payload JSON */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Response Body (application/json):
                      </span>
                      <button
                        onClick={() => handleCopyCode(JSON.stringify(dispatchResponse.body, null, 2))}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode ? 'Copied' : 'Copy JSON'}</span>
                      </button>
                    </div>
                    <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 overflow-x-auto max-h-56">
                      {JSON.stringify(dispatchResponse.body, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>

            {targetServlet && (
              <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Selected: <strong className="text-white">{targetServlet.name}</strong> ({targetServlet.protocol})</span>
                <span className="font-mono text-cyan-400">{targetServlet.urlPatterns.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: JVM SERVER LOGS CONSOLE                           */}
      {/* ======================================================== */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">JVM Server Console Output</h3>
              <span className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                {filteredLogs.length} events
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="pl-7 pr-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
                />
              </div>

              <select
                value={logFilterLevel}
                onChange={(e) => setLogFilterLevel(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Levels</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
                <option value="DEBUG">DEBUG</option>
              </select>

              <button
                onClick={refreshData}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs transition-all cursor-pointer"
                title="Refresh log feed"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Terminal Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-y-auto max-h-[500px] space-y-1.5 shadow-inner">
            {filteredLogs.length === 0 ? (
              <p className="text-slate-600 text-center py-6">No matching logs found in buffer.</p>
            ) : (
              filteredLogs.map((log) => {
                const timeStr = new Date(log.timestamp).toLocaleTimeString();
                return (
                  <div key={log.id} className="flex items-start space-x-2 leading-relaxed hover:bg-slate-900/50 p-1 rounded">
                    <span className="text-slate-500 shrink-0">[{timeStr}]</span>
                    <span
                      className={`font-bold shrink-0 px-1 rounded text-[10px] ${
                        log.level === 'INFO'
                          ? 'bg-blue-950 text-blue-400'
                          : log.level === 'WARN'
                          ? 'bg-amber-950 text-amber-400'
                          : log.level === 'ERROR'
                          ? 'bg-rose-950 text-rose-400'
                          : 'bg-purple-950 text-purple-400'
                      }`}
                    >
                      {log.level}
                    </span>
                    <span className="text-indigo-400/80 shrink-0 max-w-[200px] truncate" title={log.logger}>
                      {log.logger.split('.').slice(-2).join('.')}:
                    </span>
                    <span className="text-slate-200 break-all">{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DEPLOY NEW SERVLET                                */}
      {/* ======================================================== */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-indigo-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Deploy Dynamic Java Servlet</h3>
                  <p className="text-xs text-slate-400">
                    Instantiate and register an enterprise IVC servlet into the runtime container.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDeployModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeployServlet} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Servlet Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. WhatsAppBridgeServlet"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Java Class Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="cx.ivc.servlets.WhatsAppBridgeServlet"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    URL Pattern Mapping <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUrlPattern}
                    onChange={(e) => setNewUrlPattern(e.target.value)}
                    placeholder="/ivc/v1/service/*"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Protocol Binding</label>
                  <select
                    value={newProtocol}
                    onChange={(e) => setNewProtocol(e.target.value as IVCProtocol)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="IVC-REST">IVC-REST</option>
                    <option value="IVC-HTTPS">IVC-HTTPS</option>
                    <option value="IVC-gRPC">IVC-gRPC</option>
                    <option value="IVC-RMI">IVC-RMI</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ServletCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="social_connector">Social Connector</option>
                    <option value="telemetry">Telemetry & Deltas</option>
                    <option value="gateway">Gateway</option>
                    <option value="media">Media / Transcoding</option>
                    <option value="security">Security / Filter</option>
                    <option value="custom">Custom Extension</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Load on Startup</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newLoadOnStartup}
                    onChange={(e) => setNewLoadOnStartup(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="asyncSupported"
                    checked={newAsyncSupported}
                    onChange={(e) => setNewAsyncSupported(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded bg-slate-950 border-slate-800 focus:ring-indigo-500"
                  />
                  <label htmlFor="asyncSupported" className="text-xs font-semibold text-slate-300 cursor-pointer">
                    Async Supported (Jakarta)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Enterprise IVC endpoint for payload dispatch"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Init Params Dynamic List */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Servlet Init Parameters (@WebInitParam)</label>
                  <button
                    type="button"
                    onClick={() => setNewInitParams([...newInitParams, { key: '', value: '' }])}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer font-bold"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Parameter</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {newInitParams.map((param, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Param Name (e.g. timeoutMs)"
                        value={param.key}
                        onChange={(e) => {
                          const updated = [...newInitParams];
                          updated[idx].key = e.target.value;
                          setNewInitParams(updated);
                        }}
                        className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. 5000)"
                        value={param.value}
                        onChange={(e) => {
                          const updated = [...newInitParams];
                          updated[idx].value = e.target.value;
                          setNewInitParams(updated);
                        }}
                        className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setNewInitParams(newInitParams.filter((_, i) => i !== idx))}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeployModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Deploy to Java Engine</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: JAVA SOURCE CODE INSPECTOR                        */}
      {/* ======================================================== */}
      {showSourceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-indigo-400">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <span>{showSourceModal.name}.java</span>
                    <span className="text-xs font-mono text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                      {showSourceModal.protocol}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">{showSourceModal.className}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopyCode(showSourceModal.sourceCode || '')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy Java Source'}</span>
                </button>
                <button
                  onClick={() => setShowSourceModal(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-[460px] leading-relaxed select-all">
              {showSourceModal.sourceCode}
            </pre>

            <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-800">
              <span>Jakarta EE 10 / Servlet 6.0 Specification</span>
              <span>Loaded in PID: {engineStatus?.pid}</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT SERVLET CONFIGURATION / INIT PARAMS          */}
      {/* ======================================================== */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-indigo-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Configure {showConfigModal.name}</h3>
                  <p className="text-xs text-slate-400">Update runtime servlet configuration & init parameters.</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  defaultValue={showConfigModal.description}
                  id="edit-description"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">URL Patterns (comma separated)</label>
                <input
                  type="text"
                  defaultValue={showConfigModal.urlPatterns.join(', ')}
                  id="edit-urlPatterns"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Init Parameters (JSON Map)</label>
                <textarea
                  defaultValue={JSON.stringify(showConfigModal.initParams, null, 2)}
                  id="edit-initParams"
                  rows={5}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowConfigModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const desc = (document.getElementById('edit-description') as HTMLInputElement).value;
                    const patterns = (document.getElementById('edit-urlPatterns') as HTMLInputElement).value
                      .split(',')
                      .map((p) => p.trim())
                      .filter(Boolean);
                    const initParamsRaw = (document.getElementById('edit-initParams') as HTMLTextAreaElement).value;
                    const initParams = JSON.parse(initParamsRaw);

                    const updated = await servletService.updateServletConfig(showConfigModal.id, {
                      description: desc,
                      urlPatterns: patterns,
                      initParams,
                    });

                    setServlets((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
                    showFeedback(`Servlet '${updated.name}' configuration hot-reloaded!`);
                    setShowConfigModal(null);
                    refreshData();
                  } catch (err: any) {
                    showFeedback(err.message, 'error');
                  }
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Apply & Hot-Reload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
