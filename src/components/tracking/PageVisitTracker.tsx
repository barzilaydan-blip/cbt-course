"use client";
import { useEffect, useRef } from "react";

export default function PageVisitTracker({ moduleId }: { moduleId: string }) {
  const visitIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const closedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    startTimeRef.current = Date.now();
    closedRef.current = false;

    fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId }),
    })
      .then((r) => r.json())
      .then((d) => { if (!cancelled) visitIdRef.current = d.visitId; })
      .catch(() => {});

    const closeVisit = () => {
      if (closedRef.current || !visitIdRef.current) return;
      closedRef.current = true;
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      const blob = new Blob(
        [JSON.stringify({ visitId: visitIdRef.current, durationSeconds: duration })],
        { type: "application/json" }
      );
      navigator.sendBeacon("/api/visits/close", blob);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") closeVisit();
    };

    window.addEventListener("beforeunload", closeVisit);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      closeVisit();
      window.removeEventListener("beforeunload", closeVisit);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [moduleId]);

  return null;
}
