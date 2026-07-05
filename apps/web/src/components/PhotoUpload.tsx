import { useCallback, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

type Props = {
  onPhotoSelected: (file: File, preview: string) => void;
  preview?: string;
};

export default function PhotoUpload({ onPhotoSelected, preview }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file (JPG, PNG, etc.)");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Image must be under 10 MB");
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onload = () => {
        onPhotoSelected(file, reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onPhotoSelected],
  );

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="relative overflow-hidden rounded-xl border border-brand-100">
          <img src={preview} alt="Issue preview" className="max-h-64 w-full object-cover" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-3 right-3 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-brand-700 shadow backdrop-blur"
          >
            Change photo
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files[0]);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 transition-colors ${
            dragOver
              ? "border-accent-500 bg-accent-500/5"
              : "border-brand-200 bg-white hover:border-accent-400 hover:bg-brand-50"
          }`}
        >
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <ImagePlus className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <p className="font-semibold text-brand-900">Upload a photo</p>
          <p className="mt-1 text-center text-sm text-brand-500">
            Drag and drop or tap to choose from your device
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}
