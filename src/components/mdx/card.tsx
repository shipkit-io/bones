'use client'

import '@/lib/fontawesome'
import { cn } from "@/lib/utils"
import type { IconProp } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import type { LucideIcon } from "lucide-react"
import * as React from "react"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	title: string
	icon?: React.ReactElement | string | LucideIcon
	children: React.ReactNode
}

export function Card({ title, icon, children, className, ...props }: CardProps) {
	const renderIcon = () => {
		if (!icon) return null

		if (React.isValidElement(icon)) {
			return React.cloneElement(icon as React.ReactElement<any>, {
				className: "h-5 w-5 text-primary/80 shrink-0"
			})
		}

		if (typeof icon === "string") {
			// Handle Font Awesome icon string format (e.g., "user", "home", etc.)
			return (

				<FontAwesomeIcon
					icon={icon as IconProp}
					className="h-4 w-4 text-primary/80"
					style={{ transform: 'scale(1.2)' }}
				/>
			)
		}

		if (typeof icon === "function") {
			const Icon = icon
			return (
				<Icon className="h-4 w-4 text-primary/80" />
			)
		}

		return null
	}

	return (
		<div
			className={cn(
				"relative overflow-hidden rounded-lg border bg-background p-6",
				className || ""
			)}
			{...props}
		>
			<div className="flex h-full flex-col justify-between">
				<div className="space-y-2">
					<div className="flex items-center gap-3">
						<h3 className="font-semibold">{title}</h3>
						<div className='absolute top-6 right-6'>{renderIcon()}</div>
					</div>
					<div className="text-sm text-muted-foreground">
						{children}
					</div>
				</div>
			</div>
		</div>
	)
}
