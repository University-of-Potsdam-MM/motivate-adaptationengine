/**
 * Created by tobias on 24.09.15.
 */
define(['contactJS'], function (contactJS) {
    return (function() {

        WifiEnabledWidget.description = {
            out: [
                {
                    'name': 'CI_WIFI_ENABLED',
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
         * @returns {WifiEnabledWidget}
         * @constructor
         */
        function WifiEnabledWidget(discoverer) {
            contactJS.Widget.call(this, discoverer);
            this._name = 'WifiEnabledWidget';
            return this;
        }

        WifiEnabledWidget.prototype = Object.create(contactJS.Widget.prototype);
        WifiEnabledWidget.prototype.constructor = WifiEnabledWidget;

        WifiEnabledWidget.prototype._initCallbacks = function() {
            this._addCallback(new contactJS.Callback().withName('UPDATE').withAttributeTypes(this.getOutAttributes()));
        };

        WifiEnabledWidget.prototype.queryGenerator = function(callback) {
            var self = this;

            cordova.plugins.diagnostic.isWifiEnabled(function(enabled){
                var response = new contactJS.AttributeList();
                response.put(self.getOutAttributes().getItems()[0].setValue(!!enabled));
                self._sendResponse(response, callback);
            }, function(error){
                console.error("The following error occurred: "+error);

                var response = new contactJS.AttributeList();
                response.put(self.getOutAttributes().getItems()[0].setValue("ERROR"));
                self._sendResponse(response, callback);
            });
        };

        return WifiEnabledWidget;
    })();
});
