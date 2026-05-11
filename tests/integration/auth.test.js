const { expect } = require("chai");
const { app, resetUsers } = require("../../src/app");
const LoginPage = require("../pages/LoginPage");
const SignupPage = require("../pages/SignupPage");
const { buildClient, randomEmail, randomString } = require("../utils/helper");

describe("Auth Integration Tests (POM)", () => {
  let client;
  let loginPage;
  let signupPage;

  beforeEach(() => {
    resetUsers();
    client = buildClient(app);
    loginPage = new LoginPage(client);
    signupPage = new SignupPage(client);
  });

  describe("Login Page Scenarios", () => {
    it("allows login with valid credentials", async () => {
      const response = await loginPage.submit({
        email: "demo@example.com",
        password: "secret123"
      });

      expect(response.status).to.equal(200);
      expect(loginPage.getStatusMessage(response)).to.equal("Login successful");
    });

    it("shows error when password is wrong", async () => {
      const response = await loginPage.submit({
        email: "demo@example.com",
        password: "wrongpass"
      });

      expect(response.status).to.equal(401);
      expect(loginPage.getStatusMessage(response)).to.equal("Incorrect password");
    });

    it("shows message for non-existing user", async () => {
      const response = await loginPage.submit({
        email: "nouser@example.com",
        password: "secret123"
      });

      expect(response.status).to.equal(404);
      expect(loginPage.getStatusMessage(response)).to.equal("User does not exist");
    });

    it("shows required-field errors on empty login form", async () => {
      const response = await loginPage.submit({ email: "", password: "" });
      const errors = loginPage.getFieldErrors(response);

      expect(response.status).to.equal(400);
      expect(errors).to.include("Email is required");
      expect(errors).to.include("Password is required");
    });

    it("shows invalid email format message on login", async () => {
      const response = await loginPage.submit({
        email: "bad-email",
        password: "secret123"
      });

      expect(response.status).to.equal(400);
      expect(loginPage.hasValidationError(response, "Invalid email format")).to.equal(true);
    });
  });

  describe("Signup Page Scenarios", () => {
    it("registers a user with valid data", async () => {
      const response = await signupPage.submit({
        username: "new_user",
        email: "newuser@example.com",
        password: "password123"
      });

      expect(response.status).to.equal(201);
      expect(signupPage.getStatusMessage(response)).to.equal("Signup successful");
    });

    it("shows errors for missing fields", async () => {
      const response = await signupPage.submit({ username: "", email: "", password: "" });
      const errors = signupPage.getFieldErrors(response);

      expect(response.status).to.equal(400);
      expect(errors).to.include("Username is required");
      expect(errors).to.include("Email is required");
      expect(errors).to.include("Password is required");
    });

    it("shows error for short password", async () => {
      const response = await signupPage.submit({
        username: "normalname",
        email: "normal@example.com",
        password: "123"
      });

      expect(response.status).to.equal(400);
      expect(signupPage.hasValidationError(response, "Password must be 6-64 characters with no spaces")).to.equal(true);
    });

    it("shows error for invalid email", async () => {
      const response = await signupPage.submit({
        username: "normalname",
        email: "wrong-email",
        password: "123456"
      });

      expect(response.status).to.equal(400);
      expect(signupPage.hasValidationError(response, "Invalid email format")).to.equal(true);
    });

    it("shows error for short username", async () => {
      const response = await signupPage.submit({
        username: "ab",
        email: "normal@example.com",
        password: "123456"
      });

      expect(response.status).to.equal(400);
      expect(signupPage.hasValidationError(response, "Username must be 3-30 characters and contain only letters, numbers, or underscore")).to.equal(true);
    });
  });

  describe("Advanced Interaction Scenarios", () => {
    it("rejects random invalid email inputs", async () => {
      const invalidEmails = ["plain", "x@y", "@domain.com", "name@domain", "a b@domain.com"];

      for (const email of invalidEmails) {
        const response = await signupPage.submit({
          username: "randomuser",
          email,
          password: "password123"
        });

        expect(response.status).to.equal(400);
        expect(signupPage.hasValidationError(response, "Invalid email format")).to.equal(true);
      }
    });

    it("accepts boundary username length of 3 characters", async () => {
      const response = await signupPage.submit({
        username: "abc",
        email: randomEmail(),
        password: "password123"
      });

      expect(response.status).to.equal(201);
      expect(signupPage.getStatusMessage(response)).to.equal("Signup successful");
    });

    it("accepts boundary password length of 6 characters", async () => {
      const response = await signupPage.submit({
        username: randomString("u"),
        email: randomEmail(),
        password: "123456"
      });

      expect(response.status).to.equal(201);
    });

    it("rejects special characters in username", async () => {
      const response = await signupPage.submit({
        username: "bad$user",
        email: randomEmail(),
        password: "password123"
      });

      expect(response.status).to.equal(400);
      expect(signupPage.hasValidationError(response, "Username must be 3-30 characters and contain only letters, numbers, or underscore")).to.equal(true);
    });

    it("normalizes email casing and allows login", async () => {
      const created = await signupPage.submit({
        username: "caseuser",
        email: "CaseUser@Example.com",
        password: "password123"
      });

      expect(created.status).to.equal(201);

      const login = await loginPage.submit({
        email: "caseuser@example.com",
        password: "password123"
      });

      expect(login.status).to.equal(200);
      expect(loginPage.getStatusMessage(login)).to.equal("Login successful");
    });

    it("handles rapid multiple submissions by rejecting duplicate email", async () => {
      const payload = {
        username: "rapiduser",
        email: "rapid@example.com",
        password: "password123"
      };

      const first = await signupPage.submit(payload);
      const second = await signupPage.submit(payload);

      expect(first.status).to.equal(201);
      expect(second.status).to.equal(409);
      expect(signupPage.getStatusMessage(second)).to.equal("An account with this email already exists");
    });

    it("rejects username longer than 30 characters", async () => {
      const response = await signupPage.submit({
        username: "x".repeat(31),
        email: randomEmail(),
        password: "password123"
      });

      expect(response.status).to.equal(400);
    });

    it("rejects password containing spaces", async () => {
      const response = await signupPage.submit({
        username: "spaceuser",
        email: randomEmail(),
        password: "pass 123"
      });

      expect(response.status).to.equal(400);
      expect(signupPage.hasValidationError(response, "Password must be 6-64 characters with no spaces")).to.equal(true);
    });
  });

  describe("API Routes", () => {
    it("returns a brief health response", async () => {
      const response = await client.get("/api/health");

      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({
        status: "ok",
        app: "auth-app"
      });
    });

    it("returns a short test summary", async () => {
      const response = await client.get("/api/tests/summary");

      expect(response.status).to.equal(200);
      expect(response.body.counts.total).to.equal(29);
      expect(response.body.sections).to.deep.equal(["unit", "integration", "system"]);
    });

    it("returns the current user profile after login", async () => {
      const loginResponse = await loginPage.submit({
        email: "demo@example.com",
        password: "secret123"
      });

      const cookieHeader = loginResponse.headers["set-cookie"][0];
      const profileResponse = await client.get("/api/me").set("Cookie", cookieHeader);

      expect(profileResponse.status).to.equal(200);
      expect(profileResponse.body).to.deep.equal({
        username: "demo_user",
        email: "demo@example.com"
      });
    });
  });
});
