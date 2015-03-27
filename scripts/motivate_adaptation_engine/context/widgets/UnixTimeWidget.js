/**
 * Created by tobias on 06.03.15.
 */
define(['easejs', 'contactJS'], function (easejs, contactJS) {
    var Class = easejs.Class;

    var UnixTimeWidget = Class('UnixTimeWidget').extend(contactJS.Widget, {
        'public name': 'UnixTimeWidget',

        'protected initAttributes': function () {
            var unixTime = new contactJS.AttributeValue()
                .withName('CI_CURRENT_UNIX_TIME')
                .withType('INTEGER')
                .withValue('NO_VALUE')
                .withParameter(new contactJS.Parameter().withKey("CP_UNIT").withValue("MILLISECONDS"));
            this.addAttribute(unixTime);
        },

        'protected initConstantAttributes': function () {

        },

        'protected initCallbacks': function () {
            this.addCallback(new contactJS.Callback().withName('UPDATE').withAttributeTypes(this.getAttributeTypes()));
        },

        'override protected queryGenerator': function (_function) {
            // old browser workaround
            if (!Date.now) {
                Date.now = function () {
                    return new Date().getTime();
                }
            }

            var response = new contactJS.AttributeValueList();
            response.put(this.getAttributeValues().getItems()[0].setValue(Date.now()));
            this.putData(response);
            this.notify();

            this.__super(_function);
        }
    });

    return UnixTimeWidget;
});