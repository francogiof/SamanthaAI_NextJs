"use client";
import { useEffect, useState } from "react";

export function useRequirementsForCandidate(userId: number) {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch("/api/requirements")
      .then((res) => res.json())
      .then((data) => {
        if (data.requirements) {
          setRequirements(
            data.requirements.filter((r: any) => Number(r.creator_user_id) === userId)
          );
        }
      })
      .finally(() => setLoading(false));
  }, [userId]);
  return { requirements, loading };
}
