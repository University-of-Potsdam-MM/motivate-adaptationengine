/**
 * Created by tobias on 27.03.15.
 */
define(['contactJS'], function(contactJS) {
    return (function() {
        /**
         *
         * @extends Interpreter
         * @param discoverer
         * @returns {ISO8601Interpreter}
         * @constructor
         */
        function ISO8601Interpreter(discoverer) {
            contactJS.Interpreter.call(this, discoverer);
            this.name = "ISO8601Interpreter";

            return this;
        }

        ISO8601Interpreter.prototype = Object.create(contactJS.Interpreter.prototype);
        ISO8601Interpreter.prototype.constructor = ISO8601Interpreter;

        ISO8601Interpreter.prototype._initInAttributes = function() {
            this._setInAttributes([
                new contactJS.Attribute()
                    .withName('CI_CURRENT_UNIX_TIME')
                    .withType('INTEGER')
                    .withParameter(new contactJS.Parameter().withKey("CP_UNIT").withValue("SECONDS"))
            ]);
        };

        ISO8601Interpreter.prototype._initOutAttributes = function() {
            this._setOutAttributes([
                new contactJS.Attribute()
                    .withName('CI_CURRENT_FORMATTED_TIME')
                    .withType('STRING')
                    .withParameter(new contactJS.Parameter().withKey("CP_FORMAT").withValue("YYYYMMDD"))
            ]);
        };

        ISO8601Interpreter.prototype._interpretData = function(inAttributes, outAttributes, callback) {
            var formattedTime = outAttributes.getItems()[0];

            var unixTimeSeconds = inAttributes.getValueForAttributeWithTypeOf(this.getInAttributes().getItems()[0]);
            var theDate = new Date(unixTimeSeconds * 1000);

            var year = theDate.getFullYear();
            var month = theDate.getMonth() + 1 < 10 ? "0" + (theDate.getMonth() + 1) : theDate.getMonth() + 1;
            var day = theDate.getDate();

            formattedTime.setValue(year + "" + month + "" + day);

            callback([
                formattedTime
            ]);
        };

        return ISO8601Interpreter;
    })();
});