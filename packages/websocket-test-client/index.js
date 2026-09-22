(function() {
    var ws = null;
    var connected = false;
    var historyItems = [];

    var serverUrl;
    var connectionStatus;
    var sendMessage;

    var historyList;
    var connectButton;
    var disconnectButton;
    var sendButton;

    var open = function() {
        var url = serverUrl.value;
        ws = new WebSocket(url);
        ws.onopen = onOpen;
        ws.onclose = onClose;
        ws.onmessage = onMessage;
        ws.onerror = onError;

        connectionStatus.textContent = 'OPENING ...';
        serverUrl.disabled = true;
        connectButton.style.display = 'none';
        disconnectButton.style.display = 'inline-block';
        disconnectButton.disabled = true;
    };

    var close = function() {
        if (ws) {
            console.log('CLOSING ...');
            connectionStatus.textContent = 'CLOSING ...';
            disconnectButton.disabled = true;
            ws.close();
        }
    };

    var reset = function() {
        connected = false;
        connectionStatus.textContent = 'CLOSED';

        serverUrl.disabled = false;
        connectButton.style.display = 'inline-block';
        disconnectButton.style.display = 'none';
        disconnectButton.disabled = false;
        sendMessage.disabled = true;
        sendButton.disabled = true;
    };

    var clearLog = function() {
        document.getElementById('messages').innerHTML = '';
    };

    var onOpen = function() {
        console.log('OPENED: ' + serverUrl.value);
        connected = true;
        connectionStatus.textContent = 'OPENED';
        disconnectButton.disabled = false;
        sendMessage.disabled = false;
        sendButton.disabled = false;
    };

    var onClose = function() {
        console.log('CLOSED: ' + serverUrl.value);
        ws = null;
        reset();
    };

    var onMessage = function(event) {
        var data = event.data;
        addMessage(data);
    };

    var onError = function(event) {
        alert(event.type);
    };

    var addMessage = function(data, type) {
        var msg = document.createElement('pre');
        msg.textContent = data;
        if (type === 'SENT') {
            msg.classList.add('sent');
        }
        var messages = document.getElementById('messages');
        messages.appendChild(msg);

        while (messages.childNodes.length > 1000) {
            messages.removeChild(messages.firstChild);
        }
        messages.scrollTop = messages.scrollHeight;
    };

    var addToHistoryList = function(item) {
        var link = document.createElement('a');
        link.href = item.url;
        link.dataset.msg = item.msg;
        link.title = item.url + '\n\n' + item.msg;
        link.className = 'historyUrl';
        link.textContent = item.url;

        var removeSpan = document.createElement('span');
        removeSpan.className = 'removeHistory';
        removeSpan.textContent = 'x';

        var li = document.createElement('li');
        li.id = item.id;
        li.appendChild(link);
        li.appendChild(removeSpan);

        historyList.prepend(li);
    };

    var loadHistory = function() {
        historyList = document.getElementById('history');
        historyItems = JSON.parse(localStorage.getItem('history'));

        if (!historyItems) {
            historyItems = [];
        }

        historyItems.forEach(function(item) {
            addToHistoryList(item);
        });
    };

    var removeHistory = function(item) {
        for (var i = historyItems.length - 1; i >= 0; i--) {
            if (historyItems[i].url === item.url && historyItems[i].msg === item.msg) {
                var li = document.getElementById(historyItems[i].id);
                if (li) {
                    li.remove();
                }
                historyItems.splice(i, 1);
            }
        }
    };

    var guid = function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    };

    var saveHistory = function(msg) {
        var item = { 'id': guid(), 'url': serverUrl.value, 'msg': msg };

        removeHistory(item);

        if (historyItems.length >= 20) {
            historyItems.shift();
            var last = historyList.querySelector('li:last-child');
            if (last) {
                last.remove();
            }
        }

        historyItems.push(item);
        localStorage.setItem('history', JSON.stringify(historyItems));

        addToHistoryList(item);
    };

    var clearHistory = function() {
        historyItems = [];
        localStorage.removeItem('history');
        historyList.innerHTML = '';
    };

    WebSocketClient = {
        init: function() {
            serverUrl = document.getElementById('serverUrl');
            connectionStatus = document.getElementById('connectionStatus');
            sendMessage = document.getElementById('sendMessage');
            historyList = document.getElementById('history');

            connectButton = document.getElementById('connectButton');
            disconnectButton = document.getElementById('disconnectButton');
            sendButton = document.getElementById('sendButton');

            loadHistory();

            document.getElementById('clearHistory').addEventListener('click', function(e) {
                clearHistory();
            });

            connectButton.addEventListener('click', function(e) {
                close();
                open();
            });

            disconnectButton.addEventListener('click', function(e) {
                close();
            });

            sendButton.addEventListener('click', function(e) {
                if (!ws || !connected) {
                    return;
                }
                var msg = sendMessage.value;
                addMessage(msg, 'SENT');
                ws.send(msg);

                saveHistory(msg);
            });

            document.getElementById('clearMessage').addEventListener('click', function(e) {
                clearLog();
            });

            historyList.addEventListener('click', function(e) {
                if (e.target.classList.contains('removeHistory')) {
                    var link = e.target.parentElement.querySelector('a');
                    removeHistory({ 'url': link.getAttribute('href'), 'msg': link.dataset.msg });
                    localStorage.setItem('history', JSON.stringify(historyItems));
                } else if (e.target.classList.contains('historyUrl')) {
                    serverUrl.value = e.target.href;
                    sendMessage.value = e.target.dataset.msg;
                    e.preventDefault();
                }
            });

            serverUrl.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    connectButton.click();
                }
            });

            var isCtrl;
            sendMessage.addEventListener('keyup', function(e) {
                if (e.key === 'Control') {
                    isCtrl = false;
                }
            });
            sendMessage.addEventListener('keydown', function(e) {
                if (e.key === 'Control') {
                    isCtrl = true;
                }
                if (e.key === 'Enter' && isCtrl === true) {
                    sendButton.click();
                    return false;
                }
            });
        }
    };
})();

var WebSocketClient;

document.addEventListener('DOMContentLoaded', function() {
    WebSocketClient.init();
});
