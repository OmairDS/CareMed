import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/session";

async function loginAs(formData: FormData) {
  "use server";
  const email = formData.get("email") as string;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  cookies().set(
    SESSION_COOKIE,
    JSON.stringify({ userId: user.id, role: user.role, name: user.name }),
    { httpOnly: true, path: "/", maxAge: 60 * 60 * 8 }
  );
  redirect("/dashboard");
}

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  PRACTITIONER: "Practitioner",
  PATIENT: "Patient",
  INSURANCE_REP: "Insurance rep",
};

const roleOrder = ["ADMIN", "PRACTITIONER", "PATIENT", "INSURANCE_REP"];

export default async function LoginPage() {
  let demoUsers: { id: string; name: string; email: string; role: string }[] = [];
  let dbError = false;

  try {
    demoUsers = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
    });
  } catch (e) {
    dbError = true;
  }

  demoUsers.sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-medium mb-1">Care Medical Group</h1>
      <p className="text-sm text-navy-light/70 mb-6">
        Pick a demo account to explore the platform as that role.
      </p>

      {dbError && (
        <div className="card border-red-300 text-sm">
          Couldn&apos;t reach the database yet. If you just added{" "}
          <code>DATABASE_URL</code> in Vercel, make sure the deploy finished
          rebuilding — the demo data is seeded automatically during the build.
        </div>
      )}

      {!dbError && demoUsers.length === 0 && (
        <div className="card text-sm">
          No demo accounts found yet. The seed step may still be running —
          check your latest Vercel deployment log.
        </div>
      )}

      <div className="space-y-3">
        {demoUsers.map((u) => (
          <form action={loginAs} key={u.id}>
            <input type="hidden" name="email" value={u.email} />
            <button
              type="submit"
              className="w-full card flex items-center justify-between hover:border-teal transition text-left"
            >
              <span>
                <span className="block font-medium">{u.name}</span>
                <span className="block text-xs text-navy-light/60">{u.email}</span>
              </span>
              <span className="badge bg-navy text-white">{roleLabels[u.role]}</span>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
