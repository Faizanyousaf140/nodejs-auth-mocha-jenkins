const cheerio = require("cheerio");
const request = require("supertest");

function parseHtml(html) {
  return cheerio.load(html);
}

function randomString(prefix = "user") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function randomEmail() {
  return `${randomString("mail")}@example.com`;
}

function buildClient(app) {
  return request(app);
}

module.exports = {
  parseHtml,
  randomString,
  randomEmail,
  buildClient
};
