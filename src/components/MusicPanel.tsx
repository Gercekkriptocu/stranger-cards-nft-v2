'use client'
import { useState, useRef, useEffect } from 'react';

// YouTube Player interface
interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (volume: number) => void;
  getVolume: () => number;
}

export default function MusicPanel(): JSX.Element {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const playerRef = useRef<YTPlayer | null>(null);

  // Get YouTube player reference
  useEffect(() => {
    const findPlayer = (): void => {
      const player = (window as any).youtubePlayer as YTPlayer | undefined;
      if (player) {
        playerRef.current = player;
        console.log('🎵 Music panel connected to YouTube player');
      } else {
        setTimeout(findPlayer, 200);
      }
    };

    const timeout = setTimeout(findPlayer, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  const toggleMute = (): void => {
    if (!playerRef.current) {
      console.warn('⚠️ YouTube player not ready');
      return;
    }

    try {
      if (isMuted) {
        // Unmute
        playerRef.current.unMute();
        playerRef.current.setVolume(100);
        playerRef.current.playVideo();
        setIsMuted(false);
        console.log('🔊 Unmuted - volume set to 100%');
      } else {
        // Mute
        playerRef.current.mute();
        setIsMuted(true);
        console.log('🔇 Muted');
      }
    } catch (err) {
      console.error('❌ Failed to toggle mute:', err);
    }
  };

  return (
    <div className="fixed bottom-3 right-3 z-50">
      {/* Simple mute/unmute button */}
      <button
        onClick={toggleMute}
        className="w-10 h-10 rounded-full bg-red-900/80 hover:bg-red-800 border-2 border-red-600 text-white shadow-[0_0_16px_rgba(231,29,54,0.6)] hover:shadow-[0_0_24px_rgba(231,29,54,0.9)] transition-all duration-300 flex items-center justify-center text-xl backdrop-blur-sm"
        title={isMuted ? 'Unmute Music' : 'Mute Music'}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
    </div>
  );
}
