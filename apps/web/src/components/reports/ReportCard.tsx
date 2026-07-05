import type { Report } from "../../types/report";
import { StatusBadge } from "./StatusBadge";

const severityDot = {
  low: "bg-green-500",
  medium: "bg-amber-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

type Props = {
  report: Report;
  onClick: () => void;
};

export function ReportCard({ report, onClick }: Props) {
  const date = new Date(report.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full gap-3 rounded-xl border border-brand-100 bg-white p-3 text-left shadow-sm transition hover:border-accent-300 hover:shadow-md"
    >
      <img
        src={report.photoDataUrl}
        alt={report.analysis.issueType}
        className="h-16 w-16 shrink-0 rounded-lg object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-semibold text-brand-900">
            {report.analysis.issueType}
          </h3>
          <StatusBadge status={report.status} />
        </div>
        <p className="mt-0.5 truncate text-xs text-brand-500">
          {report.analysis.department.name}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${severityDot[report.analysis.severity]}`} />
          <span className="text-xs capitalize text-brand-500">{report.analysis.severity}</span>
          <span className="text-xs text-brand-400">· {date}</span>
        </div>
      </div>
    </button>
  );
}
