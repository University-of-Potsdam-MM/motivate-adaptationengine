/**
 * Created by tobias on 13.03.15.
 */
define(['easejs', 'contactJS'],
    function(easejs, contactJS) {
        var Class = easejs.Class;

        var SecondsInterpreter = Class('SecondsInterpreter').extend(contactJS.Interpreter, {
            'public name' : 'SecondsInterpreter',

            'protected initInAttributes' : function() {
                this.inAttributeTypes.put(
                    new contactJS.AttributeType()
                    .withName('CI_BASE_UNIT_OF_TIME')
                    .withType('INTEGER')
                    .withParameter(new contactJS.Parameter().withKey("CP_UNIT").withValue("MILLISECONDS"))
                );
            },

            'protected initOutAttributes' : function() {
                this.outAttributeTypes.put(
                    new contactJS.AttributeType()
                    .withName('CI_BASE_UNIT_OF_TIME')
                    .withType('INTEGER')
                    .withParameter(new contactJS.Parameter().withKey("CP_UNIT").withValue("SECONDS"))
                );
            },

            'protected interpretData' : function(_inAttributeValues, _outAttributeValues, _callback) {
                var unixSecondsValue = _outAttributeValues.getItems()[0];

                unixSecondsValue.setValue(Math.floor(_inAttributeValues.getValueForAttributeType(this.inAttributeTypes.getItems()[0]) / 1000));

                _callback([
                    unixSecondsValue
                ]);
            }
        });

        return SecondsInterpreter;
    });