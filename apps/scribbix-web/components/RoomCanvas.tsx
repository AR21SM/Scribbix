"use client";

import { WS_URL } from "@/config";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Canvas } from "./Canvas";

export function RoomCanvas({roomId}: {roomId: string}) {
    const router = useRouter();
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        
        if (!token) {
            router.push("/signin");
            return;
        }

        try {
            const ws = new WebSocket(`${WS_URL}?token=${token}`);

            ws.onopen = () => {
                console.log("WebSocket connected");
                setSocket(ws);
                ws.send(JSON.stringify({
                    type: "join_room",
                    roomId
                }));
            };

            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
                setError("Failed to connect to server");
            };

            ws.onclose = () => {
                console.log("WebSocket disconnected");
                setError("Disconnected from server");
            };

            return () => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: "leave_room",
                        roomId
                    }));
                    ws.close();
                }
            };
        } catch (err) {
            console.error("Error creating WebSocket:", err);
            setError("Failed to establish connection");
        }
    }, [roomId, router]);
   
    if (error) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-900">
                <div className="text-center">
                    <h2 className="text-2xl text-red-400 mb-4">Connection Error</h2>
                    <p className="text-gray-400">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!socket) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-white text-lg">Connecting to server...</p>
                </div>
            </div>
        );
    }

    return <Canvas roomId={roomId} socket={socket} />;
}
