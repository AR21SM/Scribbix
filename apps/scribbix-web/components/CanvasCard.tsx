import Image from "next/image";
import {
  ArrowRight,
  Calendar,
  Check,
  MoreHorizontal,
  Share2,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getUserAvatar = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `/avatars/avatar_${(Math.abs(hash) % 10) + 1}.png`;
};

export interface CanvasRoom {
  id: number;
  slug: string;
  createdAt: string;
  collaborators?: Array<{ id: string; name: string; photo: string | null }>;
  ownership?: "owned" | "shared";
  ownerName?: string;
}

interface CanvasCardProps {
  room: CanvasRoom;
  onOpen: (roomId: number) => void;
  layout?: "grid" | "list";
  onShare: (room: CanvasRoom) => void;
  onDelete: (room: CanvasRoom) => void;
  shared?: boolean;
  previewSrc?: string;
}

const CANVAS_PREVIEWS = [
  "/images/dashboard-previews/system-architecture.webp",
  "/images/dashboard-previews/mind-map.webp",
  "/images/dashboard-previews/user-flow.webp",
  "/images/dashboard-previews/kanban-planning.webp",
  "/images/dashboard-previews/wireframe.webp",
  "/images/dashboard-previews/product-roadmap.webp",
  "/images/dashboard-previews/database-model.webp",
  "/images/dashboard-previews/brainstorm.webp",
  "/images/dashboard-previews/sequence-flow.webp",
  "/images/dashboard-previews/retrospective.webp",
] as const;

const PROMPT_STARTS = [
  "Shape the next bold idea",
  "Turn rough thoughts into momentum",
  "Give your best ideas room to grow",
  "Make the complicated feel clear",
  "Build a shared view of what matters",
  "Sketch the path before you build it",
  "Connect the dots your team can see",
  "Move one promising thought forward",
  "Find the signal inside the noise",
  "Create clarity from an open canvas",
  "Bring structure to the creative mess",
  "Make today’s thinking visible",
] as const;

const PROMPT_ENDS = [
  "and make the next step visible.",
  "then turn it into something real.",
  "with a canvas everyone can follow.",
  "and invite better questions from the team.",
  "one thoughtful connection at a time.",
  "before the spark slips away.",
  "and keep the whole team moving together.",
  "until the clearest direction stands out.",
  "and let every perspective add value.",
  "while the energy is still fresh.",
  "then refine it into your strongest plan.",
  "and leave space for the unexpected.",
] as const;

function hashRoom(room: CanvasRoom) {
  const key = `${room.id}:${room.slug}`;
  let hash = 0;

  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function getCanvasPreview(room: CanvasRoom) {
  return CANVAS_PREVIEWS[hashRoom(room) % CANVAS_PREVIEWS.length];
}

export function allocateCanvasPreviews(rooms: CanvasRoom[]) {
  const assignments = new Map<number, string>();
  const usedIndexes = new Set<number>();

  [...rooms]
    .sort((first, second) => first.id - second.id)
    .forEach((room) => {
      if (usedIndexes.size === CANVAS_PREVIEWS.length) usedIndexes.clear();

      const preferredIndex = hashRoom(room) % CANVAS_PREVIEWS.length;
      let previewIndex = preferredIndex;

      while (usedIndexes.has(previewIndex)) {
        previewIndex = (previewIndex + 1) % CANVAS_PREVIEWS.length;
      }

      usedIndexes.add(previewIndex);
      assignments.set(room.id, CANVAS_PREVIEWS[previewIndex]);
    });

  return assignments;
}

export function getCanvasPrompt(room: CanvasRoom) {
  const hash = hashRoom(room);
  const start = PROMPT_STARTS[hash % PROMPT_STARTS.length];
  const end =
    PROMPT_ENDS[Math.floor(hash / PROMPT_STARTS.length) % PROMPT_ENDS.length];
  return `${start} ${end}`;
}

export function CanvasCard({
  room,
  onOpen,
  onShare,
  onDelete,
  shared = false,
  previewSrc,
  layout = "grid",
}: CanvasCardProps) {
  const preview = previewSrc || getCanvasPreview(room);
  const prompt = getCanvasPrompt(room);
  const createdDate = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(room.createdAt));

  const collaborators = room.collaborators || [];

  return (
    <Card
      className={cn(
        "shadow-scribbix-card group gap-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-0 transition-[border-color,box-shadow] duration-200 ease-out hover:border-[#c7d3e8]",
        layout === "list" && "sm:grid sm:grid-cols-[240px_1fr]",
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(room.id)}
        aria-label={`Open ${room.slug}`}
        className={cn(
          "relative overflow-hidden bg-[#fffefe] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1769ff]",
          layout === "grid"
            ? "aspect-[3/2]"
            : "aspect-[3/2] sm:h-44 sm:aspect-auto",
        )}
      >
        <Image
          src={preview}
          alt=""
          fill
          sizes={
            layout === "grid"
              ? "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
              : "240px"
          }
          className={layout === "grid" ? "object-cover" : "object-contain"}
        />
      </button>

      <div className="flex min-w-0 flex-1 flex-col">
        <CardContent className="px-4 pb-3 pt-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 truncate text-base font-extrabold tracking-[-0.025em] text-[#0a1738]">
              {room.slug}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    aria-label={`Actions for ${room.slug}`}
                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-500 outline-none transition-colors hover:bg-slate-100 hover:text-[#0a1738] focus-visible:ring-2 focus-visible:ring-[#1769ff]"
                  />
                }
              >
                <MoreHorizontal aria-hidden="true" className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={6}
                className="w-44 rounded-xl p-1.5"
              >
                <DropdownMenuItem
                  onClick={() => onShare(room)}
                  className="gap-2 rounded-lg px-2 py-2"
                >
                  {shared ? (
                    <Check aria-hidden="true" />
                  ) : (
                    <Share2 aria-hidden="true" />
                  )}
                  {shared ? "Link copied" : "Share canvas"}
                </DropdownMenuItem>
                {room.ownership !== "shared" && (
                  <DropdownMenuItem
                    onClick={() => onDelete(room)}
                    className="gap-2 rounded-lg px-2 py-2 text-red-600 focus:text-red-700"
                  >
                    <Trash2 aria-hidden="true" />
                    Delete canvas
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="mt-2 line-clamp-2 text-xs font-medium leading-relaxed text-slate-500">
            {prompt}
          </p>
        </CardContent>
        <CardFooter className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-slate-500">
              <Calendar aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="truncate">Created {createdDate}</span>
            </span>
            {room.ownership === "shared" && room.ownerName && (
              <span className="hidden truncate text-[10px] font-bold text-slate-500 xl:inline">
                Shared by {room.ownerName}
              </span>
            )}
            {collaborators.length > 0 && (
              <div
                className="flex items-center"
                title={`${collaborators.length} collaborator${collaborators.length === 1 ? "" : "s"}`}
              >
                {collaborators.slice(0, 3).map((collaborator, index) => (
                  <Avatar
                    key={collaborator.id}
                    className={cn(
                      "size-6 border-2 border-white",
                      index > 0 && "-ml-2",
                    )}
                  >
                    <AvatarImage
                      src={collaborator.photo || getUserAvatar(collaborator.id)}
                      alt={collaborator.name}
                    />
                    <AvatarFallback className="text-[9px] font-bold">
                      {collaborator.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                <span className="ml-1.5 text-[10px] font-bold text-slate-500">
                  {collaborators.length}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpen(room.id)}
            className="ml-auto flex shrink-0 items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-bold text-[#0a1738] outline-none transition-colors hover:border-[#0a1738] hover:bg-[#0a1738] hover:text-white focus-visible:ring-2 focus-visible:ring-[#1769ff]"
          >
            <span className="hidden sm:inline">Open board</span>
            <ArrowRight aria-hidden="true" className="size-4" />
          </button>
        </CardFooter>
      </div>
    </Card>
  );
}
