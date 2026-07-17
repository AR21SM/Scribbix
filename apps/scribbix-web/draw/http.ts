import { HTTP_BACKEND } from "@/config";
import axios from "axios";
import { Shape } from "./Game";
import { getAuthToken } from "@/lib/auth-session";

export async function getExistingShapes(roomId: string): Promise<Shape[]> {
  try {
    const token = getAuthToken();
    const res = await axios.get(`${HTTP_BACKEND}/api/room/${roomId}/shapes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.shapes || [];
  } catch (error) {
    console.error("Error fetching shapes:", error);
    return [];
  }
}

export async function getRoomBySlug(slug: string) {
  try {
    const res = await axios.get(`${HTTP_BACKEND}/api/room/${slug}`);
    return res.data.room;
  } catch (error) {
    console.error("Error fetching room:", error);
    return null;
  }
}
