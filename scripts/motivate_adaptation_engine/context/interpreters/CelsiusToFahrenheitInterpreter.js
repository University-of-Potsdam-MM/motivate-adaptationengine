/**
 * Created by tobias on 31.03.15.
 */
define(['contactJS'], function(contactJS) {
    return (function() {
        /**
         *
         * @param discoverer
         * @extends Interpreter
         * @returns {CelsiusToFahrenheitInterpreter}
         * @constructor
         */
        function CelsiusToFahrenheitInterpreter(discoverer) {
            contactJS.Interpreter.call(this, discoverer);
            this.name = "CelsiusToFahrenheitInterpreter";

            return this;
        }

        CelsiusToFahrenheitInterpreter.prototype = Object.create(contactJS.Interpreter.prototype);
        CelsiusToFahrenheitInterpreter.prototype.constructor = CelsiusToFahrenheitInterpreter;

        CelsiusToFahrenheitInterpreter.prototype._initInAttributes = function() {
            this._setInAttributes([
                new contactJS.Attribute()
                    .withName('CI_CURRENT_TEMPERATURE')
                    .withType('FLOAT')
                    .withParameter(new contactJS.Parameter().withKey("CP_TEMPERATURE_SCALE").withValue("CELSIUS"))
            ]);
        };

        CelsiusToFahrenheitInterpreter.prototype._initOutAttributes = function() {
            this._setOutAttributes([
                new contactJS.Attribute()
                    .withName('CI_CURRENT_TEMPERATURE')
                    .withType('FLOAT')
                    .withParameter(new contactJS.Parameter().withKey("CP_TEMPERATURE_SCALE").withValue("FAHRENHEIT"))
            ]);
        };

        CelsiusToFahrenheitInterpreter.prototype._interpretData = function(inAttributes, outAttributes, callback) {
            var fahrenheitValue = outAttributes.getItems()[0];

            var celsiusTemperature = inAttributes.getValueForAttributeWithTypeOf(this.getInAttributes().getItems()[0]);
            var fahrenheitTemperature = celsiusTemperature * 1.8 + 32;

            fahrenheitValue.setValue(fahrenheitTemperature);

            callback([
                fahrenheitTemperature
            ]);
        };

        return CelsiusToFahrenheitInterpreter;
    })();
});