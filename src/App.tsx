import React, { useEffect, useRef } from "react";
import Chat from "./components/Chat";
import Navbar from "./components/Navbar";

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const drawDot = (x: number, y: number) => {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(200, 200, 200, 0.5)";
          ctx.fill();
        };

        for (let i = 0; i < 1000; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          drawDot(x, y);
        }
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <canvas ref={canvasRef} className="fixed inset-0 z-0" />
      <div className="relative z-10">
        <Navbar />
        <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-64px)] flex items-center justify-center">
          <Chat />
        </div>
      </div>
    </div>
  );
};

export default App;
