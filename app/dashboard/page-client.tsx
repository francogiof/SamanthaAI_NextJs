"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";

export function PageClient() {
  const router = useRouter();
  const user = useUser({ or: "redirect" });
  const [teamDisplayName, setTeamDisplayName] = React.useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    user.createTeam({ displayName: teamDisplayName });
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <div className="max-w-xs w-full">
        <h1 className="text-center text-2xl font-semibold">Welcome!</h1>
        <p className="text-center text-gray-500">
          Create a team to get started
        </p>
        <form className="mt-4" onSubmit={handleSubmit}>
          <div>
            <Label className="text-sm">Team name</Label>
            <Input
              placeholder="Team name"
              value={teamDisplayName}
              onChange={(e) => setTeamDisplayName(e.target.value)}
            />
          </div>
          <Button className="mt-4 w-full">Create team</Button>
        </form>
      </div>
    </div>
  );
}
