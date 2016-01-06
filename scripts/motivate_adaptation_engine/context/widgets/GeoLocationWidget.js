/**
 * Created by tobias on 25.04.15.
 */
define(['contactJS'], function (contactJS) {
    return (function() {

        GeoLocationWidget.description = {
            out: [
                {
                    'name':'CI_USER_LOCATION_LATITUDE',
                    'type':'FLOAT'
                },
                {
                    'name':'CI_USER_LOCATION_LONGITUDE',
                    'type':'FLOAT'
                }
            ],
            const: [
                {
                    'name':'',
                    'type':''
                }
            ],
            updateInterval: 5000,
            requiredObjects: ["navigator.geolocation"]
        };

        /**
         *
         * @requires contactJS
         * @extends Widget
         * @param discoverer
         * @constructor
         */
        function GeoLocationWidget(discoverer) {
            contactJS.Widget.call(this, discoverer);
            this._name = 'GeoLocationWidget';
            return this;
        }

        GeoLocationWidget.prototype = Object.create(contactJS.Widget.prototype);
        GeoLocationWidget.prototype.constructor = GeoLocationWidget;

        GeoLocationWidget.prototype._initCallbacks = function() {
            this._addCallback(new contactJS.Callback().withName('UPDATE').withContextInformation(this.getOutputContextInformation()));
        };

        GeoLocationWidget.prototype.queryGenerator = function (callback) {
            var self = this;
            var response = new contactJS.ContextInformationList();

            if(navigator.geolocation){
                navigator.geolocation.getCurrentPosition(function(position) {
                    response.put(self.getOutputContextInformation().getItems()[0].setValue(position.coords.latitude));
                    response.put(self.getOutputContextInformation().getItems()[1].setValue(position.coords.longitude));

                    self._sendResponse(response, callback);
                }, function(error) {
                    //TODO: handle error
                    self._sendResponse(response, callback);
                });
            } else {
                //TODO: handle error
                self._sendResponse(response, callback);
            }
        };

        return GeoLocationWidget;
    })();
});