'use client';

import { useEffect, useRef, useState } from 'react';
import type { SessionRecording } from '@/lib/types';

interface SessionPlayerProps {
  session: SessionRecording;
  onClose: () => void;
}

export default function SessionPlayer({ session, onClose }: SessionPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!playerRef.current || session.events.length === 0) return;

    // Dynamically import rrweb-player
    import('rrweb-player').then(({ default: rrwebPlayer }) => {
      const playerInstance = new (rrwebPlayer as any)({
        target: playerRef.current!,
        props: {
          events: session.events,
          width: 1024,
          height: 768,
          autoPlay: false,
          speed,
        },
      });

      setPlayer(playerInstance);

      return () => {
        playerInstance.$destroy();
      };
    });
  }, [session.events, speed]);

  const togglePlayPause = () => {
    if (!player) return;
    
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Session Replay
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {session.page_url} • Duration: {formatDuration(session.duration)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Player */}
        <div className="flex-1 overflow-auto p-6 bg-gray-100 dark:bg-gray-950">
          <div 
            ref={playerRef} 
            className="mx-auto"
            style={{ maxWidth: '1024px' }}
          />
        </div>

        {/* Controls */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlayPause}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>

            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={4}>4x</option>
            </select>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            {session.page_count} page{session.page_count !== 1 ? 's' : ''} • {session.events.length} events
          </div>
        </div>
      </div>
    </div>
  );
}
