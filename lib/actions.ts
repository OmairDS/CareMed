"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

const DEMO_PASSWORD = "CareDemo123!";
let cachedHash: string | null = null;
async function demoPasswordHash() {
  if (!cachedHash) cachedHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  return cachedHash;
}

export async function addHospital(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  if (!name) return;
  await prisma.hospital.create({ data: { name, city: city || null } });
  revalidatePath("/dashboard");
}

export type ActionState = { error?: string } | null;

// Uses useFormState on the client so a duplicate email or missing field
// shows a real message instead of failing silently.
export async function addStaff(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role = formData.get("role") as "PRACTITIONER" | "INSURANCE_REP" | "ADMIN";
  const hospitalId = (formData.get("hospitalId") as string) || null;
  const specialty = ((formData.get("specialty") as string) || "General practice").trim();

  if (!name || !email || !role) {
    return { error: "Name, email, and role are required." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: `${email} is already in use by another account.` };
  }

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await demoPasswordHash(), role, hospitalId },
  });

  if (role === "PRACTITIONER") {
    await prisma.practitioner.create({ data: { userId: user.id, specialty } });
  }

  revalidatePath("/dashboard");
  revalidatePath("/login");
  return null;
}

export async function bookAppointment(formData: FormData) {
  const patientId = formData.get("patientId") as string;
  const practitionerId = formData.get("practitionerId") as string;
  const datetime = formData.get("datetime") as string;
  if (!patientId || !practitionerId || !datetime) return;

  const practitioner = await prisma.practitioner.findUnique({
    where: { id: practitionerId },
    include: { user: true },
  });
  if (!practitioner?.user.hospitalId) return;

  await prisma.appointment.create({
    data: {
      patientId,
      practitionerId,
      hospitalId: practitioner.user.hospitalId,
      datetime: new Date(datetime),
      status: "REQUESTED",
    },
  });
  revalidatePath("/dashboard");
}

export async function enterLabResult(formData: FormData) {
  const labTestId = formData.get("labTestId") as string;
  const value = (formData.get("value") as string)?.trim();
  const unit = (formData.get("unit") as string)?.trim() || null;
  const referenceRange = (formData.get("referenceRange") as string)?.trim() || null;
  if (!labTestId || !value) return;

  await prisma.labResult.create({
    data: { labTestId, value, unit, referenceRange, releasedAt: new Date() },
  });
  revalidatePath("/dashboard");
}

export async function updateAppointmentStatus(formData: FormData) {
  const appointmentId = formData.get("appointmentId") as string;
  const status = formData.get("status") as "CONFIRMED" | "COMPLETED" | "CANCELLED";
  if (!appointmentId || !status) return;
  await prisma.appointment.update({ where: { id: appointmentId }, data: { status } });
  revalidatePath("/dashboard");
}

// A completed appointment with no claim yet gets a "raise claim" form —
// this is what feeds the insurance rep's queue.
export async function raiseClaim(formData: FormData) {
  const appointmentId = formData.get("appointmentId") as string;
  const providerId = formData.get("providerId") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const notes = ((formData.get("notes") as string) || "").trim() || null;
  if (!appointmentId || !providerId || Number.isNaN(amount) || amount <= 0) return;

  await prisma.claim.create({
    data: { appointmentId, providerId, amount, status: "SUBMITTED", notes },
  });
  revalidatePath("/dashboard");
}

// Approving a claim also creates/updates the linked invoice + payment —
// this is the "claims drive financials" link described in the roadmap.
export async function reviewClaim(formData: FormData) {
  const claimId = formData.get("claimId") as string;
  const decision = formData.get("decision") as "APPROVED" | "DENIED";
  if (!claimId || !decision) return;

  const claim = await prisma.claim.update({
    where: { id: claimId },
    data: { status: decision },
  });

  if (decision === "APPROVED") {
    const invoice = await prisma.invoice.upsert({
      where: { appointmentId: claim.appointmentId },
      update: { status: "PAID" },
      create: { appointmentId: claim.appointmentId, amount: claim.amount, status: "PAID" },
    });
    await prisma.payment.create({
      data: { invoiceId: invoice.id, payerType: "insurance", amount: claim.amount },
    });
  }

  revalidatePath("/dashboard");
}
