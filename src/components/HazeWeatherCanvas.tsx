import React, { useEffect, useRef } from 'react';

interface HazeWeatherCanvasProps {
  psi: number;
  pm25: number;
  isHazyManualOverride?: boolean | null; // For simulator toggle
  customIntensity?: number | null; // 0 (clear) to 1 (extreme)
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
  opacity: number;
  baseAlpha: number;
  wobbleSpeed: number;
  wobbleAngle: number;
}

export const HazeWeatherCanvas: React.FC<HazeWeatherCanvasProps> = ({
  psi,
  pm25,
  isHazyManualOverride,
  customIntensity,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Determine haze level:
  // Singapore NEA: PSI > 100 or PM2.5 > 55 is considered hazy/elevated
  const isHazyNaturally = psi > 100 || pm25 > 55;
  const isHazy = isHazyManualOverride !== null && isHazyManualOverride !== undefined
    ? isHazyManualOverride
    : isHazyNaturally;

  // Compute normalized haze intensity (0 to 1)
  let intensity = 0;
  if (customIntensity !== null && customIntensity !== undefined) {
    intensity = customIntensity;
  } else if (!isHazy) {
    intensity = Math.min(0.18, Math.max(0.02, psi / 300));
  } else {
    // scale from 0.35 up to 1.0 based on PSI and PM2.5
    const psiScore = Math.min(1.0, Math.max(0.35, (psi - 50) / 250));
    const pmScore = Math.min(1.0, Math.max(0.35, (pm25 - 35) / 180));
    intensity = Math.max(psiScore, pmScore);
  }

  // Animation frame loop for floating haze particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle count scales with haze intensity
    const particleCount = isHazy ? Math.floor(45 + intensity * 60) : 12;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * (isHazy ? 14 : 4) + (isHazy ? 6 : 2),
        speedX: (Math.random() * 0.4 + 0.15) * (Math.random() > 0.3 ? 1 : -0.5),
        speedY: (Math.random() - 0.5) * 0.25,
        opacity: Math.random() * 0.2 + 0.1,
        baseAlpha: Math.random() * 0.25 + 0.15,
        wobbleSpeed: Math.random() * 0.02 + 0.01,
        wobbleAngle: Math.random() * Math.PI * 2,
      });
    }

    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      ctx.clearRect(0, 0, width, height);

      if (isHazy) {
        // Draw soft atmospheric light scattering glow
        const sunX = width * 0.75;
        const sunY = height * 0.22;
        const sunRadius = Math.max(120, width * 0.22);

        const radialGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunRadius);
        if (intensity > 0.7) {
          // Deep fiery / smoggy sun
          radialGlow.addColorStop(0, 'rgba(249, 115, 22, 0.28)');
          radialGlow.addColorStop(0.5, 'rgba(234, 88, 12, 0.12)');
          radialGlow.addColorStop(1, 'rgba(124, 45, 18, 0)');
        } else {
          // Yellow-amber diffused haze sun
          radialGlow.addColorStop(0, 'rgba(251, 191, 36, 0.22)');
          radialGlow.addColorStop(0.5, 'rgba(217, 119, 6, 0.09)');
          radialGlow.addColorStop(1, 'rgba(180, 83, 9, 0)');
        }
        ctx.fillStyle = radialGlow;
        ctx.fillRect(0, 0, width, height);
      }

      // Render floating micro aerosol / haze particles
      particles.forEach((p) => {
        p.wobbleAngle += p.wobbleSpeed;
        p.x += p.speedX + Math.sin(p.wobbleAngle) * 0.2;
        p.y += p.speedY + Math.cos(p.wobbleAngle) * 0.15;

        // Wrap around screen
        if (p.x > width + 40) p.x = -40;
        if (p.x < -40) p.x = width + 40;
        if (p.y > height + 40) p.y = -40;
        if (p.y < -40) p.y = height + 40;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        if (isHazy) {
          const particleAlpha = p.baseAlpha * intensity * 0.7;
          if (intensity > 0.7) {
            ctx.fillStyle = `rgba(249, 115, 22, ${particleAlpha})`;
          } else {
            ctx.fillStyle = `rgba(245, 158, 11, ${particleAlpha})`;
          }
        } else {
          // Clean subtle dust mote / fresh air particle
          ctx.fillStyle = `rgba(148, 163, 184, ${p.baseAlpha * 0.2})`;
        }
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isHazy, intensity]);

  // Atmospheric gradient configuration
  const getAtmosphericBackdrop = () => {
    if (!isHazy) {
      return 'from-slate-950 via-slate-900 to-sky-950/40';
    }
    if (intensity > 0.75) {
      // Severe haze (Very Unhealthy / Hazardous)
      return 'from-[#1a0c0a] via-[#2d120a] to-[#3f190e]';
    }
    // Moderate / Unhealthy haze (smoky amber tone)
    return 'from-[#131215] via-[#241c14] to-[#342413]';
  };

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden transition-colors duration-1000">
      {/* Dynamic Base Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${getAtmosphericBackdrop()} transition-all duration-1000`} />

      {/* Atmospheric Haze Fog Layers when Hazy */}
      {isHazy && (
        <>
          {/* Upper Smog Ceiling */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-transparent via-amber-950/20 to-amber-900/30 transition-opacity duration-1000 mix-blend-screen"
            style={{ opacity: Math.min(0.9, 0.4 + intensity * 0.5) }}
          />

          {/* Drifting Haze Mist Clouds */}
          <div
            className="absolute -top-32 -left-32 w-[140%] h-[120%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-600/10 via-amber-900/5 to-transparent blur-3xl animate-haze-slow pointer-events-none"
            style={{ opacity: intensity }}
          />
          <div
            className="absolute top-1/3 -right-24 w-[120%] h-[100%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-600/10 via-amber-900/5 to-transparent blur-3xl animate-haze-fast pointer-events-none"
            style={{ opacity: intensity * 0.8 }}
          />

          {/* Visibility Attenuation Filter Overlay */}
          <div
            className="absolute inset-0 backdrop-blur-[0.5px] transition-opacity duration-1000"
            style={{
              backgroundColor: intensity > 0.75
                ? 'rgba(67, 20, 7, 0.22)'
                : 'rgba(56, 36, 12, 0.16)',
            }}
          />
        </>
      )}

      {/* Canvas for Interactive Floating Particulate Smoke/Dust Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Singapore Skyline Horizon Silhouette with Atmospheric Depth Fog */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 md:h-52 overflow-hidden transition-opacity duration-1000"
        style={{
          opacity: isHazy ? Math.max(0.18, 0.65 - intensity * 0.45) : 0.4,
          filter: isHazy ? `blur(${intensity * 3}px)` : 'none',
        }}
      >
        <svg
          viewBox="0 0 1440 240"
          preserveAspectRatio="none"
          className="w-full h-full fill-slate-900/80 transition-colors duration-1000"
          style={{
            fill: isHazy
              ? intensity > 0.7
                ? '#24100b'
                : '#231911'
              : '#0b1329',
          }}
        >
          {/* Stylized Singapore Iconic Skyline (MBS 3 towers + skypark, Singapore Flyer wheel, Supertrees, CBD towers) */}
          {/* CBD Towers */}
          <rect x="40" y="90" width="28" height="150" />
          <rect x="75" y="60" width="35" height="180" />
          <polygon points="75,60 92,35 110,60" />
          <rect x="115" y="110" width="24" height="130" />
          <rect x="145" y="75" width="40" height="165" />
          <rect x="190" y="100" width="22" height="140" />

          {/* Marina Bay Sands 3 Towers + SkyPark */}
          <path d="M 270 240 L 270 95 L 292 95 L 292 240 Z" />
          <path d="M 302 240 L 302 95 L 324 95 L 324 240 Z" />
          <path d="M 334 240 L 334 95 L 356 95 L 356 240 Z" />
          {/* Curved SkyPark cantilever */}
          <path d="M 255 93 Q 315 88 385 85 Q 400 84 415 88 L 410 96 Q 370 93 258 100 Z" />

          {/* Singapore ArtScience Museum lotus petals */}
          <path d="M 430 240 L 430 180 Q 445 160 460 180 Q 475 160 490 180 L 490 240 Z" />

          {/* Singapore Flyer Silhouette */}
          <circle cx="560" cy="120" r="50" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.4" />
          <line x1="560" y1="120" x2="560" y2="240" stroke="currentColor" strokeWidth="3" opacity="0.4" />
          <line x1="560" y1="120" x2="535" y2="240" stroke="currentColor" strokeWidth="2" opacity="0.4" />
          <line x1="560" y1="120" x2="585" y2="240" stroke="currentColor" strokeWidth="2" opacity="0.4" />

          {/* Gardens by the Bay Supertrees */}
          <path d="M 660 240 L 664 160 Q 650 145 640 148 Q 664 135 668 155 Q 675 135 695 145 Q 682 152 672 160 L 676 240 Z" />
          <path d="M 720 240 L 724 175 Q 712 162 702 165 Q 724 153 728 170 Q 735 152 752 160 Q 740 167 732 175 L 736 240 Z" />

          {/* Financial Centre High-rises & West / Jurong skyline */}
          <rect x="800" y="80" width="32" height="160" />
          <polygon points="800,80 816,50 832,80" />
          <rect x="840" y="115" width="28" height="125" />
          <rect x="875" y="70" width="45" height="170" />
          <rect x="930" y="105" width="30" height="135" />
          <rect x="970" y="60" width="38" height="180" />
          <polygon points="970,60 989,30 1008,60" />
          <rect x="1015" y="125" width="24" height="115" />
          <rect x="1045" y="85" width="34" height="155" />
          <rect x="1090" y="130" width="28" height="110" />
          <rect x="1130" y="90" width="42" height="150" />
          <rect x="1185" y="115" width="30" height="125" />
          <rect x="1230" y="75" width="38" height="165" />
          <rect x="1280" y="105" width="35" height="135" />
          <rect x="1330" y="130" width="45" height="110" />
          <rect x="1390" y="95" width="35" height="145" />
        </svg>

        {/* Ground Fog Scrim to blend with page footer */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
      </div>
    </div>
  );
};
