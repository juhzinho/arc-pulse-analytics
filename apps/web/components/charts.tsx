"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from "recharts";
import { Card } from "./ui/card";
import { formatDate, formatNumber } from "@/lib/utils";

export function TpsChart({ data }: { data: Array<{ bucketStart: string; value: number }> }) {
  return (
    <Card className="rounded-[24px]">
      <div className="chrome-line mb-4 pb-4">
        <p className="eyebrow text-cyan">Throughput</p>
        <h3 className="mt-2 text-[1.38rem] font-semibold tracking-[-0.04em] text-ink">TPS per minute</h3>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="tpsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#127681" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#127681" stopOpacity={0.06} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--chart-grid))" />
            <XAxis dataKey="bucketStart" tickFormatter={formatDate} tick={{ fill: "rgb(var(--chart-text))", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgb(var(--chart-text))", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "rgba(9, 15, 27, 0.96)",
                border: "1px solid rgba(148,163,184,0.16)",
                borderRadius: "16px",
                color: "#e2e8f0"
              }}
              formatter={(value: number) => formatNumber(value)}
              labelFormatter={formatDate}
            />
            <Area type="monotone" dataKey="value" stroke="#22c7b8" fill="url(#tpsFill)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function GasChart({ data }: { data: Array<{ bucketStart: string; value: number }> }) {
  return (
    <Card className="rounded-[24px]">
      <div className="chrome-line mb-4 pb-4">
        <p className="eyebrow text-pulse">Consumption</p>
        <h3 className="mt-2 text-[1.38rem] font-semibold tracking-[-0.04em] text-ink">Gas used per hour</h3>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--chart-grid))" />
            <XAxis dataKey="bucketStart" tickFormatter={formatDate} tick={{ fill: "rgb(var(--chart-text))", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgb(var(--chart-text))", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "rgba(9, 15, 27, 0.96)",
                border: "1px solid rgba(148,163,184,0.16)",
                borderRadius: "16px",
                color: "#e2e8f0"
              }}
              formatter={(value: number) => formatNumber(value)}
              labelFormatter={formatDate}
            />
            <Bar dataKey="value" fill="#ff7a18" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
