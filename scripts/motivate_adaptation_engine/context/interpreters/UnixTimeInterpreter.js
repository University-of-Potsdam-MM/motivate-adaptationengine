/**
 * Created by tobias on 13.03.15.
 */
define(['contactJS'], function(contactJS) {
    return (function() {

        UnixTimeInterpreter.inOut = {
            in: [
                {
                    'name':'CI_CURRENT_UNIX_TIME',
                    'type':'INTEGER',
                    'parameterList': ["CP_UNIT", "MILLISECONDS"],
                    "synonymList": [],
                    'value':'',
                    'timestamp':''
                }
            ],
            out: [
                {
                    'name':'CI_CURRENT_UNIX_TIME',
                    'type':'INTEGER',
                    'parameterList': ["CP_UNIT", "SECONDS"],
                    "synonymList": [],
                    'value':'',
                    'timestamp':''
                }
            ]
        };

        /**
         *
         * @extends Interpreter
         * @param discoverer
         * @returns {UnixTimeInterpreter}
         * @constructor
         */
        function UnixTimeInterpreter(discoverer, inAttributes, outAttributes) {
            contactJS.Interpreter.call(this, discoverer, inAttributes, outAttributes);
            this.name = "UnixTimeInterpreter";

            return this;
        }

        UnixTimeInterpreter.prototype = Object.create(contactJS.Interpreter.prototype);
        UnixTimeInterpreter.prototype.constructor = UnixTimeInterpreter;



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