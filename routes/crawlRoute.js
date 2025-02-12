const express = require("express");

const { getCrawling } = require("../service/crawlingService");

const router = express.Router();

router.get("/:url", getCrawling);

module.exports = router;
