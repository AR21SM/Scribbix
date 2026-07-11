"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { HTTP_BACKEND } from "@/config";
import {
  Plus,
  ExternalLink,
  LogOut,
  Layout,
  Calendar,
  User,
} from "lucide-react";
import { Button } from "@repo/ui/button";

interface Room {
  id: number;
  slug: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    let token = localStorage.getItem("token");
    let name = localStorage.getItem("userName");

    if (!token) {
      token = "mock-token";
      localStorage.setItem("token", token);
    }

    if (!name) {
      name = "Test User";
      localStorage.setItem("userName", name);
    }

    setUserName(name);
    fetchRooms(token);
  }, [router]);

  const fetchRooms = async (token: string) => {
    try {
      const response = await axios.get(`${HTTP_BACKEND}/api/user/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(response.data.rooms || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) return;

    setCreating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${HTTP_BACKEND}/api/room`,
        { name: newRoomName },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.roomId) {
        router.push(`/canvas/${response.data.roomId}`);
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <div className="text-slate-600 text-sm font-semibold">
            Loading your canvases...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/75 backdrop-blur-md border-b border-slate-200/50">
        <div className="container mx-auto px-6 h-16 flex justify-between items-center">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Layout className="size-4" />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">
              Scribbix
            </span>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 border border-slate-200 text-slate-500 rounded-md uppercase tracking-wider">
              Dashboard
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200/50 rounded-xl">
              <User className="size-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">
                {userName}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-sm font-semibold rounded-xl transition-all"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10 max-w-5xl">
        {/* Create Room Section */}
        <div className="bg-white rounded-3xl p-6 mb-10 border border-slate-200/60 shadow-xl shadow-slate-100/50">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="size-5 text-blue-600" />
            Create a New Canvas
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter a descriptive room name (e.g. project-brainstorming)..."
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && createRoom()}
              className="flex-1 px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 placeholder-slate-400 transition-all"
            />
            <Button
              onClick={createRoom}
              disabled={creating || !newRoomName.trim()}
              variant="primary"
              size="lg"
              className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>

        {/* Rooms List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layout className="size-5 text-slate-400" />
              Your Canvases
            </h2>
            <span className="px-2.5 py-1 text-xs font-semibold bg-blue-50 border border-blue-100 text-blue-600 rounded-full">
              {rooms.length} {rooms.length === 1 ? "room" : "rooms"}
            </span>
          </div>

          {rooms.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/60 shadow-lg shadow-slate-100/50">
              <div className="size-16 bg-blue-50 border border-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Layout className="size-8 text-blue-600" />
              </div>
              <p className="text-slate-900 text-lg font-bold mb-2">
                You haven&apos;t created any canvases yet
              </p>
              <p className="text-slate-500 max-w-sm mx-auto text-sm mb-6">
                Create your first room above to start drawing and collaborating
                in real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-md shadow-slate-100/40 hover:shadow-xl hover:border-blue-500/20 transition-all cursor-pointer group flex flex-col justify-between min-h-[160px]"
                  onClick={() => router.push(`/canvas/${room.id}`)}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                        {room.slug}
                      </h3>
                      <div className="size-8 rounded-xl bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center shrink-0 transition-colors border border-slate-100">
                        <ExternalLink className="size-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-400 pt-4 border-t border-slate-50 mt-auto">
                    <Calendar className="size-3.5" />
                    <span>
                      Created {new Date(room.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
