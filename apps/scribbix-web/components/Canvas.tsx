"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Circle,
  CircleDot,
  Copy,
  Download,
  Eraser,
  Grid2X2,
  Hand,
  Keyboard,
  LockKeyhole,
  Minus,
  MoreHorizontal,
  Moon,
  MousePointer,
  Pencil,
  RectangleHorizontal,
  Redo,
  Share2,
  Square,
  Sun,
  Trash2,
  Type,
  Undo,
  UnlockKeyhole,
} from "lucide-react";
import { Game } from "@/draw/Game";
import { BrandLogo } from "./BrandLogo";
import { IconButton } from "./IconButton";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { cn } from "@/lib/utils";

export type Tool =
  | "select"
  | "hand"
  | "eraser"
  | "circle"
  | "rect"
  | "pencil"
  | "line"
  | "arrow"
  | "text";
export type CanvasTheme = "light" | "dark";
export type CanvasPattern = "blank" | "dots" | "grid";

const colors = [
  "#0f172a",
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#a855f7",
  "#ec4899",
  "#f97316",
  "#06b6d4",
  "#14b8a6",
  "#78350f",
  "#ffffff",
];

const strokeWidths = [1, 2, 4, 6, 8];

const backgroundOptions: Array<{
  value: CanvasPattern;
  label: string;
  icon: typeof CircleDot;
}> = [
  { value: "blank", label: "Blank", icon: Square },
  { value: "dots", label: "Dots", icon: CircleDot },
  { value: "grid", label: "Grid", icon: Grid2X2 },
];

const avatarColors = [
  "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50",
  "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50",
  "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50",
  "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50",
  "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50",
  "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50",
  "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-900/50",
];

const getUserColorClass = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarColors.length;
  return avatarColors[index];
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export function Canvas({
  roomId,
  socket,
  canvasName,
  canRename,
  onRename,
}: {
  roomId: string;
  socket: WebSocket;
  canvasName: string;
  canRename: boolean;
  onRename: (name: string) => Promise<boolean>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [game, setGame] = useState<Game>();
  const [selectedTool, setSelectedTool] = useState<Tool>("pencil");
  const [selectedColor, setSelectedColor] = useState("#0f172a");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [theme, setTheme] = useState<CanvasTheme>("light");
  const [pattern, setPattern] = useState<CanvasPattern>("dots");
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [showPatternMenu, setShowPatternMenu] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [collaborators, setCollaborators] = useState<{ userId: string; userName: string }[]>([]);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [textInput, setTextInput] = useState<{
    x: number;
    y: number;
    value: string;
  } | null>(null);
  const [selection, setSelection] = useState<{
    id?: string;
    locked?: boolean;
  } | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(canvasName);
  const [renaming, setRenaming] = useState(false);
  const textResolver = useRef<((value: string | null) => void) | null>(null);

  const requestTextInput = useCallback(
    (x: number, y: number) =>
      new Promise<string | null>((resolve) => {
        textResolver.current = resolve;
        setTextInput({ x, y, value: "" });
      }),
    [],
  );

  const resolveTextInput = useCallback((value: string) => {
    textResolver.current?.(value.trim() || null);
    textResolver.current = null;
    setTextInput(null);
  }, []);

  useEffect(() => setNameDraft(canvasName), [canvasName]);

  useEffect(() => {
    const saved = window.localStorage.getItem(
      `scribbix-canvas-style:${roomId}`,
    );
    if (!saved) return;

    try {
      const value = JSON.parse(saved) as {
        theme?: CanvasTheme;
        pattern?: CanvasPattern;
      };
      if (value.theme === "light" || value.theme === "dark")
        setTheme(value.theme);
      if (["blank", "dots", "grid"].includes(value.pattern ?? "")) {
        setPattern(value.pattern as CanvasPattern);
      }
    } catch {
      window.localStorage.removeItem(`scribbix-canvas-style:${roomId}`);
    }
  }, [roomId]);

  useEffect(() => {
    window.localStorage.setItem(
      `scribbix-canvas-style:${roomId}`,
      JSON.stringify({ theme, pattern }),
    );
    game?.setBackground({ theme, pattern });
  }, [game, pattern, roomId, theme]);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      setDimensions({
        width: entry.contentRect.width || 600,
        height: entry.contentRect.height || 400,
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => game?.setTool(selectedTool), [game, selectedTool]);
  useEffect(() => game?.setColor(selectedColor), [game, selectedColor]);
  useEffect(() => game?.setStrokeWidth(strokeWidth), [game, strokeWidth]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const nextGame = new Game(
      canvasRef.current,
      roomId,
      socket,
      requestTextInput,
      setSelection,
      () => {
        setShowStylePanel(false);
        setShowPatternMenu(false);
      },
      setCollaborators,
    );
    setGame(nextGame);
    return () => {
      textResolver.current?.(null);
      textResolver.current = null;
      nextGame.destroy();
    };
  }, [requestTextInput, roomId, socket]);

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) =>
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLElement && target.isContentEditable);
    const shortcuts: Record<string, Tool> = {
      v: "select",
      r: "rect",
      o: "circle",
      a: "arrow",
      l: "line",
      d: "pencil",
      t: "text",
      h: "hand",
      e: "eraser",
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        game?.deleteSelected()
      ) {
        event.preventDefault();
        return;
      }
      if (event.key === "Escape") {
        game?.clearSelection();
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const tool = shortcuts[event.key.toLowerCase()];
      if (tool) {
        event.preventDefault();
        setSelectedTool(tool);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [game]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `scribbix-${roomId}-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const copyShareLink = async () => {
    const url = `${window.location.origin}/canvas/${roomId}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      window.prompt("Copy this shared canvas link", url);
    }
  };

  const saveCanvasName = async () => {
    const nextName = nameDraft.trim();
    if (!nextName || nextName === canvasName) {
      setNameDraft(canvasName);
      setEditingName(false);
      return;
    }
    setRenaming(true);
    const saved = await onRename(nextName);
    setRenaming(false);
    if (saved) setEditingName(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative size-full overflow-hidden transition-colors duration-300",
        theme === "dark" ? "dark bg-[#121214]" : "bg-slate-50",
      )}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className={cn(
          "block size-full",
          selectedTool === "text"
            ? "cursor-text"
            : selectedTool === "hand"
              ? "cursor-grab active:cursor-grabbing"
              : selectedTool === "select"
                ? "cursor-default"
                : "cursor-crosshair",
        )}
      />

      <header className="absolute top-4 left-4 right-4 z-20 flex h-14 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 shadow-lg shadow-slate-950/5 backdrop-blur-md transition-all duration-300 dark:border-zinc-800/60 dark:bg-zinc-900/80 dark:shadow-zinc-950/40">
        <BrandLogo href="/dashboard" className="text-xl dark:text-white shrink-0" />
        <span className="h-6 w-px bg-slate-200 dark:bg-zinc-800 shrink-0" />
        {editingName ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            onBlur={saveCanvasName}
            onKeyDown={(event) => {
              if (event.key === "Enter") void saveCanvasName();
              if (event.key === "Escape") {
                setNameDraft(canvasName);
                setEditingName(false);
              }
            }}
            disabled={renaming}
            className="h-8 w-48 rounded-lg border border-[#1769ff] bg-white px-2 text-sm font-semibold text-slate-700 outline-none dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-200"
            aria-label="Canvas name"
          />
        ) : (
          <button
            type="button"
            disabled={!canRename}
            onClick={() => canRename && setEditingName(true)}
            className={cn(
              "max-w-52 truncate text-left text-sm font-semibold text-slate-700 dark:text-zinc-200 shrink-0",
              canRename &&
                "rounded-md px-1 py-1 transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-[#1769ff] dark:hover:text-[#1769ff]",
            )}
          >
            {canvasName}
          </button>
        )}
        <button
          type="button"
          onClick={() =>
            setTheme((current) => (current === "light" ? "dark" : "light"))
          }
          className="ml-auto relative h-8 w-14 rounded-xl border border-slate-200/80 bg-slate-50 p-[3px] transition-all duration-300 hover:border-slate-300 hover:bg-slate-100 dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:hover:border-zinc-700 shrink-0"
          aria-label={theme === "dark" ? "Use light canvas" : "Use dark canvas"}
        >
          <span
            className="absolute top-[3px] size-6 rounded-[9px] bg-white shadow-sm border border-slate-200/10 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] dark:bg-zinc-950 dark:border-zinc-800/60"
            style={{
              left: theme === "dark" ? "29px" : "3px",
            }}
          />
          <span
            className={cn(
              "absolute left-[3px] top-[3px] size-6 flex items-center justify-center z-10 transition-all duration-300 pointer-events-none",
              theme === "light" ? "text-amber-500 scale-100 rotate-0" : "text-zinc-500 scale-90 -rotate-45",
            )}
          >
            <Sun className="size-3.5" />
          </span>
          <span
            className={cn(
              "absolute right-[3px] top-[3px] size-6 flex items-center justify-center z-10 transition-all duration-300 pointer-events-none",
              theme === "dark" ? "text-white scale-100 rotate-0" : "text-zinc-550 scale-90 rotate-45",
            )}
          >
            <Moon className="size-3.5" />
          </span>
        </button>
        {collaborators.length > 0 && (
          <div className="flex -space-x-2 items-center mr-1 select-none shrink-0">
            {collaborators.map((user) => (
              <div
                key={user.userId}
                title={user.userName}
                className={cn(
                  "relative size-8 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[10px] font-extrabold tracking-wider transition-all duration-200 hover:-translate-y-0.5 hover:z-10 shadow-sm cursor-default shrink-0",
                  getUserColorClass(user.userId),
                )}
              >
                {getInitials(user.userName)}
              </div>
            ))}
          </div>
        )}
        <Button
          type="button"
          size="sm"
          onClick={() => setShowShareDialog(true)}
          className="h-9 rounded-xl bg-slate-950 px-4 font-bold text-white hover:bg-slate-800 shadow-md shadow-slate-950/10 active:scale-[0.98] transition-all duration-200 shrink-0 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white dark:shadow-white/5"
        >
          <Share2 className="mr-1.5 size-4" data-icon="inline-start" />
          Share
        </Button>
        <div className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-50 p-0.5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/40 shrink-0">
          <IconButton
            onClick={() => game?.undo()}
            activated={false}
            icon={<Undo />}
            tooltip="Undo"
            tooltipPlacement="bottom"
          />
          <IconButton
            onClick={() => game?.redo()}
            activated={false}
            icon={<Redo />}
            tooltip="Redo"
            tooltipPlacement="bottom"
          />
          <IconButton
            onClick={() => setShowClearDialog(true)}
            activated={false}
            icon={<Trash2 />}
            tooltip="Clear canvas"
            tooltipPlacement="bottom"
          />
          <IconButton
            onClick={handleDownload}
            activated={false}
            icon={<Download />}
            tooltip="Download"
            tooltipPlacement="bottom"
          />
        </div>
      </header>

      {textInput && (
        <input
          autoFocus
          value={textInput.value}
          aria-label="New canvas text"
          onChange={(event) =>
            setTextInput((current) =>
              current ? { ...current, value: event.target.value } : current,
            )
          }
          onBlur={(event) => resolveTextInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              resolveTextInput(textInput.value);
            }
            if (event.key === "Escape") {
              event.preventDefault();
              resolveTextInput("");
            }
          }}
          style={{ left: textInput.x, top: textInput.y - 20 }}
          className="absolute z-20 h-10 w-72 border border-sky-500 bg-white px-2 text-base font-medium text-slate-900 outline-none shadow-sm"
        />
      )}

      <div className="absolute left-4 top-20 rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-xl shadow-slate-950/10 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-900/80 dark:shadow-zinc-950/40">
        <div className="flex flex-col gap-1">
          <IconButton
            onClick={() => setSelectedTool("select")}
            activated={selectedTool === "select"}
            icon={<MousePointer />}
            tooltip="Selection cursor"
          />
          <IconButton
            onClick={() => setSelectedTool("hand")}
            activated={selectedTool === "hand"}
            icon={<Hand />}
            tooltip="Hand / pan"
          />
          <IconButton
            onClick={() => setSelectedTool("pencil")}
            activated={selectedTool === "pencil"}
            icon={<Pencil />}
            tooltip="Pencil"
          />
          <IconButton
            onClick={() => setSelectedTool("line")}
            activated={selectedTool === "line"}
            icon={<Minus />}
            tooltip="Line"
          />
          <IconButton
            onClick={() => setSelectedTool("arrow")}
            activated={selectedTool === "arrow"}
            icon={<ArrowRight />}
            tooltip="Arrow"
          />
          <IconButton
            onClick={() => setSelectedTool("rect")}
            activated={selectedTool === "rect"}
            icon={<RectangleHorizontal />}
            tooltip="Rectangle"
          />
          <IconButton
            onClick={() => setSelectedTool("circle")}
            activated={selectedTool === "circle"}
            icon={<Circle />}
            tooltip="Circle"
          />
          <IconButton
            onClick={() => setSelectedTool("text")}
            activated={selectedTool === "text"}
            icon={<Type />}
            tooltip="Text"
          />
          <IconButton
            onClick={() => setSelectedTool("eraser")}
            activated={selectedTool === "eraser"}
            icon={<Eraser />}
            tooltip="Eraser"
          />
          <span className="mx-1 h-px bg-slate-200 dark:bg-zinc-800/80" />
          <IconButton
            onClick={() => setShowPatternMenu((open) => !open)}
            activated={showPatternMenu}
            icon={(() => {
              const currentOption = backgroundOptions.find((opt) => opt.value === pattern) || backgroundOptions[1];
              const PatternIcon = currentOption.icon;
              return <PatternIcon />;
            })()}
            tooltip="Canvas pattern"
          />
          <IconButton
            onClick={() => game?.toggleSelectedLock()}
            activated={Boolean(selection?.locked)}
            icon={<LockKeyhole />}
            tooltip={
              selection ? "Lock selected item" : "Select an item to lock"
            }
          />
        </div>
        {showPatternMenu && (
          <div className="absolute left-full top-[18.75rem] ml-3 flex gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/10 dark:border-zinc-800/60 dark:bg-zinc-900/90 dark:shadow-zinc-950/40 dark:text-zinc-200">
            {backgroundOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setPattern(value);
                  setShowPatternMenu(false);
                }}
                className={cn(
                  "flex h-12 w-14 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-semibold",
                  pattern === value
                    ? "bg-[#eef3ff] text-[#1769ff] dark:bg-blue-500/10 dark:text-blue-400"
                    : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100",
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {((selectedTool !== "select" &&
        selectedTool !== "hand" &&
        selectedTool !== "eraser") ||
        selection) && (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-2xl border border-slate-200/90 bg-white/80 p-1.5 shadow-xl shadow-slate-950/10 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-900/80 dark:shadow-zinc-950/40">
          {selection ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => game?.toggleSelectedLock()}
                className="h-8 rounded-lg px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80"
              >
                {selection.locked ? (
                  <UnlockKeyhole data-icon="inline-start" />
                ) : (
                  <LockKeyhole data-icon="inline-start" />
                )}
                {selection.locked ? "Unlock" : "Lock"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => game?.deleteSelected()}
                disabled={selection.locked}
                className="h-8 rounded-lg px-3 text-xs font-semibold text-red-600 hover:bg-red-50/50 hover:text-red-500 dark:text-red-400 dark:hover:bg-red-950/20 disabled:opacity-40"
              >
                <Trash2 data-icon="inline-start" /> Delete
              </Button>
            </>
          ) : (
            <>
              <button
                type="button"
                aria-label="Open color and stroke choices"
                onClick={() => setShowStylePanel((open) => !open)}
                className="flex h-8 items-center gap-2 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/80"
              >
                <span
                  className="size-4 rounded-full"
                  style={{ backgroundColor: selectedColor }}
                />
                {strokeWidth}px
              </button>
              <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-800" />
              <span className="px-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                {selectedTool === "rect"
                  ? "Rectangle · R"
                  : selectedTool === "circle"
                    ? "Circle · O"
                    : selectedTool === "arrow"
                      ? "Arrow · A"
                      : selectedTool === "line"
                        ? "Line · L"
                        : selectedTool === "text"
                          ? "Text · T"
                          : "Pencil · D"}
              </span>
            </>
          )}
          {showStylePanel && !selection && (
            <div className="absolute bottom-full left-1/2 mb-3 w-60 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xl shadow-slate-950/15 dark:border-zinc-800/60 dark:bg-zinc-900/95 dark:shadow-zinc-950/40">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                Color
              </p>
              <div className="grid grid-cols-4 gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Use ${color}`}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl border-2 transition-transform duration-200 hover:scale-105",
                      selectedColor === color
                        ? "border-[#1769ff]"
                        : color === "#ffffff"
                          ? "border-slate-200"
                          : "border-transparent",
                    )}
                    style={{ backgroundColor: color }}
                  >
                    {selectedColor === color && (
                      <Check
                        className={cn(
                          "size-4",
                          color === "#ffffff" ? "text-slate-800" : "text-white",
                        )}
                      />
                    )}
                  </button>
                ))}
              </div>
              <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                Stroke
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {strokeWidths.map((width) => (
                  <button
                    key={width}
                    type="button"
                    onClick={() => setStrokeWidth(width)}
                    className={cn(
                      "flex h-9 items-center justify-center rounded-lg transition-colors",
                      strokeWidth === width
                        ? "bg-[#1769ff] text-white"
                        : "bg-slate-50 text-slate-900 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800/80",
                    )}
                  >
                    <span
                      className="rounded-full bg-current"
                      style={{
                        width: Math.max(width * 2, 3),
                        height: Math.max(width * 2, 3),
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="absolute bottom-4 right-4 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-medium text-slate-500 shadow-lg shadow-slate-950/5 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-900/80 dark:text-zinc-400">
        Room <span className="font-semibold text-slate-900 dark:text-zinc-200">{roomId}</span>
      </div>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#0a1738]">
              Share this canvas
            </DialogTitle>
            <DialogDescription className="leading-relaxed text-slate-500">
              Anyone signed in with this link can join the board and it will
              appear in their shared canvases.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowShareDialog(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={copyShareLink}
              className="bg-[#0a1738] text-white hover:bg-[#17254a]"
            >
              {linkCopied ? (
                <Check data-icon="inline-start" />
              ) : (
                <Copy data-icon="inline-start" />
              )}
              {linkCopied ? "Link copied" : "Copy link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#0a1738]">
              Clear this canvas?
            </DialogTitle>
            <DialogDescription className="leading-relaxed text-slate-500">
              All drawings on this canvas will be removed for everyone. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowClearDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                game?.clear();
                setShowClearDialog(false);
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              <Trash2 data-icon="inline-start" /> Clear canvas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
