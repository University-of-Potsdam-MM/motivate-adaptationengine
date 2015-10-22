/**
 * Created by tobias on 24.09.15.
 */
define(['contactJS'], function (contactJS) {
    return (function() {

        LocalWifiIPWidget.description = {
            out: [
                {
                    'name': 'CI_LOCAL_WIFI_IP',
                    'type': 'STRING'
                }
            ],
            const: [
                {
                    'name': '',
                    'type': ''
                }
            ],
            updateInterval: 10000,
            platforms: ["IOS", "ANDROID", "WP8", "BLACKBERRY10"],
            requiredObjects: ["cordova", "networkinterface"]
        };

        /**
         *
         * @extends Widget
         * @param discoverer
         * @returns {LocalWifiIPWidget}
         * @constructor
         */
        function LocalWifiIPWidget(discoverer) {
            contactJS.Widget.call(this, discoverer);
            this._name = 'LocalWifiIPWidget';
            return this;
        }

        LocalWifiIPWidget.prototype = Object.create(contactJS.Widget.prototype);
        LocalWifiIPWidget.prototype.constructor = LocalWifiIPWidget;

        LocalWifiIPWidget.prototype._initCallbacks = function() {
            this._addCallback(new contactJS.Callback().withName('UPDATE').withContextInformation(this.getOutputContextInformation()));
        };

        LocalWifiIPWidget.prototype.queryGenerator = function(callback) {
            var self = this;

            networkinterface.getIPAddress(function(ip){
                var response = new contactJS.ContextInformationList();
                response.put(self.getOutputContextInformation().getItems()[0].setValue(ip));
                self._sendResponse(response, callback);
            }, function(){
                var response = new contactJS.ContextInformationList();
                response.put(self.getOutputContextInformation().getItems()[0].setValue("CV_UNKNOWN"));
                self._sendResponse(response, callback);
            });
        };

        return LocalWifiIPWidget;
    })();
});

