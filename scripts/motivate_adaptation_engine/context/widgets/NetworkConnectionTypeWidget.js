/**
 * Created by tobias on 25.09.15.
 */
define(['contactJS'], function (contactJS) {
    return (function() {

        NetworkConnectionTypeWidget.description = {
            out: [
                {
                    'name': 'CI_NETWORK_CONNECTION_TYPE',
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
            requiredObjects: ["cordova", "navigator.connection"]
        };

        /**
         *
         * @extends Widget
         * @param discoverer
         * @returns {NetworkConnectionTypeWidget}
         * @constructor
         */
        function NetworkConnectionTypeWidget(discoverer) {
            contactJS.Widget.call(this, discoverer);
            this._name = 'NetworkConnectionTypeWidget';
            return this;
        }

        NetworkConnectionTypeWidget.prototype = Object.create(contactJS.Widget.prototype);
        NetworkConnectionTypeWidget.prototype.constructor = NetworkConnectionTypeWidget;

        NetworkConnectionTypeWidget.prototype._initCallbacks = function() {
            this._addCallback(new contactJS.Callback().withName('UPDATE').withContextInformation(this.getOutputContextInformation()));
        };

        NetworkConnectionTypeWidget.prototype.queryGenerator = function(callback) {
            var self = this;

            var response = new contactJS.ContextInformationList();
            response.put(self.getOutputContextInformation().getItems()[0].setValue(navigator.connection.type));
            self._sendResponse(response, callback);
        };

        return NetworkConnectionTypeWidget;
    })();
});