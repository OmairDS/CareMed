import { prisma } from "@/lib/prisma";
import { enterLabResult, updateAppointmentStatus, raiseClaim } from "@/lib/actions";

export default async function PractitionerDashboard({ userId }: { userId: string }) {
  const practitioner = await prisma.practitioner.findUnique({
    where: { userId },
    include: { user: { include: { hospital: true } } },
  });

  if (!practitioner) {
    return <p className="text-sm">No practitioner profile linked to this account.</p>;
  }

  const [appointments, pendingLabTests, providers] = await Promise.all([
    prisma.appointment.findMany({
      where: { practitionerId: practitioner.id },
      include: {
        patient: { include: { user: true, insurance: true } },
        hospital: true,
        claim: true,
      },
      orderBy: { datetime: "asc" },
    }),
    prisma.labTest.findMany({
      where: { orderedById: practitioner.id, result: null },
      include: { appointment: { include: { patient: { include: { user: true } } } } },
    }),
    prisma.insuranceProvider.findMany(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-medium">{practitioner.user.name}</h1>
        <p className="text-sm text-navy-light/60">
          {practitioner.specialty} · {practitioner.user.hospital?.name}
        </p>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">Appointments</h2>
        <div className="space-y-3">
          {appointments.map((a) => (
            <div key={a.id} className="card space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{a.patient.user.name}</p>
                  <p className="text-sm text-navy-light/60">
                    {a.hospital.name} · {a.datetime.toDateString()}
                  </p>
                </div>
                <span className="badge bg-teal text-white">{a.status}</span>
              </div>

              {(a.status === "REQUESTED" || a.status === "CONFIRMED") && (
                <div className="flex gap-2 text-xs">
                  {a.status === "REQUESTED" && (
                    <form action={updateAppointmentStatus}>
                      <input type="hidden" name="appointmentId" value={a.id} />
                      <input type="hidden" name="status" value="CONFIRMED" />
                      <button className="btn !px-3 !py-1.5">Confirm</button>
                    </form>
                  )}
                  {a.status === "CONFIRMED" && (
                    <form action={updateAppointmentStatus}>
                      <input type="hidden" name="appointmentId" value={a.id} />
                      <input type="hidden" name="status" value="COMPLETED" />
                      <button className="btn !px-3 !py-1.5">Mark completed</button>
                    </form>
                  )}
                  <form action={updateAppointmentStatus}>
                    <input type="hidden" name="appointmentId" value={a.id} />
                    <input type="hidden" name="status" value="CANCELLED" />
                    <button className="px-3 py-1.5 rounded-md border border-red-300 text-red-600 hover:bg-red-50">
                      Cancel
                    </button>
                  </form>
                </div>
              )}

              {a.status === "COMPLETED" && !a.claim && (
                <form
                  action={raiseClaim}
                  className="border-t pt-2 flex flex-wrap gap-2 items-end"
                >
                  <input type="hidden" name="appointmentId" value={a.id} />
                  <div>
                    <label className="text-xs text-navy-light/60 block mb-1">Provider</label>
                    <select
                      name="providerId"
                      className="input w-40"
                      defaultValue={a.patient.insurance?.providerId ?? providers[0]?.id}
                    >
                      {providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-navy-light/60 block mb-1">Amount (SAR)</label>
                    <input
                      name="amount"
                      type="number"
                      step="0.01"
                      required
                      className="input w-28"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <label className="text-xs text-navy-light/60 block mb-1">Notes</label>
                    <input name="notes" className="input" placeholder="Diagnosis / justification" />
                  </div>
                  <button type="submit" className="btn !px-3 !py-1.5 text-xs">
                    Raise claim
                  </button>
                </form>
              )}

              {a.claim && (
                <div className="border-t pt-2 text-xs flex justify-between text-navy-light/60">
                  <span>Claim</span>
                  <span className="badge bg-navy text-white">
                    {a.claim.status.replaceAll("_", " ")}
                  </span>
                </div>
              )}
            </div>
          ))}
          {appointments.length === 0 && (
            <p className="text-sm text-navy-light/60">No appointments yet.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">Lab results to enter</h2>
        <div className="card">
          {pendingLabTests.length === 0 && (
            <p className="text-sm text-navy-light/60">Nothing pending.</p>
          )}
          <ul className="divide-y">
            {pendingLabTests.map((t) => (
              <li key={t.id} className="py-3 text-sm space-y-2">
                <div className="flex justify-between">
                  <span>
                    {t.testName} — {t.appointment.patient.user.name}
                  </span>
                  <span className="badge bg-gold text-navy">awaiting result</span>
                </div>
                <form action={enterLabResult} className="flex flex-wrap gap-2 items-end">
                  <input type="hidden" name="labTestId" value={t.id} />
                  <input name="value" required placeholder="Value" className="input w-24" />
                  <input name="unit" placeholder="Unit" className="input w-20" />
                  <input name="referenceRange" placeholder="Reference range" className="input w-36" />
                  <button type="submit" className="btn !px-3 !py-1.5 text-xs">
                    Save result
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
