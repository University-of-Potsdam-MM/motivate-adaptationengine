/**
 * Created by tobias on 27.03.15.
 */
define(['easejs', 'contactJS'],
    function(easejs, contactJS) {
        var Class = easejs.Class;

        var ISO8601Interpreter = Class('ISO8601Interpreter').extend(contactJS.Interpreter, {
            'public name' : 'ISO8601Interpreter',

            'protected initInAttributes' : function() {
                this.inAttributeTypes.put(
                    new contactJS.AttributeType()
                        .withName('CI_CURRENT_UNIX_TIME')
                        .withType('INTEGER')
                        .withParameter(new contactJS.Parameter().withKey("CP_UNIT").withValue("SECONDS"))
                );
            },

            'protected initOutAttributes' : function() {
                this.outAttributeTypes.put(
                    new contactJS.AttributeType()
                        .withName('CI_CURRENT_FORMATTED_TIME')
                        .withType('STRING')
                        .withParameter(new contactJS.Parameter().withKey("CP_FORMAT").withValue("YYYYMMDD"))
                );
            },

            'protected interpretData' : function(_data, _function) {
                var unixTimeMilliseconds = _data.getItem(this.inAttributeTypes.getItems()[0].getIdentifier()).getValue();
                var theDate = new Date(unixTimeMilliseconds*1000);

                var year = theDate.getFullYear();
                var month = theDate.getMonth() + 1 < 10 ? "0"+(theDate.getMonth()+1) : theDate.getMonth()+1;
                var day = theDate.getDate();

                this.setOutAttribute(
                    'CI_CURRENT_FORMATTED_TIME',
                    'STRING',
                    year+""+month+""+day,
                    [new contactJS.Parameter().withKey("CP_FORMAT").withValue("YYYYMMDD")]
                );

                if (_function && typeof(_function) == 'function'){
                    _function();
                }
            }
        });

        return ISO8601Interpreter;
    });