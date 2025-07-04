"use client";
import { useState } from "react";
import { StepProgressBar } from "@/components/step-progress-bar";
import SidebarLayout, { SidebarItem } from "@/components/sidebar-layout";
import { Briefcase, PlusCircle, Star, User, Video, ArrowRight } from "lucide-react";
import CVUpload from "@/components/cv-upload";
import ScreeningInterface from "@/components/screening-interface";

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
	const [showScreening, setShowScreening] = useState(false);
	const [screeningComplete, setScreeningComplete] = useState(false);
	const [screeningScore, setScreeningScore] = useState<number | null>(null);
	const [passesScreening, setPassesScreening] = useState<boolean | null>(null);
	const userId = 36;

	// Get requirementId from URL params
	const requirementId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() || '' : '';

	function handleCvConfirm(cvFile: File | null, parsedProfile: any) {
		setProfile(parsedProfile);
		setCvConfirmed(true);
		setTimeout(() => setCurrentStep(1), 800); // Unlock Step 2 after short delay
	}

	function handleJoinMeeting() {
		console.log('[ApplicationPage] Joining screening meeting for requirement:', requirementId);
		setShowScreening(true);
	}

	function handleScreeningComplete(score: number, passes: boolean) {
		console.log('[ApplicationPage] Screening completed with score:', score, 'passes:', passes);
		setScreeningScore(score);
		setPassesScreening(passes);
		setScreeningComplete(true);
		setShowScreening(false);
	}

	function handleNextStage() {
		console.log('[ApplicationPage] Moving to next stage from step:', currentStep);
		setCurrentStep(currentStep + 1);
	}

	// If screening interface is active, show it full screen
	if (showScreening) {
		return (
			<ScreeningInterface
				requirementId={requirementId}
				userId={userId}
				onComplete={handleScreeningComplete}
			/>
		);
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
					{currentStep === 1 && (
						<div className="flex flex-col gap-6">
							<div>
								<h2 className="text-xl font-semibold mb-4">
									Step 2: Screening & Role Introduction
								</h2>
								<p className="text-muted-foreground mb-6">
									You&apos;re about to begin your screening interview with our AI agent. This session will help us understand your skills and experience better.
								</p>
							</div>

							{screeningComplete ? (
								<div className="bg-gray-50 rounded-lg p-6 border">
									<div className="flex items-center justify-between mb-4">
										<h3 className="text-lg font-semibold text-green-600">
											Screening Completed!
										</h3>
										<div className="flex items-center gap-2">
											<span className="font-semibold">
												Score: {screeningScore}/100
											</span>
											<span className={`px-2 py-1 rounded text-xs ${
												passesScreening ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
											}`}>
												{passesScreening ? 'PASSED' : 'REVIEW'}
											</span>
										</div>
									</div>
									<p className="text-muted-foreground mb-4">
										{passesScreening 
											? "Great job! You&apos;ve successfully completed the screening interview. You can now proceed to the next stage."
											: "Thank you for completing the screening interview. We&apos;ll review your responses and get back to you soon."
										}
									</p>
									<div className="flex justify-end">
										<button
											className="bg-blue-600 text-white rounded px-6 py-2 font-semibold hover:bg-blue-700 transition-colors"
											onClick={handleNextStage}
										>
											Continue to Next Stage
										</button>
									</div>
								</div>
							) : (
								<div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
									<div className="flex items-center gap-4 mb-4">
										<div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
											<Video className="w-6 h-6 text-white" />
										</div>
										<div>
											<h3 className="text-lg font-semibold">Ready for Your Screening Interview?</h3>
											<p className="text-muted-foreground">
												Join the virtual interview room to meet with our AI screening agent
											</p>
										</div>
									</div>
									
									<div className="space-y-3 mb-6">
										<div className="flex items-center gap-3">
											<div className="w-2 h-2 bg-blue-600 rounded-full"></div>
											<span className="text-sm">15-20 minute interactive session</span>
										</div>
										<div className="flex items-center gap-3">
											<div className="w-2 h-2 bg-blue-600 rounded-full"></div>
											<span className="text-sm">Role-specific questions and requirements review</span>
										</div>
										<div className="flex items-center gap-3">
											<div className="w-2 h-2 bg-blue-600 rounded-full"></div>
											<span className="text-sm">Real-time chat and video simulation</span>
										</div>
									</div>

									<button
										className="w-full bg-blue-600 text-white rounded-lg px-6 py-3 font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
										onClick={handleJoinMeeting}
									>
										<Video className="w-5 h-5" />
										Join Meeting
										<ArrowRight className="w-5 h-5" />
									</button>
								</div>
							)}
						</div>
					)}
					{currentStep > 1 && (
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
									onClick={handleNextStage}
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
