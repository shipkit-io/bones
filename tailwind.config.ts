import typography from "@tailwindcss/typography";
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import { fontFamily } from "tailwindcss/defaultTheme";
import flattenColorPalette from "tailwindcss/lib/util/flattenColorPalette";
const config = {
	darkMode: ["class"],
	content: [
		"./src/**/*.{js,jsx,ts,tsx,md,mdx}",
		"./content/**/*.{md,mdx}",
		"./node_modules/fumadocs-ui/dist/**/*.js",
		"./mdx-components.tsx",
	],
	prefix: "",
	theme: {
    	extend: {
    		fontFamily: {
    			sans: [
    				'var(--font-geist-sans)',
                    ...fontFamily.sans
                ],
    			serif: [
    				'var(--font-serif)',
                    ...fontFamily.serif
                ]
    		},
    		borderRadius: {
    			DEFAULT: 'var(--radius)',
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		container: {
    			center: true,
    			padding: '2rem',
    			screens: {
    				'2xl': '1400px'
    			}
    		},
    		colors: {
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			},
    			sidebar: {
    				DEFAULT: 'hsl(var(--sidebar-background))',
    				foreground: 'hsl(var(--sidebar-foreground))',
    				primary: 'hsl(var(--sidebar-primary))',
    				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
    				accent: 'hsl(var(--sidebar-accent))',
    				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
    				border: 'hsl(var(--sidebar-border))',
    				ring: 'hsl(var(--sidebar-ring))'
    			},
    			'color-1': 'hsl(var(--color-1))',
    			'color-2': 'hsl(var(--color-2))',
    			'color-3': 'hsl(var(--color-3))',
    			'color-4': 'hsl(var(--color-4))',
    			'color-5': 'hsl(var(--color-5))'
    		},
    		keyframes: {
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			},
    			'border-beam': {
    				'100%': {
    					'offset-distance': '100%'
    				}
    			},
    			'shiny-text': {
    				'0%, 90%, 100%': {
    					'background-position': 'calc(-100% - var(--shiny-width)) 0'
    				},
    				'30%, 60%': {
    					'background-position': 'calc(100% + var(--shiny-width)) 0'
    				}
    			},
    			gradient: {
    				to: {
    					backgroundPosition: 'var(--bg-size) 0'
    				}
    			},
    			rainbow: {
    				'0%': {
    					'background-position': '0%'
    				},
    				'100%': {
    					'background-position': '200%'
    				}
    			},
    			'shimmer-slide': {
    				to: {
    					transform: 'translate(calc(100cqw - 100%), 0)'
    				}
    			},
    			'spin-around': {
    				'0%': {
    					transform: 'translateZ(0) rotate(0)'
    				},
    				'15%, 35%': {
    					transform: 'translateZ(0) rotate(90deg)'
    				},
    				'65%, 85%': {
    					transform: 'translateZ(0) rotate(270deg)'
    				},
    				'100%': {
    					transform: 'translateZ(0) rotate(360deg)'
    				}
    			},
    			grid: {
    				'0%': {
    					transform: 'translateY(-50%)'
    				},
    				'100%': {
    					transform: 'translateY(0)'
    				}
    			},
    			meteor: {
    				'0%': {
    					transform: 'rotate(215deg) translateX(0)',
    					opacity: '1'
    				},
    				'70%': {
    					opacity: '1'
    				},
    				'100%': {
    					transform: 'rotate(215deg) translateX(-500px)',
    					opacity: '0'
    				}
    			},
    			'background-position-spin': {
    				'0%': {
    					backgroundPosition: 'top center'
    				},
    				'100%': {
    					backgroundPosition: 'bottom center'
    				}
    			},
    			marquee: {
    				from: {
    					transform: 'translateX(0)'
    				},
    				to: {
    					transform: 'translateX(calc(-100% - var(--gap)))'
    				}
    			},
    			'marquee-vertical': {
    				from: {
    					transform: 'translateY(0)'
    				},
    				to: {
    					transform: 'translateY(calc(-100% - var(--gap)))'
    				}
    			},
    			shine: {
    				from: {
    					backgroundPosition: '200% 0'
    				},
    				to: {
    					backgroundPosition: '-200% 0'
    				}
    			},
    			spotlight: {
    				'0%': {
    					opacity: '0',
    					transform: 'translate(-72%, -62%) scale(0.5)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'translate(-50%,-40%) scale(1)'
    				}
    			},
    			'galaxy-shimmer': {
    				'0%': {
    					opacity: '0.0'
    				},
    				'18%': {
    					opacity: '0.2'
    				},
    				'50%': {
    					opacity: '0.1'
    				},
    				'75%': {
    					opacity: '0.35'
    				},
    				'100%': {
    					opacity: '0.0'
    				}
    			},
    			aurora: {
    				from: {
    					backgroundPosition: '50% 50%, 50% 50%'
    				},
    				to: {
    					backgroundPosition: '350% 50%, 350% 50%'
    				}
    			},
    			fadeDown: {
    				'0%': {
    					opacity: '0',
    					transform: 'translateY(-4px)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'translateY(0)'
    				}
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out',
    			'border-beam': 'border-beam calc(var(--duration)*1s) infinite linear',
    			'shiny-text': 'shiny-text 8s infinite',
    			gradient: 'gradient 8s linear infinite',
    			rainbow: 'rainbow var(--speed, 2s) infinite linear',
    			'shimmer-slide': 'shimmer-slide var(--speed) ease-in-out infinite alternate',
    			'spin-around': 'spin-around calc(var(--speed) * 2) infinite linear',
    			grid: 'grid 120s linear infinite',
    			meteor: 'meteor 5s linear infinite',
    			'background-position-spin': 'background-position-spin 3000ms infinite alternate',
    			marquee: 'marquee var(--duration) infinite linear',
    			'marquee-vertical': 'marquee-vertical var(--duration) linear infinite',
    			shine: 'shine 8s ease-in-out infinite',
    			spotlight: 'spotlight 2s ease .75s 1 forwards',
    			'galaxy-shimmer': 'galaxy-shimmer 20s ease-in-out infinite 3s',
    			aurora: 'aurora 60s linear infinite',
    			fadeDown: 'fadeDown 0.2s ease-out'
    		},
    		spacing: {
    			'2xs': '0.25rem',
    			xs: '0.5rem',
    			sm: '0.75rem',
    			DEFAULT: '1rem',
    			base: '1rem',
    			md: '1.25rem',
    			lg: '1.5rem',
    			xl: '2rem',
    			'2xl': '2.5rem',
    			header: '8rem',
    			section: '4rem',
    			gap: '1rem'
    		},
    		transitionProperty: {
    			width: 'width margin',
    			height: 'height',
    			bg: 'background-color',
    			display: 'display opacity',
    			visibility: 'visibility',
    			padding: 'padding-top padding-right padding-bottom padding-left'
    		}
    	}
    },
	plugins: [typography, tailwindcssAnimate, addVariablesForColors],
} satisfies Config;

export default config;
// // This plugin adds each Tailwind color as a global CSS variable, e.g. var(--gray-200).
// function addVariablesForColors({ addBase, theme }: any) {
//   const allColors = flattenColorPalette(theme("colors"));
//   const newVars = Object.fromEntries(
//     Object.entries(allColors).map(([key, val]) => [`--${key}`, val]),
//   );

//   addBase({
//     ":root": newVars,
//   });
// }
function addVariablesForColors({ addBase, theme }: any) {
	const allColors = flattenColorPalette(theme("colors"));
	const newVars = Object.fromEntries(
		Object.entries(allColors).map(([key, val]) => [`--${key}`, val]),
	);

	addBase({
		":root": newVars,
	});
}
