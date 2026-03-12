import React from "react";

type ProgressiveBlurProps = {
    className?: string;
    backgroundColor?: string;
    position?: "top" | "bottom";
    height?: string;
    blurAmount?: string;
};

const ProgressiveBlur = ({
    className = "",
    backgroundColor = "#f5f4f3",
    position = "top",
    height = "150px",
    blurAmount = "4px",
}: ProgressiveBlurProps) => {
    const isTop = position === "top";

    return (
        <div
            className={`pointer-events-none absolute left-0 w-full select-none ${className}`}
            style={{
                [isTop ? "top" : "bottom"]: 0,
                height,
                background: isTop
                    ? `linear-gradient(to top, transparent, ${backgroundColor})`
                    : `linear-gradient(to bottom, transparent, ${backgroundColor})`,
                maskImage: isTop
                    ? `linear-gradient(to bottom, ${backgroundColor} 50%, transparent)`
                    : `linear-gradient(to top, ${backgroundColor} 50%, transparent)`,
                WebkitBackdropFilter: `blur(${blurAmount})`,
                backdropFilter: `blur(${blurAmount})`,
                WebkitUserSelect: "none",
                userSelect: "none",
            }}
        />
    );
};

const Skiper41 = () => {
    return (
        <div className="relative flex h-full w-full flex-col items-center justify-center bg-[#f5f4f3] text-black/40">
            <ProgressiveBlur position="top" backgroundColor="#f5f4f3" />
            <ProgressiveBlur position="bottom" backgroundColor="#f5f4f3" />

            <div className="flex h-[calc(100vh-1rem)] w-full flex-col items-center overflow-scroll">
                <div className="mt-42 grid content-start justify-items-center gap-6 text-center text-black">
                    <span className="relative max-w-[12ch] text-xs uppercase leading-tight opacity-40 after:absolute after:left-1/2 after:top-full after:h-16 after:w-px after:bg-gradient-to-b after:from-white after:to-black after:content-['']">
                        Scroll down to see the effect
                    </span>
                </div>

                <div className="mt-24 w-full max-w-lg space-y-20 px-5 text-justify">
                    {Array.from({ length: 10 }).map((_, index) => (
                        <div key={index}>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit.
                            Obcaecati, reiciendis eum vitae nostrum, temporibus repudiandae
                            voluptatibus, natus iure ipsa velit odit quibusdam illum. Quaerat
                            cumque laudantium libero reprehenderit perferendis quo nulla
                            voluptate? Repellat tenetur labore exercitationem dicta libero
                            voluptate suscipit, iusto ea assumenda. Ipsa enim, quidem atque
                            modi error eaque, debitis perferendis, hic iste libero dignissimos
                            ea! Quod inventore beatae aspernatur nulla rem perferendis aperiam
                            at debitis delectus odit quia animi ex mollitia vero molestias
                            itaque deleniti, quos exercitationem consequatur assumenda dolor?
                            Quod reiciendis in similique reprehenderit commodi quo blanditiis
                            nobis hic ea optio illum placeat officia alias quasi autem earum
                            quos obcaecati, voluptatum corporis quisquam. Quisquam iste, quas
                            explicabo omnis harum aut quam adipisci, voluptatem saepe
                            accusantium doloribus repellendus amet culpa magnam ex et dolores
                            accusamus commodi facere aliquam voluptatum alias? Officia
                            expedita ut vel? Beatae deserunt sequi id eos libero suscipit
                            totam cum, sed architecto atque quisquam et incidunt quod fuga
                            ullam repellat assumenda quos ab, voluptatum sint nesciunt? Ad
                            sapiente est laborum quam sint eius sequi. Eum, veniam
                            dignissimos.
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export { ProgressiveBlur, Skiper41 };

/**
 * Skiper 41 Canvas_Landing_004 — React + framer motion
 * Inspired by and adapted from https://devouringdetails.com/
 * We respect the original creators. This is an inspired rebuild with our own taste and does not claim any ownership.
 * These animations aren’t associated with the devouringdetails.com . They’re independent recreations meant to study interaction design
 *
 * License & Usage:
 * - Free to use and modify in both personal and commercial projects.
 * - Attribution to Skiper UI is required when using the free version.
 * - No attribution required with Skiper UI Pro.
 *
 * Feedback and contributions are welcome.
 *
 * Author: @gurvinder-singh02
 * Website: https://gxuri.in
 * Twitter: https://x.com/Gur__vi
 */
