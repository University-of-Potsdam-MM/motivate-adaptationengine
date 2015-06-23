/**
 * Created by elis on 01.06.2015.
 */
define(['contactJS'], function(contactJS) {
    return (function() {
        /**
         *
         * @extends Interpreter
         * @param discoverer
         * @returns {NightTimeInterpreter}
         * @constructor
         */
        function NightTimeInterpreter(discoverer) {
            contactJS.Interpreter.call(this, discoverer);
            this.name = "NightTimeInterpreter";

            return this;
        }

        NightTimeInterpreter.prototype = Object.create(contactJS.Interpreter.prototype);
        NightTimeInterpreter.prototype.constructor = NightTimeInterpreter;

        NightTimeInterpreter.prototype._initInAttributes = function() {
            this._setInAttributes([
                this._discoverer.buildAttribute('CI_CURRENT_UNIX_TIME_IN_SECONDS','INTEGER')
            ]);
        };

        NightTimeInterpreter.prototype._initOutAttributes = function() {
            this._setOutAttributes([
                this._discoverer.buildAttribute('CI_IS_NIGHTTIME','BOOLEAN')
            ]);
        };

        NightTimeInterpreter.prototype._interpretData = function(inAttributes, outAttributes, callback) {
            var isNightTime = outAttributes.getItems()[0];
            var inAttributeValue = inAttributes.getValueForAttributeWithTypeOf(this.getInAttributes().getItems()[0]);
            var currentTimeInHours = new Date(inAttributeValue*1000).getHours();
            var isNightTimeValue = (currentTimeInHours < 6 || currentTimeInHours > 20);

            isNightTime.setValue(isNightTimeValue);

            callback([
                isNightTime
            ]);

        };

        return NightTimeInterpreter;
    })();
});