import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getEmailError, getPasswordError } from "../utils/validation";

export default function SignUp({ onClose, onSwitchToLogin }) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [showCheckEmail, setShowCheckEmail] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    const emailErr = getEmailError(email);
    const passwordErr = getPasswordError(password, true);
    if (emailErr || passwordErr) {
      setErrors({ email: emailErr, password: passwordErr });
      return;
    }
    setErrors({});

    const { data, error } = await signUp(email.trim(), password, { username: username.trim() || undefined });
    if (error) {
      setSubmitError(error.message || "Sign up failed.");
      return;
    }
    if (data?.user) {
      setShowCheckEmail(true);
      return;
    }
    onClose?.();
  };

  if (showCheckEmail) {
    return (
      <div className="auth-modal">
        <div className="auth-modal-header">
          <h2 className="auth-modal-title">Check your email</h2>
          <button type="button" className="auth-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="auth-form">
          <p className="auth-check-email-message">
            We sent a confirmation link to <strong>{email}</strong>. Click the link in that email to confirm your account and sign in.
          </p>
          <button type="button" className="auth-btn-primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-modal">
      <div className="auth-modal-header">
        <h2 className="auth-modal-title">Sign up</h2>
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
            type="text"
            placeholder="Username (optional)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="auth-input"
            autoComplete="username"
          />
        </div>
        <div className="auth-field">
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            autoComplete="new-password"
          />
          {errors.password && <span className="auth-error">{errors.password}</span>}
        </div>
        {submitError && <span className="auth-error">{submitError}</span>}
        <button type="submit" className="auth-btn-primary">
          Sign up
        </button>
        <button type="button" onClick={onSwitchToLogin} className="auth-switch">
          Already have an account? Log in
        </button>
      </form>
    </div>
  );
}
