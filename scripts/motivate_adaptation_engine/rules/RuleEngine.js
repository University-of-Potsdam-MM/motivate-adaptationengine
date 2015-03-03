define("MoRE", ['nools', 'easejs', 'MoCI'], function (nools, easejs, ContextInformation) {
    var Class = easejs.Class;

    var RuleEngine = Class('RuleEngine',
        {
            'private _verbose': false,
            'private _nools': null,
            'private _flow': null,
            'private _parsedFlow': null,
            'private _session': null,
            'private _FlowContextInformation': null,
            'private _callbacks': {
                "ruleMatchingSuccessCallback": function() {
                    console.log("Rule matching finished successfully.");
                },
                "ruleMatchingErrorCallback": function(err) {
                    console.error(err.stack);
                }
            },

            /**
             * The rule engine encapsulates the nools.js rule engine.
             * @class RuleEngine
             * @constructs RuleEngine
             * @param noolsDSL {string} The adaptation rules formated in nools DSL as provided by the rule generator.
             * @param verbose {boolean} Activates console output if set to true.
             */
            __construct: function(noolsDSL, verbose)
            {
                var that = this;
                this._verbose = verbose;


                this._nools = require("nools");
                this._parsedFlow = this._nools.parse(noolsDSL);
                this._flow = this._nools.compile(noolsDSL, {name: "adaptationRules"});
                this._FlowContextInformation = this.getDefined("ContextInformation");
                this._session = this._flow.getSession();

                this._session.on("restrictFeature", function(feature, facts){
                    if (typeof that._callbacks["restrictFeatureCallback"] != "undefined") {
                        that._callbacks["restrictFeatureCallback"](feature, that._contextInformationFromFacts(facts));
                    }
                });

                this._session.on("selectLearningUnit", function(id, facts){
                    if (typeof that._callbacks["selectLearningUnitCallback"] != "undefined") {
                        that._callbacks["selectLearningUnitCallback"](id, that._contextInformationFromFacts(facts));
                    }
                });

                this._session.on("preloadLearningUnit", function(id, facts){
                    if (typeof that._callbacks["preloadLearningUnitCallback"] != "undefined") {
                        that._callbacks["preloadLearningUnitCallback"](id, that._contextInformationFromFacts(facts));
                    }
                });
            },

            'private _contextInformationFromFacts': function(facts) {
                var contextInformation = [];
                for(var index in facts) {
                    var fact = facts[index];
                    if(fact instanceof this._FlowContextInformation) {
                        contextInformation.push(ContextInformation.fromFact(fact));
                    }
                }
                return contextInformation;
            },

            /**
             * Sets a function as the callback for the provided callback name.
             * @alias setCallback
             * @memberof RuleEngine#
             * @param callbackName {string} The name of the callback.
             * @param callback {function} The function that handles the callback.
             */
            'public setCallback': function(callbackName, callback) {
                this._callbacks[callbackName] = callback;
            },

            /**
             * Returns the rules that are part of the current nools flow.
             * @alias getRules
             * @memberof RuleEngine#
             * @returns {*|Array}
             */
            'public getRules': function() {
                return this._parsedFlow.rules;
            },

            /**
             * Starts the nools rule matching and triggers callbacks for success or errors.
             * @alias matchRules
             * @memberof RuleEngine#
             */
            'public matchRules': function() {
                var that = this;

                if (this._verbose) console.log("Matching rules...");
                var startTime = Math.floor(Date.now() / 1000);
                this._session.match(function(err) {
                    if (err) {
                        that._callbacks["ruleMatchingErrorCallback"](err);
                    } else {
                        var endTime = Math.floor(Date.now() / 1000);
                        if (this._verbose) console.log("Time for rule matching "+(endTime-startTime)+" secs.");
                        that._callbacks["ruleMatchingSuccessCallback"]();
                    }
                });
            },

            'private _addFact': function(fact) {
                if (this._verbose) console.log("addFact");
                this._session.assert(fact);
            },

            /**
             * Adds a context information as a fact to the current nools session.
             * @alias addContextInformation
             * @memberof RuleEngine#
             * @param contextInformation {ContextInformation}
             */
            'public addContextInformation': function(contextInformation) {
                //TODO: add context information directly from context detection and convert to flow context information
                //FlowContextInformation = this.getDefined("ContextInformation");
                //TODO: test if context information already exist

                if (false) {

                } else {
                    this._addFact(new this._FlowContextInformation(contextInformation.getID(), contextInformation.getValue(), contextInformation.getParameters()));
                }
            },

            /**
             * Returns the nools class definition with the provided name.
             * @alias getDefined
             * @memberof RuleEngine#
             * @param definitionName
             * @returns {*}
             */
            'public getDefined': function(definitionName) {
                return this._flow.getDefined(definitionName);
            }
        }
    );

    return RuleEngine;
});