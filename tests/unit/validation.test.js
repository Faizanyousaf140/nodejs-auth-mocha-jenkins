const { expect } = require("chai");
const {
  isValidEmail,
  isValidPassword,
  isValidUsername
} = require("../../src/validation");

describe("Validation Logic Unit Tests", () => {
  describe("Email Validation", () => {
    it("accepts valid email format", () => {
      expect(isValidEmail("user@example.com")).to.equal(true);
    });

    it("rejects missing @ symbol", () => {
      expect(isValidEmail("userexample.com")).to.equal(false);
    });

    it("rejects missing domain", () => {
      expect(isValidEmail("user@")).to.equal(false);
    });

    it("rejects empty email", () => {
      expect(isValidEmail("")).to.equal(false);
    });
  });

  describe("Password Validation", () => {
    it("accepts password with 6 or more characters", () => {
      expect(isValidPassword("secret1")).to.equal(true);
    });

    it("rejects short password", () => {
      expect(isValidPassword("12345")).to.equal(false);
    });
  });

  describe("Username Validation", () => {
    it("accepts username with 3 or more characters", () => {
      expect(isValidUsername("john_01")).to.equal(true);
    });

    it("rejects username shorter than 3 chars", () => {
      expect(isValidUsername("ab")).to.equal(false);
    });
  });
});
