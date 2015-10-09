/**
 * Created by tobias on 25.09.15.
 */
define(['contactJS'], function(contactJS) {
    return (function() {

        LocalURIAvailableInterpreter.description = {
            in: [
                {
                    'name':'CI_NETWORK_CONNECTION_TYPE',
                    'type':'STRING'
                },
                {
                    'name':'CI_LOCAL_WIFI_IP',
                    'type':'STRING'
                }
            ],
            out: [
                {
                    'name':'CI_LOCAL_URI_AVAILABLE',
                    'type':'BOOLEAN',
                    'parameterList': [
                        ['CP_URI_COMPONENT', 'STRING', 'PV_INPUT']
                    ]
                }
            ],
            requiredObjects: ["jQuery"]
        };

        /**
         *
         * @extends Interpreter
         * @param {Discoverer} discoverer
         * @constructs LocalURIAvailableInterpreter
         * @returns {LocalURIAvailableInterpreter}
         */
        function LocalURIAvailableInterpreter(discoverer) {
            contactJS.Interpreter.call(this, discoverer);
            this._name = "LocalURIAvailableInterpreter";
            return this;
        }

        LocalURIAvailableInterpreter.prototype = Object.create(contactJS.Interpreter.prototype);
        LocalURIAvailableInterpreter.prototype.constructor = LocalURIAvailableInterpreter;

        LocalURIAvailableInterpreter.prototype._interpretData = function(inAttributes, outAttributes, callback) {
            var self = this;

            var uriAvailable = outAttributes.getItems()[0];
            var uriComponent = uriAvailable.getParameters().getItems()[0].getValue();

            var networkConnectionType = inAttributes.getValueForContextInformationOfKind(this.getInputContextInformation().getItems()[0]);
            var localWifiIP = inAttributes.getValueForContextInformationOfKind(this.getInputContextInformation().getItems()[1]);

            self.log("http://"+localWifiIP+"/"+uriComponent);

            if (networkConnectionType == "wifi" && localWifiIP != "CV_UNKNOWN") {
                $.ajax({
                    url: "http://"+localWifiIP+"/"+uriComponent,
                    success: function(data) {
                        self.log(data);

                        uriAvailable.setValue(true);
                        callback([uriAvailable]);
                    },
                    error: function(jqXHR, textStatus, errorThrown ) {
                        self.log(jqXHR.status);
                        self.log(textStatus);
                        self.log(errorThrown);

                        uriAvailable.setValueError();
                        callback([uriAvailable]);
                    }
                });
            } else {
                uriAvailable.setValueUnknown();
                callback([uriAvailable]);
            }
        };

        return LocalURIAvailableInterpreter;
    })();
});