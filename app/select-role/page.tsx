"use client";
import { useState, useEffect } from "react";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";

export default function SelectRolePage() {
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    // Always sync stackAuthId to localStorage for dashboard pages
    if (user?.id) {
      localStorage.setItem('stackAuthId', user.id);
    }
    // Check if user already has a role and redirect if so
    async function checkRole() {
      if (!user?.id) return;
      try {
        const res = await fetch("/api/role/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stackAuthId: user.id }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.role === "candidate") router.replace("/dashboard/candidate");
          else if (data.role === "team-leader") router.replace("/dashboard/team-leader");
        }
      } catch {}
    }
    checkRole();
    console.log("Stack Auth user:", user);
  }, [user, router]);

  const stackAuthId = user?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    if (!role) {
      setError("Please select a role.");
      setLoading(false);
      return;
    }
    if (!stackAuthId) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/role/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stackAuthId, role }),
      });
      if (!res.ok) throw new Error("Failed to assign role");
      setSuccess(true);
      // Redirect to dashboard based on role
      window.location.href = role === "candidate" ? "/dashboard/candidate" : "/dashboard/team-leader";
    } catch (err) {
      setError("Failed to assign role.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="container max-w-lg mx-auto flex flex-1 items-center justify-center">
        <div className="w-full rounded-xl shadow bg-card text-card-foreground p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">Select your role</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="role">Role</label>
              <select
                id="role"
                className="w-full p-2 border rounded bg-background text-foreground"
                value={role}
                onChange={e => setRole(e.target.value)}
                required
              >
                <option value="">Select a role</option>
                <option value="candidate">Candidate</option>
                <option value="team-leader">Team Leader</option>
              </select>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground p-2 rounded hover:bg-primary/90 transition"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
