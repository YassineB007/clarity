"use client";

import { useFormStatus } from "react-dom";
import styles from "./Sections.module.css";

// Main form submit button (Add Project, Add Client, Update Budget, etc.)
export function SubmitButton({ children, pendingText, className }) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            className={className || styles.formButton}
            disabled={pending}
        >
            {pending ? (
                <span className={styles.pendingContent}>
                    <span className={styles.spinner}></span>
                    {pendingText || "Saving..."}
                </span>
            ) : (
                children
            )}
        </button>
    );
}

// Small action button (delete, toggle — used inside single-action forms)
export function ActionButton({ children, pendingText, className }) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            className={className}
            disabled={pending}
            style={pending ? { opacity: 0.5, pointerEvents: "none" } : {}}
        >
            {pending ? (
                pendingText ? (
                    <span className={styles.pendingContent}>
                        <span className={styles.spinnerSmall}></span>
                        {pendingText}
                    </span>
                ) : (
                    <span className={styles.spinnerSmall}></span>
                )
            ) : (
                children
            )}
        </button>
    );
}
