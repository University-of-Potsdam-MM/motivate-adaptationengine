/**
 * Created by tobias on 06.03.15.
 */
define(['contactJS'], function (contactJS) {
    return (function() {

        UnixTimeWidget.description = {
            out: [
                {
                    'name':'CI_CURRENT_UNIX_TIME',
                    'type':'INTEGER',
                    'parameterList': [["CP_UNIT", "STRING", "MILLISECONDS"]]
                }
            ],
            const: [
                {
                    'name':'',
                    'type':''
                }
            ],
            updateInterval: 5000
        };

        /**
         *
         * @extends Widget
         * @param discoverer
         * @returns {UnixTimeWidget}
         * @class UnixTimeWidget
         */
        function UnixTimeWidget(discoverer) {
            contactJS.Widget.call(this, discoverer);
            this._name = 'UnixTimeWidget';
            return this;
        }

        UnixTimeWidget.prototype = Object.create(contactJS.Widget.prototype);
        UnixTimeWidget.prototype.constructor = UnixTimeWidget;

        UnixTimeWidget.prototype._initCallbacks = function() {
            this._addCallback(new contactJS.Callback().withName('UPDATE').withContextInformation(this.getOutputContextInformation()));
        };

        UnixTimeWidget.prototype.queryGenerator = function(callback) {
            // old browser workaround
            if (!Date.now) {
                Date.now = function () {
                    return new Date().getTime();
                }
            }

            var response = new contactJS.ContextInformationList();
            response.put(this.getOutputContextInformation().getItems()[0].setValue(Date.now()));
            this._sendResponse(response, callback)
        };

        return UnixTimeWidget;
    })();
});