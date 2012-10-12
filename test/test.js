// handy form serialization plugin
$.fn.serializeObject = function() {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name]) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

$(function() {
    $('#form_launch').on('submit', function(event) {
        event.preventDefault();

        // launch the plugin and open page window
        window.postMessage({
            type: 'cdp.launch',
            data: $(this).serializeObject()
        }, '*');
    });

    window.addEventListener('message', function(event) {
        if (!event.data.type)
            return;

        // process nodes selection
        switch (event.data.type) {
            case 'cdp.nodeSelect':
                console.log('node selected', event.data.node);
                break;
            case 'cdp.nodeDeselect':
                console.log('node de-selected', event.data.node);
                break;
        }
    }, false);
});
