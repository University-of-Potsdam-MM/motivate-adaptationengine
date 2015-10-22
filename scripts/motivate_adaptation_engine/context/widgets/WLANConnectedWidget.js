/**
 * Created by tobias on 24.09.15.
 */
define(['contactJS'], function (contactJS) {
    return (function() {

        WLANConnectedWidget.description = {
            out: [
                {
                    'name': 'CI_WLAN_CONNECTED',
                    'type': 'BOOLEAN'
                }
            ],
            const: [
                {
                    'name': '',
                    'type': ''
                }
            ],
            updateInterval: 10000
        };

        /**
         *
         * @extends Widget
         * @param discoverer
         * @returns {WLANConnectedWidget}
         * @constructor
         */
        function WLANConnectedWidget(discoverer) {
            contactJS.Widget.call(this, discoverer);
            this._name = 'WLANConnectedWidget';
            return this;
        }

        WLANConnectedWidget.prototype = Object.create(contactJS.Widget.prototype);
        WLANConnectedWidget.prototype.constructor = WLANConnectedWidget;

        WLANConnectedWidget.prototype._initCallbacks = function() {
            this._addCallback(new contactJS.Callback().withName('UPDATE').withContextInformation(this.getOutputContextInformation()));
        };

        WLANConnectedWidget.prototype.queryGenerator = function(callback) {
            var response = new contactJS.ContextInformationList();
            response.put(this.getOutputContextInformation().getItems()[0].setValue(Date.now()));
            this._sendResponse(response, callback)
        };

        return WLANConnectedWidget;
    })();
});