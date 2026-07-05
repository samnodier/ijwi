import { useState } from "react";
import { Search } from "lucide-react";
import CameraCapture from "../components/camera/CameraCapture";
import { StatusBadge } from "../components/reports/StatusBadge";
import { ReportDetail } from "./ReportsPage";
import { usePublicReports } from "../hooks/useReports";
import type { Report } from "../types/report";

function PublicReportCard({ report, onClick }: { report: Report; onClick: () => void }) {
  const date = new Date(report.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const severityColor = {
    low: "text-green-600 bg-green-50 border-green-100",
    medium: "text-amber-600 bg-amber-50 border-amber-100",
    high: "text-orange-600 bg-orange-50 border-orange-100",
    critical: "text-red-600 bg-red-50 border-red-100",
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition hover:border-accent-300 hover:shadow-md text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-500/20"
    >
      <div className="relative h-40 w-full bg-brand-50 border-b border-brand-50">
        <img
          src={report.photoDataUrl}
          alt={report.analysis.issueType}
          className="h-full w-full object-cover"
        />
        <div className="absolute top-2.5 right-2.5">
          <StatusBadge status={report.status} />
        </div>
      </div>
      
      <div className="flex flex-1 flex-col p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-brand-900 line-clamp-1">
            {report.analysis.issueType}
          </h3>
        </div>
        
        <p className="text-xs font-semibold text-accent-600">
          Dispatched: {report.analysis.department.name}
        </p>
        
        <p className="text-xs text-brand-600 line-clamp-2 italic flex-1">
          {report.description || report.analysis.summary}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-brand-50 text-[10px]">
          <span className={`px-2 py-0.5 rounded-full border ${severityColor[report.analysis.severity]} font-semibold capitalize`}>
            {report.analysis.severity}
          </span>
          <span className="text-brand-400 font-medium">{date}</span>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { reports: publicReports, loading } = usePublicReports();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredReports = publicReports.filter((report) => {
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

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Camera Capture / Report Issue box at the top */}
      <CameraCapture />

      {/* 2. Public Feed Section */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-bold text-brand-900">Community Feed</h2>
            <p className="text-xs text-brand-500">Live anonymous reports in your area</p>
          </div>
          <p className="text-xs text-brand-400 font-medium">
            {filteredReports.length} of {publicReports.length} report(s)
          </p>
        </div>

        {publicReports.length > 0 && (
          /* Search and Filters panel */
          <div className="grid gap-3 rounded-xl border border-brand-100 bg-white p-4 shadow-sm sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-400" />
              <input
                type="text"
                placeholder="Search community feed..."
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
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
          </div>
        ) : publicReports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-brand-200 py-12 text-center text-sm text-brand-500">
            No public reports submitted yet. Be the first to report!
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-brand-200 py-12 text-center text-sm text-brand-500">
            No reports match your search criteria.
          </div>
        ) : (
          /* Cards Grid Layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredReports.map((report) => (
              <PublicReportCard
                key={report.id}
                report={report}
                onClick={() => setSelectedReport(report)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. Detail View Modal (Read-Only) */}
      {selectedReport && (
        <ReportDetail
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}
