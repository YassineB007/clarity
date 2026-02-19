import {
    getUserBudget, updateStartingBudget, getFinanceStats,
    getProjectsWithPayments, getRecentPayments, addPayment,
    getTransactions, addTransaction, deleteTransaction,
    getClientRevenue,
} from "../../../../lib/finances";
import { SubmitButton, ActionButton } from "./FormButtons";
import styles from "./Sections.module.css";

export default async function FinancesSection({ userId }) {
    const [budget, stats, projects, payments, transactions, clientRevenue] = await Promise.all([
        getUserBudget(userId),
        getFinanceStats(userId),
        getProjectsWithPayments(userId),
        getRecentPayments(userId),
        getTransactions(userId),
        getClientRevenue(userId),
    ]);

    const fmt = (amount) => {
        const num = Number(amount);
        return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
    };

    const statCards = [
        { icon: "💰", value: fmt(budget.currentBalance), label: "Current Balance" },
        { icon: "💵", value: fmt(stats.monthIncome), label: "Income This Month" },
        { icon: "💸", value: fmt(stats.totalExpenses), label: "Total Expenses" },
        { icon: "⏳", value: fmt(stats.pending), label: "Pending from Clients" },
    ];

    return (
        <div className={styles.fadeIn}>
            <div className={styles.sectionHeader}>
                <h1 className={styles.sectionTitle}>Finances</h1>
                <p className={styles.sectionSubtitle}>
                    Budget, payments, and expense tracking.
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

            {/* Set Starting Budget */}
            <div className={styles.contentCard}>
                <div className={styles.contentCardHeader}>
                    <h2 className={styles.contentCardTitle}>Starting Budget</h2>
                    <span className={styles.badge}>{fmt(budget.startingBudget)}</span>
                </div>
                <form action={updateStartingBudget} className={styles.formGrid}>
                    <input type="hidden" name="userId" value={userId} />
                    <div className={styles.formField}>
                        <label className={styles.formLabel}>Set your starting balance</label>
                        <input
                            name="budget"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={budget.startingBudget}
                            className={styles.formInput}
                        />
                    </div>
                    <div className={styles.formField}>
                        <SubmitButton pendingText="Updating...">Update Budget</SubmitButton>
                    </div>
                </form>
            </div>

            {/* Projects — Record Payments */}
            {projects.length > 0 && (
                <div className={styles.contentCard}>
                    <div className={styles.contentCardHeader}>
                        <h2 className={styles.contentCardTitle}>Project Payments</h2>
                        <span className={styles.badge}>{projects.length} projects</span>
                    </div>

                    {projects.map((project) => {
                        const remaining = Number(project.budget) - Number(project.amount_paid);
                        const pct = Number(project.budget) > 0
                            ? Math.min(100, Math.round((Number(project.amount_paid) / Number(project.budget)) * 100))
                            : 0;
                        const isPaid = remaining <= 0;

                        return (
                            <div key={project.id} className={styles.paymentEntry}>
                                <div className={styles.listItem} style={{ borderBottom: "none", padding: 0 }}>
                                    <div className={styles.listItemLeft}>
                                        <div className={`${styles.listItemIcon} ${isPaid ? styles.listItemIconGreen : styles.listItemIconOrange}`}>
                                            {isPaid ? "✅" : "💳"}
                                        </div>
                                        <div className={styles.listItemDetails}>
                                            <div className={styles.listItemTitle}>{project.name}</div>
                                            <div className={styles.listItemMeta}>
                                                {project.client_name
                                                    ? <span>🏢 {project.client_name} · </span>
                                                    : <span>👤 Personal · </span>
                                                }
                                                <span>{fmt(project.amount_paid)} / {fmt(project.budget)}</span>
                                                <span> · {pct}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.listItemRight}>
                                        <div className={styles.progressBar} style={{ width: "80px" }}>
                                            <div
                                                className={styles.progressFill}
                                                style={{
                                                    width: `${pct}%`,
                                                    backgroundColor: isPaid ? "#10b981" : "#f59e0b",
                                                }}
                                            />
                                        </div>
                                        {isPaid ? (
                                            <span className={styles.badge} style={{ backgroundColor: "#d1fae5", color: "#10b981" }}>
                                                Paid
                                            </span>
                                        ) : (
                                            <span className={`${styles.badge} ${styles.badgeWarning}`}>
                                                {fmt(remaining)} left
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Add payment form (only show if not fully paid) */}
                                {!isPaid && (
                                    <form action={addPayment} className={styles.taskForm} style={{ marginTop: "8px" }}>
                                        <input type="hidden" name="userId" value={userId} />
                                        <input type="hidden" name="projectId" value={project.id} />
                                        <input
                                            name="amount"
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            max={remaining}
                                            placeholder={`Amount (max ${fmt(remaining)})`}
                                            required
                                            className={styles.taskFormInput}
                                        />
                                        <input
                                            name="note"
                                            placeholder="Note (optional)"
                                            className={styles.taskFormInput}
                                        />
                                        <SubmitButton pendingText="Adding..." className={styles.taskFormButton}>+ Payment</SubmitButton>
                                    </form>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Recent Payments */}
            {payments.length > 0 && (
                <div className={styles.contentCard}>
                    <div className={styles.contentCardHeader}>
                        <h2 className={styles.contentCardTitle}>Recent Payments Received</h2>
                        <span className={styles.badge}>{payments.length}</span>
                    </div>

                    {payments.map((p) => (
                        <div key={p.id} className={styles.listItem}>
                            <div className={styles.listItemLeft}>
                                <div className={`${styles.listItemIcon} ${styles.listItemIconGreen}`}>💵</div>
                                <div className={styles.listItemDetails}>
                                    <div className={styles.listItemTitle}>
                                        {p.project_name || "Unknown Project"}
                                    </div>
                                    <div className={styles.listItemMeta}>
                                        {p.client_name && <span>🏢 {p.client_name} · </span>}
                                        <span>{new Date(p.created_at).toLocaleDateString()}</span>
                                        {p.note && <span> · {p.note}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className={styles.listItemRight}>
                                <span className={styles.amountPositive}>
                                    +{fmt(p.amount)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Expense Transaction */}
            <div className={styles.contentCard}>
                <div className={styles.contentCardHeader}>
                    <h2 className={styles.contentCardTitle}>Add Expense</h2>
                </div>
                <form action={addTransaction} className={styles.formGrid}>
                    <input type="hidden" name="userId" value={userId} />
                    <div className={styles.formField}>
                        <label className={styles.formLabel}>Description *</label>
                        <input name="description" placeholder="e.g. Figma subscription" required className={styles.formInput} />
                    </div>
                    <div className={styles.formField}>
                        <label className={styles.formLabel}>Amount *</label>
                        <input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required className={styles.formInput} />
                    </div>
                    <div className={styles.formField}>
                        <label className={styles.formLabel}>Category</label>
                        <select name="category" className={styles.formSelect}>
                            <option value="">None</option>
                            <option value="Software">Software</option>
                            <option value="Equipment">Equipment</option>
                            <option value="Education">Education</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Office">Office</option>
                            <option value="Travel">Travel</option>
                            <option value="Food">Food</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className={styles.formField}>
                        <SubmitButton pendingText="Adding...">+ Add Expense</SubmitButton>
                    </div>
                </form>
            </div>

            {/* Transaction History */}
            {transactions.length > 0 && (
                <div className={styles.contentCard}>
                    <div className={styles.contentCardHeader}>
                        <h2 className={styles.contentCardTitle}>Expense History</h2>
                        <span className={`${styles.badge} ${styles.badgeDanger}`}>
                            {fmt(stats.totalExpenses)} spent
                        </span>
                    </div>

                    {transactions.map((t) => (
                        <div key={t.id} className={styles.listItem}>
                            <div className={styles.listItemLeft}>
                                <div className={`${styles.listItemIcon} ${styles.listItemIconOrange}`}>💸</div>
                                <div className={styles.listItemDetails}>
                                    <div className={styles.listItemTitle}>{t.description}</div>
                                    <div className={styles.listItemMeta}>
                                        {t.category && <span>{t.category} · </span>}
                                        <span>{new Date(t.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.listItemRight}>
                                <span className={styles.amountNegative}>
                                    -{fmt(t.amount)}
                                </span>
                                <form action={deleteTransaction} style={{ display: "inline" }}>
                                    <input type="hidden" name="transactionId" value={t.id} />
                                    <input type="hidden" name="userId" value={userId} />
                                    <ActionButton className={`${styles.actionBtn} ${styles.actionBtnGhost}`}>
                                        ✕
                                    </ActionButton>
                                </form>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Client Revenue */}
            {clientRevenue.length > 0 && (
                <div className={styles.contentCard}>
                    <div className={styles.contentCardHeader}>
                        <h2 className={styles.contentCardTitle}>Revenue by Client</h2>
                    </div>

                    {clientRevenue.map((client, i) => {
                        const remaining = Number(client.totalBudget) - Number(client.totalPaid);
                        return (
                            <div key={i} className={styles.listItem}>
                                <div className={styles.listItemLeft}>
                                    <div className={`${styles.listItemIcon} ${styles.listItemIconBlue}`}>🏢</div>
                                    <div className={styles.listItemDetails}>
                                        <div className={styles.listItemTitle}>{client.name}</div>
                                        <div className={styles.listItemMeta}>
                                            {client.projects} project{client.projects !== 1 ? "s" : ""}
                                            {remaining > 0 && <span> · {fmt(remaining)} pending</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.listItemRight}>
                                    <span className={styles.amountNeutral}>
                                        {fmt(client.totalPaid)}
                                    </span>
                                    <span className={styles.badge}>received</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
