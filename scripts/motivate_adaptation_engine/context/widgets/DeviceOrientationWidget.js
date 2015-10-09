/**
 * Created by tobias on 24.09.15.
 */
define(['contactJS'], function (contactJS) {
    return (function() {

        DeviceOrientationWidget.description = {
            out: [
                {
                    'name': 'CI_DEVICE_ORIENTATION',
                    'type': 'FLOAT'
                }
            ],
            const: [
                {
                    'name': '',
                    'type': ''
                }
            ],
            updateInterval: 9000,
            platforms: ["IOS", "ANDROID", "WP7", "WP8", "BLACKBERRY10"],
            requiredObjects: ["cordova", "navigator.compass"]
        };

        /**
         *
         * @extends Widget
         * @param discoverer
         * @returns {DeviceOrientationWidget}
         * @constructor
         */
        function DeviceOrientationWidget(discoverer) {
            contactJS.Widget.call(this, discoverer);
            this._name = 'DeviceOrientationWidget';
            return this;
        }

        DeviceOrientationWidget.prototype = Object.create(contactJS.Widget.prototype);
        DeviceOrientationWidget.prototype.constructor = DeviceOrientationWidget;

        DeviceOrientationWidget.prototype._initCallbacks = function() {
            this._addCallback(new contactJS.Callback().withName('UPDATE').withContextInformation(this.getOutputContextInformation()));
        };

        DeviceOrientationWidget.prototype.queryGenerator = function(callback) {
            var self = this;

            navigator.compass.getCurrentHeading(function(heading){
                var response = new contactJS.AttributeList();
                response.put(self.getOutAttributes().getItems()[0].setValue(heading.magneticHeading));
                self._sendResponse(response, callback);
            }, function(error){
                console.error("The following error occurred: "+error);

                var response = new contactJS.AttributeList();
                response.put(self.getOutAttributes().getItems()[0].setValue("NO_VALUE"));
                self._sendResponse(response, callback);
            });
        };

        return DeviceOrientationWidget;
    })();
});