const express = require("express");
const router = express.Router();
const portfolio = require("../data/portfolio.json");

router.get("/", (req, res) => {
  res.json(portfolio);
});

module.exports = router;