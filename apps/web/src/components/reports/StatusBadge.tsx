import type { ReportStatus } from "../../types/report";

const statusConfig: Record<ReportStatus, { label: string; className: string }> = {
  submitted: { label: "Submitted", className: "bg-blue-50 text-blue-700 ring-blue-600/20" },
  received: { label: "Received", className: "bg-indigo-50 text-indigo-700 ring-indigo-600/20" },
  in_progress: { label: "In progress", className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  resolved: { label: "Resolved", className: "bg-green-50 text-green-700 ring-green-600/20" },
};

type Props = {
  status: ReportStatus;
};

export function StatusBadge({ status }: Props) {
  const config = statusConfig[status];
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export function StatusPipeline({ status }: Props) {
  const steps: ReportStatus[] = ["submitted", "received", "in_progress", "resolved"];
  const currentIndex = steps.indexOf(status);

  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={s} className="flex flex-1 flex-col items-center gap-1">
          <div
            className={`h-1.5 w-full rounded-full ${
              i <= currentIndex ? "bg-accent-600" : "bg-brand-100"
            }`}
          />
        </div>
      ))}
    </div>
  );
}
