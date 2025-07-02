"use client";
import React, { useState } from "react";
import { CheckCircle, FileText, Info, Users, Code, Award } from "lucide-react";

const steps = [
	{
		label: "CV Upload & Profile Creation",
		icon: <FileText className="w-6 h-6" />,
	},
	{
		label: "Screening & Role Introduction",
		icon: <Info className="w-6 h-6" />,
	},
	{
		label: "Behavioral Interview",
		icon: <Users className="w-6 h-6" />,
	},
	{
		label: "Technical Interview",
		icon: <Code className="w-6 h-6" />,
	},
	{
		label: "Mini Project Challenge",
		icon: <Award className="w-6 h-6" />,
	},
];

export function StepProgressBar({
	currentStep = 0,
	onStepClick,
}: {
	currentStep?: number;
	onStepClick?: (step: number) => void;
}) {
	const circleDiameter = 48; // px
	const stepCount = steps.length;
	// Calculate the left offset for the line to start at the center of the first circle
	const lineLeft = `calc((100% / (${stepCount} * 2)))`;
	const lineRight = `calc((100% / (${stepCount} * 2)))`;
	// To move the line up or down, adjust the 'top' property below. Lower values move it up, higher values move it down.
	// Example: top: `calc(50% - 16px)` moves the line 16px above the vertical center of the circles.
	return (
		<div className="flex flex-col items-center w-full">
			{/* Add more space below the title for better separation */}
			<div style={{ height: 36 }} />
			<div
				className="relative w-full max-w-4xl flex items-center justify-center mb-8"
				style={{ height: circleDiameter }}
			>
				{/* Progress line: starts at center of first circle, ends at center of last circle, perfectly centered */}
				<div
					className="absolute z-0 pointer-events-none"
					style={{
						left: `calc(${100 / (stepCount * 2)}% - ${circleDiameter / 3}px)`,
						right: `calc(${100 / (stepCount * 2)}% - ${circleDiameter / 3}px)`,
						top: `calc(50% - 20px)`, // Move the line 12px above the center of the circles
						height: 1,
					}}
				>
					<div className="relative w-full h-2 rounded-full bg-muted-foreground/30">
						<div
							className="absolute h-2 rounded-full bg-green-500 transition-all duration-300"
							style={{
								left: 0,
								top: 0,
								width: `${(currentStep) / (stepCount - 1) * 100}%`,
								maxWidth: '100%',
							}}
						/>
					</div>
				</div>
				<ol className="flex flex-row justify-between w-full max-w-4xl mx-auto z-10">
					{steps.map((step, idx) => (
						<li
							key={step.label}
							className="flex-1 flex flex-col items-center relative"
							style={{ minWidth: 56, display: 'flex', alignItems: 'center' }} // Reserve space for largest circle
						>
							<button
								className={`rounded-full w-12 h-12 flex items-center justify-center border-2 transition-all duration-200 shadow-lg ${
									idx < currentStep
										? "bg-green-500 text-white border-green-500"
										: idx === currentStep
										? "bg-[#444950] text-white border-[#888c94] border-opacity-60"
										: "bg-muted bg-opacity-10 text-muted-foreground border-muted-foreground/60"
								}`}
								onClick={() => onStepClick?.(idx)}
								aria-label={step.label}
								style={{ zIndex: 2 }}
							>
								{idx < currentStep ? (
									<CheckCircle className="w-7 h-7" />
								) : (
									step.icon
								)}
							</button>
							<span className="mt-2 text-xs text-center max-w-[7rem] font-medium">
								{step.label}
							</span>
						</li>
					))}
				</ol>
			</div>
		</div>
	);
}
