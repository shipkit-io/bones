"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartBarProps {
	data: { name: string; value: number }[];
}

export function ChartBar({ data }: ChartBarProps) {
	return (
		<Card className="col-span-4">
			<CardHeader>
				<CardTitle className="text-base font-medium">Overview</CardTitle>
				<CardDescription>Component stats</CardDescription>
			</CardHeader>
			<CardContent className="pl-2">
				<ResponsiveContainer width="100%" height={240}>
					<BarChart data={data}>
						<XAxis
							dataKey="name"
							stroke="#888888"
							fontSize={12}
							tickLine={false}
							axisLine={false}
						/>
						<YAxis
							stroke="#888888"
							fontSize={12}
							tickLine={false}
							axisLine={false}
							tickFormatter={(value) => `${value}`}
						/>
						<Bar
							dataKey="value"
							fill="currentColor"
							radius={[4, 4, 0, 0]}
							className="fill-primary"
						/>
					</BarChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
