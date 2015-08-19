define("MoCD", ['nools', 'jquery', 'MoCI', 'contactJS', 'widgets', 'interpreters',
    'lib/parser/constraint/parser'], function(nools, $, ContextInformation, contactJS, widgets, interpreters) {
    return (function() {

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

            // third parameter holds translations of attribute types
            this._discoverer = new contactJS.Discoverer(widgets, interpreters, [
                [
                    ['CI_CURRENT_UNIX_TIME','INTEGER',[["CP_UNIT","SECONDS"]]],
                    ['CI_BASE_UNIT_OF_TIME','INTEGER',[["CP_UNIT","SECONDS"]]]
                ],
                [
                    ['CI_CURRENT_UNIX_TIME','INTEGER',[["CP_UNIT","MILLISECONDS"]]],
                    ['CI_BASE_UNIT_OF_TIME','INTEGER',[["CP_UNIT","MILLISECONDS"]]]
                ],
                [
                    ['CI_CURRENT_UNIX_TIME_IN_SECONDS','INTEGER'],
                    ['CI_CURRENT_UNIX_TIME','INTEGER',[["CP_UNIT","SECONDS"]]]
                ],
                [
                    ['CI_CURRENT_UNIX_TIME_IN_MILLISECONDS','INTEGER'],
                    ['CI_CURRENT_UNIX_TIME','INTEGER',[["CP_UNIT","MILLISECONDS"]]]
                ],
                [
                    ['CI_CURRENT_TEMPERATURE','INTEGER',[['CP_TEMPERATURE_SCALE','CELSIUS']]],
                    ['CI_TEMPERATURE','INTEGER',[['CP_TEMPERATURE_SCALE','CELSIUS']]]
                ]
            ]);

            //Dynamic Configuration

            // TODO: dynamic context information extraction
            for(var index in adaptationRules) {
                var adaptationRule = adaptationRules[index];
                var lastConstraint = adaptationRule.constraints[adaptationRule.constraints.length - 1];
                this._extractContextInformationFromParsedConstraints(parser.parse(lastConstraint[lastConstraint.length - 1]));

                //var ruleAggregator = new contactJS.Aggregator(_this.discoverer);
            }

            //initiate attributes that need to be satisfied
            var attributeTypeIsNightTime = this._discoverer.buildAttribute('CI_IS_NIGHTTIME','BOOLEAN');
            var attributeTypeUnixTimeInSeconds = this._discoverer.buildAttribute('CI_CURRENT_UNIX_TIME_IN_SECONDS','INTEGER');

            //initiate aggregators with a list of the unsatisfied attributes
            var theAggregator = new contactJS.Aggregator(this._discoverer, [
                attributeTypeIsNightTime
            ]);

            var anotherAggregator = new contactJS.Aggregator(this._discoverer, [
                attributeTypeUnixTimeInSeconds
            ]);

            this._aggregators.push(theAggregator);
            this._aggregators.push(anotherAggregator);

        }

        /**
         * Sets a function as the callback for the provided callback name.
         *
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
});