/**
 * Created by tobias on 27.03.15.
 */
define(['easejs', 'contactJS'],
    function(easejs, contactJS) {
        var Class = easejs.Class;

        var ISO8601Interpreter = Class('ISO8601Interpreter').extend(contactJS.Interpreter, {
            'public name' : 'ISO8601Interpreter',

            'protected initInAttributes' : function() {
                this.setInAttributes([
                    new contactJS.Attribute()
                        .withName('CI_CURRENT_UNIX_TIME')
                        .withType('INTEGER')
                        .withParameter(new contactJS.Parameter().withKey("CP_UNIT").withValue("SECONDS"))
                ]);
            },

            'protected initOutAttributes' : function() {
                this.setOutAttributes([
                    new contactJS.Attribute()
                        .withName('CI_CURRENT_FORMATTED_TIME')
                        .withType('STRING')
                        .withParameter(new contactJS.Parameter().withKey("CP_FORMAT").withValue("YYYYMMDD"))
                ]);
            },

            'protected interpretData' : function(_inAttributeValues, _outAttributeValues, _callback) {
                var formattedTime = _outAttributeValues.getItems()[0];

                var unixTimeSeconds = _inAttributeValues.getValueForAttributeWithTypeOf(this.inAttributes.getItems()[0]);
                var theDate = new Date(unixTimeSeconds*1000);

                var year = theDate.getFullYear();
                var month = theDate.getMonth() + 1 < 10 ? "0"+(theDate.getMonth()+1) : theDate.getMonth()+1;
                var day = theDate.getDate();

                formattedTime.setValue(year+""+month+""+day);

                _callback([
                    formattedTime
                ]);
            }
        });

        return ISO8601Interpreter;
    });