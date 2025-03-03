const express = require("express");

const { getCrawling } = require("../services/crawlingService");
const { getCrawlingTitle } = require("../services/crawlingTitleService");
const { getCrawlingKeyword } = require("../services/crawlingKeywordService");
const {
  getCrawlingContentKeyword,
} = require("../services/crawlingContentService");

const router = express.Router();

router.get("/:url", getCrawling);

router.get("/:url/search", getCrawlingKeyword);
router.get("/:url/all/search", getCrawlingContentKeyword);
router.get("/:url/title/search", getCrawlingTitle);

module.exports = router;
