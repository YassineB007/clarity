"use client";

import { useActionState, useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { signup } from "../../../lib/auth";
import styles from "./SignupForm.module.css";

function SignupButton({ canSubmit }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={!canSubmit || pending}
      className={styles.signupButton}
    >
      {pending ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <span className={styles.spinner}></span>
          Creating account...
        </span>
      ) : (
        "Signup"
      )}
    </button>
  );
}

export default function SignupForm() {
  const [state, formAction] = useActionState(signup, null);

  // Client-side state for immediate feedback
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [canSubmit, setCanSubmit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation effect
  useEffect(() => {
    const newErrors = {};

    if ((touched.name || false) && (!form.name.trim() || form.name.length < 2)) {
      newErrors.name = "Name must be at least 2 characters.";
    }

    if ((touched.email || false) && (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))) {
      newErrors.email = "Invalid email address.";
    }

    if ((touched.role || false) && !form.role.trim()) {
      newErrors.role = "Role is required.";
    }

    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    if ((touched.password || false) && !strongPassword.test(form.password)) {
      newErrors.password =
        "Password must include uppercase, lowercase, number and special character.";
    }

    if ((touched.confirmPassword || false) && form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);

    // Check if form is valid (all fields filled and no errors)
    const hasValues = Object.values(form).every(val => val.trim() !== "");
    const hasNoErrors = Object.keys(newErrors).length === 0;

    // We only enable submit if all fields have been touched/filled at least once or checks pass
    // Simpler: check if all required fields are filled and valid
    // Re-running validation on all fields to assert 'canSubmit' correctly
    const isNameValid = form.name.trim().length >= 2;
    const isEmailValid = /\S+@\S+\.\S+/.test(form.email);
    const isRoleValid = form.role.trim().length > 0;
    const isPasswordValid = strongPassword.test(form.password);
    const isConfirmValid = form.password === form.confirmPassword;

    setCanSubmit(isNameValid && isEmailValid && isRoleValid && isPasswordValid && isConfirmValid);
  }, [form, touched]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleBlur(e) {
    setTouched({ ...touched, [e.target.name]: true });
  }

  if (state?.success) {
    return (
      <div className={styles.signupFormWrapper}>
        <div className={styles.signupFormCard}>
          <h2>Check Your Email</h2>
          <p className={styles.successMessage}>{state.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.signupFormWrapper}>
      <form action={formAction} className={styles.signupFormCard}>
        <h2>Signup</h2>

        {state?.error && (
          <div className={`${styles.message} ${styles.errorMessage}`}>
            {state.error}
          </div>
        )}

        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          onBlur={handleBlur}
          className={styles.signupInput}
        />
        {touched.name && errors.name && (
          <div className={`${styles.message} ${styles.errorMessage}`}>
            {errors.name}
          </div>
        )}

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          onBlur={handleBlur}
          className={styles.signupInput}
        />
        {touched.email && errors.email && (
          <div className={`${styles.message} ${styles.errorMessage}`}>
            {errors.email}
          </div>
        )}

        <input
          name="role"
          placeholder="Role"
          value={form.role}
          onChange={handleChange}
          onBlur={handleBlur}
          className={styles.signupInput}
        />
        {touched.role && errors.role && (
          <div className={`${styles.message} ${styles.errorMessage}`}>
            {errors.role}
          </div>
        )}

        <div className={styles.passwordWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            className={styles.signupInput}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={styles.toggleButton}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            )}
          </button>
        </div>
        {touched.password && errors.password && (
          <div className={`${styles.message} ${styles.errorMessage}`}>
            {errors.password}
          </div>
        )}

        <div className={styles.passwordWrapper}>
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            className={styles.signupInput}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className={styles.toggleButton}
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            )}
          </button>
        </div>
        {touched.confirmPassword && errors.confirmPassword && (
          <div className={`${styles.message} ${styles.errorMessage}`}>
            {errors.confirmPassword}
          </div>
        )}

        <SignupButton canSubmit={canSubmit} />
      </form>
    </div>
  );
}
