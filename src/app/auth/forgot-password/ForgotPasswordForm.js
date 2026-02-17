"use client";

import { useState } from "react";
import { requestPasswordReset } from "../../../../lib/auth";
import styles from "../SignupForm.module.css";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      await requestPasswordReset(
        new FormData(e.currentTarget)
      );
      setMessage(
        "If an account exists, a reset link has been sent."
      );
    } catch (err) {
      setError(err.message);
    }
  }

  if (message) {
    return (
      <div className={styles.signupFormWrapper}>
        <div className={styles.signupFormCard}>
          <h2>Check Your Email</h2>
          <p>{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.signupFormWrapper}>
      <form onSubmit={handleSubmit} className={styles.signupFormCard}>
        <h2>Forgot Password</h2>

        {error && (
          <div className={`${styles.message} ${styles.errorMessage}`}>
            {error}
          </div>
        )}

        <input
          name="email"
          type="email"
          placeholder="Enter your email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.signupInput}
        />

        <button type="submit" className={styles.signupButton}>
          Send Reset Link
        </button>
      </form>
    </div>
  );
}
