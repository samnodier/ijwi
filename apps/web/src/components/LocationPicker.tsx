import { useCallback } from "react";
import { Loader2, MapPin } from "lucide-react";
import type { GeoCoords } from "../lib/geolocation";
import { requestCurrentLocation } from "../lib/geolocation";

type Props = {
  enabled: boolean;
  location: GeoCoords | null;
  loading: boolean;
  error: string | null;
  onEnabledChange: (enabled: boolean) => void;
  onLocationChange: (coords: GeoCoords | null) => void;
  onLoadingChange: (loading: boolean) => void;
  onErrorChange: (error: string | null) => void;
};

export default function LocationPicker({
  enabled,
  location,
  loading,
  error,
  onEnabledChange,
  onLocationChange,
  onLoadingChange,
  onErrorChange,
}: Props) {
  const fetchLocation = useCallback(async () => {
    onLoadingChange(true);
    onErrorChange(null);

    const result = await requestCurrentLocation();

    onLoadingChange(false);

    if (result.ok) {
      onLocationChange(result.coords);
      onErrorChange(null);
    } else {
      onLocationChange(null);
      onEnabledChange(false);
      onErrorChange(result.message);
    }
  }, [onEnabledChange, onErrorChange, onLoadingChange, onLocationChange]);

  const handleToggle = async (checked: boolean) => {
    onEnabledChange(checked);
    onErrorChange(null);

    if (checked) {
      await fetchLocation();
    } else {
      onLocationChange(null);
      onLoadingChange(false);
    }
  };

  return (
    <div className="rounded-xl border border-brand-100 bg-white p-4 shadow-sm">
      <label className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <MapPin className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-medium text-brand-900">Include my location</p>
            <p className="text-xs text-brand-500">Helps authorities find the issue faster</p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={enabled}
          disabled={loading}
          onChange={(e) => void handleToggle(e.target.checked)}
          className="h-5 w-5 shrink-0 rounded border-brand-300 text-accent-600 focus:ring-accent-500/20 disabled:opacity-50"
        />
      </label>

      {loading && (
        <div className="mt-3 flex items-center gap-2 text-xs text-brand-600">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Getting your location…
        </div>
      )}

      {location && enabled && !loading && (
        <p className="mt-3 text-xs text-green-700">
          Location captured ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
        </p>
      )}

      {error && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-amber-700">{error}</p>
          {!enabled && (
            <button
              type="button"
              onClick={() => void handleToggle(true)}
              className="text-xs font-semibold text-accent-600 hover:underline"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
