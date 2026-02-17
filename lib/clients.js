"use server";

import db from "./db";
import { revalidatePath } from "next/cache";

// Get all clients for a user
export async function getClients(userId) {
    const [clients] = await db.query(
        `SELECT * FROM clients WHERE user_id = ? ORDER BY name ASC`,
        [userId]
    );
    return clients;
}

// Get client stats
export async function getClientStats(userId) {
    const [[{ totalClients }]] = await db.query(
        `SELECT COUNT(*) as totalClients FROM clients WHERE user_id = ?`,
        [userId]
    );

    const [[{ withProjects }]] = await db.query(
        `SELECT COUNT(DISTINCT c.id) as withProjects 
     FROM clients c 
     INNER JOIN projects p ON p.client_id = c.id 
     WHERE c.user_id = ?`,
        [userId]
    );

    return { totalClients, withProjects };
}

// Add a new client
export async function addClient(formData) {
    const userId = formData.get("userId");
    const name = formData.get("name")?.trim();
    const email = formData.get("email")?.trim() || null;
    const phone = formData.get("phone")?.trim() || null;
    const company = formData.get("company")?.trim() || null;
    const notes = formData.get("notes")?.trim() || null;

    if (!name) {
        throw new Error("Client name is required.");
    }

    await db.query(
        `INSERT INTO clients (user_id, name, email, phone, company, notes) 
     VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, name, email, phone, company, notes]
    );
    revalidatePath("/dashboard");
}

// Delete a client (cascades projects, tasks, payments)
export async function deleteClient(formData) {
    const clientId = formData.get("clientId");
    const userId = formData.get("userId");

    // Get all projects for this client
    const [projects] = await db.query(
        `SELECT id FROM projects WHERE client_id = ? AND user_id = ?`,
        [clientId, userId]
    );
    const projectIds = projects.map((p) => p.id);

    if (projectIds.length > 0) {
        await db.query(`DELETE FROM payments WHERE project_id IN (?) AND user_id = ?`, [projectIds, userId]);
        await db.query(`DELETE FROM tasks WHERE project_id IN (?) AND user_id = ?`, [projectIds, userId]);
        await db.query(`DELETE FROM projects WHERE client_id = ? AND user_id = ?`, [clientId, userId]);
    }

    await db.query(`DELETE FROM clients WHERE id = ? AND user_id = ?`, [clientId, userId]);
    revalidatePath("/dashboard");
}
