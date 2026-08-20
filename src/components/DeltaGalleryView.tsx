import React, { useState } from 'react';
import { DeltaGallery, MediaAttachment, ObjectKind } from '../types/ivc';
import { AudioPlayer, VideoPlayer } from './MediaPlayer';
import {
  Images,
  Music,
  Video,
  Image as ImageIcon,
  Plus,
  X,
  Server,
  User,
  Hash,
  Cpu,
  Layers,
  Share2,
} from 'lucide-react';

interface DeltaGalleryViewProps {
  gallery?: DeltaGallery;
  ownerName: string;
  ownerKind: ObjectKind;
  onAddItem?: (item: MediaAttachment) => void;
}

export const DeltaGalleryView: React.FC<DeltaGalleryViewProps> = ({
  gallery,
  ownerName,
  ownerKind,
  onAddItem,
}) => {
  const [filter, setFilter] = useState<'all' | 'audio' | 'video' | 'image'>('all');
  const [activeMediaModal, setActiveMediaModal] = useState<MediaAttachment | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state for adding media to gallery
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemType, setNewItemType] = useState<'audio' | 'video' | 'image'>('audio');
  const [newItemUrl, setNewItemUrl] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');

  const items = gallery?.items || [];
  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const getOwnerIcon = (kind: ObjectKind) => {
    switch (kind) {
      case 'social_connector':
        return <Share2 className="w-4 h-4 text-purple-400" />;
      case 'channel':
        return <Hash className="w-4 h-4 text-cyan-400" />;
      case 'user':
        return <User className="w-4 h-4 text-emerald-400" />;
      case 'server':
        return <Server className="w-4 h-4 text-amber-400" />;
      case 'servlet':
        return <Cpu className="w-4 h-4 text-indigo-400" />;
      default:
        return <Layers className="w-4 h-4 text-indigo-400" />;
    }
  };

  const handleCreateMediaItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle) return;

    let defaultUrl = newItemUrl;
    if (!defaultUrl) {
      if (newItemType === 'audio') {
        defaultUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3';
      } else if (newItemType === 'video') {
        defaultUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      } else {
        defaultUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
      }
    }

    const newItem: MediaAttachment = {
      id: `media-custom-${Date.now()}`,
      type: newItemType,
      title: newItemTitle,
      url: defaultUrl,
      description: newItemDesc || 'User uploaded ∆gallery media attachment.',
      createdAt: Date.now(),
    };

    if (onAddItem) {
      onAddItem(newItem);
    }

    setShowAddModal(false);
    setNewItemTitle('');
    setNewItemUrl('');
    setNewItemDesc('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      {/* Gallery Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-950/80 border border-indigo-800 rounded-lg text-indigo-400">
            <Images className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-1.5">
                <span>∆gallery Subobject</span>
              </h2>
              <span className="text-xs font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full flex items-center space-x-1">
                {getOwnerIcon(ownerKind)}
                <span className="capitalize">{ownerKind.replace('_', ' ')}: {ownerName}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {gallery?.description || `Associated media subobjects attached to ${ownerName}`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Media to ∆gallery</span>
        </button>
      </div>

      {/* Media Type Filter Tabs */}
      <div className="flex space-x-2 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-indigo-950 border border-indigo-700 text-indigo-300'
              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Images className="w-3.5 h-3.5" />
          <span>All Media ({items.length})</span>
        </button>

        <button
          onClick={() => setFilter('audio')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            filter === 'audio'
              ? 'bg-indigo-950 border border-indigo-700 text-indigo-300'
              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Music className="w-3.5 h-3.5 text-indigo-400" />
          <span>Audio ({items.filter((i) => i.type === 'audio').length})</span>
        </button>

        <button
          onClick={() => setFilter('video')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            filter === 'video'
              ? 'bg-indigo-950 border border-indigo-700 text-indigo-300'
              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Video className="w-3.5 h-3.5 text-rose-400" />
          <span>Video ({items.filter((i) => i.type === 'video').length})</span>
        </button>

        <button
          onClick={() => setFilter('image')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            filter === 'image'
              ? 'bg-indigo-950 border border-indigo-700 text-indigo-300'
              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>Images ({items.filter((i) => i.type === 'image').length})</span>
        </button>
      </div>

      {/* Media Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-8 text-center text-slate-500 text-xs">
          No {filter !== 'all' ? filter : ''} media items present in this ∆gallery subobject.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                {/* Inline media preview card */}
                {item.type === 'audio' && (
                  <div className="p-3 bg-slate-900 border border-indigo-900/60 rounded-lg flex items-center space-x-3">
                    <div className="p-2 bg-indigo-950 text-indigo-400 rounded-lg">
                      <Music className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-slate-200 truncate">{item.title}</h4>
                      <p className="text-[10px] text-indigo-400 font-mono">Audio Track</p>
                    </div>
                  </div>
                )}

                {item.type === 'video' && (
                  <div
                    onClick={() => setActiveMediaModal(item)}
                    className="relative bg-black rounded-lg aspect-video overflow-hidden border border-slate-800 cursor-pointer group"
                  >
                    <img
                      src={item.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="p-3 bg-rose-600/90 text-white rounded-full shadow-lg group-hover:scale-110 transition-transform">
                        <Video className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                )}

                {item.type === 'image' && (
                  <div
                    onClick={() => setActiveMediaModal(item)}
                    className="bg-black rounded-lg aspect-video overflow-hidden border border-slate-800 cursor-pointer group"
                  >
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-200 truncate max-w-[200px]">
                      {item.title}
                    </h3>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase ${
                        item.type === 'audio'
                          ? 'bg-indigo-950 text-indigo-400 border-indigo-900'
                          : item.type === 'video'
                          ? 'bg-rose-950 text-rose-400 border-rose-900'
                          : 'bg-emerald-950 text-emerald-400 border-emerald-900'
                      }`}
                    >
                      {item.type}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setActiveMediaModal(item)}
                className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {item.type === 'audio' ? 'Play Audio Track' : item.type === 'video' ? 'Play Video Clip' : 'View Image'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Media Playback Modal */}
      {activeMediaModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-2xl shadow-2xl relative space-y-4">
            <button
              onClick={() => setActiveMediaModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 truncate pr-8">
                {activeMediaModal.title}
              </h3>
            </div>

            <div className="py-2">
              {activeMediaModal.type === 'audio' && <AudioPlayer media={activeMediaModal} />}
              {activeMediaModal.type === 'video' && <VideoPlayer media={activeMediaModal} />}
              {activeMediaModal.type === 'image' && (
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center max-h-[450px]">
                  <img
                    src={activeMediaModal.url}
                    alt={activeMediaModal.title}
                    className="max-h-[450px] w-auto object-contain"
                  />
                </div>
              )}
            </div>

            {activeMediaModal.description && (
              <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
                {activeMediaModal.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Add Media Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              <span>Add Media to ∆gallery ({ownerName})</span>
            </h3>

            <form onSubmit={handleCreateMediaItem} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Media Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diagnostic Audio Memo"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Media Type</label>
                <select
                  value={newItemType}
                  onChange={(e) => setNewItemType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="audio">Audio Track</option>
                  <option value="video">Video Clip</option>
                  <option value="image">Image File</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Media URL (Leave blank for sample)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newItemUrl}
                  onChange={(e) => setNewItemUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  placeholder="Brief description of media..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 h-20"
                />
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
                  Add Media
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
