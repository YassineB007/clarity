// app/verify/page.js

import db from "../../../lib/db";
import styles from "./page.module.css";

export default async function VerifyPage({ searchParams }) {
  const params = await searchParams; // unwrap promise
  const token = params?.token;

  if (!token) {
    return (
      <div className={styles.verifyWrapper}>
        <div className={styles.verifyCard}>
          <h2>Invalid verification link.</h2>
        </div>
      </div>
    );
  }

  // Check token in DB
  const [rows] = await db.query(
    `
    SELECT ev.user_id
    FROM email_verifications ev
    WHERE ev.token = ?
      AND ev.expires_at > NOW()
    `,
    [token]
  );

  if (!rows.length) {
    return (
      <div className={styles.verifyWrapper}>
        <div className={styles.verifyCard}>
          <h2>Invalid or expired verification link.</h2>
        </div>
      </div>
    );
  }

  const userId = rows[0].user_id;

  // Mark user as verified
  await db.query(
    `UPDATE users SET is_verified = 1 WHERE id = ?`,
    [userId]
  );

  // Delete used token
  await db.query(
    `DELETE FROM email_verifications WHERE user_id = ?`,
    [userId]
  );

  return (
    <div className={styles.verifyWrapper}>
      <div className={styles.verifyCard}>
        <h2>Email verified successfully ✅</h2>
        <a className={styles.verifyLink} href="/auth">
          Go to Login
        </a>
      </div>
    </div>
  );
}
