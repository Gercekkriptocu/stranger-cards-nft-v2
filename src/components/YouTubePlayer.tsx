'use client'
import { useEffect, useRef } from 'react';

// YouTube IFrame Player API types
declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: {
      Player: new (element: string | HTMLElement, config: YTPlayerConfig) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
  }
}

interface YTPlayerConfig {
  videoId: string;
  playerVars?: Record<string, number | string>;
  events?: {
    onReady?: (event: { target: YTPlayer }) => void;
    onStateChange?: (event: { data: number; target: YTPlayer }) => void;
  };
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  destroy: () => void;
}

const YOUTUBE_VIDEO_ID = 'HYwNM1t9ltI'; // YouTube video ID from the link

export default function YouTubePlayer(): JSX.Element {
  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load YouTube IFrame API
    const loadYouTubeAPI = (): void => {
      // Check if API is already loaded
      if (window.YT && window.YT.Player) {
        initializePlayer();
        return;
      }

      // Load the API script
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      
      // Set callback for when API is ready
      window.onYouTubeIframeAPIReady = () => {
        console.log('🎵 YouTube API loaded');
        initializePlayer();
      };

      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
    };

    const initializePlayer = (): void => {
      if (!window.YT || !containerRef.current) {
        console.warn('⚠️ YouTube API or container not ready');
        return;
      }

      console.log('🎬 Initializing YouTube player...');

      try {
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: YOUTUBE_VIDEO_ID,
          playerVars: {
            autoplay: 1,
            loop: 1,
            playlist: YOUTUBE_VIDEO_ID, // Required for looping
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            showinfo: 0,
          },
          events: {
            onReady: (event) => {
              console.log('✅ YouTube player ready - attempting aggressive autoplay');
              const player = event.target;
              
              // Set volume to 100%
              player.setVolume(100);
              
              // ULTRA AGGRESSIVE: Multiple play attempts
              const attemptPlay = () => {
                try {
                  player.playVideo();
                  console.log('🎵 Play attempt...');
                } catch (err) {
                  console.warn('Play attempt failed:', err);
                }
              };
              
              // Multiple attempts at different intervals
              attemptPlay();
              setTimeout(attemptPlay, 100);
              setTimeout(attemptPlay, 300);
              setTimeout(attemptPlay, 500);
              setTimeout(attemptPlay, 1000);
              setTimeout(attemptPlay, 1500);
              setTimeout(attemptPlay, 2000);
              setTimeout(attemptPlay, 3000);
            },
            onStateChange: (event) => {
              if (event.data === window.YT!.PlayerState.ENDED) {
                console.log('🔄 Video ended - replaying...');
                event.target.playVideo();
              } else if (event.data === window.YT!.PlayerState.PLAYING) {
                console.log('✅ Music started playing!');
              } else if (event.data === window.YT!.PlayerState.PAUSED) {
                console.log('⏸️ Music paused');
              }
            },
          },
        });

        // Store player reference globally for MusicPanel
        (window as any).youtubePlayer = playerRef.current;
      } catch (err) {
        console.error('❌ Failed to initialize YouTube player:', err);
      }
    };

    // User interaction listener for aggressive autoplay
    const handleInteraction = (): void => {
      if (playerRef.current) {
        console.log('🖱️ User interaction detected -> Playing Music IMMEDIATELY');
        try {
          playerRef.current.setVolume(100);
          playerRef.current.playVideo();
        } catch (err) {
          console.warn('Play on interaction failed:', err);
        }
        
        // Remove listeners after first interaction
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('touchstart', handleInteraction);
        document.removeEventListener('mousemove', handleInteraction);
        document.removeEventListener('scroll', handleInteraction);
        document.removeEventListener('keydown', handleInteraction);
        window.removeEventListener('focus', handleInteraction);
      }
    };

    // Add interaction listeners
    document.addEventListener('click', handleInteraction, { passive: true });
    document.addEventListener('touchstart', handleInteraction, { passive: true });
    document.addEventListener('mousemove', handleInteraction, { passive: true });
    document.addEventListener('scroll', handleInteraction, { passive: true });
    document.addEventListener('keydown', handleInteraction, { passive: true });
    window.addEventListener('focus', handleInteraction);

    // Start loading
    loadYouTubeAPI();

    return () => {
      // Cleanup
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('mousemove', handleInteraction);
      document.removeEventListener('scroll', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('focus', handleInteraction);
      
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (err) {
          console.warn('Failed to destroy player:', err);
        }
      }
      
      // Clean up global reference
      delete (window as any).youtubePlayer;
    };
  }, []);

  return (
    <div style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
      {/* Hidden YouTube player container */}
      <div ref={containerRef} id="youtube-player"></div>
    </div>
  );
}
