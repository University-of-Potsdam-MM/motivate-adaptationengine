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
                        .withName('CI_USER_LOCATION_DISTANCE')
                        .withType('FLOAT')
                        .withParameter(new contactJS.Parameter().withKey("CP_TARGET_LATITUDE").withValue("PV_INPUT"))
                        .withParameter(new contactJS.Parameter().withKey("CP_TARGET_LONGITUDE").withValue("PV_INPUT"))
                        .withParameter(new contactJS.Parameter().withKey("CP_UNIT").withValue("KILOMETERS"))
                );
            },

            'protected interpretData' : function(_inAttributeValues, _outAttributeValues, _function) {
                var distanceValue = _outAttributeValues.getItems()[0];

                var startingPointLatitude = _inAttributeValues.getValueForAttributeType(this.inAttributeTypes.getItems()[0]);
                var startingPointLongitude = _inAttributeValues.getValueForAttributeType(this.inAttributeTypes.getItems()[1]);
                var endPointLatitude = distanceValue.getParameters().getItems()[0].getValue();
                var endPointLongitude = distanceValue.getParameters().getItems()[1].getValue();

                function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
                    var R = 6371; // Radius of the earth in km
                    var dLat = deg2rad(lat2-lat1);  // deg2rad below
                    var dLon = deg2rad(lon2-lon1);
                    var a =
                            Math.sin(dLat/2) * Math.sin(dLat/2) +
                            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                            Math.sin(dLon/2) * Math.sin(dLon/2)
                        ;
                    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    var d = R * c; // Distance in km
                    return d;
                }

                function deg2rad(deg) {
                    return deg * (Math.PI/180)
                }

                distanceValue.setValue(getDistanceFromLatLonInKm(startingPointLatitude, startingPointLongitude, endPointLatitude, endPointLongitude));

                var interpretedData = new contactJS.AttributeValueList().withItems([
                      distanceValue
                ]);

                if (_function && typeof(_function) == 'function') {
                    _function(interpretedData);
                }
            }
        });

        return DistanceInterpreter;
    });