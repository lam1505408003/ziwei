
import React, { useEffect, useRef } from 'react';

const StarryBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    interface Blob {
      x: number;
      y: number;
      radius: number;
      color: string;
      targetX: number;
      targetY: number;
      speed: number;
    }

    // 恢复为原始的明亮且柔和的光晕色块
    const blobs: Blob[] = [
      { x: width * 0.2, y: height * 0.2, radius: 800, color: 'rgba(255, 255, 255, 0.4)', targetX: Math.random() * width, targetY: Math.random() * height, speed: 0.0015 },
      { x: width * 0.8, y: height * 0.1, radius: 700, color: 'rgba(236, 72, 153, 0.3)', targetX: Math.random() * width, targetY: Math.random() * height, speed: 0.001 },
      { x: width * 0.5, y: height * 0.8, radius: 900, color: 'rgba(129, 140, 248, 0.3)', targetX: Math.random() * width, targetY: Math.random() * height, speed: 0.0008 },
      { x: width * 0.9, y: height * 0.9, radius: 600, color: 'rgba(168, 85, 247, 0.2)', targetX: Math.random() * width, targetY: Math.random() * height, speed: 0.002 }
    ];

    const animate = () => {
      // 恢复为明亮的浅紫色底色
      ctx.fillStyle = '#B1B7FF';
      ctx.fillRect(0, 0, width, height);

      blobs.forEach(blob => {
        blob.x += (blob.targetX - blob.x) * blob.speed;
        blob.y += (blob.targetY - blob.y) * blob.speed;

        if (Math.abs(blob.x - blob.targetX) < 10) blob.targetX = Math.random() * width;
        if (Math.abs(blob.y - blob.targetY) < 10) blob.targetY = Math.random() * height;

        const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius);
        grad.addColorStop(0, blob.color);
        grad.addColorStop(1, 'rgba(177, 183, 255, 0)');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 绘制星星
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      for(let i=0; i<30; i++) {
        const x = (Math.sin(Date.now() * 0.0001 + i) * 0.5 + 0.5) * width;
        const y = (Math.cos(Date.now() * 0.00015 + i) * 0.5 + 0.5) * height;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(animate);
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    animate();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
    />
  );
};

export default StarryBackground;
