/**
 * Created by tobias on 31.03.15.
 */
define(['easejs', 'contactJS'], function (easejs, contactJS) {
    var Class = easejs.Class;

    var FakeCelsiusTemperatureWidget = Class('FakeCelsiusTemperatureWidget').extend(contactJS.Widget, {
        'public name': 'FakeCelsiusTemperatureWidget',

        'protected initOutAttributes': function () {
            this.addOutAttribute(
                new contactJS.Attribute()
                    .withName('CI_CURRENT_TEMPERATURE')
                    .withType('FLOAT')
                    .withParameter(new contactJS.Parameter().withKey("CP_TEMPERATURE_SCALE").withValue("CELSIUS"))
            );
        },

        'protected initConstantOutAttributes': function () {

        },

        'protected initCallbacks': function () {
            this.addCallback(new contactJS.Callback().withName('UPDATE').withAttributeTypes(this.getOutAttributes()));
        },

        'override protected queryGenerator': function (_function) {
            var response = new contactJS.AttributeList();
            response.put(this.getAttributes().getItems()[0].setValue("25"));
            this.putData(response);
            this.notify();

            this.__super(_function);
        }
    });

    return FakeCelsiusTemperatureWidget;
});