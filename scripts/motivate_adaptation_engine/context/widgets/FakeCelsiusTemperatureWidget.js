/**
 * Created by tobias on 31.03.15.
 */
define(['contactJS'], function (contactJS) {
    return (function() {

        FakeCelsiusTemperatureWidget.inOut = {
            out: [
                {
                    'name':'CI_CURRENT_TEMPERATURE',
                    'type':'FLOAT',
                    'parameterList': [["CP_TEMPERATURE_SCALE", "CELSIUS"]]
                }
            ],
            const: [
                {
                    'name':'',
                    'type':''
                }
            ]
        };

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