"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Grid2X2, List, SearchX, Sparkles } from "lucide-react";
import { HTTP_BACKEND } from "@/config";
import {
  allocateCanvasPreviews,
  CanvasCard,
  type CanvasRoom,
} from "@/components/CanvasCard";
import { CreateCanvasCard } from "@/components/CreateCanvasCard";
import { CreativeLoader } from "@/components/CreativeLoader";
import { DashboardHeader } from "@/components/DashboardHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  clearAuthSession,
  getAuthSession,
  getAuthToken,
} from "@/lib/auth-session";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CanvasLayout = "grid" | "list";
type CanvasFilter = "all" | "owned" | "shared";
type CanvasSort = "newest" | "oldest" | "name";

export default function DashboardPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<CanvasRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [layout, setLayout] = useState<CanvasLayout>("list");
  const [filter, setFilter] = useState<CanvasFilter>("all");
  const [sort, setSort] = useState<CanvasSort>("newest");
  const [userName, setUserName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CanvasRoom | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<number | null>(null);
  const [sharedRoomId, setSharedRoomId] = useState<number | null>(null);
  const firstName = userName.trim().split(/\s+/)[0] || "Ashish";
  const previewAssignments = useMemo(
    () => allocateCanvasPreviews(rooms),
    [rooms],
  );

  const visibleRooms = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return rooms
      .filter((room) => !query || room.slug.toLocaleLowerCase().includes(query))
      .filter((room) => filter === "all" || room.ownership === filter)
      .sort((first, second) => {
        if (sort === "name") return first.slug.localeCompare(second.slug);

        const firstDate = new Date(first.createdAt).getTime();
        const secondDate = new Date(second.createdAt).getTime();
        return sort === "newest"
          ? secondDate - firstDate
          : firstDate - secondDate;
      });
  }, [filter, rooms, searchQuery, sort]);

  const fetchRooms = useCallback(
    async (token: string) => {
      try {
        const response = await axios.get(`${HTTP_BACKEND}/api/user/rooms`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRooms(response.data.rooms || []);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        const status = (error as { response?: { status?: number } }).response
          ?.status;

        if (status === 401) {
          clearAuthSession();
          router.replace("/signin");
        }
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    const { token, userName: storedUserName } = getAuthSession();

    if (!token) {
      router.replace("/signin");
      return;
    }

    setUserName(storedUserName);
    fetchRooms(token);
  }, [fetchRooms, router]);

  const createRoom = async () => {
    if (!newRoomName.trim()) return;

    setCreating(true);
    try {
      const token = getAuthToken();

      if (!token) {
        router.replace("/signin");
        return;
      }

      const response = await axios.post(
        `${HTTP_BACKEND}/api/room`,
        { name: newRoomName.trim() },
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
    clearAuthSession();
    router.push("/");
  };

  const shareRoom = async (room: CanvasRoom) => {
    const url = `${window.location.origin}/canvas/${room.id}`;

    try {
      await navigator.clipboard.writeText(url);
      setSharedRoomId(room.id);
      window.setTimeout(() => setSharedRoomId(null), 1800);
    } catch {
      window.prompt("Copy this canvas link", url);
    }
  };

  const deleteRoom = async () => {
    if (!deleteTarget) return;

    const token = getAuthToken();
    if (!token) {
      router.replace("/signin");
      return;
    }

    setDeletingRoomId(deleteTarget.id);
    try {
      await axios.delete(`${HTTP_BACKEND}/api/room/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms((currentRooms) =>
        currentRooms.filter((room) => room.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      alert(message || "Failed to delete canvas");
    } finally {
      setDeletingRoomId(null);
    }
  };

  if (loading) {
    return (
      <CreativeLoader
        title="Loading your canvases..."
        description="Gathering your ideas and recent boards."
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfc] font-sans text-[#0a1738] antialiased selection:bg-[#ffdf9a] selection:text-[#0a1738]">
      <DashboardHeader
        userName={userName}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onLogout={handleLogout}
      />

      <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-32 sm:px-6 sm:pt-36">
        <section className="mb-7 flex items-center justify-between gap-6 sm:mb-9">
          <div className="relative">
            <Sparkles
              aria-hidden="true"
              className="absolute -left-1 -top-3 size-5 -translate-x-full text-[#ff8a1f]"
            />
            <h1 className="text-3xl font-black tracking-[-0.045em] text-[#0a1738] sm:text-4xl">
              Welcome back, {firstName}!
            </h1>
            <p className="mt-1.5 text-sm font-medium text-slate-500 sm:text-base">
              Pick up where you left off and keep your ideas flowing.
            </p>
          </div>
          <Image
            src="/images/loop_arrow_doodle.png"
            alt=""
            width={180}
            height={76}
            className="hidden h-16 w-auto object-contain lg:block"
          />
        </section>

        <CreateCanvasCard
          value={newRoomName}
          creating={creating}
          onChange={setNewRoomName}
          onSubmit={createRoom}
        />

        <section className="mt-8 sm:mt-10 min-h-[620px]">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-[#0a1738] sm:text-3xl">
              Your canvases
            </h2>
          </div>

          {rooms.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="shadow-scribbix-control relative grid w-full grid-cols-3 border border-slate-200/80 bg-white p-1 rounded-[14px] sm:w-[390px]">
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute bottom-1 left-1 top-1 w-[calc((100%_-_0.5rem)/3)] rounded-[10px] bg-[#0a1738] shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    filter === "owned" && "translate-x-full",
                    filter === "shared" && "translate-x-[200%]",
                  )}
                />
                {(["all", "owned", "shared"] as const).map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-pressed={filter === value}
                    onClick={() => setFilter(value)}
                    className={cn(
                      "relative z-10 h-9 px-3 text-[13px] font-semibold text-slate-500 transition-colors duration-300 rounded-[10px] hover:text-[#0a1738]",
                      filter === value &&
                        "bg-transparent !text-white hover:bg-transparent hover:!text-white",
                    )}
                  >
                    {value === "all"
                      ? "All canvases"
                      : value === "owned"
                        ? "My canvases"
                        : "Shared with me"}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={sort}
                  onValueChange={(value) =>
                    value && setSort(value as CanvasSort)
                  }
                >
                  <SelectTrigger
                    aria-label="Sort canvases"
                    className="shadow-scribbix-control !h-11 w-40 rounded-[14px] border-slate-200 bg-white !pl-5 !pr-3.5 text-[13px] font-semibold focus-visible:border-[#1769ff] focus-visible:ring-[#1769ff]/15"
                  >
                    <span className="flex-1 text-left">
                      {sort === "newest"
                        ? "Newest first"
                        : sort === "oldest"
                          ? "Oldest first"
                          : "Name"}
                    </span>
                  </SelectTrigger>
                  <SelectContent
                    align="end"
                    className="shadow-scribbix-popover rounded-xl p-1.5"
                  >
                    <SelectGroup>
                      <SelectItem
                        value="newest"
                        className="rounded-lg px-2 py-2 font-semibold"
                      >
                        Newest first
                      </SelectItem>
                      <SelectItem
                        value="oldest"
                        className="rounded-lg px-2 py-2 font-semibold"
                      >
                        Oldest first
                      </SelectItem>
                      <SelectItem
                        value="name"
                        className="rounded-lg px-2 py-2 font-semibold"
                      >
                        Name
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <div className="shadow-scribbix-control flex h-11 items-center rounded-[14px] border border-slate-200 bg-white p-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Grid view"
                    aria-pressed={layout === "grid"}
                    onClick={() => setLayout("grid")}
                    className={cn(
                      "size-9 rounded-[10px] text-slate-500 transition-colors duration-200",
                      layout === "grid" &&
                        "bg-[#eef3ff] text-[#0a1738] hover:bg-[#eef3ff]",
                    )}
                  >
                    <Grid2X2 />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="List view"
                    aria-pressed={layout === "list"}
                    onClick={() => setLayout("list")}
                    className={cn(
                      "size-9 rounded-[10px] text-slate-500 transition-colors duration-200",
                      layout === "list" &&
                        "bg-[#eef3ff] text-[#0a1738] hover:bg-[#eef3ff]",
                    )}
                  >
                    <List />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {rooms.length === 0 ? (
            <div className="shadow-scribbix-feature relative flex min-h-[680px] flex-col items-center justify-center overflow-hidden rounded-[12px] border border-slate-200/80 bg-white px-6 py-12 text-center sm:px-12">
              <div className="relative mx-auto flex max-w-lg flex-col items-center">
                <Image
                  src="/images/team-remote-v2.png"
                  alt="A team collaborating around a shared whiteboard"
                  width={380}
                  height={380}
                  className="h-56 w-auto object-contain sm:h-64"
                />
                <p className="mt-4 text-xl font-black tracking-[-0.03em] text-[#0a1738] sm:text-2xl">
                  Give your first idea a home.
                </p>
                <p className="mt-2 max-w-sm text-sm font-medium leading-relaxed text-slate-500">
                  Name your canvas above and we&apos;ll open a fresh whiteboard
                  for your next sketch, plan, or brainstorm.
                </p>
              </div>
            </div>
          ) : visibleRooms.length === 0 ? (
            <div className="shadow-scribbix-feature rounded-[12px] border border-slate-200/80 bg-white px-6 py-12 text-center">
              <SearchX className="mx-auto size-8 text-slate-400" />
              <p className="mt-4 text-lg font-bold text-[#0a1738]">
                No canvases match “{searchQuery}”
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try a different canvas name.
              </p>
            </div>
          ) : (
            <div
              key={layout}
              className={cn(
                "grid animate-canvas-layout gap-5",
                layout === "grid"
                  ? "sm:grid-cols-2 xl:grid-cols-4"
                  : "grid-cols-1 lg:grid-cols-2",
              )}
            >
              {visibleRooms.map((room) => (
                <CanvasCard
                  key={room.id}
                  room={room}
                  layout={layout}
                  onOpen={(roomId) => router.push(`/canvas/${roomId}`)}
                  onShare={shareRoom}
                  onDelete={setDeleteTarget}
                  shared={sharedRoomId === room.id}
                  previewSrc={previewAssignments.get(room.id)}
                />
              ))}
            </div>
          )}
        </section>
        {/* Onboarding / Feature Banner at the bottom */}
        <div className="relative mt-16 overflow-hidden rounded-[12px] border border-slate-200 bg-white bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] p-8 md:p-10 shadow-sm min-h-[220px]">
          {/* Faint hand-drawn doodles background pattern overlay */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <Image
              src="/images/cta-pen-doodle-v6.png"
              alt=""
              fill
              className="object-cover opacity-[0.12] select-none"
            />
          </div>
          
          {/* Blurred ambient background glows */}
          <div className="absolute -right-20 -top-20 size-72 rounded-full bg-blue-100/30 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 size-72 rounded-full bg-amber-100/20 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-12 md:items-center">
            {/* Left Column: Text Content */}
            <div className="text-left md:col-span-5 flex flex-col justify-center">
              <h3 className="text-2xl font-black tracking-[-0.03em] text-[#0a1738] sm:text-3xl">
                Real-time team collaboration
              </h3>
              <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
                Invite team members to your boards, draw together on the infinite canvas, and watch updates synchronize in real-time. Skribbix makes brainstorming, mapping, and planning frictionless.
              </p>
            </div>
            

            {/* Right Column: Cropped Super-Wide Illustration (side-by-side) */}
            <div className="relative md:col-span-7 w-full h-[210px] overflow-hidden bg-transparent">
              <Image
                src="/images/dashboard-super-wide-collab.png?v=3"
                alt="Team collaboration whiteboard sketch"
                fill
                className="object-contain object-right bg-transparent"
              />
            </div>
          </div>
        </div>
      </main>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && deletingRoomId === null) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#0a1738]">
              Delete this canvas?
            </DialogTitle>
            <DialogDescription className="leading-relaxed text-slate-500">
              “{deleteTarget?.slug}” and its collaboration history will be
              permanently removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={deletingRoomId !== null}
              onClick={() => setDeleteTarget(null)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deletingRoomId !== null}
              onClick={deleteRoom}
              className="rounded-lg"
            >
              {deletingRoomId !== null ? "Deleting..." : "Delete canvas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <SiteFooter />
    </div>
  );
}
