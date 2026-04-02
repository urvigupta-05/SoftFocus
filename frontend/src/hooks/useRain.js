import { useEffect, useRef } from 'react';

export function useRain(canvasRef, active) {
  const animRef  = useRef(null);
  const dropsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!active) {
      cancelAnimationFrame(animRef.current);
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    dropsRef.current = Array.from({ length: 140 }, () => ({
      x:       Math.random() * canvas.width,
      y:       Math.random() * canvas.height,
      len:     Math.random() * 20 + 8,
      speed:   Math.random() * 3  + 1.5,
      opacity: Math.random() * 0.45 + 0.1,
      width:   Math.random() * 0.8  + 0.3,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dropsRef.current.forEach(d => {
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * 0.15, d.y + d.len);
        ctx.strokeStyle = `rgba(170,200,255,${d.opacity})`;
        ctx.lineWidth   = d.width;
        ctx.stroke();
        d.y += d.speed;
        d.x -= d.speed * 0.1;
        if (d.y > canvas.height) {
          d.y = -d.len;
          d.x = Math.random() * canvas.width;
        }
      });
      animRef.current = requestAnimationFrame(draw);
    };

    cancelAnimationFrame(animRef.current);
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef, active]);
}
