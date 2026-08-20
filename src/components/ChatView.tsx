import React, { useState } from 'react';
import { ChatMessage, MediaAttachment } from '../types/ivc';
import { AudioPlayer, VideoPlayer } from './MediaPlayer';
import {
  MessageSquare,
  Send,
  Paperclip,
  Music,
  Video,
  Image as ImageIcon,
  X,
  User,
  Bot,
} from 'lucide-react';

interface ChatViewProps {
  messages: ChatMessage[];
  channelName: string;
  onSendMessage: (content: string, attachments?: MediaAttachment[]) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  channelName,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<MediaAttachment[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && pendingAttachments.length === 0) return;

    onSendMessage(inputText, pendingAttachments.length > 0 ? pendingAttachments : undefined);
    setInputText('');
    setPendingAttachments([]);
    setShowAttachMenu(false);
  };

  const attachSampleAudio = () => {
    const newAudio: MediaAttachment = {
      id: `att-audio-${Date.now()}`,
      type: 'audio',
      title: 'Voice Telemetry Note',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      durationSeconds: 420,
      sizeBytes: 5100000,
      mimeType: 'audio/mp3',
      description: 'Audio attachment recorded in chat.',
      createdAt: Date.now(),
    };
    setPendingAttachments((prev) => [...prev, newAudio]);
    setShowAttachMenu(false);
  };

  const attachSampleVideo = () => {
    const newVideo: MediaAttachment = {
      id: `att-video-${Date.now()}`,
      type: 'video',
      title: 'Cluster Stream Capture',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
      durationSeconds: 15,
      sizeBytes: 3200000,
      mimeType: 'video/mp4',
      description: 'Video recording attached to chat update.',
      createdAt: Date.now(),
    };
    setPendingAttachments((prev) => [...prev, newVideo]);
    setShowAttachMenu(false);
  };

  const attachSampleImage = () => {
    const newImage: MediaAttachment = {
      id: `att-img-${Date.now()}`,
      type: 'image',
      title: 'Analytics Chart',
      url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
      sizeBytes: 420000,
      mimeType: 'image/jpeg',
      description: 'Snapshot chart attachment.',
      createdAt: Date.now(),
    };
    setPendingAttachments((prev) => [...prev, newImage]);
    setShowAttachMenu(false);
  };

  const removePendingAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-[520px] shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-100">
            IVC Live Chat Dispatch <span className="text-indigo-400 font-mono">({channelName})</span>
          </h2>
        </div>
        <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800 font-mono">
          Playback Support Active: Audio & Video
        </span>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin">
        {messages.map((msg) => {
          const isMe = msg.senderName === 'Operator_Nexus' || msg.senderName === 'You';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isMe
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-indigo-300 border border-indigo-900/80'
                }`}
              >
                {isMe ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] space-y-2 ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-center space-x-2 text-[11px] text-slate-400 ${isMe ? 'justify-end' : ''}`}>
                  <span className="font-semibold text-slate-200">{msg.senderName}</span>
                  <span>•</span>
                  <span className="font-mono">{formatTimestamp(msg.timestamp)}</span>
                </div>

                {/* Message Body */}
                <div
                  className={`p-3 rounded-xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-indigo-950/80 border border-indigo-800/80 text-indigo-100 rounded-tr-none'
                      : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Attachments rendering */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {msg.attachments.map((att) => (
                      <div key={att.id} className="mt-1">
                        {att.type === 'audio' && <AudioPlayer media={att} />}
                        {att.type === 'video' && <VideoPlayer media={att} />}
                        {att.type === 'image' && (
                          <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-w-sm">
                            <img
                              src={att.url}
                              alt={att.title}
                              className="w-full h-44 object-cover"
                            />
                            <div className="p-2 text-[11px] text-slate-400 font-semibold truncate">
                              {att.title}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending Attachments Bar */}
      {pendingAttachments.length > 0 && (
        <div className="p-2 bg-slate-950 border-t border-slate-800 flex flex-wrap gap-2">
          {pendingAttachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center space-x-1.5 bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs px-2.5 py-1 rounded-lg"
            >
              {att.type === 'audio' && <Music className="w-3.5 h-3.5" />}
              {att.type === 'video' && <Video className="w-3.5 h-3.5" />}
              {att.type === 'image' && <ImageIcon className="w-3.5 h-3.5" />}
              <span className="truncate max-w-[120px]">{att.title}</span>
              <button
                type="button"
                onClick={() => removePendingAttachment(att.id)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 relative">
        {/* Attachment menu popup */}
        {showAttachMenu && (
          <div className="absolute bottom-16 left-3 bg-slate-900 border border-slate-800 rounded-xl p-2 shadow-2xl flex flex-col space-y-1 z-20 text-xs">
            <button
              type="button"
              onClick={attachSampleAudio}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-200 hover:bg-indigo-950 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              <Music className="w-4 h-4 text-indigo-400" />
              <span>Attach Audio Track</span>
            </button>
            <button
              type="button"
              onClick={attachSampleVideo}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-200 hover:bg-rose-950 hover:text-rose-300 transition-colors cursor-pointer"
            >
              <Video className="w-4 h-4 text-rose-400" />
              <span>Attach Video Clip</span>
            </button>
            <button
              type="button"
              onClick={attachSampleImage}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-200 hover:bg-emerald-950 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span>Attach Image File</span>
            </button>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              showAttachMenu
                ? 'bg-indigo-900 border-indigo-700 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Attach Media"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            placeholder="Type IVC dispatch message or attach audio/video..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />

          <button
            type="submit"
            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
