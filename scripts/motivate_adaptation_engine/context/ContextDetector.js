define("MoCD", ['MoRE', 'nools', 'jquery', 'contactJS', 'widgets', 'interpreters',
    'lib/parser/constraint/parser'], function(RuleEngine, nools, $, contactJS, widgets, interpreters) {
    return (function() {

        /**
         * The context detector encapsulates the context toolkit which provides context information.
         *
         * @class ContextDetector
         * @param engine {String}
         * @param adaptationRules {*|Array} The adaptation rules that are returned by the rule engine are used to determine which context information are required.
         * @param verbose {boolean} Activates console output if set to true.
         */
        function ContextDetector(engine, adaptationRules, verbose) {
            this._verbose = verbose;

            /**
             *
             * @type {string}
             * @private
             */
            this._engine = engine;

            /**
             * Contains all the aggregators.
             *
             * @type {Array}
             * @private
             */
            this._aggregators = [];
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
                ],
                [
                    ['CI_UP_MOODLE_AVAILABLE', 'BOOLEAN'],
                    ['CI_URI_AVAILABLE', 'BOOLEAN', [['CP_URI', 'STRING', 'https://moodle2.uni-potsdam.de/login/index.php']]]
                ],
                [
                    ['CI_UP_MOODLE_AVAILABLE', 'BOOLEAN'],
                    ['CI_MOODLE_AVAILABLE', 'BOOLEAN', [['CP_MOODLE_URI', 'STRING', 'https://moodle2.uni-potsdam.de/login/index.php']]]
                ]
            ]);

            //Dynamic Configuration
            /**
             * The aggregator for gathering contextual information that was derived from the provided adaptation rules.
             *
             * @type {Aggregator}
             * @private
             */
            this._autoAggregator = new contactJS.Aggregator(this._discoverer, this.extractContextInformationFromAdaptationRules(adaptationRules));

            /**
             * The aggregator for gathering contextual information that was add manually by the overlying application.
             *
             * @type {Aggregator}
             * @private
             */
            this._manualAggregator = new contactJS.Aggregator(this._discoverer);

            this._aggregators.push(this._autoAggregator);
            this._aggregators.push(this._manualAggregator);
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

        /**
         *
         * @param adaptationRules {*|Array}
         * @returns {ContextInformationList}
         */
        ContextDetector.prototype.extractContextInformationFromAdaptationRules = function(adaptationRules) {
            if (this._engine == RuleEngine.NOOLS) {
                return this._discoverer.getContextInformationWithNames(this._extractContextIdsFromAdaptationRules(adaptationRules));
            } else if (this._engine == RuleEngine.NODE_RULES) {
                (function() {return eval(adaptationRules)} )();

                var contextInformation = new contactJS.ContextInformationList();
                _rules.forEach(function(theRule) {
                    theRule.relatedContextInformation.forEach(function(theContextInformation) {
                        contextInformation.put(theContextInformation);
                    });
                });
                return contextInformation;
            }
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
         * Adds a context information that wasn't gathered before.
         *
         * @param {{name: string, type: string, parameterList: [], value: *}} newContextInformation The new context information.
         * @param {Boolean} allowMultipleInstances Set to true if multiple instances of the context information are allowed.
         */
        ContextDetector.prototype.addContextInformation = function(newContextInformation, allowMultipleInstances) {
            this._manualAggregator.addOutputContextInformation(contactJS.ContextInformation.fromContextInformationDescription(this._discoverer, {
                name: newContextInformation.name,
                type: newContextInformation.type,
                parameterList: newContextInformation.parameterList
            }).setValue(newContextInformation.value), allowMultipleInstances);
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

                this._callbacks["newContextInformationCallback"](theAggregator.getOutputContextInformation());
            }
        };

        /**
         *
         * @returns {ContextInformationList}
         */
        ContextDetector.prototype.getContextInformation = function() {
            var contextInformation = new contactJS.ContextInformationList();
            this._aggregators.forEach(function(aggregator) {
                contextInformation.putAll(aggregator.getOutputContextInformation());
            });
            return contextInformation;
        };

        return ContextDetector;
    })();
});