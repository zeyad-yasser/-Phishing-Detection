/*global chrome*/

let fromAddress = "";
let body = "";

function clickShowMoreButton() {
  let showMoreButton = document.querySelector(".ajz");
  if (showMoreButton) {
    showMoreButton.click();
  }
}

function extractUrls() {
  const anchorTags = document.querySelectorAll("a");
  const urls = [];

  for (const anchor of anchorTags) {
    urls.push(anchor.href);
  }

  console.log("Extracted URLs:", urls);
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
  let body = bodyNodes ? bodyNodes.innerText : "";

  console.log(body);

  return body;
}



setTimeout(() => {
  clickShowMoreButton();
  extractHeader();
  extractUrls();
  const extractedBody = extractBodyAndAddress();

  if (extractedBody) {
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
        div.innerText = data.message;
        div.style.position = "fixed";
        div.style.top = "200px";
        div.style.right = "600px";
        div.style.backgroundColor = data.output === 1 ? "#DC143C" : "#2E8B57";
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
