/**
 * Created by tobias on 25.09.15.
 */
define(['contactJS'], function (contactJS) {
    return (function() {

        BatteryStatusWidget.description = {
            out: [
                {
                    'name': 'CI_DEVICE_BATTERY_STATUS',
                    'type': 'INTEGER'
                }
            ],
            const: [
                {
                    'name': '',
                    'type': ''
                }
            ],
            platforms: ["IOS", "ANDROID"],
            requiredObjects: ["cordova"]
        };

        /**
         *
         * @extends Widget
         * @param discoverer
         * @returns {BatteryStatusWidget}
         * @constructor
         */
        function BatteryStatusWidget(discoverer) {
            contactJS.Widget.call(this, discoverer);
            this._name = 'BatteryStatusWidget';

            window.addEventListener("batterystatus", this.queryGenerator, false);

            return this;
        }

        BatteryStatusWidget.prototype = Object.create(contactJS.Widget.prototype);
        BatteryStatusWidget.prototype.constructor = BatteryStatusWidget;

        BatteryStatusWidget.prototype._initCallbacks = function() {
            this._addCallback(new contactJS.Callback().withName('UPDATE').withContextInformation(this.getOutputContextInformation()));
        };

        BatteryStatusWidget.prototype.queryGenerator = function(info) {
            var response = new contactJS.ContextInformationList();
            response.put(this.getOutputContextInformation().getItems()[0].setValue(info.level));
            this._sendResponse(response);
        };

        return BatteryStatusWidget;
    })();
});