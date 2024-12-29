export const Spotlight = () => {
  return (
    <div className="relative flex h-[600px] w-[600px] flex-col gap-20">
      <svg
        className="md:-top-50 pointer-events-none absolute -left-20 -top-40 z-[1] h-[119%] w-[288%] animate-spotlight opacity-0 md:left-60 lg:h-[169%] lg:w-[94%]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 3787 2842"
        fill="none"
      >
        <defs>
          <radialGradient
            id="spotlightGradient"
            cx="5%"
            cy="10%"
            r="40%"
            gradientTransform="translate(0.5,0.5) rotate(90) scale(2.5, 1)"
          >
            <stop offset="0%" stopColor="#f9a8d4" />
            <stop offset="50%" stopColor="#bbb1ff" />
            <stop offset="100%" stopColor="#67e8f9" stopOpacity="1" />
          </radialGradient>
          <filter
            id="filter"
            x="0.860352"
            y="0.838989"
            width="3785.16"
            height="2840.26"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur
              stdDeviation="150"
              result="effect1_foregroundBlur_1065_8"
            />
          </filter>
        </defs>
        <g filter="url(#filter)">
          <ellipse
            cx="1924.71"
            cy="273.501"
            rx="1924.71"
            ry="273.501"
            transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
            fill="url(#spotlightGradient)"
            fillOpacity="0.21"
          />
        </g>
      </svg>
    </div>
  );
};
