import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Plus, Search, Trash2, Edit3, X, Check } from "lucide-react";
import { ReportCard } from "../components/reports/ReportCard";
import { StatusBadge, StatusPipeline } from "../components/reports/StatusBadge";
import { useReports } from "../hooks/useReports";
import { Button } from "../components/ui/Button";
import type { Report } from "../types/report";

export function ReportDetail({
  report,
  onClose,
  onUpdate,
  onDelete,
  onStatusChange,
}: {
  report: Report;
  onClose: () => void;
  onUpdate?: (id: string, fields: { description: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onStatusChange?: (id: string, status: any) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(report.description || "");
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSaveDescription = async () => {
    if (!onUpdate) return;
    setUpdating(true);
    try {
      await onUpdate(report.id, { description: editedDescription });
      setIsEditing(false);
    } catch (err) {
      alert("Failed to update report notes.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!window.confirm("Are you sure you want to permanently delete this report? This action cannot be undone.")) {
      return;
    }
    setDeleting(true);
    try {
      await onDelete(report.id);
      onClose();
    } catch (err) {
      alert("Failed to delete report.");
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!onStatusChange) return;
    try {
      await onStatusChange(report.id, e.target.value);
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-900/40 p-4 backdrop-blur-sm sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-brand-100 animate-in fade-in-50 zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-900">Report details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50 hover:text-brand-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mb-4 h-48 w-full overflow-hidden rounded-xl border border-brand-100">
          <img
            src={report.photoDataUrl}
            alt={report.analysis.issueType}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-brand-900 text-base">{report.analysis.issueType}</h3>
            <p className="text-xs text-brand-400">ID: {report.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-brand-500">Status:</span>
            {onStatusChange ? (
              <select
                value={report.status}
                onChange={handleStatusChange}
                className="rounded-lg border border-brand-200 bg-white px-2 py-1 text-xs font-semibold text-brand-700 shadow-sm focus:border-accent-500 focus:outline-none"
              >
                <option value="submitted">Submitted</option>
                <option value="received">Received</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            ) : (
              <StatusBadge status={report.status} />
            )}
          </div>
        </div>

        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-400">
            Pipeline progress
          </p>
          <StatusPipeline status={report.status} />
        </div>

        <div className="mb-5 rounded-xl border border-brand-100 bg-brand-50/50 p-4 text-sm text-brand-700">
          <p className="font-semibold text-brand-800 mb-1">AI Classification Result:</p>
          <p className="text-brand-600 leading-relaxed">{report.analysis.summary}</p>
        </div>

        <div className="mb-5 rounded-xl border border-brand-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-400">
              Your note / comments
            </span>
            {!isEditing ? (
              onUpdate && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-accent-600 hover:text-accent-700"
                >
                  <Edit3 className="h-3 w-3" /> Edit note
                </button>
              )
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveDescription}
                  disabled={updating}
                  className="flex items-center gap-1 text-xs font-bold text-green-600 hover:text-green-700 disabled:opacity-50"
                >
                  <Check className="h-3 w-3" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedDescription(report.description || "");
                  }}
                  className="text-xs font-semibold text-brand-500 hover:text-brand-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-brand-200 p-2 text-sm focus:border-accent-500 focus:outline-none"
            />
          ) : (
            <p className="text-sm text-brand-700 italic">
              {report.description || "No custom note added."}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-brand-100">
          {onDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting..." : "Delete report"}
            </button>
          ) : (
            <div />
          )}

          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { reports, loading, updateReport, deleteReport, setStatus } = useReports();
  const [selected, setSelected] = useState<Report | null>(null);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.analysis.issueType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.analysis.summary || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || report.status === statusFilter;

    const matchesCategory =
      categoryFilter === "all" ||
      (report.analysis.tags?.[0] || "").toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with New Report button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-900">My reports</h1>
          <p className="text-sm text-brand-500">
            {filteredReports.length} of {reports.length} report(s) on file
          </p>
        </div>
        <Link to="/">
          <Button className="flex items-center gap-1 shadow-sm">
            <Plus className="h-4 w-4" /> New Report
          </Button>
        </Link>
      </div>

      {reports.length === 0 ? (
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
      ) : (
        <>
          {/* Search and Filters panel */}
          <div className="grid gap-3 rounded-xl border border-brand-100 bg-white p-4 shadow-sm sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-brand-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-700 focus:border-accent-500 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="received">Received</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-700 focus:border-accent-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="flood">Flood</option>
                <option value="accident">Accident</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="medical">Medical</option>
                <option value="fire">Fire</option>
                <option value="crime">Crime</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Reports list */}
          {filteredReports.length === 0 ? (
            <div className="rounded-xl border border-dashed border-brand-200 py-12 text-center">
              <p className="text-sm text-brand-500">No reports matched your filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onClick={() => setSelected(report)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {selected && (
        <ReportDetail
          report={selected}
          onClose={() => setSelected(null)}
          onUpdate={async (id, fields) => {
            await updateReport(id, fields);
            setSelected((prev) => (prev ? { ...prev, ...fields } : null));
          }}
          onDelete={async (id) => {
            await deleteReport(id);
          }}
          onStatusChange={async (id, status) => {
            await setStatus(id, status);
            setSelected((prev) => (prev ? { ...prev, status } : null));
          }}
        />
      )}
    </div>
  );
}
