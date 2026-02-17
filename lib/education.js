"use server";

import db from "./db";
import { revalidatePath } from "next/cache";

// ─── Skills ──────────────────────────────────────

export async function getSkills(userId) {
    const [skills] = await db.query(
        `SELECT * FROM skills WHERE user_id = ? ORDER BY name ASC`,
        [userId]
    );
    return skills;
}

export async function addSkill(formData) {
    const userId = formData.get("userId");
    const name = formData.get("name")?.trim();
    const level = parseInt(formData.get("level") || "0", 10);

    if (!name) throw new Error("Skill name is required.");

    await db.query(
        `INSERT INTO skills (user_id, name, level) VALUES (?, ?, ?)`,
        [userId, name, level]
    );
    revalidatePath("/dashboard");
}

export async function updateSkillLevel(formData) {
    const skillId = formData.get("skillId");
    const userId = formData.get("userId");
    const level = parseInt(formData.get("level"), 10);

    await db.query(`UPDATE skills SET level = ? WHERE id = ? AND user_id = ?`, [level, skillId, userId]);
    revalidatePath("/dashboard");
}

export async function deleteSkill(formData) {
    const skillId = formData.get("skillId");
    const userId = formData.get("userId");

    await db.query(`DELETE FROM courses WHERE skill_id = ? AND user_id = ?`, [skillId, userId]);
    await db.query(`DELETE FROM skills WHERE id = ? AND user_id = ?`, [skillId, userId]);
    revalidatePath("/dashboard");
}

// ─── Courses ─────────────────────────────────────

export async function getCourses(userId) {
    const [courses] = await db.query(
        `SELECT c.*, s.name AS skill_name 
         FROM courses c 
         LEFT JOIN skills s ON c.skill_id = s.id 
         WHERE c.user_id = ? 
         ORDER BY c.created_at DESC`,
        [userId]
    );
    return courses;
}

export async function addCourse(formData) {
    const userId = formData.get("userId");
    const skillId = formData.get("skillId");
    const title = formData.get("title")?.trim();
    const platform = formData.get("platform")?.trim() || null;
    const url = formData.get("url")?.trim() || null;

    if (!title) throw new Error("Course title is required.");
    if (!skillId) throw new Error("Please select a skill.");

    await db.query(
        `INSERT INTO courses (user_id, skill_id, title, platform, url, status) 
         VALUES (?, ?, ?, ?, ?, 'not_started')`,
        [userId, skillId, title, platform, url]
    );
    revalidatePath("/dashboard");
}

export async function toggleCourseStatus(formData) {
    const courseId = formData.get("courseId");
    const userId = formData.get("userId");

    const [[course]] = await db.query(`SELECT status FROM courses WHERE id = ? AND user_id = ?`, [courseId, userId]);
    if (!course) return;
    let newStatus;
    if (course.status === "not_started") newStatus = "in_progress";
    else if (course.status === "in_progress") newStatus = "completed";
    else newStatus = "not_started";

    await db.query(`UPDATE courses SET status = ? WHERE id = ? AND user_id = ?`, [newStatus, courseId, userId]);
    revalidatePath("/dashboard");
}

export async function deleteCourse(formData) {
    const courseId = formData.get("courseId");
    const userId = formData.get("userId");

    await db.query(`DELETE FROM courses WHERE id = ? AND user_id = ?`, [courseId, userId]);
    revalidatePath("/dashboard");
}

// ─── Stats ───────────────────────────────────────

export async function getEducationStats(userId) {
    const [[{ totalSkills }]] = await db.query(
        `SELECT COUNT(*) as totalSkills FROM skills WHERE user_id = ?`,
        [userId]
    );

    const [[{ totalCourses }]] = await db.query(
        `SELECT COUNT(*) as totalCourses FROM courses WHERE user_id = ?`,
        [userId]
    );

    const [[{ inProgress }]] = await db.query(
        `SELECT COUNT(*) as inProgress FROM courses WHERE user_id = ? AND status = 'in_progress'`,
        [userId]
    );

    const [[{ completed }]] = await db.query(
        `SELECT COUNT(*) as completed FROM courses WHERE user_id = ? AND status = 'completed'`,
        [userId]
    );

    return { totalSkills, totalCourses, inProgress, completed };
}
