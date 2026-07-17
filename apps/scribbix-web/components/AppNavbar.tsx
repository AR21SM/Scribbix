import type { ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

type AppNavbarVariant = "landing" | "dashboard";

interface AppNavbarProps {
  variant: AppNavbarVariant;
  actions: ReactNode;
  center?: ReactNode;
  condensed?: boolean;
  homeHref?: string;
}

export function AppNavbar({
  variant,
  actions,
  center,
  condensed = false,
  homeHref = "/",
}: AppNavbarProps) {
  const isLanding = variant === "landing";

  return (
    <header
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 flex w-full justify-center transition-all duration-500 ease-in-out",
      )}
    >
      <div
        className={cn(
          "pointer-events-auto mx-auto flex w-full items-center justify-between bg-white transition-all duration-500 ease-in-out",
          condensed
            ? "mt-4 w-[90%] max-w-5xl rounded-2xl border border-slate-200/60 bg-white/90 px-6 py-3 shadow-lg shadow-slate-100/50 backdrop-blur-md md:w-[95%]"
            : "max-w-[1440px] rounded-none border border-transparent border-b-slate-100/50 bg-white/80 px-6 py-5 shadow-none backdrop-blur-md md:px-16",
        )}
      >
        <BrandLogo href={homeHref} className="text-3xl" />

        {center && (
          <div
            className={cn(
              !isLanding && "hidden md:ml-auto md:block md:w-52 lg:w-60",
            )}
          >
            {center}
          </div>
        )}

        <div
          className={cn(
            "flex items-center",
            isLanding ? "gap-6" : "ml-auto shrink-0 md:ml-4",
          )}
        >
          {actions}
        </div>
      </div>
    </header>
  );
}
