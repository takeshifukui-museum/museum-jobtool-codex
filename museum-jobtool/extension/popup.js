const statusEl = document.getElementById("status");
const button = document.getElementById("generate");

const setStatus = (text) => {
  statusEl.textContent = text;
};

button.addEventListener("click", () => {
  setStatus("送信中...");
  chrome.runtime.sendMessage({ type: "GENERATE_JOB_DOCX" }, (response) => {
    if (chrome.runtime.lastError) {
      setStatus(`エラー: ${chrome.runtime.lastError.message}`);
      return;
    }
    if (!response) {
      setStatus("不明なエラーが発生しました");
      return;
    }
    if (response.ok) {
      setStatus(`完了: ${response.message}`);
      if (response.scoutText) {
        setStatus(`完了: ${response.message}\n\nスカウト文:\n${response.scoutText}`);
      }
      return;
    }
    setStatus(`エラー: ${response.message}`);
  });
});
