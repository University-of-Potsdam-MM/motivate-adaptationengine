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

            'protected interpretData' : function(_data, _function) {
                this.setOutAttribute(
                    'CI_BASE_UNIT_OF_TIME',
                    'INTEGER',
                    Math.floor(_data.getItems()[0].getValue() / 1000),
                    [new contactJS.Parameter().withKey("CP_UNIT").withValue("SECONDS")]
                );

                if (_function && typeof(_function) == 'function'){
                    _function();
                }
            }
        });

        return SecondsInterpreter;
    });