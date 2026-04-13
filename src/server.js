const { app } = require("./app");

const port = process.env.PORT || 3000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Auth app running at http://localhost:${port}`);
});
