const puppeteer = require("puppeteer");

const getCrawling = async (req, res) => {
  const decodedUrl = decodeURIComponent(req.params.url);
  const browser = await puppeteer.launch({ headless: true });
  const TIMEOUT = 30000;

  try {
    const page = await browser.newPage();
    await page.goto(decodedUrl);

    let htmlData = await page.evaluate(() => {
      const elements = document.body.querySelectorAll("*");
      const weightIterationCount = 2;

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

        // arr.push("tagName: "+element.tagName);
        // arr.push("className: "+element.className);
        // arr.push("id: "+element.id);
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

    if (!htmlData || htmlData.flat()[0].includes("iframe")) {
      await page.waitForSelector("iframe", { timeout: TIMEOUT });

      const iframeUrl = await page.$eval("iframe", (iframe) => iframe.src);
      await page.goto(iframeUrl);

      htmlData = await page.evaluate(() => {
        const elements = document.body.querySelectorAll("*");
        const weightIterationCount = 2;

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

          // arr.push("tagName: "+element.tagName);
          // arr.push("className: "+element.className);
          // arr.push("id: "+element.id);
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

    return res.status(200).json({
      url: req.params.url,
      // data: htmlData,
      data: getNumericColor(htmlData),
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

const getNumericColor = (nestedArray) => {
  const result = [];
  nestedArray.forEach((rgbArray, idx) => {
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

module.exports = { getCrawling };
