import { getCurrentUser, logout } from "../../../lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "./components/Sidebar";
import Overview from "./components/Overview";
import WorkSection from "./components/WorkSection";
import ClientsSection from "./components/ClientsSection";
import FinancesSection from "./components/FinancesSection";
import EducationSection from "./components/EducationSection";
import styles from "./Dashboard.module.css";

const SECTIONS = {
  work: WorkSection,
  clients: ClientsSection,
  finances: FinancesSection,
  education: EducationSection,
};

export default async function DashboardPage({ searchParams }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  const params = await searchParams;
  const sectionKey = params?.section || "overview";
  const SectionComponent = SECTIONS[sectionKey] || Overview;

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar currentSection={sectionKey} />
      <main className={styles.mainContent}>
        <SectionComponent userId={user.userId} />
      </main>
    </div>
  );
}
