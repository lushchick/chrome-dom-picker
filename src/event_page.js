(function() {
    var loadScripts = (function() {
        var loaded = {};

        return function(tab, scripts, injectDetails) {
            // fired when all scripts loaded. This could actually be a callback queue, but there's no need for it
            var onLoadCallback;

            if (loaded[tab.id])
                return;

            injectDetails = injectDetails || {};

            for (var i = -1, l = scripts.length; ++i < l; ) {
                injectDetails.file = scripts[i];
                chrome.tabs.executeScript(tab.id, injectDetails, (function(i) {
                    return function() {
                        if (i + 1 === l && onLoadCallback) {
                            // last script was loaded, fire onLoadCallback
                            onLoadCallback();
                        }

                        (loaded[tab.id] = loaded[tab.id] || []).push(scripts[i]);
                    }
                }(i)));
            }

            return {
                then: function(cb) {
                    if (loaded[tab.id]) {
                        onLoadCallback();
                    } else {
                        onLoadCallback = cb;
                    }
                }
            };
        }
    })(),
    /**
     * Fired when a connection is made from either an extension process or a content script.
     * @param port {Port} http://developer.chrome.com/extensions/extension.html#type-Port
     */
    messageHandlers = {
        launch: function(req) {
            if (!req.data.url) {
                return;
            }

            var url = req.data.url.match(/^https?/i) ? req.data.url : 'http://' + req.data.url,
                parentTab,
                onWindowCreated = function(window) {
                    // load dom picker scripts into the newly created window
                    loadScripts(window.tabs[0], [
                        'thirdparty/js/jquery.min.js',
                        'src/dom_picker.js'
                    ], {
                        allFrames: true
                    })
                    .then(function() {
                        chrome.tabs.sendMessage(parentTab.id, {data: 'foobar'});
                        chrome.tabs.sendMessage(window.tabs[0].id, {type: 'ready'});
                    });
                },
                onSelectedTab = function(tab) {
                    parentTab = tab;
                    loadScripts(tab, [
                        'thirdparty/js/jquery.min.js',
                        'thirdparty/js/bootstrap.min.js'
                    ], { allFrames: true });

                    chrome.windows.create({
                        url: url,
                        focused: true,
                        type: 'popup'
                    }, onWindowCreated);
                };

            chrome.tabs.getSelected(null, onSelectedTab);
        },
        onNodeSelect: function() {
            console.log('node selected', arguments);
        },
        onNodeDeselect: function() {
            console.log('node DEselected', arguments);
        }
    },
    onMessage = function(req, sender, callback) {
        if (req.type && typeof messageHandlers[req.type] === 'function') {
            messageHandlers[req.type].apply(messageHandlers, arguments);
        }
        if (typeof callback === 'function') {
            // say that we do want to fire callback
            return true;
        }
    };

    // register onMessage handler
    chrome.extension.onMessage.addListener(onMessage);
})();
