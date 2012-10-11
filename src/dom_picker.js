(function($) {
    /*
     * Gets XPATH string representation for given DOM element, stolen from firebug_lite.
     * example: /html/body/div[2]/div[3]/div[4]/div/div[2]/div/div/div/div/div/div[2]/p
     *
     * To keep paths short, the path generated tries to find a parent element with a unique
     * id, eg: //[@id="dom-element-with-id"]/div[2]/p
     */
    var getElementXPath = function(element) {
        var paths = [], index, nodeName, tagName, sibling, pathIndex;

        for (; element && element.nodeType == 1; element = element.parentNode) {
            index = 0,
                nodeName = element.nodeName;

            if (element.id) {
                tagName = element.nodeName.toLowerCase();
                paths.splice(0, 0, '*[@id="' + element.id + '"]');
                return "//" + paths.join("/");
            }

            for (sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
                if (sibling.nodeType != 1)
                    continue;

                if (sibling.nodeName == nodeName)
                    ++index;
            }

            tagName = element.nodeName.toLowerCase();
            pathIndex = (index ? "[" + (index + 1) + "]" : "");
            paths.splice(0, 0, tagName + pathIndex);
        }

        return paths.length ? "/" + paths.join("/") : null;
    };

    /**
     * Simple plugin for handling elements selection
     * @param event
     * @param options
     * @return jQuery
     */
    $.fn.dompicker = function(event, options) {
        var $this = $(this),
            defaults = {
                hoverStyles: {
                    backgroundColor: 'lightblue',
                    opacity: .7
                },
                selectedStyles: {
                    backgroundColor: 'lightskyblue'
                }
            },
            data = (function() {
                var ns = 'cdp';
                if (!$this.data(ns)) {
                    $this.data(ns, {});
                }
                return $this.data(ns);
            })(),
            events = {
                show: function() {
                    if ($.isEmptyObject(data.css)) {
                        data.css = {};
                        $.each(options.hoverStyles, function(key) {
                            data.css[key] = $this.css(key);
                        });
                    }

                    if (!data.selected) {
                        $this.css(options.hoverStyles);
                    }
                },
                hide: function() {
                    if (data.css && !data.selected) {
                        $this.css(data.css);
                    }
                },
                click: function() {
                    data.selected = !data.selected;
                    var messageType = 'onNode' + (data.selected ? 'Select' : 'Deselect'),
                        styles = data.selected ? options.selectedStyles : data.css;

                    $this.css(styles);
                    chrome.extension.sendMessage(null, {
                        type: messageType,
                        node: {
                            id: $this.prop($.expando),
                            tagName: $this.prop('tagName').toLowerCase(),
                            xPath: getElementXPath($this[0])
                        }
                    });
                }
            };

        options = $.extend({}, defaults, options || {});

        if (event && events[event]) {
            events[event]();
        }

        return this;
    };

    $('*')

        .on('mouseover mouseout mouseup mousedown click', function(e) {
            if (this !== e.target) {
                return;
            }

            switch (e.type) {
                case 'mouseover':
                    $(this).dompicker('show');
                    break;
                case 'mouseout':
                    $(this).dompicker('hide');
                    break;
                case 'click':
                    $(this).dompicker('click');
                    // no break here
                case 'mousedown':
                case 'mouseup':
                default:
                    e.preventDefault();
                    e.stopPropagation();
            }
        });
})(jQuery);
