// Runs automatically on every Vercel deploy (see package.json "build" script).
// Safe to run repeatedly: skips seeding if hospitals already exist.

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const DEMO_PASSWORD = "CareDemo123!";

async function main() {
  const existing = await prisma.hospital.count();
  if (existing > 0) {
    console.log("Seed skipped — data already exists.");
    return;
  }

  console.log("Seeding Care Medical Group demo data...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const [rawabi, malaz, balad, harm, jewar] = await Promise.all(
    [
      { name: "Rawabi", city: "Riyadh" },
      { name: "Malaz", city: "Riyadh" },
      { name: "Balad", city: "Jeddah" },
      { name: "Harm", city: "Makkah" },
      { name: "Jewar", city: "Dammam" },
    ].map((h) => prisma.hospital.create({ data: h }))
  );

  const provider = await prisma.insuranceProvider.create({
    data: { name: "Gulf Shield Insurance" },
  });

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@caremedical.sa",
      passwordHash,
      role: "ADMIN",
    },
  });

  const drSaraUser = await prisma.user.create({
    data: {
      name: "Dr. Sara Al-Harbi",
      email: "dr.sara@caremedical.sa",
      passwordHash,
      role: "PRACTITIONER",
      hospitalId: rawabi.id,
    },
  });
  const drSara = await prisma.practitioner.create({
    data: { userId: drSaraUser.id, specialty: "Internal Medicine" },
  });

  const drKhalidUser = await prisma.user.create({
    data: {
      name: "Dr. Khalid Al-Otaibi",
      email: "dr.khalid@caremedical.sa",
      passwordHash,
      role: "PRACTITIONER",
      hospitalId: balad.id,
    },
  });
  const drKhalid = await prisma.practitioner.create({
    data: { userId: drKhalidUser.id, specialty: "Family Medicine" },
  });

  const omarUser = await prisma.user.create({
    data: {
      name: "Omar Al-Qahtani",
      email: "patient.omar@caremedical.sa",
      passwordHash,
      role: "PATIENT",
      hospitalId: rawabi.id,
    },
  });
  const omar = await prisma.patient.create({
    data: {
      userId: omarUser.id,
      dateOfBirth: new Date("1990-04-12"),
      nationalId: "1000000001",
    },
  });
  await prisma.patientInsurance.create({
    data: { patientId: omar.id, providerId: provider.id, policyNumber: "GSI-88213" },
  });

  const noufUser = await prisma.user.create({
    data: {
      name: "Nouf Al-Dosari",
      email: "patient.nouf@caremedical.sa",
      passwordHash,
      role: "PATIENT",
      hospitalId: balad.id,
    },
  });
  const nouf = await prisma.patient.create({
    data: {
      userId: noufUser.id,
      dateOfBirth: new Date("1985-09-02"),
      nationalId: "1000000002",
    },
  });
  await prisma.patientInsurance.create({
    data: { patientId: nouf.id, providerId: provider.id, policyNumber: "GSI-77410" },
  });

  await prisma.user.create({
    data: {
      name: "Laila Al-Zahrani",
      email: "rep.laila@caremedical.sa",
      passwordHash,
      role: "INSURANCE_REP",
    },
  });

  // --- Appointment 1: completed, with a released lab result and an approved claim ---
  const appt1 = await prisma.appointment.create({
    data: {
      patientId: omar.id,
      practitionerId: drSara.id,
      hospitalId: rawabi.id,
      datetime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: "COMPLETED",
    },
  });
  const labTest1 = await prisma.labTest.create({
    data: {
      appointmentId: appt1.id,
      testName: "Fasting Blood Glucose",
      orderedById: drSara.id,
    },
  });
  await prisma.labResult.create({
    data: {
      labTestId: labTest1.id,
      value: "94",
      unit: "mg/dL",
      referenceRange: "70-99 mg/dL",
      releasedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });
  const claim1 = await prisma.claim.create({
    data: {
      appointmentId: appt1.id,
      providerId: provider.id,
      amount: 420.0,
      status: "APPROVED",
      notes: "Routine check-up, approved in full.",
    },
  });
  const invoice1 = await prisma.invoice.create({
    data: { appointmentId: appt1.id, amount: 420.0, status: "PAID" },
  });
  await prisma.payment.create({
    data: { invoiceId: invoice1.id, payerType: "insurance", amount: 420.0 },
  });

  // --- Appointment 2: completed, claim awaiting insurance review ---
  const appt2 = await prisma.appointment.create({
    data: {
      patientId: nouf.id,
      practitionerId: drKhalid.id,
      hospitalId: balad.id,
      datetime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: "COMPLETED",
    },
  });
  const labTest2 = await prisma.labTest.create({
    data: {
      appointmentId: appt2.id,
      testName: "Complete Blood Count",
      orderedById: drKhalid.id,
    },
  });
  // No result yet — shows up as "pending" on the practitioner dashboard
  await prisma.claim.create({
    data: {
      appointmentId: appt2.id,
      providerId: provider.id,
      amount: 610.0,
      status: "UNDER_REVIEW",
      notes: "Awaiting review of attached diagnosis.",
    },
  });
  await prisma.invoice.create({
    data: { appointmentId: appt2.id, amount: 610.0, status: "PENDING" },
  });

  // --- Appointment 3: upcoming, confirmed ---
  await prisma.appointment.create({
    data: {
      patientId: omar.id,
      practitionerId: drSara.id,
      hospitalId: rawabi.id,
      datetime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: "CONFIRMED",
    },
  });

  // --- Appointment 4: just requested — demonstrates Confirm / Cancel ---
  await prisma.appointment.create({
    data: {
      patientId: omar.id,
      practitionerId: drSara.id,
      hospitalId: rawabi.id,
      datetime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: "REQUESTED",
    },
  });

  // --- Appointment 5: completed, no claim yet — demonstrates "Raise claim" ---
  await prisma.appointment.create({
    data: {
      patientId: nouf.id,
      practitionerId: drKhalid.id,
      hospitalId: balad.id,
      datetime: new Date(Date.now() - 6 * 60 * 60 * 1000),
      status: "COMPLETED",
    },
  });

  console.log("Seed complete. Demo accounts (password for all: " + DEMO_PASSWORD + "):");
  console.log("  admin@caremedical.sa");
  console.log("  dr.sara@caremedical.sa / dr.khalid@caremedical.sa");
  console.log("  patient.omar@caremedical.sa / patient.nouf@caremedical.sa");
  console.log("  rep.laila@caremedical.sa");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
