import type { AnalysisProgress, AnalysisResult } from "../../types/report";

type Props = {
  analysis: AnalysisResult | null;
  loading: boolean;
  progress: AnalysisProgress | null;
};

const severityStyles = {
  low: "bg-green-50 text-green-700 ring-green-600/20",
  medium: "bg-amber-50 text-amber-700 ring-amber-600/20",
  high: "bg-orange-50 text-orange-700 ring-orange-600/20",
  critical: "bg-red-50 text-red-700 ring-red-600/20",
};

export function AnalysisPanel({ analysis, loading, progress }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
          <p className="font-semibold text-brand-900">Analyzing photo…</p>
        </div>
        {progress && (
          <>
            <p className="mb-2 text-sm text-brand-500">{progress.stage}</p>
            <div className="h-1.5 overflow-hidden rounded-full bg-brand-100">
              <div
                className="h-full rounded-full bg-accent-600 transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </>
        )}
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-4 rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-400">
            AI detection
          </p>
          <h3 className="mt-1 text-lg font-bold text-brand-900">{analysis.issueType}</h3>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${severityStyles[analysis.severity]}`}
        >
          {analysis.severity}
        </span>
      </div>

      <p className="text-sm text-brand-600">{analysis.summary}</p>

      <div className="flex flex-wrap gap-2">
        {analysis.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-600"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-100">
          <div
            className="h-full rounded-full bg-accent-600"
            style={{ width: `${analysis.confidence}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-accent-600">
          {analysis.confidence}% confidence
        </span>
      </div>
    </div>
  );
}
