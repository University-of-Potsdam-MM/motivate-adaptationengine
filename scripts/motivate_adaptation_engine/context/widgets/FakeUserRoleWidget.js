/**
 * Created by tobias on 15.10.15.
 */
/**
 * Created by tobias on 31.03.15.
 */
define(['contactJS'], function (contactJS) {
    return (function() {
        FakeUserRoleWidget.description = {
            out: [
                {
                    'name':'CI_USER_ROLE',
                    'type':'STRING'
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
         * @returns {FakeUserRoleWidget}
         * @class FakeUserRoleWidget
         */
        function FakeUserRoleWidget(discoverer) {
            contactJS.Widget.call(this, discoverer);
            this._name = 'FakeUserRoleWidget';
            return this;
        }

        FakeUserRoleWidget.prototype = Object.create(contactJS.Widget.prototype);
        FakeUserRoleWidget.prototype.constructor = FakeUserRoleWidget;

        FakeUserRoleWidget.prototype._initCallbacks = function() {
            this._addCallback(new contactJS.Callback().withName('UPDATE').withContextInformation(this.getOutputContextInformation()));
        };

        FakeUserRoleWidget.prototype.queryGenerator = function(callback) {
            var response = new contactJS.ContextInformationList();
            response.put(this.getOutputContextInformation().getItems()[0].setValue("TEACHER"));
            this._sendResponse(response, callback);
        };

        return FakeUserRoleWidget;
    })();
});