/**
 * Created by tobias on 06.03.15.
 */
define(['contactJS'], function (contactJS) {
    return (function() {
        /**
         *
         * @extends Widget
         * @param discoverer
         * @returns {UnixTimeWidget}
         * @constructor
         */
        function UnixTimeWidget(discoverer) {
            contactJS.Widget.call(this, discoverer);
            this.name = 'UnixTimeWidget';

            return this;
        }

        UnixTimeWidget.prototype = Object.create(contactJS.Widget.prototype);
        UnixTimeWidget.prototype.constructor = UnixTimeWidget;

        UnixTimeWidget.prototype._initOutAttributes = function() {
            this._setOutAttributes([
                new contactJS.Attribute()
                    .withName('CI_CURRENT_UNIX_TIME')
                    .withType('INTEGER')
                    .withParameter(new contactJS.Parameter().withKey("CP_UNIT").withValue("MILLISECONDS"))
            ]);
        };

        UnixTimeWidget.prototype._initConstantOutAttributes = function() {

        };

        UnixTimeWidget.prototype._initCallbacks = function() {
            this._addCallback(new contactJS.Callback().withName('UPDATE').withAttributeTypes(this.getOutAttributes()));
        };

        UnixTimeWidget.prototype.queryGenerator = function(callback) {
            // old browser workaround
            if (!Date.now) {
                Date.now = function () {
                    return new Date().getTime();
                }
            }

            var response = new contactJS.AttributeList();
            response.put(this.getOutAttributes().getItems()[0].setValue(Date.now()));
            this._sendResponse(response, callback)
        };

        return UnixTimeWidget;
    })();
});