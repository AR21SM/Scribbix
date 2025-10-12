import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";

export type Shape = {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    strokeWidth: number;
    fillColor?: string;
} | {
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
    color: string;
    strokeWidth: number;
    fillColor?: string;
} | {
    type: "line";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color: string;
    strokeWidth: number;
} | {
    type: "pencil";
    points: { x: number; y: number }[];
    color: string;
    strokeWidth: number;
} | {
    type: "arrow";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color: string;
    strokeWidth: number;
} | {
    type: "text";
    x: number;
    y: number;
    text: string;
    color: string;
    fontSize: number;
}

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShapes: Shape[];
    private roomId: string;
    private clicked: boolean;
    private startX = 0;
    private startY = 0;
    private selectedTool: Tool = "circle";
    private selectedColor: string = "#ffffff";
    private strokeWidth: number = 2;
    private pencilPoints: { x: number; y: number }[] = [];
    private undoStack: Shape[][] = [];
    private currentShapeIndex = 0;
    
    socket: WebSocket;

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.existingShapes = [];
        this.roomId = roomId;
        this.socket = socket;
        this.clicked = false;
        this.init();
        this.initHandlers();
        this.initMouseHandlers();
    }
    
    destroy() {
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
        this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
    }

    setTool(tool: Tool) {
        this.selectedTool = tool;
    }

    setColor(color: string) {
        this.selectedColor = color;
    }

    setStrokeWidth(width: number) {
        this.strokeWidth = width;
    }

    undo() {
        if (this.existingShapes.length > 0) {
            this.existingShapes.pop();
            this.clearCanvas();
        }
    }

    clear() {
        this.existingShapes = [];
        this.clearCanvas();
    }

    async init() {
        try {
            this.existingShapes = await getExistingShapes(this.roomId);
            console.log('Loaded shapes:', this.existingShapes.length);
            this.clearCanvas();
        } catch(e) {
            console.error('Error loading shapes:', e);
        }
    }

    initHandlers() {
        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);

                if (message.type === "draw" || message.type === "chat") {
                    const parsedShape = typeof message.message === 'string' 
                        ? JSON.parse(message.message) 
                        : message.message;
                    
                    if (parsedShape.shape) {
                        this.existingShapes.push(parsedShape.shape);
                        this.clearCanvas();
                    }
                }
            } catch(e) {
                console.error('Error handling message:', e);
            }
        };
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "#1a1a1a";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.existingShapes.forEach((shape) => {
            this.drawShape(shape);
        });
    }

    drawShape(shape: Shape) {
        this.ctx.strokeStyle = shape.color || "#ffffff";
        this.ctx.lineWidth = shape.strokeWidth || 2;
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";

        switch(shape.type) {
            case "rect":
                if (shape.fillColor) {
                    this.ctx.fillStyle = shape.fillColor;
                    this.ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
                }
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
                break;

            case "circle":
                this.ctx.beginPath();
                this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
                if (shape.fillColor) {
                    this.ctx.fillStyle = shape.fillColor;
                    this.ctx.fill();
                }
                this.ctx.stroke();
                this.ctx.closePath();
                break;

            case "line":
                this.ctx.beginPath();
                this.ctx.moveTo(shape.startX, shape.startY);
                this.ctx.lineTo(shape.endX, shape.endY);
                this.ctx.stroke();
                this.ctx.closePath();
                break;

            case "pencil":
                if (shape.points.length > 0) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
                    for (let i = 1; i < shape.points.length; i++) {
                        this.ctx.lineTo(shape.points[i].x, shape.points[i].y);
                    }
                    this.ctx.stroke();
                    this.ctx.closePath();
                }
                break;

            case "arrow":
                this.drawArrow(shape.startX, shape.startY, shape.endX, shape.endY);
                break;

            case "text":
                this.ctx.font = `${shape.fontSize || 16}px Arial`;
                this.ctx.fillStyle = shape.color;
                this.ctx.fillText(shape.text, shape.x, shape.y);
                break;
        }
    }

    drawArrow(fromX: number, fromY: number, toX: number, toY: number) {
        const headLength = 15;
        const angle = Math.atan2(toY - fromY, toX - fromX);

        // Draw line
        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        this.ctx.stroke();

        // Draw arrowhead
        this.ctx.beginPath();
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(
            toX - headLength * Math.cos(angle - Math.PI / 6),
            toY - headLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(
            toX - headLength * Math.cos(angle + Math.PI / 6),
            toY - headLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();
        this.ctx.closePath();
    }

    mouseDownHandler = (e: MouseEvent) => {
        this.clicked = true;
        const rect = this.canvas.getBoundingClientRect();
        this.startX = e.clientX - rect.left;
        this.startY = e.clientY - rect.top;
        
        if (this.selectedTool === "pencil") {
            this.pencilPoints = [{ x: this.startX, y: this.startY }];
        }
    }

    mouseUpHandler = (e: MouseEvent) => {
        if (!this.clicked) return;
        
        this.clicked = false;
        const rect = this.canvas.getBoundingClientRect();
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;
        const width = endX - this.startX;
        const height = endY - this.startY;

        let shape: Shape | null = null;

        switch(this.selectedTool) {
            case "rect":
                shape = {
                    type: "rect",
                    x: this.startX,
                    y: this.startY,
                    height,
                    width,
                    color: this.selectedColor,
                    strokeWidth: this.strokeWidth
                };
                break;

            case "circle": {
                const radius = Math.sqrt(width * width + height * height) / 2;
                shape = {
                    type: "circle",
                    radius: radius,
                    centerX: this.startX + width / 2,
                    centerY: this.startY + height / 2,
                    color: this.selectedColor,
                    strokeWidth: this.strokeWidth
                };
                break;
            }

            case "line":
                shape = {
                    type: "line",
                    startX: this.startX,
                    startY: this.startY,
                    endX,
                    endY,
                    color: this.selectedColor,
                    strokeWidth: this.strokeWidth
                };
                break;

            case "arrow":
                shape = {
                    type: "arrow",
                    startX: this.startX,
                    startY: this.startY,
                    endX,
                    endY,
                    color: this.selectedColor,
                    strokeWidth: this.strokeWidth
                };
                break;

            case "pencil":
                if (this.pencilPoints.length > 1) {
                    shape = {
                        type: "pencil",
                        points: [...this.pencilPoints],
                        color: this.selectedColor,
                        strokeWidth: this.strokeWidth
                    };
                }
                this.pencilPoints = [];
                break;
        }

        if (!shape) {
            return;
        }

        this.existingShapes.push(shape);

        this.socket.send(JSON.stringify({
            type: "draw",
            message: JSON.stringify({ shape }),
            roomId: this.roomId
        }));

        this.clearCanvas();
    }

    mouseMoveHandler = (e: MouseEvent) => {
        const rect = this.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        if (this.clicked) {
            const width = currentX - this.startX;
            const height = currentY - this.startY;
            
            this.clearCanvas();
            this.ctx.strokeStyle = this.selectedColor;
            this.ctx.lineWidth = this.strokeWidth;
            this.ctx.lineCap = "round";
            this.ctx.lineJoin = "round";

            switch(this.selectedTool) {
                case "rect":
                    this.ctx.strokeRect(this.startX, this.startY, width, height);
                    break;

                case "circle": {
                    const radius = Math.sqrt(width * width + height * height) / 2;
                    const centerX = this.startX + width / 2;
                    const centerY = this.startY + height / 2;
                    this.ctx.beginPath();
                    this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.closePath();
                    break;
                }

                case "line":
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.startX, this.startY);
                    this.ctx.lineTo(currentX, currentY);
                    this.ctx.stroke();
                    this.ctx.closePath();
                    break;

                case "arrow":
                    this.drawArrow(this.startX, this.startY, currentX, currentY);
                    break;

                case "pencil":
                    this.pencilPoints.push({ x: currentX, y: currentY });
                    if (this.pencilPoints.length > 1) {
                        this.ctx.beginPath();
                        const lastPoint = this.pencilPoints[this.pencilPoints.length - 2];
                        this.ctx.moveTo(lastPoint.x, lastPoint.y);
                        this.ctx.lineTo(currentX, currentY);
                        this.ctx.stroke();
                        this.ctx.closePath();
                    }
                    break;
            }
        }
    }

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler);
        this.canvas.addEventListener("mouseup", this.mouseUpHandler);
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    }
}
