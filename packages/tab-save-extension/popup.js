/*
 * Tab Save - Chrome Extension
 * Original Author: Timothy Jones (C) 2013
 * Maintained and updated by: Aaron (C) 2025
 * Licensed under the GNU General Public License v3.0
 * https://www.gnu.org/licenses/gpl-3.0.html
 */

const monthname = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function geturls() {
    chrome.storage.sync.get(["output_choice1", "output_choice2", "output_emailadd"], function(syncResult) {
        var favorite1 = syncResult.output_choice1 || "text";
        var favorite2 = syncResult.output_choice2 || "html";
        var emailadd = syncResult.output_emailadd || "";

        const now = new Date();
        const dateStr = `${monthname[now.getMonth()]}. ${now.getDate()} ${now.getFullYear()}`;
        const tabFormatters = {
            html: {
                text:   tab => `<b>${tab.title}</b>:<br/><a href="${tab.url}">${tab.url}</a><br/><br/>`,
                simple: tab => `<a href="${tab.url}">${tab.url}</a><br/>`,
                csv1:   tab => `<b>"${tab.title}"</b>, "<a href=\"${tab.url}\">${tab.url}</a>"<br/>`,
                csv2:   tab => `"${dateStr}", <b>"${tab.title}"</b>, "<a href=\"${tab.url}\">${tab.url}</a>"<br/>`,
                csv3:   tab => `"${dateStr}", "<a href=\"${tab.url}\">${tab.url}</a>"<br/>`
            },
            plain: {
                text:   tab => `${tab.title}:\n${tab.url}\n\n`,
                simple: tab => `${tab.url}\n`,
                csv1:   tab => `"${tab.title}", "${tab.url}"\n`,
                csv2:   tab => `"${dateStr}", "${tab.title}", "${tab.url}"\n`,
                csv3:   tab => `"${dateStr}", "${tab.url}"\n`,
                markdown: tab => `- [${tab.title}](${tab.url})\n`
            }
        };

        let formatter;

        if (tabFormatters[favorite2] && tabFormatters[favorite2][favorite1]) {
            formatter = tabFormatters[favorite2][favorite1];
        } else if (favorite2 == "html" && favorite1 == "markdown") {
            formatter = tabFormatters.html.text
        } else {
            // fallback: plain.text
            formatter = tabFormatters.plain[favorite1] || tabFormatters.plain.text;
        }

        console.log("formatter:", favorite2, ">", favorite1, "->", formatter);

        if (favorite2 == "gmail") {
            collectTabs().then(({ content, subject }) => {
                var action_url = "https://mail.google.com/mail/?view=cm&fs=1&tf=1&source=mailto&to=" + emailadd + "&su=" + encodeURIComponent(subject) + "&" + "body=";
                copyToClipboard(content).then(() => { document.getElementById('getUrlsBtn').innerHTML = "Tabs copied!"; });
                chrome.tabs.create({ url: action_url });
            });
        } else if (favorite2 == "clipboard") {
            collectTabs(formatter).then(({ content, subject }) => {
                copyToClipboard(`${subject}\n\n${content}`).then(() => { document.getElementById('getUrlsBtn').innerHTML = "Tabs copied!"; });
            });
        } else if (favorite2 == "file") {
            collectTabs(formatter).then(({ content }) => {
                const format = favorite1.toLowerCase();
                if (format === "markdown") {
                    download('md', content);
                } else if (format.startsWith("csv")) {
                    download('csv', content);
                } else {
                    download('txt', content);
                }
            });
        } else if (favorite2 == "html") {
            collectTabs(formatter).then(({ content, subject }) => {
            document.body.innerHTML = `
                <div style="padding: 24px;">
                    <div style="margin-bottom: 12px;">
                    <span style="font-weight: bold">${subject}</span>
                        <a href="popup.html">&lt; back</a>
                    </div>
                    <div style="margin-bottom: 16px;">
                    To copy this list, type [Ctrl] A, then type [Ctrl] C.
                    </div>
                    <div>${content}</div>
                </div>
            `;
            });
        }
    });
}

function download(fmt, content) {
    var csvContent = `data:${fmt}/;charset=utf-8,${content}`;
    var encodedUri = encodeURI(csvContent).replace(/#/g, '%23');;
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const now = new Date();
    const pad = n => n < 10 ? '0' + n : n;
    const datafilename = `Tab_Save_${monthname[now.getMonth()]}_${now.getDate()}_${now.getFullYear()}_${pad(now.getHours())}_${pad(now.getMinutes())}.${fmt}`;
    link.setAttribute("download", datafilename);
    link.click();
}

function openFromInput() {
    const content = document.getElementById("inputbox").value;
    document.getElementById("inputbox").value = '';
    openUrlsFromContent(content);
}

function openFromFile(evt) {
    var file = evt.target.files[0];
    console.log("read file", file);
    if (file) {
        var r = new FileReader();
        r.onload = function (e) {
            openUrlsFromContent(e.target.result);
        }
        r.readAsText(file);
    } else {
        alert("Failed to load file");
    }
    // Reset file input so same file can be selected again
    evt.target.value = '';
}

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}

function openUrlsFromContent(content) {
    const validProtocols = ["chrome", "chrome-extension", "http", "https", "ftp", "file"];
    const urlInMarkDown = /^- \[.*?\]\((.*?)\)$/;

    chrome.tabs.query({ 'currentWindow': true }, function (tabs) {
        const alreadyOpenSet = new Set(tabs.map(tab => tab.url));
        content.split(/\r?\n/)
            .map(line => {
                const match = line.match(urlInMarkDown);
                return match ? match[1].trim() : line.trim();
            })
            .filter(url => {
                if (!url) return false;
                const protocol = url.split(":")[0];
                if (!validProtocols.includes(protocol)) {
                    console.log("skip (unexpected protocol):", url);
                    return false;
                }
                if (alreadyOpenSet.has(url)) {
                    console.log("skip (already open):", url);
                    return false;
                }
                return true;
            })
            .forEach(url => {
                chrome.tabs.create({ url });
            });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("getUrlsBtn").addEventListener('click', geturls);
    document.getElementById("openUrlsBtn").addEventListener('click', openFromInput);
    document.getElementById('file').addEventListener('change', openFromFile);
});

function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        // Modern async clipboard API, it returns a Promise
        return navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        var textarea = document.getElementById('clipboardBuffer');
        if (!textarea) {
            textarea = document.createElement('textarea');
            textarea.id = 'clipboardBuffer';
            textarea.style.position = 'fixed';
            textarea.style.top = '-1000px';
            textarea.style.left = '-1000px';
            document.body.appendChild(textarea);
        }
        textarea.value = text;
        textarea.select();
        document.execCommand('copy');
        return Promise.resolve();
    }
}

function collectTabs(formatter) {
    return new Promise((resolve) => {
        chrome.tabs.query({ 'currentWindow': true }, function (tabs) {
            const now = new Date();
            const pad = n => n < 10 ? '0' + n : n;
            const tabCount = tabs.length;
            const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
            const subject = `Tab List (${tabCount} tabs) - ${dateStr}`;
            let content = "";
            tabs.forEach(tab => {
                if (formatter) {
                    content += formatter(tab);
                } else {
                    content += `${tab.title}:\n${tab.url}\n\n`;
                }
            });
            resolve({ content, subject });
        });
    });
}
