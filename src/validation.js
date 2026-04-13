function isValidEmail(email) {
  if (typeof email !== "string") {
    return false;
  }
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

function isValidPassword(password) {
  if (typeof password !== "string") {
    return false;
  }
  if (password.length < 6 || password.length > 64) {
    return false;
  }
  if (/\s/.test(password)) {
    return false;
  }
  return true;
}

function isValidUsername(username) {
  if (typeof username !== "string") {
    return false;
  }
  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 30) {
    return false;
  }
  return /^[A-Za-z0-9_]+$/.test(trimmed);
}

function validateLoginInput({ email, password }) {
  const errors = [];

  if (!email || !String(email).trim()) {
    errors.push({ field: "email", message: "Email is required" });
  } else if (!isValidEmail(email)) {
    errors.push({ field: "email", message: "Invalid email format" });
  }

  if (!password || !String(password).trim()) {
    errors.push({ field: "password", message: "Password is required" });
  }

  return errors;
}

function validateSignupInput({ username, email, password }) {
  const errors = [];

  if (!username || !String(username).trim()) {
    errors.push({ field: "username", message: "Username is required" });
  } else if (!isValidUsername(username)) {
    errors.push({ field: "username", message: "Username must be 3-30 characters and contain only letters, numbers, or underscore" });
  }

  if (!email || !String(email).trim()) {
    errors.push({ field: "email", message: "Email is required" });
  } else if (!isValidEmail(email)) {
    errors.push({ field: "email", message: "Invalid email format" });
  }

  if (!password || !String(password).trim()) {
    errors.push({ field: "password", message: "Password is required" });
  } else if (!isValidPassword(password)) {
    errors.push({ field: "password", message: "Password must be 6-64 characters with no spaces" });
  }

  return errors;
}

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidUsername,
  validateLoginInput,
  validateSignupInput
};
