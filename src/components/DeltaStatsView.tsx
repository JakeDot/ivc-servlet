import React from 'react';
import { DeltaEventStats } from '../types/ivc';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Clock,
  AlertTriangle,
  Zap,
  HardDrive,
} from 'lucide-react';

interface DeltaStatsViewProps {
  currentStats: DeltaEventStats | null;
  history: DeltaEventStats[];
  objectName: string;
}

export const DeltaStatsView: React.FC<DeltaStatsViewProps> = ({
  currentStats,
  history,
  objectName,
}) => {
  if (!currentStats) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400">
        No ∆event statistics captured yet. Fire IVC service calls to trigger evaluation window deltas.
      </div>
    );
  }

  const renderDeltaBadge = (
    deltaValue: number,
    unit: string = '',
    invertColor: boolean = false
  ) => {
    const isZero = Math.abs(deltaValue) < 0.001;
    const isPositive = deltaValue > 0;

    let bgClass = 'bg-slate-800 text-slate-400 border-slate-700';
    let Icon = Minus;

    if (!isZero) {
      const isGood = invertColor ? !isPositive : isPositive;
      if (isGood) {
        bgClass = 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80';
      } else {
        bgClass = 'bg-rose-950/80 text-rose-400 border-rose-800/80';
      }
      Icon = isPositive ? TrendingUp : TrendingDown;
    }

    const formattedVal =
      typeof deltaValue === 'number'
        ? (deltaValue > 0 ? `+${deltaValue}` : `${deltaValue}`)
        : deltaValue;

    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-mono font-medium border ${bgClass}`}>
        <Icon className="w-3 h-3" />
        <span>
          {formattedVal}
          {unit}
        </span>
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-lg space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold">∆Event Metrics ({objectName})</h2>
        </div>
        <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
          Window: {currentStats.periodLabel}
        </span>
      </div>

      {/* Delta KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Delta Call Count */}
        <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
            <span className="flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>∆ Call Volume</span>
            </span>
            {renderDeltaBadge(currentStats.deltaCount)}
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono">
            {currentStats.currentCount} <span className="text-xs text-slate-500 font-normal">calls</span>
          </div>
        </div>

        {/* Delta Avg Latency */}
        <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>∆ Avg Latency</span>
            </span>
            {renderDeltaBadge(currentStats.deltaLatencyMs, 'ms', true)}
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono">
            {currentStats.avgLatencyMs} <span className="text-xs text-slate-500 font-normal">ms</span>
          </div>
        </div>

        {/* Delta Error Rate */}
        <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
            <span className="flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>∆ Error Rate</span>
            </span>
            {renderDeltaBadge(currentStats.deltaErrorRate, '%', true)}
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono">
            {currentStats.errorRatePercent}%
          </div>
        </div>

        {/* Delta Throughput */}
        <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
            <span className="flex items-center space-x-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>∆ Throughput</span>
            </span>
            {renderDeltaBadge(currentStats.deltaThroughputRps, ' rps')}
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono">
            {currentStats.throughputRps} <span className="text-xs text-slate-500 font-normal">req/s</span>
          </div>
        </div>

        {/* Delta Payload Volume */}
        <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-lg">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
            <span className="flex items-center space-x-1">
              <HardDrive className="w-3.5 h-3.5 text-purple-400" />
              <span>∆ Payload Vol</span>
            </span>
            {renderDeltaBadge(currentStats.deltaPayloadBytes, ' B')}
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono">
            {currentStats.totalPayloadBytes} <span className="text-xs text-slate-500 font-normal">bytes</span>
          </div>
        </div>
      </div>

      {/* Historical Delta Trend Table */}
      {history.length > 0 && (
        <div className="pt-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Recent Evaluation Window Deltas
          </h3>
          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/50">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Window</th>
                  <th className="py-2 px-3">∆ Volume</th>
                  <th className="py-2 px-3">∆ Latency</th>
                  <th className="py-2 px-3">∆ Error Rate</th>
                  <th className="py-2 px-3">∆ Throughput</th>
                  <th className="py-2 px-3">∆ Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {history.slice(0, 5).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-slate-300">{item.periodLabel}</td>
                    <td className="py-2 px-3">{renderDeltaBadge(item.deltaCount)}</td>
                    <td className="py-2 px-3">{renderDeltaBadge(item.deltaLatencyMs, 'ms', true)}</td>
                    <td className="py-2 px-3">{renderDeltaBadge(item.deltaErrorRate, '%', true)}</td>
                    <td className="py-2 px-3">{renderDeltaBadge(item.deltaThroughputRps, ' rps')}</td>
                    <td className="py-2 px-3">{renderDeltaBadge(item.deltaPayloadBytes, ' B')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
