import { useCallback, useEffect, useState } from "react";
import type { Report, ReportStatus } from "../types/report";
import { useAuth } from "../context/AuthContext";
import { fetchUserReports } from "../api/reports";
import { api, type DispatchInfo } from "../api/client";
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
    async (report: Report, photoFile?: File | null): Promise<DispatchInfo | undefined> => {
      // Keep a local copy so the success screen and anonymous tracking work
      // even if the backend is unreachable.
      addReport({ ...report, anonymous: !isAuthenticated });

      // Fire the real backend pipeline: upload photo (EXIF → coordinates),
      // classify with the AI service, route to the right authority, and send
      // the alert. Returns the dispatch result so the UI can show it.
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
          dispatch = created.dispatch;
        } catch (err) {
          console.warn("[ijwi] backend submit failed, kept local copy:", err);
        }
      }

      await refresh();
      return dispatch;
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
