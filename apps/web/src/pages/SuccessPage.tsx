import { Link, useLocation, useParams } from "react-router-dom";
import { CheckCircle2, PhoneCall } from "lucide-react";
import { getReport } from "../lib/storage";
import { useAuth } from "../context/AuthContext";
import type { DispatchInfo } from "../api/client";
import { DepartmentCard } from "../components/report/DepartmentCard";
import { StatusBadge } from "../components/reports/StatusBadge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

export default function SuccessPage() {
  const { id } = useParams<{ id: string }>();
  const report = id ? getReport(id) : undefined;
  const { isAuthenticated } = useAuth();
  const routerLocation = useLocation();
  const dispatch = (routerLocation.state as { dispatch?: DispatchInfo } | null)?.dispatch;

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

  return (
    <div className="space-y-6 py-4 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
        <CheckCircle2 className="h-9 w-9 text-green-600" strokeWidth={1.75} />
      </div>

      <div>
        <h1 className="text-xl font-bold text-brand-900">Report submitted</h1>
        <p className="mt-2 text-sm text-brand-500">
          Your issue has been routed to the appropriate authority.
        </p>
      </div>

      <Card className="text-left">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-400">Report ID</p>
          <StatusBadge status={report.status} />
        </div>
        <p className="mt-1 font-mono text-lg font-bold text-accent-600">{reportId}</p>
        <p className="mt-2 text-sm text-brand-600">{report.analysis.issueType}</p>
      </Card>

      <img
        src={report.photoDataUrl}
        alt="Submitted issue"
        className="h-40 w-full rounded-xl object-cover"
      />

      {dispatch ? (
        // Authoritative routing: the real authority the backend dispatched to.
        <Card className="text-left">
          <div className="flex items-center gap-2">
            <PhoneCall className="h-4 w-4 text-accent-600" />
            <p className="text-xs font-medium uppercase tracking-wide text-brand-400">
              Alert dispatched
            </p>
          </div>
          <p className="mt-2 text-center text-lg font-bold text-brand-900">
            {dispatch.authorityName}
          </p>
          <p className="text-center text-sm text-brand-600">
            Contact: <span className="font-mono">{dispatch.number}</span> · {dispatch.reason}
          </p>
          <p className="mt-3 border-t border-brand-100 pt-2 text-xs text-brand-500">
            {dispatch.channel === "log"
              ? "Message logged (no SMS provider configured yet)."
              : dispatch.delivered
                ? `Sent via ${dispatch.channel} to ${dispatch.deliveredTo}.`
                : `Delivery to ${dispatch.deliveredTo} failed — check provider settings.`}
          </p>
        </Card>
      ) : (
        <DepartmentCard department={report.analysis.department} />
      )}

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
