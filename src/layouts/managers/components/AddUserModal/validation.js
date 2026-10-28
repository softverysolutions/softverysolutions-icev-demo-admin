const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const PASSWORD_MIN_LENGTH = 6;

const WHITESPACE_ERROR = "Remove leading and trailing spaces";

function hasLeadingOrTrailingWhitespace(value) {
  if (value == null || typeof value !== "string") return false;
  const v = value;
  return v.length > 0 && v !== v.trim();
}

export function validateEmail(value) {
  if (!value || !String(value).trim()) {
    return "Email is required";
  }
  const v = String(value);
  if (hasLeadingOrTrailingWhitespace(v)) {
    return WHITESPACE_ERROR;
  }
  if (!EMAIL_REGEX.test(v.trim())) {
    return "Enter a valid email address";
  }
  return null;
}

export function validateName(value) {
  if (!value || !String(value).trim()) {
    return "Name is required";
  }
  if (hasLeadingOrTrailingWhitespace(String(value))) {
    return WHITESPACE_ERROR;
  }
  return null;
}

export function validatePassword(value) {
  if (value == null || String(value).trim() === "") {
    return "Password is required";
  }
  const v = String(value);
  if (hasLeadingOrTrailingWhitespace(v)) {
    return WHITESPACE_ERROR;
  }
  const p = v.trim();
  if (p.length < PASSWORD_MIN_LENGTH) {
    return `At least ${PASSWORD_MIN_LENGTH} characters`;
  }
  return null;
}

export function validateAddUserForm(values) {
  const errors = {};

  const nameError = validateName(values.name);
  if (nameError) errors.name = nameError;

  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;

  if (!values.role) {
    errors.role = "Role is required";
  }

  const passwordError = validatePassword(values.password);
  if (passwordError) errors.password = passwordError;

  return errors;
}
