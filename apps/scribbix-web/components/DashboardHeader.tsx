import { Search } from "lucide-react";
import { AppNavbar } from "@/components/AppNavbar";
import { Input } from "@/components/ui/input";
import { usePageScrolled } from "@/hooks/use-page-scrolled";
import { UserMenu } from "@/components/UserMenu";

interface DashboardHeaderProps {
  userName: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onLogout: () => void;
}

export function DashboardHeader({
  userName,
  searchQuery,
  onSearchChange,
  onLogout,
}: DashboardHeaderProps) {
  const scrolled = usePageScrolled();
  return (
    <AppNavbar
      variant="dashboard"
      condensed={scrolled}
      homeHref="/dashboard"
      center={
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-500"
          />
          <Input
            type="search"
            aria-label="Search your canvases"
            placeholder="Search your canvases"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-8 rounded-lg border-slate-200 bg-white pl-9 pr-3 text-[11px] shadow-none placeholder:text-slate-400 focus-visible:border-[#1769ff] focus-visible:ring-[#1769ff]/15"
          />
        </div>
      }
      actions={<UserMenu userName={userName} onLogout={onLogout} />}
    />
  );
}
