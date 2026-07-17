import Image from "next/image";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface CreateCanvasCardProps {
  value: string;
  creating: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function CreateCanvasCard({
  value,
  creating,
  onChange,
  onSubmit,
}: CreateCanvasCardProps) {
  return (
    <Card
      id="new-canvas"
      className="shadow-scribbix-feature grid scroll-mt-28 gap-0 overflow-hidden rounded-[12px] border border-slate-200/80 bg-white p-0 lg:grid-cols-[300px_1fr]"
    >
      <div className="relative hidden min-h-48 items-center justify-center overflow-hidden bg-white px-2 lg:flex">
        <Image
          src="/images/create-canvas-sketch-v2.png"
          alt=""
          width={768}
          height={512}
          className="h-48 w-full max-w-[310px] scale-[1.06] object-contain"
        />
      </div>

      <div className="flex min-w-0 flex-col justify-center px-5 py-6 sm:px-8 lg:px-10">
        <CardHeader className="gap-1.5 px-0">
          <CardTitle className="text-2xl font-extrabold tracking-[-0.035em] text-[#0a1738] sm:text-[1.7rem]">
            Create a new canvas
          </CardTitle>
          <CardDescription className="text-sm font-medium text-slate-500">
            Start from scratch and bring your ideas to life on a blank
            whiteboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-5 px-0">
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <label className="sr-only" htmlFor="new-room-name">
              Canvas name
            </label>
            <Input
              id="new-room-name"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Name your canvas..."
              className="h-12 flex-1 rounded-[12px] border-slate-200 bg-white px-4 text-sm shadow-none focus-visible:border-[#1769ff] focus-visible:ring-[#1769ff]/15"
            />
            <Button
              type="submit"
              size="lg"
              disabled={creating || !value.trim()}
              className="h-12 rounded-[12px] bg-[#071738] px-6 font-bold text-white shadow-[0_8px_18px_-12px_rgba(7,23,56,0.48)] hover:bg-[#12264e] disabled:shadow-none sm:min-w-44"
            >
              {creating ? (
                <>
                  <LoaderCircle
                    data-icon="inline-start"
                    className="animate-spin"
                  />
                  Creating...
                </>
              ) : (
                <>
                  Create canvas
                  <ArrowRight data-icon="inline-end" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </div>
    </Card>
  );
}
