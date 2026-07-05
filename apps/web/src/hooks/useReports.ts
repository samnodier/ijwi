import { useCallback, useEffect, useState } from "react";
import type { Report, ReportStatus } from "../types/report";
import { useAuth } from "../context/AuthContext";
import { fetchUserReports, fetchAllReports } from "../api/reports";
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
      photoFiles: File[] = [],
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
      if (photoFiles.length > 0) {
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
            photoFiles,
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
    async (id: string, status: ReportStatus) => {
      if (isAuthenticated) {
        try {
          let backendStatus: "pending" | "in_progress" | "resolved" | "rejected" = "pending";
          if (status === "in_progress") backendStatus = "in_progress";
          else if (status === "resolved") backendStatus = "resolved";
          await api.updateReportStatus(id, backendStatus);
        } catch (err) {
          console.warn("[ijwi] backend status update failed:", err);
        }
      }
      updateReportStatus(id, status);
      await refresh();
    },
    [isAuthenticated, refresh],
  );

  const updateReport = useCallback(
    async (
      id: string,
      fields: {
        title?: string | null;
        description?: string;
        category?: string | null;
        location?: { lat: number; lng: number } | null;
      },
    ) => {
      if (isAuthenticated) {
        try {
          await api.updateReport(id, fields);
        } catch (err) {
          console.warn("[ijwi] backend update failed:", err);
        }
      }
      await refresh();
    },
    [isAuthenticated, refresh],
  );

  const deleteReport = useCallback(
    async (id: string) => {
      if (isAuthenticated) {
        try {
          await api.deleteReport(id);
        } catch (err) {
          console.warn("[ijwi] backend delete failed:", err);
        }
      }
      await refresh();
    },
    [isAuthenticated, refresh],
  );

  return { reports, submitReport, setStatus, updateReport, deleteReport, refresh, loading };
}

export function usePublicReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllReports();
      setReports(data);
    } catch (err) {
      console.warn("[ijwi] Failed to fetch public reports:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { reports, refresh, loading };
}
