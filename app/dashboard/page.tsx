import { redirect } from "next/navigation";
import { getDemoSession } from "@/lib/session";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import PractitionerDashboard from "@/components/dashboards/PractitionerDashboard";
import PatientDashboard from "@/components/dashboards/PatientDashboard";
import InsuranceDashboard from "@/components/dashboards/InsuranceDashboard";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const session = getDemoSession();
  if (!session) redirect("/login");

  switch (session.role) {
    case "ADMIN":
      return <AdminDashboard />;
    case "PRACTITIONER":
      return <PractitionerDashboard userId={session.userId} />;
    case "PATIENT":
      return <PatientDashboard userId={session.userId} />;
    case "INSURANCE_REP":
      return <InsuranceDashboard />;
    default:
      redirect("/login");
  }
}
