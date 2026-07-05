import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { ReportCard } from "../components/reports/ReportCard";
import { StatusBadge, StatusPipeline } from "../components/reports/StatusBadge";
import { useReports } from "../hooks/useReports";
import { Button } from "../components/ui/Button";
import type { Report } from "../types/report";

function ReportDetail({ report, onClose }: { report: Report; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-900/40 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-900">Report details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-brand-500 hover:bg-brand-50"
          >
            Close
          </button>
        </div>

        <img
          src={report.photoDataUrl}
          alt={report.analysis.issueType}
          className="mb-4 h-48 w-full rounded-xl object-cover"
        />

        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-brand-900">{report.analysis.issueType}</h3>
          <StatusBadge status={report.status} />
        </div>

        <div className="mb-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-400">
            Status progress
          </p>
          <StatusPipeline status={report.status} />
        </div>

        <p className="mb-4 text-sm text-brand-600">{report.analysis.summary}</p>

        <div className="space-y-2 rounded-xl bg-brand-50 p-4 text-sm">
          <p>
            <span className="font-medium text-brand-700">Department:</span>{" "}
            {report.analysis.department.name}
          </p>
          <p>
            <span className="font-medium text-brand-700">Report ID:</span>{" "}
            <span className="font-mono text-xs">{report.id.slice(0, 8).toUpperCase()}</span>
          </p>
          {report.description && (
            <p>
              <span className="font-medium text-brand-700">Your note:</span> {report.description}
            </p>
          )}
          {report.location && (
            <p>
              <span className="font-medium text-brand-700">Location:</span>{" "}
              {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { reports, loading } = useReports();
  const [selected, setSelected] = useState<Report | null>(null);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
          <ClipboardList className="h-8 w-8 text-brand-400" strokeWidth={1.5} />
        </div>
        <h2 className="text-lg font-bold text-brand-900">No reports yet</h2>
        <p className="mt-2 max-w-xs text-sm text-brand-500">
          Reports you submit while signed in will appear here with live status updates.
        </p>
        <Link to="/" className="mt-6">
          <Button>Report an issue</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-brand-900">My reports</h1>
      <p className="mb-6 text-sm text-brand-500">{reports.length} report(s) on file</p>

      <div className="space-y-3">
        {reports.map((report) => (
          <ReportCard key={report.id} report={report} onClick={() => setSelected(report)} />
        ))}
      </div>

      {selected && <ReportDetail report={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
