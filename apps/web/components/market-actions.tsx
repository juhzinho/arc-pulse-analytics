"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function MarketActions({ marketId, type }: { marketId: string; type: "binary" | "range" }) {
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");

  async function submitPrediction(payload: Record<string, unknown>) {
    const token = localStorage.getItem("arc-pulse-token");
    if (!token) {
      setMessage("Sign in first.");
      return;
    }

    const response = await fetch(`${API_URL}/v1/markets/${marketId}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const json = await response.json();
    setMessage(response.ok ? "Prediction submitted." : (json.error?.message ?? "Prediction failed"));
  }

  if (type === "binary") {
    return (
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={() => submitPrediction({ choice: "YES" })}>Predict Yes</Button>
          <Button type="button" variant="outline" onClick={() => submitPrediction({ choice: "NO" })}>Predict No</Button>
        </div>
        <p className="text-[0.98rem] text-ink/60">{message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Predicted value" />
        <Button type="button" onClick={() => submitPrediction({ value: Number(value) })}>Submit</Button>
      </div>
      <p className="text-[0.98rem] text-ink/60">{message}</p>
    </div>
  );
}
