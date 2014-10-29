define("MoCI", ['easejs'], function(easejs) {
    var Class = easejs.Class;

    var ContextInformation = Class('ContextInformation', {
        'private _id': null,
        'private _value': null,
        'private _parameters': {},

        /**
         * A context information
         * @class Describes a context information.
         * @constructs ContextInformation
         * @param [id=null] {string}
         * @param [value=null] {string}
         * @param [parameters] {object}
         */
        __construct : function(id, value, parameters) {
            if (typeof id != "undefined") this._id = id;
            if (typeof value != "undefined") this._value = value;
            if (typeof parameters != "undefined") this._parameters = parameters;
        },

        /**
         * Creates a context information from a fact that was extracted from a nools adaptation rule.
         * @alias fromFact
         * @memberof ContextInformation
         * @param fact {Object} The fact to create the context information from.
         * @returns {ContextInformation}
         */
        'public static fromFact': function(fact) {
            var contextInformation = new ContextInformation();
            contextInformation.setID(fact.id);
            contextInformation.setParameters(fact.parameters);
            contextInformation.setValue(fact.value);
            return contextInformation;
        },

        /**
         *
         * @alias description
         * @memberof ContextInformation#
         * @returns {string} description
         */
        'public description': function() {
            var description = "";

            description += this.getID()+" [";
            for(var parameter in this.getParameters()) {
                description += parameter+":"+this.getParameterValue(parameter);
            }
            description += "] is "+this.getValue();

            return description;
        },

        /**
         * Compares two context information and returns true if ID and parameters are equal.
         * @alias equals
         * @memberof ContextInformation#
         * @param contextInformation {ContextInformation} The context information to compare.
         * @returns {boolean}
         */
        'public equals': function(contextInformation) {
            var isEqual = true;
            if (this.getID() != contextInformation.getID()) isEqual = false;
            for(parameter in this.getParameters()) {
                if (this.getParameterValue(parameter) != contextInformation.getParameterValue(parameter)) isEqual = false;
            }
            return isEqual;
        },

        /**
         * Returns the context information's id.
         * @memberof ContextInformation#
         * @alias getID
         * @returns {string} id The context information's id.
         */
        'public getID': function() {
            return this._id;
        },

        /**
         * Sets the context information's id.
         * @memberof ContextInformation#
         * @alias setID
         * @param newID {string} The new id.
         */
        'public setID': function(newID) {
            this._id = newID;
        },

        /**
         * Returns the value for a parameter by name.
         * @alias getParameterValue
         * @memberof ContextInformation#
         * @param name {String} The name of the parameter.
         * @returns value {String} The value of the parameter.
         */
        'public getParameterValue': function(name) {
            return this._parameters[name];
        },

        /**
         * Sets a parameter value for a parameter by name.
         * @alias setParameterValue
         * @memberof ContextInformation#
         * @param name {String} The name of the parameter.
         * @param value {String} The value for the parameter.
         * @example
         * contextInformation.setParameterValue("TemperatureScaleContextParameter", "FAHRENHEIT");
         */
        'public setParameterValue': function(name, value) {
            this._parameters[name] = value;
        },

        /**
         * Returns all parameters.
         * @alias getParameter
         * @memberof ContextInformation#
         * @returns {Object}
         */
        'public getParameters': function() {
            return this._parameters;
        },

        /**
         * Sets an object with parameters.
         * @alias setParameters
         * @memberof ContextInformation#
         * @param parameters {Object} The parameters.
         * @example
         * contextInformation.setParameters({
         *      "TemperatureScaleContextParameter": "FAHRENHEIT"
         * });
         */
        'public setParameters': function(parameters) {
            this._parameters = parameters;
        },

        /**
         * Returns the value for the context information.
         * @alias getValue
         * @memberof ContextInformation#
         * @returns {String}
         */
        'public getValue': function() {
            return this._value;
        },

        /**
         * Sets the value for the context information.
         * @alias setValue
         * @memberof ContextInformation#
         * @param value {String} The new value.
         */
        'public setValue': function(value) {
            this._value = value
        }
    });

    return ContextInformation;
});