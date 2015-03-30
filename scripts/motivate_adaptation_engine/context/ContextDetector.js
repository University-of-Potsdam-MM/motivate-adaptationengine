define("MoCD", ['nools', 'jquery', 'MoCI', 'contactJS', 'MoWI_UnixTime', 'MoIN_UnixTime', 'MoWI_GeoLocation', 'MoIN_Address',
    'lib/parser/constraint/parser'], function(nools, $, ContextInformation, contactJS, UnixTimeWidget, UnixTimeInterpreter, GeoLocationWidget, AddressInterpreter) {

    var ContextDetector = (function() {

        /**
         * The context detector encapsulates the context toolkit which provides context information.
         * @class
         * @constructs ContextDetector
         * @param adaptationRules {*|Array} The adaptation rules that are returned by the rule engine are used to determine which context information are required.
         */
        function ContextDetector(adaptationRules) {
            var self = this;

            this._aggregators = [];
            this._contextInformation = [];
            this._currentContextInformation = null;
            this._currentParameter = null;
            this._expectParameterValue = false;
            this._callbacks = {
                "newContextInformationCallback": function() {
                    console.log("Warning! There is no callback set to handle new context information.");
                },
                "updateContextInformationCallback": function() {
                    console.log("Warning! There is no callback set to handle updated context information.");
                }
            };

            this._discoverer = new contactJS.Discoverer();

            // TODO: dynamic context information extraction
            for(var index in adaptationRules) {
                var adaptationRule = adaptationRules[index];
                var lastConstraint = adaptationRule.constraints[adaptationRule.constraints.length - 1];
                this._extractContextInformationFromParsedConstraints(parser.parse(lastConstraint[lastConstraint.length - 1]));

                //var ruleAggregator = new contactJS.Aggregator(_this.discoverer);
            }

            //TODO: Dynamic Configuration
            // (CI_CURRENT_UNIX_TIME:INTEGER)#[CP_UNIT:MILLISECONDS]
            var attributeTypeUnixTimeMilliseconds = contactJS.AttributeType().withName('CI_CURRENT_UNIX_TIME').withType('INTEGER').withParameter(new contactJS.Parameter().withKey("CP_UNIT").withValue("MILLISECONDS"));
            // (CI_CURRENT_UNIX_TIME:INTEGER)#[CP_UNIT:SECONDS]
            var attributeTypeUnixTimeSeconds = contactJS.AttributeType().withName('CI_CURRENT_UNIX_TIME').withType('INTEGER').withParameter(new contactJS.Parameter().withKey("CP_UNIT").withValue("SECONDS"));
            // (CI_USER_LOCATION_LATITUDE:FLOAT)
            var attributeTypeLatitude = contactJS.AttributeType().withName('CI_USER_LOCATION_LATITUDE').withType('FLOAT');
            // (CI_USER_LOCATION_LONGITUDE:FLOAT)
            var attributeTypeLongitude = contactJS.AttributeType().withName('CI_USER_LOCATION_LONGITUDE').withType('FLOAT');
            // (CI_USER_LOCATION_ADDRESS:STRING)
            var attributeTypeAddress = contactJS.AttributeType().withName('CI_USER_LOCATION_ADDRESS').withType('STRING');

            // Add widgets
            new UnixTimeWidget(this._discoverer);
            new GeoLocationWidget(this._discoverer);

            // Add interpreters
            new UnixTimeInterpreter(this._discoverer);
            new AddressInterpreter(this._discoverer);

            var unixTimeAggregator = new contactJS.Aggregator(this._discoverer, [
                attributeTypeUnixTimeMilliseconds,
                attributeTypeUnixTimeSeconds
            ]);

            var locationAggregator = new contactJS.Aggregator(this._discoverer, [
                attributeTypeLatitude,
                attributeTypeLongitude,
                attributeTypeAddress
            ]);

            this._aggregators.push(unixTimeAggregator);
            this._aggregators.push(locationAggregator);
        }

        /**
         * Sets a function as the callback for the provided callback name.
         * @alias setCallback
         * @memberof ContextDetector#
         * @param callbackName {string} The name of the callback.
         * @param callback {function} The function that handles the callback.
         */
        ContextDetector.setCallback = function(callbackName, callback) {
            this._callbacks[callbackName] = callback;
        };

        ContextDetector.prototype._extractContextInformationFromParsedConstraints = function(parsedConstraints) {
            var parameterValueExceptions = ["string", "propLookup"];

            for(var index in parsedConstraints) {
                var parsedConstraint = parsedConstraints[index];
                if ($.isArray(parsedConstraint)) {
                    this._extractContextInformationFromParsedConstraints(parsedConstraint);
                } else if (parsedConstraint != null && typeof parsedConstraint == "string") {
                    if (parsedConstraint.indexOf("MeasurableInformation") > -1) {
                        if (this._currentContextInformation != null) {
                            this.addContextInformation(this._currentContextInformation, false);
                        }
                        this._currentContextInformation = new ContextInformation(parsedConstraint);
                    } else if (parsedConstraint.indexOf("ContextParameter") > -1) {
                        this._currentParameter = parsedConstraint;
                        this._expectParameterValue = true;
                    } else if (this._expectParameterValue && typeof parsedConstraint == "string" && $.inArray(parsedConstraint, parameterValueExceptions) == -1) {
                        this._expectParameterValue = false;
                        this._currentContextInformation.setParameterValue(this._currentParameter, parsedConstraint);
                        this._currentParameter = null;
                    }
                }
            }
        };

        /**
         * Returns true if the given context information was gathered before.
         * @alias contextInformationExists
         * @memberof ContextDetector#
         * @param contextInformation {ContextInformation} The context information to test.
         * @returns {Boolean}
         */
        ContextDetector.prototype.contextInformationExists = function(contextInformation) {
            return this._indexForContextInformation(contextInformation) != -1;
        };

        ContextDetector.prototype._indexForContextInformation = function(contextInformation) {
            for(index in this._contextInformation) {
                var existingContextInformation = this._contextInformation[index];
                if (existingContextInformation.equals(contextInformation)) return index;
            }
            return -1;
        };

        /**
         * Adds a context information that wasn't gathered before.
         * @alias addContextInformation
         * @memberof ContextDetector#
         * @param newContextInformation {ContextInformation} The new context information.
         * @param multiple {Boolean} Set to true if multiple instances of the context information are allowed.
         */
        ContextDetector.prototype.addContextInformation = function(newContextInformation, multiple) {
            if (multiple || !multiple && !this.contextInformationExists(newContextInformation)) {
                this._contextInformation.push(newContextInformation);
            }
        };

        /**
         * Updates a context information that was gathered before.
         * @alias updateContextInformation
         * @memberof ContextDetector#
         * @param updatedContextInformation {ContextInformation} The updated context information.
         * @param multiple {Boolean} Set to true if multiple instances of the context information are allowed.
         */
        ContextDetector.prototype.updateContextInformation = function(updatedContextInformation, multiple) {
            if (multiple) {
                this.addContextInformation(updatedContextInformation, multiple);
            } else {
                if (this.indexForContextInformation(updatedContextInformation) != -1) this.contextInformation[index] = updatedContextInformation;
            }
        };

        /**
         * Returns all context information.
         * @alias getContextInformation
         * @memberof ContextDetector#
         * @returns {Array.<ContextInformation>}
         */
        ContextDetector.prototype.getContextInformation = function() {
            var self = this;

            for (var index in this._aggregators) {
                var theAggregator = this._aggregators[index];

                theAggregator.queryReferencedComponents(function(attributeValues) {
                    for (var attributeValueIndex in attributeValues.getItems()) {
                        var theAttributeValue = attributeValues.getItems()[attributeValueIndex];

                        //TODO: add und update zuammenfügen
                        self.addContextInformation(ContextInformation.fromAttributeValue(theAttributeValue, false));
                    }
                });
            }
        };

        return ContextDetector;
    })();

    return ContextDetector;
});