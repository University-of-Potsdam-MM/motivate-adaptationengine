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
                this._discoverer.buildAttribute('CI_CURRENT_TEMPERATURE','FLOAT',[["CP_TEMPERATURE_SCALE","CELSIUS"]])
            ]);
        };

        CelsiusToFahrenheitInterpreter.prototype._initOutAttributes = function() {
            this._setOutAttributes([
                this._discoverer.buildAttribute('CI_CURRENT_TEMPERATURE','FLOAT',[["CP_TEMPERATURE_SCALE","FAHRENHEIT"]])
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