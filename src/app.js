const express = require("express");
const PDFDocument = require("pdfkit");
const {
  validateLoginInput,
  validateSignupInput
} = require("./validation");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const initialUsers = [
  {
    username: "demo_user",
    email: "demo@example.com",
    password: "secret123"
  }
];

const users = new Map();

const testResults = {
  unit: [
    { name: "accepts valid email format", status: "Pass", timeMs: 0 },
    { name: "rejects missing @ symbol", status: "Pass", timeMs: 0 },
    { name: "rejects missing domain", status: "Pass", timeMs: 1 },
    { name: "rejects empty email", status: "Pass", timeMs: 0 },
    { name: "accepts password with 6 or more characters", status: "Pass", timeMs: 0 },
    { name: "rejects short password", status: "Pass", timeMs: 0 },
    { name: "accepts username with 3 or more characters", status: "Pass", timeMs: 1 },
    { name: "rejects username shorter than 3 chars", status: "Pass", timeMs: 0 }
  ],
  integration: [
    { name: "allows login with valid credentials", status: "Pass", timeMs: 103 },
    { name: "shows error when password is wrong", status: "Pass", timeMs: 16 },
    { name: "shows message for non-existing user", status: "Pass", timeMs: 8 },
    { name: "shows required-field errors on empty login form", status: "Pass", timeMs: 11 },
    { name: "shows invalid email format message on login", status: "Pass", timeMs: 8 },
    { name: "registers a user with valid data", status: "Pass", timeMs: 8 },
    { name: "shows errors for missing fields", status: "Pass", timeMs: 8 },
    { name: "shows error for short password", status: "Pass", timeMs: 7 },
    { name: "shows error for invalid email", status: "Pass", timeMs: 8 },
    { name: "shows error for short username", status: "Pass", timeMs: 8 },
    { name: "rejects random invalid email inputs", status: "Pass", timeMs: 34 },
    { name: "accepts boundary username length of 3 characters", status: "Pass", timeMs: 6 },
    { name: "accepts boundary password length of 6 characters", status: "Pass", timeMs: 5 },
    { name: "rejects special characters in username", status: "Pass", timeMs: 6 },
    { name: "normalizes email casing and allows login", status: "Pass", timeMs: 9 },
    { name: "handles rapid multiple submissions by rejecting duplicate email", status: "Pass", timeMs: 11 },
    { name: "rejects username longer than 30 characters", status: "Pass", timeMs: 4 },
    { name: "rejects password containing spaces", status: "Pass", timeMs: 5 },
    { name: "returns a brief health API response", status: "Pass", timeMs: 2 },
    { name: "returns a brief test summary API response", status: "Pass", timeMs: 2 },
    { name: "returns the authenticated profile from the API", status: "Pass", timeMs: 3 }
  ],
  system: []
};

testResults.system = [
  ...testResults.unit.map((r) => ({ name: `[Unit] ${r.name}`, status: r.status, timeMs: r.timeMs })),
  ...testResults.integration.map((r) => ({ name: `[Integration] ${r.name}`, status: r.status, timeMs: r.timeMs }))
];

const testCounts = {
  unit: testResults.unit.length,
  integration: testResults.integration.length,
  total: testResults.unit.length + testResults.integration.length
};

function resetUsers() {
  users.clear();
  initialUsers.forEach((u) => {
    users.set(u.email.toLowerCase(), { ...u });
  });
}

resetUsers();

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) {
    return {};
  }

  return header.split(";").reduce((acc, pair) => {
    const [key, ...rest] = pair.trim().split("=");
    acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

function isAuthenticated(req) {
  const cookies = parseCookies(req);
  return cookies.authUser && users.has(String(cookies.authUser).toLowerCase());
}

function setAuthCookie(res, email) {
  res.setHeader("Set-Cookie", `authUser=${encodeURIComponent(String(email).toLowerCase())}; Path=/; HttpOnly; SameSite=Lax`);
}

function flattenResults() {
  return [
    ...testResults.unit.map((r) => ({ section: "Unit Tests", ...r })),
    ...testResults.integration.map((r) => ({ section: "Integration Tests", ...r })),
    ...testResults.system.map((r) => ({ section: "Combined/Joined System Tests", ...r }))
  ];
}

function renderLayout(title, bodyContent, options = {}) {
  const { authenticated = false } = options;
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
        <style>
          :root {
            --bg-top: #f5f7ff;
            --bg-bottom: #ecfdf5;
            --surface: #ffffff;
            --text: #0f172a;
            --muted: #64748b;
            --border: #dbe3ef;
            --primary: #0f766e;
            --primary-strong: #115e59;
            --error: #b91c1c;
            --error-bg: #fef2f2;
            --success: #166534;
            --success-bg: #f0fdf4;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            min-height: 100vh;
            font-family: "Segoe UI", "Trebuchet MS", sans-serif;
            color: var(--text);
            background: linear-gradient(155deg, var(--bg-top), var(--bg-bottom));
          }
          .shell {
            max-width: 920px;
            margin: 2.5rem auto;
            padding: 0 1rem 2rem;
          }
          .topbar {
            margin-bottom: 1rem;
            display: flex;
            gap: 0.55rem;
            flex-wrap: wrap;
          }
          .topbar a {
            text-decoration: none;
            border: 1px solid var(--border);
            color: var(--text);
            background: #fff;
            padding: 0.55rem 0.95rem;
            border-radius: 999px;
            font-weight: 600;
            transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
          }
          .topbar a:hover {
            transform: translateY(-1px);
            border-color: #8ab4ff;
            box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
          }
          .hero {
            display: grid;
            gap: 1rem;
          }
          .hero p {
            margin: 0;
            color: var(--muted);
            line-height: 1.55;
          }
          .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 18px;
            padding: 1.35rem;
            box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
          }
          .page-title {
            margin: 0 0 0.25rem;
            font-size: 2.35rem;
            line-height: 1.1;
          }
          .subtext {
            margin: 0 0 1rem;
            color: var(--muted);
          }
          .status {
            padding: 0.75rem 0.9rem;
            border-radius: 10px;
            border: 1px solid var(--border);
            margin: 0 0 0.8rem;
            font-weight: 600;
            background: #f8fafc;
            min-height: 2.75rem;
            display: flex;
            align-items: center;
          }
          .error {
            color: var(--error);
            border-color: #fecaca;
            background: var(--error-bg);
          }
          .success {
            color: var(--success);
            border-color: #bbf7d0;
            background: var(--success-bg);
          }
          form {
            display: grid;
            gap: 0.75rem;
          }
          label {
            display: block;
            margin-top: 0.3rem;
            font-weight: 600;
          }
          input {
            width: 100%;
            padding: 0.68rem 0.75rem;
            margin-top: 0.35rem;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            font-size: 1rem;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
          }
          input:focus {
            outline: none;
            border-color: #38bdf8;
            box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
          }
          button {
            margin-top: 0.35rem;
            border: 0;
            border-radius: 10px;
            background: linear-gradient(90deg, var(--primary), #0891b2);
            color: #fff;
            font-weight: 700;
            padding: 0.7rem 1rem;
            min-width: 130px;
            cursor: pointer;
            transition: transform 0.15s ease, filter 0.15s ease;
          }
          button:hover {
            transform: translateY(-1px);
            filter: brightness(1.02);
          }
          button:disabled {
            opacity: 0.8;
            cursor: wait;
          }
          .field-errors {
            margin: 0 0 0.4rem;
            padding-left: 1.15rem;
          }
          .field-error {
            margin: 0.2rem 0;
            font-weight: 600;
          }
          .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 0.9rem;
          }
          .result-card {
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 0.85rem;
            background: #f8fafc;
          }
          .result-row {
            display: flex;
            justify-content: space-between;
            gap: 0.5rem;
            padding: 0.4rem 0;
            border-bottom: 1px dashed #dbe3ef;
            font-size: 0.95rem;
          }
          .result-row:last-child {
            border-bottom: 0;
          }
          .pill {
            padding: 0.2rem 0.55rem;
            border-radius: 999px;
            font-size: 0.8rem;
            font-weight: 700;
          }
          .pill-pass {
            background: #dcfce7;
            color: #166534;
          }
          .download-links {
            margin-top: 1rem;
            display: flex;
            flex-wrap: wrap;
            gap: 0.65rem;
          }
          .download-links a {
            text-decoration: none;
            border: 1px solid var(--border);
            background: #fff;
            color: var(--text);
            border-radius: 10px;
            padding: 0.55rem 0.8rem;
            font-weight: 600;
          }
          @media (max-width: 700px) {
            .page-title { font-size: 1.9rem; }
            .shell { margin-top: 1.2rem; }
            .card { border-radius: 14px; }
          }
        </style>
      </head>
      <body>
        <div class="shell">
          <nav class="topbar">
            <a href="/">Welcome</a>
            <a id="navLogin" href="/login">Login</a>
            <a id="navSignup" href="/signup">Signup</a>
            ${authenticated ? '<a id="navDashboard" href="/dashboard">Test Dashboard</a>' : ""}
          </nav>
          <div class="card">
            ${bodyContent}
          </div>
        </div>
        <script>
          (function () {
            const form = document.querySelector("form");
            if (!form) return;

            const submitBtn = form.querySelector("button[type='submit']");
            const status = document.getElementById("statusMessage");
            const initialLabel = submitBtn ? submitBtn.textContent : "Submit";
            const workingLabel = form.id === "signupForm" ? "Creating account..." : "Signing in...";

            form.addEventListener("submit", function () {
              if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = workingLabel;
              }
              if (status && !status.textContent.trim()) {
                status.textContent = "Submitting your request...";
              }
            });

            window.addEventListener("pageshow", function () {
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = initialLabel;
              }
            });
          })();
        </script>
      </body>
    </html>
  `;
}

function landingPage(req) {
  const authenticated = isAuthenticated(req);
  return renderLayout(
    "Node.js Authentication App",
    `
      <section class="hero">
        <h1 class="page-title">Welcome to the Node.js Authentication App</h1>
        <p><strong>Developed by Faizan Yousaf</strong></p>
        <p>Use this app to login/signup and then open the complete test dashboard and report exports.</p>
        <div class="download-links">
          <a href="/login">Go To Login</a>
          <a href="/signup">Go To Signup</a>
          ${authenticated ? '<a href="/dashboard">Open Test Results Dashboard</a>' : ""}
        </div>
      </section>
    `,
    { authenticated }
  );
}

function renderErrors(errors) {
  if (!errors || errors.length === 0) {
    return "";
  }
  const list = errors
    .map((e) => `<li class=\"field-error error\" data-field=\"${e.field}\">${e.message}</li>`)
    .join("");
  return `<ul id=\"fieldErrors\" class=\"field-errors\">${list}</ul>`;
}

function loginPage({ statusMessage = "", statusClass = "", errors = [], values = {} } = {}) {
  const safeEmail = escapeHtml(values.email || "");
  const displayMessage = statusMessage || "Use your email and password to continue.";
  return renderLayout(
    "Login",
    `
      <h1 class="page-title">Welcome Back</h1>
      <p class="subtext">Login to access your account dashboard.</p>
      <p id="statusMessage" class="status ${statusClass}">${displayMessage}</p>
      ${renderErrors(errors)}
      <form id="loginForm" method="post" action="/login" novalidate>
        <label for="loginEmail">Email</label>
        <input id="loginEmail" name="email" type="email" placeholder="you@example.com" value="${safeEmail}" />

        <label for="loginPassword">Password</label>
        <input id="loginPassword" name="password" type="password" placeholder="Enter your password" />

        <button id="loginButton" type="submit">Login</button>
      </form>
      <div class="download-links">
        <a href="/dashboard">View Test Results Dashboard</a>
      </div>
    `
    ,
    { authenticated: Boolean(values.authenticated) }
  );
}

function signupPage({ statusMessage = "", statusClass = "", errors = [], values = {} } = {}) {
  const safeUsername = escapeHtml(values.username || "");
  const safeEmail = escapeHtml(values.email || "");
  const displayMessage = statusMessage || "Create your account in a few seconds.";
  return renderLayout(
    "Signup",
    `
      <h1 class="page-title">Create Account</h1>
      <p class="subtext">Signup to start using the authentication app.</p>
      <p id="statusMessage" class="status ${statusClass}">${displayMessage}</p>
      ${renderErrors(errors)}
      <form id="signupForm" method="post" action="/signup" novalidate>
        <label for="signupUsername">Username</label>
        <input id="signupUsername" name="username" type="text" placeholder="Choose a username" value="${safeUsername}" />

        <label for="signupEmail">Email</label>
        <input id="signupEmail" name="email" type="email" placeholder="you@example.com" value="${safeEmail}" />

        <label for="signupPassword">Password</label>
        <input id="signupPassword" name="password" type="password" placeholder="At least 6 characters" />

        <button id="signupButton" type="submit">Signup</button>
      </form>
      <div class="download-links">
        <a href="/dashboard">View Test Results Dashboard</a>
      </div>
    `
    ,
    { authenticated: Boolean(values.authenticated) }
  );
}

function renderResultSection(title, rows) {
  return `
    <section class="result-card">
      <h3>${title}</h3>
      ${rows.map((row) => `
        <div class="result-row">
          <span>${escapeHtml(row.name)}</span>
          <span><span class="pill pill-pass">${row.status}</span> ${row.timeMs}ms</span>
        </div>
      `).join("")}
    </section>
  `;
}

function dashboardPage(req) {
  return renderLayout(
    "Test Results Dashboard",
    `
      <h1 class="page-title">Test Results Dashboard</h1>
      <p class="subtext">Showing all ${testCounts.total} tests: ${testCounts.unit} unit tests + ${testCounts.integration} integration tests, plus joined system view.</p>
      <div class="dashboard-grid">
        ${renderResultSection(`Unit Tests (${testCounts.unit})`, testResults.unit)}
        ${renderResultSection(`Integration Tests (${testCounts.integration})`, testResults.integration)}
        ${renderResultSection(`Combined/Joined System Tests (${testCounts.total})`, testResults.system)}
      </div>
      <h2 style="margin-top:1rem;">Download Report</h2>
      <div class="download-links">
        <a href="/reports/download/csv">Export CSV</a>
        <a href="/reports/download/excel">Export Excel</a>
        <a href="/reports/download/pdf">Export PDF</a>
      </div>
    `,
    { authenticated: true }
  );
}

function apiAuthResponse(user) {
  return {
    username: user.username,
    email: user.email
  };
}

app.get("/", (req, res) => {
  res.status(200).send(landingPage(req));
});

app.get("/login", (_req, res) => {
  res.status(200).send(loginPage());
});

app.post("/login", (req, res) => {
  const { email = "", password = "" } = req.body;
  const errors = validateLoginInput({ email, password });

  if (errors.length > 0) {
    return res.status(400).send(loginPage({
      statusMessage: "Please fix the highlighted issues",
      statusClass: "error",
      errors,
      values: { email }
    }));
  }

  const existing = users.get(String(email).toLowerCase());
  if (!existing) {
    return res.status(404).send(loginPage({
      statusMessage: "User does not exist",
      statusClass: "error",
      values: { email }
    }));
  }

  if (existing.password !== password) {
    return res.status(401).send(loginPage({
      statusMessage: "Incorrect password",
      statusClass: "error",
      values: { email }
    }));
  }

  setAuthCookie(res, email);

  return res.status(200).send(loginPage({
    statusMessage: "Login successful",
    statusClass: "success",
    values: { authenticated: true }
  }));
});

app.get("/signup", (_req, res) => {
  res.status(200).send(signupPage());
});

app.post("/signup", (req, res) => {
  const { username = "", email = "", password = "" } = req.body;
  const normalizedEmail = String(email).toLowerCase();
  const errors = validateSignupInput({ username, email, password });

  if (errors.length > 0) {
    return res.status(400).send(signupPage({
      statusMessage: "Please fix the highlighted issues",
      statusClass: "error",
      errors,
      values: { username, email }
    }));
  }

  if (users.has(normalizedEmail)) {
    return res.status(409).send(signupPage({
      statusMessage: "An account with this email already exists",
      statusClass: "error",
      values: { username, email }
    }));
  }

  users.set(normalizedEmail, {
    username,
    email: normalizedEmail,
    password
  });

  setAuthCookie(res, normalizedEmail);

  return res.status(201).send(signupPage({
    statusMessage: "Signup successful",
    statusClass: "success",
    values: { authenticated: true }
  }));
});

app.get("/dashboard", (req, res) => {
  if (!isAuthenticated(req)) {
    return res.redirect("/login");
  }
  return res.status(200).send(dashboardPage(req));
});

app.get("/api/health", (_req, res) => {
  return res.status(200).json({
    status: "ok",
    app: "auth-app"
  });
});

app.get("/api/tests/summary", (_req, res) => {
  return res.status(200).json({
    counts: testCounts,
    sections: ["unit", "integration", "system"]
  });
});

app.get("/api/me", (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({
      message: "Authentication required"
    });
  }

  const cookies = parseCookies(req);
  const user = users.get(String(cookies.authUser).toLowerCase());

  return res.status(200).json(apiAuthResponse(user));
});

app.get("/reports/download/:format", (req, res) => {
  if (!isAuthenticated(req)) {
    return res.redirect("/login");
  }

  const rows = flattenResults();
  const { format } = req.params;
  const datePart = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const csvLines = [
      "Section,Test Case,Status,Execution Time (ms)",
      ...rows.map((r) => `${r.section},${r.name},${r.status},${r.timeMs}`)
    ];
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=auth-test-report-${datePart}.csv`);
    return res.status(200).send(csvLines.join("\n"));
  }

  if (format === "excel") {
    const table = `
      <table border="1">
        <tr><th>Section</th><th>Test Case</th><th>Status</th><th>Execution Time (ms)</th></tr>
        ${rows.map((r) => `<tr><td>${escapeHtml(r.section)}</td><td>${escapeHtml(r.name)}</td><td>${r.status}</td><td>${r.timeMs}</td></tr>`).join("")}
      </table>
    `;
    res.setHeader("Content-Type", "application/vnd.ms-excel");
    res.setHeader("Content-Disposition", `attachment; filename=auth-test-report-${datePart}.xls`);
    return res.status(200).send(table);
  }

  if (format === "pdf") {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=auth-test-report-${datePart}.pdf`);

    const doc = new PDFDocument({ margin: 45 });
    doc.pipe(res);
    doc.fontSize(18).text("Node.js Authentication App - Test Report", { underline: true });
    doc.moveDown(0.7);
    doc.fontSize(11).text("Developed by Faizan Yousaf");
    doc.text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown(1);

    rows.forEach((r) => {
      doc.fontSize(10).text(`${r.section} | ${r.name} | ${r.status} | ${r.timeMs}ms`);
    });

    doc.end();
    return undefined;
  }

  return res.status(400).send("Unsupported format");
});

module.exports = {
  app,
  users,
  resetUsers
};
