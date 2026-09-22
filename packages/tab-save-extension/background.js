chrome.runtime.onInstalled.addListener(() => {
  console.log("extension installed");
  setExportAlarm();
});

chrome.runtime.onStartup && chrome.runtime.onStartup.addListener(() => {
  console.log("extension started");
  setExportAlarm();
});

function setExportAlarm() {
  chrome.storage.sync.get(["exportInterval"], (result) => {
    const interval = parseInt(result.exportInterval, 10) || 5;
    chrome.alarms.create("exportTabs", { periodInMinutes: interval });
    console.log("alarm set for every", interval, "minutes");
    exportTabsAsMarkdown();
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "tabSaveRunNow") {
    setExportAlarm();
    sendResponse({ ok: true });
    return true;
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  console.log("alarm triggered:", alarm.name);
  if (alarm.name === "exportTabs") {
    exportTabsAsMarkdown();
  }
});

async function contentHash(content) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(content));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function exportTabsAsMarkdown() {
  chrome.tabs.query({}, async (tabs) => {
    const content = `${tabs.map((tab) => `- [${tab.title}](${tab.url})`).join("\n")}\n`;

    chrome.storage.sync.get([
      "tabSaveRemoteUrl",
      "tabSaveRemoteFailCount",
      "tabSaveAuthToken"
    ], (syncResult) => {
      chrome.storage.local.get(["tabSaveMachineId", "tabSaveLastContentHash"], async (localResult) => {
        const remoteUrl = syncResult.tabSaveRemoteUrl || "http://localhost:3000/api/tabs";
        const failCount = syncResult.tabSaveRemoteFailCount || 0;
        const authToken = (syncResult.tabSaveAuthToken || "changeme").trim();
        let machineId = (localResult.tabSaveMachineId || "").trim();
        if (!machineId) {
          machineId = "ts-" + Math.random().toString(36).slice(2, 10).toUpperCase();
          chrome.storage.local.set({ tabSaveMachineId: machineId });
        }

        const hash = await contentHash(content);
        if (hash === localResult.tabSaveLastContentHash) {
          chrome.storage.sync.set({ tabSaveSyncStatus: "Unchanged" });
          return;
        }

        const FAIL_THRESHOLD = 3;
        const lastCallAt = new Date().toISOString();
        chrome.storage.sync.set({
          tabSaveLastCallAt: lastCallAt,
          tabSaveSyncStatus: "Syncing..."
        });

        fetch(remoteUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
          },
          body: JSON.stringify({ content, machine_id: machineId }),
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}`);
            }
            console.log("✅ Tabs exported successfully:", res.status);
            chrome.storage.local.set({ tabSaveLastContentHash: hash });
            chrome.storage.sync.set({
              tabSaveRemoteFailCount: 0,
              tabSaveSyncStatus: "Success"
            });
          })
          .catch((err) => {
            const newFailCount = failCount + 1;
            const errorObj = { tabSaveRemoteFailCount: newFailCount };
            if (newFailCount >= FAIL_THRESHOLD) {
              errorObj.tabSaveSyncStatus = "Stopped after 3 failed attempts";
              chrome.alarms.clear("exportTabs");
              console.warn("⚠️ Remote server unreachable, alarm stopped.", err);
            } else {
              errorObj.tabSaveSyncStatus = `Warning: failed attempt ${newFailCount}/${FAIL_THRESHOLD}`;
              console.warn("⚠️ Warning:", err);
            }
            chrome.storage.sync.set(errorObj);
          });
      });
    });
  });
}

// Listen for remote URL changes, reset failure count and error status, and restart alarm
chrome.storage.onChanged.addListener(function(changes, area) {
  if (area === "sync" && changes.tabSaveRemoteUrl) {
    chrome.storage.sync.set({
      tabSaveRemoteFailCount: 0,
      tabSaveSyncStatus: ""
    }, setExportAlarm);
  }
});
