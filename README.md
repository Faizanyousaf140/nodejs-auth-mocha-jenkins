# Node.js Authentication App — Mocha/Chai + Jenkins CI/CD

> Assignment project by **Faizan Yousaf** | 

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Setup & Run](#setup--run)
- [Testing](#testing)
- [Test Summary](#test-summary)
- [Jenkins Pipeline](#jenkins-pipeline)
- [Screenshots](#screenshots)
- [Extra Credit](#extra-credit)
- [Submission Artifacts](#submission-artifacts)

---

## Project Overview

A Node.js + Express authentication system with Login and Signup functionality. The project demonstrates:

- Clean separation of validation logic from UI
- Page Object Model (POM)-based test architecture using Mocha + Chai
- Full CI/CD pipeline via Jenkins covering install, unit tests, integration tests, and report publishing

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js v18.x |
| Framework | Express |
| Unit Testing | Mocha + Chai |
| Test Architecture | Page Object Model (POM) |
| CI/CD | Jenkins (WAR file) |
| Reporting | HTML Publisher Plugin + JUnit XML |
| Version Control | Git |

---

## Folder Structure

```
project/
├── src/
│   ├── app.js               # Express app setup
│   ├── server.js            # Server entry point
│   └── validation.js        # Pure validation logic (unit-testable)
├── tests/
│   ├── unit/
│   │   └── validation.test.js   # Email, password, username validation
│   ├── integration/
│   │   └── auth.test.js         # Login/Signup UI and form behavior
│   ├── pages/                   # Page Object Model classes
│   │   ├── LoginPage.js
│   │   └── SignupPage.js
│   └── utils/
│       └── helper.js            # Shared test helpers
├── Jenkinsfile
└── package.json
```

### Page Object Model Pattern

Each page class owns three things: locators, actions, and assertions. Tests never touch raw selectors directly.

```js
// LoginPage.js (pattern)
class LoginPage {
  fill(email, password) { ... }
  submit()              { ... }
  getError()            { ... }
}
```

---

## Prerequisites

- Node.js v18.x and npm
- Git
- Jenkins (WAR file) for CI pipeline

---

## Setup & Run

```bash
# 1. Clone the repository
git clone <repo-url>
cd <project-folder>

# 2. Install all dependencies (includes mocha + chai as devDependencies)
npm install

# 3. Start the application
npm start
```

Open in browser:
- http://localhost:3000/login
- http://localhost:3000/signup

> **Checkpoint:** App runs on port 3000 with no errors.

---

## Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with JUnit XML report (used by Jenkins)
npm run test:ci
```

> **Checkpoint:** All tests pass locally before pushing to Jenkins.

---

## Test Summary

| Type | Count | Status |
|---|---|---|
| Unit Tests | 8 | ✅ Pass |
| Integration Tests | 18 | ✅ Pass |
| **Total** | **26** | **✅ Pass** |

### Unit Tests — Validation Logic

| Test Case | Status |
|---|---|
| Valid email format | ✅ |
| Email missing @ symbol | ✅ |
| Email missing domain | ✅ |
| Empty email field | ✅ |
| Password ≥ 6 characters (valid) | ✅ |
| Password < 6 characters (invalid) | ✅ |
| Username ≥ 3 characters (valid) | ✅ |
| Username < 3 characters (invalid) | ✅ |

### Integration Tests — Login Page

| Test Case | Status |
|---|---|
| Valid credentials → successful login | ✅ |
| Wrong password → error message displayed | ✅ |
| Non-existing user → validation message | ✅ |
| Empty form submit → required field errors | ✅ |
| Invalid email format → validation error | ✅ |

### Integration Tests — Signup Page

| Test Case | Status |
|---|---|
| Valid data → success message | ✅ |
| Missing fields → validation errors | ✅ |
| Short password → error message | ✅ |
| Invalid email → validation error | ✅ |
| Short username → error message | ✅ |

### Advanced / Edge Case Tests

| Test Case | Type |
|---|---|
| Auto-fill with random/incorrect inputs | Boundary |
| Min/max input length boundary testing | Boundary |
| Special characters in all fields | Edge |
| Rapid multiple form submissions (spam) | Edge |
| Whitespace-only inputs | Edge |
| SQL injection strings in form fields | Security |
| Very long input strings (overflow test) | Boundary |
| Case sensitivity (email/username) | Edge |

---

## Jenkins Pipeline

Jenkins is run locally via WAR file on `localhost:8080`.

### Plugins Required

- NodeJS Plugin
- HTML Publisher Plugin
- Git Plugin

### Pipeline Stages

```
Checkout → Install Dependencies → Unit Tests → Integration Tests → Generate Reports
```

| Stage | Command | Description |
|---|---|---|
| Checkout | — | Pull source from Git (branch: main) |
| Install | `npm ci` | Clean install, reproducible build |
| Unit Tests | `npm run test:unit` | Fails pipeline on any test failure |
| Integration Tests | `npm run test:integration` | Full form + UI behavior tests |
| Reports | HTML Publisher | Publishes HTML + JUnit XML report |

### Post-Build Actions

- **Success:** Archive test reports, mark build green
- **Failure:** Print error summary, mark build red

> **Checkpoint:** All 5 stages green, reports published and viewable in Jenkins.

### Jenkinsfile (summary)

```groovy
pipeline {
  agent any
  tools { nodejs 'NodeJS-18' }
  stages {
    stage('Checkout')             { steps { checkout scm } }
    stage('Install')              { steps { sh 'npm ci' } }
    stage('Unit Tests')           { steps { sh 'npm run test:unit' } }
    stage('Integration Tests')    { steps { sh 'npm run test:integration' } }
    stage('Reports')              { steps { publishHTML(...) } }
  }
  post {
    success { echo 'All tests passed.' }
    failure { echo 'Build failed. Check test output.' }
  }
}
```

## Extra Credit

- [x] Advanced edge-case testing (SQL injection, overflow, whitespace)
- [ ] Code coverage integration using `nyc`
- [ ] Email notifications in Jenkins (Email Extension Plugin)
- [ ] Multi-branch Jenkins pipeline


## Author

**Faizan Yousaf**  
