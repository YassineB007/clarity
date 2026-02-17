import styles from "./components/Sections.module.css";

export default function DashboardLoading() {
    return (
        <div className={styles.fadeIn}>
            {/* Skeleton Header */}
            <div className={styles.skeletonHeader}>
                <div className={styles.skeletonTitle}></div>
                <div className={styles.skeletonSubtitle}></div>
            </div>

            {/* Skeleton Stats */}
            <div className={styles.skeletonStatsGrid}>
                {[...Array(4)].map((_, i) => (
                    <div key={i} className={styles.skeletonStatCard}>
                        <div className={styles.skeletonStatIcon}></div>
                        <div className={styles.skeletonStatValue}></div>
                        <div className={styles.skeletonStatLabel}></div>
                    </div>
                ))}
            </div>

            {/* Skeleton Content Cards */}
            {[...Array(2)].map((_, i) => (
                <div key={i} className={styles.skeletonContentCard}>
                    <div className={styles.skeletonCardTitle}></div>
                    {[...Array(3)].map((_, j) => (
                        <div key={j} className={styles.skeletonRow}>
                            <div className={styles.skeletonAvatar}></div>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                                <div className={styles.skeletonLine} style={{ width: `${60 + j * 10}%` }}></div>
                                <div className={styles.skeletonLineShort}></div>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
