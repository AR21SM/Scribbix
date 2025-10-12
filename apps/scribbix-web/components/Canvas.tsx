"use client";

import { initDraw } from "@/draw";
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
    Palette
} from "lucide-react";
import { Game } from "@/draw/Game";

export type Tool = "circle" | "rect" | "pencil" | "line" | "arrow";

const colors = [
    "#ffffff", // White
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
    socket
}: {
    socket: WebSocket;
    roomId: string;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [game, setGame] = useState<Game>();
    const [selectedTool, setSelectedTool] = useState<Tool>("pencil");
    const [selectedColor, setSelectedColor] = useState("#ffffff");
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [showColorPicker, setShowColorPicker] = useState(false);

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
            }
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
            const link = document.createElement('a');
            link.download = `scribbix-${roomId}-${Date.now()}.png`;
            link.href = canvasRef.current.toDataURL();
            link.click();
        }
    };

    return (
        <div className="h-screen overflow-hidden bg-gray-900">
            <canvas 
                ref={canvasRef} 
                width={window.innerWidth} 
                height={window.innerHeight}
                className="cursor-crosshair"
            />
            
            {/* Main Toolbar */}
            <div className="fixed top-4 left-4 bg-gray-800 rounded-lg shadow-2xl p-2 border border-gray-700">
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
            <div className="fixed top-4 left-20 bg-gray-800 rounded-lg shadow-2xl p-2 border border-gray-700">
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="p-2 rounded hover:bg-gray-700 transition-colors relative"
                        style={{ backgroundColor: selectedColor }}
                    >
                        <Palette size={20} className="text-gray-900" />
                    </button>
                    
                    {showColorPicker && (
                        <div className="absolute left-full ml-2 top-0 bg-gray-800 rounded-lg shadow-2xl p-3 border border-gray-700">
                            <div className="grid grid-cols-4 gap-2 mb-3">
                                {colors.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => {
                                            setSelectedColor(color);
                                            setShowColorPicker(false);
                                        }}
                                        className={`w-8 h-8 rounded border-2 transition-all ${
                                            selectedColor === color 
                                                ? 'border-white scale-110' 
                                                : 'border-gray-600 hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                            <div className="space-y-2">
                                <div className="text-xs text-gray-400 mb-1">Stroke Width</div>
                                {strokeWidths.map((width) => (
                                    <button
                                        key={width}
                                        onClick={() => setStrokeWidth(width)}
                                        className={`w-full py-1 rounded flex items-center justify-center ${
                                            strokeWidth === width
                                                ? 'bg-blue-600'
                                                : 'bg-gray-700 hover:bg-gray-600'
                                        }`}
                                    >
                                        <div 
                                            className="bg-white rounded-full"
                                            style={{ 
                                                width: `${width * 2}px`, 
                                                height: `${width * 2}px` 
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
            <div className="fixed top-4 right-4 bg-gray-800 rounded-lg shadow-2xl p-2 border border-gray-700">
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
            <div className="fixed bottom-4 left-4 bg-gray-800 rounded-lg shadow-2xl px-4 py-2 border border-gray-700">
                <div className="text-sm text-gray-400">
                    Room: <span className="text-white font-semibold">{roomId}</span>
                </div>
            </div>
        </div>
    );
}
