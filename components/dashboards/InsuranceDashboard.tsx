import { prisma } from "@/lib/prisma";
import { reviewClaim } from "@/lib/actions";

export default async function InsuranceDashboard() {
  const [claims, statusCounts] = await Promise.all([
    prisma.claim.findMany({
      include: {
        appointment: {
          include: { patient: { include: { user: true } }, hospital: true },
        },
        provider: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.claim.groupBy({ by: ["status"], _count: true }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-medium mb-4">Claims queue</h1>
        <div className="flex flex-wrap gap-3">
          {statusCounts.map((s) => (
            <span key={s.status} className="badge bg-navy text-white">
              {s.status.replaceAll("_", " ")}: {s._count}
            </span>
          ))}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-navy-light/60 border-b">
              <th className="py-2 pr-4">Patient</th>
              <th className="py-2 pr-4">Branch</th>
              <th className="py-2 pr-4">Provider</th>
              <th className="py-2 pr-4">Amount</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Notes</th>
              <th className="py-2 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => {
              const reviewable = c.status === "SUBMITTED" || c.status === "UNDER_REVIEW";
              return (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{c.appointment.patient.user.name}</td>
                  <td className="py-2 pr-4">{c.appointment.hospital.name}</td>
                  <td className="py-2 pr-4">{c.provider.name}</td>
                  <td className="py-2 pr-4">SAR {c.amount.toFixed(2)}</td>
                  <td className="py-2 pr-4">
                    <span className="badge bg-teal text-white">{c.status.replaceAll("_", " ")}</span>
                  </td>
                  <td className="py-2 pr-4 text-navy-light/60">{c.notes ?? "—"}</td>
                  <td className="py-2 pr-4">
                    {reviewable ? (
                      <div className="flex gap-2">
                        <form action={reviewClaim}>
                          <input type="hidden" name="claimId" value={c.id} />
                          <input type="hidden" name="decision" value="APPROVED" />
                          <button className="btn !px-3 !py-1.5 text-xs">Approve</button>
                        </form>
                        <form action={reviewClaim}>
                          <input type="hidden" name="claimId" value={c.id} />
                          <input type="hidden" name="decision" value="DENIED" />
                          <button className="text-xs px-3 py-1.5 rounded-md border border-red-300 text-red-600 hover:bg-red-50">
                            Deny
                          </button>
                        </form>
                      </div>
                    ) : (
                      <span className="text-navy-light/40 text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {claims.length === 0 && (
              <tr>
                <td colSpan={7} className="py-3 text-navy-light/60">
                  No claims submitted yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
