/**
 * Created by elis on 01.06.2015.
 */
define(['contactJS'], function(contactJS) {
    return (function() {

        NightTimeInterpreter.description = {
            in: [
                {
                    'name':'CI_BASE_UNIT_OF_TIME',
                    'type':'INTEGER',
                    'parameterList': [["CP_UNIT", "STRING", "SECONDS"]]
                }
            ],
            out: [
                {
                    'name':'CI_IS_NIGHTTIME',
                    'type':'BOOLEAN'
                }
            ]
        };

        /**
         *
         * @extends Interpreter
         * @param discoverer
         * @returns {NightTimeInterpreter}
         * @constructor
         */
        function NightTimeInterpreter(discoverer) {
            contactJS.Interpreter.call(this, discoverer);
            this._name = "NightTimeInterpreter";
            return this;
        }

        NightTimeInterpreter.prototype = Object.create(contactJS.Interpreter.prototype);
        NightTimeInterpreter.prototype.constructor = NightTimeInterpreter;

        NightTimeInterpreter.prototype._interpretData = function(inAttributes, outAttributes, callback) {
            var isNightTime = outAttributes.getItems()[0];
            var inAttributeValue = inAttributes.getValueForContextInformationOfKind(this.getInputContextInformation().getItems()[0]);
            var currentTimeInHours = new Date(inAttributeValue*1000).getHours();
            var isNightTimeValue = (currentTimeInHours < 6 || currentTimeInHours > 20);

            isNightTime.setValue(isNightTimeValue);

            callback([isNightTime]);
        };

        return NightTimeInterpreter;
    })();
});