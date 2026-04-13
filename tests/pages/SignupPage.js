const { parseHtml } = require("../utils/helper");

class SignupPage {
  constructor(client) {
    this.client = client;
    this.path = "/signup";
    this.locators = {
      form: "#signupForm",
      usernameInput: "#signupUsername",
      emailInput: "#signupEmail",
      passwordInput: "#signupPassword",
      submitButton: "#signupButton",
      statusMessage: "#statusMessage",
      fieldErrors: ".field-error"
    };
  }

  open() {
    return this.client.get(this.path);
  }

  submit({ username, email, password }) {
    return this.client.post(this.path).type("form").send({ username, email, password });
  }

  getStatusMessage(response) {
    const $ = parseHtml(response.text);
    return $(this.locators.statusMessage).text().trim();
  }

  getFieldErrors(response) {
    const $ = parseHtml(response.text);
    return $(this.locators.fieldErrors)
      .map((_, el) => $(el).text().trim())
      .get();
  }

  hasValidationError(response, text) {
    return this.getFieldErrors(response).includes(text);
  }
}

module.exports = SignupPage;
