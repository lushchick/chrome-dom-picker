console.log('Content script loaded');
(function() {
    var messageEventPrefix = 'cdp',
        messageEvents = (function() {
            var eventNames = ['launch'],
                events = {};

            for (var i = -1, l = eventNames.length; ++i < l; ) {
                events[eventNames[i]] = true;
            }

            return events;
        })(),
        isKnownMessageEvent = function(name) {
            for (var i in messageEvents) {
                if (messageEvents.hasOwnProperty(i) && i === name) {
                    return true;
                }
            }
            return false;
        },
        tooltip = function(options) {
            var $container, $alert,
                closeTooltip = function() {
                    // check if our tooltip is not hovered, and if yes - postpone closing it a bit
                    $alert.is(':hover') ? setTimeout(closeTooltip, 5e3) : $alert.alert('close');
                },
                markup = ['<div class="cdp-tooltip-item alert alert-block alert-info fade in">',
                    '<button type="button" class="close" data-dismiss="alert">&times;</button>'];

            if (options.title) {
                markup.push('<h4 class="alert-heading">' + options.title + '</h4>');
            }

            if (options.text) {
                markup.push(options.text);
            }

            markup.push('</div>');

            // create tooltip wrap container if not yet exist
            if (!($container = $('.cdp-tooltip')).length) {
                $container = $('<div class="cdp-tooltip"></div>').appendTo('body');
            }

            $alert = $(markup.join('')).prependTo($container).alert();

            setTimeout(closeTooltip, 5e3);
        },
        onMessage = function(event) {
            var container, handler, parts, type;
            if (event instanceof MessageEvent) {
                parts = event.data.type ? event.data.type.split('.') : [];
                if (event.source !== window
                    || parts.length < 2
                    || parts[0] !== messageEventPrefix
                    || !isKnownMessageEvent(type = parts[1])
                ) {
                    return;
                }
                event.data.type = type;
                container = messageEventHandlers;
            } else {
                type = event.type;
                container = eventPageMessageHandlers;
            }

            handler = (typeof container[type] === 'function') ? type : 'def';
            container[handler].apply(this, arguments);
        }

    this.messageEventHandlers = {
        def: function(event) {
            console.log('Default messageEventHandler', arguments);
            // just proxy received message to background script
            chrome.extension.sendMessage(null, event.data || {});
        }
    };

    this.eventPageMessageHandlers = {
        def: function() {
            console.log('Default eventPageMessageHandler', arguments);
        }
    }

    window.addEventListener('message', onMessage, false);
    chrome.extension.onMessage.addListener(onMessage);
})();
