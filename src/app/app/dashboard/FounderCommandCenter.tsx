"use client";

import { useState } from "react";
import Link from "next/link";
import { SEVERITY_BADGE, type EscalationSeverity } from "@/lib/escalations/constants";
import type { FounderDashboardData } from "@/lib/dashboard/data";

const TABS = ["Overview", "Risk", "Revenue", "Activity"] as const;
type Tab = (typeof TABS)[number];

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function FounderCommandCenter({ data }: { data: FounderDashboardData }) {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div className="max-w-[1180px]">
      <div className="mb-6">
        <h1 className="text-[26px] font-bold tracking-tight">Founder Command Center</h1>
        <p className="text-[13px] text-text-secondary">Overview across every active client relationship.</p>
      </div>

      <div className="mb-6 flex gap-1 border-b border-border-default">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-t-lg px-3 py-2 text-[13px] font-medium ${
              tab === t ? "text-accent-primary" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <>
          <KpiRow data={data} />
          <div className="mt-5 grid grid-cols-2 gap-4">
            <RiskPanel risks={data.risks.slice(0, 4)} />
            <ActivityPanel activity={data.activity.slice(0, 5)} />
          </div>
        </>
      )}

      {tab === "Risk" && <RiskPanel risks={data.risks} full />}

      {tab === "Revenue" && (
        <div>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Pipeline Value" value={money(data.pipelineValue)} />
            <StatCard label="Payments Overdue" value={money(data.paymentsOverdue)} sub={`${data.paymentsOverdueCount} invoice(s)`} />
            <StatCard label="Active Projects" value={String(data.activeProjects)} />
          </div>
          <div className="mt-4 flex gap-4 text-xs">
            <Link href="/app/analytics/revenue" className="font-semibold text-accent-primary">
              Revenue breakdown →
            </Link>
            <Link href="/app/analytics/conversion" className="font-semibold text-accent-primary">
              Conversion funnel →
            </Link>
            <Link href="/app/analytics/performance" className="font-semibold text-accent-primary">
              POC performance →
            </Link>
          </div>
        </div>
      )}

      {tab === "Activity" && <ActivityPanel activity={data.activity} full />}
    </div>
  );
}

function KpiRow({ data }: { data: FounderDashboardData }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      <StatCard label="Active Projects" value={String(data.activeProjects)} />
      <StatCard label="Pipeline Value" value={money(data.pipelineValue)} />
      <StatCard label="Payments Overdue" value={money(data.paymentsOverdue)} sub={`${data.paymentsOverdueCount} invoice(s)`} />
      <StatCard
        label="Open Escalations"
        value={String(data.openEscalations)}
        sub={data.highSeverityCount > 0 ? `${data.highSeverityCount} high severity` : undefined}
      />
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[var(--radius-default)] border border-border-default bg-bg-card p-4">
      <div className="text-xs text-text-secondary">{label}</div>
      <div className="mt-2 text-2xl font-bold font-data">{value}</div>
      {sub && <div className="mt-1.5 text-[11.5px] font-medium font-data text-text-secondary">{sub}</div>}
    </div>
  );
}

function RiskPanel({ risks, full }: { risks: FounderDashboardData["risks"]; full?: boolean }) {
  return (
    <div className="rounded-[var(--radius-default)] border border-border-default bg-bg-card">
      <div className="flex items-center justify-between p-4 pb-0">
        <p className="text-[15px] font-bold">Risk Alerts</p>
        <Link href="/app/escalations" className="text-xs font-semibold text-accent-primary">
          View escalation center →
        </Link>
      </div>
      <div className="mt-2">
        {risks.map((r) => (
          <div key={r.id} className="flex items-center gap-3 border-t border-border-default px-4 py-3 first:border-t-0">
            <span
              className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-bold font-data ${
                SEVERITY_BADGE[r.severity as EscalationSeverity] ?? SEVERITY_BADGE.low
              }`}
            >
              {r.severity}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">{r.title}</div>
              {r.subtitle && <div className="truncate text-[11.5px] text-text-secondary">{r.subtitle}</div>}
            </div>
          </div>
        ))}
        {risks.length === 0 && <div className="p-6 text-center text-sm text-text-secondary">No open escalations.</div>}
      </div>
    </div>
  );
}

function ActivityPanel({ activity, full }: { activity: FounderDashboardData["activity"]; full?: boolean }) {
  return (
    <div className="rounded-[var(--radius-default)] border border-border-default bg-bg-card">
      <div className="p-4 pb-0">
        <p className="text-[15px] font-bold">Activity</p>
      </div>
      <div className="mt-2">
        {activity.map((a) => (
          <div key={a.id} className="flex gap-2.5 border-t border-border-default px-4 py-3 first:border-t-0">
            <div className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-accent-primary" />
            <div>
              <div className="text-[12.5px] capitalize">{a.text}</div>
              <div className="mt-0.5 font-data text-[11px] text-text-secondary">{timeAgo(a.createdAt)}</div>
            </div>
          </div>
        ))}
        {activity.length === 0 && <div className="p-6 text-center text-sm text-text-secondary">No recent activity.</div>}
      </div>
    </div>
  );
}
