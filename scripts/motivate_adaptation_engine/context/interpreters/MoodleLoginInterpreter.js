/**
 * Created by tobias on 28.09.15.
 */
define(['contactJS'], function(contactJS) {
    return (function() {

        MoodleLoginInterpreter.description = {
            in: [
                {
                    'name': 'CI_MOODLE_AVAILABLE',
                    'type': 'BOOLEAN',
                    'parameterList': [
                        ['CP_MOODLE_URI', 'STRING', 'PV_INPUT']
                    ]
                },
                {
                    'name': 'CI_MOODLE_SESSION_COOKIE',
                    'type': 'STRING'
                }
            ],
            out: [
                {
                    'name': 'CI_MOODLE_IS_LOGGED_IN',
                    'type': 'BOOLEAN',
                    'parameterList': [
                        ['CP_USERNAME', 'STRING', 'PV_INPUT'],
                        ['CP_USERNAME_FORM_FIELD', 'STRING', 'PV_INPUT'],
                        ['CP_PASSWORD', 'STRING', 'PV_INPUT'],
                        ['CP_PASSWORD_FORM_FIELD', 'STRING', 'PV_INPUT']
                    ]
                }
            ],
            requiredObjects: ["jQuery"]
        };

        /**
         *
         * @extends Interpreter
         * @param {Discoverer} discoverer
         * @constructor
         * @returns {MoodleLoginInterpreter}
         */
        function MoodleLoginInterpreter(discoverer) {
            contactJS.Interpreter.call(this, discoverer);
            this._name = "MoodleLoginInterpreter";
            return this;
        }

        MoodleLoginInterpreter.prototype = Object.create(contactJS.Interpreter.prototype);
        MoodleLoginInterpreter.prototype.constructor = MoodleLoginInterpreter;

        MoodleLoginInterpreter.prototype._interpretData = function(inAttributes, outAttributes, callback) {
            var self = this;

            // input attributes
            var moodleAvailable = inAttributes.getItems()[0];
            var moodleSession = inAttributes.getItems()[1];

            this.log(moodleAvailable.getName());
            this.log(moodleSession.getName());

            var moodleURI = moodleAvailable.getParameters().getItems()[0].getValue();

            // output attributes
            var isLoggedIn = outAttributes.getItems()[0].getValue();
            var username = outAttributes.getItems()[0].getParameters().getItems()[0].getValue();
            var usernameFormField = outAttributes.getItems()[0].getParameters().getItems()[1].getValue();
            var password = outAttributes.getItems()[0].getParameters().getItems()[2].getValue();
            var passwordFormField = outAttributes.getItems()[0].getParameters().getItems()[3].getValue();

            this.log(moodleAvailable);
            this.log(typeof moodleAvailable);
            this.log(moodleURI);

            if (moodleAvailable == "wifi" && localWifiIP != "CV_UNKNOWN") {
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

        return MoodleLoginInterpreter;
    })();
});
