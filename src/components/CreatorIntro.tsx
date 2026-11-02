import React, { useState, useEffect } from 'react';
import { sound } from '../services/soundEngine';

interface CreatorIntroProps {
  onComplete: () => void;
  hasInteracted: boolean;
  onFirstInteract: () => void;
}

export const CreatorIntro: React.FC<CreatorIntroProps> = ({
  onComplete,
  hasInteracted,
  onFirstInteract,
}) => {
  const [subStage, setSubStage] = useState<'awaiting-interaction' | 'made-by' | 'title' | 'dissolve' | 'done'>('awaiting-interaction');

  const startCinematicFlow = async () => {
    onFirstInteract();
    await sound.init();
    sound.startRain(0.42);
    sound.playThunder(0.85);

    setSubStage('made-by');
  };

  useEffect(() => {
    if (subStage === 'made-by') {
      // Show "MADE BY STEVEN EMAD" for 3.2s, then transition to title
      const timer = setTimeout(() => {
        setSubStage('title');
        sound.playThunder(0.5);
      }, 3400);
      return () => clearTimeout(timer);
    }

    if (subStage === 'title') {
      // Show "I'M ALWAYS ALONE" for 3.6s, then dissolve into pure darkness
      const timer = setTimeout(() => {
        setSubStage('dissolve');
      }, 3800);
      return () => clearTimeout(timer);
    }

    if (subStage === 'dissolve') {
      // Brief darkness breath, then reveal the paper suddenly
      const timer = setTimeout(() => {
        setSubStage('done');
        onComplete();
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [subStage, onComplete]);

  if (subStage === 'done') return null;

  return (
    <div
      onClick={() => {
        if (subStage === 'awaiting-interaction') {
          startCinematicFlow();
        } else {
          // If already started, allow fast skip on click
          setSubStage('done');
          onComplete();
        }
      }}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden transition-opacity duration-1000"
    >
      {/* Subtle Rain Atmosphere Particle Canvas in the Background */}
      <div className="absolute inset-0 cinematic-vignette pointer-events-none" />

      {/* Screen 0: Initial Touch to awaken audio & cinematic flow */}
      {subStage === 'awaiting-interaction' && (
        <div className="flex flex-col items-center text-center px-6 animate-pulse">
          <p className="font-cinzel text-xs sm:text-sm tracking-[0.45em] text-[#9c8a74] uppercase mb-4">
            A Cinematic Art Installation
          </p>
          <div className="w-12 h-[1px] bg-[#5c4a36] my-2" />
          <p className="font-arabic text-sm sm:text-base text-[#b8a48e] tracking-wide mt-2">
            انقر للدخول إلى الصمت
          </p>
          <span className="text-[11px] font-cinzel tracking-[0.25em] text-[#5e5041] uppercase mt-6">
            [ Click anywhere to enter ]
          </span>
        </div>
      )}

      {/* Screen 1: MADE BY STEVEN EMAD */}
      {subStage === 'made-by' && (
        <div className="flex flex-col items-center text-center px-6 transition-all duration-1000 ease-out">
          <span className="text-[10px] sm:text-xs font-cinzel tracking-[0.5em] text-[#73604d] uppercase mb-3">
            An Original Work
          </span>
          <h1
            className="font-cinzel text-2xl sm:text-4xl md:text-5xl font-semibold tracking-[0.35em] text-[#e8dac6] uppercase"
            style={{
              textShadow: '0 0 35px rgba(232, 218, 198, 0.25), 0 0 80px rgba(180, 140, 95, 0.15)',
              animation: 'fadeInSlow 1.8s ease-out forwards',
            }}
          >
            MADE BY STEVEN EMAD
          </h1>
          <div className="w-16 h-[1px] bg-[#6e563b] mt-6 opacity-60" />
        </div>
      )}

      {/* Screen 2: I'M ALWAYS ALONE */}
      {subStage === 'title' && (
        <div className="flex flex-col items-center text-center px-6 transition-all duration-1000 ease-out">
          <h1
            className="font-cinzel text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-[0.4em] text-[#f2e6d6] uppercase"
            style={{
              textShadow: '0 0 45px rgba(242, 230, 214, 0.3), 0 0 100px rgba(150, 110, 70, 0.2)',
              animation: 'fadeInSlow 2s ease-out forwards',
            }}
          >
            I'M ALWAYS ALONE
          </h1>
          <p className="font-arabic text-sm sm:text-lg text-[#99826a] tracking-widest mt-6 opacity-75">
            أنا دائماً وحدي
          </p>
        </div>
      )}

      {/* Screen 3: Dissolve breath */}
      {subStage === 'dissolve' && (
        <div className="w-full h-full bg-black transition-opacity duration-1000" />
      )}

      {/* Discreet Skip Prompt */}
      {subStage !== 'awaiting-interaction' && (
        <div className="absolute bottom-8 text-center pointer-events-none opacity-25 hover:opacity-70 transition-opacity">
          <span className="text-[10px] font-cinzel tracking-[0.3em] text-[#a18a72] uppercase">
            Click to Skip
          </span>
        </div>
      )}
    </div>
  );
};
