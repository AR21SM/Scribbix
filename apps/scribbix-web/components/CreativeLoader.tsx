import { BrandLogo } from "@/components/BrandLogo";

interface CreativeLoaderProps {
  title: string;
  description: string;
}

export function CreativeLoader({ title, description }: CreativeLoaderProps) {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="min-h-screen bg-[#fbfbfc] font-sans text-[#0a1738]"
    >
      <span className="sr-only">
        {title} {description}
      </span>

      <header className="border-b border-slate-100/70 bg-white/90">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center px-6 md:px-16">
          <BrandLogo className="text-3xl" />
          <div className="ml-auto hidden items-center gap-4 md:flex">
            <span className="scribbix-skeleton h-8 w-60 rounded-lg" />
            <span className="scribbix-skeleton size-10 rounded-full" />
            <span className="scribbix-skeleton h-4 w-16 rounded-md" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-10 sm:px-6">
        <section className="mb-9">
          <div className="scribbix-skeleton h-9 w-72 max-w-[80vw] rounded-lg" />
          <div className="scribbix-skeleton mt-3 h-4 w-96 max-w-[90vw] rounded-md" />
        </section>

        <section className="shadow-scribbix-feature grid min-h-52 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white lg:grid-cols-[300px_1fr]">
          <div className="scribbix-skeleton hidden m-5 rounded-2xl lg:block" />
          <div className="flex flex-col justify-center px-6 py-8 sm:px-10">
            <div className="scribbix-skeleton h-7 w-64 max-w-full rounded-md" />
            <div className="scribbix-skeleton mt-3 h-4 w-96 max-w-full rounded-md" />
            <div className="mt-6 flex gap-3">
              <div className="scribbix-skeleton h-12 flex-1 rounded-xl" />
              <div className="scribbix-skeleton h-12 w-44 rounded-xl" />
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="scribbix-skeleton h-8 w-48 rounded-lg" />
            <div className="flex gap-2">
              <div className="scribbix-skeleton h-11 w-40 rounded-lg" />
              <div className="scribbix-skeleton h-11 w-20 rounded-lg" />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="shadow-scribbix-card grid min-h-44 overflow-hidden rounded-2xl border border-slate-200/80 bg-white sm:grid-cols-[240px_1fr]"
              >
                <div className="scribbix-skeleton m-3 rounded-xl" />
                <div className="flex flex-col p-5">
                  <div className="scribbix-skeleton h-5 w-32 rounded-md" />
                  <div className="scribbix-skeleton mt-4 h-3 w-full rounded-md" />
                  <div className="scribbix-skeleton mt-2 h-3 w-3/4 rounded-md" />
                  <div className="mt-auto flex items-center justify-between pt-5">
                    <div className="scribbix-skeleton h-3 w-28 rounded-md" />
                    <div className="scribbix-skeleton h-9 w-24 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
