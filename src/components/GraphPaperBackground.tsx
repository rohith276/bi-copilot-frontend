"use client";

import React, { useEffect, useState } from "react";

interface GraphPaperBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export default function GraphPaperBackground({ children, className = "" }: GraphPaperBackgroundProps) {
  const [mousePos, setMousePos] = useState({ x: -500, y: -500 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      animationFrameId = requestAnimationFrame(() => {
        setMousePos({ x: e.clientX, y: e.clientY });
        setIsHovered(true);
      });
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={`relative w-full min-h-screen bg-(--background) text-(--foreground) ${className}`}>
      
      {/* 1. Base Background Grid (Default Light Gray Lines) */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-70"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--graph-line) 1px, transparent 1px),
            linear-gradient(to bottom, var(--graph-line) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />

      {/* 2. Interactive Cursor Spotlight Grid (Bold Black Grid Reveal within 2cm / 80px Radius) */}
      {isHovered && (
        <div
          className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-150"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--graph-line-spotlight) 1.5px, transparent 1.5px),
              linear-gradient(to bottom, var(--graph-line-spotlight) 1.5px, transparent 1.5px)
            `,
            backgroundSize: "20px 20px",
            WebkitMaskImage: `radial-gradient(circle 80px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
            maskImage: `radial-gradient(circle 80px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
          }}
        />
      )}

      {/* Main Content Container */}
      <div className="relative z-10 w-full min-h-screen">{children}</div>
    </div>
  );
}
