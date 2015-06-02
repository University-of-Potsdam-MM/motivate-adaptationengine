/**
 * Created by tobias on 13.03.15.
 */
define(['contactJS'], function(contactJS) {
    return (function() {
        /**
         *
         * @extends Interpreter
         * @param discoverer
         * @returns {UnixTimeInterpreter}
         * @constructor
         */
        function UnixTimeInterpreter(discoverer) {
            contactJS.Interpreter.call(this, discoverer);
            this.name = "UnixTimeInterpreter";

            return this;
        }

        UnixTimeInterpreter.prototype = Object.create(contactJS.Interpreter.prototype);
        UnixTimeInterpreter.prototype.constructor = UnixTimeInterpreter;

        UnixTimeInterpreter.prototype._initInAttributes = function() {
            this._setInAttributes([
                this._discoverer.buildAttribute('CI_CURRENT_UNIX_TIME','INTEGER',[["CP_UNIT","MILLISECONDS"]])
            ]);
        };

        UnixTimeInterpreter.prototype._initOutAttributes = function() {
            this._setOutAttributes([
                this._discoverer.buildAttribute('CI_CURRENT_UNIX_TIME','INTEGER',[["CP_UNIT","SECONDS"]])
            ]);
        };

        UnixTimeInterpreter.prototype._interpretData = function(inAttributes, outAttributes, callback) {
            var unixSecondsValue = outAttributes.getItems()[0];

            unixSecondsValue.setValue(Math.floor(inAttributes.getValueForAttributeWithTypeOf(this.getInAttributes().getItems()[0]) / 1000));

            callback([
                unixSecondsValue
            ]);
        };

        return UnixTimeInterpreter;
    })();
});