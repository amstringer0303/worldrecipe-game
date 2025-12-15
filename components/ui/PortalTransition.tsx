'use client';

import { useEffect, useState } from 'react';
import { usePortalStore } from '@/lib/store/portalStore';

// ============================================
// Portal Transition Animation Component
// ============================================

type TransitionPhase = 'idle' | 'fadeOut' | 'portal' | 'fadeIn';

interface PortalTransitionProps {
  onTransitionComplete?: () => void;
}

export function PortalTransition({ onTransitionComplete }: PortalTransitionProps) {
  const isTransitioning = usePortalStore((s) => s.isTransitioning);
  const [phase, setPhase] = useState<TransitionPhase>('idle');
  const [opacity, setOpacity] = useState(0);
  
  useEffect(() => {
    if (!isTransitioning) {
      setPhase('idle');
      setOpacity(0);
      return;
    }
    
    // Start transition
    setPhase('fadeOut');
    setOpacity(1);
    
    // Fade out (0.5s)
    const fadeOutTimeout = setTimeout(() => {
      setPhase('portal');
    }, 500);
    
    // Portal effect (0.3s)
    const portalTimeout = setTimeout(() => {
      setPhase('fadeIn');
    }, 800);
    
    // Fade in (0.5s)
    const fadeInTimeout = setTimeout(() => {
      setPhase('idle');
      setOpacity(0);
      usePortalStore.getState().setTransitioning(false);
      onTransitionComplete?.();
    }, 1300);
    
    return () => {
      clearTimeout(fadeOutTimeout);
      clearTimeout(portalTimeout);
      clearTimeout(fadeInTimeout);
    };
  }, [isTransitioning, onTransitionComplete]);
  
  if (phase === 'idle') return null;
  
  return (
    <div 
      className="fixed inset-0 z-[100] pointer-events-none"
      style={{
        opacity,
        transition: phase === 'fadeOut' || phase === 'fadeIn' 
          ? 'opacity 0.5s ease-in-out' 
          : 'none',
      }}
    >
      {/* Dark overlay */}
      <div 
        className="absolute inset-0 bg-black"
        style={{
          opacity: phase === 'fadeOut' || phase === 'fadeIn' ? 0.9 : 0.95,
        }}
      />
      
      {/* Portal effect - swirl animation */}
      {phase === 'portal' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-64 h-64">
            {/* Swirling portal effect */}
            <div 
              className="absolute inset-0 rounded-full border-8 border-purple-500/50"
              style={{
                animation: 'portalSwirl 0.3s ease-in-out',
                transform: 'rotate(180deg) scale(1.5)',
              }}
            />
            <div 
              className="absolute inset-0 rounded-full border-8 border-blue-500/50"
              style={{
                animation: 'portalSwirl 0.3s ease-in-out 0.1s',
                transform: 'rotate(90deg) scale(1.3)',
              }}
            />
            <div 
              className="absolute inset-0 rounded-full border-8 border-cyan-500/50"
              style={{
                animation: 'portalSwirl 0.3s ease-in-out 0.2s',
                transform: 'rotate(0deg) scale(1.1)',
              }}
            />
            
            {/* Center glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-cyan-500/30 blur-xl" />
          </div>
        </div>
      )}
      
      {/* Loading text */}
      {phase === 'portal' && (
        <div className="absolute inset-0 flex items-center justify-center pt-32">
          <p className="text-white text-xl font-medium animate-pulse">
            Traveling through portal...
          </p>
        </div>
      )}
      
      {/* CSS Animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes portalSwirl {
            0% {
              transform: rotate(0deg) scale(0.5);
              opacity: 0;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: rotate(360deg) scale(1.5);
              opacity: 0;
            }
          }
        `
      }} />
    </div>
  );
}
