import Image from "next/image";
import Link from "next/link";
import { getDemoSession, SESSION_COOKIE } from "@/lib/session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function signOut() {
  "use server";
  cookies().delete(SESSION_COOKIE);
  redirect("/login");
}

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  PRACTITIONER: "Practitioner",
  PATIENT: "Patient",
  INSURANCE_REP: "Insurance rep",
};

export default function Header() {
  const session = getDemoSession();

  return (
    <header className="bg-navy text-white">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="bg-white rounded-md p-1.5 inline-flex">
            <Image src="/logo.jpg" alt="Care Medical" width={140} height={44} priority />
          </span>
          <span className="hidden sm:inline text-sm text-gray-200">Staff &amp; patient portal</span>
        </Link>

        {session && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-200">{session.name}</span>
            <span className="badge bg-teal text-white">{roleLabels[session.role]}</span>
            <form action={signOut}>
              <button className="underline decoration-gray-400 hover:decoration-white transition">
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
