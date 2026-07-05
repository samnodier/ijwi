import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ImagePlus, SwitchCamera } from "lucide-react";
import { useReportDraft } from "../../context/ReportDraftContext";
import { Button } from "../ui/Button";

type Props = {
  onFallbackUpload?: (file: File, preview: string) => void;
};

export default function CameraCapture({ onFallbackUpload }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();
  const { setDraft } = useReportDraft();

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    stopStream();
    setReady(false);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
      }
    } catch {
      setError("Camera access unavailable. Upload a photo from your gallery instead.");
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    startCamera();
    return stopStream;
  }, [startCamera, stopStream]);

  const proceedWithPhoto = (file: File, preview: string) => {
    setDraft({ file, preview });
    onFallbackUpload?.(file, preview);
    navigate("/report");
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `report-${Date.now()}.jpg`, { type: "image/jpeg" });
        proceedWithPhoto(file, canvas.toDataURL("image/jpeg", 0.92));
      },
      "image/jpeg",
      0.92,
    );
  };

  const handleFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => proceedWithPhoto(file, reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-brand-200 bg-brand-900 shadow-lg">
      {!error ? (
        <>
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-900/60 via-transparent to-brand-900/80" />
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-brand-800 px-6 text-center">
          <Camera className="h-12 w-12 text-brand-200" strokeWidth={1.5} />
          <p className="max-w-xs text-sm text-brand-100">{error}</p>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      <div className="relative z-10 flex flex-1 flex-col justify-between p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-white/70">
            Citizen reporting
          </p>
          <h1 className="mt-1 max-w-xs text-2xl font-bold leading-tight text-white">
            Point at the issue and capture
          </h1>
          <p className="mt-2 max-w-sm text-sm text-white/80">
            Report anonymously or sign in later to track your submissions.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-8">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
              aria-label="Upload from gallery"
            >
              <ImagePlus className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={capturePhoto}
              disabled={!ready && !error}
              className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-4 border-white bg-white/20 backdrop-blur transition hover:bg-white/30 disabled:opacity-40"
              aria-label="Capture photo"
            >
              <span className="h-14 w-14 rounded-full bg-white" />
            </button>

            <button
              type="button"
              onClick={() => setFacingMode((m) => (m === "environment" ? "user" : "environment"))}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
              aria-label="Switch camera"
            >
              <SwitchCamera className="h-5 w-5" />
            </button>
          </div>

          {!error && (
            <Button
              variant="outline"
              fullWidth
              onClick={() => fileInputRef.current?.click()}
              className="border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20"
            >
              Upload from gallery
            </Button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
