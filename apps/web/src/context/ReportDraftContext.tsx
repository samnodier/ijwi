import { createContext, useContext, useState, type ReactNode } from "react";
import type { ReportDraft } from "../types/report";

type ReportDraftContextValue = {
  draft: ReportDraft | null;
  setDraft: (draft: ReportDraft | null) => void;
};

const ReportDraftContext = createContext<ReportDraftContextValue | null>(null);

export function ReportDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<ReportDraft | null>(null);
  return (
    <ReportDraftContext.Provider value={{ draft, setDraft }}>
      {children}
    </ReportDraftContext.Provider>
  );
}

export function useReportDraft() {
  const ctx = useContext(ReportDraftContext);
  if (!ctx) throw new Error("useReportDraft must be used within ReportDraftProvider");
  return ctx;
}
