import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Film,
  Music,
} from 'lucide-react';
import { MediaAttachment } from '../types/ivc';

interface AudioPlayerProps {
  media: MediaAttachment;
  compact?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ media, compact = false }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(media.durationSeconds || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (!isNaN(audio.duration)) setDuration(audio.duration);
    };
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => console.log('Audio play blocked:', err));
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const formatTime = (timeInSec: number) => {
    if (isNaN(timeInSec) || timeInSec === 0) return '0:00';
    const minutes = Math.floor(timeInSec / 60);
    const seconds = Math.floor(timeInSec % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className={`bg-slate-900 border border-indigo-900/50 rounded-xl p-3 shadow-md ${compact ? 'max-w-xs' : 'w-full'}`}>
      <audio ref={audioRef} src={media.url} preload="metadata" />

      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-indigo-950 text-indigo-400 border border-indigo-800/80 rounded-lg shrink-0">
          <Music className="w-4 h-4 animate-pulse" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-200 truncate">{media.title}</h4>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-900">
              AUDIO
            </span>
          </div>
          {media.description && (
            <p className="text-[11px] text-slate-400 truncate">{media.description}</p>
          )}

          {/* Time & seek bar */}
          <div className="flex items-center space-x-2 mt-2">
            <button
              onClick={togglePlay}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-colors cursor-pointer shrink-0"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            <span className="text-[10px] font-mono text-slate-400 shrink-0">
              {formatTime(currentTime)}
            </span>

            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />

            <span className="text-[10px] font-mono text-slate-400 shrink-0">
              {formatTime(duration)}
            </span>

            {!compact && (
              <div className="flex items-center space-x-1 shrink-0 ml-1">
                <button
                  onClick={toggleMute}
                  className="text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolume}
                  className="w-12 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface VideoPlayerProps {
  media: MediaAttachment;
  compact?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ media, compact = false }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg ${
        compact ? 'max-w-sm' : 'w-full max-w-xl'
      }`}
    >
      <div className="relative group bg-black aspect-video flex items-center justify-center">
        <video
          ref={videoRef}
          src={media.url}
          poster={media.thumbnailUrl}
          controls
          className="w-full h-full object-contain"
        />

        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center pointer-events-none opacity-90">
          <div className="flex items-center space-x-2">
            <Film className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-semibold text-white truncate max-w-[200px]">{media.title}</span>
          </div>
          <span className="text-[10px] font-mono text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/80">
            VIDEO
          </span>
        </div>
      </div>

      {media.description && (
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          <p className="text-xs text-slate-300">{media.description}</p>
        </div>
      )}
    </div>
  );
};
