/**
 * Created by tobias on 24.09.15.
 */
define(['contactJS'], function (contactJS) {
    return (function() {

        BluetoothEnabledWidget.description = {
            out: [
                {
                    'name': 'CI_BLUETOOTH_ENABLED',
                    'type': 'BOOLEAN'
                }
            ],
            const: [
                {
                    'name': '',
                    'type': ''
                }
            ],
            updateInterval: 9000,
            platforms: ["IOS", "ANDROID"],
            requiredObjects: ["cordova", "cordova.plugins.diagnostic"]
        };

        /**
         *
         * @extends Widget
         * @param discoverer
         * @returns {BluetoothEnabledWidget}
         * @constructor
         */
        function BluetoothEnabledWidget(discoverer) {
            contactJS.Widget.call(this, discoverer);
            this._name = 'BluetoothEnabledWidget';
            return this;
        }

        BluetoothEnabledWidget.prototype = Object.create(contactJS.Widget.prototype);
        BluetoothEnabledWidget.prototype.constructor = BluetoothEnabledWidget;

        BluetoothEnabledWidget.prototype._initCallbacks = function() {
            this._addCallback(new contactJS.Callback().withName('UPDATE').withContextInformation(this.getOutputContextInformation()));
        };

        BluetoothEnabledWidget.prototype.queryGenerator = function(callback) {
            var self = this;

            cordova.plugins.diagnostic.isBluetoothEnabled(function(enabled){
                var response = new contactJS.ContextInformationList();
                response.put(self.getOutputContextInformation().getItems()[0].setValue(!!enabled));
                self._sendResponse(response, callback);
            }, function(error){
                console.error("The following error occurred: "+error);

                var response = new contactJS.ContextInformationList();
                response.put(self.getOutputContextInformation().getItems()[0].setValue("ERROR"));
                self._sendResponse(response, callback);
            });
        };

        return BluetoothEnabledWidget;
    })();
});

