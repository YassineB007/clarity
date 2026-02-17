import { getClients, getClientStats, addClient, deleteClient } from "../../../../lib/clients";
import styles from "./Sections.module.css";

export default async function ClientsSection({ userId }) {
    const [clients, stats] = await Promise.all([
        getClients(userId),
        getClientStats(userId),
    ]);

    const statCards = [
        { icon: "👥", value: stats.totalClients, label: "Total Clients" },
        { icon: "📋", value: stats.withProjects, label: "With Active Projects" },
    ];

    return (
        <div>
            <div className={styles.sectionHeader}>
                <h1 className={styles.sectionTitle}>Clients</h1>
                <p className={styles.sectionSubtitle}>
                    Manage your client relationships and contacts.
                </p>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
                {statCards.map((stat, i) => (
                    <div key={i} className={styles.statCard}>
                        <div className={styles.statIcon}>{stat.icon}</div>
                        <div className={styles.statValue}>{stat.value}</div>
                        <div className={styles.statLabel}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Add Client Form */}
            <div className={styles.contentCard}>
                <div className={styles.contentCardHeader}>
                    <h2 className={styles.contentCardTitle}>Add New Client</h2>
                </div>
                <form action={addClient} className={styles.formGrid}>
                    <input type="hidden" name="userId" value={userId} />
                    <div className={styles.formField}>
                        <label className={styles.formLabel}>Name *</label>
                        <input name="name" placeholder="Client name" required className={styles.formInput} />
                    </div>
                    <div className={styles.formField}>
                        <label className={styles.formLabel}>Email</label>
                        <input name="email" type="email" placeholder="email@example.com" className={styles.formInput} />
                    </div>
                    <div className={styles.formField}>
                        <label className={styles.formLabel}>Phone</label>
                        <input name="phone" placeholder="+1 234 567 890" className={styles.formInput} />
                    </div>
                    <div className={styles.formField}>
                        <label className={styles.formLabel}>Company</label>
                        <input name="company" placeholder="Company name" className={styles.formInput} />
                    </div>
                    <div className={styles.formField}>
                        <button type="submit" className={styles.formButton}>+ Add Client</button>
                    </div>
                </form>
            </div>

            {/* Client Directory */}
            {clients.length === 0 ? (
                <div className={styles.contentCard}>
                    <div className={styles.emptyState}>
                        <div className={styles.emptyStateIcon}>👥</div>
                        <div className={styles.emptyStateText}>
                            No clients yet. Add your first client above!
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.contentCard}>
                    <div className={styles.contentCardHeader}>
                        <h2 className={styles.contentCardTitle}>Client Directory</h2>
                        <span className={styles.badge}>{clients.length} clients</span>
                    </div>

                    {clients.map((client) => (
                        <div key={client.id} className={styles.listItem}>
                            <div className={styles.listItemLeft}>
                                <div className={`${styles.listItemIcon} ${styles.listItemIconGreen}`}>
                                    🏢
                                </div>
                                <div className={styles.listItemDetails}>
                                    <div className={styles.listItemTitle}>{client.name}</div>
                                    <div className={styles.listItemMeta}>
                                        {client.company && <span>{client.company} · </span>}
                                        {client.email && <span>{client.email} · </span>}
                                        {client.phone && <span>{client.phone}</span>}
                                        {!client.company && !client.email && !client.phone && (
                                            <span>No contact info</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className={styles.listItemRight}>
                                <form action={deleteClient} style={{ display: "inline" }}>
                                    <input type="hidden" name="clientId" value={client.id} />
                                    <input type="hidden" name="userId" value={userId} />
                                    <button
                                        type="submit"
                                        title="Delete client"
                                        className={`${styles.actionBtn} ${styles.actionBtnGhost}`}
                                    >
                                        🗑️
                                    </button>
                                </form>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
