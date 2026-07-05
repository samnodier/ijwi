import { useCallback, useEffect, useState } from "react";
import type { Report, ReportStatus } from "../types/report";
import { useAuth } from "../context/AuthContext";
import { fetchUserReports, submitAnonymousReport, submitReportToApi } from "../api/reports";
import { updateReportStatus } from "../lib/storage";

export function useReports() {
  const { isAuthenticated, user } = useAuth();
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
    async (report: Report) => {
      if (isAuthenticated) {
        await submitReportToApi({ ...report, userId: user?.id, anonymous: false });
      } else {
        submitAnonymousReport(report);
      }
      await refresh();
    },
    [isAuthenticated, user?.id, refresh],
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
