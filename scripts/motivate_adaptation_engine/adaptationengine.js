define('MoAE', ['easejs', 'MoRE', 'MoCD', 'MoCI'], function (easejs, RuleEngine, ContextDetector, ContextInformation) {
    var Class = easejs.Class;

    var AdaptationEngine = Class('AdaptationEngine',
        {
            /**
             * @private
             * @type {?object}
             */
            'private _ruleEngine': null,
            'private _contextDetector': null,
            'private _noolsDSL': null,
            'private _ruleMatchingInterval': null,

            /**
             * Indicates whether the rule matching process is running.
             * @alias isRunning
             * @memberof AdaptationEngine#
             * @type {boolean}
             * @default false
             */
            'public isRunning': false,

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
             * @class
             * @constructs AdaptationEngine
             * @param {String} noolsDSL The adaptation rules as nools DSL format.
             * @example
             * $.ajax({
             *     url: "www.domain.com/pathToRuleGenerator?params",
             *     success: function(noolsDSL) {
             *         var adaptationEngine = new AdaptationEngine(noolsDSL);
             *     }
             * });
             */
            __construct: function(noolsDSL)
            {
                this._noolsDSL = noolsDSL;
                this._ruleEngine = new RuleEngine(noolsDSL);
                // for test purposes
                this._ruleEngine.addContextInformation(new ContextInformation("CI_CURRENT_TEMPERATURE", 55, {"CP_TEMPERATURE_SCALE" : "FAHRENHEIT"}));
                // this._ruleEngine.addContextInformation(new ContextInformation("CI_DEVICE_TYPE", "FEATURE_PHONE"));
                this._ruleEngine.addContextInformation(new ContextInformation("CI_DEVICE_TYPE", "SMARTPHONE"));
                this._ruleEngine.addContextInformation(new ContextInformation("CI_USER_ROLE", "TEACHER"));
                //this._ruleEngine.addContextInformation(new ContextInformation("CI_USER_ROLE", "STUDENT"));
                this._ruleEngine.addContextInformation(new ContextInformation("CI_USER_MOVEMENT_SPEED", "10", {"CP_VELOCITY_UNIT" : "KILOMETERS_PER_HOUR"}));
                this._ruleEngine.addContextInformation(new ContextInformation("CI_CURRENT_LEARNING_UNIT", "128"));
                // initialize context detector and set callbacks for context information gathering
                this._contextDetector = new ContextDetector(this._ruleEngine.getRules());
            },

            /**
             * Sets a callback function to be executed when a feature restricting rule fires.
             * @alias setRestrictFeatureCallback
             * @memberof AdaptationEngine#
             * @param {AdaptationEngine~restrictFeatureCallback} callback The function that handles the callback.
             */
            'public setRestrictFeatureCallback': function(callback) {
                /**
                 * The callback returns with a string containing the feature to be restricted and an array of context
                 * information that triggered the rule.
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
            },

            /**
             * Sets a callback function to be executed when a learning unit selection rule fires.
             * @alias setSelectLearningUnitCallback
             * @memberof AdaptationEngine#
             * @param callback {AdaptationEngine~selectLearningUnitCallback} The function that handles the callback.
             */
            'public setSelectLearningUnitCallback': function(callback) {
                /**
                 * The callback returns with a string containing the ID of the learning unit to be selected and an array
                 * of context information that triggered the rule.
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
            },

            /**
             * Sets a callback function to be executed when a preload learning unit rule fires.
             * @alias setPreloadLearningUnitCallback
             * @memberof AdaptationEngine#
             * @param callback {AdaptationEngine~preloadLearningUnitCallback} The function that handles the callback.
             */
            'public setPreloadLearningUnitCallback': function(callback) {
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
            },

            /**
             * Sets a callback function that is executed every time the rule matching was executed successfully.
             * @alias setRuleMatchingSuccessCallback
             * @memberof AdaptationEngine#
             * @param callback {AdaptationEngine~ruleMatchingSuccessCallback} The function that handles the callback.
             */
            'public setRuleMatchingSuccessCallback': function(callback) {
                /**
                 * The callback returns when the rule matching process was executed successfully.
                 * @callback AdaptationEngine~ruleMatchingSuccessCallback
                 * @example
                 * adaptationEngine.setRuleMatchingSuccessCallback(function() {
                 *     console.log("Rule matching was executed successfully.");
                 * });
                 */
                this._ruleEngine.setCallback("ruleMatchingSuccessCallback", callback);
            },

            /**
             * Sets a callback function that is executed when the rule matching produced an error.
             * @alias setRuleMatchingErrorCallback
             * @memberof AdaptationEngine#
             * @param callback {AdaptationEngine~ruleMatchingErrorCallback} The function that handles the callback.
             */
            'public setRuleMatchingErrorCallback': function(callback) {
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
            },

            /**
             * Starts the rule matching process. If an integer values is provided the rule matching process will repeat
             * every x milliseconds until it is halted manually by executing {@link AdaptationEngine#stopRuleMatching}.
             * @alias startRuleMatching
             * @memberof AdaptationEngine#
             * @param intervalInMilliseconds {number} The time in milliseconds between every rule matching interval.
             */
            'public startRuleMatching': function(intervalInMilliseconds) {
                console.log("startRuleMatching");
                var that = this;

                if (!this.isRunning) {
                    this.isRunning = true;
                    this._ruleEngine.matchRules();
                    if (!isNaN(intervalInMilliseconds)) {
                        this._ruleMatchingInterval = setInterval(function(){that._ruleEngine.matchRules()}, intervalInMilliseconds);
                    }
                }
            },

            /**
             * Stops the rule matching process. If rules are currently executed the process will halt afterwards.
             * @alias stopRuleMatching
             * @memberof AdaptationEngine#
             */
            'public stopRuleMatching': function() {
                console.log("stopRuleMatching");

                if (this.isRunning) {
                    this.isRunning = false;
                    clearInterval(this._ruleMatchingInterval);
                }
            },

            /**
             * Restarts the rule matching process (i.e. executes {@link AdaptationEngine#stopRuleMatching} and
             * {@link AdaptationEngine#startRuleMatching} successively). If an integer value is provided a new
             * interval will be set.
             * @alias restartRuleMatching
             * @memberof AdaptationEngine#
             * @param intervalInMilliseconds {number}
             */
            'public restartRuleMatching': function(intervalInMilliseconds) {
                console.log("restartRuleMatching");

                this.stopRuleMatching();
                this.startRuleMatching(intervalInMilliseconds);
            }
        }
    );

    return AdaptationEngine;
});
