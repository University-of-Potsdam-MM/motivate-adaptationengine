/**
 * Created by tobias on 25.03.15.
 */
define(['easejs', 'contactJS'],
    function(easejs, contactJS) {
        var Class = easejs.Class;

        var AddressInterpreter = Class('AddressInterpreter').extend(contactJS.Interpreter, {
            'public name' : 'AddressInterpreter',

            'protected initInAttributes' : function() {
                this.setInAttributes([
                    new contactJS.Attribute()
                        .withName('CI_USER_LOCATION_LATITUDE')
                        .withType('FLOAT'),
                    new contactJS.Attribute()
                        .withName('CI_USER_LOCATION_LONGITUDE')
                        .withType('FLOAT')
                ]);
            },

            'protected initOutAttributes' : function() {
                this.setOutAttributes([
                    new contactJS.Attribute()
                        .withName('CI_USER_LOCATION_ADDRESS')
                        .withType('STRING')
                ]);
            },

            'protected interpretData' : function(_inAttributeValues, _outAttributeValues, _callback) {
                var addressValue = _outAttributeValues.getItems()[0];

                var latitude = _inAttributeValues.getValueForAttributeWithTypeOf(this.inAttributeTypes.getItems()[0]);
                var longitude = _inAttributeValues.getValueForAttributeWithTypeOf(this.inAttributeTypes.getItems()[1]);

                if(navigator.onLine){
                    if (latitude && longitude) {
                        var url = "http://maps.googleapis.com/maps/api/geocode/json?latlng="+latitude+","+longitude+"&sensor=false";
                        $.getJSON(url, function(json) {
                            if (!json["status"] == ("OK")) {
                                //TODO: handle error case
                                addressValue.setValue("NO_VALUE");
                            } else {
                                addressValue.setValue(json["results"][0]["formatted_address"]);
                            }
                            _callback([addressValue]);
                        });
                    }
                } else {
                    //TODO: handle error case
                    addressValue.setValue("NO_VALUE");
                    _callback([addressValue]);
                }
            }
        });

        return AddressInterpreter;
    });