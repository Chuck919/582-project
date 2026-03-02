/**
 * Strip HTML tags and characters commonly used for XSS/injection.
 * Apply to all user-supplied text before sending to external APIs or storage.
 */
export function sanitizeInput(input) {
  return String(input)
    .replace(/<[^>]*>/g, "")
    .replace(/[<>"'`;]/g, "")
    .trim();
}

// Email: valid format (real-looking emails)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  return EMAIL_REGEX.test(email.trim());
}

export function getEmailError(email) {
  if (!email?.trim()) return "Email is required.";
  if (!isValidEmail(email)) return "Please enter a valid email address.";
  return null;
}

export function getPasswordError(password, isSignUp = false) {
  if (!password) return "Password is required.";
  if (isSignUp && password.length < 8) return "Password must be at least 8 characters for sign up.";
  return null;
}
