import { useState } from "react";
import { useAuth } from "../contexts/useAuth";
import { getEmailError, getPasswordError } from "../utils/validation";

export default function Login({ onClose, onSwitchToSignUp }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    const emailErr = getEmailError(email);
    const passwordErr = getPasswordError(password, false);
    if (emailErr || passwordErr) {
      setErrors({ email: emailErr, password: passwordErr });
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        setSubmitError(error.message || "Login failed.");
        return;
      }
      onClose?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-modal">
      <div className="auth-modal-header">
        <h2 className="auth-modal-title">Log in</h2>
        <button type="button" className="auth-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            autoComplete="email"
          />
          {errors.email && <span className="auth-error">{errors.email}</span>}
        </div>
        <div className="auth-field">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            autoComplete="current-password"
          />
          {errors.password && <span className="auth-error">{errors.password}</span>}
        </div>
        {submitError && <span className="auth-error">{submitError}</span>}
        <button type="submit" className="auth-btn-primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <div className="loading-spinner small" style={{ margin: "0 auto", borderColor: "rgba(255,255,255,0.4)", borderTopColor: "#fff" }}></div>
          ) : (
            "Log in"
          )}
        </button>
        <button type="button" onClick={onSwitchToSignUp} className="auth-switch">
          Don’t have an account? Sign up
        </button>
      </form>
    </div>
  );
}
