"use client";

import SidebarLayout, { SidebarItem } from "@/components/sidebar-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BarChart4, Users, Globe, ShoppingBag, Columns3, Locate } from "lucide-react";
import { useState } from "react";

const navigationItems: SidebarItem[] = [
	{
		name: "Overview",
		href: "/dashboard/team-leader",
		icon: Globe,
		type: "item",
	},
	{
		type: "label",
		name: "Management",
	},
	{
		name: "Candidates",
		href: "/dashboard/team-leader/candidates",
		icon: Users,
		type: "item",
	},
	{
		name: "Jobs",
		href: "/dashboard/team-leader/jobs",
		icon: ShoppingBag,
		type: "item",
	},
	{
		name: "Segments",
		href: "/dashboard/team-leader/segments",
		icon: Columns3,
		type: "item",
	},
	{
		name: "Regions",
		href: "/dashboard/team-leader/regions",
		icon: Locate,
		type: "item",
	},
	{
		type: "label",
		name: "Analytics",
	},
	{
		name: "Reports",
		href: "/dashboard/team-leader/reports",
		icon: BarChart4,
		type: "item",
	},
];

export default function TeamLeaderDashboard() {
	// Example state for search/filter
	const [search, setSearch] = useState("");

	return (
		<SidebarLayout items={navigationItems} basePath="/dashboard/team-leader">
			<div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Candidate Search</CardTitle>
						<CardDescription>
							Find candidates by name, skill, or status.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Input
							placeholder="Search candidates..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</CardContent>
				</Card>
				{/* Add more cards/widgets here as needed */}
			</div>
		</SidebarLayout>
	);
}
