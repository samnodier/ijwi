import { DEPARTMENTS } from "../../lib/mockAi";
import type { Department } from "../../types/report";

type Props = {
  department: Department;
  onDepartmentChange?: (departmentId: string) => void;
  editable?: boolean;
};

export function DepartmentCard({ department, onDepartmentChange, editable }: Props) {
  return (
    <div className="rounded-xl border border-accent-500/20 bg-accent-500/5 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-accent-600">
        Routed to
      </p>

      {editable && onDepartmentChange ? (
        <select
          value={department.id}
          onChange={(e) => onDepartmentChange(e.target.value)}
          className="mt-2 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm font-semibold text-brand-900"
        >
          {DEPARTMENTS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      ) : (
        <h3 className="mt-1 text-lg font-bold text-brand-900">{department.name}</h3>
      )}

      <div className="mt-3 space-y-1.5 text-sm text-brand-600">
        <p>
          <span className="font-medium text-brand-700">Contact:</span> {department.contact}
        </p>
        <p>
          <span className="font-medium text-brand-700">Est. response:</span>{" "}
          {department.responseTime}
        </p>
      </div>

      {editable && (
        <p className="mt-3 text-xs text-brand-500">
          Wrong department? Select the correct one above before submitting.
        </p>
      )}
    </div>
  );
}
