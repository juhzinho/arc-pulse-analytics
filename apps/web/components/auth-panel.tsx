"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");

  async function requestLink() {
    const response = await fetch(`${API_URL}/v1/auth/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error?.message ?? "Unable to request magic link");
      return;
    }

    if (payload.data.token) {
      setToken(payload.data.token);
      setMessage("Dev token generated. Verify it below to create a session.");
      return;
    }

    setMessage("Magic link requested.");
  }

  async function verifyLink() {
    const response = await fetch(`${API_URL}/v1/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token })
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error?.message ?? "Unable to verify token");
      return;
    }

    localStorage.setItem("arc-pulse-token", payload.data.token);
    setMessage(`Signed in as ${payload.data.user.email}`);
  }

  return (
    <Card className="space-y-4 rounded-[24px]">
      <div>
        <p className="eyebrow text-cyan">Authentication</p>
        <h3 className="mt-2 text-[1.3rem] font-semibold tracking-[-0.03em]">Magic link session</h3>
      </div>
      <Input placeholder="analyst@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" onClick={requestLink}>Request link</Button>
        <Button type="button" variant="outline" onClick={verifyLink}>Verify token</Button>
      </div>
      <Input placeholder="Paste dev token or emailed token" value={token} onChange={(event) => setToken(event.target.value)} />
      <p className="text-[0.98rem] text-ink/60">{message}</p>
    </Card>
  );
}
