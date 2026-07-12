"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Canvas } from "@/components/Canvas";
import { TemplatePreview } from "@/components/TemplatePreview";

import { ArrowRight, Heart, Star, Twitter, Linkedin } from "lucide-react";

export default function Page() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const startGuestBoard = () => {
    const randomId = Math.random().toString(36).substring(2, 10);
    router.push(`/canvas/${randomId}`);
  };

  return (
    <main className="min-h-screen bg-[#fafafb] text-[#1e293b] font-sans antialiased overflow-x-hidden">
      {/* HEADER / NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full transition-all duration-500 ease-in-out pointer-events-none">
        <div
          className={`
          w-full flex items-center justify-between transition-all duration-500 ease-in-out pointer-events-auto
          ${
            scrolled
              ? "w-[90%] md:w-[95%] max-w-5xl mt-4 px-6 py-3 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-100/50 mx-auto"
              : "max-w-[1440px] mt-0 px-6 md:px-16 py-5 bg-white/80 backdrop-blur-md rounded-none border border-transparent border-b-slate-100/50 shadow-none mx-auto"
          }
        `}
        >
          <Link
            href="/"
            className="flex items-center text-3xl font-bold tracking-tight text-[#0a1128] hover:opacity-90 transition-opacity"
          >
            <span>Skribbi</span>
            <span className="relative inline-block">
              x
              <svg
                className="absolute -top-2 -right-3 size-4 text-[#ffbe5c] rotate-[15deg]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              >
                <path d="M6 18 L3 12" />
                <path d="M12 16 L12 9" />
                <path d="M16 18 L20 14" />
              </svg>
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/signin"
              className="text-sm font-semibold text-[#0a1128] hover:text-[#df912b] transition-colors duration-300 ease-in-out"
            >
              Log in
            </Link>
            <Link href="/signup">
              <Button className="h-10 px-6 bg-slate-900 hover:bg-[#141b2b] text-white border-none rounded-xl font-medium shadow-sm transition-colors">
                Sign up free
              </Button>
            </Link>
          </div>
        </div>
      </header>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-white pb-16 pt-24 lg:pb-20 lg:pt-32">
        <div className="max-w-[1440px] mx-auto px-6 md:px-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="lg:col-span-4 text-left flex flex-col justify-center relative">
              <h1 className="text-5xl lg:text-6xl xl:text-[68px] font-bold tracking-tight text-[#0a1128] leading-[1.12]">
                Think. Draw.
                <br />
                Build{" "}
                <span className="relative inline-block">
                  <img
                    src="/images/hero-underline.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-7 left-[5%] h-14 w-[114%] select-none object-fill z-0"
                  />
                  <span className="relative z-10">together.</span>
                  <svg
                    className="absolute -top-8 lg:-top-9 -right-8 lg:-right-9 size-10 lg:size-12 rotate-[15deg]"
                    viewBox="0 0 32 32"
                    fill="none"
                    stroke="#ff9f1c"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <path d="M8 24 L3 10" />
                    <path d="M15 22 L18 6" />
                    <path d="M20 23 L29 15" />
                  </svg>
                  {/* Loop Arrow Doodle pointing to mockup */}
                  <div className="absolute left-[134%] top-[10%] w-[115px] h-auto pointer-events-none z-20 hidden lg:block">
                    <img
                      src="/images/loop_arrow_doodle.png"
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                </span>
              </h1>

              <p className="text-base lg:text-lg xl:text-xl text-slate-600 max-w-2xl mt-5 font-medium leading-relaxed mb-6">
                Skribbix is the visual workspace for teams to brainstorm, plan,
                and create together in real time.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 w-full">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button className="h-12 w-full sm:w-auto px-6 text-sm bg-slate-900 hover:bg-[#141b2b] text-white font-bold rounded-xl shadow-md shadow-slate-900/10 transition-all duration-200 border-none">
                    Start a whiteboard – it&apos;s free
                  </Button>
                </Link>
                <a
                  href="#sandbox"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("sandbox")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="h-12 w-full sm:w-auto px-6 text-sm font-bold text-slate-600 bg-white rounded-xl border border-slate-200/80 shadow-sm inline-flex items-center justify-center whitespace-nowrap"
                >
                  Try Demo
                </a>
              </div>
            </div>

            {/* Right Interactive Mockup Canvas */}
            <div className="lg:col-span-8 flex justify-center w-full max-w-[760px] mx-auto relative">
              <div className="relative rounded-2xl border border-slate-200/60 bg-white p-1 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.12),_0_8px_20px_-6px_rgba(15,23,42,0.05)] z-10 w-full overflow-hidden flex flex-col">
                {/* Browser window header controls */}
                <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                  <div className="size-2.5 rounded-full bg-[#ff5f56]" />
                  <div className="size-2.5 rounded-full bg-[#ffbd2e]" />
                  <div className="size-2.5 rounded-full bg-[#27c93f]" />
                </div>
                <img
                  src="/images/scribbix_hero_whiteboard_clean.png"
                  alt="Scribbix Whiteboard Showcase"
                  className="w-full h-auto object-contain"
                />
              </div>

              {/* Pink/Cream Circle (Pure CSS to avoid flat crop edges) */}
              <div className="absolute top-[-16%] right-[-12%] w-[32%] aspect-square rounded-full bg-[#ffdbe2]/90 blur-[2px] z-0 pointer-events-none" />

              {/* Faded blue/gray background domes/circles above the whiteboard */}
              <div className="absolute top-[-12%] left-[18%] w-[25%] aspect-square rounded-full bg-[#e0e7ff]/35 blur-[3px] z-0 pointer-events-none" />
              <div className="absolute top-[-18%] left-[34%] w-[30%] aspect-square rounded-full bg-[#e0e7ff]/30 blur-[3px] z-0 pointer-events-none" />

              {/* Bottom-Left tilted blue dots grid component (behind girl's hip/body) */}
              <div className="absolute bottom-[3%] left-[-7%] w-[9%] h-auto z-0 pointer-events-none opacity-85">
                <svg
                  viewBox="0 0 100 100"
                  fill="none"
                  className="w-full h-auto"
                >
                  {/* Column 1 (Left) - 3 dots */}
                  <circle cx="30" cy="26" r="4" fill="#3b52f6" />
                  <circle cx="24" cy="48" r="4" fill="#3b52f6" />
                  <circle cx="18" cy="70" r="4" fill="#3b52f6" />

                  {/* Column 2 (Middle) - 4 dots */}
                  <circle cx="54" cy="16" r="4" fill="#3b52f6" />
                  <circle cx="48" cy="38" r="4" fill="#3b52f6" />
                  <circle cx="42" cy="60" r="4" fill="#3b52f6" />
                  <circle cx="36" cy="82" r="4" fill="#3b52f6" />

                  {/* Column 3 (Right) - 4 dots */}
                  <circle cx="78" cy="10" r="4" fill="#3b52f6" />
                  <circle cx="72" cy="32" r="4" fill="#3b52f6" />
                  <circle cx="66" cy="54" r="4" fill="#3b52f6" />
                  <circle cx="60" cy="76" r="4" fill="#3b52f6" />
                </svg>
              </div>

              {/* Custom tilted blue dots grid component */}
              <div className="absolute top-[36%] right-[-9%] w-[11%] h-auto z-0 pointer-events-none opacity-85">
                <svg
                  viewBox="0 0 100 100"
                  fill="none"
                  className="w-full h-full"
                >
                  {/* Column 1 (Left) - 3 dots */}
                  <circle cx="30" cy="26" r="4" fill="#3b52f6" />
                  <circle cx="24" cy="48" r="4" fill="#3b52f6" />
                  <circle cx="18" cy="70" r="4" fill="#3b52f6" />

                  {/* Column 2 (Middle) - 4 dots */}
                  <circle cx="54" cy="16" r="4" fill="#3b52f6" />
                  <circle cx="48" cy="38" r="4" fill="#3b52f6" />
                  <circle cx="42" cy="60" r="4" fill="#3b52f6" />
                  <circle cx="36" cy="82" r="4" fill="#3b52f6" />

                  {/* Column 3 (Right) - 4 dots */}
                  <circle cx="78" cy="10" r="4" fill="#3b52f6" />
                  <circle cx="72" cy="32" r="4" fill="#3b52f6" />
                  <circle cx="66" cy="54" r="4" fill="#3b52f6" />
                  <circle cx="60" cy="76" r="4" fill="#3b52f6" />
                </svg>
              </div>

              {/* Yellow Circle (Pure CSS to avoid flat crop edges) */}
              <div className="absolute bottom-[-10%] right-[-12%] w-[24%] aspect-square rounded-full bg-[#fff0be]/90 blur-[2px] z-0 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>
      {/* BUILT FOR EVERY KIND OF TEAM */}
      <section className="relative overflow-hidden bg-white py-24">
        <img
          src="/images/loop_arrow_doodle.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 right-[5%] hidden w-28 rotate-[12deg] select-none opacity-70 xl:block"
        />
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <div className="inline-flex items-center gap-2 mb-4 relative">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Built for every kind of team
            </h2>
            <svg
              className="absolute -top-2 -right-5 size-5 text-[#f43f5e] opacity-80 rotate-[15deg]"
              viewBox="0 0 32 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
            >
              <path d="M8 24 L3 10" />
              <path d="M15 22 L18 6" />
              <path d="M20 23 L29 15" />
            </svg>
          </div>
          <p className="text-slate-500 max-w-xl mx-auto mb-16 text-sm">
            Whether mapping design sprints or teaching classrooms, Scribbix
            offers the tools you need.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Card 1: Product Teams */}
            <div className="p-6 bg-white border border-slate-200/60 rounded-3xl text-left flex flex-col shadow-sm">
              <div className="h-40 flex items-center justify-center mb-6 overflow-hidden">
                <img
                  src="/images/team-product-v2.png"
                  alt="Product Teams"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 mb-2">
                Product Teams
              </h3>
              <p className="text-slate-600 font-medium text-xs leading-relaxed">
                Plan roadmaps, wireframes, and product strategy.
              </p>
            </div>

            {/* Card 2: Marketing Teams */}
            <div className="p-6 bg-white border border-slate-200/60 rounded-3xl text-left flex flex-col shadow-sm">
              <div className="h-40 flex items-center justify-center mb-6 overflow-hidden">
                <img
                  src="/images/team-marketing-v2.png"
                  alt="Marketing Teams"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 mb-2">
                Marketing Teams
              </h3>
              <p className="text-slate-600 font-medium text-xs leading-relaxed">
                Brainstorm campaigns and map customer journeys.
              </p>
            </div>

            {/* Card 3: Design Teams */}
            <div className="p-6 bg-white border border-slate-200/60 rounded-3xl text-left flex flex-col shadow-sm">
              <div className="h-40 flex items-center justify-center mb-6 overflow-hidden">
                <img
                  src="/images/team-design-v2.png"
                  alt="Design Teams"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 mb-2">
                Design Teams
              </h3>
              <p className="text-slate-600 font-medium text-xs leading-relaxed">
                Ideate, sketch, and iterate your next big thing.
              </p>
            </div>

            {/* Card 4: Remote Teams */}
            <div className="p-6 bg-white border border-slate-200/60 rounded-3xl text-left flex flex-col shadow-sm">
              <div className="h-40 flex items-center justify-center mb-6 overflow-hidden">
                <img
                  src="/images/team-remote-v2.png"
                  alt="Remote Teams"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 mb-2">
                Remote Teams
              </h3>
              <p className="text-slate-600 font-medium text-xs leading-relaxed">
                Run engaging workshops and align from anywhere.
              </p>
            </div>

            {/* Card 5: Education */}
            <div className="p-6 bg-white border border-slate-200/60 rounded-3xl text-left flex flex-col shadow-sm">
              <div className="h-40 flex items-center justify-center mb-6 overflow-hidden">
                <img
                  src="/images/team-education-v2.png"
                  alt="Education"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 mb-2">
                Education
              </h3>
              <p className="text-slate-600 font-medium text-xs leading-relaxed">
                Teach, collaborate, and inspire visual thinkers.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* START FAST WITH INTERACTIVE TEMPLATES */}
      <section className="relative overflow-hidden bg-white py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <div className="inline-flex items-center gap-2 mb-4 relative">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Start fast with interactive templates
            </h2>
            <svg
              className="absolute -top-2 -right-5 size-5 text-[#a855f7] opacity-80 rotate-[15deg]"
              viewBox="0 0 32 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
            >
              <path d="M8 24 L3 10" />
              <path d="M15 22 L18 6" />
              <path d="M20 23 L29 15" />
            </svg>
          </div>
          <p className="text-slate-500 max-w-xl mx-auto mb-16 text-sm">
            Choose a canvas layout to kickstart your next system design session,
            database planning, or class modeling.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                title: "Mind Map",
                description:
                  "Map ideas, state flows, and project components radially.",
                preview: "mind-map" as const,
              },
              {
                title: "Sequence Diagram",
                description:
                  "Trace chronological API calls and request lifecycles.",
                preview: "sequence" as const,
              },
              {
                title: "ER Diagram",
                description:
                  "Design relational database tables and foreign keys.",
                preview: "er" as const,
              },
              {
                title: "System Architecture",
                description:
                  "Map cloud infrastructure, load balancers, and gateways.",
                preview: "architecture" as const,
              },
              {
                title: "Flowchart",
                description:
                  "Visualize process steps, decision branches, and system workflows.",
                preview: "flowchart" as const,
              },
            ].map((tmpl) => (
              <div
                key={tmpl.title}
                className="p-6 bg-white border border-slate-200/60 rounded-3xl text-left flex flex-col shadow-sm"
              >
                <div className="mb-3 flex aspect-[1.3/1] w-full items-center justify-center overflow-hidden rounded-2xl bg-white">
                  <TemplatePreview kind={tmpl.preview} />
                </div>
                <h3 className="text-xs font-extrabold text-slate-900">
                  {tmpl.title}
                </h3>
                <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500">
                  {tmpl.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* INTERACTIVE DRAWING SANDBOX */}
      <section
        id="sandbox"
        className="py-24 bg-[#fafafb] border-t border-slate-100 relative overflow-hidden"
      >
        <img
          src="/images/loop_arrow_doodle.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[5%] left-[38%] hidden w-28 rotate-[160deg] scale-y-[-1] select-none opacity-65 xl:block"
        />
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left side text column */}
            <div className="lg:col-span-5 text-left">
              <h2 className="mb-5 max-w-md text-3xl font-extrabold leading-[1.12] tracking-tight text-slate-950 sm:text-4xl">
                Sketch an idea.
                <br />
                See it come to life.
              </h2>
              <p className="mb-8 max-w-md text-base font-medium leading-relaxed text-slate-600">
                Draw, shape, and experiment on the live canvas—no account
                needed. Everything responds instantly, just like a real Scribbix
                board.
              </p>

              <div className="mb-12 grid max-w-md gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 xl:gap-6 xl:pb-6">
                {[
                  {
                    number: "01",
                    title: "Pick a tool",
                    description: "Pen, shapes, or arrows",
                    image: "/images/sandbox-step-tools.png",
                    offset: "",
                    scale: "scale-[1.53]",
                  },
                  {
                    number: "02",
                    title: "Make it yours",
                    description: "Choose color and stroke",
                    image: "/images/sandbox-step-customize.png",
                    offset: "",
                    scale: "scale-[1.53]",
                  },
                  {
                    number: "03",
                    title: "Save your idea",
                    description: "Download when ready",
                    image: "/images/sandbox-step-save.png",
                    offset: "",
                    scale: "scale-[1.68]",
                  },
                ].map((step, index) => (
                  <div
                    key={step.number}
                    className={`relative rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ${step.offset}`}
                  >
                    <div className="mb-3 flex aspect-[1.3/1] w-full items-center justify-center overflow-hidden">
                      <img
                        src={step.image}
                        alt=""
                        aria-hidden="true"
                        className={`max-h-full max-w-full object-contain ${step.scale}`}
                      />
                    </div>
                    <h3 className="text-xs font-extrabold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500">
                      {step.description}
                    </p>
                    {index < 2 && (
                      <svg
                        className="pointer-events-none absolute -right-[24px] top-[48%] -translate-y-1/2 hidden w-6 h-6 text-purple-400 select-none xl:block"
                        viewBox="0 0 32 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {/* Double-drawn sketchy wavy shaft */}
                        <path d="M 4 11.5 C 9.5 8.5, 15.5 15.5, 22 12" />
                        <path d="M 4.5 12.5 C 10 9.5, 16 14.5, 22.5 12.5" />

                        {/* Overlapping sketchy arrowhead lines */}
                        <path d="M 18.5 5.5 L 28.5 12.5" />
                        <path d="M 28 11.5 L 18 18.5" />
                        <path d="M 18.5 18 C 20.5 15, 20.5 9, 18.5 6" />

                        {/* Loose internal sketch scribble lines */}
                        <path d="M 20 10 L 25.5 12" strokeWidth="1.6" />
                        <path d="M 20.5 14.5 L 24.5 12" strokeWidth="1.6" />
                        <path d="M 19 12 L 27.5 12" strokeWidth="1.6" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={startGuestBoard}
                className="px-6 py-3.5 bg-slate-900 hover:bg-[#141b2b] text-white text-xs font-black rounded-2xl shadow-md shadow-slate-900/15 inline-flex items-center gap-2 transition-all"
              >
                Create a Shared Workspace <ArrowRight className="size-3.5" />
              </button>
            </div>

            {/* Right side sandboxed canvas */}
            <div className="lg:col-span-7">
              <div className="relative w-full h-[460px] sm:h-[500px] rounded-3xl border border-slate-200/70 overflow-hidden shadow-[0_20px_50px_-12px_rgba(15,23,42,0.08)] bg-slate-50">
                <Canvas
                  roomId="landing-sandbox"
                  socket={
                    {
                      send: () => {},
                      close: () => {},
                      onmessage: null,
                      addEventListener: () => {},
                      removeEventListener: () => {},
                      readyState: 1,
                    } as unknown as WebSocket
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* WHY TEAMS LOVE SCRIBBIX */}
      <section className="border-t border-slate-100 bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.9fr_2.25fr]">
            <div className="text-left">
              <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl leading-tight">
                Why teams{" "}
                <Heart className="inline size-11 fill-rose-500 text-rose-500 mx-1.5 align-middle -translate-y-[1px]" />{" "}
                Scribbix
              </h2>
              <div className="flex flex-col gap-4">
                {[
                  "A fun, intuitive workspace for creative minds",
                  "Great for workshops, planning, and problem solving",
                  "Keeps everyone aligned and ideas visible",
                  "Works on any device, anywhere",
                ].map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                      <svg
                        className="size-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {/* Sketchy wobbly check paths */}
                        <path d="M4 12 L9 17 L20 6" />
                        <path
                          d="M5 11.5 L9 16 L19 7"
                          strokeWidth="2.5"
                          className="opacity-80"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-600">
                      {benefit}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <img
              src="/images/team-high-five.png"
              alt="A creative team celebrating with a high five"
              className="mx-auto mt-6 w-full max-w-[480px] translate-y-8 object-contain"
            />

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  quote:
                    "Scribbix has become our go-to tool for every creative brainstorm. It feels effortless from the first idea.",
                  name: "Ananya Sharma",
                  role: "Product Manager at PixelCraft",
                  rating: "4.9/5",
                },
                {
                  quote:
                    "Real-time collaboration makes our workshops more engaging, focused, and productive.",
                  name: "Rohan Mehta",
                  role: "Head of Design at BrightPath",
                  rating: "4.8/5",
                },
                {
                  quote:
                    "Simple, beautiful, and powerful. Our whole team adopted it within a week.",
                  name: "Priya Nair",
                  role: "Marketing Lead at GrowthNest",
                  rating: "4.9/5",
                },
              ].map((testimonial) => (
                <article
                  key={testimonial.name}
                  className="flex min-h-[270px] flex-col rounded-2xl border border-slate-200/70 bg-white p-5 text-left shadow-sm"
                >
                  <span className="mb-3 text-3xl font-black leading-none text-blue-500">
                    “
                  </span>
                  <p className="flex-1 text-sm font-medium leading-relaxed text-slate-700">
                    {testimonial.quote}
                  </p>
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="mb-3 flex items-center gap-1 text-amber-500">
                      {[0, 1, 2, 3, 4].map((star) => (
                        <Star key={star} className="size-3 fill-current" />
                      ))}
                      <span className="ml-1 text-[10px] font-bold text-slate-400">
                        {testimonial.rating}
                      </span>
                    </div>
                    <h3 className="text-xs font-extrabold text-slate-900">
                      {testimonial.name}
                    </h3>
                    <p className="mt-1 text-[10px] font-medium text-slate-400">
                      {testimonial.role}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* FOOTER */}
      {/* FAQ SECTION */}
      <section className="py-24 bg-white border-t border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Frequently asked questions
            </h2>
            <button
              onClick={(e) => e.preventDefault()}
              className="text-xs font-bold text-[#3b52f6] inline-flex items-center gap-1 cursor-default"
            >
              View all FAQs <ArrowRight className="size-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* FAQ 1 */}
            <details className="group px-6 py-4.5 bg-white border border-slate-200/60 rounded-2xl hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer">
              <summary className="list-none flex items-center justify-between font-extrabold text-sm text-slate-900 [&::-webkit-details-marker]:hidden">
                <span>Is Scribbix really free?</span>
                <span className="text-slate-400 font-bold text-lg select-none group-open:rotate-45 transition-transform duration-200">
                  +
                </span>
              </summary>
              <p className="mt-3 text-xs text-slate-500 font-medium leading-relaxed">
                Yes! Scribbix is 100% free to use for guest whiteboarding.
              </p>
            </details>

            {/* FAQ 2 */}
            <details className="group px-6 py-4.5 bg-white border border-slate-200/60 rounded-2xl hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer">
              <summary className="list-none flex items-center justify-between font-extrabold text-sm text-slate-900 [&::-webkit-details-marker]:hidden">
                <span>How many people can collaborate?</span>
                <span className="text-slate-400 font-bold text-lg select-none group-open:rotate-45 transition-transform duration-200">
                  +
                </span>
              </summary>
              <p className="mt-3 text-xs text-slate-500 font-medium leading-relaxed">
                You can invite up to 10 collaborators to draw, write, and
                brainstorm together in real-time.
              </p>
            </details>

            {/* FAQ 3 */}
            <details className="group px-6 py-4.5 bg-white border border-slate-200/60 rounded-2xl hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer">
              <summary className="list-none flex items-center justify-between font-extrabold text-sm text-slate-900 [&::-webkit-details-marker]:hidden">
                <span>Can I import my files?</span>
                <span className="text-slate-400 font-bold text-lg select-none group-open:rotate-45 transition-transform duration-200">
                  +
                </span>
              </summary>
              <p className="mt-3 text-xs text-slate-500 font-medium leading-relaxed">
                Yes, you can easily drag and drop PNG, JPEG, and SVG images
                directly onto your whiteboard.
              </p>
            </details>

            {/* FAQ 4 */}
            <details className="group px-6 py-4.5 bg-white border border-slate-200/60 rounded-2xl hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer">
              <summary className="list-none flex items-center justify-between font-extrabold text-sm text-slate-900 [&::-webkit-details-marker]:hidden">
                <span>Is my data secure?</span>
                <span className="text-slate-400 font-bold text-lg select-none group-open:rotate-45 transition-transform duration-200">
                  +
                </span>
              </summary>
              <p className="mt-3 text-xs text-slate-500 font-medium leading-relaxed">
                Absolutely. All boards are encrypted end-to-end and stored
                securely with industry-standard protocols.
              </p>
            </details>
          </div>
        </div>
      </section>{" "}
      {/* CTA BANNER */}
      <section className="bg-white pb-24">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <div className="relative isolate flex min-h-[280px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#f8fafc] px-6 py-12 text-center sm:min-h-[300px] sm:px-10">
            <img
              src="/images/cta-pen-doodle-v6.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 hidden size-full select-none object-cover md:block"
              style={{ opacity: 0.85 }}
            />
            <h2 className="relative z-10 mb-2 text-2xl font-extrabold tracking-tight text-slate-955 sm:text-3xl">
              Ready to bring your ideas to life?
            </h2>
            <p className="relative z-10 mb-7 max-w-md text-sm font-medium text-slate-600 sm:text-base">
              Join thousands of teams whiteboarding better, together.
            </p>
            <button
              onClick={startGuestBoard}
              className="relative z-10 h-12 rounded-xl bg-slate-900 px-7 text-sm font-bold text-white shadow-lg shadow-slate-900/20 inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              Start whiteboarding for free <ArrowRight data-icon="inline-end" />
            </button>
          </div>
        </div>
      </section>
      {/* FOOTER */}
      <footer className="bg-[#fafafb] border-t border-slate-200/50 pt-10 pb-40 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-12 border-b border-slate-200/40 text-center md:text-left">
            {/* Left Brand Column */}
            <div className="flex justify-center md:justify-start">
              <Link
                href="/"
                className="flex items-center text-3xl font-bold tracking-tight text-[#0a1128] hover:opacity-90 transition-opacity"
              >
                <span>Skribbi</span>
                <span className="relative inline-block">
                  x
                  <svg
                    className="absolute -top-2 -right-3 size-4 text-[#ffbe5c] rotate-[15deg]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  >
                    <path d="M6 18 L3 12" />
                    <path d="M12 16 L12 9" />
                    <path d="M16 18 L20 14" />
                  </svg>
                </span>
              </Link>
            </div>

            {/* Right Social Column */}
            <div className="flex flex-col items-center md:items-end gap-3.5">
              <div className="flex gap-2.5">
                <Link
                  href="https://x.com/21xAshish13"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="size-9 rounded-xl bg-slate-100/80 border border-slate-200/45 flex items-center justify-center text-slate-500 hover:text-slate-955 hover:bg-slate-200/50 hover:border-slate-300 shadow-sm transition-all duration-200"
                >
                  <Twitter className="size-4.5" />
                </Link>
                <Link
                  href="https://www.linkedin.com/in/21ashishmahajan/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="size-9 rounded-xl bg-slate-100/80 border border-slate-200/45 flex items-center justify-center text-slate-500 hover:text-slate-955 hover:bg-slate-200/50 hover:border-slate-300 shadow-sm transition-all duration-200"
                >
                  <Linkedin className="size-4.5" />
                </Link>
              </div>
              <p className="text-[10.5px] text-slate-400 font-semibold tracking-wide">
                &copy; {new Date().getFullYear()} Skribbix. All rights reserved.
              </p>
            </div>
          </div>
        </div>

        {/* Large Backdrop Text Overlay */}
        <div className="absolute bottom-[-16%] left-0 right-0 w-full flex justify-center select-none pointer-events-none z-0">
          <span className="font-sans font-black text-[14vw] tracking-[0.06em] leading-none text-center uppercase bg-gradient-to-b from-black/[0.15] to-black/0 text-transparent bg-clip-text">
            Skribbix
          </span>
        </div>
      </footer>
    </main>
  );
}
