import Link from "next/link";
import { Heart, Linkedin, Twitter } from "lucide-react";
import { BrandLogo } from "./BrandLogo";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-200/50 bg-[#fafafb] pb-16 pt-10 sm:pb-20 sm:pt-14 lg:pb-28">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 md:px-12">
        <div className="flex flex-col items-center justify-between gap-8 border-b border-slate-200/40 pb-12 text-center md:flex-row md:text-left">
          <div className="flex justify-center md:justify-start">
            <BrandLogo className="text-3xl" />
          </div>
          <div className="flex flex-col items-center gap-3.5 md:items-end">
            <div className="flex gap-2.5">
              <Link
                href="https://x.com/21xAshish13"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Skribbix on X"
                className="flex size-9 items-center justify-center rounded-xl border border-slate-200/45 bg-slate-100/80 text-slate-500 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-200/50 hover:text-slate-950"
              >
                <Twitter className="size-4.5" />
              </Link>
              <Link
                href="https://www.linkedin.com/in/21ashishmahajan/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Skribbix on LinkedIn"
                className="flex size-9 items-center justify-center rounded-xl border border-slate-200/45 bg-slate-100/80 text-slate-500 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-200/50 hover:text-slate-950"
              >
                <Linkedin className="size-4.5" />
              </Link>
            </div>
            <p className="flex flex-wrap items-center justify-center gap-1 text-[10.5px] font-semibold tracking-wide text-slate-400 md:justify-end">
              <span>&copy; {new Date().getFullYear()} Skribbix</span>
              <span className="opacity-60">&bull;</span>
              <span>Built with</span>
              <Heart className="size-3 fill-rose-500 text-rose-500" />
              <span>by</span>
              <Link
                href="https://github.com/AR21SM"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold transition-colors hover:text-slate-600 hover:underline"
              >
                AR21SM
              </Link>
            </p>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-0 flex w-full select-none justify-center sm:-bottom-[8%] lg:-bottom-[12%]">
        <span className="bg-gradient-to-b from-black/[0.12] to-black/0 bg-clip-text text-center font-sans text-[18vw] font-black uppercase leading-none tracking-[0.06em] text-transparent sm:text-[14vw]">
          Skribbix
        </span>
      </div>
    </footer>
  );
}
