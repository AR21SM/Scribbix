import { HTTP_BACKEND } from "@/config";
import axios from "axios";
import { Shape } from "./Game";

export async function getExistingShapes(roomId: string): Promise<Shape[]> {
  try {
    const res = await axios.get(`${HTTP_BACKEND}/api/room/${roomId}/shapes`);
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
