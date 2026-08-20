import React, { useState } from 'react';
import { FlowInfo, FlowStep } from '../types/ivc';
import {
  GitCommit,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Database,
  Globe,
  Cpu,
  Layers,
  Code2,
} from 'lucide-react';

interface FlowTraceViewProps {
  flows: FlowInfo[];
}

export const FlowTraceView: React.FC<FlowTraceViewProps> = ({ flows }) => {
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(
    flows.length > 0 ? flows[0].traceId : null
  );

  const activeFlow = flows.find((f) => f.traceId === selectedTraceId) || flows[0];

  if (!flows || flows.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400">
        No flow execution traces available for this object yet.
      </div>
    );
  }

  const getNodeIcon = (nodeType: FlowStep['nodeType']) => {
    switch (nodeType) {
      case 'IVC_GATEWAY':
        return <Globe className="w-4 h-4 text-indigo-400" />;
      case 'SERVLET_CONTAINER':
        return <Layers className="w-4 h-4 text-cyan-400" />;
      case 'ADDRESSABLE_OBJECT':
        return <Cpu className="w-4 h-4 text-purple-400" />;
      case 'DATABASE':
        return <Database className="w-4 h-4 text-amber-400" />;
      default:
        return <Code2 className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center space-x-2">
          <GitCommit className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold">IVC Execution Flow Info</h2>
        </div>
        <span className="text-xs text-slate-400">
          Showing {flows.length} recent external service trace flows
        </span>
      </div>

      {/* Trace selector bar */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin">
        {flows.map((f) => {
          const isSelected = f.traceId === activeFlow?.traceId;
          return (
            <button
              key={f.traceId}
              onClick={() => setSelectedTraceId(f.traceId)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${f.status === 'SUCCESS' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              <span>{f.traceId}</span>
              <span className="text-[10px] text-slate-500">({f.totalDurationMs}ms)</span>
            </button>
          );
        })}
      </div>

      {/* Selected Flow Overview */}
      {activeFlow && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-4">
          <div className="flex flex-wrap justify-between items-center text-xs border-b border-slate-800/80 pb-3 gap-2">
            <div>
              <span className="text-slate-500">Call ID:</span>{' '}
              <span className="font-mono text-slate-200">{activeFlow.callId}</span>
              <span className="mx-2 text-slate-700">|</span>
              <span className="text-slate-500">Target Object:</span>{' '}
              <span className="font-semibold text-indigo-300">{activeFlow.targetObjectName}</span>
              <span className="mx-2 text-slate-700">|</span>
              <span className="text-slate-500">Servlet:</span>{' '}
              <span className="font-mono text-slate-300">{activeFlow.servletName}</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1 font-mono text-slate-300">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{activeFlow.totalDurationMs} ms</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  activeFlow.status === 'SUCCESS'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}
              >
                {activeFlow.status}
              </span>
            </div>
          </div>

          {/* Interactive Flow Sequence Visualization */}
          <div className="relative pt-2">
            <div className="space-y-3">
              {activeFlow.steps.map((step, index) => (
                <div key={step.stepId} className="flex items-start space-x-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`p-2 rounded-full border ${
                        step.status === 'SUCCESS'
                          ? 'bg-slate-900 border-indigo-500/50 text-indigo-400'
                          : 'bg-rose-950 border-rose-800 text-rose-400'
                      }`}
                    >
                      {getNodeIcon(step.nodeType)}
                    </div>
                    {index < activeFlow.steps.length - 1 && (
                      <div className="w-0.5 h-8 bg-slate-800 my-1" />
                    )}
                  </div>

                  <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          Step {step.sequence}
                        </span>
                        <span className="font-semibold text-slate-200">{step.nodeName}</span>
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                        <span className="text-indigo-300 font-medium">{step.action}</span>
                      </div>
                      <span className="font-mono text-slate-400">{step.durationMs} ms</span>
                    </div>

                    <p className="text-slate-400 text-xs mb-1.5">{step.details}</p>

                    {step.payloadSnippet && (
                      <pre className="mt-2 p-2 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-300 font-mono overflow-x-auto">
                        {step.payloadSnippet}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
