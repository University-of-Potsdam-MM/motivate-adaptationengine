define('MoAE', ['easejs', 'MoRE', 'MoCD'], function (easejs, RuleEngine, ContextDetector) {
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
             * @alias isRunning
             * @memberof AdaptationEngine#
             * @type {boolean}
             * @default false
             */
            'public isRunning': false,

            /**
             * The adaptation Engine
             * @class
             * @constructs AdaptationEngine
             * @param noolsDSL {string} The adaptation rules as nools DSL format.
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
                FlowContextInformation = this._ruleEngine.getDefined("ContextInformation");
                this._ruleEngine.addContextInformation(new FlowContextInformation("CurrentTemperatureMeasurableInformation", 55, {"TemperatureScaleContextParameter" : "FAHRENHEIT"}));
                // initialize context detector and set callbacks for context information gathering
                this._contextDetector = new ContextDetector(this._ruleEngine.getRules());
            },

            /**
             *
             * @alias setRestrictFeatureCallback
             * @memberof AdaptationEngine#
             * @param {AdaptationEngine~restrictFeatureCallback} callback The callback to be executed when a feature restricting rule fires.
             */
            'public setRestrictFeatureCallback': function(callback) {
                /**
                 * @callback AdaptationEngine~restrictFeatureCallback
                 * @param {string} feature The feature to be restricted.
                 * @param {ContextInformation[]} contextInformation An array of context information that triggered the rule.
                 * @example
                 * adaptationEngine.setRestrictFeatureCallback(function(feature, contextInformation) {
                 *     console.log("Restrict Feature -> "+feature); // Restrict Feature -> AppUsageFeature
                 *     for(var index in contextInformation) {
                 *         console.log(contextInformation[index].description()); // @see ContextInformation#description
                 *     }
                 * });
                 */
                this._ruleEngine.setCallback("restrictFeatureCallback", callback);
            },

            /**
             *
             * @alias setSelectLearningUnitCallback
             * @memberof AdaptationEngine#
             * @param callback {AdaptationEngine~selectLearningUnitCallback} The callback to be executed when a select learning unit rule fires.
             */
            'public setSelectLearningUnitCallback': function(callback) {
                /**
                 * @callback AdaptationEngine~selectLearningUnitCallback
                 * @param {string} id The id of the learning unit to be selected.
                 * @param {ContextInformation[]} contextInformation An array of context information that triggered the rule.
                 * @example
                 * adaptationEngine.setSelectLearningUnitCallback(function(id, contextInformation) {
                 *     console.log("Select Learning Unit -> "+id);
                 *     for(var index in contextInformation) {
                 *         console.log(contextInformation[index].description());
                 *     }
                 * });
                 */
                this._ruleEngine.setCallback("selectLearningUnitCallback", callback);
            },

            /**
             *
             * @alias setPreloadLearningUnitCallback
             * @memberof AdaptationEngine#
             * @param callback {AdaptationEngine~preloadLearningUnitCallback}
             */
            'public setPreloadLearningUnitCallback': function(callback) {
                /**
                 * @callback AdaptationEngine~preloadLearningUnitCallback
                 * @param {string} id The id of the learning unit to be preloaded.
                 * @example
                 * adaptationEngine.setPreloadLearningUnitCallback(function(id) {
                 *     console.log("Preload Learning Unit -> "+id);
                 * });
                 */
                this._ruleEngine.setCallback("preloadLearningUnitCallback", callback);
            },

            /**
             *
             * @alias setRuleMatchingSuccessCallback
             * @memberof AdaptationEngine#
             * @param callback {AdaptationEngine~ruleMatchingSuccessCallback}
             */
            'public setRuleMatchingSuccessCallback': function(callback) {
                /**
                 * @callback AdaptationEngine~ruleMatchingSuccessCallback
                 */
                this._ruleEngine.setCallback("ruleMatchingSuccessCallback", callback);
            },

            'public setRuleMatchingErrorCallback': function(callback) {
                /**
                 * @callback AdaptationEngine~ruleMatchingErrorCallback
                 * @param error {object}
                 */
                this._ruleEngine.setCallback("ruleMatchingErrorCallback", callback);
            },

            'public startRuleMatching': function(intervalInMilliseconds) {
                var that = this;

                if (!this.isRunning) {
                    this.isRunning = false;
                    this._ruleEngine.matchRules();
                    if (!isNaN(intervalInMilliseconds)) {
                        this._ruleMatchingInterval = setInterval(function(){that._ruleEngine.matchRules()}, intervalInMilliseconds);
                    }
                }
            },

            'public stopRuleMatching': function() {
                if (this.isRunning) {
                    this.isRunning = false;
                    clearInterval(this._ruleMatchingInterval);
                }
            },

            'public restartRuleMatching': function(intervalInMilliseconds) {
                this.stopRuleMatching();
                this.startRuleMatching(intervalInMilliseconds);
            }
        }
    );

    return AdaptationEngine;
});
