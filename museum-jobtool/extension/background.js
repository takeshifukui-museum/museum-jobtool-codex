const API_URL = "http://localhost:3000/api/generate";

const base64ToBlob = (base64, contentType) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: contentType });
};

const extractFromTab = async (tabId) => {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { type: "EXTRACT_PAGE" }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(response);
    });
  });
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "GENERATE_JOB_DOCX") {
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    try {
      const tab = tabs[0];
      if (!tab || !tab.id) {
        sendResponse({ ok: false, message: "アクティブタブが見つかりません" });
        return;
      }
      const payload = await extractFromTab(tab.id);
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          outputs: ["job_docx", "scout_text"]
        })
      });
      if (!response.ok) {
        const responseText = await response.text();
        let detailMessage = responseText;
        try {
          const errorData = JSON.parse(responseText);
          detailMessage =
            errorData?.error?.detail || errorData?.error?.message || errorData?.error?.code || responseText;
        } catch (parseError) {
          detailMessage = responseText || "APIエラー";
        }
        sendResponse({ ok: false, message: detailMessage });
        return;
      }
      const data = await response.json();
      const docxBlob = base64ToBlob(
        data.docx,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      const url = URL.createObjectURL(docxBlob);
      await chrome.downloads.download({
        url,
        filename: "museum_jobposting.docx",
        saveAs: true
      });
      sendResponse({ ok: true, message: "ダウンロードしました", scoutText: data.scoutText || "" });
    } catch (error) {
      sendResponse({ ok: false, message: error?.message || "エラーが発生しました" });
    }
  });

  return true;
});
