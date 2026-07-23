import { prisma } from "@/lib/prisma";
import StatCard from "@/components/StatCard";
import { addHospital } from "@/lib/actions";
import AddStaffForm from "@/components/forms/AddStaffForm";

export default async function AdminDashboard() {
  const [hospitals, staffCount, patientCount, appointmentCount, claims, invoices, paymentTotal] =
    await Promise.all([
      prisma.hospital.findMany({
        include: { _count: { select: { users: true, appointments: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.user.count({ where: { role: { in: ["PRACTITIONER", "ADMIN", "INSURANCE_REP"] } } }),
      prisma.user.count({ where: { role: "PATIENT" } }),
      prisma.appointment.count(),
      prisma.claim.groupBy({ by: ["status"], _count: true }),
      prisma.invoice.findMany({
        include: {
          appointment: { include: { hospital: true, patient: { include: { user: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-medium mb-4">Admin overview</h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Hospitals" value={hospitals.length} />
          <StatCard label="Staff accounts" value={staffCount} />
          <StatCard label="Patients" value={patientCount} />
          <StatCard label="Appointments" value={appointmentCount} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">Branches</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-navy-light/60 border-b">
                <th className="py-2 pr-4">Hospital</th>
                <th className="py-2 pr-4">City</th>
                <th className="py-2 pr-4">Staff + patients</th>
                <th className="py-2 pr-4">Appointments</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map((h) => (
                <tr key={h.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{h.name}</td>
                  <td className="py-2 pr-4">{h.city}</td>
                  <td className="py-2 pr-4">{h._count.users}</td>
                  <td className="py-2 pr-4">{h._count.appointments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">Claims by status</h2>
        <div className="flex flex-wrap gap-3">
          {claims.map((c) => (
            <span key={c.status} className="badge bg-navy text-white">
              {c.status.replaceAll("_", " ")}: {c._count}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">Financials</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <StatCard label="Revenue collected" value={`SAR ${(paymentTotal._sum.amount ?? 0).toFixed(2)}`} />
          <StatCard label="Invoices" value={invoices.length} />
          <StatCard label="Paid invoices" value={invoices.filter((i) => i.status === "PAID").length} />
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-navy-light/60 border-b">
                <th className="py-2 pr-4">Patient</th>
                <th className="py-2 pr-4">Branch</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{i.appointment.patient.user.name}</td>
                  <td className="py-2 pr-4">{i.appointment.hospital.name}</td>
                  <td className="py-2 pr-4">SAR {i.amount.toFixed(2)}</td>
                  <td className="py-2 pr-4">
                    <span className="badge bg-teal text-white">{i.status.replaceAll("_", " ")}</span>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-3 text-navy-light/60">
                    No invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">Add a hospital</h2>
        <form action={addHospital} className="card flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs text-navy-light/60 block mb-1">Name</label>
            <input name="name" required className="input" placeholder="e.g. Rawabi" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs text-navy-light/60 block mb-1">City</label>
            <input name="city" className="input" placeholder="e.g. Riyadh" />
          </div>
          <button type="submit" className="btn">Add hospital</button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">Add a staff member</h2>
        <AddStaffForm hospitals={hospitals} />
      </div>
    </div>
  );
}
