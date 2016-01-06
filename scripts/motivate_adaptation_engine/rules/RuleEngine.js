define('MoRE', ['nools', 'node-rules', 'contactJS', 'MathUuid'], function (nools, NodeRuleEngine, contactJS) {
    return (function() {

        RuleEngine.NOOLS = "nools";
        RuleEngine.NODE_RULES = "node-rules";

        /**
         * The rule engine encapsulates the nools.js rule engine.
         *
         * @class RuleEngine
         * @param {String} engine
         * @param {String} rules The adaptation rules formated in nools DSL as provided by the rule generator.
         * @param {boolean} verbose Activates console output if set to true.
         */
        function RuleEngine(engine, rules, verbose) {
            /**
             * Controls the amount of console output.
             *
             * @type {boolean}
             * @private
             */
            this._verbose = verbose;

            /**
             * Contains the callbacks for certain actions or events of the rule engine.
             * Can be set by invoking the respective functions of the adaptation engine.
             *
             * @type {{ruleMatchingSuccessCallback: Function, ruleMatchingErrorCallback: Function}}
             * @private
             */
            this._callbacks = {
                "ruleMatchingSuccessCallback": function() {
                    console.log("Rule matching finished successfully.");
                },
                "ruleMatchingErrorCallback": function(err) {
                    console.error(err.stack);
                }
            };

            /**
             *
             * @type {string}
             * @private
             */
            this._engine = engine;

            /**
             *
             * @type {ContextInformationList}
             * @private
             */
            this._neededContextInformation = new contactJS.ContextInformationList();

            this._initiateRules(rules);
        }

        /**
         *
         * @param rules
         * @private
         */
        RuleEngine.prototype._initiateRules = function(rules) {
            var self = this;

            switch (this._engine) {
                case RuleEngine.NOOLS:
                    /**
                     * The nools object.
                     *
                     * @private
                     */
                    this._nools = require("nools");

                    /**
                     * The flow parsed from the provided nools DSL.
                     *
                     * @type {number|*}
                     * @private
                     */
                    this._parsedFlow = this._nools.parse(rules);

                    /**
                     * The flow compiled from the provided nools DSL.
                     *
                     * @private
                     */
                    this._flow = this._nools.compile(rules, {name: "adaptationRules"});

                    /**
                     * The current nools session.
                     *
                     * @type {null}
                     * @private
                     */
                    this._currentSession = null;

                    break;
                case RuleEngine.NODE_RULES:
                    window["ruleEngine"] = this;

                    /**
                     *
                     */
                    (function() {return eval(rules)} )();

                    /**
                     * @private
                     */
                    this._R = new NodeRuleEngine(_rules);

                    break;
                default:
                    throw ("Unknown or no rule engine provided.");
            }
        };

        /**
         * Starts the nools rule matching and triggers callbacks for success or errors.
         *
         * @param contextInformation
         */
        RuleEngine.prototype.matchRules = function(contextInformation) {
            var self = this;

            var startTime = Math.floor(Date.now() / 1000);
            switch (this._engine) {
                case RuleEngine.NOOLS:
                    // create new session
                    this._generateNewSession(contextInformation);

                    if (this._verbose) console.log("Matching rules...");
                    this._currentSession.match(function(err) {
                        if (err) {
                            self._callbacks["ruleMatchingErrorCallback"](err);
                        } else {
                            var endTime = Math.floor(Date.now() / 1000);
                            if (self._verbose) console.log("Time for rule matching "+(endTime-startTime)+" secs.");
                            self._callbacks["ruleMatchingSuccessCallback"]();
                        }
                    });
                    break;
                case RuleEngine.NODE_RULES:
                    this._R.execute(contextInformation, this._callbacks["ruleMatchingSuccessCallback"]);
                    var endTime = Math.floor(Date.now() / 1000);
                    if (self._verbose) console.log("Time for rule matching "+(endTime-startTime)+" secs.");
            }
        };

        /**
         *
         * @param {ContextInformationList} contextInformation
         * @private
         */
        RuleEngine.prototype._generateNewSession = function(contextInformation) {
            var self = this;

            if (this._currentSession != null) this._currentSession.dispose();

            this._currentSession = this._flow.getSession();

            // set session callbacks
            this._currentSession.on("restrictFeature", function(feature, facts){
                if (typeof self._callbacks["restrictFeatureCallback"] != "undefined") {
                    self._callbacks["restrictFeatureCallback"](feature, facts);
                }
            });

            this._currentSession.on("selectLearningUnit", function(id, facts){
                if (typeof self._callbacks["selectLearningUnitCallback"] != "undefined") {
                    self._callbacks["selectLearningUnitCallback"](id, facts);
                }
            });

            this._currentSession.on("preloadLearningUnit", function(id, facts){
                if (typeof self._callbacks["preloadLearningUnitCallback"] != "undefined") {
                    self._callbacks["preloadLearningUnitCallback"](id, facts);
                }
            });

            // add context information as facts
            if (this._verbose) var addOverallTime = Date.now() / 1000;
            contextInformation.getItems().forEach(function(contextInformation) {
                self.addContextInformation(contextInformation);
            });
            if (this._verbose) console.log("Add overall time: "+(Date.now() / 1000 - addOverallTime));
        };

        /**
         * Sets a function as the callback for the provided callback name.
         *
         * @param callbackName {string} The name of the callback.
         * @param callback {function} The function that handles the callback.
         */
        RuleEngine.prototype.setCallback = function(callbackName, callback) {
            this._callbacks[callbackName] = callback;
        };

        /**
         * Returns the rules that are part of the current nools flow.
         *
         * @returns {*|Array}
         */
        RuleEngine.prototype.getRules = function() {
            return this._parsedFlow.rules;
        };

        /**
         * Adds the parameter as fact to the current nools session.
         *
         * @param fact
         * @private
         */
        RuleEngine.prototype._addFact = function(fact) {
            if (this._currentSession != null) this._currentSession.assert(fact);
        };

        /**
         * Adds a context information as a fact to the current nools session.
         *
         * @param {ContextInformation} contextInformation
         */
        RuleEngine.prototype.addContextInformation = function(contextInformation) {
            if (this._verbose) var addStart = Date.now() / 1000;
            this._addFact(contextInformation.getJSONRepresentation());
            if (this._verbose) console.log("Add time: "+(Date.now() / 1000 - addStart)+" for "+contextInformation.getName());
        };

        return RuleEngine;
    })();
});