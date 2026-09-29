import { ScrollArea } from "@/components/ui/scroll-area";

const ScrollFade = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-10 bg-muted">
      <div className="-mt-10 mb-20 grid content-start justify-items-center gap-6 text-center">
        <span className="relative max-w-[12ch] text-xs leading-tight uppercase opacity-40 after:absolute after:top-full after:left-1/2 after:h-16 after:w-px after:bg-linear-to-b after:from-transparent after:to-foreground after:content-['']">
          see the fade while scroll
        </span>
      </div>
      <div className="rounded-xl border">
        <ScrollArea className="h-72 w-62 rounded-xl">
          <div className="space-y-1 p-1">
            {Array.from({ length: 11 }).map((_, index) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: decorative/static array, key is stable index
                key={index}
                className="flex h-10 w-full items-center gap-2 rounded-lg bg-foreground/5 px-4 text-foreground/30 hover:bg-foreground/10"
              >
                00{index} <div className="h-px flex-1 bg-foreground/10" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export { ScrollFade };
