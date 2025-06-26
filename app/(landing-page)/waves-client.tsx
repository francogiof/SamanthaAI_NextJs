"use client";
import { useEffect, useRef } from "react";

export default function Waves() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = window.innerWidth;
    let height = 320; // Fixed height for header effect
    canvas.width = width;
    canvas.height = height;

    const waves: any[] = [];
    const waveCount = 20;
    for (let i = 0; i < waveCount; i++) {
      waves.push({
        y: height / 2 - 60 + Math.random() * 120,
        length: 0.01 + Math.random() * 0.001,
        amplitude: 30 + Math.random() * 60,
        frequency: 0.01 + Math.random() * 0.03,
        phase: Math.random() * Math.PI * 2,
      });
    }

    function animate() {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      animationId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, width, height);
      waves.forEach((wave, index) => {
        ctx.beginPath();
        ctx.moveTo(0, wave.y);
        for (let i = 0; i < width; i++) {
          const yOffset = Math.sin(i * wave.length + wave.phase) * wave.amplitude * Math.sin(wave.phase);
          ctx.lineTo(i, wave.y + yOffset);
        }
        ctx.strokeStyle = `hsl(${index / 2 + 170}, 100%, 60%)`;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
        wave.phase += wave.frequency;
      });
    }
    animate();

    function handleResize() {
      if (!canvasRef.current) return;
      width = window.innerWidth;
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      waves.forEach((wave) => {
        wave.y = height / 2 - 60 + Math.random() * 120;
      });
    }
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: 320,
        display: "block",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
