/**
 * Created by tobias on 13.03.15.
 */
define(['contactJS'], function(contactJS) {
    return (function() {
        SecondsInterpreter.description = {
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
            this._name = "SecondsInterpreter";
            return this;
        }

        SecondsInterpreter.prototype = Object.create(contactJS.Interpreter.prototype);
        SecondsInterpreter.prototype.constructor = SecondsInterpreter;

        SecondsInterpreter.prototype._interpretData = function(inContextInformation, outContextInformation, callback) {
            var unixSecondsValue = outContextInformation.getItems()[0];
            unixSecondsValue.setValue(Math.floor(inContextInformation.getValueForContextInformationOfKind(this.getInputContextInformation().getItems()[0]) / 1000));
            callback([unixSecondsValue]);
        };

        return SecondsInterpreter;
    })();
});