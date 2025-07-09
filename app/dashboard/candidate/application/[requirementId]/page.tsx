"use client";
import { useState, useRef, useEffect } from "react";
import { StepProgressBar } from "@/components/step-progress-bar";
import SidebarLayout, { SidebarItem } from "@/components/sidebar-layout";
import { Briefcase, PlusCircle, Star, User, Video, ArrowRight, Mic } from "lucide-react";
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
	const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
	const userId = 36;

	// Preview popup states
	const [showPreviewPopup, setShowPreviewPopup] = useState(false);
	const [previewCameraOn, setPreviewCameraOn] = useState(false);
	const [previewMicrophoneOn, setPreviewMicrophoneOn] = useState(false);
	const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
	const [previewVideoRef, setPreviewVideoRef] = useState<HTMLVideoElement | null>(null);
	const [previewAudioLevel, setPreviewAudioLevel] = useState(0);
	const [previewPermissionsGranted, setPreviewPermissionsGranted] = useState(false);

	// Get requirementId from URL params
	const requirementId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() || '' : '';

	function handleCvConfirm(cvFile: File | null, parsedProfile: any) {
		setProfile(parsedProfile);
		setCvConfirmed(true);
		setTimeout(() => setCurrentStep(1), 800); // Unlock Step 2 after short delay
	}

	function handleJoinMeeting() {
		console.log('[ApplicationPage] Joining screening meeting for requirement:', requirementId);
		setShowPreviewPopup(true);
	}

	const startPreviewCamera = async () => {
		try {
			console.log('[ApplicationPage] 🎥 Starting preview camera...');
			const stream = await navigator.mediaDevices.getUserMedia({ 
				video: true, 
				audio: false 
			});
			console.log('[ApplicationPage] ✅ Preview camera stream obtained');
			
			setPreviewStream(stream);
			setPreviewCameraOn(true);
			
			if (previewVideoRef) {
				previewVideoRef.srcObject = stream;
				previewVideoRef.play().then(() => {
					console.log('[ApplicationPage] ✅ Preview video playing');
				}).catch((error) => {
					console.error('[ApplicationPage] ❌ Preview video play error:', error);
				});
			}
		} catch (error) {
			console.error('[ApplicationPage] ❌ Preview camera error:', error);
			setPreviewCameraOn(false);
		}
	};

	const startPreviewMicrophone = async () => {
		try {
			console.log('[ApplicationPage] 🎤 Starting preview microphone...');
			const stream = await navigator.mediaDevices.getUserMedia({ 
				video: false, 
				audio: true 
			});
			console.log('[ApplicationPage] ✅ Preview microphone stream obtained');
			
			setPreviewMicrophoneOn(true);
			
			// Create audio context to monitor audio levels
			const audioContext = new AudioContext();
			const source = audioContext.createMediaStreamSource(stream);
			const analyser = audioContext.createAnalyser();
			analyser.fftSize = 256;
			source.connect(analyser);
			
			const dataArray = new Uint8Array(analyser.frequencyBinCount);
			
			const updateAudioLevel = () => {
				if (previewMicrophoneOn) {
					analyser.getByteFrequencyData(dataArray);
					const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
					setPreviewAudioLevel(average);
					requestAnimationFrame(updateAudioLevel);
				}
			};
			
			updateAudioLevel();
		} catch (error) {
			console.error('[ApplicationPage] ❌ Preview microphone error:', error);
			setPreviewMicrophoneOn(false);
		}
	};

	const stopPreviewStreams = () => {
		console.log('[ApplicationPage] 🛑 Stopping preview streams...');
		if (previewStream) {
			previewStream.getTracks().forEach(track => track.stop());
			setPreviewStream(null);
		}
		setPreviewCameraOn(false);
		setPreviewMicrophoneOn(false);
		setPreviewAudioLevel(0);
	};

	const handlePreviewPermissions = async () => {
		try {
			console.log('[ApplicationPage] 🔐 Requesting preview permissions...');
			
			// Request both camera and microphone permissions
			const stream = await navigator.mediaDevices.getUserMedia({ 
				video: true, 
				audio: true 
			});
			
			console.log('[ApplicationPage] ✅ Preview permissions granted');
			setPreviewPermissionsGranted(true);
			
			// Set up camera preview
			setPreviewStream(stream);
			setPreviewCameraOn(true);
			setPreviewMicrophoneOn(true);
			
			if (previewVideoRef) {
				previewVideoRef.srcObject = stream;
				previewVideoRef.play().then(() => {
					console.log('[ApplicationPage] ✅ Preview video playing');
				});
			}
			
			// Set up audio level monitoring
			const audioContext = new AudioContext();
			const source = audioContext.createMediaStreamSource(stream);
			const analyser = audioContext.createAnalyser();
			analyser.fftSize = 256;
			source.connect(analyser);
			
			const dataArray = new Uint8Array(analyser.frequencyBinCount);
			
			const updateAudioLevel = () => {
				if (previewMicrophoneOn) {
					analyser.getByteFrequencyData(dataArray);
					const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
					setPreviewAudioLevel(average);
					requestAnimationFrame(updateAudioLevel);
				}
			};
			
			updateAudioLevel();
			
		} catch (error) {
			console.error('[ApplicationPage] ❌ Preview permissions error:', error);
			setPreviewPermissionsGranted(false);
		}
	};

	const startInterview = () => {
		console.log('[ApplicationPage] 🚀 Starting interview...');
		// Don't stop the streams - pass them to the screening interface
		setShowPreviewPopup(false);
		setShowScreening(true);
	};

	const generateQuestions = async () => {
		try {
			setIsGeneratingQuestions(true);
			console.log('[ApplicationPage] Generating questions for requirement:', requirementId);
			
			const response = await fetch('/api/screening/generate-questions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					requirementId: requirementId,
					candidateId: null // We don't have candidate ID at this stage
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error('[ApplicationPage] Error generating questions:', errorData);
				alert('Failed to generate questions: ' + (errorData.error || 'Unknown error'));
				return;
			}

			const result = await response.json();
			console.log('[ApplicationPage] Questions generated successfully:', result);
			
			alert(`Successfully generated ${result.questions.length} screening questions!`);
			
		} catch (error) {
			console.error('[ApplicationPage] Error generating questions:', error);
			alert('Failed to generate questions. Please try again.');
		} finally {
			setIsGeneratingQuestions(false);
		}
	};

	function handleScreeningComplete(score: number, passes: boolean) {
		console.log('[ApplicationPage] Screening completed with score:', score, 'passes:', passes);
		setScreeningScore(score);
		setPassesScreening(passes);
		setScreeningComplete(true);
		setShowScreening(false);
		// Clean up preview streams after interview is complete
		stopPreviewStreams();
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
				previewStream={previewStream}
				previewCameraOn={previewCameraOn}
				previewMicrophoneOn={previewMicrophoneOn}
			/>
		);
	}

	// Show preview popup before interview starts
	if (showPreviewPopup) {
		return (
			<SidebarLayout basePath="/dashboard/candidate" items={navigationItems}>
				<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
						<div className="text-center mb-6">
							<h2 className="text-2xl font-bold text-gray-900 mb-2">Interview Setup</h2>
							<p className="text-gray-600">
								Please enable your camera and microphone to continue with the interview. 
								This interview will be recorded for transparency purposes.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
							{/* Camera Preview */}
							<div className="bg-gray-100 rounded-lg p-4">
								<div className="flex items-center justify-between mb-3">
									<h3 className="font-semibold text-gray-900">Camera</h3>
									<div className={`w-3 h-3 rounded-full ${previewCameraOn ? 'bg-green-500' : 'bg-red-500'}`}></div>
								</div>
								
								<div className="relative bg-gray-800 rounded-lg overflow-hidden h-48 mb-3">
									{previewCameraOn ? (
										<video
											ref={(el) => setPreviewVideoRef(el)}
											className="w-full h-full object-cover"
											autoPlay
											muted
											playsInline
										/>
									) : (
										<div className="flex items-center justify-center h-full">
											<div className="text-center text-gray-400">
												<Video className="w-12 h-12 mx-auto mb-2" />
												<p className="text-sm">Camera preview</p>
											</div>
										</div>
									)}
								</div>
								
								<button
									onClick={previewCameraOn ? () => {
										stopPreviewStreams();
										setPreviewCameraOn(false);
									} : startPreviewCamera}
									className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
										previewCameraOn 
											? 'bg-red-600 text-white hover:bg-red-700' 
											: 'bg-blue-600 text-white hover:bg-blue-700'
									}`}
								>
									{previewCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
								</button>
							</div>

							{/* Microphone Preview */}
							<div className="bg-gray-100 rounded-lg p-4">
								<div className="flex items-center justify-between mb-3">
									<h3 className="font-semibold text-gray-900">Microphone</h3>
									<div className={`w-3 h-3 rounded-full ${previewMicrophoneOn ? 'bg-green-500' : 'bg-red-500'}`}></div>
								</div>
								
								<div className="bg-gray-800 rounded-lg p-4 mb-3 h-48 flex items-center justify-center">
									<div className="text-center">
										<div className="relative mb-4">
											<Mic className={`w-16 h-16 mx-auto ${previewMicrophoneOn ? 'text-green-500' : 'text-gray-400'}`} />
											{previewMicrophoneOn && (
												<div className="absolute inset-0 flex items-center justify-center">
													<div 
														className="w-20 h-20 rounded-full border-4 border-green-500 animate-pulse"
														style={{
															transform: `scale(${1 + (previewAudioLevel / 255) * 0.5})`
														}}
													></div>
												</div>
											)}
										</div>
										<p className="text-sm text-gray-400">
											{previewMicrophoneOn ? 'Microphone active' : 'Microphone preview'}
										</p>
										{previewMicrophoneOn && (
											<p className="text-xs text-green-600 mt-1">
												Audio level: {Math.round((previewAudioLevel / 255) * 100)}%
											</p>
										)}
									</div>
								</div>
								
								<button
									onClick={previewMicrophoneOn ? () => {
										stopPreviewStreams();
										setPreviewMicrophoneOn(false);
									} : startPreviewMicrophone}
									className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
										previewMicrophoneOn 
											? 'bg-red-600 text-white hover:bg-red-700' 
											: 'bg-blue-600 text-white hover:bg-blue-700'
									}`}
								>
									{previewMicrophoneOn ? 'Turn Off Microphone' : 'Turn On Microphone'}
								</button>
							</div>
						</div>

						<div className="flex flex-col sm:flex-row gap-3 justify-center">
							<button
								onClick={handlePreviewPermissions}
								className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
							>
								Enable Both Camera & Microphone
							</button>
							
							<button
								onClick={startInterview}
								disabled={!previewCameraOn || !previewMicrophoneOn}
								className={`px-6 py-3 rounded-lg font-medium transition-colors ${
									previewCameraOn && previewMicrophoneOn
										? 'bg-blue-600 text-white hover:bg-blue-700'
										: 'bg-gray-300 text-gray-500 cursor-not-allowed'
								}`}
							>
								Start Interview
							</button>
						</div>

						<div className="mt-4 text-center">
							<p className="text-sm text-gray-500">
								⚠️ Both camera and microphone must be enabled to start the interview.
							</p>
						</div>
					</div>
				</div>
			</SidebarLayout>
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
								<div className="space-y-4">
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

									{/* Generate Questions Button */}
									<div className="bg-green-50 rounded-lg p-4 border border-green-200">
										<div className="flex items-center justify-between">
											<div>
												<h4 className="font-semibold text-green-800">Generate Interview Questions</h4>
												<p className="text-sm text-green-600">
													Create AI-powered screening questions for this role
												</p>
											</div>
											<button
												onClick={generateQuestions}
												disabled={isGeneratingQuestions}
												className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
											>
												{isGeneratingQuestions ? (
													<>
														<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
														<span>Generating...</span>
													</>
												) : (
													<>
														<span>🤖</span>
														<span>Generate Questions</span>
													</>
												)}
											</button>
										</div>
									</div>
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
