"use client";

import { useEffect, useRef, useState } from "react";

// Define the list of links
const links = [
	{ name: "shipkit.io", href: "https://shipkit.io" },
	{ name: "bones.sh", href: "https://bones.sh" },
	{ name: "uibrary.com", href: "https://uibrary.com" },
	{ name: "cloud0.dev", href: "https://cloud0.dev" },
	{ name: "junebug.ai", href: "https://junebug.ai" },
	{ name: "thneed.ai", href: "https://thneed.ai" },
	{ name: "lacy.sh", href: "https://lacy.sh" },
	{ name: "lacy.is", href: "https://lacy.is" },
	{ name: "lacymorrow.com", href: "https://lacymorrow.com" },
];

export function BrickMarquee() {
	const [isNearby, setIsNearby] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const barRef = useRef<HTMLLabelElement>(null);
	const checkboxRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Handle mouse movement for magnetic effect
	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (checkboxRef.current?.checked) return;

			const threshold = 80; // Distance threshold to detect mouse

			if (barRef.current) {
				const rect = barRef.current.getBoundingClientRect();
				const cornerX = rect.right - 10;
				const cornerY = window.innerHeight;

				// Calculate distance from mouse to detection point
				const distance = Math.sqrt((e.clientX - cornerX) ** 2 + (e.clientY - cornerY) ** 2);

				// Set nearby state based on distance threshold
				setIsNearby(distance < threshold);
			}
		};

		// Add mousemove event listener
		window.addEventListener("mousemove", handleMouseMove);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
		};
	}, []);

	// Handle checkbox state change
	useEffect(() => {
		const handleChange = () => {
			if (checkboxRef.current) {
				setIsExpanded(checkboxRef.current.checked);
			}
		};

		if (checkboxRef.current) {
			checkboxRef.current.addEventListener("change", handleChange);
		}

		return () => {
			if (checkboxRef.current) {
				checkboxRef.current.removeEventListener("change", handleChange);
			}
		};
	}, []);

	// Handle click outside to close
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				checkboxRef.current?.checked &&
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				checkboxRef.current.checked = false;
				setIsExpanded(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	return (
		<>
			<style jsx>{`
  /* Base styles */
  .dev-tools-container {
    position: fixed;
    bottom: 0;
    right: 0;
    z-index: 50;
    width: 100%;
    overflow: hidden;
  }


  /* Combined bar and square as a single element with smooth transitions */
  .bar {
	opacity: 0.5;
    position: fixed;
    bottom: 0;
    right: 0;
    height: 16px;
    width: 16px; /* Square width when collapsed */
    cursor: pointer;
    transform-origin: bottom right;
    /* Smooth transition for width change */
    transition: width 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* When nearby, grow in width instead of translating */
  .bar.nearby {
	opacity: 1;
    width: 20px; /* Grow by 4px instead of translating */
  }

  /* When expanded, show full bar with square */
  .bar.expanded {
	opacity: 1;
    width: 316px; /* 300px bar + 16px square */
  }

  /* Marquee styles */
  .marquee-container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 16px; /* Leave space for square */
    height: 16px;
    overflow: hidden;
    display: flex;
    align-items: center;
    opacity: 0;
    transition: opacity 400ms ease;
  }

  .marquee-container.visible {
    opacity: 1;
  }

  .marquee {
    white-space: nowrap;
    display: flex;
    align-items: center;
    height: 100%;
    padding-top:2px;
    padding-bottom:2px;
    padding-left: 22px;
    font-size: 10px;
    line-height: 1;
    font-weight: 500;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .marquee span:hover {
    transform: scale(1.2);
    color: #f0f0f0;
  }

  /* Animation for marquee */
  @keyframes marquee {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-100%);
    }
  }

  .animate-marquee {
    display: inline-block;
    animation: marquee 20s linear infinite;
  }
`}</style>

			<div ref={containerRef} className="dev-tools-container">
				{/* Hidden checkbox for state */}
				<input
					ref={checkboxRef}
					type="checkbox"
					id="bar-toggle"
					className="sr-only peer"
					aria-label="Toggle animation"
				/>

				{/* Single element for both bar and square */}
				<label
					ref={barRef}
					htmlFor="bar-toggle"
					className={`bar bg-primary [mask-image:linear-gradient(to_right,transparent,white_7%)] ${isNearby ? "nearby" : ""} ${isExpanded ? "expanded" : ""}`}
				>
					{/* Marquee container */}
					<div className={`marquee-container ${isExpanded ? "visible" : ""}`}>
						{/* Marquee of websites */}
						<div className={`marquee animate-marquee ${isExpanded ? "pointer-events-none" : ""}`}>
							{/* Map over the links array */}
							{links.map((link) => (
								<a
									key={link.name}
									href={link.href}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-block transform transition-transform duration-300 ease-in-out hover:scale-120 text-primary-foreground hover:text-primary-foreground/80 mx-2"
									style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
								>
									<span>{link.name}</span>
								</a>
							))}
						</div>
					</div>
				</label>
			</div>
		</>
	);
}
