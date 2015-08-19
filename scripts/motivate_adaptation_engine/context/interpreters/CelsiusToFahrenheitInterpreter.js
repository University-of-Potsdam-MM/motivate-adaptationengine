/**
 * Created by tobias on 31.03.15.
 */
define(['contactJS'], function(contactJS) {
    return (function() {

        CelsiusToFahrenheitInterpreter.inOut = {
            in: [
                {
                    'name':'CI_CURRENT_TEMPERATURE',
                    'type':'FLOAT',
                    'parameterList': [["CP_TEMPERATURE_SCALE", "CELSIUS"]]
                }
            ],
            out: [
                {
                    'name':'CI_CURRENT_TEMPERATURE',
                    'type':'FLOAT',
                    'parameterList': [["CP_TEMPERATURE_SCALE", "FAHRENHEIT"]]
                }
            ]
        };

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