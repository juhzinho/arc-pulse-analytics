"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/api";
import { Card } from "@/components/ui/card";

function VerifyAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Verifying your sign-in link...");

  useEffect(() => {
    const email = searchParams.get("email");
    const token = searchParams.get("token");

    if (!email || !token) {
      setMessage("Missing verification parameters.");
      return;
    }

    fetch(`${API_URL}/v1/auth/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, token })
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error?.message ?? "Unable to verify login");
        }

        localStorage.setItem("arc-pulse-token", payload.data.token);
        setMessage(`Signed in as ${payload.data.user.email}. Redirecting...`);
        setTimeout(() => router.replace("/forecasts"), 1200);
      })
      .catch((error: Error) => {
        setMessage(error.message);
      });
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="max-w-lg">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-cyan">Magic Link</p>
        <h1 className="mt-3 text-2xl font-semibold">Sign-in verification</h1>
        <p className="mt-4 text-sm text-ink/65">{message}</p>
      </Card>
    </div>
  );
}

export default function VerifyAuthPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[70vh] items-center justify-center">
        <Card className="max-w-lg">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-cyan">Magic Link</p>
          <h1 className="mt-3 text-2xl font-semibold">Sign-in verification</h1>
          <p className="mt-4 text-sm text-ink/65">Preparing secure sign-in...</p>
        </Card>
      </div>
    }>
      <VerifyAuthContent />
    </Suspense>
  );
}
