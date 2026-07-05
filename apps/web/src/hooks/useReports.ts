import { useCallback, useEffect, useState } from "react";
import { api, type CreateReportInput, type Report } from "../api/client";

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReports(await api.listReports());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createReport = useCallback(
    async (input: CreateReportInput) => {
      const report = await api.createReport(input);
      await refresh();
      return report;
    },
    [refresh],
  );

  return { reports, loading, error, refresh, createReport };
}
