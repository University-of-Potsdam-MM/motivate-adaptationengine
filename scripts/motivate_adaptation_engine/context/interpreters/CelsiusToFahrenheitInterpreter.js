/**
 * Created by tobias on 31.03.15.
 */
define(['easejs', 'contactJS'],
    function(easejs, contactJS) {
        var Class = easejs.Class;

        var CelsiusToFahrenheitInterpreter = Class('CelsiusToFahrenheitInterpreter').extend(contactJS.Interpreter, {
            'public name' : 'CelsiusToFahrenheitInterpreter',

            'protected initInAttributes' : function() {
                this.inAttributeTypes.put(
                    new contactJS.AttributeType()
                        .withName('CI_CURRENT_TEMPERATURE')
                        .withType('FLOAT')
                        .withParameter(new contactJS.Parameter().withKey("CP_TEMPERATURE_SCALE").withValue("CELSIUS"))
                );
            },

            'protected initOutAttributes' : function() {
                this.outAttributeTypes.put(
                    new contactJS.AttributeType()
                        .withName('CI_CURRENT_TEMPERATURE')
                        .withType('FLOAT')
                        .withParameter(new contactJS.Parameter().withKey("CP_TEMPERATURE_SCALE").withValue("FAHRENHEIT"))
                );
            },

            'protected interpretData' : function(_attributeValues, _function) {
                var celsiusTemperature = _attributeValues.getValueForAttributeType(this.inAttributeTypes.getItems()[0]);
                var fahrenheitTemperature = celsiusTemperature * 1.8 + 32;

                this.setOutAttribute(
                    'CI_CURRENT_TEMPERATURE',
                    'FLOAT',
                    fahrenheitTemperature,
                    [new contactJS.Parameter().withKey("CP_TEMPERATURE_SCALE").withValue("FAHRENHEIT")]
                );

                if (_function && typeof(_function) == 'function'){
                    _function();
                }
            }
        });

        return CelsiusToFahrenheitInterpreter;
    });