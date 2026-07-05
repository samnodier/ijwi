export type GeoCoords = {
  lat: number;
  lng: number;
};

export type GeoResult =
  | { ok: true; coords: GeoCoords }
  | { ok: false; message: string };

function mapGeoError(code: number): string {
  switch (code) {
    case 1:
      return "Location permission denied. Allow location access in your browser settings, then try again.";
    case 2:
      return "Location unavailable. Check that location services are enabled on your device.";
    case 3:
      return "Location request timed out. Please try again.";
    default:
      return "Could not get your location. You can still submit without it.";
  }
}

export function requestCurrentLocation(): Promise<GeoResult> {
  if (!window.isSecureContext) {
    return Promise.resolve({
      ok: false,
      message: "Location requires a secure connection (HTTPS). Use localhost or HTTPS to enable it.",
    });
  }

  if (!navigator.geolocation) {
    return Promise.resolve({
      ok: false,
      message: "Geolocation is not supported on this device.",
    });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          ok: true,
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        });
      },
      (error) => resolve({ ok: false, message: mapGeoError(error.code) }),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  });
}
