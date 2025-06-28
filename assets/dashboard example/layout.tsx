'use client';

import SidebarLayout, { SidebarItem } from "@/components/sidebar-layout";
import { BadgePercent, BarChart4, Columns3, Globe, Locate, Settings2, ShoppingBag, ShoppingCart, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

const navigationItems: SidebarItem[] = [
	{
		name: "Overview",
		href: "/",
		icon: Globe,
		type: "item",
	},
	{
		type: "label",
		name: "Management",
	},
	{
		name: "Products",
		href: "/products",
		icon: ShoppingBag,
		type: "item",
	},
	{
		name: "People",
		href: "/people",
		icon: Users,
		type: "item",
	},
	{
		name: "Segments",
		href: "/segments",
		icon: Columns3,
		type: "item",
	},
	{
		name: "Regions",
		href: "/regions",
		icon: Locate,
		type: "item",
	},
	{
		type: "label",
		name: "Monetization",
	},
	{
		name: "Revenue",
		href: "/revenue",
		icon: BarChart4,
		type: "item",
	},
	{
		name: "Orders",
		href: "/orders",
		icon: ShoppingCart,
		type: "item",
	},
	{
		name: "Discounts",
		href: "/discounts",
		icon: BadgePercent,
		type: "item",
	},
	{
		type: "label",
		name: "Settings",
	},
	{
		name: "Configuration",
		href: "/configuration",
		icon: Settings2,
		type: "item",
	},
];

export default function Layout(props: { children: React.ReactNode }) {
	const params = useParams<{ teamId: string }>();
	const router = useRouter();

	// Remove all logic using useUser, SelectedTeamSwitcher, and team. Add placeholder for your new auth/team logic if needed.

	return (
		<SidebarLayout
			items={navigationItems}
			basePath={`/dashboard/${params.teamId}`}
			// sidebarTop={<SelectedTeamSwitcher 
			// 	selectedTeam={team}
			// 	urlMap={(team) => `/dashboard/${team.id}`}
			// />}
			baseBreadcrumb={[
				{
					title: "Team Display Name", // Placeholder, replace with actual team display name
					href: `/dashboard/${params.teamId}`,
				},
			]}
		>
			{props.children}
		</SidebarLayout>
	);
}