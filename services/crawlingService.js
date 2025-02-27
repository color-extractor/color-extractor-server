const puppeteer = require("puppeteer");
const { createCanvas, loadImage } = require("canvas");

const getCrawling = async (req, res) => {
  const decodedUrl = decodeURIComponent(req.params.url);
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
    ],
  });
  const TIMEOUT = 30000;

  try {
    const page = await browser.newPage();
    await page.goto(decodedUrl);

    let bodyData = await page.evaluate(() => {
      const elements = document.body.querySelectorAll("*");
      const weightIterationCount = 200;

      const getWeightedValueHtmlElement = (value) => {
        const filter = [
          "H1",
          "H2",
          "H3",
          "H4",
          "H5",
          "H6",
          "HEADER",
          "FOOTER",
          "MAIN",
          "NAV",
          "ADDRESS",
        ];
        if (
          filter.includes(value.tagName.toUpperCase()) ||
          filter.includes(value.id.toString().toUpperCase())
        ) {
          return true;
        }
      };

      const objectArray = [...elements].map((element) => {
        const allCssPropertiesOfElement = window.getComputedStyle(element);
        const arr = [];

        if (element.tagName === "iframe") {
          arr.push("tagName: " + element.tagName);
        }

        for (const propertyName in allCssPropertiesOfElement) {
          const propertyValue =
            allCssPropertiesOfElement.getPropertyValue(propertyName);

          if (
            propertyValue &&
            (propertyName.includes("color") ||
              propertyName.includes("Color") ||
              propertyName.includes("COLOR") ||
              propertyValue.includes("rgb") ||
              propertyValue.includes("RGB") ||
              propertyValue.includes("!important"))
          ) {
            if (propertyName.includes("border")) {
              continue;
            }
            if (getWeightedValueHtmlElement(element)) {
              for (let i = 0; i < weightIterationCount; i++) {
                arr.push(propertyName + ": " + propertyValue);
              }
            }
            arr.push(propertyName + ": " + propertyValue);
          }
        }
        return arr;
      });
      return objectArray;
    });

    if (!bodyData || bodyData.flat()[0].includes("iframe")) {
      await page.waitForSelector("iframe", { timeout: TIMEOUT });

      const iframeUrl = await page.$eval("iframe", (iframe) => iframe.src);
      await page.goto(iframeUrl);

      bodyData = await page.evaluate(() => {
        const elements = document.body.querySelectorAll("*");
        const weightIterationCount = 200;

        const getWeightedValueHtmlElement = (value) => {
          const filter = [
            "H1",
            "H2",
            "H3",
            "H4",
            "H5",
            "H6",
            "HEADER",
            "FOOTER",
            "MAIN",
            "NAV",
            "ADDRESS",
          ];
          if (
            filter.includes(value.tagName.toUpperCase()) ||
            filter.includes(value.id.toString().toUpperCase())
          ) {
            return true;
          }
        };

        const objectArray = [...elements].map((element) => {
          const allCssPropertiesOfElement = window.getComputedStyle(element);
          const arr = [];

          for (const propertyName in allCssPropertiesOfElement) {
            const propertyValue =
              allCssPropertiesOfElement.getPropertyValue(propertyName);
            if (
              propertyValue &&
              (propertyName.includes("color") ||
                propertyName.includes("Color") ||
                propertyName.includes("COLOR") ||
                propertyValue.includes("rgb") ||
                propertyValue.includes("RGB") ||
                propertyValue.includes("!important"))
            ) {
              if (propertyName.includes("border")) {
                continue;
              }
              if (getWeightedValueHtmlElement(element)) {
                for (let i = 0; i < weightIterationCount; i++) {
                  arr.push(propertyName + ": " + propertyValue);
                }
              }
              arr.push(propertyName + ": " + propertyValue);
            }
          }
          return arr;
        });
        return objectArray;
      });

      if (!iframeUrl) {
        throw new Error(`[Invalid iframe URL]`);
      }
    }

    const faviconUrl = await getFaviconUrl(page);
    const faviconArray = faviconUrl
      ? (await getFaviconRgbData(faviconUrl)) || []
      : [];

    const cssRgbArray = convetTextToRgb(bodyData);
    const cssAndFaviconRgbArray = [
      ...faviconArray,
      ...cssRgbArray,
      ...faviconArray,
    ];

    return res.status(200).json({
      url: req.params.url,
      data: cssAndFaviconRgbArray,
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

const convetTextToRgb = (nestedArray) => {
  const result = [];
  nestedArray.forEach((rgbArray) => {
    rgbArray.forEach((rgbText) => {
      const rgbMatch = rgbText.match(/\((.*?)\)/g);
      rgbMatch.forEach((rgbData) => {
        let numberArray = [];
        if (rgbData.match(/\d+(\.\d+)?/g)) {
          numberArray = rgbData.match(/\d+(\.\d+)?/g).map(Number);
        } else {
          return;
        }
        if (numberArray.length <= 4) {
          if (numberArray.length === 4) {
            numberArray.pop();
            result.push(numberArray);
          } else {
            result.push(numberArray);
          }
        }
      });
    });
  });
  return result;
};

const getFaviconUrl = async (page) => {
  const faviconUrl = await page.evaluate(() => {
    const favicons = document.querySelectorAll("link[rel*='icon']");

    const faviconUrlArray = [...favicons].map((favicon) => {
      if (favicon.href.includes(".png") || favicon.href.includes(".svg")) {
        return favicon.href;
      }
    });
    return faviconUrlArray.filter(Boolean)[0];
  });

  return faviconUrl;
};

const getFaviconRgbData = async (faviconUrl) => {
  if (!faviconUrl) {
    return null;
  }

  const image = await loadImage(faviconUrl);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0, image.width, image.height);
  const imageData = ctx.getImageData(0, 0, image.width, image.height).data;

  const rgbData = [];
  for (let i = 0; i < imageData.length; i += 4) {
    rgbData.push([imageData[i], imageData[i + 1], imageData[i + 2]]);
  }

  return rgbData;
};

module.exports = { getCrawling };
