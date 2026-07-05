import { Link, useLocation, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { getReport } from "../lib/storage";
import { useAuth } from "../context/AuthContext";
import type { AiInfo } from "../api/client";
import { StatusBadge } from "../components/reports/StatusBadge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

// Turn an AI category slug ("gbv", "power") into a readable label.
function formatCategory(category: string): string {
  return category
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export default function SuccessPage() {
  const { id } = useParams<{ id: string }>();
  const report = id ? getReport(id) : undefined;
  const { isAuthenticated } = useAuth();
  const routerLocation = useLocation();
  // What the integrated AI service understood the issue to be (threaded from the
  // backend create response via navigation state). This app is anonymous, so we
  // intentionally never surface which authority/number the report was routed to.
  const ai = (routerLocation.state as { ai?: AiInfo | null } | null)?.ai;

  if (!report) {
    return (
      <div className="py-16 text-center">
        <p className="text-brand-500">Report not found.</p>
        <Link to="/" className="mt-4 inline-block font-semibold text-accent-600">
          Go home
        </Link>
      </div>
    );
  }

  const reportId = report.id.slice(0, 8).toUpperCase();

  // Prefer the integrated AI service's understanding of the issue; fall back to
  // the local mock analysis when the backend/AI result isn't available (offline).
  const issueLabel = ai?.category ? formatCategory(ai.category) : report.analysis.issueType;
  const issueSummary = ai?.summary?.trim() || report.analysis.summary;

  return (
    <div className="space-y-6 py-4 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
        <CheckCircle2 className="h-9 w-9 text-green-600" strokeWidth={1.75} />
      </div>

      <div>
        <h1 className="text-xl font-bold text-brand-900">Report submitted</h1>
        <p className="mt-2 text-sm text-brand-500">
          Thank you — your report has been received and is being acted on.
        </p>
      </div>

      <Card className="text-left">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-400">Report ID</p>
          <StatusBadge status={report.status} />
        </div>
        <p className="mt-1 font-mono text-lg font-bold text-accent-600">{reportId}</p>
      </Card>

      <img
        src={report.photoDataUrl}
        alt="Submitted issue"
        className="h-40 w-full rounded-xl object-cover"
      />

      <Card className="text-left">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-400">
          What we understood
        </p>
        <p className="mt-1 text-base font-semibold text-brand-900">{issueLabel}</p>
        {issueSummary && <p className="mt-1 text-sm text-brand-600">{issueSummary}</p>}
      </Card>

      <div className="flex flex-col gap-3">
        {isAuthenticated ? (
          <Link to="/reports">
            <Button fullWidth>Track my report</Button>
          </Link>
        ) : (
          <Card padding="sm" className="text-left">
            <p className="text-sm font-medium text-brand-800">Want to track this report?</p>
            <p className="mt-1 text-xs text-brand-500">
              Create a free account to follow status updates. Save your report ID:{" "}
              <span className="font-mono font-semibold">{reportId}</span>
            </p>
            <Link to="/signup" className="mt-3 block">
              <Button fullWidth>Create account</Button>
            </Link>
          </Card>
        )}
        <Link to="/">
          <Button variant="outline" fullWidth>
            Report another issue
          </Button>
        </Link>
      </div>
    </div>
  );
}
