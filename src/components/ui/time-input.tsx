"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TimeInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
	value: string;
	onChange: (value: string) => void;
}

export const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
	({ className, value, onChange, disabled, ...props }, ref) => {
		// Handle time input changes
		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = e.target.value;
			// Validate time format (HH:mm)
			if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newValue)) {
				onChange(newValue);
			}
		};

		// Handle blur to format time
		const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
			const value = e.target.value;
			if (!value) return;

			// Split hours and minutes
			const [hours, minutes] = value.split(":").map(Number);
			if (hours === undefined || minutes === undefined) return;

			// Format time as HH:mm
			const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
				.toString()
				.padStart(2, "0")}`;
			onChange(formattedTime);
		};

		return (
			<Input
				type="time"
				ref={ref}
				value={value}
				onChange={handleChange}
				onBlur={handleBlur}
				disabled={disabled}
				className={cn("w-[120px]", disabled && "cursor-not-allowed opacity-50", className)}
				{...props}
			/>
		);
	}
);

TimeInput.displayName = "TimeInput";
