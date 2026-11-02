import React, { useEffect, useState } from 'react';

interface VintageLighterProps {
  stage: 'hidden' | 'entering' | 'striking' | 'ignited' | 'burning' | 'exiting';
  lighterPos: { x: number; y: number };
}

export const VintageLighter: React.FC<VintageLighterProps> = ({ stage, lighterPos }) => {
  const [flickerOffset, setFlickerOffset] = useState({ scaleX: 1, scaleY: 1, skew: 0 });

  useEffect(() => {
    if (stage !== 'ignited' && stage !== 'burning') return;

    let animId: number;
    const animateFlame = () => {
      const time = performance.now() * 0.015;
      const sx = 0.94 + Math.sin(time * 3.1) * 0.08 + (Math.random() - 0.5) * 0.05;
      const sy = 0.96 + Math.cos(time * 2.7) * 0.12 + (Math.random() - 0.5) * 0.07;
      const sk = Math.sin(time * 1.9) * 4 + (Math.random() - 0.5) * 2;
      setFlickerOffset({ scaleX: sx, scaleY: sy, skew: sk });
      animId = requestAnimationFrame(animateFlame);
    };

    animId = requestAnimationFrame(animateFlame);
    return () => cancelAnimationFrame(animId);
  }, [stage]);

  if (stage === 'hidden') return null;

  const isLidOpen = stage !== 'entering';
  const isFlameOn = stage === 'ignited' || stage === 'burning';
  const isStriking = stage === 'striking';

  return (
    <div
      className="fixed z-40 pointer-events-none transition-all duration-700 ease-out"
      style={{
        left: `${lighterPos.x}px`,
        top: `${lighterPos.y}px`,
        transform: `translate(-50%, -50%) ${
          stage === 'entering'
            ? 'translateY(80px) rotate(-10deg) scale(0.85) opacity-0'
            : stage === 'exiting'
            ? 'translateY(120px) rotate(8deg) scale(0.8) opacity-0'
            : 'translateY(0) rotate(0deg) scale(1)'
        }`,
        opacity: stage === 'entering' || stage === 'exiting' ? 0 : 1,
      }}
    >
      {/* Dynamic warm radial glow from the flame */}
      {isFlameOn && (
        <div
          className="absolute -top-32 -left-32 w-80 h-80 rounded-full pointer-events-none transition-opacity duration-300"
          style={{
            background: 'radial-gradient(circle, rgba(255, 140, 30, 0.45) 0%, rgba(255, 80, 10, 0.18) 45%, transparent 70%)',
            transform: `scale(${flickerOffset.scaleY * 1.1})`,
            filter: 'blur(20px)',
          }}
        />
      )}

      {/* Lighter Body & Anatomy */}
      <div className="relative w-24 h-36 filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.95)]">
        {/* Flame on the wick */}
        {isFlameOn && (
          <div
            className="absolute -top-24 left-[38px] w-8 h-24 origin-bottom transition-transform duration-75"
            style={{
              transform: `scale(${flickerOffset.scaleX}, ${flickerOffset.scaleY}) skewX(${flickerOffset.skew}deg)`,
            }}
          >
            {/* Outer flame halo */}
            <div
              className="absolute inset-0 rounded-[50%_50%_35%_35%] filter blur-[2px]"
              style={{
                background: 'linear-gradient(to top, rgba(255, 60, 0, 0.95) 0%, rgba(255, 165, 0, 0.9) 60%, rgba(255, 240, 150, 0.98) 95%)',
                boxShadow: '0 0 30px #ff6a00, 0 0 50px #ff3800',
              }}
            />
            {/* Inner intense flame core */}
            <div
              className="absolute bottom-1 left-1.5 w-5 h-16 rounded-[50%_50%_40%_40%]"
              style={{
                background: 'linear-gradient(to top, #1a73e8 0%, #ffbe0b 35%, #ffffff 100%)',
              }}
            />
            {/* Blue base */}
            <div
              className="absolute -bottom-1 left-2 w-4 h-5 rounded-full filter blur-[1px]"
              style={{
                background: 'radial-gradient(circle, #3a86ff 0%, #0044ff 70%, transparent 100%)',
              }}
            />
          </div>
        )}

        {/* Flint sparks burst during strike */}
        {isStriking && (
          <div className="absolute -top-10 left-8 pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * Math.PI * 1.5 - Math.PI * 0.75;
              const dist = 25 + (i % 4) * 12;
              const x = Math.cos(angle) * dist;
              const y = Math.sin(angle) * dist;
              return (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-yellow-100 rounded-full shadow-[0_0_8px_#ffeb3b]"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    opacity: 0.9,
                    animation: `sparkFade 0.25s ease-out forwards ${i * 0.02}s`,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Flip Lid */}
        <div
          className="absolute -top-12 left-0 w-24 h-14 origin-bottom-left transition-transform duration-300 ease-out"
          style={{
            transform: isLidOpen ? 'rotate(-115deg) translate(-2px, -6px)' : 'rotate(0deg)',
          }}
        >
          {/* Lid shell */}
          <div
            className="w-full h-full rounded-t-xl border border-[#a88a58] relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #c7a76c 0%, #856736 40%, #e0c285 70%, #634b23 100%)',
              boxShadow: 'inset 0 2px 4px rgba(255, 240, 200, 0.4), inset 0 -2px 6px rgba(0, 0, 0, 0.7)',
            }}
          >
            {/* Lid engraving / brushed texture */}
            <div className="absolute inset-0 opacity-25 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,0.4)_3px)]" />
            <div className="absolute top-2 left-3 right-3 h-[1px] bg-[#ffdca8] opacity-40" />
          </div>
        </div>

        {/* Chimney / Windguard with air holes */}
        <div
          className="absolute -top-8 left-4 w-16 h-10 rounded-t border-t border-x border-[#5c4a2a] overflow-hidden"
          style={{
            background: 'linear-gradient(to right, #403623 0%, #6d5b3c 45%, #8f7952 55%, #3d321d 100%)',
          }}
        >
          {/* Air holes grid */}
          <div className="grid grid-cols-4 gap-1.5 p-1.5 opacity-80">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-[#15120c] shadow-[inset_0_1px_2px_rgba(0,0,0,0.9)]" />
            ))}
          </div>

          {/* Wick */}
          <div className="absolute bottom-0 left-7 w-2 h-4 bg-[#e8dec8] rounded-t-sm shadow-[0_0_2px_rgba(0,0,0,0.8)]">
            <div className="w-full h-1.5 bg-[#2b251e] rounded-t-sm" />
          </div>

          {/* Flint spark wheel */}
          <div
            className="absolute top-1 right-1 w-4 h-6 rounded-sm border border-[#2a2215] shadow-inner"
            style={{
              background: 'repeating-linear-gradient(0deg, #595143, #595143 2px, #262118 3px)',
            }}
          />
        </div>

        {/* Lighter Bottom Main Casing */}
        <div
          className="relative w-full h-full rounded-b-xl border border-[#b89860] overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #c4a46a 0%, #7d602f 35%, #dfc084 65%, #59421c 100%)',
            boxShadow: 'inset 0 3px 6px rgba(255, 240, 200, 0.45), inset 0 -3px 8px rgba(0, 0, 0, 0.8)',
          }}
        >
          {/* Brushed metal grain */}
          <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,0.3)_3px)]" />

          {/* Art Deco Solitary Inscription */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none opacity-40">
            <div className="text-[8px] font-cinzel tracking-[0.25em] text-[#2c1f0f] uppercase font-bold">
              1940
            </div>
            <div className="w-8 h-[1px] bg-[#2c1f0f] my-1" />
            <div className="text-[7px] font-cinzel tracking-[0.15em] text-[#2c1f0f]">
              SOLITUDE
            </div>
          </div>

          {/* Hinge on the left */}
          <div className="absolute -left-1 top-2 w-2 h-5 rounded-r bg-[#524125] border-r border-[#8f7445]" />
        </div>
      </div>
    </div>
  );
};
