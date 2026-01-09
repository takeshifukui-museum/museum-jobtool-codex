const expandPage = async () => {
  const expandables = Array.from(document.querySelectorAll('[aria-expanded="false"]'));
  expandables.forEach((el) => el.click());
  const detailElements = Array.from(document.querySelectorAll("details"));
  detailElements.forEach((detail) => {
    detail.open = true;
  });
  await new Promise((resolve) => setTimeout(resolve, 500));
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXTRACT_PAGE") {
    expandPage()
      .then(() => {
        const rawText = document.body ? document.body.innerText : "";
        sendResponse({
          url: location.href,
          title: document.title,
          rawText,
          siteHint: location.hostname.includes("hrmos") ? "HRMOS" : "unknown"
        });
      })
      .catch(() => {
        sendResponse({
          url: location.href,
          title: document.title,
          rawText: document.body ? document.body.innerText : "",
          siteHint: location.hostname.includes("hrmos") ? "HRMOS" : "unknown"
        });
      });
    return true;
  }
});
