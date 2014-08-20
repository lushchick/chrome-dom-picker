(function() {
    var mainTab, // the tab which initially invoked an extension via MessageEvent
        loadAssets = function(tab, assets) {
        // fired when all assets loaded. This could actually be a callback queue, but there's no need for it
        var onLoadCallback, method,
            loaded = 0, // how many assets loaded - needed to know when to fire a callback
            total, // total assets to load
            then = function(cb) {
                onLoadCallback = cb;
                return this;
            },
            doLoad = function(method, assets) {
                for (var i = -1, l = assets.length; ++i < l;) {
                    chrome.tabs[method](tab.id, { file: assets[i], allFrames: true }, (function(loaded) {
                        return function() {
                            if (loaded === total && onLoadCallback) {
                                // last script was loaded, fire onLoadCallback
                                onLoadCallback();
                            }
                        }
                    }(++loaded)));
                }
            };

        for (var i in assets) {
            if (assets.hasOwnProperty(i)) {
                method = i === 'js' ? 'executeScript' : 'insertCSS';
                total += assets[i].length;
                doLoad(method, assets[i]);
            }
        }


        return { then: then };
    },
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

                onSelectedTab = function(tab) {
                    mainTab = tab;

                    loadAssets(tab, {
                        js: ['thirdparty/js/jquery.min.js', 'thirdparty/js/bootstrap.min.js']
                    });

                    chrome.windows.create({
                        url: url,
                        focused: true,
                        type: 'popup'
                    }, onWindowCreated);
                },
                onWindowCreated = function(window) {
                    // load dom picker scripts and styles into the newly created window
                    loadAssets(window.tabs[0], {
                        css: ['src/dom_picker.css'],
                        js: ['thirdparty/js/jquery.min.js', 'src/dom_picker.js']
                    })
                    .then(function() {
                        chrome.tabs.sendMessage(mainTab.id, {data: 'foobar'});
                        chrome.tabs.sendMessage(window.tabs[0].id, {type: 'ready'});
                    });
                };

            chrome.tabs.getSelected(null, onSelectedTab);
        },
        proxy: function(req) {
            console.log('event page proxy', req);
            // proxy message to main content script
            chrome.tabs.sendMessage(mainTab.id, req || {});
        }
    },
    onMessage = function(req, sender, callback) {
        if (req.type && typeof messageHandlers[req.type] === 'function') {
            messageHandlers[req.type].apply(messageHandlers, Array.prototype.slice.call(arguments));
        }
        if (typeof callback === 'function') {
            // say that we do want to fire callback
            return true;
        }
    };

    chrome.tabs.getSelected(null, function(tab) {
        mainTab = tab;
        // register onMessage handler
        chrome.extension.onMessage.addListener(onMessage);
    });
})();
