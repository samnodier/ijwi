import { useCallback, useEffect, useState } from "react";
import type { Report, ReportStatus } from "../types/report";
import { useAuth } from "../context/AuthContext";
import { fetchUserReports } from "../api/reports";
import { api, type AiInfo, type DispatchInfo } from "../api/client";
import { addReport, updateReportStatus } from "../lib/storage";

export function useReports() {
  const { isAuthenticated } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const data = await fetchUserReports();
        setReports(data);
      } else {
        setReports([]);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submitReport = useCallback(
    async (
      report: Report,
      photoFile?: File | null,
    ): Promise<{ ai?: AiInfo | null; dispatch?: DispatchInfo }> => {
      // Keep a local copy so the success screen and anonymous tracking work
      // even if the backend is unreachable.
      addReport({ ...report, anonymous: !isAuthenticated });

      // Fire the real backend pipeline: upload photo (EXIF → coordinates),
      // classify with the integrated AI service, route to the right authority,
      // and send the alert. Returns the AI classification (shown to the citizen)
      // and the dispatch result (used internally, not displayed).
      let ai: AiInfo | null | undefined;
      let dispatch: DispatchInfo | undefined;
      if (photoFile) {
        try {
          const created = await api.createReport(
            {
              description:
                report.description?.trim() ||
                report.analysis.summary ||
                report.analysis.issueType,
              category: report.analysis.tags?.[0] ?? report.analysis.issueType,
              location: report.location,
            },
            [photoFile],
          );
          ai = created.ai;
          dispatch = created.dispatch;
        } catch (err) {
          console.warn("[ijwi] backend submit failed, kept local copy:", err);
        }
      }

      await refresh();
      return { ai, dispatch };
    },
    [isAuthenticated, refresh],
  );

  const setStatus = useCallback(
    (id: string, status: ReportStatus) => {
      updateReportStatus(id, status);
      refresh();
    },
    [refresh],
  );

  return { reports, submitReport, setStatus, refresh, loading };
}
