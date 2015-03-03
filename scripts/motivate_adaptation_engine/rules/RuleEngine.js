define("MoRE", ['nools', 'easejs', 'MoCI'], function (nools, easejs, ContextInformation) {
    var Class = easejs.Class;

    var RuleEngine = Class('RuleEngine',
        {
            'private _nools': null,
            'private _flow': null,
            'private _parsedFlow': null,
            'private _session': null,
            'private _callbacks': {
                "ruleMatchingSuccessCallback": function() {
                    console.log("done");
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
             */
            __construct: function(noolsDSL)
            {
                var that = this;

                this._nools = require("nools");
                this._parsedFlow = this._nools.parse(noolsDSL);
                this._flow = this._nools.compile(noolsDSL, {name: "adaptationRules"});
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

                this._session.on("preloadLearningUnit", function(id){
                    if (typeof that._callbacks["preloadLearningUnitCallback"] != "undefined") {
                        that._callbacks["preloadLearningUnitCallback"](id);
                    }
                });
            },

            'private _contextInformationFromFacts': function(facts) {
                var contextInformation = [];
                for(index in facts) {
                    var fact = facts[index];
                    contextInformation.push(ContextInformation.fromFact(fact));
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


                console.log("matching...");
                this._session.match(function(err) {
                   if (err) {
                       that._callbacks["ruleMatchingErrorCallback"](err);
                   } else {
                       that._callbacks["ruleMatchingSuccessCallback"]();
                   }
                });
            },

            'private _addFact': function(fact) {
                this._session.assert(fact);
            },

            /**
             * Adds a context information as fact to the current nools session.
             * @alias addContextInformation
             * @memberof RuleEngine#
             * @param contextInformation
             */
            'public addContextInformation': function(contextInformation) {
                //TODO: add context information directly from context detection and convert to flow context information
                //FlowContextInformation = this.getDefined("ContextInformation");
                //TODO: test if context information already exists
                if (false) {

                } else {
                    this._addFact(contextInformation);
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