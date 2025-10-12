"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { HTTP_BACKEND } from "@/config";
import { Plus, ExternalLink, LogOut } from "lucide-react";

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
        const token = localStorage.getItem("token");
        const name = localStorage.getItem("userName");
        
        if (!token) {
            router.push("/signin");
            return;
        }

        if (name) {
            setUserName(name);
        }

        fetchRooms(token);
    }, [router]);

    const fetchRooms = async (token: string) => {
        try {
            const response = await axios.get(`${HTTP_BACKEND}/api/user/rooms`, {
                headers: { Authorization: `Bearer ${token}` }
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
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.roomId) {
                router.push(`/canvas/${response.data.roomId}`);
            }
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to create room");
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
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-blue-500">Scribbix</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-400">Welcome, {userName}</span>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                {/* Create Room Section */}
                <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Create New Canvas</h2>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Enter room name..."
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && createRoom()}
                            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={createRoom}
                            disabled={creating || !newRoomName.trim()}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                            <Plus size={20} />
                            {creating ? "Creating..." : "Create"}
                        </button>
                    </div>
                </div>

                {/* Rooms List */}
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Your Canvases</h2>
                    {rooms.length === 0 ? (
                        <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
                            <p className="text-gray-400 text-lg mb-4">
                                You haven't created any canvases yet
                            </p>
                            <p className="text-gray-500">
                                Create your first canvas to start collaborating!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {rooms.map((room) => (
                                <div
                                    key={room.id}
                                    className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer group"
                                    onClick={() => router.push(`/canvas/${room.id}`)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-lg font-semibold group-hover:text-blue-400 transition-colors">
                                            {room.slug}
                                        </h3>
                                        <ExternalLink size={18} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        Created {new Date(room.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
