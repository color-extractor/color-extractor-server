const express = require("express");

const crawlRouter = require("./routes/crawlRoute");
const cors = require("cors");
const app = express();

app.use(cors());

app.use("/crawl", crawlRouter);

module.exports = app;
