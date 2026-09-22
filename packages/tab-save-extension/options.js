function save_options() {
    var output1 = document.getElementById("output1").value;
    var output2 = document.getElementById("output2").value;
    var emailadd = document.getElementById("emailadded").value;
    var remoteUrl = document.getElementById("remoteUrl").value.trim();
    var machineId = document.getElementById("machineId").value.trim();
    var authToken = document.getElementById("authToken").value.trim();
    var exportInterval = parseInt(document.getElementById("exportInterval").value, 10) || 5;

    chrome.storage.sync.set({
        output_choice1: output1,
        output_choice2: output2,
        output_emailadd: emailadd,
        tabSaveRemoteUrl: remoteUrl,
        tabSaveAuthToken: authToken,
        exportInterval: exportInterval
    }, function() {
        chrome.storage.local.set({ tabSaveMachineId: machineId });
        var status = document.getElementById("status");
        status.innerHTML = "Options Saved.";
        chrome.runtime.sendMessage({ type: "tabSaveRunNow" });
        setTimeout(function () {
            status.innerHTML = "";
        }, 750);
    });
}

function restore_options() {
    chrome.storage.sync.get([
        "output_choice1", "output_choice2", "output_emailadd",
        "tabSaveRemoteUrl", "tabSaveAuthToken", "exportInterval"
    ], function(syncResult) {
        chrome.storage.local.get(["tabSaveMachineId"], function(localResult) {
        var favorite1 = syncResult.output_choice1;
        if (favorite1) {
            var select = document.getElementById("output1");
            for (var i = 0; i < select.children.length; i++) {
                var child = select.children[i];
                if (child.value == favorite1) {
                    child.selected = "true";
                    break;
                }
            }
        }
        var favorite2 = syncResult.output_choice2;
        if (favorite2) {
            var select = document.getElementById("output2");
            for (var i = 0; i < select.children.length; i++) {
                var child = select.children[i];
                if (child.value == favorite2) {
                    child.selected = "true";
                    break;
                }
            }
        }
        // 恢复 email
        var emailadd = syncResult.output_emailadd || "";
        document.getElementById("emailadded").value = emailadd;
        // 恢复 remote settings
        document.getElementById("remoteUrl").value = syncResult.tabSaveRemoteUrl || "http://localhost:3000/api/tabs";
        var machineId = (localResult.tabSaveMachineId || "").trim();
        if (!machineId) {
            machineId = "ts-" + Math.random().toString(36).slice(2, 10).toUpperCase();
            chrome.storage.local.set({ tabSaveMachineId: machineId });
        }
        document.getElementById("machineId").value = machineId;
        document.getElementById("authToken").value = syncResult.tabSaveAuthToken || "";
        document.getElementById("exportInterval").value = syncResult.exportInterval || 5;
        displaySyncStatus();
        });
    });
}

function displaySyncStatus() {
    chrome.storage.sync.get(["tabSaveSyncStatus", "tabSaveLastCallAt"], function(result) {
        var statusElem = document.getElementById("syncStatus");
        var syncStatus = result.tabSaveSyncStatus || "";
        var lastCallAt = result.tabSaveLastCallAt || "";
        var shortTime = "";
        if (lastCallAt) {
            var d = new Date(lastCallAt);
            shortTime = isNaN(d.getTime()) ? lastCallAt : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        if (syncStatus || lastCallAt) {
            statusElem.textContent = shortTime ? `${shortTime} - ${syncStatus}` : syncStatus;
            statusElem.style.display = "block";
        } else {
            statusElem.textContent = "";
            statusElem.style.display = "none";
        }
    });
}

chrome.storage.onChanged.addListener(function(changes, area) {
    if (area === "sync" && (changes.tabSaveSyncStatus || changes.tabSaveLastCallAt)) {
        displaySyncStatus();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    restore_options();
    document.getElementById('save').addEventListener('click', save_options);
    document.getElementById('output1').addEventListener('change', save_options);
    document.getElementById('output2').addEventListener('change', save_options);
});