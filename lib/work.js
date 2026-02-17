"use server";

import db from "./db";
import { revalidatePath } from "next/cache";

// Get all projects for a user, with their tasks and client info
export async function getProjectsWithTasks(userId) {
    const [projects] = await db.query(
        `SELECT p.*, c.name AS client_name 
     FROM projects p 
     LEFT JOIN clients c ON p.client_id = c.id 
     WHERE p.user_id = ? 
     ORDER BY p.created_at DESC`,
        [userId]
    );

    if (projects.length === 0) return [];

    const projectIds = projects.map((p) => p.id);
    const [tasks] = await db.query(
        `SELECT * FROM tasks WHERE project_id IN (?) ORDER BY 
      CASE priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
      END,
      due_date ASC`,
        [projectIds]
    );

    return projects.map((project) => ({
        ...project,
        tasks: tasks.filter((t) => t.project_id === project.id),
    }));
}

// Get work stats for a user
export async function getWorkStats(userId) {
    const [[{ activeProjects }]] = await db.query(
        `SELECT COUNT(*) as activeProjects FROM projects WHERE user_id = ? AND status != 'completed'`,
        [userId]
    );

    const [[{ completedTasks }]] = await db.query(
        `SELECT COUNT(*) as completedTasks FROM tasks WHERE user_id = ? AND status = 'done'`,
        [userId]
    );

    const [[{ pendingTasks }]] = await db.query(
        `SELECT COUNT(*) as pendingTasks FROM tasks WHERE user_id = ? AND status != 'done'`,
        [userId]
    );

    const [[{ dueThisWeek }]] = await db.query(
        `SELECT COUNT(*) as dueThisWeek FROM tasks 
     WHERE user_id = ? AND status != 'done' 
     AND due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`,
        [userId]
    );

    return { activeProjects, completedTasks, pendingTasks, dueThisWeek };
}

// Add a new project
export async function addProject(formData) {
    const userId = formData.get("userId");
    const name = formData.get("name")?.trim();
    const description = formData.get("description")?.trim() || null;
    const clientId = formData.get("clientId") || null;
    const dueDate = formData.get("dueDate") || null;
    const budget = parseFloat(formData.get("budget") || "0") || 0;

    if (!name) {
        throw new Error("Project name is required.");
    }

    await db.query(
        `INSERT INTO projects (user_id, name, description, client_id, due_date, status, budget, payment_status) 
     VALUES (?, ?, ?, ?, ?, 'not_started', ?, 'unpaid')`,
        [userId, name, description, clientId === "personal" ? null : clientId, dueDate, budget]
    );
    revalidatePath("/dashboard");

}

// Add a task to a project
export async function addTask(formData) {
    const userId = formData.get("userId");
    const projectId = formData.get("projectId");
    const title = formData.get("title")?.trim();
    const priority = formData.get("priority") || "medium";
    const dueDate = formData.get("dueDate") || null;

    if (!title) {
        throw new Error("Task title is required.");
    }

    await db.query(
        `INSERT INTO tasks (project_id, user_id, title, priority, due_date) 
     VALUES (?, ?, ?, ?, ?)`,
        [projectId, userId, title, priority, dueDate]
    );

    await recalcProjectProgress(projectId);
    revalidatePath("/dashboard");
}

// Toggle task status
export async function toggleTask(formData) {
    const taskId = formData.get("taskId");
    const projectId = formData.get("projectId");
    const userId = formData.get("userId");

    const [[task]] = await db.query(`SELECT status FROM tasks WHERE id = ? AND user_id = ?`, [taskId, userId]);
    if (!task) return;
    const newStatus = task.status === "done" ? "todo" : "done";

    await db.query(`UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?`, [newStatus, taskId, userId]);
    await recalcProjectProgress(projectId);
    revalidatePath("/dashboard");
}

// Delete a task
export async function deleteTask(formData) {
    const taskId = formData.get("taskId");
    const projectId = formData.get("projectId");
    const userId = formData.get("userId");

    await db.query(`DELETE FROM tasks WHERE id = ? AND user_id = ?`, [taskId, userId]);
    await recalcProjectProgress(projectId);
    revalidatePath("/dashboard");
}

// Delete a project (cascades tasks, payments)
export async function deleteProject(formData) {
    const projectId = formData.get("projectId");
    const userId = formData.get("userId");

    await db.query(`DELETE FROM payments WHERE project_id = ? AND user_id = ?`, [projectId, userId]);
    await db.query(`DELETE FROM tasks WHERE project_id = ? AND user_id = ?`, [projectId, userId]);
    await db.query(`DELETE FROM projects WHERE id = ? AND user_id = ?`, [projectId, userId]);
    revalidatePath("/dashboard");
}

// Recalculate project progress based on task completion
async function recalcProjectProgress(projectId) {
    const [[{ total }]] = await db.query(
        `SELECT COUNT(*) as total FROM tasks WHERE project_id = ?`,
        [projectId]
    );

    if (total === 0) {
        await db.query(
            `UPDATE projects SET progress = 0, status = 'not_started' WHERE id = ?`,
            [projectId]
        );
        return;
    }

    const [[{ done }]] = await db.query(
        `SELECT COUNT(*) as done FROM tasks WHERE project_id = ? AND status = 'done'`,
        [projectId]
    );

    const progress = Math.round((done / total) * 100);
    let status = "in_progress";
    if (progress === 0) status = "not_started";
    if (progress === 100) status = "completed";

    await db.query(
        `UPDATE projects SET progress = ?, status = ? WHERE id = ?`,
        [progress, status, projectId]
    );
}
