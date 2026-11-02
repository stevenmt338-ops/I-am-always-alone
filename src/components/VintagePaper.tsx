import React, { useState, useEffect, useRef } from 'react';

interface VintagePaperProps {
  isBurning: boolean;
  burnProgress: number; // 0 to 1
  isCrumpled: boolean;
  onBurnClick: () => void;
  onPaperBoundsChange: (bounds: DOMRect | null) => void;
  disabled: boolean;
}

export const VintagePaper: React.FC<VintagePaperProps> = ({
  isBurning,
  burnProgress,
  isCrumpled,
  onBurnClick,
  onPaperBoundsChange,
  disabled,
}) => {
  const [text, setText] = useState<string>('');
  const [isRtl, setIsRtl] = useState<boolean>(true);
  const paperRef = useRef<HTMLDivElement | null>(null);

  // Auto-detect direction based on text first character
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    const trimmed = val.trim();
    if (trimmed.length > 0) {
      // Check if first char is Arabic
      const charCode = trimmed.charCodeAt(0);
      const isArabicChar = (charCode >= 0x0600 && charCode <= 0x06FF) || (charCode >= 0x0750 && charCode <= 0x077F);
      setIsRtl(isArabicChar);
    } else {
      setIsRtl(true);
    }
  };

  // Update bounds for lighter & flame alignment
  useEffect(() => {
    const updateBounds = () => {
      if (paperRef.current) {
        onPaperBoundsChange(paperRef.current.getBoundingClientRect());
      }
    };

    updateBounds();
    window.addEventListener('resize', updateBounds);
    window.addEventListener('scroll', updateBounds);
    return () => {
      window.removeEventListener('resize', updateBounds);
      window.removeEventListener('scroll', updateBounds);
    };
  }, [onPaperBoundsChange]);

  // Reset text when a new paper appears (when burning ends)
  useEffect(() => {
    if (!isBurning && !isCrumpled) {
      setText('');
      setIsRtl(true);
    }
  }, [isBurning, isCrumpled]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto px-4 z-20 transition-all duration-1000">
      {/* Solitary Paper Container */}
      <div
        ref={paperRef}
        className={`relative w-full aspect-[4/5] sm:aspect-[3/4] p-8 sm:p-12 transition-all duration-700 ${
          isCrumpled ? 'paper-crumpling' : 'hover:shadow-[0_0_70px_rgba(235,210,165,0.06)]'
        }`}
        style={{
          opacity: burnProgress >= 0.85 ? Math.max(0, 1 - (burnProgress - 0.85) / 0.15) : 1,
        }}
      >
        {/* Paper Surface with Deckled Edge and Aged Grain */}
        <div className="absolute inset-0 vintage-paper-texture deckled-edges transition-all duration-500 overflow-hidden">
          {/* Subtle Vintage Watermark / Solitary Seal in Paper Fiber */}
          <div className="absolute top-6 left-6 pointer-events-none opacity-20 select-none">
            <span className="font-cinzel text-xs tracking-[0.3em] text-[#5c4224] uppercase">
              MCMXXVI
            </span>
          </div>

          {/* Aging Vignette & Fiber Stains */}
          <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_20%_20%,rgba(140,95,50,0.15),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(110,75,35,0.2),transparent_50%)]" />

          {/* Interactive Fountain Pen Writing Area */}
          <div className="relative w-full h-full flex flex-col justify-between pt-4">
            <textarea
              value={text}
              onChange={handleTextChange}
              disabled={disabled || isBurning || isCrumpled}
              dir={isRtl ? 'rtl' : 'ltr'}
              placeholder="اكتب ما يثقلك هنا... دع حزنك، سرّك، أو ما لا تستطيع قوله لأحد ينسكب على هذه الورقة."
              className={`w-full h-full bg-transparent resize-none outline-none vintage-ink-text custom-paper-scroll leading-relaxed text-lg sm:text-xl font-normal transition-opacity duration-300 placeholder:text-[#8a7258] placeholder:opacity-60 placeholder:font-arabic ${
                isRtl ? 'font-arabic text-right' : 'font-caveat text-left text-2xl'
              } ${isBurning ? 'opacity-30' : 'opacity-90'}`}
              style={{
                lineHeight: '32px',
                backgroundAttachment: 'local',
              }}
              spellCheck={false}
              autoFocus
            />

            {/* Micro Ephemeral Note at the very bottom edge of the paper */}
            <div className="pt-2 text-center pointer-events-none select-none opacity-30">
              <span className="text-[11px] font-arabic text-[#6e5132]">
                كلماتك مؤقتة تماماً في ذاكرتك وحدك · لن تُحفظ أو تُنقل لأي مكان
              </span>
            </div>
          </div>

          {/* Charring & Burning Dissolution Overlay */}
          {isBurning && burnProgress > 0 && (
            <div
              className="absolute inset-0 pointer-events-none z-30 transition-all duration-100"
              style={{
                background: `radial-gradient(ellipse at ${
                  90 - burnProgress * 40
                }% ${90 - burnProgress * 40}%, rgba(20, 10, 5, 0.98) 0%, rgba(60, 25, 10, 0.95) ${
                  burnProgress * 70
                }%, rgba(255, 90, 0, 0.8) ${burnProgress * 75}%, rgba(255, 200, 50, 0.9) ${
                  burnProgress * 78
                }%, transparent ${burnProgress * 85}%)`,
                mixBlendMode: 'multiply',
                filter: `contrast(1.4) brightness(${Math.max(0.2, 1 - burnProgress * 0.8)})`,
              }}
            >
              {/* Glowing burning edge */}
              <div
                className="absolute inset-0"
                style={{
                  boxShadow: `inset 0 0 ${burnProgress * 60}px #ff5500, inset 0 0 ${
                    burnProgress * 30
                  }px #ffcc00`,
                  opacity: burnProgress < 0.9 ? 1 : 0,
                }}
              />
            </div>
          )}

          {/* Crumple Creases Shadow Overlay */}
          {isCrumpled && (
            <div
              className="absolute inset-0 pointer-events-none z-20 opacity-80"
              style={{
                backgroundImage: `
                  linear-gradient(135deg, rgba(0,0,0,0.4) 0%, transparent 20%, rgba(0,0,0,0.6) 45%, transparent 60%),
                  linear-gradient(45deg, rgba(0,0,0,0.5) 15%, transparent 35%, rgba(0,0,0,0.7) 65%, transparent 85%),
                  radial-gradient(circle at 50% 50%, rgba(0,0,0,0.5) 0%, transparent 65%)
                `,
              }}
            />
          )}
        </div>
      </div>

      {/* ONE Button Underneath Saying "احرق الورقة" */}
      <div className="mt-8 flex justify-center w-full z-20">
        <button
          onClick={onBurnClick}
          disabled={disabled || isBurning || isCrumpled}
          className={`group relative px-8 py-3.5 rounded-none font-arabic text-lg sm:text-xl font-medium tracking-wide transition-all duration-500 overflow-hidden cursor-pointer ${
            disabled || isBurning || isCrumpled
              ? 'opacity-0 scale-95 pointer-events-none'
              : 'opacity-90 hover:opacity-100 text-[#e6cbb0] hover:text-[#fff3e6]'
          }`}
          style={{
            background: 'linear-gradient(180deg, #1c1510 0%, #0d0a07 100%)',
            border: '1px solid rgba(160, 115, 65, 0.45)',
            boxShadow: '0 4px 25px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 200, 140, 0.15)',
          }}
        >
          {/* Subtle Ember Rim Shimmer on Hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(ellipse_at_center,rgba(255,100,20,0.18)_0%,transparent_75%)]" />

          {/* Hairline Border Accents */}
          <span className="absolute top-0 left-0 w-2 h-[1px] bg-[#d9a86c] opacity-60" />
          <span className="absolute top-0 right-0 w-2 h-[1px] bg-[#d9a86c] opacity-60" />
          <span className="absolute bottom-0 left-0 w-2 h-[1px] bg-[#d9a86c] opacity-60" />
          <span className="absolute bottom-0 right-0 w-2 h-[1px] bg-[#d9a86c] opacity-60" />

          {/* Button Text */}
          <span className="relative z-10 flex items-center gap-2">
            احرق الورقة
          </span>
        </button>
      </div>
    </div>
  );
};
