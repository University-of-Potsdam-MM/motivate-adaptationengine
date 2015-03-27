/**
 * Created by tobias on 25.03.15.
 */
define(['easejs', 'contactJS'],
    function(easejs, contactJS) {
        var Class = easejs.Class;

        var AddressInterpreter = Class('AddressInterpreter').extend(contactJS.Interpreter, {
            'public name' : 'AddressInterpreter',

            'protected initInAttributes' : function() {
                this.inAttributeTypes.put(
                    new contactJS.AttributeType()
                        .withName('CI_USER_LOCATION_LATITUDE')
                        .withType('FLOAT')
                );

                this.inAttributeTypes.put(
                    new contactJS.AttributeType()
                        .withName('CI_USER_LOCATION_LONGITUDE')
                        .withType('FLOAT')
                );
            },

            'protected initOutAttributes' : function() {
                this.outAttributeTypes.put(
                    new contactJS.AttributeType()
                        .withName('CI_USER_LOCATION_ADDRESS')
                        .withType('STRING')
                );
            },

            'protected interpretData' : function(_data, _function) {
                var self = this;

                if(navigator.onLine){
                    var latitude = _data.getItem(this.inAttributeTypes.getItems()[0].getIdentifier()).getValue();
                    var longitude = _data.getItem(this.inAttributeTypes.getItems()[1].getIdentifier()).getValue();
                    if (latitude && longitude) {
                        var url = "http://maps.googleapis.com/maps/api/geocode/json?latlng="+latitude+","+longitude+"&sensor=false";
                        $.getJSON(url, function(json) {
                            if (!json["status"] == ("OK")){
                                //TODO: handle error case
                            } else {
                                self.setOutAttribute(
                                    'CI_USER_LOCATION_ADDRESS',
                                    'STRING',
                                    json["results"][0]["formatted_address"]
                                );
                            }
                            self.invokeCallback(_function);
                        });
                    }
                } else {
                    //TODO: handle error case
                    this.invokeCallback(_function);
                }


            },

            'private invokeCallback': function(_function) {
                if (_function && typeof(_function) == 'function'){
                    _function();
                }
            }
        });

        return AddressInterpreter;
    });