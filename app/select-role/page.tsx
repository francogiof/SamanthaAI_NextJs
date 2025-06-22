"use client";
import { useState } from "react";

export default function SelectRolePage() {
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Get stackAuthId from session/user context (replace with your actual logic)
  // For demo, use a placeholder
  const stackAuthId = typeof window !== 'undefined' ? localStorage.getItem('stackAuthId') : null;

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
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Select Your Role</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2 font-medium">Role</label>
          <select
            className="w-full border rounded p-2"
            value={role}
            onChange={e => setRole(e.target.value)}
            required
          >
            <option value="">-- Select --</option>
            <option value="candidate">Candidate</option>
            <option value="team-leader">Team Leader</option>
          </select>
        </div>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Saving..." : "Continue"}
        </button>
        {success && <div className="text-green-600 mt-2">Role assigned! Redirecting...</div>}
      </form>
    </div>
  );
}
