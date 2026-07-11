type TemplatePreviewKind =
  | "mind-map"
  | "sequence"
  | "er"
  | "architecture"
  | "flowchart";

const sources: Record<TemplatePreviewKind, string> = {
  "mind-map": "/images/generated-templates/mind-map.png",
  sequence: "/images/generated-templates/sequence.png",
  er: "/images/generated-templates/er-diagram.png",
  architecture: "/images/generated-templates/system-architecture.png",
  flowchart: "/images/generated-templates/flowchart.png",
};

export function TemplatePreview({ kind }: { kind: TemplatePreviewKind }) {
  return (
    <img
      src={sources[kind]}
      alt=""
      aria-hidden="true"
      className={cn(
        "size-full brightness-110 contrast-105",
        kind === "architecture" ? "object-contain" : "object-cover",
        kind === "mind-map"
          ? "scale-135"
          : kind === "architecture"
            ? "scale-[1.12]"
            : kind === "sequence"
              ? "scale-105"
              : kind !== "flowchart" && "scale-110",
      )}
    />
  );
}
import { cn } from "@/lib/utils";
