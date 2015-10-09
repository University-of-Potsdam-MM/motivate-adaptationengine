/**
 * Created by tobias on 25.09.15.
 */
define(['contactJS'], function (contactJS) {
    return (function() {

        DevicePluggedInWidget.description = {
            out: [
                {
                    'name': 'CI_DEVICE_PLUGGED_IN',
                    'type': 'BOOLEAN'
                }
            ],
            const: [
                {
                    'name': '',
                    'type': ''
                }
            ]
        };

        /**
         *
         * @extends Widget
         * @param discoverer
         * @returns {DevicePluggedInWidget}
         * @constructor
         */
        function DevicePluggedInWidget(discoverer) {
            contactJS.Widget.call(this, discoverer);
            this._name = 'DevicePluggedInWidget';

            window.addEventListener("batterystatus", this.queryGenerator, false);

            return this;
        }

        DevicePluggedInWidget.prototype = Object.create(contactJS.Widget.prototype);
        DevicePluggedInWidget.prototype.constructor = DevicePluggedInWidget;

        DevicePluggedInWidget.prototype._initCallbacks = function() {
            this._addCallback(new contactJS.Callback().withName('UPDATE').withContextInformation(this.getOutputContextInformation()));
        };

        DevicePluggedInWidget.prototype.queryGenerator = function(info) {
            var response = new contactJS.AttributeList();
            response.put(this.getOutAttributes().getItems()[0].setValue(info.isPlugged));
            this._sendResponse(response);
        };

        return DevicePluggedInWidget;
    })();
});