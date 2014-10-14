define("MoCD", ['nools', 'easejs', 'jquery', 'MoCD_Discoverer', 'MoCD_GeoLocationWidget', 'MoCI', 'lib/parser/constraint/parser'], function(nools, easejs, $, Discoverer, GeoLocationWidget, ContextInformation) {
    var Class = easejs.Class;

    var ContextDetector = Class('ContextDetector', {
        'private _discoverer': null,
        'private _contextInformation' : [],
        'private _currentContextInformation': null,
        'private _currentParameter': null,
        'private _expectParameterValue' : false,
        'private _callbacks' : {
            "newContextInformationCallback": function() {
                console.log("Warning! There is no callback set to handle new context information.");
            },
            "updateContextInformationCallback": function() {
                console.log("Warning! There is no callback set to handle updated context information.");
            }
        },

        __construct: function(adaptationRules) {
            this._discoverer = new Discoverer();

            for(var index in adaptationRules) {
                var adaptationRule = adaptationRules[index];
                var lastConstraint = adaptationRule.constraints[adaptationRule.constraints.length - 1];
                this._extractContextInformationFromParsedConstraints(parser.parse(lastConstraint[lastConstraint.length - 1]));

                //this._discoverer.registerNewComponent(new GeoLocationWidget(this._discoverer));
                //console.log(this._discoverer.getWidgetDescriptions());
            }

            console.log(this._contextInformation);
        },

        'public setCallback': function(callbackName, callback) {
            this._callbacks[callbackName] = callback;
        },

        'private _extractContextInformationFromParsedConstraints': function(parsedConstraints) {
            var parameterValueExceptions = ["string", "propLookup"];

            for(index in parsedConstraints) {
                var parsedConstraint = parsedConstraints[index];
                if ($.isArray(parsedConstraint)) {
                    this._extractContextInformationFromParsedConstraints(parsedConstraint);
                } else if (parsedConstraint != null && typeof parsedConstraint == "string") {
                    if (parsedConstraint.indexOf("MeasurableInformation") > -1) {
                        if (this._currentContextInformation != null) {
                            this.addContextInformation(this._currentContextInformation, false);
                        }
                        this._currentContextInformation = new ContextInformation(parsedConstraint);
                    } else if (parsedConstraint.indexOf("ContextParameter") > -1) {
                        this._currentParameter = parsedConstraint;
                        this._expectParameterValue = true;
                    } else if (this._expectParameterValue && typeof parsedConstraint == "string" && $.inArray(parsedConstraint, parameterValueExceptions) == -1) {
                        this._expectParameterValue = false;
                        this._currentContextInformation.setParameter(this._currentParameter, parsedConstraint);
                        this._currentParameter = null;
                    }
                }
            }
        },

        'public indexForContextInformation': function(contextInformation) {
            for(index in this._contextInformation) {
                var existingContextInformation = this._contextInformation[index];
                if (existingContextInformation.equals(contextInformation)) return index;
            }
            return -1;
        },

        'public addContextInformation': function(newContextInformation, multiple) {
            if (multiple || !multiple && this.indexForContextInformation(newContextInformation) == -1) {
                this._contextInformation.push(newContextInformation);
            }
        },

        'public updateContextInformation': function(updatedContextInformation, multiple) {
            if (multiple) {
                this.addContextInformation(updatedContextInformation, multiple);
            } else {
                if (this.indexForContextInformation(updatedContextInformation) != -1) this.contextInformation[index] = updatedContextInformation;
            }
        },

        'public getContextInformation': function() {
            return this._contextInformation;
        }
    });

    return ContextDetector;
});