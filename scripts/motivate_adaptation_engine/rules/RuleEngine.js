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
            this._currentSession = null;

            /*var _FlowContextInformation = this.getDefined("ContextInformation");
            var _currentSession = this._flow.getSession();

            var addIntTime = Date.now() / 1000;
            for (var i = 1; i < 10000; i++) {
                _currentSession.assert(i);
            }
            console.log("Add 10000 integers time: "+(Date.now() / 1000 - addIntTime));

            var addStringsTime = Date.now() / 1000;
            for (var i = 1; i < 10000; i++) {
                _currentSession.assert("foo");
            }
            console.log("Add 10000 strings time: "+(Date.now() / 1000 - addStringsTime));

            var addArrayTime = Date.now() / 1000;
            for (var i = 1; i < 10000; i++) {
                _currentSession.assert([1, 2, 3]);
            }
            console.log("Add 10000 arrays time: "+(Date.now() / 1000 - addArrayTime));

            var addObjectTime = Date.now() / 1000;
            for (var i = 1; i < 10000; i++) {
                _currentSession.assert({foo: "bar", baz: [42, "foobar", 24]});
            }
            console.log("Add 10000 objects time: "+(Date.now() / 1000 - addObjectTime));

            var addDefinedObjectTime = Date.now() / 1000;
            for (var i = 1; i < 10; i++) {
                var addObjectTime = Date.now() / 1000;
                _currentSession.assert(new _FlowContextInformation("foo", "bar", {foo: "baz"}));
                console.log("Add predefined object time: "+(Date.now() / 1000 - addObjectTime));
            }
            console.log("Add 10 predefined objects time: "+(Date.now() / 1000 - addDefinedObjectTime));*/
        }

        RuleEngine.prototype._generateNewSession = function(contextInformation) {
            var self = this;

            if (this._currentSession != null) this._currentSession.dispose();

            this._currentSession = this._flow.getSession();

            // set session callbacks
            this._currentSession.on("restrictFeature", function(feature, facts){
                if (typeof self._callbacks["restrictFeatureCallback"] != "undefined") {
                    self._callbacks["restrictFeatureCallback"](feature, self._contextInformationFromFacts(facts));
                }
            });

            this._currentSession.on("selectLearningUnit", function(id, facts){
                if (typeof self._callbacks["selectLearningUnitCallback"] != "undefined") {
                    self._callbacks["selectLearningUnitCallback"](id, self._contextInformationFromFacts(facts));
                }
            });

            this._currentSession.on("preloadLearningUnit", function(id, facts){
                if (typeof self._callbacks["preloadLearningUnitCallback"] != "undefined") {
                    self._callbacks["preloadLearningUnitCallback"](id, self._contextInformationFromFacts(facts));
                }
            });

            // add context information as facts
            if (this._verbose) var addOverallTime = Date.now() / 1000;
            for (var index in contextInformation) {
                this.addContextInformation(contextInformation[index]);
            }
            if (this._verbose) console.log("Add overall time: "+(Date.now() / 1000 - addOverallTime));
        };

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
        RuleEngine.prototype.matchRules = function(contextInformation) {
            var self = this;

            // create new session
            this._generateNewSession(contextInformation);

            if (this._verbose) console.log("Matching rules...");
            var startTime = Math.floor(Date.now() / 1000);
            this._currentSession.match(function(err) {
                if (err) {
                    self._callbacks["ruleMatchingErrorCallback"](err);
                } else {
                    var endTime = Math.floor(Date.now() / 1000);
                    if (self._verbose) console.log("Time for rule matching "+(endTime-startTime)+" secs.");
                    self._callbacks["ruleMatchingSuccessCallback"]();
                }
            });
        };

        RuleEngine.prototype._addFact = function(fact) {
            this._currentSession.assert(fact);
        };

        /**
         * Adds a context information as a fact to the current nools session.
         * @alias addContextInformation
         * @memberof RuleEngine#
         * @param contextInformation {ContextInformation}
         */
        RuleEngine.prototype.addContextInformation = function(contextInformation) {
            if (this._verbose) var addStart = Date.now() / 1000;
            this._addFact(new this._FlowContextInformation(contextInformation.getID(), contextInformation.getValue(), contextInformation.getParameters()));
            if (this._verbose) console.log("Add time: "+(Date.now() / 1000 - addStart)+" "+contextInformation.getID());
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