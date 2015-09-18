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
            this._verbose = verbose;
            this._aggregators = [];
            /**
             * Stores recently collected context information values.
             *
             * @type {Array}
             * @private
             */
            this._contextInformation = [];
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
                    ['CI_CURRENT_UNIX_TIME','INTEGER',[["CP_UNIT","STRING","SECONDS"]]],
                    ['CI_BASE_UNIT_OF_TIME','INTEGER',[["CP_UNIT","STRING","SECONDS"]]]
                ],
                [
                    ['CI_CURRENT_UNIX_TIME','INTEGER',[["CP_UNIT","STRING","MILLISECONDS"]]],
                    ['CI_BASE_UNIT_OF_TIME','INTEGER',[["CP_UNIT","STRING","MILLISECONDS"]]]
                ],
                [
                    ['CI_CURRENT_UNIX_TIME_IN_SECONDS','INTEGER'],
                    ['CI_CURRENT_UNIX_TIME','INTEGER',[["CP_UNIT","STRING","SECONDS"]]]
                ],
                [
                    ['CI_CURRENT_UNIX_TIME_IN_MILLISECONDS','INTEGER'],
                    ['CI_CURRENT_UNIX_TIME','INTEGER',[["CP_UNIT","STRING","MILLISECONDS"]]]
                ],
                [
                    ['CI_CURRENT_TEMPERATURE','INTEGER',[['CP_TEMPERATURE_SCALE','STRING','CELSIUS']]],
                    ['CI_TEMPERATURE','INTEGER',[['CP_TEMPERATURE_SCALE','STRING','CELSIUS']]]
                ]
            ]);

            //Dynamic Configuration
            this._aggregators.push(new contactJS.Aggregator(this._discoverer, this.extractAttributesFromAdaptationRules(adaptationRules)));
        }

        /**
         * Sets a function as the callback for the provided callback name.
         *
         * @param callbackName {string} The name of the callback.
         * @param callback {function} The function that handles the callback.
         */
        ContextDetector.prototype.setCallback = function(callbackName, callback) {
            this._callbacks[callbackName] = callback;
        };

        ContextDetector.prototype.extractAttributesFromAdaptationRules = function(adaptationRules) {
            return this._discoverer.getAttributesWithNames(this._extractContextIdsFromAdaptationRules(adaptationRules));
        };

        /**
         *
         *
         * @param {*|Array} adaptationRules
         * @return {Array}
         * @private
         */
        ContextDetector.prototype._extractContextIdsFromAdaptationRules = function(adaptationRules) {
            var parsedContextIds = [];

            for(var index in adaptationRules) {
                var adaptationRule = adaptationRules[index];
                var lastConstraint = adaptationRule.constraints[adaptationRule.constraints.length - 1];
                this._extractContextInformationFromParsedConstraints(parser.parse(lastConstraint[lastConstraint.length - 1]), parsedContextIds);
            }

            return parsedContextIds;
        };

        /**
         *
         * @param parsedConstraints
         * @param {Array} contextInformationIds
         * @returns {Array}
         * @private
         */
        ContextDetector.prototype._extractContextInformationFromParsedConstraints = function(parsedConstraints, contextInformationIds) {
            for(var index in parsedConstraints) {
                var parsedConstraint = parsedConstraints[index];
                if ($.isArray(parsedConstraint)) {
                    this._extractContextInformationFromParsedConstraints(parsedConstraint, contextInformationIds);
                } else if (parsedConstraint != null && typeof parsedConstraint == "string") {
                    if (parsedConstraint.indexOf("CI_") > -1) {
                        if ($.inArray(parsedConstraint, contextInformationIds) == -1) contextInformationIds.push(parsedConstraint);
                    }
                }
            }

            return contextInformationIds;
        };

        /**
         * Returns true if the given context information was gathered before.
         *
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
         *
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
         *
         * @returns {Array.<ContextInformation>}
         */
        ContextDetector.prototype.gatherContextInformation = function() {
            var self = this;

            for (var index in this._aggregators) {
                var theAggregator = this._aggregators[index];

                theAggregator.queryReferencedComponents(function(attributes) {
                    for (var attributeIndex in attributes.getItems()) {
                        var theAttributeValue = attributes.getItems()[attributeIndex];

                        self.addContextInformation(ContextInformation.fromAttributeValue(theAttributeValue), false);
                    }
                });
            }
        };

        /**
         *
         *
         * @returns {Array}
         */
        ContextDetector.prototype.getContextInformation = function() {
            return this._contextInformation;
        };

        return ContextDetector;
    })();
});