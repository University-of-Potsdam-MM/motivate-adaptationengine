/**
 * Created by elis on 01.06.2015.
 */
define(['contactJS'], function(contactJS) {
    return (function() {

        function NightTimeInterpreter(discoverer) {
            contactJS.Interpreter.call(this, discoverer);
            this.name = "NightTimeInterpreter";

            return this;
        }

        NightTimeInterpreter.prototype = Object.create(contactJS.Interpreter.prototype);
        NightTimeInterpreter.prototype.constructor = NightTimeInterpreter;

        NightTimeInterpreter.prototype._initInAttributes = function() {
            this._setInAttributes([
                this._discoverer.buildAttribute('CI_CURRENT_UNIX_TIME','INTEGER',[["CP_UNIT","SECONDS"]])
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
            var isNightTimeValue = (inAttributeValue < 20000 || inAttributeValue > 80000);

            isNightTime.setValue(isNightTimeValue);

            callback([
                isNightTime
            ]);

        };

        return NightTimeInterpreter;
    })();
});