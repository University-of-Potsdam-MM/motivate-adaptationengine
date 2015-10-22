/**
 * Created by tobias on 25.03.15.
 */
define(['contactJS'], function(contactJS) {
    return (function() {

        AddressInterpreter.description = {
            in: [
                {
                    'name':'CI_USER_LOCATION_LATITUDE',
                    'type':'FLOAT'
                },
                {
                    'name':'CI_USER_LOCATION_LONGITUDE',
                    'type':'FLOAT'
                }
            ],
            out: [
                {
                    'name':'CI_USER_LOCATION_ADDRESS',
                    'type':'STRING'
                }
            ],
            requiredObjects: ["jQuery"]
        };

        /**
         *
         * @requires contactJS
         * @extends Interpreter
         * @param discoverer
         * @constructor
         */
        function AddressInterpreter(discoverer) {
            contactJS.Interpreter.call(this, discoverer);
            this._name = "AddressInterpreter";
            return this;
        }

        AddressInterpreter.prototype = Object.create(contactJS.Interpreter.prototype);
        AddressInterpreter.prototype.constructor = AddressInterpreter;

        AddressInterpreter.prototype._interpretData = function(inAttributes, outAttributes, callback) {
            var self = this;

            var addressValue = outAttributes.getItems()[0];

            var latitude = inAttributes.getValueForContextInformationOfKind(this.getInputContextInformation().getItems()[0]);
            var longitude = inAttributes.getValueForContextInformationOfKind(this.getInputContextInformation().getItems()[1]);

            if (latitude && longitude) {
                $.ajax({
                    url: "http://maps.googleapis.com/maps/api/geocode/json?latlng="+latitude+","+longitude+"&sensor=true",
                    dataType: 'json',
                    success: function(json) {
                        if (json["status"] != ("OK")) {
                            //TODO: handle error case
                            addressValue.setValue(json["status"]);
                        } else {
                            addressValue.setValue(json["results"][0]["formatted_address"]);
                        }
                        callback([addressValue]);
                    },
                    error: function(jqXHR, textStatus, errorThrown ) {
                        self.log(jqXHR.status);
                        self.log(textStatus);
                        self.log(errorThrown);
                    }
                });
            } else {
                addressValue.setValue("NO_LAT_LONG");
                callback([addressValue]);
            }
        };

        return AddressInterpreter;
    })();
});