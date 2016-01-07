define('MoAE', ['MoRE', 'MoCD'], function (RuleEngine, ContextDetector) {
    return (function() {
        /**
         * The adaptation engine encapsulates the rule engine and the context detection. Via callbacks an application
         * can listen to events fired by the rule engine during the rule evaluation process and react to the triggered rules.
         *
         * The adaptation engine and it's components require the following external libraries:
         *
         * - jQuery
         * - nools.js & its constraint parser (lib/parser/constraint/parser.js)
         * - require.js
         * - ease.js
         *
         * @class AdaptationEngine
         * @param {String} rules The adaptation rules as nools DSL format.
         * @param {Boolean} verbose
         * @example
         * $.ajax({
             *     url: "www.domain.com/pathToRuleGenerator?params",
             *     success: function(noolsDSL) {
             *         var adaptationEngine = new AdaptationEngine(noolsDSL);
             *     }
             * });
         */
        function AdaptationEngine(rules, verbose) {
            var self = this;

            /**
             * Indicates whether the rule matching process is running.
             *
             * @type {boolean}
             * @default false
             */
            this.isRuleMatching = false;
            /**
             * Indicates whether the context detection process is running.
             *
             * @type {boolean}
             * @default false
             */
            this.isDetectingContext = false;

            this._ruleMatchingInterval = null;
            this._contextDetectionInterval = null;

            // initialize the rule engine
            this._ruleEngine = new RuleEngine(RuleEngine.NODE_RULES, rules, verbose);

            // initialize context detector
            this._contextDetector = new ContextDetector(RuleEngine.NODE_RULES, rules, verbose);

            return this;
        }

        /**
         * Sets a callback function to be executed when a feature restricting rule fires.
         *
         * @param {AdaptationEngine~restrictFeatureCallback} callback The function that handles the callback.
         */
        AdaptationEngine.prototype.setRestrictFeatureCallback = function(callback) {
            /**
             * The callback returns with a string containing the feature to be restricted and an array of context
             * information that triggered the rule.
             *
             * @callback AdaptationEngine~restrictFeatureCallback
             * @param {string} feature The feature to be restricted.
             * @param {Array.<ContextInformation>} contextInformation An array of context information that triggered the rule.
             * @example
             * adaptationEngine.setRestrictFeatureCallback(function(feature, contextInformation) {
                 *     console.log("Restrict Feature -> "+feature); // Restrict Feature -> AppUsageFeature
                 *     for(var index in contextInformation) {
                 *         console.log(contextInformation[index].description()); // see {@link ContextInformation#description}
             *     }
             * });
             */
            this._ruleEngine.setCallback("restrictFeatureCallback", callback);
        };

        /**
         * Sets a callback function to be executed when a learning unit selection rule fires.
         *
         * @param callback {AdaptationEngine~selectLearningUnitCallback} The function that handles the callback.
         */
        AdaptationEngine.prototype.setSelectLearningUnitCallback = function(callback) {
            /**
             * The callback returns with a string containing the ID of the learning unit to be selected and an array
             * of context information that triggered the rule.
             *
             * @callback AdaptationEngine~selectLearningUnitCallback
             * @param {String} id The id of the learning unit to be selected.
             * @param {Array.<ContextInformation>} contextInformation An array of context information that triggered the rule.
             * @example
             * adaptationEngine.setSelectLearningUnitCallback(function(id, contextInformation) {
                 *     console.log("Select Learning Unit -> "+id);
                 *     for(var index in contextInformation) {
                 *         console.log(contextInformation[index].description());  // see {@link ContextInformation#description}
             *     }
             * });
             */
            this._ruleEngine.setCallback("selectLearningUnitCallback", callback);
        };

        /**
         * Sets a callback function to be executed when a preload learning unit rule fires.
         * @alias setPreloadLearningUnitCallback
         * @memberof AdaptationEngine#
         * @param callback {AdaptationEngine~preloadLearningUnitCallback} The function that handles the callback.
         */
        AdaptationEngine.prototype.setPreloadLearningUnitCallback = function(callback) {
            /**
             * The callback returns with a string containing the ID of the learning unit to be preloaded.
             * @callback AdaptationEngine~preloadLearningUnitCallback
             * @param {String} id The id of the learning unit to be preloaded.
             * @example
             * adaptationEngine.setPreloadLearningUnitCallback(function(id) {
                 *     console.log("Preload Learning Unit -> "+id);
                 * });
             */
            this._ruleEngine.setCallback("preloadLearningUnitCallback", callback);
        };

        /**
         * Sets a callback function that is executed every time the rule matching was executed successfully.
         * @alias setRuleMatchingSuccessCallback
         * @memberof AdaptationEngine#
         * @param callback {AdaptationEngine~ruleMatchingSuccessCallback} The function that handles the callback.
         */
        AdaptationEngine.prototype.setRuleMatchingSuccessCallback = function(callback) {
            /**
             * The callback returns when the rule matching process was executed successfully.
             * @callback AdaptationEngine~ruleMatchingSuccessCallback
             * @example
             * adaptationEngine.setRuleMatchingSuccessCallback(function() {
                 *     console.log("Rule matching was executed successfully.");
                 * });
             */
            this._ruleEngine.setCallback("ruleMatchingSuccessCallback", callback);
        };

        /**
         * Sets a callback function that is executed when the rule matching produced an error.
         *
         * @param callback {AdaptationEngine~ruleMatchingErrorCallback} The function that handles the callback.
         */
        AdaptationEngine.prototype.setRuleMatchingErrorCallback = function(callback) {
            /**
             * The callback returns with an object containing further information about the error that occurred.
             * @callback AdaptationEngine~ruleMatchingErrorCallback
             * @param error {object} Further information about the error.
             * @example
             * adaptationEngine.setRuleMatchingErrorCallback(function(error) {
                 *     console.error(error.stack);
                 * });
             */
            this._ruleEngine.setCallback("ruleMatchingErrorCallback", callback);
        };

        /**
         * Sets a callback function that is executed when the rule matching produced an error.
         *
         * @param callback {AdaptationEngine~newContextInformationCallback} The function that handles the callback.
         */
        AdaptationEngine.prototype.setNewContextInformationCallback = function(callback) {
            /**
             * The callback returns with an object containing further information about the error that occurred.
             * @callback AdaptationEngine~newContextInformationCallback
             * @param attributes {array.<ContextInformation>} The context information attributes.
             * @example
             * adaptationEngine.setNewContextInformationCallback(function(contextInformation) {
                 *     console.log(contextInformation);
                 * });
             */
            this._contextDetector.setCallback("newContextInformationCallback", callback);
        };

        /**
         * Starts the rule matching process. If an integer values is provided the rule matching process will repeat
         * every x milliseconds until it is halted manually by executing {@link AdaptationEngine#stopRuleMatching}.
         *
         * @param intervalInMilliseconds {number} The time in milliseconds between every rule matching interval.
         */
        AdaptationEngine.prototype.startRuleMatching = function(intervalInMilliseconds) {
            console.log("startRuleMatching");
            var self = this;

            if (!this.isRuleMatching) {
                this.isRuleMatching = true;
                this._ruleEngine.matchRules(this._contextDetector.getContextInformation());
                if (!isNaN(intervalInMilliseconds)) {
                    this._ruleMatchingInterval = setInterval(function(){self._ruleEngine.matchRules(self._contextDetector.getContextInformation())}, intervalInMilliseconds);
                }
            }
        };

        /**
         * Stops the rule matching process. If rules are currently executed the process will halt afterwards.
         * @alias stopRuleMatching
         * @memberof AdaptationEngine#
         */
        AdaptationEngine.prototype.stopRuleMatching = function() {
            console.log("stopRuleMatching");

            if (this.isRuleMatching) {
                this.isRuleMatching = false;
                clearInterval(this._ruleMatchingInterval);
            }
        };

        /**
         * Restarts the rule matching process (i.e. executes {@link AdaptationEngine#stopRuleMatching} and
         * {@link AdaptationEngine#startRuleMatching} successively). If an integer value is provided a new
         * interval will be set.
         * @alias restartRuleMatching
         * @memberof AdaptationEngine#
         * @param intervalInMilliseconds {number}
         */
        AdaptationEngine.prototype.restartRuleMatching = function(intervalInMilliseconds) {
            console.log("restartRuleMatching");

            this.stopRuleMatching();
            this.startRuleMatching(intervalInMilliseconds);
        };

        /**
         * Sets a callback function that is executed when a new context information is detected.
         * @alias setNewContextInformationCallback
         * @memberof AdaptationEngine#
         * @param callback {AdaptationEngine~newContextInformationCallback} The function that handles the callback.
         */
        AdaptationEngine.prototype.setNewContextInformationCallback = function(callback) {
            /**
             * The callback returns with an object containing further information about the error that occurred.
             * @callback AdaptationEngine~newContextInformationCallback
             * @param contextInformation {ContextInformation} Further information about the error.
             */
            this._contextDetector.setCallback("newContextInformationCallback", callback);
        };

        /**
         * Starts the context detection process.
         *
         * @param {Number} [intervalInMilliseconds]
         */
        AdaptationEngine.prototype.startContextDetection = function(intervalInMilliseconds) {
            console.log("Adaptation Engine: I will start the context detection.");

            var self = this;

            if (!this.isDetectingContext) {
                this.isDetectingContext = true;
                this._contextDetector.gatherContextInformation();
                if (!isNaN(intervalInMilliseconds)) {
                    this._contextDetectionInterval = setInterval(function(){self._contextDetector.gatherContextInformation();}, intervalInMilliseconds);
                }
            }
        };

        /**
         * Stops the context detection process.
         *
         */
        AdaptationEngine.prototype.stopContextDetection = function() {
            console.log("stopContextDetection");

            if (this.isDetectingContext) {
                this.isDetectingContext = false;
                clearInterval(this._contextDetectionInterval);
            }
        };

        /**
         * Restarts the context detection process (i.e. executes {@link AdaptationEngine#stopContextDetection} and
         * {@link AdaptationEngine#startContextDetection} successively). If an integer value is provided a new
         * interval will be set.
         *
         * @param intervalInMilliseconds {number}
         */
        AdaptationEngine.prototype.restartContextDetection = function(intervalInMilliseconds) {
            console.log("restartContextDetection");

            this.stopContextDetection();
            this.startContextDetection(intervalInMilliseconds);
        };

        /**
         * Allows to manually add context information to be used by the rule engine.
         *
         * @param {{name: string, type: string, parameterList: [], value: *}} contextInformation
         * @param {boolean} allowMultipleInstances
         */
        AdaptationEngine.prototype.addContextInformation = function(contextInformation, allowMultipleInstances) {
            this._contextDetector.addContextInformation(contextInformation, allowMultipleInstances);
        };

        return AdaptationEngine;
    })();
});
