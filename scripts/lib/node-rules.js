define (["underscore"], function(_) {
    return (function() {
        'use strict';

        function RuleEngine(rules) {

            this.init();

            if(typeof(rules) != "undefined") {
                this.register(rules);
            }

            return this;

        }

        RuleEngine.prototype.init = function(rules) {

            this.rules = [];
            this.activeRules = [];

        };

        RuleEngine.prototype.register = function(rules) {


            if(rules instanceof Array) {

                this.rules = this.rules.concat(rules);

            } else if(rules !== null && typeof(rules) == "object") {

                this.rules.push(rules);

            }

            this.sync();

        };


        RuleEngine.prototype.sync = function() {

            this.activeRules = this.rules.filter(function(a) {

                if(typeof(a.on) === "undefined"){
                    a.on = true;
                }

                if(a.on === true) {
                    return a;
                }

            });

            this.activeRules.sort(function(a, b) {

                if(a.priority && b.priority) {
                    return b.priority - a.priority;
                } else {
                    return 0;
                }

            });

        };


        RuleEngine.prototype.execute = function(fact, callback) {

            //these new attributes have to be in both last session and current session to support
            // the compare function
            var complete = false;
            fact.result = true;

            var session = _.clone(fact);
            var lastSession = _.clone(fact);
            var _rules = this.activeRules;


            (function FnRuleLoop(x) {


                var API = {

                    "when" : function(outcome) {

                        if (outcome) {
                            var _consequence = _rules[x].consequence;
                            _consequence.call(session, API);

                        } else {
                            API.next();
                        }
                    },

                    "restart" : function() {

                        return FnRuleLoop(0);

                    },

                    "stop" : function() {

                        complete = true;
                        return FnRuleLoop(0);

                    },

                    "next" : function () {

                        if (!_.isEqual(lastSession,session)) {

                            lastSession = _.clone(session);
                            API.restart();

                        } else {
                            return FnRuleLoop(x+1);
                        }

                    }

                };

                if (x < _rules.length && complete === false) {

                    var _rule = _rules[x].condition;
                    _rule.call(session, API);

                } else {
                    return callback(session);
                }

            })(0);
        };

        RuleEngine.prototype.findRules = function(filter) {

            var find = _.matches(filter);
            return _.filter(this.rules, find);

        };

        RuleEngine.prototype.turn = function(state,filter) {

            var state = !!(state === "on" || state === "ON");

            var rules = this.findRules(filter);

            for(var i=0,j=rules.length; i<j; i++) {

                rules[i].on = state;

            }

            this.sync();

        };


        RuleEngine.prototype.prioritize = function(priority,filter) {

            priority = parseInt(priority,10);
            var rules = this.findRules(filter);

            for(var i=0,j=rules.length; i<j; i++) {

                rules[i].priority = priority;

            }

            this.sync();

        };

        RuleEngine.prototype.toJSON = function() {

            var rules = this.rules;

            if(rules instanceof Array) {

                rules = rules.map(function(rule){

                    rule.condition = rule.condition.toString();
                    rule.consequence = rule.consequence.toString();
                    return rule;

                });

            } else if(typeof(rules) != "undefined") {

                rules.condition = rules.condition.toString();
                rules.consequence = rules.consequence.toString();

            }

            return rules;

        };

        RuleEngine.prototype.fromJSON = function(rules) {

            this.init();

            if(typeof(rules) == "string") {

                rules = JSON.parse(rules);

            }

            if(rules instanceof Array) {

                rules = rules.map(function(rule){

                    rule.condition = eval("("+rule.condition+")");
                    rule.consequence = eval("("+rule.consequence+")");
                    return rule;

                });

            } else if(rules !== null && typeof(rules) == "object") {

                rules.condition = eval("("+rules.condition+")");
                rules.consequence = eval("("+rules.consequence+")");

            }

            this.register(rules);

        };

        return RuleEngine;
    }());
});