"use client";

import { WS_URL } from "@/config";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Canvas } from "./Canvas";
import { CanvasLoader } from "./CanvasLoader";
import { clearAuthSession, getAuthToken } from "@/lib/auth-session";
import { HTTP_BACKEND } from "@/config";
import axios from "axios";

export function RoomCanvas({
  roomId,
}: {
  roomId: string;
}) {
  const router = useRouter();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canvasMeta, setCanvasMeta] = useState<{
    name: string;
    ownership: "owned" | "shared";
  } | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    let active = true;
    let ws: WebSocket | null = null;

    if (!token) {
      router.replace("/signin");
      return;
    }

    const connect = async () => {
      try {
        const joinedRoom = await axios.post<{
          slug: string;
          ownership: "owned" | "shared";
        }>(
          `${HTTP_BACKEND}/api/room/${roomId}/join`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (!active) return;
        setCanvasMeta({
          name: joinedRoom.data.slug,
          ownership: joinedRoom.data.ownership,
        });

        const socketUrl = new URL(WS_URL);
        socketUrl.searchParams.set("token", token);
        ws = new WebSocket(socketUrl);

        ws.onopen = () => {
          if (!ws) return;
          setSocket(ws);
          ws.send(JSON.stringify({ type: "join_room", roomId }));
        };

        ws.onerror = () => setError("Failed to connect to server");

        ws.onclose = (event) => {
          if (!active) return;

          if (event.code === 1008) {
            clearAuthSession();
            router.replace("/signin");
            return;
          }

          setError("Disconnected from server");
        };
      } catch (err) {
        const status = (err as { response?: { status?: number } }).response
          ?.status;
        if (status === 401) {
          clearAuthSession();
          router.replace("/signin");
          return;
        }
        setError(
          status === 404
            ? "This canvas no longer exists"
            : "Unable to join this canvas",
        );
      }
    };

    connect();

    return () => {
      active = false;
      if (!ws) return;
      ws.onclose = null;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "leave_room", roomId }));
      }
      ws.close();
    };
  }, [roomId, router]);

  if (error) {
    return (
      <div className="w-full h-screen p-1 bg-[#f0f1f4] dark:bg-[#090a0f] transition-all duration-300">
        <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-[#121214] rounded-2xl border border-slate-200/80 dark:border-zinc-800/60 shadow-[0_0_15px_rgba(0,0,0,0.03),0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="text-center p-6">
            <h2 className="text-xl text-red-400 mb-2 font-bold">
              Connection Error
            </h2>
            <p className="text-sm text-slate-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!socket) {
    return <CanvasLoader />;
  }

  return (
    <div className="w-full h-screen p-1 bg-[#f0f1f4] dark:bg-[#090a0f] transition-all duration-300">
      <div className="w-full h-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-zinc-800/60 shadow-[0_0_15px_rgba(0,0,0,0.03),0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_0_20px_rgba(0,0,0,0.35)] relative bg-white dark:bg-[#121214] transition-all duration-300">
        <Canvas
          roomId={roomId}
          socket={socket}
          canvasName={canvasMeta?.name ?? "Untitled canvas"}
          canRename={canvasMeta?.ownership === "owned"}
          onRename={async (name) => {
            const token = getAuthToken();
            if (!token) return false;
            try {
              const response = await axios.patch<{ slug: string }>(
                `${HTTP_BACKEND}/api/room/${roomId}`,
                { name },
                { headers: { Authorization: `Bearer ${token}` } },
              );
              setCanvasMeta((current) =>
                current ? { ...current, name: response.data.slug } : current,
              );
              return true;
            } catch {
              return false;
            }
          }}
        />
      </div>
    </div>
  );
}
