import React, { useEffect, useRef } from 'react';

export type FireStage = 'idle' | 'igniting' | 'burning-paper' | 'screen-inferno' | 'cooling' | 'extinguished';

interface FireCanvasProps {
  stage: FireStage;
  paperBounds: DOMRect | null;
  onInfernoPeak?: () => void;
  onExtinguished?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  initialSize: number;
  life: number;
  maxLife: number;
  type: 'flame' | 'smoke' | 'ember' | 'ash';
  hue: number;
  brightness: number;
  flickerSpeed: number;
}

export const FireCanvas: React.FC<FireCanvasProps> = ({
  stage,
  paperBounds,
  onInfernoPeak,
  onExtinguished,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const stageStartTimeRef = useRef<number>(performance.now());
  const peakFiredRef = useRef<boolean>(false);
  const extinguishedFiredRef = useRef<boolean>(false);

  useEffect(() => {
    stageStartTimeRef.current = performance.now();
    if (stage === 'screen-inferno') {
      peakFiredRef.current = false;
    }
    if (stage === 'cooling') {
      extinguishedFiredRef.current = false;
    }
  }, [stage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const spawnParticle = (
      type: 'flame' | 'smoke' | 'ember' | 'ash',
      originX: number,
      originY: number,
      spreadX: number = 20,
      extraVy: number = 0
    ) => {
      const px = originX + (Math.random() - 0.5) * spreadX;
      const py = originY + (Math.random() - 0.5) * 15;

      if (type === 'flame') {
        const maxLife = 35 + Math.random() * 35;
        const size = 18 + Math.random() * 30;
        particlesRef.current.push({
          x: px,
          y: py,
          vx: (Math.random() - 0.5) * 2.2,
          vy: -3.5 - Math.random() * 4.5 + extraVy,
          size,
          initialSize: size,
          life: 0,
          maxLife,
          type: 'flame',
          hue: 20 + Math.random() * 25, // deep orange to yellow
          brightness: 60 + Math.random() * 35,
          flickerSpeed: 0.1 + Math.random() * 0.2,
        });
      } else if (type === 'smoke') {
        const maxLife = 70 + Math.random() * 60;
        const size = 25 + Math.random() * 45;
        particlesRef.current.push({
          x: px,
          y: py,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -1.2 - Math.random() * 2.0,
          size,
          initialSize: size,
          life: 0,
          maxLife,
          type: 'smoke',
          hue: 25,
          brightness: 15 + Math.random() * 20,
          flickerSpeed: 0.05,
        });
      } else if (type === 'ember') {
        const maxLife = 50 + Math.random() * 70;
        const size = 2.0 + Math.random() * 3.5;
        particlesRef.current.push({
          x: px,
          y: py,
          vx: (Math.random() - 0.5) * 4.5,
          vy: -4.0 - Math.random() * 6.0 + extraVy,
          size,
          initialSize: size,
          life: 0,
          maxLife,
          type: 'ember',
          hue: 25 + Math.random() * 30,
          brightness: 70 + Math.random() * 30,
          flickerSpeed: 0.2 + Math.random() * 0.3,
        });
      } else if (type === 'ash') {
        const maxLife = 90 + Math.random() * 80;
        const size = 1.5 + Math.random() * 2.5;
        particlesRef.current.push({
          x: px,
          y: py,
          vx: (Math.random() - 0.5) * 2.0,
          vy: 0.6 + Math.random() * 1.8, // drifts downward or slowly
          size,
          initialSize: size,
          life: 0,
          maxLife,
          type: 'ash',
          hue: 0,
          brightness: 15 + Math.random() * 25,
          flickerSpeed: 0.05,
        });
      }
    };

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      const elapsedStage = currentTime - stageStartTimeRef.current;

      // Clear with soft decay for motion trails during intense fire
      if (stage === 'screen-inferno') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.clearRect(0, 0, width, height);
      }

      // Spawning logic per stage
      if (stage === 'igniting') {
        const bx = paperBounds ? paperBounds.right - 40 : width / 2 + 100;
        const by = paperBounds ? paperBounds.bottom - 30 : height / 2 + 150;
        for (let i = 0; i < 4; i++) spawnParticle('flame', bx, by, 25, -0.5);
        for (let i = 0; i < 2; i++) spawnParticle('smoke', bx, by - 20, 30);
        for (let i = 0; i < 3; i++) spawnParticle('ember', bx, by, 30, -1);
      } else if (stage === 'burning-paper') {
        const bx = paperBounds ? paperBounds.left + paperBounds.width / 2 : width / 2;
        const by = paperBounds ? paperBounds.bottom - 20 : height / 2 + 100;
        const bw = paperBounds ? paperBounds.width * 0.9 : 400;

        // Spread fire along the whole paper base and body
        for (let i = 0; i < 14; i++) {
          const spawnX = bx + (Math.random() - 0.5) * bw;
          const spawnY = by - Math.random() * (paperBounds ? paperBounds.height * 0.6 : 200);
          spawnParticle('flame', spawnX, spawnY, 35, -2);
          if (Math.random() < 0.4) spawnParticle('smoke', spawnX, spawnY - 30, 45);
          if (Math.random() < 0.8) spawnParticle('ember', spawnX, spawnY, 40, -3);
          if (Math.random() < 0.3) spawnParticle('ash', spawnX, spawnY, 50);
        }
      } else if (stage === 'screen-inferno') {
        // Erupt fire across the entire bottom and width of the screen!
        const screenSpawnRate = 35;
        for (let i = 0; i < screenSpawnRate; i++) {
          const spawnX = Math.random() * width;
          const spawnY = height + 20 - Math.random() * (height * 0.4);
          spawnParticle('flame', spawnX, spawnY, 80, -6);
          if (Math.random() < 0.7) spawnParticle('ember', spawnX, spawnY, 70, -7);
          if (Math.random() < 0.4) spawnParticle('smoke', spawnX, spawnY - 50, 90);
        }

        // Additional vortex fire pillars in the center
        for (let i = 0; i < 15; i++) {
          const spawnX = width / 2 + (Math.random() - 0.5) * (width * 0.5);
          const spawnY = height / 2 + (Math.random() - 0.5) * 300;
          spawnParticle('flame', spawnX, spawnY, 120, -5);
          spawnParticle('ember', spawnX, spawnY, 100, -8);
        }

        // Peak trigger at 2.5 seconds into inferno
        if (elapsedStage > 2600 && !peakFiredRef.current) {
          peakFiredRef.current = true;
          onInfernoPeak?.();
        }
      } else if (stage === 'cooling') {
        // Only embers and falling ash remaining, no new flame spawns
        if (elapsedStage < 1200) {
          if (Math.random() < 0.3) {
            spawnParticle('ember', Math.random() * width, height * 0.7, 50, -1);
          }
          if (Math.random() < 0.5) {
            spawnParticle('ash', Math.random() * width, Math.random() * (height * 0.5), 100);
          }
        }

        if (elapsedStage > 2500 && !extinguishedFiredRef.current && particlesRef.current.length === 0) {
          extinguishedFiredRef.current = true;
          onExtinguished?.();
        }
      }

      // Render Screen-level fire flash / bloom in inferno stage
      if (stage === 'screen-inferno') {
        const peakProgress = Math.min(elapsedStage / 2000, 1);
        const glowAlpha = Math.sin(peakProgress * Math.PI) * 0.35;
        if (glowAlpha > 0.01) {
          const radial = ctx.createRadialGradient(
            width / 2,
            height / 2,
            50,
            width / 2,
            height / 2,
            Math.max(width, height) * 0.8
          );
          radial.addColorStop(0, `rgba(255, 120, 20, ${glowAlpha * 0.9})`);
          radial.addColorStop(0.4, `rgba(220, 50, 0, ${glowAlpha * 0.5})`);
          radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = radial;
          ctx.fillRect(0, 0, width, height);
        }
      }

      // Update & Render Particles
      const particles = particlesRef.current;
      const nextParticles: Particle[] = [];

      // Render smoke first (underneath flame)
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.type !== 'smoke') continue;

        p.life += 1;
        p.x += p.vx + Math.sin(p.life * 0.04) * 0.6;
        p.y += p.vy;
        p.size = p.initialSize + (p.life / p.maxLife) * p.initialSize * 1.5;

        const lifeRatio = p.life / p.maxLife;
        const alpha = Math.sin(lifeRatio * Math.PI) * 0.18;

        if (p.life < p.maxLife && p.y > -100) {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grad.addColorStop(0, `rgba(45, 35, 25, ${alpha})`);
          grad.addColorStop(0.6, `rgba(25, 20, 15, ${alpha * 0.6})`);
          grad.addColorStop(1, 'rgba(10, 8, 6, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          nextParticles.push(p);
        }
      }

      // Render Flames & Glowing Embers with additive blend
      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.type === 'smoke') continue;

        p.life += 1;
        const progress = p.life / p.maxLife;

        if (p.type === 'flame') {
          // Turbulent rise
          p.x += p.vx + Math.sin(p.life * p.flickerSpeed + p.y * 0.02) * 1.8;
          p.y += p.vy;
          // Flame expands then narrows
          p.size = p.initialSize * (1 - progress * 0.7);

          if (p.life < p.maxLife && p.y > -50) {
            const alpha = Math.sin(progress * Math.PI) * 0.75;
            const currentHue = p.hue - progress * 20; // yellow shifts to red
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            grad.addColorStop(0, `hsla(${currentHue + 15}, 100%, 90%, ${alpha})`);
            grad.addColorStop(0.3, `hsla(${currentHue}, 100%, 55%, ${alpha * 0.85})`);
            grad.addColorStop(0.7, `hsla(${currentHue - 15}, 100%, 40%, ${alpha * 0.4})`);
            grad.addColorStop(1, 'transparent');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            nextParticles.push(p);
          }
        } else if (p.type === 'ember') {
          p.x += p.vx + Math.sin(p.life * 0.15) * 1.5;
          p.y += p.vy;
          p.vy += 0.04; // subtle gravity

          if (p.life < p.maxLife && p.y > -50) {
            const flicker = 0.6 + Math.sin(p.life * p.flickerSpeed * 10) * 0.4;
            const alpha = (1 - progress) * flicker;
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
            grad.addColorStop(0, `rgba(255, 245, 180, ${alpha})`);
            grad.addColorStop(0.4, `rgba(255, 120, 20, ${alpha * 0.8})`);
            grad.addColorStop(1, 'transparent');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            ctx.fill();
            nextParticles.push(p);
          }
        } else if (p.type === 'ash') {
          // Slow drifting ash flake
          p.x += p.vx + Math.cos(p.life * 0.05) * 1.2;
          p.y += p.vy;

          if (p.life < p.maxLife && p.y < height + 50) {
            const alpha = (1 - progress) * 0.45;
            ctx.fillStyle = `rgba(20, 16, 12, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            nextParticles.push(p);
          }
        }
      }

      ctx.globalCompositeOperation = 'source-over';
      particlesRef.current = nextParticles;

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [stage, paperBounds, onInfernoPeak, onExtinguished]);

  if (stage === 'idle' && particlesRef.current.length === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none w-full h-full"
    />
  );
};
