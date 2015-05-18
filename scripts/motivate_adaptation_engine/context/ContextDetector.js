define("MoCD", ['nools', 'jquery', 'MoCI', 'contactJS', 'MoWI_UnixTime', 'MoIN_UnixTime', 'MoWI_GeoLocation', 'MoIN_Address', 'MoIN_ISO8601', 'MoWI_FakeCelsiusTemperature', 'MoIN_CelsiusToFahrenheit', 'MoIN_Seconds', 'MoIN_Distance',
    'lib/parser/constraint/parser'], function(nools, $, ContextInformation, contactJS, UnixTimeWidget, UnixTimeInterpreter, GeoLocationWidget, AddressInterpreter, ISO8601Interpreter, FakeCelsiusTemperatureWidget, CelsiusToFahrenheitInterpreter, SecondsInterpreter, DistanceInterpreter) {

    var ContextDetector = (function() {

        /**
         * The context detector encapsulates the context toolkit which provides context information.
         * @class
         * @constructs ContextDetector
         * @param adaptationRules {*|Array} The adaptation rules that are returned by the rule engine are used to determine which context information are required.
         * @param verbose {boolean} Activates console output if set to true.
         */
        function ContextDetector(adaptationRules, verbose) {
            var self = this;

            this._verbose = verbose;
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
            
           
            this._discoverer = new contactJS.Discoverer([
                    new contactJS.Translation (
                    		new contactJS.Attribute()
                            .withName('CI_CURRENT_UNIX_TIME')
                            .withType('INTEGER')
                            .withParameter(new contactJS.Parameter()
                                .withKey("CP_UNIT")
                                .withValue("SECONDS"))
                                ,
                            new contactJS.Attribute()
                            .withName('CI_BASE_UNIT_OF_TIME')
                            .withType('INTEGER')
                            .withParameter(new contactJS.Parameter()
                                .withKey("CP_UNIT")
                                .withValue("SECONDS"))
                    ),
                    new contactJS.Translation(
                    		new contactJS.Attribute()
			                    .withName('CI_CURRENT_UNIX_TIME')
			                    .withType('INTEGER')
			                    .withParameter(new contactJS.Parameter()
				                    .withKey("CP_UNIT")
				                    .withValue("MILLISECONDS"))
				            ,
		                    new contactJS.Attribute()
			                    .withName('CI_BASE_UNIT_OF_TIME')
			                    .withType('INTEGER')
			                    .withParameter(new contactJS.Parameter()
				                    .withKey("CP_UNIT")
				                    .withValue("MILLISECONDS"))
				   )
            ]);

            // TODO: dynamic context information extraction
            for(var index in adaptationRules) {
                var adaptationRule = adaptationRules[index];
                var lastConstraint = adaptationRule.constraints[adaptationRule.constraints.length - 1];
                this._extractContextInformationFromParsedConstraints(parser.parse(lastConstraint[lastConstraint.length - 1]));

                //var ruleAggregator = new contactJS.Aggregator(_this.discoverer);
            }

            //TODO: Dynamic Configuration           
            // (CI_CURRENT_UNIX_TIME:INTEGER)#[CP_UNIT:MILLISECONDS]
            var attributeTypeUnixTimeMilliseconds = this._discoverer.buildAttribute('CI_CURRENT_UNIX_TIME','INTEGER', [["CP_UNIT","MILLISECONDS"]]);
            // (CI_CURRENT_UNIX_TIME:INTEGER)#[CP_UNIT:SECONDS]
            var attributeTypeUnixTimeSeconds = this._discoverer.buildAttribute('CI_CURRENT_UNIX_TIME','INTEGER',[["CP_UNIT","SECONDS"]]);
/*            // (CI_USER_LOCATION_LATITUDE:FLOAT)
            var attributeTypeLatitude = this._discoverer.buildAttribute('CI_USER_LOCATION_LATITUDE','FLOAT');
            // (CI_USER_LOCATION_LONGITUDE:FLOAT)
            var attributeTypeLongitude = this._discoverer.buildAttribute('CI_USER_LOCATION_LONGITUDE','FLOAT');
            // (CI_USER_LOCATION_ADDRESS:STRING)
            var attributeTypeAddress = this._discoverer.buildAttribute('CI_USER_LOCATION_ADDRESS','STRING');
            // (CI_CURRENT_FORMATTED_TIME:STRING)#[CP_FORMAT:YYYYMMDD]
            var attributeFormattedTime = this._discoverer.buildAttribute('CI_CURRENT_FORMATTED_TIME','STRING',[["CP_FORMAT","YYYYMMDD"]]);
            // (CI_CURRENT_TEMPERATURE:FLOAT)#[CP_TEMPERATURE_SCALE:FAHRENHEIT]
            var attributeTemperatureFahrenheit = this._discoverer.buildAttribute('CI_CURRENT_TEMPERATURE','FLOAT',[["CP_TEMPERATURE_SCALE","FAHRENHEIT"]]);
            // (CI_USER_LOCATION_DISTANCE:FLOAT)#[CP_TARGET_LATITUDE:52][CP_TARGET_LONGITUDE:13][CP_UNIT:KILOMETERS]
            var attributeDistanceKilometers = this._discoverer.buildAttribute('CI_USER_LOCATION_DISTANCE','FLOAT',[["CP_TARGET_LATITUDE","52.38834"],["CP_TARGET_LONGITUDE","13.09817"],["CP_UNIT","KILOMETERS"]]);
            var attributeDistanceKilometers2 = this._discoverer.buildAttribute('CI_USER_LOCATION_DISTANCE','FLOAT',[["CP_TARGET_LATITUDE","20"],["CP_TARGET_LONGITUDE","20"],["CP_UNIT","KILOMETERS"]]);
*/
            // Add widgets
            new UnixTimeWidget(this._discoverer);
/*            new GeoLocationWidget(this._discoverer);
            new FakeCelsiusTemperatureWidget(this._discoverer);
*/
            // Add interpreters
            //new UnixTimeInterpreter(this._discoverer);
          //  new AddressInterpreter(this._discoverer);
          //  new ISO8601Interpreter(this._discoverer);
          //  new CelsiusToFahrenheitInterpreter(this._discoverer);
            new SecondsInterpreter(this._discoverer);
          //  new DistanceInterpreter(this._discoverer);

            var theAggregator = new contactJS.Aggregator(this._discoverer, [
                //attributeDistanceKilometers,
                //attributeDistanceKilometers2
                attributeTypeUnixTimeSeconds
            ]);

            this._aggregators.push(theAggregator);
        }

        /**
         * Sets a function as the callback for the provided callback name.
         * @alias setCallback
         * @memberof ContextDetector#
         * @param callbackName {string} The name of the callback.
         * @param callback {function} The function that handles the callback.
         */
        ContextDetector.prototype.setCallback = function(callbackName, callback) {
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
                            //this.addContextInformation(this._currentContextInformation, false);
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
         * @param {Boolean} allowMultipleInstances Set to true if multiple instances of the context information are allowed.
         */
        ContextDetector.prototype.addContextInformation = function(newContextInformation, allowMultipleInstances) {
            var indexForContextInformation = this._indexForContextInformation(newContextInformation);

            if (allowMultipleInstances || !allowMultipleInstances && !this.contextInformationExists(newContextInformation)) {
                this._contextInformation.push(newContextInformation);
            } else {
                if (indexForContextInformation != -1) this._contextInformation[indexForContextInformation] = newContextInformation
            }
        };

        /**
         * Queries all aggregators and returns new context information.
         * @alias gatherContextInformation
         * @memberof ContextDetector#
         * @returns {Array.<ContextInformation>}
         */
        ContextDetector.prototype.gatherContextInformation = function() {
            var self = this;

            for (var index in this._aggregators) {
                var theAggregator = this._aggregators[index];

                theAggregator.queryReferencedComponents(function(attributeValues) {
                    for (var attributeValueIndex in attributeValues.getItems()) {
                        var theAttributeValue = attributeValues.getItems()[attributeValueIndex];

                        self.addContextInformation(ContextInformation.fromAttributeValue(theAttributeValue), false);
                    }
                });
            }
        };

        ContextDetector.prototype.getContextInformation = function() {
            return this._contextInformation;
        };

        return ContextDetector;
    })();

    return ContextDetector;
});