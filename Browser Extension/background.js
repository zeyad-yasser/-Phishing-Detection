/*global chrome*/

let fromAddress = "";
let body = "";

function clickShowMoreButton() {
  let showMoreButton = document.querySelector(".ajz");
  if (showMoreButton) {
    showMoreButton.click();
  }
}

function extractUrls(emailBody) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const urls = emailBody.match(urlRegex) || [];

  console.log("Extracted URLs:", urls);

  return urls;
}

function extractHeader() {
  let headerNode = document.querySelector(".ajB.gt");
  let headerInfo = headerNode ? headerNode.innerText : "";
  const fieldsToExtract = [
    "from",
    "reply-to",
    "to",
    "date",
    "subject",
    "mailed-by",
    "signed-by",
    "to",
  ];

  let extractedContent = {};
  fieldsToExtract.forEach((field) => {
    let start = headerInfo.indexOf(`${field}:`);
    let end = headerInfo.indexOf("\n", start);

    if (end === -1) {
      end = headerInfo.length;
    }

    let fieldValue = headerInfo
      .substring(start + `${field}:`.length, end)
      .trim();

    extractedContent[field] = fieldValue;
  });

  let toNode = document.querySelector(".ajv:nth-child(3)");
  if (toNode) {
    let toEmails = toNode.innerText
      .replace(/to:\t/g, "")
      .split(",")
      .map((email) => email.trim());
    extractedContent["to"] = toEmails;
  }

  console.log(extractedContent);
}

function extractBodyAndAddress() {
  let bodyNodes = document.getElementsByClassName("gs")[0];
  if (!bodyNodes) {
    bodyNodes = document.getElementById(":p3");
  }

  if (bodyNodes) {
    const anchorTags = bodyNodes.getElementsByTagName("a");

    for (const anchor of anchorTags) {
      anchor.innerText = anchor.href;
    }
  }

  const body = bodyNodes ? bodyNodes.innerText : "";

  console.log(body);

  return body;
}

function checkURLsValidity(urls) {
  urls.forEach((url) => {
    try {
      const parsedURL = new URL(url);
      const hostname = parsedURL.hostname;
      const subdomains = hostname.split(".").length - 2;

      if (parsedURL.protocol !== "http:" && parsedURL.protocol !== "https:") {
        console.error("Invalid URL:", url);
        return;
      }

      console.log("Number of Subdomains:", subdomains);

      fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=<API_KEY>`, {
        method: "POST",
        body: JSON.stringify({
          client: {
            clientId: "karimgp",
            clientVersion: "1.5.2"
          },
          threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url: url }],
          },
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          if (data && data.matches && data.matches.length > 0) {
            console.log("URL is malicious:", url);
            console.log("Threat type:", data.matches[0].threatType);
          } else {
            console.log("URL is safe:", url);
          }
        })
        .catch((error) => {
          console.error("Error checking URL with Google Safe Browsing API:", error);
        });

      fetch(
        `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=<API_KEY>&domainName=${hostname}`
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.text();
        })
        .then((data) => {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(data, "text/xml");

          const creationDateNode = xmlDoc.querySelector("createdDate");
          if (!creationDateNode) {
            throw new Error("Creation date not found in WHOIS data.");
          }

          const creationDate = new Date(creationDateNode.textContent);
          const currentDate = new Date();
          const ageInYears =
            (currentDate - creationDate) / (1000 * 60 * 60 * 24 * 365);

          console.log("Creation Date:", creationDate);
          console.log("Domain Age (Years):", ageInYears.toFixed(2));

          const tld = parsedURL.hostname.split(".").pop();
          console.log("Top-Level Domain (TLD):", tld);
        })
        .catch((error) => {
          console.error("Error fetching WHOIS data:", error);
        });
    } catch (error) {
      console.error("Error parsing URL:", url);
    }
  });
}


async function promptGPT(body) {
  try {
    const response = await fetch(`https://api.openai.com/v1/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer <API_KEY>",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-instruct",
        prompt: `is this a phishing email? explain why or why not? never mind the dates\n${body}`,
        max_tokens: 2000,
        temperature: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0 || !data.choices[0].text) {
      throw new Error("Unexpected response format or empty response.");
    }

    console.log("GPT Response:", data.choices[0].text.trim());
    return data.choices[0].text.trim();
  } catch (error) {
    console.error("Error in GPT request:", error);
    return "";
  }
}

setTimeout(async () => {
  clickShowMoreButton();
  extractHeader();
  const extractedBody = extractBodyAndAddress();
  const extractedURLs = extractUrls(extractedBody);
  if (extractedBody) {
    const gptResponse = await promptGPT(extractedBody);
    checkURLsValidity(extractedURLs);

    fetch("http://localhost:5000/predict", {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body: extractedBody }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data.message);
        console.log(data);

        let div = document.createElement("div");
        div.innerText = data.message + "\n\n" + gptResponse;
        div.style.position = "fixed";
        div.style.top = "200px";
        div.style.right = "600px";
        div.style.backgroundColor =
          data.output === "Phishing" ? "#DC143C" : "#2E8B57";
        div.style.color = "#f4f4f4";
        div.style.padding = "10px";
        div.style.borderRadius = "5px";
        div.style.zIndex = "9999";

        let closeButton = document.createElement("button");
        closeButton.innerText = "X";
        closeButton.style.marginLeft = "10px";
        closeButton.style.background = "transparent";
        closeButton.style.border = "none";
        closeButton.style.color = "#f4f4f4";
        closeButton.style.cursor = "pointer";

        closeButton.onclick = function () {
          div.remove();
        };

        div.appendChild(closeButton);

        document.body.appendChild(div);
      })
      .catch((error) => {
        console.error(error);
      });
  }
}, 10000);
