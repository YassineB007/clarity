import Link from "next/link";
import styles from "./Sections.module.css";
import { getWorkStats } from "../../../../lib/work";
import { getClientStats } from "../../../../lib/clients";
import { getFinanceStats, getUserBudget } from "../../../../lib/finances";
import { getEducationStats } from "../../../../lib/education";

export default async function Overview({ userId }) {
    const [workStats, clientStats, financeStats, budget, eduStats] = await Promise.all([
        getWorkStats(userId),
        getClientStats(userId),
        getFinanceStats(userId),
        getUserBudget(userId),
        getEducationStats(userId),
    ]);

    const fmt = (amount) => {
        const num = Number(amount);
        return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
    };

    const sections = [
        {
            key: "work",
            icon: "📋",
            title: "Work",
            description: "Track projects, deadlines, and deliverables. Stay on top of every task.",
            stat: `${workStats.activeProjects} active project${workStats.activeProjects !== 1 ? "s" : ""} · ${workStats.pendingTasks} tasks pending`,
            href: "/dashboard?section=work",
        },
        {
            key: "clients",
            icon: "👥",
            title: "Clients",
            description: "Manage client info, history, and contacts all in one place.",
            stat: `${clientStats.totalClients} client${clientStats.totalClients !== 1 ? "s" : ""} · ${clientStats.withProjects} with projects`,
            href: "/dashboard?section=clients",
        },
        {
            key: "finances",
            icon: "💰",
            title: "Finances",
            description: "Track payments, expenses, and keep your finances organized.",
            stat: `${fmt(budget.currentBalance)} balance · ${fmt(financeStats.pending)} pending`,
            href: "/dashboard?section=finances",
        },
        {
            key: "education",
            icon: "📚",
            title: "Education",
            description: "Track your skills and learning progress with courses.",
            stat: `${eduStats.totalSkills} skill${eduStats.totalSkills !== 1 ? "s" : ""} · ${eduStats.inProgress} course${eduStats.inProgress !== 1 ? "s" : ""} in progress`,
            href: "/dashboard?section=education",
        },
    ];

    return (
        <div>
            <div className={styles.sectionHeader}>
                <h1 className={styles.sectionTitle}>Dashboard</h1>
                <p className={styles.sectionSubtitle}>
                    Welcome back! Here&apos;s an overview of your workspace.
                </p>
            </div>

            <div className={styles.overviewGrid}>
                {sections.map((section) => (
                    <Link
                        key={section.key}
                        href={section.href}
                        className={styles.overviewCard}
                    >
                        <div className={styles.overviewCardIcon}>{section.icon}</div>
                        <h2 className={styles.overviewCardTitle}>{section.title}</h2>
                        <p className={styles.overviewCardDescription}>
                            {section.description}
                        </p>
                        <span className={styles.overviewCardStat}>{section.stat}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
