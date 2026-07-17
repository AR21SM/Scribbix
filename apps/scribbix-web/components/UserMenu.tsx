"use client";

import { ChevronDown, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getUserAvatar = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `/avatars/avatar_${(Math.abs(hash) % 10) + 1}.png`;
};

export interface UserMenuProps {
  userName: string;
  onLogout: () => void;
}

export function UserMenu({ userName, onLogout }: UserMenuProps) {
  const fullName = userName.trim() || "Scribbix user";
  const displayName = fullName.split(/\s+/)[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  const userId =
    typeof window !== "undefined"
      ? localStorage.getItem("userId") || fullName
      : fullName;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl px-1.5 py-1 text-sm font-semibold text-[#0a1738] outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#1769ff] sm:gap-3 sm:pr-2"
            aria-label="Open user menu"
          />
        }
      >
        <Avatar size="lg">
          <AvatarImage
            src={getUserAvatar(userId)}
            alt={fullName}
          />
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
        <span className="hidden max-w-28 truncate sm:inline">
          {displayName}
        </span>
        <ChevronDown aria-hidden="true" className="size-4 text-slate-500" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-52 rounded-2xl">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate px-2 py-1.5">
            {fullName}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onLogout} className="gap-2 px-2 py-2">
            <LogOut aria-hidden="true" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
