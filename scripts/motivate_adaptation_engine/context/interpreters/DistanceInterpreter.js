/**
 * Created by tobias on 02.04.15.
 */
define(['contactJS'], function(contactJS) {
    return (function() {

        DistanceInterpreter.inOut = {
            in: [
                {
                    'name':'CI_USER_LOCATION_LATITUDE',
                    'type':'FLOAT',
                    'parameterList': [],
                    "synonymList": [],
                    'value':'',
                    'timestamp':''
                },
                {
                    'name':'CI_USER_LOCATION_LONGITUDE',
                    'type':'FLOAT',
                    'parameterList': [],
                    "synonymList": [],
                    'value':'',
                    'timestamp':''
                }
            ],
            out: [
                {
                    'name':'CI_USER_LOCATION_DISTANCE',
                    'type':'FLOAT',
                    'parameterList': [['CP_TARGET_LATITUDE', 'PV_INPUT'], ['CP_TARGET_LONGITUDE', 'PV_INPUT'], ['CP_UNIT','KILOMETERS']],
                    "synonymList": [],
                    'value':'',
                    'timestamp':''
                }
            ]
        };

        /**
         *
         * @param discoverer
         * @extends Interpreter
         * @returns {DistanceInterpreter}
         * @constructor
         */
        function DistanceInterpreter(discoverer, inAttributes, outAttributes) {
            contactJS.Interpreter.call(this, discoverer, inAttributes, outAttributes);
            this.name = "DistanceInterpreter";

            return this;
        }

        DistanceInterpreter.prototype = Object.create(contactJS.Interpreter.prototype);
        DistanceInterpreter.prototype.constructor = DistanceInterpreter;



        DistanceInterpreter.prototype._interpretData = function(inAttributes, outAttributes, callback) {
            var distanceValue = outAttributes.getItems()[0];

            var startingPointLatitude = inAttributes.getValueForAttributeWithTypeOf(this.getInAttributes().getItems()[0]);
            var startingPointLongitude = inAttributes.getValueForAttributeWithTypeOf(this.getInAttributes().getItems()[1]);
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

            callback([
                distanceValue
            ]);
        };

        return DistanceInterpreter;
    })();
});