import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getEmailError, getPasswordError } from "../utils/validation";

export default function Login({ onClose, onSwitchToSignUp }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

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

    const { error } = await signIn(email.trim(), password);
    if (error) {
      setSubmitError(error.message || "Login failed.");
      return;
    }
    onClose?.();
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
        <button type="submit" className="auth-btn-primary">
          Log in
        </button>
        <button type="button" onClick={onSwitchToSignUp} className="auth-switch">
          Don’t have an account? Sign up
        </button>
      </form>
    </div>
  );
}
