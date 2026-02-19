import {
    getSkills, getEducationStats, addSkill, deleteSkill, updateSkillLevel,
    getCourses, addCourse, toggleCourseStatus, deleteCourse,
} from "../../../../lib/education";
import { SubmitButton, ActionButton } from "./FormButtons";
import styles from "./Sections.module.css";

const LEVEL_LABELS = [
    "Absolute Beginner",
    "Beginner",
    "Intermediate",
    "Advanced",
    "Expert",
    "Master",
];

export default async function EducationSection({ userId }) {
    const [skills, stats, courses] = await Promise.all([
        getSkills(userId),
        getEducationStats(userId),
        getCourses(userId),
    ]);

    const statCards = [
        { icon: "🎯", value: stats.totalSkills, label: "Skills" },
        { icon: "📚", value: stats.totalCourses, label: "Total Courses" },
        { icon: "▶️", value: stats.inProgress, label: "In Progress" },
        { icon: "✅", value: stats.completed, label: "Completed" },
    ];

    const levelColors = [
        "#94a3b8", // 0 - Absolute Beginner (gray)
        "#60a5fa", // 1 - Beginner (blue)
        "#f59e0b", // 2 - Intermediate (amber)
        "#f97316", // 3 - Advanced (orange)
        "#10b981", // 4 - Expert (green)
        "#a855f7", // 5 - Master (purple)
    ];

    const statusIcons = {
        not_started: "⏸️",
        in_progress: "▶️",
        completed: "✅",
    };

    const statusLabels = {
        not_started: "Not Started",
        in_progress: "In Progress",
        completed: "Completed",
    };

    // Group courses by skill
    const coursesBySkill = {};
    for (const skill of skills) {
        coursesBySkill[skill.id] = courses.filter(c => c.skill_id === skill.id);
    }

    return (
        <div className={styles.fadeIn}>
            <div className={styles.sectionHeader}>
                <h1 className={styles.sectionTitle}>Education</h1>
                <p className={styles.sectionSubtitle}>
                    Track your skills and learning progress.
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

            {/* Add Skill Form */}
            <div className={styles.contentCard}>
                <div className={styles.contentCardHeader}>
                    <h2 className={styles.contentCardTitle}>Add New Skill</h2>
                </div>
                <form action={addSkill} className={styles.formGrid}>
                    <input type="hidden" name="userId" value={userId} />
                    <div className={styles.formField}>
                        <label className={styles.formLabel}>Skill Name *</label>
                        <input name="name" placeholder="e.g. JavaScript, UI Design" required className={styles.formInput} />
                    </div>
                    <div className={styles.formField}>
                        <label className={styles.formLabel}>Current Level</label>
                        <select name="level" defaultValue="0" className={styles.formSelect}>
                            {LEVEL_LABELS.map((label, i) => (
                                <option key={i} value={i}>{i} — {label}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.formField}>
                        <SubmitButton pendingText="Adding...">+ Add Skill</SubmitButton>
                    </div>
                </form>
            </div>

            {/* Add Course Form */}
            {skills.length > 0 && (
                <div className={styles.contentCard}>
                    <div className={styles.contentCardHeader}>
                        <h2 className={styles.contentCardTitle}>Add New Course</h2>
                    </div>
                    <form action={addCourse} className={styles.formGrid}>
                        <input type="hidden" name="userId" value={userId} />
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Course Title *</label>
                            <input name="title" placeholder="e.g. React Complete Guide" required className={styles.formInput} />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Skill *</label>
                            <select name="skillId" required className={styles.formSelect}>
                                <option value="">Select a skill…</option>
                                {skills.map((skill) => (
                                    <option key={skill.id} value={skill.id}>
                                        {skill.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Platform</label>
                            <input name="platform" placeholder="Udemy, YouTube…" className={styles.formInput} />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>URL</label>
                            <input name="url" type="url" placeholder="https://..." className={styles.formInput} />
                        </div>
                        <div className={styles.formField}>
                            <SubmitButton pendingText="Adding...">+ Add Course</SubmitButton>
                        </div>
                    </form>
                </div>
            )}

            {/* Skills with their Courses */}
            {skills.length === 0 ? (
                <div className={styles.contentCard}>
                    <div className={styles.emptyState}>
                        <div className={styles.emptyStateIcon}>🎯</div>
                        <div className={styles.emptyStateText}>
                            No skills yet. Add your first skill above to start tracking!
                        </div>
                    </div>
                </div>
            ) : (
                skills.map((skill) => {
                    const skillCourses = coursesBySkill[skill.id] || [];
                    return (
                        <div key={skill.id} className={styles.contentCard}>
                            {/* Skill Header */}
                            <div className={styles.contentCardHeader}>
                                <div>
                                    <h2 className={styles.contentCardTitle}>{skill.name}</h2>
                                    <div className={styles.listItemMeta} style={{ marginTop: "2px" }}>
                                        {skillCourses.length} course{skillCourses.length !== 1 ? "s" : ""}
                                    </div>
                                </div>
                                <div className={styles.listItemRight}>
                                    {/* Level update */}
                                    <form action={updateSkillLevel} className={styles.formRow}>
                                        <input type="hidden" name="skillId" value={skill.id} />
                                        <input type="hidden" name="userId" value={userId} />
                                        <select name="level" defaultValue={skill.level} className={styles.taskFormSelect}>
                                            {LEVEL_LABELS.map((label, i) => (
                                                <option key={i} value={i}>Lvl {i}</option>
                                            ))}
                                        </select>
                                        <SubmitButton pendingText="..." className={styles.taskFormButton}>
                                            Set
                                        </SubmitButton>
                                    </form>
                                    <span
                                        className={styles.badge}
                                        style={{
                                            backgroundColor: `${levelColors[skill.level]}20`,
                                            color: levelColors[skill.level],
                                        }}
                                    >
                                        {LEVEL_LABELS[skill.level]}
                                    </span>
                                    <form action={deleteSkill} style={{ display: "inline" }}>
                                        <input type="hidden" name="skillId" value={skill.id} />
                                        <input type="hidden" name="userId" value={userId} />
                                        <ActionButton className={`${styles.actionBtn} ${styles.actionBtnGhost}`}>
                                            🗑️
                                        </ActionButton>
                                    </form>
                                </div>
                            </div>

                            {/* Courses under this skill */}
                            {skillCourses.length === 0 ? (
                                <div className={styles.emptyInline}>
                                    No courses yet for this skill.
                                </div>
                            ) : (
                                skillCourses.map((course) => (
                                    <div key={course.id} className={styles.listItem}>
                                        <div className={styles.listItemLeft}>
                                            <form action={toggleCourseStatus}>
                                                <input type="hidden" name="courseId" value={course.id} />
                                                <input type="hidden" name="userId" value={userId} />
                                                <ActionButton
                                                    className={styles.courseStatusBtn}
                                                >
                                                    {statusIcons[course.status]}
                                                </ActionButton>
                                            </form>
                                            <div className={styles.listItemDetails}>
                                                <div
                                                    className={styles.listItemTitle}
                                                    style={{
                                                        textDecoration: course.status === "completed" ? "line-through" : "none",
                                                        opacity: course.status === "completed" ? 0.5 : 1,
                                                    }}
                                                >
                                                    {course.url ? (
                                                        <a
                                                            href={course.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ color: "inherit", textDecoration: "underline" }}
                                                        >
                                                            {course.title}
                                                        </a>
                                                    ) : (
                                                        course.title
                                                    )}
                                                </div>
                                                <div className={styles.listItemMeta}>
                                                    {course.platform && <span>{course.platform} · </span>}
                                                    <span>{statusLabels[course.status]}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.listItemRight}>
                                            <form action={deleteCourse}>
                                                <input type="hidden" name="courseId" value={course.id} />
                                                <input type="hidden" name="userId" value={userId} />
                                                <ActionButton className={`${styles.actionBtn} ${styles.actionBtnGhost}`}>
                                                    ✕
                                                </ActionButton>
                                            </form>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}
