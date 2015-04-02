/**
 * Created by tobias on 02.04.15.
 */
define(['easejs', 'contactJS'],
    function(easejs, contactJS) {
        var Class = easejs.Class;

        var DistanceInterpreter = Class('DistanceInterpreter').extend(contactJS.Interpreter, {
            'public name' : 'DistanceInterpreter',

            'protected initInAttributes' : function() {
                this.inAttributeTypes.put(
                    new contactJS.AttributeType()
                        .withName('CI_LATITUDE')
                        .withType('FLOAT')
                );

                this.inAttributeTypes.put(
                    new contactJS.AttributeType()
                        .withName('CI_LONGITUDE')
                        .withType('FLOAT')
                );
            },

            'protected initOutAttributes' : function() {
                this.outAttributeTypes.put(
                    new contactJS.AttributeType()
                        .withName('CI_LOCATION_DISTANCE')
                        .withType('FLOAT')
                        .withParameter(new contactJS.Parameter().withKey("CP_TARGET_LATITUDE").withValue("PV_DYNAMIC"))
                        .withParameter(new contactJS.Parameter().withKey("CP_TARGET_LONGITUDE").withValue("PV_DYNAMIC"))
                        .withParameter(new contactJS.Parameter().withKey("CP_UNIT").withValue("KILOMETERS"))
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

        return DistanceInterpreter;
    });