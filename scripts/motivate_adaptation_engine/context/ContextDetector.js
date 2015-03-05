define("MoCD", ['nools', 'easejs', 'jquery', 'MoCI', 'contactJS', 'lib/parser/constraint/parser'], function(nools, easejs, $, ContextInformation, contactJS) {
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

        /**
         * The context detector encapsulates the context toolkit which provides context information.
         * @class
         * @constructs ContextDetector
         * @param adaptationRules {*|Array} The adaptation rules as returned by the rule engine. Are used to determine which context information are required.
         */
        __construct: function(adaptationRules) {
            this._discoverer = new contactJS.Discoverer();

            for(var index in adaptationRules) {
                var adaptationRule = adaptationRules[index];
                var lastConstraint = adaptationRule.constraints[adaptationRule.constraints.length - 1];
                this._extractContextInformationFromParsedConstraints(parser.parse(lastConstraint[lastConstraint.length - 1]));
            }

            this._discoverer.registerNewComponent(new contactJS.GeoLocationWidget(this._discoverer));
            console.log(this._discoverer.getWidgetDescriptions());
        },


        /**
         * Sets a function as the callback for the provided callback name.
         * @alias setCallback
         * @memberof ContextDetector#
         * @param callbackName {string} The name of the callback.
         * @param callback {function} The function that handles the callback.
         */
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
                        this._currentContextInformation.setParameterValue(this._currentParameter, parsedConstraint);
                        this._currentParameter = null;
                    }
                }
            }
        },

        /**
         * Returns true if the given context information was gathered before.
         * @alias contextInformationExists
         * @memberof ContextDetector#
         * @param contextInformation {ContextInformation} The context information to test.
         * @returns {Boolean}
         */
        'public contextInformationExists': function(contextInformation) {
            return this._indexForContextInformation(contextInformation) != -1;
        },

        'private _indexForContextInformation': function(contextInformation) {
            for(index in this._contextInformation) {
                var existingContextInformation = this._contextInformation[index];
                if (existingContextInformation.equals(contextInformation)) return index;
            }
            return -1;
        },

        /**
         * Adds a context information that wasn't gathered before.
         * @alias addContextInformation
         * @memberof ContextDetector#
         * @param newContextInformation {ContextInformation} The new context information.
         * @param multiple {Boolean} Set to true if multiple instances of the context information are allowed.
         */
        'public addContextInformation': function(newContextInformation, multiple) {
            if (multiple || !multiple && !this.contextInformationExists(newContextInformation)) {
                this._contextInformation.push(newContextInformation);
            }
        },

        /**
         * Updates a context information that was gathered before.
         * @alias updateContextInformation
         * @memberof ContextDetector#
         * @param updatedContextInformation {ContextInformation} The updated context information.
         * @param multiple {Boolean} Set to true if multiple instances of the context information are allowed.
         */
        'public updateContextInformation': function(updatedContextInformation, multiple) {
            if (multiple) {
                this.addContextInformation(updatedContextInformation, multiple);
            } else {
                if (this.indexForContextInformation(updatedContextInformation) != -1) this.contextInformation[index] = updatedContextInformation;
            }
        },

        /**
         * Returns all context information.
         * @alias getContextInformation
         * @memberof ContextDetector#
         * @returns {Array.<ContextInformation>}
         */
        'public getContextInformation': function() {
            return this._contextInformation;
        }
    });

    return ContextDetector;
});