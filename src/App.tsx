import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Shield, RefreshCw } from 'lucide-react';
import { sound } from './services/soundEngine';
import { CreatorIntro } from './components/CreatorIntro';
import { VintagePaper } from './components/VintagePaper';
import { VintageLighter } from './components/VintageLighter';
import { FireCanvas, FireStage } from './components/FireCanvas';

export default function App() {
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [introComplete, setIntroComplete] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState<boolean>(false);

  // Paper & Burning ceremony states
  const [isCrumpled, setIsCrumpled] = useState<boolean>(false);
  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [burnProgress, setBurnProgress] = useState<number>(0);
  const [paperKey, setPaperKey] = useState<number>(1);
  const [paperBounds, setPaperBounds] = useState<DOMRect | null>(null);

  // Lighter state
  const [lighterStage, setLighterStage] = useState<
    'hidden' | 'entering' | 'striking' | 'ignited' | 'burning' | 'exiting'
  >('hidden');
  const [lighterPos, setLighterPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Fire simulation stage
  const [fireStage, setFireStage] = useState<FireStage>('idle');

  // Screen flash / blackout during inferno fade
  const [screenBlackout, setScreenBlackout] = useState<boolean>(false);
  const [paperVisible, setPaperVisible] = useState<boolean>(true);

  // Ensure sound context starts on any first user interaction
  const handleFirstInteract = useCallback(async () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      await sound.init();
      sound.startRain(0.42);
    }
  }, [hasInteracted]);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleFirstInteract();
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handlePaperBoundsChange = useCallback((bounds: DOMRect | null) => {
    setPaperBounds(bounds);
  }, []);

  // Burn ceremony orchestration
  const startBurningSequence = async () => {
    if (isBurning || isCrumpled) return;

    await handleFirstInteract();

    // Calculate lighter target position at the bottom-right corner of the paper
    const px = paperBounds ? paperBounds.right - 25 : window.innerWidth / 2 + 140;
    const py = paperBounds ? paperBounds.bottom - 10 : window.innerHeight / 2 + 160;
    setLighterPos({ x: px, y: py });

    // Step 1: Crumple the paper realistically
    setIsCrumpled(true);
    sound.playCrumple();

    // Step 2: Show lighter entering after crumple starts (600ms)
    setTimeout(() => {
      setLighterStage('entering');
    }, 650);

    // Step 3: Lighter arrives and flips open (1100ms)
    setTimeout(() => {
      setLighterStage('striking');
      sound.playLighterOpen();
    }, 1150);

    // Step 4: Flint strikes and ignites (1450ms)
    setTimeout(() => {
      sound.playLighterIgnite();
      setLighterStage('ignited');
    }, 1500);

    // Step 5: Touch paper and start paper ignition (2000ms)
    setTimeout(() => {
      setIsBurning(true);
      setFireStage('igniting');
      sound.startFire(0.5);

      // Advance paper charring
      let p = 0;
      const charTimer = setInterval(() => {
        p += 0.05;
        setBurnProgress(Math.min(p, 1));
        if (p >= 1) clearInterval(charTimer);
      }, 100);
    }, 2050);

    // Step 6: Paper burning intensely, lighter exits (3100ms)
    setTimeout(() => {
      setLighterStage('exiting');
      setFireStage('burning-paper');
      sound.setFireIntensity(0.85);
    }, 3100);

    // Step 7: Lighter hidden completely (3800ms)
    setTimeout(() => {
      setLighterStage('hidden');
    }, 3850);

    // Step 8: Fire erupts across the entire screen! (4600ms)
    setTimeout(() => {
      setFireStage('screen-inferno');
      sound.setFireIntensity(1.35);
      sound.playThunder(0.7);
    }, 4600);
  };

  // When inferno reaches climax peak: fade out into darkness
  const handleInfernoPeak = () => {
    // Hide the burned paper behind the flames
    setPaperVisible(false);

    // Transition fire to cooling down
    setFireStage('cooling');
    sound.stopFire(2.0);
    sound.playAshBreath();

    // Blackout screens slowly
    setTimeout(() => {
      setScreenBlackout(true);
    }, 1000);
  };

  // When fire is completely extinguished and ash settled
  const handleExtinguished = () => {
    // Pure stillness in darkness for a moment, then reveal brand new pristine paper
    setTimeout(() => {
      // Reset all ceremony states
      setIsCrumpled(false);
      setIsBurning(false);
      setBurnProgress(0);
      setFireStage('idle');
      setScreenBlackout(false);

      // Increment paper key to mount fresh paper
      setPaperKey((prev) => prev + 1);

      // Fade new paper in smoothly from darkness
      setTimeout(() => {
        setPaperVisible(true);
      }, 400);
    }, 1200);
  };

  return (
    <main
      onClick={handleFirstInteract}
      className="relative w-screen h-screen bg-black overflow-hidden select-none flex flex-col items-center justify-center m-0 p-0"
      style={{
        backgroundColor: '#000000',
      }}
    >
      {/* Cinematic Vignette & Ambient Darkness */}
      <div className="absolute inset-0 cinematic-vignette pointer-events-none z-10" />

      {/* Solitary Overhead Chiaroscuro Spotlight illuminating the void */}
      <div className="absolute inset-0 solitary-spotlight pointer-events-none z-0" />

      {/* Stage 1: Creator Intro (MADE BY STEVEN EMAD & I'M ALWAYS ALONE) */}
      {!introComplete && (
        <CreatorIntro
          hasInteracted={hasInteracted}
          onFirstInteract={handleFirstInteract}
          onComplete={() => setIntroComplete(true)}
        />
      )}

      {/* Discreet Sound & Privacy Controls (Zero Slop, Minimalist Icons) */}
      <div className="fixed top-5 right-5 sm:top-7 sm:right-7 z-40 flex items-center gap-3">
        {/* Subtle Privacy & Philosophy Indicator */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowPrivacyNotice(!showPrivacyNotice);
          }}
          title="Privacy & Ritual"
          aria-label="Privacy information"
          className="p-2 text-[#735d45] hover:text-[#d4ba98] transition-colors duration-300 opacity-60 hover:opacity-100 cursor-pointer"
        >
          <Shield className="w-4 h-4" />
        </button>

        {/* Minimal Audio Mute/Unmute */}
        <button
          onClick={toggleSound}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          aria-label={isMuted ? 'Unmute continuous rain' : 'Mute continuous rain'}
          className="p-2 text-[#735d45] hover:text-[#d4ba98] transition-colors duration-300 opacity-60 hover:opacity-100 cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Privacy & Ritual Modal/Card (Quiet, minimal, self-contained) */}
      {showPrivacyNotice && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed top-16 right-5 sm:right-7 z-40 max-w-xs sm:max-w-sm p-4 bg-[#120e0b]/95 border border-[#4a3a2a] text-[#c9b79f] text-xs leading-relaxed font-arabic backdrop-blur-md shadow-2xl transition-all duration-300"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#362a1e]">
            <span className="font-cinzel text-[10px] tracking-widest text-[#a88968] uppercase">
              Sanctuary of Solitude
            </span>
            <button
              onClick={() => setShowPrivacyNotice(false)}
              className="text-[#80684f] hover:text-[#e4cfb5] cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>
          <p className="mb-2 text-[#b09d86]">
            هذا العمل مساحة تطهير سرّية بالكامل. لا يتم إرسال أي نص عبر الإنترنت ولا يتم حفظ كلماتك في أي خادم أو قاعدة بيانات.
          </p>
          <p className="text-[11px] text-[#7d6750]">
            الحرق تجربة بصرية ورمزية تهدف لتحرير ما بداخلك في الصمت.
          </p>
        </div>
      )}

      {/* Main Experience: ONE Vintage Paper & ONE Burn Button */}
      {introComplete && (
        <div
          className={`relative w-full flex flex-col items-center justify-center transition-all duration-1000 ${
            paperVisible && !screenBlackout ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          <VintagePaper
            key={paperKey}
            isBurning={isBurning}
            burnProgress={burnProgress}
            isCrumpled={isCrumpled}
            onBurnClick={startBurningSequence}
            onPaperBoundsChange={handlePaperBoundsChange}
            disabled={!paperVisible || screenBlackout}
          />
        </div>
      )}

      {/* The Vintage Flip Lighter */}
      <VintageLighter stage={lighterStage} lighterPos={lighterPos} />

      {/* Full-Screen Photorealistic Fire & Ember Simulation Canvas */}
      <FireCanvas
        stage={fireStage}
        paperBounds={paperBounds}
        onInfernoPeak={handleInfernoPeak}
        onExtinguished={handleExtinguished}
      />

      {/* Blackout Curtain for smooth fade back to darkness */}
      <div
        className={`fixed inset-0 bg-black pointer-events-none z-30 transition-opacity duration-1000 ${
          screenBlackout ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </main>
  );
}
