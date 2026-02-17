import Link from "next/link";
import { getProjectsWithTasks, getWorkStats, addProject, addTask, toggleTask, deleteTask, deleteProject } from "../../../../lib/work";
import { getClients } from "../../../../lib/clients";
import styles from "./Sections.module.css";

export default async function WorkSection({ userId }) {
    const [projects, stats, clients] = await Promise.all([
        getProjectsWithTasks(userId),
        getWorkStats(userId),
        getClients(userId),
    ]);

    const statCards = [
        { icon: "🚀", value: stats.activeProjects, label: "Active Projects" },
        { icon: "✅", value: stats.completedTasks, label: "Tasks Completed" },
        { icon: "⏳", value: stats.pendingTasks, label: "Tasks Pending" },
        { icon: "📅", value: stats.dueThisWeek, label: "Due This Week" },
    ];

    const statusLabels = {
        not_started: "Not Started",
        in_progress: "In Progress",
        on_hold: "On Hold",
        completed: "Completed",
    };

    const statusBadge = {
        not_started: "badgeWarning",
        in_progress: "",
        on_hold: "badgeDanger",
        completed: "",
    };

    const priorityColors = {
        low: "#94a3b8",
        medium: "#f59e0b",
        high: "#f97316",
        urgent: "#ef4444",
    };

    return (
        <div className={styles.fadeIn}>
            <div className={styles.sectionHeader}>
                <h1 className={styles.sectionTitle}>Work</h1>
                <p className={styles.sectionSubtitle}>
                    Track your projects, tasks, and deadlines.
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

            {/* Add Project Form */}
            <div className={styles.contentCard}>
                <div className={styles.contentCardHeader}>
                    <h2 className={styles.contentCardTitle}>Add New Project</h2>
                </div>
                <form action={addProject} className={styles.formGrid}>
                    <input type="hidden" name="userId" value={userId} />
                    <div className={styles.formField}>
                        <label className={styles.formLabel}>Project Name *</label>
                        <input name="name" placeholder="e.g. Website Redesign" required className={styles.formInput} />
                    </div>
                    <div className={styles.formField}>
                        <label className={styles.formLabel}>Client</label>
                        <div className={styles.formRow}>
                            <select name="clientId" className={styles.formSelect}>
                                <option value="personal">👤 Personal</option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                        🏢 {client.name}
                                    </option>
                                ))}
                            </select>
                            <Link href="/dashboard?section=clients" title="Add a new client" className={styles.formLink}>
                                +
                            </Link>
                        </div>
                    </div>
                    <div className={styles.formField}>
                        <label className={styles.formLabel}>Due Date</label>
                        <input name="dueDate" type="date" className={styles.formInput} />
                    </div>
                    <div className={styles.formField}>
                        <label className={styles.formLabel}>Budget ($)</label>
                        <input name="budget" type="number" min="0" step="0.01" placeholder="0.00" className={styles.formInput} />
                    </div>
                    <div className={styles.formField}>
                        <button type="submit" className={styles.formButton}>+ Add Project</button>
                    </div>
                </form>
            </div>

            {/* Projects with Tasks */}
            {projects.length === 0 ? (
                <div className={styles.contentCard}>
                    <div className={styles.emptyState}>
                        <div className={styles.emptyStateIcon}>📋</div>
                        <div className={styles.emptyStateText}>
                            No projects yet. Create your first project above!
                        </div>
                    </div>
                </div>
            ) : (
                projects.map((project) => (
                    <div key={project.id} className={styles.contentCard}>
                        {/* Project Header */}
                        <div className={styles.contentCardHeader}>
                            <div>
                                <h2 className={styles.contentCardTitle}>{project.name}</h2>
                                <div className={styles.listItemMeta} style={{ marginTop: "2px" }}>
                                    {project.client_name
                                        ? <span>🏢 {project.client_name} · </span>
                                        : <span>👤 Personal · </span>
                                    }
                                    {project.due_date && (
                                        <span>Due {new Date(project.due_date).toLocaleDateString()} · </span>
                                    )}
                                    <span>{project.progress}% complete</span>
                                    {Number(project.budget) > 0 && (
                                        <span> · ${Number(project.budget).toLocaleString()}</span>
                                    )}
                                </div>
                            </div>
                            <div className={styles.listItemRight}>
                                <div className={styles.progressBar} style={{ width: "100px" }}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${project.progress}%` }}
                                    />
                                </div>
                                <span
                                    className={`${styles.badge} ${statusBadge[project.status] ? styles[statusBadge[project.status]] : ""}`}
                                >
                                    {statusLabels[project.status]}
                                </span>
                                <form action={deleteProject} style={{ display: "inline" }}>
                                    <input type="hidden" name="projectId" value={project.id} />
                                    <input type="hidden" name="userId" value={userId} />
                                    <button
                                        type="submit"
                                        title="Delete project"
                                        className={`${styles.actionBtn} ${styles.actionBtnGhost}`}
                                    >
                                        🗑️
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Tasks List */}
                        {project.tasks.map((task) => (
                            <div key={task.id} className={styles.listItem}>
                                <div className={styles.listItemLeft}>
                                    <form action={toggleTask}>
                                        <input type="hidden" name="taskId" value={task.id} />
                                        <input type="hidden" name="projectId" value={project.id} />
                                        <input type="hidden" name="userId" value={userId} />
                                        <button
                                            type="submit"
                                            style={{
                                                width: "22px",
                                                height: "22px",
                                                borderRadius: "5px",
                                                border: task.status === "done"
                                                    ? "2px solid #10b981"
                                                    : "2px solid #d0cdc7",
                                                background: task.status === "done" ? "#10b981" : "transparent",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "11px",
                                                color: "#fff",
                                                flexShrink: 0,
                                                padding: 0,
                                            }}
                                        >
                                            {task.status === "done" ? "✓" : ""}
                                        </button>
                                    </form>
                                    <div className={styles.listItemDetails}>
                                        <div
                                            className={styles.listItemTitle}
                                            style={{
                                                textDecoration: task.status === "done" ? "line-through" : "none",
                                                opacity: task.status === "done" ? 0.5 : 1,
                                            }}
                                        >
                                            {task.title}
                                        </div>
                                        <div className={styles.listItemMeta}>
                                            {task.due_date && (
                                                <span>Due {new Date(task.due_date).toLocaleDateString()} · </span>
                                            )}
                                            <span
                                                style={{
                                                    color: priorityColors[task.priority],
                                                    fontWeight: 600,
                                                    textTransform: "capitalize",
                                                }}
                                            >
                                                {task.priority}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.listItemRight}>
                                    <form action={deleteTask}>
                                        <input type="hidden" name="taskId" value={task.id} />
                                        <input type="hidden" name="projectId" value={project.id} />
                                        <input type="hidden" name="userId" value={userId} />
                                        <button
                                            type="submit"
                                            title="Delete task"
                                            className={`${styles.actionBtn} ${styles.actionBtnGhost}`}
                                        >
                                            ✕
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ))}

                        {/* Add Task Form */}
                        <form action={addTask} className={styles.taskForm}>
                            <input type="hidden" name="userId" value={userId} />
                            <input type="hidden" name="projectId" value={project.id} />
                            <input
                                name="title"
                                placeholder="Add a task..."
                                required
                                className={styles.taskFormInput}
                            />
                            <select name="priority" defaultValue="medium" className={styles.taskFormSelect}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                            <input name="dueDate" type="date" className={styles.taskFormSelect} />
                            <button type="submit" className={styles.taskFormButton}>+ Task</button>
                        </form>
                    </div>
                ))
            )}
        </div>
    );
}
