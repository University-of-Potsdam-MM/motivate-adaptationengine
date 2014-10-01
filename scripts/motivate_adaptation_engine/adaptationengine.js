define('MoAE', ['easejs', 'MoRE', 'MoCD'], function (easejs, RuleEngine, ContextDetector) {
    var Class = easejs.Class;

    var AdaptationEngine = Class('AdaptationEngine',
        {
            'private _ruleEngine': [],
            'private _contextDetector': [],
            'private _noolsDSL': "",
            'private _ruleMatchingInterval': null,

            'public isRunning': false,

            __construct: function(noolsDSL)
            {
                this._noolsDSL = noolsDSL;
                this._ruleEngine = new RuleEngine(noolsDSL);
                // parse rules for context detection initialization
                for (var rule in this._ruleEngine.getRules()) {
                    // pass rule to context detection
                }
                FlowContextInformation = this._ruleEngine.getDefined("ContextInformation");
                this._ruleEngine.addContextInformation(new FlowContextInformation("CurrentTemperatureMeasurableInformation", 55, {"TemperatureScaleContextParameter" : "FAHRENHEIT"}));

                this._contextDetector = new ContextDetector();
            },

            'public setRestrictFeatureCallback': function(callback) {
                this._ruleEngine.setCallback("restrictFeatureCallback", callback);
            },

            'public setSelectLearningUnitCallback': function(callback) {
                this._ruleEngine.setCallback("selectLearningUnitCallback", callback);
            },

            'public setPreloadLearningUnitCallback': function(callback) {
                this._ruleEngine.setCallback("preloadLearningUnitCallback", callback);
            },

            'public setRuleMatchingSuccessCallback': function(callback) {
                this._ruleEngine.setCallback("ruleMatchingSuccessCallback", callback);
            },

            'public setRuleMatchingErrorCallback': function(callback) {
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
