const express = require("express");

const crawlRouter = require("./routes/crawlRoute");

const app = express();

app.use("/crawl", crawlRouter);

module.exports = app;
