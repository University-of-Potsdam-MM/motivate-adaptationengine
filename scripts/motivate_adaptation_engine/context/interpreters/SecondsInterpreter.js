/**
 * Created by tobias on 13.03.15.
 */
define(['contactJS'], function(contactJS) {
    return (function() {

        SecondsInterpreter.inOut = {
            in: [
                {
                    'name':'CI_BASE_UNIT_OF_TIME',
                    'type':'INTEGER',
                    'parameterList': [["CP_UNIT", "STRING", "MILLISECONDS"]]
                }
            ],
            out: [
                {
                    'name':'CI_BASE_UNIT_OF_TIME',
                    'type':'INTEGER',
                    'parameterList': [["CP_UNIT", "STRING", "SECONDS"]]
                }
            ]
        };

        /**
         *
         * @extends Interpreter
         * @param discoverer
         * @returns {SecondsInterpreter}
         * @constructor
         */
        function SecondsInterpreter(discoverer) {
            contactJS.Interpreter.call(this, discoverer);
            this.name = "SecondsInterpreter";
            return this;
        }

        SecondsInterpreter.prototype = Object.create(contactJS.Interpreter.prototype);
        SecondsInterpreter.prototype.constructor = SecondsInterpreter;

        SecondsInterpreter.prototype._interpretData = function(inAttributes, outAttributes, callback) {
            var unixSecondsValue = outAttributes.getItems()[0];

            unixSecondsValue.setValue(Math.floor(inAttributes.getValueForAttributeWithTypeOf(this.getInAttributes().getItems()[0]) / 1000));

            callback([
                unixSecondsValue
            ]);
        };

        return SecondsInterpreter;
    })();
});