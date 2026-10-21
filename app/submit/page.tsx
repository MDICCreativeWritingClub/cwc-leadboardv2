"use client";

import { useAuth } from "@/context/AuthContext";
import { colors } from "@/lib/theme";
import { SubmitPage } from "@/components/SubmitPage";

/**
 * Gate wrapper for /submit. components/SubmitPage.tsx (the actual form)
 * is completely untouched -- this file only waits for the visitor's
 * (silent, account-less) identity to be ready before rendering it. There's
 * no login to gate on anymore -- submitting is open to everyone.
 */
export default function SubmitPageGate() {
  const { identity, loading } = useAuth();

  if (loading) return null;

  if (!identity) {
    return (
      <div className="max-w-md mx-auto px-5 py-24 text-center">
        <h1 style={{ fontFamily: "var(--font-display)", color: colors.heading, fontSize: "1.4rem", fontWeight: 700 }}>
          Something went wrong
        </h1>
        <p className="mt-3" style={{ color: colors.gray400, fontSize: "0.88rem" }}>
          Couldn&apos;t set things up for submitting -- please refresh the page and try again.
        </p>
      </div>
    );
  }

  return <SubmitPage />;
}
