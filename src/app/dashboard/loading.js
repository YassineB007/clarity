import Sidebar from "./components/Sidebar";
import SectionSkeleton from "./components/SectionSkeleton";
import styles from "./Dashboard.module.css";

export default function DashboardLoading() {
    return (
        <div className={styles.dashboardLayout}>
            <Sidebar currentSection="overview" />
            <main className={styles.mainContent}>
                <SectionSkeleton />
            </main>
        </div>
    );
}
