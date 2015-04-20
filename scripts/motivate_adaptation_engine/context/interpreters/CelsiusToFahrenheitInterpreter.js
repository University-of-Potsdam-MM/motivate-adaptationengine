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

            'protected interpretData' : function(_inAttributeValues, _outAttributeValues, _callback) {
                var fahrenheitValue = _outAttributeValues.getItems()[0];

                var celsiusTemperature = _inAttributeValues.getValueForAttributeType(this.inAttributeTypes.getItems()[0]);
                var fahrenheitTemperature = celsiusTemperature * 1.8 + 32;

                fahrenheitValue.setValue(fahrenheitTemperature);

                _callback([
                    fahrenheitTemperature
                ]);
            }
        });

        return CelsiusToFahrenheitInterpreter;
    });