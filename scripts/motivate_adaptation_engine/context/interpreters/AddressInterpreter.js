/**
 * Created by tobias on 25.03.15.
 */
define(['contactJS'], function(contactJS) {
    return (function() {
        /**
         *
         * @requires contactJS
         * @extends Interpreter
         * @param discoverer
         * @constructor
         */
        function AddressInterpreter(discoverer) {
            contactJS.Interpreter.call(this, discoverer);
            this.name = "AddressInterpreter";
        }

        AddressInterpreter.prototype = Object.create(contactJS.Interpreter.prototype);
        AddressInterpreter.prototype.constructor = AddressInterpreter;

        AddressInterpreter.prototype._initInAttributes = function() {
            this._setInAttributes([
                this._discoverer.buildAttribute('CI_USER_LOCATION_LATITUDE','FLOAT'),
                this._discoverer.buildAttribute('CI_USER_LOCATION_LONGITUDE','FLOAT')
            ]);
        };

        AddressInterpreter.prototype._initOutAttributes = function() {
            this._setOutAttributes([
                this._discoverer.buildAttribute('CI_USER_LOCATION_ADDRESS','STRING')
            ]);
        };

        AddressInterpreter.prototype._interpretData = function(inAttributes, outAttributes, callback) {
            var addressValue = outAttributes.getItems()[0];

            var latitude = inAttributes.getValueForAttributeWithTypeOf(this.getInAttributes().getItems()[0]);
            var longitude = inAttributes.getValueForAttributeWithTypeOf(this.getInAttributes().getItems()[1]);

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
                        callback([addressValue]);
                    });
                }
            } else {
                //TODO: handle error case
                addressValue.setValue("NO_VALUE");
                callback([addressValue]);
            }
        };

        return AddressInterpreter;
    })();
});