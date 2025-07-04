"use client";
import { useState } from "react";
import { StepProgressBar } from "@/components/step-progress-bar";
import SidebarLayout, { SidebarItem } from "@/components/sidebar-layout";
import { Briefcase, PlusCircle, Star, User } from "lucide-react";
import CVUpload from "@/components/cv-upload";

const navigationItems: SidebarItem[] = [
	{
		name: "My Applications",
		href: "/dashboard/candidate",
		icon: Briefcase,
		type: "item",
	},
	{
		type: "label",
		name: "Practice & Premium",
	},
	{
		name: "Simulate Job Offer",
		href: "/dashboard/candidate/simulate",
		icon: PlusCircle,
		type: "item",
	},
	{
		name: "Premium Examples",
		href: "/dashboard/candidate/examples",
		icon: Star,
		type: "item",
	},
	{
		type: "label",
		name: "Profile",
	},
	{
		name: "My Profile",
		href: "/dashboard/candidate/profile",
		icon: User,
		type: "item",
	},
];

export default function CandidateApplicationSubdashboard() {
	const [currentStep, setCurrentStep] = useState(0);
	const [cvConfirmed, setCvConfirmed] = useState(false);
	const [profile, setProfile] = useState<any>(null);
	const userId = 36;

	function handleCvConfirm(cvFile: File | null, parsedProfile: any) {
		setProfile(parsedProfile);
		setCvConfirmed(true);
		setTimeout(() => setCurrentStep(1), 800); // Unlock Step 2 after short delay
	}

	return (
		<SidebarLayout basePath="/dashboard/candidate" items={navigationItems}>
			<div className="max-w-4xl mx-auto pt-2 pb-10">
				<h1 className="text-2xl font-bold mb-6 ml-6">
					Hiring Process Progress
				</h1>
				<StepProgressBar
					currentStep={currentStep}
					onStepClick={setCurrentStep}
				/>
				<div className="mt-8 p-6 bg-card rounded-xl shadow">
					{currentStep === 0 && !cvConfirmed && (
						<CVUpload onConfirm={handleCvConfirm} userId={userId} />
					)}
					{currentStep === 0 && cvConfirmed && profile && (
						<div className="flex flex-col gap-4">
							<div className="text-green-600 font-semibold">
								CV uploaded and profile confirmed! Proceeding to next step...
							</div>
							<div className="flex flex-row gap-2 items-center justify-between mt-4">
								<button
									className="bg-blue-600 text-white rounded px-4 py-2 font-semibold disabled:opacity-60"
									onClick={() => setCurrentStep(1)}
									disabled={false}
									style={{ marginLeft: 'auto' }}
								>
									Next Stage
								</button>
							</div>
						</div>
					)}
					{currentStep > 0 && (
						<div>
							<h2 className="text-lg font-semibold mb-2 ml-1">
								Step {currentStep + 1}:{" "}
								{[
									"Screening & Role Introduction",
									"Behavioral Interview",
									"Technical Interview",
									"Mini Project Challenge",
								][currentStep - 1]}
							</h2>
							<p className="text-muted-foreground ml-1">
								(Step content placeholder. In future stages, this will show
								the interactive UI for each step.)
							</p>
							<div className="flex flex-row gap-2 items-center justify-between mt-4">
								<button
									className="bg-blue-600 text-white rounded px-4 py-2 font-semibold disabled:opacity-60"
									onClick={() => setCurrentStep(currentStep + 1)}
									disabled={true} // TODO: Enable when step is complete
									style={{ marginLeft: 'auto' }}
								>
									Next Stage
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</SidebarLayout>
	);
}
