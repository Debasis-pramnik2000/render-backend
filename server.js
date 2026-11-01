const app = require("./app");

const PORT = process.env.PORT || 5000;
// 👇 ei 2 line add korun (upore onno route er sathe)
const profileRoute = require("./routes/profile");
const chatRoute = require("./routes/chat");

// 👇 ei 2 line add korun (app.use("/api/contact", ...) er kache)
app.use("/api/profile", profileRoute);
app.use("/api/chat", chatRoute);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});