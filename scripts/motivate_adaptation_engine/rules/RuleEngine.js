define('MoRE', ['nools', 'MoCI'], function (nools, ContextInformation) {
    var RuleEngine = (function() {

        /**
         * The rule engine encapsulates the nools.js rule engine.
         * @class
         * @constructs RuleEngine
         * @param noolsDSL {string} The adaptation rules formated in nools DSL as provided by the rule generator.
         * @param verbose {boolean} Activates console output if set to true.
         */
        function RuleEngine(noolsDSL, verbose) {
            var self = this;

            this._verbose = verbose;
            this._callbacks = {
                "ruleMatchingSuccessCallback": function() {
                    console.log("Rule matching finished successfully.");
                },
                "ruleMatchingErrorCallback": function(err) {
                    console.error(err.stack);
                }
            };

            this._nools = require("nools");
            this._parsedFlow = this._nools.parse(noolsDSL);
            this._flow = this._nools.compile(noolsDSL, {name: "adaptationRules"});
            this._FlowContextInformation = this.getDefined("ContextInformation");
            this._session = this._flow.getSession();

            this._session.on("restrictFeature", function(feature, facts){
                if (typeof self._callbacks["restrictFeatureCallback"] != "undefined") {
                    self._callbacks["restrictFeatureCallback"](feature, self._contextInformationFromFacts(facts));
                }
            });

            this._session.on("selectLearningUnit", function(id, facts){
                if (typeof self._callbacks["selectLearningUnitCallback"] != "undefined") {
                    self._callbacks["selectLearningUnitCallback"](id, self._contextInformationFromFacts(facts));
                }
            });

            this._session.on("preloadLearningUnit", function(id, facts){
                if (typeof self._callbacks["preloadLearningUnitCallback"] != "undefined") {
                    self._callbacks["preloadLearningUnitCallback"](id, self._contextInformationFromFacts(facts));
                }
            });
        }

        RuleEngine.prototype._contextInformationFromFacts = function(facts) {
            var contextInformation = [];
            for(var index in facts) {
                var fact = facts[index];
                if(fact instanceof this._FlowContextInformation) {
                    contextInformation.push(ContextInformation.fromFact(fact));
                }
            }
            return contextInformation;
        };

        /**
         * Sets a function as the callback for the provided callback name.
         * @alias setCallback
         * @memberof RuleEngine#
         * @param callbackName {string} The name of the callback.
         * @param callback {function} The function that handles the callback.
         */
        RuleEngine.prototype.setCallback = function(callbackName, callback) {
            this._callbacks[callbackName] = callback;
        };

        /**
         * Returns the rules that are part of the current nools flow.
         * @alias getRules
         * @memberof RuleEngine#
         * @returns {*|Array}
         */
        RuleEngine.prototype.getRules = function() {
            return this._parsedFlow.rules;
        };

        /**
         * Starts the nools rule matching and triggers callbacks for success or errors.
         * @alias matchRules
         * @memberof RuleEngine#
         */
        RuleEngine.prototype.matchRules = function() {
            var that = this;

            if (this._verbose) console.log("Matching rules...");
            var startTime = Math.floor(Date.now() / 1000);
            this._session.match(function(err) {
                if (err) {
                    that._callbacks["ruleMatchingErrorCallback"](err);
                } else {
                    var endTime = Math.floor(Date.now() / 1000);
                    if (that._verbose) console.log("Time for rule matching "+(endTime-startTime)+" secs.");
                    that._callbacks["ruleMatchingSuccessCallback"]();
                }
            });
        };

        RuleEngine.prototype._addFact = function(fact) {
            this._session.assert(fact);
        };

        /**
         * Adds a context information as a fact to the current nools session.
         * @alias addContextInformation
         * @memberof RuleEngine#
         * @param contextInformation {ContextInformation}
         */
        RuleEngine.prototype.addContextInformation = function(contextInformation) {
            //TODO: add context information directly from context detection and convert to flow context information
            //FlowContextInformation = this.getDefined("ContextInformation");
            //TODO: test if context information already exist

            if (false) {

            } else {
                this._addFact(new this._FlowContextInformation(contextInformation.getID(), contextInformation.getValue(), contextInformation.getParameters()));
            }
        };

        /**
         * Returns the nools class definition with the provided name.
         * @alias getDefined
         * @memberof RuleEngine#
         * @param definitionName
         * @returns {*}
         */
        RuleEngine.prototype.getDefined = function(definitionName) {
            return this._flow.getDefined(definitionName);
        };

        return RuleEngine;
    })();

    return RuleEngine;
});