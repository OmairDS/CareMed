import { prisma } from "@/lib/prisma";
import { bookAppointment } from "@/lib/actions";

export default async function PatientDashboard({ userId }: { userId: string }) {
  const patient = await prisma.patient.findUnique({
    where: { userId },
    include: { user: true, insurance: { include: { provider: true } } },
  });

  if (!patient) {
    return <p className="text-sm">No patient profile linked to this account.</p>;
  }

  const practitioners = await prisma.practitioner.findMany({
    include: { user: { include: { hospital: true } } },
  });

  const appointments = await prisma.appointment.findMany({
    where: { patientId: patient.id },
    include: {
      practitioner: { include: { user: true } },
      hospital: true,
      claim: true,
      labTests: { include: { result: true } },
    },
    orderBy: { datetime: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-medium">{patient.user.name}</h1>
        {patient.insurance && (
          <p className="text-sm text-navy-light/60">
            {patient.insurance.provider.name} · Policy {patient.insurance.policyNumber}
          </p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">Book an appointment</h2>
        <form action={bookAppointment} className="card grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="patientId" value={patient.id} />
          <div>
            <label className="text-xs text-navy-light/60 block mb-1">Practitioner</label>
            <select name="practitionerId" required className="input">
              {practitioners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.user.name} — {p.specialty} ({p.user.hospital?.name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-navy-light/60 block mb-1">Date &amp; time</label>
            <input type="datetime-local" name="datetime" required className="input" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn">Request appointment</button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">My appointments</h2>
        {appointments.map((a) => (
          <div key={a.id} className="card space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{a.hospital.name}</p>
                <p className="text-sm text-navy-light/60">
                  Dr. {a.practitioner.user.name} · {a.datetime.toDateString()}
                </p>
              </div>
              <span className="badge bg-teal text-white">{a.status}</span>
            </div>

            {a.labTests.length > 0 && (
              <div className="text-sm border-t pt-2">
                <p className="font-medium text-navy-light/70 mb-1">Lab results</p>
                {a.labTests.map((t) => (
                  <p key={t.id}>
                    {t.testName}:{" "}
                    {t.result
                      ? `${t.result.value} ${t.result.unit ?? ""} (ref: ${t.result.referenceRange ?? "—"})`
                      : "not released yet"}
                  </p>
                ))}
              </div>
            )}

            {a.claim && (
              <div className="text-sm border-t pt-2 flex justify-between">
                <span className="text-navy-light/70">Insurance claim</span>
                <span className="badge bg-navy text-white">{a.claim.status.replaceAll("_", " ")}</span>
              </div>
            )}
          </div>
        ))}

        {appointments.length === 0 && (
          <p className="text-sm text-navy-light/60">No appointments yet.</p>
        )}
      </div>
    </div>
  );
}
