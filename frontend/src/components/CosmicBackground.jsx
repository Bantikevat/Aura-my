import { useEffect, useRef } from 'react';

export default function CosmicBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    // Star particles
    const STAR_COUNT = Math.min(100, Math.floor((width * height) / 12000));
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.4,
      baseAlpha: Math.random() * 0.7 + 0.2,
      alpha: Math.random() * 0.7 + 0.2,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: (Math.random() - 0.5) * 0.15,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      color: ['#e8c872', '#a78bfa', '#60a5fa', '#34d399', '#f472b6'][Math.floor(Math.random() * 5)],
    }));

    // Mouse coordinates for gentle parallax
    let mouse = { x: width / 2, y: height / 2 };
    const onMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', onMouseMove);

    let tick = 0;
    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle stars
      for (const star of stars) {
        star.x += star.speedX;
        star.y += star.speedY;

        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        star.alpha = star.baseAlpha + Math.sin(tick * star.twinkleSpeed) * 0.25;

        // Interactive mouse glow
        const dx = mouse.x - star.x;
        const dy = mouse.y - star.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let extraSize = 0;
        if (dist < 120) {
          extraSize = (1 - dist / 120) * 1.5;
        }

        ctx.fillStyle = star.color;
        ctx.globalAlpha = Math.max(0.05, Math.min(1, star.alpha + (extraSize > 0 ? 0.3 : 0)));
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size + extraSize, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Deep Space Background with Aurora Nebula gradients */}
      <div className="absolute inset-0 bg-[#06070d]" />
      <div className="absolute -top-[25%] -left-[10%] h-[70vw] w-[70vw] rounded-full bg-gradient-to-br from-purple-900/15 via-indigo-900/10 to-transparent blur-[120px]" />
      <div className="absolute -bottom-[20%] -right-[10%] h-[65vw] w-[65vw] rounded-full bg-gradient-to-tl from-cyan-950/20 via-amber-950/10 to-transparent blur-[130px]" />
      <div className="absolute top-[40%] left-[25%] h-[40vw] w-[40vw] rounded-full bg-radial from-violet-600/5 to-transparent blur-[100px]" />

      {/* Cyber Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* 60FPS Interactive Stars Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
    </div>
  );
}
