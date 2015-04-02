/**
 * Created by tobias on 31.03.15.
 */
define(['easejs', 'contactJS'], function (easejs, contactJS) {
    var Class = easejs.Class;

    var FakeCelsiusTemperatureWidget = Class('FakeCelsiusTemperatureWidget').extend(contactJS.Widget, {
        'public name': 'FakeCelsiusTemperatureWidget',

        'protected initAttributes': function () {
            this.addAttribute(new contactJS.AttributeValue()
                .withName('CI_CURRENT_TEMPERATURE')
                .withType('FLOAT')
                .withValue('NO_VALUE')
                .withParameter(new contactJS.Parameter().withKey("CP_TEMPERATURE_SCALE").withValue("CELSIUS")));
        },

        'protected initConstantAttributes': function () {

        },

        'protected initCallbacks': function () {
            this.addCallback(new contactJS.Callback().withName('UPDATE').withAttributeTypes(this.getAttributeTypes()));
        },

        'override protected queryGenerator': function (_function) {
            var response = new contactJS.AttributeValueList();
            response.put(this.getAttributeValues().getItems()[0].setValue("25"));
            this.putData(response);
            this.notify();

            this.__super(_function);
        }
    });

    return FakeCelsiusTemperatureWidget;
});