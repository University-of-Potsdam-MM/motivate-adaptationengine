/**
 * Created by tobias on 24.09.15.
 */
define(['contactJS'], function (contactJS) {
    return (function() {

        DeviceModelWidget.description = {
            out: [
                {
                    'name': 'CI_DEVICE_MODEL',
                    'type': 'STRING'
                }
            ],
            const: [
                {
                    'name': '',
                    'type': ''
                }
            ],
            updateInterval: 60000,
            platforms: ["IOS", "ANDROID", "WP7", "WP8", "BLACKBERRY10"],
            requiredObjects: ["cordova", "device"]
        };

        /**
         *
         * @extends Widget
         * @param discoverer
         * @returns {DeviceModelWidget}
         * @constructor
         */
        function DeviceModelWidget(discoverer) {
            contactJS.Widget.call(this, discoverer);
            this._name = 'DeviceModelWidget';
            return this;
        }

        DeviceModelWidget.prototype = Object.create(contactJS.Widget.prototype);
        DeviceModelWidget.prototype.constructor = DeviceModelWidget;

        DeviceModelWidget.prototype._initCallbacks = function() {
            this._addCallback(new contactJS.Callback().withName('UPDATE').withContextInformation(this.getOutputContextInformation()));
        };

        DeviceModelWidget.prototype.queryGenerator = function(callback) {
            var self = this;

            var response = new contactJS.ContextInformationList();
            response.put(self.getOutputContextInformation().getItems()[0].setValue(device.model));
            self._sendResponse(response, callback);
        };

        return DeviceModelWidget;
    })();
});