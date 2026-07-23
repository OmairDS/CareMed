"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addStaff } from "@/lib/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? "Adding..." : "Add staff member"}
    </button>
  );
}

export default function AddStaffForm({
  hospitals,
}: {
  hospitals: { id: string; name: string }[];
}) {
  const [state, formAction] = useFormState(addStaff, null);

  return (
    <form action={formAction} className="card grid gap-3 sm:grid-cols-2">
      {state?.error && (
        <div className="sm:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {state.error}
        </div>
      )}
      <div>
        <label className="text-xs text-navy-light/60 block mb-1">Full name</label>
        <input name="name" required className="input" placeholder="e.g. Dr. Huda Al-Ghamdi" />
      </div>
      <div>
        <label className="text-xs text-navy-light/60 block mb-1">Email</label>
        <input name="email" type="email" required className="input" placeholder="name@caremedical.sa" />
      </div>
      <div>
        <label className="text-xs text-navy-light/60 block mb-1">Role</label>
        <select name="role" className="input">
          <option value="PRACTITIONER">Practitioner</option>
          <option value="INSURANCE_REP">Insurance rep</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-navy-light/60 block mb-1">Hospital (branch)</label>
        <select name="hospitalId" className="input">
          <option value="">— none —</option>
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs text-navy-light/60 block mb-1">
          Specialty (practitioners only)
        </label>
        <input name="specialty" className="input" placeholder="e.g. Cardiology" />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton />
      </div>
    </form>
  );
}
