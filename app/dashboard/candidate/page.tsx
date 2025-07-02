"use client";

import SidebarLayout, { SidebarItem } from "@/components/sidebar-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Briefcase, Star, PlusCircle, BookOpen, User } from "lucide-react";
import { useState } from "react";
import { useRequirementsForCandidate } from "./hooks";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

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

const defaultJobOffers = [
	{
		id: 1,
		title: "Frontend Engineer at Acme Corp",
		company: "Acme Corp",
		status: "In Progress",
		appliedAt: "2025-06-01",
	},
	{
		id: 2,
		title: "Backend Developer at BetaTech",
		company: "BetaTech",
		status: "Interview Scheduled",
		appliedAt: "2025-06-10",
	},
	{
		id: 3,
		title: "Fullstack Dev (Simulated)",
		company: "SamanthaAI Premium",
		status: "Practice Mode",
		appliedAt: "2025-06-15",
		premium: true,
	},
];

// Type for job offers to allow DB and hardcoded offers
type JobOffer = {
	id: string | number;
	title: string;
	company: string;
	status: string;
	appliedAt: string;
	premium?: boolean;
	requirementId?: number;
};

// Dummy userId for demo; replace with real user context
const userId = 36; // TODO: Replace with actual logged-in user id

export default function CandidateDashboard() {
	const [search, setSearch] = useState("");
	const [jobOffers, setJobOffers] = useState(defaultJobOffers);
	const [newSimUrl, setNewSimUrl] = useState("");
	const router = useRouter();

	const { requirements, loading } = useRequirementsForCandidate(userId);
	const dbOffers: JobOffer[] = requirements.map((req) => ({
		id: `db-${req.requirement_id}`,
		title: req.role_name,
		company: req.creator_role === "candidate" ? "Simulated (You)" : "Team Leader",
		status: req.creator_role === "candidate" ? "Practice Mode" : "In Progress",
		appliedAt: "--",
		premium: false,
		requirementId: req.requirement_id,
	}));
	const allOffers: JobOffer[] = [...jobOffers, ...dbOffers];
	const filteredOffers = allOffers.filter((offer) =>
		offer.title.toLowerCase().includes(search.toLowerCase()) ||
		offer.company.toLowerCase().includes(search.toLowerCase())
	);

	// Simulate adding a new simulated job offer
	function handleSimulateSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!newSimUrl) return;
		setJobOffers([
			...jobOffers,
			{
				id: Date.now(),
				title: `Simulated: ${newSimUrl}`,
				company: "SamanthaAI Agent",
				status: "Practice Mode",
				appliedAt: new Date().toISOString().slice(0, 10),
				premium: false,
			},
		]);
		setNewSimUrl("");
	}

	return (
		<SidebarLayout items={navigationItems} basePath="/dashboard/candidate">
			<div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<Card className="col-span-1 md:col-span-2 lg:col-span-3">
					<CardHeader>
						<CardTitle>My Job Applications</CardTitle>
						<CardDescription>Track all your active and practice job applications. Select one to view its process.</CardDescription>
					</CardHeader>
					<CardContent>
						<Input
							placeholder="Search job offers..."
							value={search}
							onChange={e => setSearch(e.target.value)}
							className="mb-4"
						/>
						<div className="space-y-2">
							{filteredOffers.length === 0 && <div className="text-muted-foreground">No job offers found.</div>}
							{filteredOffers.map((offer: JobOffer) => (
								<Card
									key={offer.id}
									className="flex flex-col md:flex-row items-center justify-between p-4 mb-2 border bg-muted/50 cursor-pointer hover:bg-primary/10 transition"
									onClick={() => {
										if (offer.requirementId) {
											router.push(`/dashboard/candidate/application/${offer.requirementId}`);
										}
									}}
								>
									<div>
										<div className="font-semibold text-lg">{offer.title}</div>
										<div className="text-sm text-muted-foreground">{offer.company}</div>
									</div>
									<div className="flex flex-col md:items-end gap-1 mt-2 md:mt-0">
										<span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">{offer.status}</span>
										<span className="text-xs text-muted-foreground">Applied: {offer.appliedAt}</span>
										{offer.premium && <span className="text-xs text-yellow-600 font-semibold">Premium Example</span>}
									</div>
								</Card>
							))}
						</div>
					</CardContent>
				</Card>
				<Card className="col-span-1 md:col-span-2 lg:col-span-1">
					<CardHeader>
						<CardTitle>Simulate a Job Offer Process</CardTitle>
						<CardDescription>Paste a job offer link to practice a simulated hiring process powered by SamanthaAI agents.</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSimulateSubmit} className="flex flex-col gap-2">
							<Input
								placeholder="Paste job offer link..."
								value={newSimUrl}
								onChange={e => setNewSimUrl(e.target.value)}
							/>
							<button
								type="submit"
								className="bg-primary text-primary-foreground rounded px-4 py-2 font-semibold hover:bg-primary/90 transition"
							>
								Create Simulated Process
							</button>
						</form>
					</CardContent>
				</Card>
				<Card className="col-span-1 md:col-span-2 lg:col-span-2">
					<CardHeader>
						<CardTitle>Premium Practice Examples</CardTitle>
						<CardDescription>Try prebuilt premium job offer simulations to experience advanced hiring flows.</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col gap-2">
							<Card className="p-3 border bg-muted/50">
								<div className="font-semibold">Fullstack Engineer at SamanthaAI (Premium)</div>
								<div className="text-xs text-muted-foreground">Includes advanced agent interactions, multi-stage interviews, and feedback reports.</div>
							</Card>
							<Card className="p-3 border bg-muted/50">
								<div className="font-semibold">Data Scientist at OpenAI (Premium)</div>
								<div className="text-xs text-muted-foreground">Practice with real-world data challenges and AI-driven scoring.</div>
							</Card>
						</div>
					</CardContent>
				</Card>
			</div>
		</SidebarLayout>
	);
}
