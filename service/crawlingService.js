const puppeteer = require("puppeteer");

const getCrawling = async (req, res) => {
  const decodedUrl = decodeURIComponent(req.params.url);
  const browser = await puppeteer.launch({ headless: true });
  const TIMEOUT = 30000;

  try {
    const page = await browser.newPage();
    await page.goto(decodedUrl);

    let htmlData = await page.$$eval("html", (elements) => {
      return elements.map((e) => e.outerHTML);
    });

    if (!htmlData) {
      await page.waitForSelector("iframe", { timeout: TIMEOUT });

      const iframeUrl = await page.$eval("iframe", (iframe) => iframe.src);
      await page.goto(iframeUrl);

      const hasiframeUrlOfNaver = iframeUrl.startsWith(
        "https://blog.naver.com"
      );
      htmlData = await page.$$eval("html", (elements) => {
        return elements.map((e) => e.outerHTML);
      });

      if (!iframeUrl || !hasiframeUrlOfNaver) {
        throw new Error(`[Invalid iframe URL]`);
      }
    }

    return res.status(200).json({
      url: req.params.url,
      data: htmlData,
    });
  } catch (error) {
    if (!isCheckTrueUrl(decodedUrl)) {
      return res
        .status(400)
        .send({ message: `[Invalid Characters in HTTP request]  ${error}` });
    } else {
      return res
        .status(500)
        .send({ message: `[ServerError occured] ${error}` });
    }
  } finally {
    await browser.close();
  }
};

const isCheckTrueUrl = (url) => {
  /* eslint-disable */
  const urlRegex = /^(http|https):\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/;
  if (urlRegex.test(url)) {
    return true;
  } else {
    return false;
  }
};

module.exports = { getCrawling };
