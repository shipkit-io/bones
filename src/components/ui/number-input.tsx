import { Minus, Plus } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumberFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
	min?: number;
	max?: number;
	step?: number;
	onChange?: (value: number) => void;
	value?: number;
	defaultValue?: number;
	className?: string;
}

export const NumberInput = ({
	min = Number.NEGATIVE_INFINITY,
	max = Number.POSITIVE_INFINITY,
	step = 1,
	value = 0,
	onChange,
	className,
	...props
}: NumberFieldProps) => {
	const handleIncrement = () => {
		if (!value) return;
		const newValue = Math.min(value + step, max);
		onChange?.(newValue);
	};

	const handleDecrement = () => {
		if (!value) return;
		const newValue = Math.max(value - step, min);
		onChange?.(newValue);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const inputValue = e.target.value;
		if (inputValue === "") {
			onChange?.(min);
		} else {
			const newValue = Math.max(min, Math.min(Number(inputValue), max));
			onChange?.(newValue);
		}
	};

	return (
		<div className={cn("flex items-center", className)}>
			<Button
				type="button"
				variant="outline"
				size="icon"
				onClick={handleDecrement}
				disabled={value <= min}
				aria-label="Decrease value"
				className="border-r-0"
			>
				<Minus className="h-4 w-4" />
			</Button>
			<Input
				type="number"
				min={min}
				max={max}
				value={value}
				onChange={handleInputChange}
				className="z-10 -mx-1 w-20 rounded-none border-x-0 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
				{...props}
			/>
			<Button
				type="button"
				variant="outline"
				size="icon"
				onClick={handleIncrement}
				disabled={value >= max}
				aria-label="Increase value"
				className="border-l-0"
			>
				<Plus className="h-4 w-4" />
			</Button>
		</div>
	);
};
