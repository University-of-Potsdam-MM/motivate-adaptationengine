/**
 * Created by tobias on 28.09.15.
 */
define(['contactJS'], function (contactJS) {
    return (function() {

        UPMoodleAvailableWidget.description = {
            out: [
                {
                    'name': 'CI_UP_MOODLE_AVAILABLE',
                    'type': 'BOOLEAN'
                },
                {
                    'name': 'CI_MOODLE_SESSION_COOKIE',
                    'type': 'STRING'
                }
            ],
            const: [
                {
                    'name': '',
                    'type': ''
                }
            ],
            updateInterval: 7000,
            requiredObjects: ["jQuery"]
        };

        /**
         *
         * @extends Widget
         * @param discoverer
         * @returns {UPMoodleAvailableWidget}
         * @constructor
         */
        function UPMoodleAvailableWidget(discoverer) {
            contactJS.Widget.call(this, discoverer);
            this._name = 'UPMoodleAvailableWidget';
            return this;
        }

        UPMoodleAvailableWidget.prototype = Object.create(contactJS.Widget.prototype);
        UPMoodleAvailableWidget.prototype.constructor = UPMoodleAvailableWidget;

        UPMoodleAvailableWidget.prototype._initCallbacks = function() {
            this._addCallback(new contactJS.Callback().withName('UPDATE').withContextInformation(this.getOutputContextInformation()));
        };

        UPMoodleAvailableWidget.prototype.queryGenerator = function(callback) {
            var self = this;

            var moodleAvailable = this.getOutputContextInformation().getItems()[0];
            var moodleSessionCookie = this.getOutputContextInformation().getItems()[1];

            $.ajax({
                url: "https://moodle2.uni-potsdam.de/login/index.php",
                type: "POST",
                beforeSend: function(xhr) {
                    if (moodleSessionCookie.isKnown()) xhr.setRequestHeader("Cookie", "MoodleSession="+moodleSessionCookie.getValue());
                },
                success: function(data, textStatus, jqXHR) {
                    var setCookieHeaderString = jqXHR.getResponseHeader("Set-Cookie");
                    if (setCookieHeaderString) {
                        var setCookieHeaders = setCookieHeaderString.split(";");

                        for (var index in setCookieHeaders) {
                            var theCookieHeader = setCookieHeaders[index].split("=");
                            if (theCookieHeader[0] == "MoodleSession") {
                                moodleSessionCookie.setValue(theCookieHeader[1]);
                            }
                        }
                    }

                    moodleAvailable.setValue(true);

                    var response = new contactJS.ContextInformationList();
                    response.put(moodleAvailable);
                    response.put(moodleSessionCookie);
                    self._sendResponse(response, callback);
                },
                error: function(jqXHR, textStatus, errorThrown ) {
                    self.log(jqXHR.status);
                    self.log(textStatus);
                    self.log(errorThrown);

                    moodleAvailable.setValueError();
                    moodleSessionCookie.setValueError();

                    var response = new contactJS.ContextInformationList();
                    response.put(moodleAvailable);
                    response.put(moodleSessionCookie);
                    self._sendResponse(response, callback);
                }
            });
        };

        return UPMoodleAvailableWidget;
    })();
});