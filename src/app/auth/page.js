"use client";

import { useState } from "react";
import SignupForm from "./SignupForm";
import LoginForm from "./LoginForm";
import styles from "./page.module.css";

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // default view

  return (
    <div className={styles.authPageWrapper}>
      {/* Toggle Buttons */}
      <div className={styles.toggleButtons}>
        <button
          onClick={() => setMode("login")}
          disabled={mode === "login"}
          className={styles.toggleButton}
        >
          Login
        </button>

        <button
          onClick={() => setMode("signup")}
          disabled={mode === "signup"}
          className={styles.toggleButton}
        >
          Signup
        </button>
      </div>

      {/* Conditional Render */}
      {mode === "login" ? <LoginForm /> : <SignupForm />}
    </div>
  );
}
