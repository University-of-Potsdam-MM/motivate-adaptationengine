/**
 * Created by tobias on 13.03.15.
 */
define(['easejs', 'contactJS'],
    function(easejs, contactJS) {
        var Class = easejs.Class;

        var UnixTimeInterpreter = Class('UnixTimeInterpreter').extend(contactJS.Interpreter, {
            'public name' : 'UnixTimeInterpreter',

            'protected initInAttributes' : function() {
                this.setInAttributes([
                    new contactJS.Attribute()
                        .withName('CI_CURRENT_UNIX_TIME')
                        .withType('INTEGER')
                        .withParameter(new contactJS.Parameter().withKey("CP_UNIT").withValue("MILLISECONDS"))
                ]);
            },

            'protected initOutAttributes' : function() {
                this.setOutAttributes([
                    new contactJS.Attribute()
                        .withName('CI_CURRENT_UNIX_TIME')
                        .withType('INTEGER')
                        .withParameter(new contactJS.Parameter().withKey("CP_UNIT").withValue("SECONDS"))
                ]);
            },

            'protected interpretData' : function(_inAttributeValues, _outAttributeValues, _callback) {
                var unixSecondsValue = _outAttributeValues.getItems()[0];

                unixSecondsValue.setValue(Math.floor(_inAttributeValues.getValueForAttributeWithTypeOf(this.inAttributes.getItems()[0]) / 1000));

                _callback([
                    unixSecondsValue
                ]);
            }
        });

        return UnixTimeInterpreter;
    });