import { cookies } from "next/headers";

// NOTE for trainees: this is a deliberately simplified "one-click" login
// for the deploy-and-connect session, so today is about GitHub + Vercel + Neon,
// not debugging an auth library. Building a real password-checked login is
// Phase 1 of the full roadmap.

export const SESSION_COOKIE = "care_demo_session";

export type DemoSession = {
  userId: string;
  role: "ADMIN" | "PRACTITIONER" | "PATIENT" | "INSURANCE_REP";
  name: string;
};

export function getDemoSession(): DemoSession | null {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DemoSession;
  } catch {
    return null;
  }
}
