import Link from "next/link";
import { logout } from "../../../../lib/auth";
import styles from "./Sidebar.module.css";

export default function Sidebar({ currentSection }) {
    const navItems = [
        { key: "overview", label: "Overview", icon: "📊", href: "/dashboard" },
        { key: "work", label: "Work", icon: "📋", href: "/dashboard?section=work" },
        { key: "clients", label: "Clients", icon: "👥", href: "/dashboard?section=clients" },
        { key: "finances", label: "Finances", icon: "💰", href: "/dashboard?section=finances" },
        { key: "education", label: "Education", icon: "📚", href: "/dashboard?section=education" },
    ];

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                Clari.<span className={styles.logoAccent}>ty</span>
            </div>

            <nav className={styles.nav}>
                {navItems.map((item) => (
                    <Link
                        key={item.key}
                        href={item.href}
                        className={`${styles.navItem} ${currentSection === item.key ? styles.navItemActive : ""
                            }`}
                    >
                        <span className={styles.navIcon}>{item.icon}</span>
                        <span className={styles.navLabel}>{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className={styles.spacer} />

            <form action={logout} className={styles.logoutForm}>
                <button type="submit" className={styles.logoutButton}>
                    <span className={styles.navIcon}>🚪</span>
                    <span className={styles.logoutLabel}>Logout</span>
                </button>
            </form>
        </aside>
    );
}
