import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeImage } from "../lib/analyzeImage";
import type { AnalysisProgress, AnalysisResult, Report } from "../types/report";
import { useReports } from "../hooks/useReports";
import { useReportDraft } from "../context/ReportDraftContext";
import { useAuth } from "../context/AuthContext";
import PhotoUpload from "./PhotoUpload";
import LocationPicker from "./LocationPicker";
import { AnalysisPanel } from "./report/AnalysisPanel";
import { Button } from "./ui/Button";

const STEPS = ["Photo", "Details", "Review"] as const;

export default function ReportForm() {
  const navigate = useNavigate();
  const { submitReport } = useReports();
  const { draft, setDraft } = useReportDraft();
  const { isAuthenticated, user } = useAuth();

  const [step, setStep] = useState(() => (draft ? 1 : 0));
  const [photoFile, setPhotoFile] = useState<File | null>(() => draft?.file ?? null);
  const [photoPreview, setPhotoPreview] = useState<string>(() => draft?.preview ?? "");
  const [description, setDescription] = useState("");
  const [useLocation, setUseLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (draft) {
      setPhotoFile(draft.file);
      setPhotoPreview(draft.preview);
      setStep(1);
      setDraft(null);
    }
  }, [draft, setDraft]);

  const handlePhotoSelected = (file: File, preview: string) => {
    setPhotoFile(file);
    setPhotoPreview(preview);
    setAnalysis(null);
  };

  const runAnalysis = async () => {
    if (!photoFile) return;
    setLoading(true);
    setProgress(null);
    try {
      const result = await analyzeImage(photoFile, setProgress);
      setAnalysis(result);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (step === 0 && photoFile) {
      setStep(1);
    } else if (step === 1) {
      setStep(2);
      if (!analysis) await runAnalysis();
    }
  };

  const handleSubmit = async () => {
    if (!photoFile || !analysis) return;
    setSubmitting(true);
    try {
      const report: Report = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        status: "submitted",
        photoDataUrl: photoPreview,
        description: description.trim() || undefined,
        location: useLocation && location ? location : undefined,
        analysis,
        userId: user?.id,
        anonymous: !isAuthenticated,
      };
      // The backend returns the integrated AI service's classification; pass it
      // to the success screen. Routing/authority is dispatched silently on the
      // backend and is intentionally never shown to the anonymous citizen.
      const { ai } = await submitReport(report, photoFile);
      navigate(`/success/${report.id}`, { state: { ai } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                i <= step ? "bg-accent-600 text-white" : "bg-brand-100 text-brand-400"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-xs ${i <= step ? "font-semibold text-accent-600" : "text-brand-400"}`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div>
          <h2 className="mb-1 text-lg font-bold text-brand-900">Add a photo</h2>
          <p className="mb-4 text-sm text-brand-500">
            Capture or upload a picture of the issue in your community.
          </p>
          <PhotoUpload onPhotoSelected={handlePhotoSelected} preview={photoPreview || undefined} />
        </div>
      )}

      {step === 1 && (
        <div>
          <h2 className="mb-1 text-lg font-bold text-brand-900">Add details</h2>
          <p className="mb-4 text-sm text-brand-500">
            Optional — help authorities understand the situation.
          </p>

          {photoPreview && (
            <img
              src={photoPreview}
              alt="Captured issue"
              className="mb-4 h-36 w-full rounded-xl object-cover"
            />
          )}

          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-medium text-brand-700">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe what happened, when you noticed it, and any safety concerns…"
              className="w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
          </label>

          <LocationPicker
            enabled={useLocation}
            location={location}
            loading={locationLoading}
            error={locationError}
            onEnabledChange={setUseLocation}
            onLocationChange={setLocation}
            onLoadingChange={setLocationLoading}
            onErrorChange={setLocationError}
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-brand-900">Review & submit</h2>

          {photoPreview && (
            <img src={photoPreview} alt="Issue" className="h-40 w-full rounded-xl object-cover" />
          )}

          <AnalysisPanel analysis={analysis} loading={loading} progress={progress} />

          {description && (
            <div className="rounded-xl border border-brand-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-brand-400">Your note</p>
              <p className="mt-1 text-sm text-brand-700">{description}</p>
            </div>
          )}

          {!isAuthenticated && (
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-600">
              Submitting anonymously. Sign in after submission to track this report on any device.
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        {step > 0 && (
          <Button variant="outline" fullWidth onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
        {step < 2 ? (
          <Button fullWidth onClick={handleContinue} disabled={step === 0 && !photoFile}>
            Continue
          </Button>
        ) : (
          <Button fullWidth onClick={handleSubmit} disabled={!analysis || loading || submitting}>
            {submitting ? "Submitting…" : "Submit report"}
          </Button>
        )}
      </div>
    </div>
  );
}
