import React from "react";

import { ScrollArea } from "@/components/ui/scroll-area";

const ScrollFade = () => {
    return (
        <div className="bg-muted flex h-full w-full flex-col items-center justify-center gap-10">
            <div className="-mt-10 mb-20 grid content-start justify-items-center gap-6 text-center">
                <span className="after:to-foreground relative max-w-[12ch] text-xs uppercase leading-tight opacity-40 after:absolute after:left-1/2 after:top-full after:h-16 after:w-px after:bg-gradient-to-b after:from-transparent after:content-['']">
                    see the fade while scroll
                </span>
            </div>
            <div className="rounded-xl border">
                <ScrollArea className="w-62 h-72 rounded-xl">
                    <div className="space-y-1 p-1">
                        {Array.from({ length: 11 }).map((_, index) => (
                            <div
                                key={index}
                                className="text-foreground/30 hover:bg-foreground/10 bg-foreground/5 flex h-10 w-full items-center gap-2 rounded-lg px-4"
                            >
                                00{index} <div className="bg-foreground/10 h-px flex-1"></div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};

export { ScrollFade };
