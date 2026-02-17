"use server";

import db from "./db";
import { revalidatePath } from "next/cache";

// ─── User Budget ─────────────────────────────────

export async function getUserBudget(userId) {
    const [[user]] = await db.query(
        `SELECT budget FROM users WHERE id = ?`,
        [userId]
    );
    const startingBudget = Number(user?.budget || 0);

    // Total income from payments
    const [[{ totalIncome }]] = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as totalIncome FROM payments WHERE user_id = ?`,
        [userId]
    );

    // Total expenses from transactions
    const [[{ totalExpenses }]] = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as totalExpenses FROM transactions WHERE user_id = ?`,
        [userId]
    );

    const currentBalance = startingBudget + Number(totalIncome) - Number(totalExpenses);

    return {
        startingBudget,
        totalIncome: Number(totalIncome),
        totalExpenses: Number(totalExpenses),
        currentBalance,
    };
}

export async function updateStartingBudget(formData) {
    const userId = formData.get("userId");
    const budget = parseFloat(formData.get("budget") || "0");

    await db.query(`UPDATE users SET budget = ? WHERE id = ?`, [budget, userId]);
    revalidatePath("/dashboard");
}

// ─── Finance Stats ───────────────────────────────

export async function getFinanceStats(userId) {
    // Total received from payments
    const [[{ totalReceived }]] = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as totalReceived FROM payments WHERE user_id = ?`,
        [userId]
    );

    // Total expenses
    const [[{ totalExpenses }]] = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as totalExpenses FROM transactions WHERE user_id = ?`,
        [userId]
    );

    // Pending = total project budgets - total payments received across those projects
    const [[{ totalBudgets }]] = await db.query(
        `SELECT COALESCE(SUM(budget), 0) as totalBudgets FROM projects WHERE user_id = ? AND budget > 0`,
        [userId]
    );
    const pending = Number(totalBudgets) - Number(totalReceived);

    // This month income
    const [[{ monthIncome }]] = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as monthIncome FROM payments 
         WHERE user_id = ? AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`,
        [userId]
    );

    return {
        totalReceived: Number(totalReceived),
        totalExpenses: Number(totalExpenses),
        pending: pending > 0 ? pending : 0,
        monthIncome: Number(monthIncome),
    };
}

// ─── Projects with payment info ──────────────────

export async function getProjectsWithPayments(userId) {
    const [projects] = await db.query(
        `SELECT p.id, p.name, p.budget, p.status, p.due_date,
                c.name AS client_name,
                COALESCE((SELECT SUM(amount) FROM payments WHERE project_id = p.id), 0) AS amount_paid
         FROM projects p
         LEFT JOIN clients c ON p.client_id = c.id
         WHERE p.user_id = ? AND p.budget > 0
         ORDER BY p.created_at DESC`,
        [userId]
    );
    return projects;
}

// ─── Payments (partial payments on projects) ─────

export async function getPaymentsForProject(projectId) {
    const [payments] = await db.query(
        `SELECT * FROM payments WHERE project_id = ? ORDER BY created_at DESC`,
        [projectId]
    );
    return payments;
}

export async function getRecentPayments(userId) {
    const [payments] = await db.query(
        `SELECT py.*, p.name AS project_name, c.name AS client_name
         FROM payments py
         LEFT JOIN projects p ON py.project_id = p.id
         LEFT JOIN clients c ON p.client_id = c.id
         WHERE py.user_id = ?
         ORDER BY py.created_at DESC
         LIMIT 20`,
        [userId]
    );
    return payments;
}

export async function addPayment(formData) {
    const userId = formData.get("userId");
    const projectId = formData.get("projectId");
    const amount = parseFloat(formData.get("amount"));
    const note = formData.get("note")?.trim() || null;

    if (!amount || amount <= 0) throw new Error("Payment amount must be positive.");

    await db.query(
        `INSERT INTO payments (user_id, project_id, amount, note) VALUES (?, ?, ?, ?)`,
        [userId, projectId, amount, note]
    );

    // Auto-update payment_status on project
    const [[{ totalPaid }]] = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as totalPaid FROM payments WHERE project_id = ?`,
        [projectId]
    );
    const [[project]] = await db.query(`SELECT budget FROM projects WHERE id = ?`, [projectId]);
    const newStatus = Number(totalPaid) >= Number(project.budget) ? "paid" : "unpaid";
    await db.query(
        `UPDATE projects SET payment_status = ?, paid_at = ${newStatus === "paid" ? "NOW()" : "NULL"} WHERE id = ?`,
        [newStatus, projectId]
    );

    revalidatePath("/dashboard");
}

// ─── Transactions (expenses) ─────────────────────

export async function getTransactions(userId) {
    const [transactions] = await db.query(
        `SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 30`,
        [userId]
    );
    return transactions;
}

export async function addTransaction(formData) {
    const userId = formData.get("userId");
    const amount = parseFloat(formData.get("amount"));
    const description = formData.get("description")?.trim();
    const category = formData.get("category")?.trim() || null;

    if (!amount || amount <= 0) throw new Error("Amount must be positive.");
    if (!description) throw new Error("Description is required.");

    await db.query(
        `INSERT INTO transactions (user_id, amount, description, category) VALUES (?, ?, ?, ?)`,
        [userId, amount, description, category]
    );
    revalidatePath("/dashboard");
}

export async function deleteTransaction(formData) {
    const transactionId = formData.get("transactionId");
    const userId = formData.get("userId");

    await db.query(`DELETE FROM transactions WHERE id = ? AND user_id = ?`, [transactionId, userId]);
    revalidatePath("/dashboard");
}

// ─── Client Revenue ──────────────────────────────

export async function getClientRevenue(userId) {
    const [rows] = await db.query(
        `SELECT c.name,
                COUNT(DISTINCT p.id) as projects,
                COALESCE(SUM(p.budget), 0) as totalBudget,
                COALESCE((SELECT SUM(py.amount) FROM payments py 
                          JOIN projects p2 ON py.project_id = p2.id 
                          WHERE p2.client_id = c.id), 0) as totalPaid
         FROM clients c
         LEFT JOIN projects p ON p.client_id = c.id
         WHERE c.user_id = ?
         GROUP BY c.id, c.name
         HAVING projects > 0
         ORDER BY totalPaid DESC`,
        [userId]
    );
    return rows;
}
