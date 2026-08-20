import React, { useState, useMemo } from 'react';
import {
  ConnectionStringItem,
  ServiceCategory,
  ConnectionStatus,
} from '../types/connect';
import {
  parseConnectionString,
  detectCategory,
  DEFAULT_CONNECTION_STRINGS,
} from '../services/connectionStringParser';
import {
  Link2,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  Check,
  Trash2,
  Edit3,
  ExternalLink,
  Layers,
  Sparkles,
  Zap,
  Terminal,
  X,
  Server,
  Globe,
  UserCheck,
  Radio,
  Filter,
  Download,
  Power,
  Compass,
  PieChart,
} from 'lucide-react';

interface ConnectionStringManagerProps {
  onSelectConnectionString?: (connStr: string) => void;
}

export const ConnectionStringManager: React.FC<ConnectionStringManagerProps> = ({
  onSelectConnectionString,
}) => {
  const [items, setItems] = useState<ConnectionStringItem[]>(DEFAULT_CONNECTION_STRINGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(DEFAULT_CONNECTION_STRINGS[0]?.id || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ConnectionStringItem | null>(null);
  const [formRawString, setFormRawString] = useState('https://+15550199283@whatsapp.net/7°180');
  const [formLabel, setFormLabel] = useState('');
  const [formCategory, setFormCategory] = useState<ServiceCategory>('whatsapp');
  const [formDescription, setFormDescription] = useState('');

  // Live modal parsed output
  const liveParsed = useMemo(() => parseConnectionString(formRawString), [formRawString]);

  // Preset templates
  const presets = [
    {
      label: 'WhatsApp Fractional Node (https://+number@whatsapp.net/7°180)',
      value: 'https://+15550199283@whatsapp.net/7°180',
      cat: 'whatsapp' as ServiceCategory,
      desc: 'WhatsApp Direct Node Bridge with /7 subobject at 180°',
    },
    {
      label: 'Social Email Fractional Subobject (user@email.host/service.social/3°90)',
      value: 'operator@enterprise.com/whatsapp.social/3°90',
      cat: 'social_email' as ServiceCategory,
      desc: 'Federated Social Messaging Relay at /3 subobject and 90° azimuth',
    },
    {
      label: 'Self Identity Fractional Subobject ($me/3°120)',
      value: '$me/3°120',
      cat: 'self' as ServiceCategory,
      desc: 'Active Operator Self Identity Pointer at /3 subobject and 120°',
    },
    {
      label: 'Self Identity Fractional Subobject ($me/8°270)',
      value: '$me/8°270',
      cat: 'self' as ServiceCategory,
      desc: 'Active Operator Self Identity Pointer at /8 subobject and 270°',
    },
    {
      label: 'IVC Protocol Subobject (ivc://.../9°360)',
      value: 'ivc://IVC.cx+Sn/$opers/9°360',
      cat: 'ivc_protocol' as ServiceCategory,
      desc: 'IVC Operations Channel Stream at /9 subobject and 360° phase',
    },
    {
      label: 'gRPC Subobject Stream (grpc://.../7°45)',
      value: 'grpc://mesh.ivc.internal:9090/v1/stream/7°45',
      cat: 'grpc' as ServiceCategory,
      desc: 'Internal Microservice Mesh gRPC Stream at /7 subobject and 45°',
    },
  ];

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.rawString.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [items, searchQuery, selectedCategory]);

  // Test Connectivity Simulator
  const handleTestConnection = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'testing' as ConnectionStatus } : item
      )
    );

    setTimeout(() => {
      const randomLatency = Math.floor(Math.random() * 85) + 5;
      const isSuccess = Math.random() > 0.08;
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              status: isSuccess ? ('connected' as ConnectionStatus) : ('error' as ConnectionStatus),
              latencyMs: randomLatency,
              lastTested: Date.now(),
            };
          }
          return item;
        })
      );
    }, 800);
  };

  // Test All Connections
  const handleTestAll = () => {
    items.forEach((item, index) => {
      setTimeout(() => {
        handleTestConnection(item.id);
      }, index * 200);
    });
  };

  // Restore Default Services
  const handleRestoreDefaults = () => {
    setItems(DEFAULT_CONNECTION_STRINGS);
    setSearchQuery('');
    setSelectedCategory('all');
    setConnectionNotice('Restored default fractional connection strings.');
    setTimeout(() => setConnectionNotice(null), 3500);
  };

  // Disconnect & Reconnect to alias $me/3°120 (localhost)
  const handleDisconnectAndReconnectToMe = () => {
    const meItem: ConnectionStringItem = {
      id: `conn-me-${Date.now()}`,
      rawString: '$me/3°120',
      label: 'Self Fractional Object ($me/3°120 / localhost)',
      category: 'self',
      status: 'connected',
      description: 'Reconnected to local fractional subobject $me/3 at 120° orientation.',
      parsed: parseConnectionString('$me/3°120'),
      latencyMs: 1,
      lastTested: Date.now(),
      createdAt: Date.now(),
      isDefault: true,
    };

    setItems([meItem]);
    setExpandedId(meItem.id);
    setSearchQuery('');
    setSelectedCategory('all');
    setConnectionNotice('Disconnected current connections and reconnected to fractional alias $me/3°120.');
    setTimeout(() => setConnectionNotice(null), 4000);
  };

  // Clear All (Trigger <empty> state)
  const handleClearAll = () => {
    setItems([]);
  };

  // Copy Connection String
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormRawString('https://+15550199283@whatsapp.net/7°180');
    setFormLabel('WhatsApp Subobject /7°180');
    setFormCategory('whatsapp');
    setFormDescription('WhatsApp direct connection string endpoint with fractional subobject /7 at 180°');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (item: ConnectionStringItem) => {
    setEditingItem(item);
    setFormRawString(item.rawString);
    setFormLabel(item.label);
    setFormCategory(item.category);
    setFormDescription(item.description);
    setIsModalOpen(true);
  };

  // Apply Preset
  const handleSelectPreset = (presetValue: string) => {
    const preset = presets.find((p) => p.value === presetValue);
    if (preset) {
      setFormRawString(preset.value);
      setFormLabel(preset.label);
      setFormCategory(preset.cat);
      setFormDescription(preset.desc);
    }
  };

  // Save Modal (Create or Update)
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseConnectionString(formRawString);
    const cat = detectCategory(formRawString) || formCategory;

    if (editingItem) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                rawString: formRawString,
                label: formLabel || formRawString,
                category: cat,
                description: formDescription,
                parsed,
              }
            : item
        )
      );
    } else {
      const newItem: ConnectionStringItem = {
        id: `conn-custom-${Date.now()}`,
        rawString: formRawString,
        label: formLabel || formRawString,
        category: cat,
        status: 'active',
        description: formDescription || 'Custom registered connection string',
        parsed,
        latencyMs: Math.floor(Math.random() * 40) + 10,
        lastTested: Date.now(),
        createdAt: Date.now(),
      };
      setItems((prev) => [newItem, ...prev]);
    }

    setIsModalOpen(false);
  };

  // Delete Connection String
  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Export JSON
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(items, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'connection_strings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryBadge = (cat: ServiceCategory) => {
    switch (cat) {
      case 'whatsapp':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>WhatsApp</span>
          </span>
        );
      case 'social_email':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-950 text-blue-300 border border-blue-800">
            <Globe className="w-3 h-3 text-blue-400" />
            <span>Social Email</span>
          </span>
        );
      case 'self':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-950 text-purple-300 border border-purple-800">
            <UserCheck className="w-3 h-3 text-purple-400" />
            <span>$me Variable</span>
          </span>
        );
      case 'ivc_protocol':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-950 text-indigo-300 border border-indigo-800">
            <Zap className="w-3 h-3 text-indigo-400" />
            <span>IVC Protocol</span>
          </span>
        );
      case 'grpc':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950 text-amber-300 border border-amber-800">
            <Server className="w-3 h-3 text-amber-400" />
            <span>gRPC Mesh</span>
          </span>
        );
      case 'websocket':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-950 text-cyan-300 border border-cyan-800">
            <Terminal className="w-3 h-3 text-cyan-400" />
            <span>WebSocket</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            <Layers className="w-3 h-3" />
            <span>Custom</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Connected</span>
          </span>
        );
      case 'testing':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
            <span>Testing...</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            <span>Error</span>
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Clock className="w-3 h-3 text-indigo-400" />
            <span>Active</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            <span>Untested</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/40 rounded-xl text-indigo-400 shadow-inner">
                <Link2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Complex Connection String Manager
                  </h2>
                  <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-0.5 rounded-full">
                    /connect
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage URI schemes, fractional subobjects (<span className="text-pink-400 font-mono">/3, /7, /8, /9</span>), degree modifiers (<span className="text-cyan-300 font-mono">°0-360</span>), and social addresses (<span className="text-emerald-400 font-mono">https://+number@whatsapp.net</span>, <span className="text-purple-400 font-mono">$me/3°120</span>).
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDisconnectAndReconnectToMe}
              className="flex items-center space-x-1.5 px-3 py-2 bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-700 rounded-lg text-xs font-semibold shadow transition-all cursor-pointer"
              title="Disconnect current services and reconnect to fractional alias $me/3°120"
            >
              <Power className="w-3.5 h-3.5 text-purple-400" />
              <span>Reconnect to $me/3°120</span>
            </button>

            <button
              onClick={handleTestAll}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Test All Connectivity</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Connection String</span>
            </button>

            <button
              onClick={handleRestoreDefaults}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-all cursor-pointer"
              title="Restore default list of services"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restore Defaults</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs transition-all cursor-pointer"
              title="Export JSON"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {connectionNotice && (
          <div className="mt-4 p-2.5 bg-indigo-950/80 border border-indigo-700/60 rounded-lg text-xs text-indigo-300 font-medium flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{connectionNotice}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search connection strings, degree modifiers °180, or /3 subobjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs text-slate-500 flex items-center space-x-1 mr-1">
              <Filter className="w-3 h-3" />
              <span>Category:</span>
            </span>
            {(
              [
                { id: 'all', label: 'All Services' },
                { id: 'whatsapp', label: 'WhatsApp' },
                { id: 'social_email', label: 'Social Email' },
                { id: 'self', label: '$me Self' },
                { id: 'ivc_protocol', label: 'IVC URI' },
                { id: 'grpc', label: 'gRPC' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as ServiceCategory | 'all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-all whitespace-nowrap border ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Connection List OR <empty> Display State */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl p-12 text-center shadow-lg relative">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-600 shadow-inner">
              <Link2 className="w-8 h-8 stroke-[1.5]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-200 flex items-center justify-center space-x-2">
                <span>No Connection Strings Active</span>
                <span className="text-xs font-mono bg-slate-950 text-rose-400 border border-slate-800 px-2 py-0.5 rounded">
                  &lt;empty&gt;
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {items.length === 0
                  ? 'All connection strings have been disconnected (<empty>). You can disconnect & reconnect directly to fractional alias $me/3°120 or restore default fractional services.'
                  : `No connection strings match your filter query "${searchQuery}".`}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleDisconnectAndReconnectToMe}
                className="flex items-center space-x-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow cursor-pointer transition-all"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Reconnect to alias $me/3°120</span>
              </button>

              <button
                onClick={handleRestoreDefaults}
                className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow cursor-pointer transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restore Default Services</span>
              </button>

              <button
                onClick={handleOpenAddModal}
                className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium rounded-lg cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Connection String</span>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono text-left bg-slate-950 p-3 rounded-lg border border-slate-800/50">
              <span className="text-slate-400 font-semibold block mb-1">Supported Subobjects & Degree Modifiers:</span>
              <ul className="space-y-0.5 list-disc list-inside text-slate-400">
                <li><code className="text-emerald-400">https://+number@whatsapp.net/7°180</code></li>
                <li><code className="text-blue-400">user@email.host/service.social/3°90</code></li>
                <li><code className="text-purple-400">$me/3°120</code> or <code className="text-purple-400">$me/8°270</code></li>
                <li><code className="text-indigo-400">ivc://IVC.cx+Sn/$opers/9°360</code></li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing <strong className="text-white">{filteredItems.length}</strong> connection string
              {filteredItems.length === 1 ? '' : 's'}
            </span>
            {items.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
              >
                Disconnect All (&lt;empty&gt;)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredItems.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  className={`bg-slate-900 border rounded-xl p-5 shadow-lg transition-all ${
                    isExpanded
                      ? 'border-indigo-500/60 ring-1 ring-indigo-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Item Header Row */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                        {getCategoryBadge(item.category)}
                        {getStatusBadge(item.status)}
                        {item.parsed.fractionalSubobject && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono bg-pink-950 text-pink-300 border border-pink-800/80">
                            <PieChart className="w-3 h-3 text-pink-400" />
                            <span>Subobject {item.parsed.fractionalSubobject}</span>
                          </span>
                        )}
                        {item.parsed.degreeModifier !== undefined && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                            <Compass className="w-3 h-3 text-cyan-400" />
                            <span>°{item.parsed.degreeModifier}</span>
                          </span>
                        )}
                        <h3 className="text-sm font-bold text-slate-100 truncate">{item.label}</h3>
                      </div>

                      {/* Raw Connection String Pill */}
                      <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-lg p-2.5 max-w-full overflow-x-auto">
                        <code className="text-xs font-mono text-indigo-300 font-semibold select-all whitespace-nowrap">
                          {item.rawString}
                        </code>
                      </div>
                      <p className="text-xs text-slate-400">{item.description}</p>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex items-center space-x-2 self-start md:self-center shrink-0">
                      {item.latencyMs !== undefined && (
                        <div className="text-right mr-2 hidden sm:block">
                          <span className="text-[11px] font-mono text-slate-400 block">
                            Latency: <strong className="text-emerald-400">{item.latencyMs}ms</strong>
                          </span>
                        </div>
                      )}

                      <button
                        onClick={() => handleTestConnection(item.id)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer"
                        title="Ping / Test connection"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Test</span>
                      </button>

                      <button
                        onClick={() => handleCopy(item.id, item.rawString)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs transition-all cursor-pointer"
                        title="Copy connection string"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs transition-all cursor-pointer"
                        title="Edit connection string"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {onSelectConnectionString && (
                        <button
                          onClick={() => onSelectConnectionString(item.rawString)}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Use String</span>
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg text-xs cursor-pointer"
                        title="Inspect breakdown"
                      >
                        <Layers className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800 rounded-lg text-xs transition-all cursor-pointer"
                        title="Delete string"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detailed Parser Breakdown Panel */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-800/80 bg-slate-950/60 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Parsed Connection Breakdown</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {item.parsed.explanation}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
                        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                            Scheme / Protocol
                          </span>
                          <code className="text-indigo-400 font-mono font-semibold">
                            {item.parsed.scheme || '<none>'}
                          </code>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                            User / Authority
                          </span>
                          <code className="text-emerald-400 font-mono font-semibold truncate block">
                            {item.parsed.user || '<none>'}
                          </code>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                            Host / Domain
                          </span>
                          <code className="text-blue-400 font-mono font-semibold truncate block">
                            {item.parsed.host || '<none>'}
                            {item.parsed.port ? `:${item.parsed.port}` : ''}
                          </code>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                            Target Path
                          </span>
                          <code className="text-amber-400 font-mono font-semibold truncate block">
                            {item.parsed.path || '/'}
                          </code>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                            Subobject
                          </span>
                          <code className="text-pink-400 font-mono font-semibold truncate block">
                            {item.parsed.fractionalSubobject || '<full>'}
                          </code>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                            Degree Mod (°0-360)
                          </span>
                          <code className="text-cyan-300 font-mono font-semibold truncate block">
                            {item.parsed.degreeModifier !== undefined ? `°${item.parsed.degreeModifier}` : '<0°>'}
                          </code>
                        </div>
                      </div>

                      {item.parsed.query && (
                        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                            Query Parameters
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(item.parsed.query).map(([k, v]) => (
                              <span
                                key={k}
                                className="bg-slate-950 border border-slate-800 font-mono text-slate-300 px-2 py-0.5 rounded text-[11px]"
                              >
                                <span className="text-indigo-400">{k}</span>=
                                <span className="text-emerald-300">{v}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add / Edit Connection String Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-xl shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center space-x-2">
              <Link2 className="w-5 h-5 text-indigo-400" />
              <span>{editingItem ? 'Edit Connection String' : 'Add Connection String'}</span>
            </h3>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              {/* Presets dropdown */}
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Quick Preset Templates</label>
                <select
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  defaultValue=""
                >
                  <option value="" disabled>
                    -- Select a connection string preset template --
                  </option>
                  {presets.map((p, idx) => (
                    <option key={idx} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Connection String Address / URI (Supports /3, /7, /8, /9 subobjects & °0-360 modifiers)
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://+15550199283@whatsapp.net/7°180 or user@email.host/service.social/3°90 or $me/3°120"
                  value={formRawString}
                  onChange={(e) => setFormRawString(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              {/* Live Parser Preview */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-indigo-400 block">
                  Live Connection String Parser Inspection:
                </span>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500">Scheme:</span>{' '}
                    <span className="text-indigo-300">{liveParsed.scheme || '<none>'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Subobject:</span>{' '}
                    <span className="text-pink-300">{liveParsed.fractionalSubobject || '<full>'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Degree Mod:</span>{' '}
                    <span className="text-cyan-300">
                      {liveParsed.degreeModifier !== undefined ? `°${liveParsed.degreeModifier}` : '<none>'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Label Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WhatsApp Ingress Subobject /7°180"
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ServiceCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="whatsapp">WhatsApp (https://+number@whatsapp.net/7°180)</option>
                    <option value="social_email">Social Email (user@email.host/service.social/3°90)</option>
                    <option value="self">Self Variable ($me/3°120)</option>
                    <option value="ivc_protocol">IVC Protocol (ivc://.../9°360)</option>
                    <option value="grpc">gRPC Mesh (grpc://...)</option>
                    <option value="websocket">WebSocket (wss://...)</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  placeholder="Provide details about what this service or addressable connection string is used for..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg cursor-pointer shadow"
                >
                  {editingItem ? 'Save Changes' : 'Add Connection String'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
