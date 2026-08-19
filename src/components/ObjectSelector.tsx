import React from 'react';
import { AddressableObject } from '../types/ivc';
import { Server, Activity, AlertCircle, CheckCircle, Plus } from 'lucide-react';

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
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-100 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Server className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold tracking-wide">Addressable Servlet Objects</h2>
        </div>
        <button
          onClick={onAddNewObject}
          className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register Object</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {objects.map((obj) => {
          const isSelected = obj.id === selectedObjectId;
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
                <span className="font-medium text-slate-200 text-sm truncate max-w-[170px]" title={obj.name}>
                  {obj.name}
                </span>
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

              <div className="text-xs text-slate-400 mb-2 truncate">
                <span className="text-slate-500">Servlet:</span> {obj.servletName}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-indigo-300">
                  {obj.protocol}
                </span>
                <span className="font-mono text-slate-400 truncate max-w-[130px]" title={obj.endpointPath}>
                  {obj.endpointPath}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
