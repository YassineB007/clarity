"use client";

import { useFormState } from "react-dom";
import { useFormStatus } from "react-dom";
import { sendContactMessage } from "../lib/contact";
import classes from "./Contact.module.css";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={classes.sendbtn}
      disabled={pending}
    >
      {pending ? "Sending..." : "Send"}
    </button>
  );
}

export default function Contact() {
  const [state, formAction] = useFormState(sendContactMessage, null);

  return (
    <section className={classes.contact} id="contact">
      <h2>Get in Touch</h2>

      <div className={classes.contactcontent}>
        {/* Contact Info */}
        <div className={classes.contactinfo}>
          <p>
            <strong>Address:</strong>
            <br />
            123 Organizer Street, Suite 45
            <br />
            New York, USA
          </p>

          <p>
            <strong>Phone:</strong>
            <br />
            +216 12 345 678
          </p>

          <p>
            <strong>Email:</strong>
            <br />
            contact@archwayhlub.com
          </p>
        </div>

        {/* Contact Form */}
        <form action={formAction} className={classes.contactform}>
          
          {state?.error && (
            <p className={classes.errormessage}>{state.error}</p>
          )}

          {state?.success && (
            <p className={classes.successmessage}>
              Message sent successfully!
            </p>
          )}

          <div className={classes.formrow}>
            <input type="text" name="name" placeholder="Name..." required />
            <input type="text" name="surname" placeholder="Surname..." required />
          </div>

          <input type="email" name="email" placeholder="Email..." required />
          <input type="text" name="subject" placeholder="Subject..." required />
          <textarea name="message" placeholder="Message..." required />

          <SubmitButton />
        </form>
      </div>
    </section>
  );
}
