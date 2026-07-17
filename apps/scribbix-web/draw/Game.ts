import type { CanvasPattern, CanvasTheme, Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";

export type Shape = { id?: string; locked?: boolean } & (
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      color: string;
      strokeWidth: number;
      fillColor?: string;
    }
  | {
      type: "circle";
      centerX: number;
      centerY: number;
      radius: number;
      color: string;
      strokeWidth: number;
      fillColor?: string;
    }
  | {
      type: "line";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      color: string;
      strokeWidth: number;
    }
  | {
      type: "pencil";
      points: { x: number; y: number }[];
      color: string;
      strokeWidth: number;
    }
  | {
      type: "arrow";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      color: string;
      strokeWidth: number;
    }
  | {
      type: "text";
      x: number;
      y: number;
      text: string;
      color: string;
      fontSize: number;
    }
);

type Point = { x: number; y: number };
type Selection = Pick<Shape, "id" | "locked"> | null;

export class Game {
  private ctx: CanvasRenderingContext2D;
  public existingShapes: Shape[] = [];
  private undoStack: Shape[][] = [];
  private redoStack: Shape[][] = [];
  private dragStartState: Shape[] | null = null;
  private clicked = false;
  private start = { x: 0, y: 0 };
  private selectedTool: Tool = "pencil";
  private selectedColor = "#0f172a";
  private strokeWidth = 2;
  private background: { theme: CanvasTheme; pattern: CanvasPattern } = {
    theme: "light",
    pattern: "dots",
  };
  private pencilPoints: Point[] = [];
  private selectedShapeIds: string[] = [];
  private draggingShape = false;
  private lastPointer: Point = { x: 0, y: 0 };
  private selectionBox: { start: Point; end: Point } | null = null;
  private viewport: Point = { x: 0, y: 0 };
  private zoom = 1;
  private panning = false;
  private spacePressed = false;
  private panStart: Point = { x: 0, y: 0 };
  private collaborators: { userId: string; userName: string }[] = [];

  constructor(
    private canvas: HTMLCanvasElement,
    private roomId: string,
    private socket: WebSocket,
    private requestTextInput: (
      screenX: number,
      screenY: number,
    ) => Promise<string | null>,
    private onSelectionChange?: (selection: Selection) => void,
    private onInteractionStart?: () => void,
    private onUsersChange?: (users: { userId: string; userName: string }[]) => void,
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.init();
    this.initHandlers();
    this.initMouseHandlers();
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.removeEventListener("mouseleave", this.mouseUpHandler);
    this.canvas.removeEventListener("wheel", this.wheelHandler);
    this.canvas.removeEventListener("contextmenu", this.preventContextMenu);
    window.removeEventListener("keydown", this.keyDownHandler);
    window.removeEventListener("keyup", this.keyUpHandler);
  }

  setTool(tool: Tool) {
    this.selectedTool = tool;
    if (tool !== "select") this.setSelectedShapes([]);
    this.clearCanvas();
  }

  setColor(color: string) {
    this.selectedColor = color;
  }
  setStrokeWidth(width: number) {
    this.strokeWidth = width;
  }
  setBackground(background: { theme: CanvasTheme; pattern: CanvasPattern }) {
    this.background = background;
    this.clearCanvas();
  }

  private pushToUndoStack() {
    this.undoStack.push(JSON.parse(JSON.stringify(this.existingShapes)));
    this.redoStack = [];
  }

  undo() {
    if (!this.undoStack.length) return;
    const previous = this.undoStack.pop();
    if (previous) {
      const current = this.existingShapes;
      this.redoStack.push(JSON.parse(JSON.stringify(current)));
      this.existingShapes = previous;
      this.syncChanges(current, previous);
      this.setSelectedShapes([]);
      this.clearCanvas();
    }
  }

  redo() {
    if (!this.redoStack.length) return;
    const next = this.redoStack.pop();
    if (next) {
      const current = this.existingShapes;
      this.undoStack.push(JSON.parse(JSON.stringify(current)));
      this.existingShapes = next;
      this.syncChanges(current, next);
      this.setSelectedShapes([]);
      this.clearCanvas();
    }
  }

  private syncChanges(from: Shape[], to: Shape[]) {
    const fromMap = new Map(from.map(s => [s.id, s]));
    const toMap = new Map(to.map(s => [s.id, s]));

    // Deleted (in 'from', not in 'to')
    for (const [id, shape] of fromMap) {
      if (!toMap.has(id)) {
        if (id) this.send({ action: "delete", shapeId: id });
      }
    }

    // Added or Updated (in 'to')
    for (const [id, shape] of toMap) {
      const currentShape = fromMap.get(id);
      if (!currentShape) {
        // Added
        this.send({ shape });
      } else if (JSON.stringify(currentShape) !== JSON.stringify(shape)) {
        // Updated
        this.send({ action: "update", shapeId: id, shape });
      }
    }
  }

  clear() {
    if (this.existingShapes.length === 0) return;
    this.pushToUndoStack();
    this.existingShapes.forEach((shape) => {
      if (shape.id) this.send({ action: "delete", shapeId: shape.id });
    });
    this.existingShapes = [];
    this.setSelectedShapes([]);
    this.clearCanvas();
  }

  clearSelection() {
    this.setSelectedShapes([]);
    this.clearCanvas();
  }

  deleteSelected() {
    if (this.selectedShapeIds.length === 0) return false;
    
    // Filter out shapes that are locked
    const shapesToDelete = this.existingShapes.filter(
      (shape) => this.selectedShapeIds.includes(shape.id!) && !shape.locked
    );
    if (shapesToDelete.length === 0) return false;

    this.pushToUndoStack();

    const deleteIds = shapesToDelete.map(s => s.id!);
    this.existingShapes = this.existingShapes.filter(
      (shape) => !deleteIds.includes(shape.id!)
    );
    this.setSelectedShapes([]);

    deleteIds.forEach(shapeId => {
      this.send({ action: "delete", shapeId });
    });

    this.clearCanvas();
    return true;
  }

  toggleSelectedLock() {
    if (this.selectedShapeIds.length === 0) return false;
    
    this.pushToUndoStack();

    this.existingShapes = this.existingShapes.map((shape) => {
      if (this.selectedShapeIds.includes(shape.id!)) {
        const updated = {
          ...shape,
          locked: !shape.locked,
        } as Shape;
        this.send({
          action: "lock",
          shapeId: updated.id,
          locked: Boolean(updated.locked),
        });
        return updated;
      }
      return shape;
    });

    this.notifySelection();
    this.clearCanvas();
    return true;
  }

  async init() {
    try {
      const response = await fetch(`/api/rooms/${this.roomId}/shapes`);
      if (!response.ok) throw new Error("Failed to load shapes");
      const shapes = await response.json();
      this.existingShapes = shapes;
      this.clearCanvas();
    } catch (error) {
      console.error("Error loading shapes:", error);
    }
  }

  private initHandlers() {
    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle presence events
        if (message.type === "room_joined") {
          this.collaborators = message.users || [];
          this.onUsersChange?.(this.collaborators);
          return;
        }
        if (message.type === "user_joined") {
          if (!this.collaborators.some(u => u.userId === message.userId)) {
            this.collaborators.push({ userId: message.userId, userName: message.userName || "Anonymous" });
            this.onUsersChange?.(this.collaborators);
          }
          return;
        }
        if (message.type === "user_left") {
          this.collaborators = this.collaborators.filter(u => u.userId !== message.userId);
          this.onUsersChange?.(this.collaborators);
          return;
        }

        if (message.type !== "draw" && message.type !== "chat") return;
        const data =
          typeof message.message === "string"
            ? JSON.parse(message.message)
            : message.message;
        if (data.action === "delete" && data.shapeId) {
          this.existingShapes = this.existingShapes.filter(
            (shape) => shape.id !== data.shapeId,
          );
          if (this.selectedShapeIds.includes(data.shapeId))
            this.setSelectedShapes(this.selectedShapeIds.filter(id => id !== data.shapeId));
          this.clearCanvas();
        } else if (data.action === "lock" && data.shapeId) {
          const index = this.existingShapes.findIndex(
            (shape) => shape.id === data.shapeId,
          );
          if (index !== -1)
            this.existingShapes[index] = {
              ...this.existingShapes[index],
              locked: Boolean(data.locked),
            } as Shape;
          this.notifySelection();
          this.clearCanvas();
        } else if (data.action === "update" && data.shapeId && data.shape) {
          this.upsertShape({ ...data.shape, id: data.shapeId });
        } else if (data.shape) {
          this.upsertShape(data.shape);
        }
      } catch (error) {
        console.error("Error handling canvas message:", error);
      }
    };
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle =
      this.background.theme === "dark" ? "#121214" : "#f8fafc";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.viewport.x, this.viewport.y);
    this.ctx.scale(this.zoom, this.zoom);
    this.drawBackgroundPattern();
    this.existingShapes.forEach((shape) => this.drawShape(shape));
    this.existingShapes.forEach((shape) => {
      if (shape.id && this.selectedShapeIds.includes(shape.id)) {
        this.drawSelection(shape);
      }
    });
    if (this.selectionBox) this.drawSelectionBox();
    this.ctx.restore();
  }

  private drawBackgroundPattern() {
    if (this.background.pattern === "blank") return;
    const baseSpacing = this.background.pattern === "grid" ? 24 : 20;
    let spacing = baseSpacing;
    while (spacing * this.zoom < 18) spacing *= 2;
    while (spacing * this.zoom > 42) spacing /= 2;
    const minX = Math.floor(-this.viewport.x / this.zoom / spacing) * spacing;
    const maxX =
      Math.ceil((this.canvas.width - this.viewport.x) / this.zoom / spacing) *
      spacing;
    const minY = Math.floor(-this.viewport.y / this.zoom / spacing) * spacing;
    const maxY =
      Math.ceil((this.canvas.height - this.viewport.y) / this.zoom / spacing) *
      spacing;

    this.ctx.save();
    this.ctx.lineWidth = 1 / this.zoom;

    if (this.background.pattern === "dots") {
      this.ctx.fillStyle =
        this.background.theme === "dark" ? "rgba(255, 255, 255, 0.20)" : "#94a3b8";
      for (let x = minX; x <= maxX; x += spacing) {
        for (let y = minY; y <= maxY; y += spacing) {
          this.ctx.beginPath();
          this.ctx.arc(x, y, 1 / this.zoom, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    } else if (this.background.pattern === "grid") {
      this.ctx.strokeStyle =
        this.background.theme === "dark" ? "rgba(255, 255, 255, 0.12)" : "#cbd5e1";
      for (let x = minX; x <= maxX; x += spacing) {
        this.drawLine(x, minY, x, maxY);
      }
      for (let y = minY; y <= maxY; y += spacing) {
        this.drawLine(minX, y, maxX, y);
      }
    }
    this.ctx.restore();
  }

  private drawLine(x1: number, y1: number, x2: number, y2: number) {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  private drawArrow(x1: number, y1: number, x2: number, y2: number) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLength = 12 / this.zoom;
    this.drawLine(x1, y1, x2, y2);
    this.ctx.beginPath();
    this.ctx.moveTo(x2, y2);
    this.ctx.lineTo(
      x2 - headLength * Math.cos(angle - Math.PI / 6),
      y2 - headLength * Math.sin(angle - Math.PI / 6),
    );
    this.ctx.moveTo(x2, y2);
    this.ctx.lineTo(
      x2 - headLength * Math.cos(angle + Math.PI / 6),
      y2 - headLength * Math.sin(angle + Math.PI / 6),
    );
    this.ctx.stroke();
  }

  private drawShape(shape: Shape) {
    this.ctx.save();
    this.ctx.strokeStyle = shape.color;
    this.ctx.lineWidth = shape.strokeWidth / this.zoom;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    switch (shape.type) {
      case "rect":
        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        break;
      case "circle":
        this.ctx.beginPath();
        this.ctx.arc(
          shape.centerX,
          shape.centerY,
          shape.radius,
          0,
          Math.PI * 2,
        );
        this.ctx.stroke();
        this.ctx.closePath();
        break;
      case "line":
        this.drawLine(shape.startX, shape.startY, shape.endX, shape.endY);
        break;
      case "arrow":
        this.drawArrow(shape.startX, shape.startY, shape.endX, shape.endY);
        break;
      case "pencil":
        if (shape.points.length > 0) {
          this.ctx.beginPath();
          this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
          for (let i = 1; i < shape.points.length; i++) {
            this.ctx.lineTo(shape.points[i].x, shape.points[i].y);
          }
          this.ctx.stroke();
        }
        break;
      case "text":
        this.ctx.fillStyle = shape.color;
        this.ctx.font = `${shape.fontSize / this.zoom}px Arial`;
        this.ctx.textBaseline = "alphabetic";
        this.ctx.fillText(shape.text, shape.x, shape.y);
        break;
    }
    this.ctx.restore();
  }

  private getShapeBounds(shape: Shape) {
    switch (shape.type) {
      case "rect":
        return {
          x: Math.min(shape.x, shape.x + shape.width),
          y: Math.min(shape.y, shape.y + shape.height),
          width: Math.abs(shape.width),
          height: Math.abs(shape.height),
        };
      case "circle":
        return {
          x: shape.centerX - shape.radius,
          y: shape.centerY - shape.radius,
          width: shape.radius * 2,
          height: shape.radius * 2,
        };
      case "line":
        return {
          x: Math.min(shape.startX, shape.endX),
          y: Math.min(shape.startY, shape.endY),
          width: Math.abs(shape.startX - shape.endX),
          height: Math.abs(shape.startY - shape.endY),
        };
      case "arrow":
        return {
          x: Math.min(shape.startX, shape.endX),
          y: Math.min(shape.startY, shape.endY),
          width: Math.abs(shape.startX - shape.endX),
          height: Math.abs(shape.startY - shape.endY),
        };
      case "pencil": {
        const xs = shape.points.map((p) => p.x);
        const ys = shape.points.map((p) => p.y);
        return {
          x: Math.min(...xs),
          y: Math.min(...ys),
          width: Math.max(...xs) - Math.min(...xs),
          height: Math.max(...ys) - Math.min(...ys),
        };
      }
      case "text":
        this.ctx.font = `${shape.fontSize / this.zoom}px Arial`;
        return {
          x: shape.x,
          y: shape.y - shape.fontSize,
          width: this.ctx.measureText(shape.text).width,
          height: shape.fontSize,
        };
    }
  }

  private drawSelection(shape: Shape) {
    const bounds = this.getShapeBounds(shape);
    const padding = 8 / this.zoom;
    this.ctx.save();
    this.ctx.fillStyle = "rgba(56,189,248,0.14)";
    this.ctx.strokeStyle = "#0ea5e9";
    this.ctx.lineWidth = 1.5 / this.zoom;
    this.ctx.setLineDash([2 / this.zoom, 4 / this.zoom]);
    this.ctx.fillRect(
      bounds.x - padding,
      bounds.y - padding,
      Math.max(bounds.width + padding * 2, 16 / this.zoom),
      Math.max(bounds.height + padding * 2, 16 / this.zoom),
    );
    this.ctx.strokeRect(
      bounds.x - padding,
      bounds.y - padding,
      Math.max(bounds.width + padding * 2, 16 / this.zoom),
      Math.max(bounds.height + padding * 2, 16 / this.zoom),
    );
    this.ctx.setLineDash([]);
    this.ctx.restore();
  }

  private drawSelectionBox() {
    if (!this.selectionBox) return;
    const { start, end } = this.selectionBox;
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.abs(start.x - end.x);
    const height = Math.abs(start.y - end.y);

    this.ctx.save();
    this.ctx.strokeStyle = "#1769ff";
    this.ctx.lineWidth = 1.5 / this.zoom;
    this.ctx.setLineDash([2 / this.zoom, 4 / this.zoom]);
    this.ctx.fillStyle = "rgba(23, 105, 255, 0.08)";

    this.ctx.beginPath();
    this.ctx.rect(x, y, width, height);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();
  }

  private findShapesInSelectionBox(box: { start: Point; end: Point }) {
    const x = Math.min(box.start.x, box.end.x);
    const y = Math.min(box.start.y, box.end.y);
    const width = Math.abs(box.start.x - box.end.x);
    const height = Math.abs(box.start.y - box.end.y);

    return this.existingShapes.filter((shape) => {
      const bounds = this.getShapeBounds(shape);
      return (
        bounds.x <= x + width &&
        bounds.x + bounds.width >= x &&
        bounds.y <= y + height &&
        bounds.y + bounds.height >= y
      );
    });
  }

  private findShapeAt(x: number, y: number) {
    return [...this.existingShapes].reverse().find((shape) => {
      const bounds = this.getShapeBounds(shape);
      const hit = 10 / this.zoom;
      return (
        x >= bounds.x - hit &&
        x <= bounds.x + bounds.width + hit &&
        y >= bounds.y - hit &&
        y <= bounds.y + bounds.height + hit
      );
    });
  }

  private moveShape(shape: Shape, dx: number, dy: number): Shape {
    switch (shape.type) {
      case "rect":
        return { ...shape, x: shape.x + dx, y: shape.y + dy };
      case "circle":
        return {
          ...shape,
          centerX: shape.centerX + dx,
          centerY: shape.centerY + dy,
        };
      case "line":
        return {
          ...shape,
          startX: shape.startX + dx,
          startY: shape.startY + dy,
          endX: shape.endX + dx,
          endY: shape.endY + dy,
        };
      case "arrow":
        return {
          ...shape,
          startX: shape.startX + dx,
          startY: shape.startY + dy,
          endX: shape.endX + dx,
          endY: shape.endY + dy,
        };
      case "pencil":
        return {
          ...shape,
          points: shape.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
        };
      case "text":
        return { ...shape, x: shape.x + dx, y: shape.y + dy };
    }
  }

  private toWorld(screen: Point): Point {
    return {
      x: (screen.x - this.viewport.x) / this.zoom,
      y: (screen.y - this.viewport.y) / this.zoom,
    };
  }

  private toScreen(e: MouseEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private mouseDownHandler = (e: MouseEvent) => {
    this.onInteractionStart?.();
    const screen = this.toScreen(e);
    if (this.selectedTool === "hand" || e.button === 1 || this.spacePressed) {
      this.panning = true;
      this.panStart = screen;
      return;
    }
    if (e.button !== 0) return;
    const point = this.toWorld(screen);
    this.start = point;
    if (this.selectedTool === "select") {
      const selected = this.findShapeAt(point.x, point.y);
      if (selected && selected.id) {
        const isAlreadySelected = this.selectedShapeIds.includes(selected.id);
        if (e.shiftKey) {
          if (isAlreadySelected) {
            this.setSelectedShapes(this.selectedShapeIds.filter(id => id !== selected.id));
          } else {
            this.setSelectedShapes([...this.selectedShapeIds, selected.id]);
          }
        } else {
          if (!isAlreadySelected) {
            this.setSelectedShapes([selected.id]);
          }
        }
        // Drag starts here.
        this.dragStartState = JSON.parse(JSON.stringify(this.existingShapes));
        this.draggingShape = this.selectedShapeIds.some(id => {
          const shape = this.existingShapes.find(item => item.id === id);
          return shape && !shape.locked;
        });
        this.lastPointer = point;
      } else {
        if (!e.shiftKey) {
          this.setSelectedShapes([]);
        }
        this.selectionBox = { start: point, end: point };
        this.clicked = true;
      }
      this.clearCanvas();
      return;
    }
    if (this.selectedTool === "eraser") {
      this.clicked = true;
      this.eraseAt(point);
      return;
    }
    this.clicked = true;
    if (this.selectedTool === "pencil") this.pencilPoints = [point];
  };

  private mouseUpHandler = async (e: MouseEvent) => {
    if (this.panning) {
      this.panning = false;
      return;
    }
    if (this.selectedTool === "select") {
      if (this.selectionBox) {
        const matchedShapes = this.findShapesInSelectionBox(this.selectionBox);
        const ids = matchedShapes.map(s => s.id!).filter(Boolean);
        this.setSelectedShapes(ids);
        this.selectionBox = null;
        this.clicked = false;
        this.clearCanvas();
        return;
      }
      if (this.draggingShape && this.selectedShapeIds.length > 0) {
        const moved = JSON.stringify(this.dragStartState) !== JSON.stringify(this.existingShapes);
        if (moved && this.dragStartState) {
          this.undoStack.push(this.dragStartState);
          this.redoStack = [];
        }
        this.dragStartState = null;
        this.selectedShapeIds.forEach(id => {
          const shape = this.existingShapes.find((item) => item.id === id);
          if (shape) this.send({ action: "update", shapeId: shape.id, shape });
        });
      }
      this.draggingShape = false;
      return;
    }
    if (this.selectedTool === "eraser") {
      this.clicked = false;
      return;
    }
    if (!this.clicked) return;
    this.clicked = false;
    const screen = this.toScreen(e);
    const end = this.toWorld(screen);
    const width = end.x - this.start.x;
    const height = end.y - this.start.y;
    let shape: Shape | null = null;
    switch (this.selectedTool) {
      case "rect":
        shape = {
          type: "rect",
          x: this.start.x,
          y: this.start.y,
          height,
          width,
          color: this.selectedColor,
          strokeWidth: this.strokeWidth,
        };
        break;
      case "circle":
        shape = {
          type: "circle",
          radius: Math.sqrt(width * width + height * height) / 2,
          centerX: this.start.x + width / 2,
          centerY: this.start.y + height / 2,
          color: this.selectedColor,
          strokeWidth: this.strokeWidth,
        };
        break;
      case "line":
        shape = {
          type: "line",
          startX: this.start.x,
          startY: this.start.y,
          endX: end.x,
          endY: end.y,
          color: this.selectedColor,
          strokeWidth: this.strokeWidth,
        };
        break;
      case "arrow":
        shape = {
          type: "arrow",
          startX: this.start.x,
          startY: this.start.y,
          endX: end.x,
          endY: end.y,
          color: this.selectedColor,
          strokeWidth: this.strokeWidth,
        };
        break;
      case "pencil": {
        const lastPoint = this.pencilPoints[this.pencilPoints.length - 1];
        if (!lastPoint || lastPoint.x !== end.x || lastPoint.y !== end.y)
          this.pencilPoints.push(end);
        if (this.pencilPoints.length > 1)
          shape = {
            type: "pencil",
            points: [...this.pencilPoints],
            color: this.selectedColor,
            strokeWidth: this.strokeWidth,
          };
        this.pencilPoints = [];
        break;
      }
      case "text": {
        const text = await this.requestTextInput(screen.x, screen.y);
        if (text)
          shape = {
            type: "text",
            x: end.x,
            y: end.y,
            text,
            color: this.selectedColor,
            fontSize: Math.max(16, this.strokeWidth * 6),
          };
        break;
      }
    }
    if (!shape) {
      this.clearCanvas();
      return;
    }
    const withId = { ...shape, id: this.createShapeId() };
    this.pushToUndoStack();
    this.existingShapes.push(withId);
    this.send({ shape: withId });
    this.clearCanvas();
  };

  private mouseMoveHandler = (e: MouseEvent) => {
    const screen = this.toScreen(e);
    if (this.panning) {
      this.viewport.x += screen.x - this.panStart.x;
      this.viewport.y += screen.y - this.panStart.y;
      this.panStart = screen;
      this.clearCanvas();
      return;
    }
    const point = this.toWorld(screen);
    if (this.selectedTool === "select" && this.selectionBox) {
      this.selectionBox.end = point;
      this.clearCanvas();
      return;
    }
    if (
      this.selectedTool === "select" &&
      this.draggingShape &&
      this.selectedShapeIds.length > 0
    ) {
      const dx = point.x - this.lastPointer.x;
      const dy = point.y - this.lastPointer.y;
      let movedAny = false;
      this.existingShapes = this.existingShapes.map((shape) => {
        if (this.selectedShapeIds.includes(shape.id!) && !shape.locked) {
          movedAny = true;
          return this.moveShape(shape, dx, dy);
        }
        return shape;
      });
      if (movedAny) {
        this.lastPointer = point;
        this.clearCanvas();
      }
      return;
    }
    if (!this.clicked) return;
    if (this.selectedTool === "eraser") {
      this.eraseAt(point);
      return;
    }
    if (this.selectedTool === "pencil") {
      const previous = this.pencilPoints[this.pencilPoints.length - 1];
      if (!previous || previous.x !== point.x || previous.y !== point.y) {
        this.pencilPoints.push(point);
        if (previous) {
          this.ctx.save();
          this.ctx.translate(this.viewport.x, this.viewport.y);
          this.ctx.scale(this.zoom, this.zoom);
          this.ctx.strokeStyle = this.selectedColor;
          this.ctx.lineWidth = this.strokeWidth / this.zoom;
          this.ctx.lineCap = "round";
          this.ctx.lineJoin = "round";
          this.drawLine(previous.x, previous.y, point.x, point.y);
          this.ctx.restore();
        }
      }
      return;
    }
    const width = point.x - this.start.x;
    const height = point.y - this.start.y;
    this.clearCanvas();
    this.ctx.save();
    this.ctx.translate(this.viewport.x, this.viewport.y);
    this.ctx.scale(this.zoom, this.zoom);
    this.ctx.strokeStyle = this.selectedColor;
    this.ctx.lineWidth = this.strokeWidth / this.zoom;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    switch (this.selectedTool) {
      case "rect":
        this.ctx.strokeRect(this.start.x, this.start.y, width, height);
        break;
      case "circle":
        this.ctx.beginPath();
        this.ctx.arc(
          this.start.x + width / 2,
          this.start.y + height / 2,
          Math.sqrt(width * width + height * height) / 2,
          0,
          Math.PI * 2,
        );
        this.ctx.stroke();
        this.ctx.closePath();
        break;
      case "line":
        this.drawLine(this.start.x, this.start.y, point.x, point.y);
        break;
      case "arrow":
        this.drawArrow(this.start.x, this.start.y, point.x, point.y);
        break;
    }
    this.ctx.restore();
  };

  private wheelHandler = (e: WheelEvent) => {
    e.preventDefault();
    const screen = this.toScreen(e);
    const world = this.toWorld(screen);
    const nextZoom = Math.min(
      3,
      Math.max(0.35, this.zoom * (e.deltaY < 0 ? 1.1 : 0.9)),
    );
    this.zoom = nextZoom;
    this.viewport = {
      x: screen.x - world.x * this.zoom,
      y: screen.y - world.y * this.zoom,
    };
    this.clearCanvas();
  };
  private preventContextMenu = (e: MouseEvent) => e.preventDefault();
  
  private keyDownHandler = (e: KeyboardEvent) => {
    if (this.isTypingTarget(e.target)) return;

    if (e.code === "Space") {
      e.preventDefault();
      this.spacePressed = true;
      return;
    }

    const isCtrlOrMeta = e.ctrlKey || e.metaKey;
    if (isCtrlOrMeta) {
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          this.redo();
        } else {
          this.undo();
        }
      } else if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        this.redo();
      }
    }
  };

  private keyUpHandler = (e: KeyboardEvent) => {
    if (e.code === "Space") this.spacePressed = false;
  };

  private eraseAt(point: Point) {
    const shape = this.findShapeAt(point.x, point.y);
    if (!shape || shape.locked || !shape.id) return;
    this.pushToUndoStack();
    this.existingShapes = this.existingShapes.filter(
      (item) => item.id !== shape.id,
    );
    if (this.selectedShapeIds.includes(shape.id))
      this.setSelectedShapes(this.selectedShapeIds.filter(id => id !== shape.id));
    this.send({ action: "delete", shapeId: shape.id });
    this.clearCanvas();
  }

  private isTypingTarget(target: EventTarget | null) {
    return (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    );
  }

  private setSelectedShapes(ids: string[]) {
    this.selectedShapeIds = ids;
    this.notifySelection();
  }

  private notifySelection() {
    if (this.selectedShapeIds.length === 0) {
      this.onSelectionChange?.(null);
      return;
    }
    const firstSelected = this.existingShapes.find(
      (item) => item.id === this.selectedShapeIds[0],
    );
    const anyLocked = this.existingShapes.some(
      (item) => this.selectedShapeIds.includes(item.id!) && item.locked
    );
    this.onSelectionChange?.(
      firstSelected ? { id: firstSelected.id, locked: anyLocked } : null,
    );
  }

  private upsertShape(shape: Shape) {
    const withId = { ...shape, id: shape.id ?? this.createShapeId() };
    const index = this.existingShapes.findIndex(
      (item) => item.id === withId.id,
    );
    if (index === -1) this.existingShapes.push(withId);
    else this.existingShapes[index] = withId;
    this.notifySelection();
    this.clearCanvas();
  }

  private createShapeId() {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private send(data: Record<string, unknown>) {
    this.socket.send(
      JSON.stringify({
        type: "draw",
        roomId: this.roomId,
        message: JSON.stringify(data),
      }),
    );
  }

  private initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("mouseleave", this.mouseUpHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.addEventListener("wheel", this.wheelHandler, {
      passive: false,
    });
    this.canvas.addEventListener("contextmenu", this.preventContextMenu);
    window.addEventListener("keydown", this.keyDownHandler);
    window.addEventListener("keyup", this.keyUpHandler);
  }
}
