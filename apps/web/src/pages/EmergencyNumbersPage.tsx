import { useEffect, useState } from "react";
import { Phone, PhoneCall } from "lucide-react";
import { apiFetch, type EmergencyNumber } from "../api/client";
import { Card } from "../components/ui/Card";

export default function EmergencyNumbersPage() {
  const [numbers, setNumbers] = useState<EmergencyNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiFetch<EmergencyNumber[]>("/emergency-numbers")
      .then((data) => {
        if (active) setNumbers(data);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load numbers");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const grouped = numbers.reduce<Record<string, EmergencyNumber[]>>((acc, n) => {
    const key = n.category || "Other";
    (acc[key] ??= []).push(n);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-brand-900">Emergency numbers</h1>
      <p className="mb-6 text-sm text-brand-500">
        Tap a number to call the relevant authority directly.
      </p>

      {loading && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
        </div>
      )}

      {error && !loading && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {!loading && !error && numbers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
            <Phone className="h-8 w-8 text-brand-400" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-brand-500">No emergency numbers available yet.</p>
        </div>
      )}

      {!loading && !error && numbers.length > 0 && (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <section key={category}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-400">
                {category}
              </h2>
              <div className="space-y-3">
                {items.map((n) => (
                  <a key={n.id} href={`tel:${n.number}`} className="block">
                    <Card className="flex items-center justify-between transition hover:border-accent-300 hover:shadow">
                      <div>
                        <p className="font-semibold text-brand-900">{n.name}</p>
                        <p className="mt-0.5 font-mono text-sm text-brand-600">{n.number}</p>
                      </div>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-50 text-accent-600">
                        <PhoneCall className="h-5 w-5" strokeWidth={1.75} />
                      </span>
                    </Card>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
