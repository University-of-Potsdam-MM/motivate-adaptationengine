define("MoRE", ['nools', 'easejs'], function (nools, easejs, ConstraintParser) {
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

            __construct: function(noolsDSL)
            {
                var that = this;

                this._nools = require("nools");
                this._parsedFlow = this._nools.parse(noolsDSL);
                this._flow = this._nools.compile(noolsDSL, {name: "adaptationRules"});
                this._session = this._flow.getSession();

                this._session.on("restrictFeature", function(feature){
                    console.log("Restrict Feature: "+feature+"!");
                    if (typeof that._callbacks["restrictFeatureCallback"] != "undefined") {
                        that._callbacks["restrictFeatureCallback"](feature);
                    }
                });

                this._session.on("selectLearningUnit", function(id){
                    console.log("Select Learning Unit: "+id+"!");
                    if (typeof that._callbacks["selectLearningUnitCallback"] != "undefined") {
                        that._callbacks["selectLearningUnitCallback"](id);
                    }
                });

                this._session.on("preloadLearningUnit", function(id){
                    console.log("Preload Learning Unit: "+id+"!");
                    if (typeof that._callbacks["preloadLearningUnitCallback"] != "undefined") {
                        that._callbacks["preloadLearningUnitCallback"](id);
                    }
                });
            },

            'public setCallback': function(callbackName, callback) {
                this._callbacks[callbackName] = callback;
            },

            'public getRules': function() {
                return this._parsedFlow.rules;
            },

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

            'public addContextInformation': function(contextInformation) {
                //TODO: add context information directly from context detection and convert to flow context information
                //FlowContextInformation = this.getDefined("ContextInformation");
                //TODO: test if context information already exists
                if (false) {

                } else {
                    this._addFact(contextInformation);
                }
            },

            'public getDefined': function(definitionName) {
                return this._flow.getDefined(definitionName);
            }
        }
    );

    return RuleEngine;
});