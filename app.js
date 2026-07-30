const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv")

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const contactRoute = require("./routes/contact");

app.use("/api/contact", contactRoute);

app.get("/", (req, res) => {
  res.send("Portfolio Backend Running...");
});

module.exports = app;