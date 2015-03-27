/**
 * Created by tobias on 13.03.15.
 */
define(['easejs', 'contactJS'],
    function(easejs, contactJS) {
        var Class = easejs.Class;

        var UnixTimeInterpreter = Class('UnixTimeInterpreter').extend(contactJS.Interpreter, {
            'public name' : 'UnixTimeInterpreter',

            'protected initInAttributes' : function() {
                this.inAttributeTypes.put(
                    new contactJS.AttributeType()
                    .withName('CI_CURRENT_UNIX_TIME')
                    .withType('INTEGER')
                    .withParameter(new contactJS.Parameter().withKey("CP_UNIT").withValue("MILLISECONDS"))
                );
            },

            'protected initOutAttributes' : function() {
                this.outAttributeTypes.put(
                    new contactJS.AttributeType()
                    .withName('CI_CURRENT_UNIX_TIME')
                    .withType('INTEGER')
                    .withParameter(new contactJS.Parameter().withKey("CP_UNIT").withValue("SECONDS"))
                );
            },

            'protected interpretData' : function(_data, _function) {
                this.setOutAttribute('CI_CURRENT_UNIX_TIME', 'INTEGER', Math.floor(_data.getItem(this.inAttributeTypes.getItems()[0].getIdentifier()).getValue() / 1000), [new contactJS.Parameter().withKey("CP_UNIT").withValue("SECONDS")]);

                if (_function && typeof(_function) == 'function'){
                    _function();
                }
            }
        });

        return UnixTimeInterpreter;
    });