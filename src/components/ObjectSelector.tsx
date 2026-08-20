import React from 'react';
import { AddressableObject } from '../types/ivc';
import { parseConnectionString } from '../services/connectionStringParser';
import { Server, User, Hash, Cpu, AlertCircle, CheckCircle, Plus, Images, Share2, Compass, PieChart } from 'lucide-react';

interface ObjectSelectorProps {
  objects: AddressableObject[];
  selectedObjectId: string;
  onSelectObject: (id: string) => void;
  onAddNewObject: () => void;
}

export const ObjectSelector: React.FC<ObjectSelectorProps> = ({
  objects,
  selectedObjectId,
  onSelectObject,
  onAddNewObject,
}) => {
  const getKindBadge = (kind: AddressableObject['kind'], connectorAddress?: string) => {
    switch (kind) {
      case 'social_connector':
        return (
          <span className="text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800/80 px-2 py-0.5 rounded flex items-center space-x-1">
            <Share2 className="w-2.5 h-2.5 text-purple-400" />
            <span className="truncate max-w-[120px]">Social: {connectorAddress || 'Connector'}</span>
          </span>
        );
      case 'channel':
        return (
          <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/80 px-2 py-0.5 rounded flex items-center space-x-1">
            <Hash className="w-2.5 h-2.5" />
            <span>Channel</span>
          </span>
        );
      case 'user':
        return (
          <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded flex items-center space-x-1">
            <User className="w-2.5 h-2.5" />
            <span>User</span>
          </span>
        );
      case 'server':
        return (
          <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded flex items-center space-x-1">
            <Server className="w-2.5 h-2.5" />
            <span>Server</span>
          </span>
        );
      case 'servlet':
        return (
          <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/80 px-2 py-0.5 rounded flex items-center space-x-1">
            <Cpu className="w-2.5 h-2.5" />
            <span>Servlet</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-100 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Server className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold tracking-wide">
            Addressable Objects, Fractional Subobjects (/3,/7/8/9°180) & ∆galleries
          </h2>
        </div>
        <button
          onClick={onAddNewObject}
          className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register Object / Social Connector</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {objects.map((obj) => {
          const isSelected = obj.id === selectedObjectId;
          const mediaCount = obj.deltaGallery?.items.length || 0;
          const parsedAddress = obj.connectorAddress ? parseConnectionString(obj.connectorAddress) : null;

          return (
            <div
              key={obj.id}
              onClick={() => onSelectObject(obj.id)}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-slate-800/90 shadow-md ring-1 ring-indigo-500'
                  : 'border-slate-800 bg-slate-950/60 hover:bg-slate-850 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center space-x-2 truncate">
                  <span className="font-medium text-slate-200 text-sm truncate max-w-[150px]" title={obj.name}>
                    {obj.name}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1 ${
                    obj.status === 'ACTIVE'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : obj.status === 'DEGRADED'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {obj.status === 'ACTIVE' ? (
                    <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                  ) : (
                    <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                  )}
                  {obj.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <div className="truncate max-w-[150px]">
                  <span className="text-slate-500">Servlet:</span> {obj.servletName}
                </div>
                {getKindBadge(obj.kind, obj.connectorAddress)}
              </div>

              {/* Subobject & Degree modifier indicators */}
              {parsedAddress && (parsedAddress.fractionalSubobject || parsedAddress.degreeModifier !== undefined) && (
                <div className="flex items-center space-x-2 mb-2">
                  {parsedAddress.fractionalSubobject && (
                    <span className="inline-flex items-center space-x-1 text-[10px] font-mono bg-pink-950 text-pink-300 border border-pink-800/80 px-1.5 py-0.5 rounded">
                      <PieChart className="w-2.5 h-2.5 text-pink-400" />
                      <span>{parsedAddress.fractionalSubobject}</span>
                    </span>
                  )}
                  {parsedAddress.degreeModifier !== undefined && (
                    <span className="inline-flex items-center space-x-1 text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/80 px-1.5 py-0.5 rounded">
                      <Compass className="w-2.5 h-2.5 text-cyan-400" />
                      <span>°{parsedAddress.degreeModifier}</span>
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-indigo-300">
                  {obj.protocol}
                </span>

                <span className="flex items-center space-x-1 font-mono text-[10px] text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-900/80">
                  <Images className="w-3 h-3" />
                  <span>∆gallery ({mediaCount})</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
