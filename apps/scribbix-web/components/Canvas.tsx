"use client";

import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import {
  Circle,
  Pencil,
  RectangleHorizontal,
  Minus,
  ArrowRight,
  Undo,
  Trash2,
  Download,
  Palette,
} from "lucide-react";
import { Game } from "@/draw/Game";

export type Tool = "circle" | "rect" | "pencil" | "line" | "arrow";

const colors = [
  "#0f172a", // Dark Slate/Black
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#22c55e", // Green
  "#eab308", // Yellow
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#f97316", // Orange
];

const strokeWidths = [1, 2, 4, 6, 8];

export function Canvas({
  roomId,
  socket,
}: {
  socket: WebSocket;
  roomId: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [game, setGame] = useState<Game>();
  const [selectedTool, setSelectedTool] = useState<Tool>("pencil");
  const [selectedColor, setSelectedColor] = useState("#0f172a");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width || 600,
          height: entry.contentRect.height || 400,
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    game?.setTool(selectedTool);
  }, [selectedTool, game]);

  useEffect(() => {
    game?.setColor(selectedColor);
  }, [selectedColor, game]);

  useEffect(() => {
    game?.setStrokeWidth(strokeWidth);
  }, [strokeWidth, game]);

  useEffect(() => {
    if (canvasRef.current) {
      const g = new Game(canvasRef.current, roomId, socket);
      setGame(g);

      return () => {
        g.destroy();
      };
    }
  }, [canvasRef, roomId, socket]);

  const handleUndo = () => {
    game?.undo();
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear the canvas?")) {
      game?.clear();
    }
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement("a");
      link.download = `scribbix-${roomId}-${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-slate-50 relative"
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="cursor-crosshair block"
        style={{
          backgroundColor: "#f8fafc",
          backgroundImage: "radial-gradient(#cbd5e1 1.2px, transparent 1.2px)",
          backgroundSize: "18px 18px",
        }}
      />

      {/* Main Toolbar */}
      <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-2 border border-slate-200/50 z-10 transition-all duration-300">
        <div className="flex flex-col gap-2">
          <IconButton
            onClick={() => setSelectedTool("pencil")}
            activated={selectedTool === "pencil"}
            icon={<Pencil size={20} />}
            tooltip="Pencil"
          />
          <IconButton
            onClick={() => setSelectedTool("line")}
            activated={selectedTool === "line"}
            icon={<Minus size={20} />}
            tooltip="Line"
          />
          <IconButton
            onClick={() => setSelectedTool("arrow")}
            activated={selectedTool === "arrow"}
            icon={<ArrowRight size={20} />}
            tooltip="Arrow"
          />
          <IconButton
            onClick={() => setSelectedTool("rect")}
            activated={selectedTool === "rect"}
            icon={<RectangleHorizontal size={20} />}
            tooltip="Rectangle"
          />
          <IconButton
            onClick={() => setSelectedTool("circle")}
            activated={selectedTool === "circle"}
            icon={<Circle size={20} />}
            tooltip="Circle"
          />
        </div>
      </div>

      {/* Color and Stroke Toolbar */}
      <div className="absolute top-4 left-20 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-2 border border-slate-200/50 z-10 transition-all duration-300">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors relative flex items-center justify-center border border-slate-200/20"
            style={{ backgroundColor: selectedColor }}
          >
            <Palette size={20} className="text-white mix-blend-difference" />
          </button>

          {showColorPicker && (
            <div className="absolute left-full ml-3 top-0 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-3 border border-slate-200/60 min-w-[180px] z-20">
              <div className="grid grid-cols-4 gap-2 mb-3">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      setShowColorPicker(false);
                    }}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      selectedColor === color
                        ? "border-blue-600 scale-110 shadow-sm"
                        : "border-slate-200 hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Stroke Width
                </div>
                {strokeWidths.map((width) => (
                  <button
                    key={width}
                    onClick={() => setStrokeWidth(width)}
                    className={`w-full py-1.5 rounded-lg flex items-center justify-center transition-colors ${
                      strokeWidth === width
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    <div
                      className="rounded-full"
                      style={{
                        width: `${width * 2}px`,
                        height: `${width * 2}px`,
                        backgroundColor:
                          strokeWidth === width ? "#ffffff" : "#0f172a",
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions Toolbar */}
      <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-2 border border-slate-200/50 z-10 transition-all duration-300">
        <div className="flex gap-2">
          <IconButton
            onClick={handleUndo}
            activated={false}
            icon={<Undo size={20} />}
            tooltip="Undo"
          />
          <IconButton
            onClick={handleClear}
            activated={false}
            icon={<Trash2 size={20} />}
            tooltip="Clear Canvas"
          />
          <IconButton
            onClick={handleDownload}
            activated={false}
            icon={<Download size={20} />}
            tooltip="Download"
          />
        </div>
      </div>

      {/* Room Info */}
      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl px-4 py-2 border border-slate-200/50 z-10 transition-all duration-300">
        <div className="text-xs font-medium text-slate-500">
          Room: <span className="text-slate-900 font-semibold">{roomId}</span>
        </div>
      </div>
    </div>
  );
}
