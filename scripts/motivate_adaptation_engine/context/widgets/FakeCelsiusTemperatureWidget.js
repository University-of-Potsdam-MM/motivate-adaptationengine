/**
 * Created by tobias on 31.03.15.
 */
define(['contactJS'], function (contactJS) {
    return (function() {
        /**
         *
         * @extends Widget
         * @param discoverer
         * @returns {FakeCelsiusTemperatureWidget}
         * @constructor
         */
        function FakeCelsiusTemperatureWidget(discoverer) {
            contactJS.Widget.call(this, discoverer);
            this.name = 'FakeCelsiusTemperatureWidget';

            return this;
        }

        FakeCelsiusTemperatureWidget.prototype = Object.create(contactJS.Widget.prototype);
        FakeCelsiusTemperatureWidget.prototype.constructor = FakeCelsiusTemperatureWidget;

        FakeCelsiusTemperatureWidget.prototype._initOutAttributes = function() {
            this._setOutAttributes([
                new contactJS.Attribute()
                    .withName('CI_CURRENT_TEMPERATURE')
                    .withType('FLOAT')
                    .withParameter(new contactJS.Parameter().withKey("CP_TEMPERATURE_SCALE").withValue("CELSIUS"))
            ]);
        };

        FakeCelsiusTemperatureWidget.prototype._initConstantOutAttributes = function() {

        };

        FakeCelsiusTemperatureWidget.prototype._initCallbacks = function() {
            this._addCallback(new contactJS.Callback().withName('UPDATE').withAttributeTypes(this.getOutAttributes()));
        };

        FakeCelsiusTemperatureWidget.prototype.queryGenerator = function(callback) {
            var response = new contactJS.AttributeList();
            response.put(this.getOutAttributes().getItems()[0].setValue("25"));
            this._sendResponse(response, callback);
        };

        return FakeCelsiusTemperatureWidget;
    })();
});