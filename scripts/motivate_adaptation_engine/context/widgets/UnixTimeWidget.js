/**
 * Created by tobias on 06.03.15.
 */
define(['easejs', 'contactJS'], function (easejs, contactJS) {
    var Class = easejs.Class;

    var UnixTimeWidget = Class('UnixTimeWidget').extend(contactJS.Widget, {
        'public name': 'UnixTimeWidget',

        'protected initOutAttributes': function () {
            this.addOutAttribute(
                new contactJS.Attribute()
                    .withName('CI_CURRENT_UNIX_TIME')
                    .withType('INTEGER')
                    .withParameter(new contactJS.Parameter().withKey("CP_UNIT").withValue("MILLISECONDS"))
            );
        },

        'protected initConstantOutAttributes': function () {

        },

        'protected initCallbacks': function () {
            this.addCallback(new contactJS.Callback().withName('UPDATE').withAttributeTypes(this.getOutAttributes()));
        },

        'override protected queryGenerator': function (_function) {
            // old browser workaround
            if (!Date.now) {
                Date.now = function () {
                    return new Date().getTime();
                }
            }

            var response = new contactJS.AttributeList();
            response.put(this.getOutAttributes().getItems()[0].setValue(Date.now()));
            this.putData(response);
            this.notify();

            this.__super(_function);
        }
    });

    return UnixTimeWidget;
});