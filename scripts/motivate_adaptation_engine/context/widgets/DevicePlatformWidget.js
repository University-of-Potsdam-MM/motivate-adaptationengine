/**
 * Created by tobias on 24.09.15.
 */
define(['contactJS'], function (contactJS) {
    return (function() {

        DevicePlatformWidget.description = {
            out: [
                {
                    'name': 'CI_DEVICE_PLATFORM',
                    'type': 'STRING'
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
            requiredObjects: ["cordova", "device"]
        };

        /**
         *
         * @extends Widget
         * @param discoverer
         * @returns {DevicePlatformWidget}
         * @constructor
         */
        function DevicePlatformWidget(discoverer) {
            contactJS.Widget.call(this, discoverer);
            this._name = 'DevicePlatformWidget';
            return this;
        }

        DevicePlatformWidget.prototype = Object.create(contactJS.Widget.prototype);
        DevicePlatformWidget.prototype.constructor = DevicePlatformWidget;

        DevicePlatformWidget.prototype._initCallbacks = function() {
            this._addCallback(new contactJS.Callback().withName('UPDATE').withContextInformation(this.getOutputContextInformation()));
        };

        DevicePlatformWidget.prototype.queryGenerator = function(callback) {
            var self = this;

            var response = new contactJS.AttributeList();
            response.put(self.getOutAttributes().getItems()[0].setValue(device.platform));
            self._sendResponse(response, callback);
        };

        return DevicePlatformWidget;
    })();
});