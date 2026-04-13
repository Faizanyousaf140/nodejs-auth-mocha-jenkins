const { parseHtml } = require("../utils/helper");

class LoginPage {
  constructor(client) {
    this.client = client;
    this.path = "/login";
    this.locators = {
      form: "#loginForm",
      emailInput: "#loginEmail",
      passwordInput: "#loginPassword",
      submitButton: "#loginButton",
      statusMessage: "#statusMessage",
      fieldErrors: ".field-error"
    };
  }

  open() {
    return this.client.get(this.path);
  }

  submit({ email, password }) {
    return this.client.post(this.path).type("form").send({ email, password });
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

module.exports = LoginPage;
