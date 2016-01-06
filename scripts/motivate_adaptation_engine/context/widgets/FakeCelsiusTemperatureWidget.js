/**
 * Created by tobias on 31.03.15.
 */
define(['contactJS'], function (contactJS) {
    return (function() {

        FakeCelsiusTemperatureWidget.description = {
            out: [
                {
                    'name':'CI_CURRENT_TEMPERATURE',
                    'type':'FLOAT',
                    'parameterList': [["CP_TEMPERATURE_SCALE", "STRING", "CELSIUS"]]
                }
            ],
            const: [
                {
                    'name':'',
                    'type':''
                }
            ],
            updateInterval: 30000
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
            this._name = 'FakeCelsiusTemperatureWidget';
            return this;
        }

        FakeCelsiusTemperatureWidget.prototype = Object.create(contactJS.Widget.prototype);
        FakeCelsiusTemperatureWidget.prototype.constructor = FakeCelsiusTemperatureWidget;

        FakeCelsiusTemperatureWidget.prototype._initCallbacks = function() {
            this._addCallback(new contactJS.Callback().withName('UPDATE').withContextInformation(this.getOutputContextInformation()));
        };

        FakeCelsiusTemperatureWidget.prototype.queryGenerator = function(callback) {
            var response = new contactJS.ContextInformationList();
            response.put(this.getOutputContextInformation().getItems()[0].setValue(Math.floor((Math.random() * 30) + 1)));
            this._sendResponse(response, callback);
        };

        return FakeCelsiusTemperatureWidget;
    })();
});