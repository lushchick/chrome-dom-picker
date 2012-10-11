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
        window.postMessage({
            type: 'cdp.launch',
            data: $(this).serializeObject()
        }, '*');
    });
});
