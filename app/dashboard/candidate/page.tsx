"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CandidateDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const stackAuthId = typeof window !== 'undefined' ? localStorage.getItem('stackAuthId') : null;
    if (!stackAuthId) {
      router.replace('/select-role');
      return;
    }
    fetch('/api/role/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stackAuthId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.role !== 'candidate') {
          if (data.role === 'team-leader') router.replace('/dashboard/team-leader');
          else router.replace('/select-role');
        }
      })
      .catch(() => router.replace('/select-role'));
  }, [router]);

  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold">Welcome, Candidate!</h1>
      <p className="mt-2">This is your dashboard.</p>
    </div>
  );
}
