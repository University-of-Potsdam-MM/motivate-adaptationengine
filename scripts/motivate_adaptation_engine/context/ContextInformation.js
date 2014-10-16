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
         * @param fact {object} The fact to create the context information from.
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
         * @alias description
         * @memberof ContextInformation#
         * @returns {string} description
         */
        'public description': function() {
            var description = "";

            description += this.getID()+" [";
            for(var parameter in this.getParameters()) {
                description += parameter+":"+this.getParameter(parameter);
            }
            description += "] is "+this.getValue();

            return description;
        },

        'public equals': function(contextInformation) {
            var isEqual = true;
            if (this.getID() != contextInformation.getID()) isEqual = false;
            for(parameter in this.getParameters()) {
                if (this.getParameter(parameter) != contextInformation.getParameter(parameter)) isEqual = false;
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

        'public getParameter': function(name) {
            return this._parameters[name];
        },

        'public setParameter': function(name, value) {
            this._parameters[name] = value;
        },

        'public getParameters': function() {
            return this._parameters;
        },

        'public setParameters': function(parameters) {
            this._parameters = parameters;
        },

        'public getValue': function() {
            return this._value;
        },

        'public setValue': function(value) {
            this._value = value
        }
    });

    return ContextInformation;
});