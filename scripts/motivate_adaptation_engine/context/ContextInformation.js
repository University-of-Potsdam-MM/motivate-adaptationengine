define("MoCI", ['easejs'], function(easejs) {
    var Class = easejs.Class;

    var ContextInformation = Class('ContextInformation', {
        'private _id': null,
        'private _value': null,
        'private _parameters': {},

        __construct : function(id, value, parameters) {
            if (typeof id != "undefined") this._id = id;
            if (typeof value != "undefined") this._value = value;
            if (typeof parameters != "undefined") this._parameters = parameters;
        },

        'public static fromFact': function(fact) {
            var contextInformation = new ContextInformation();
            contextInformation.setID(fact.id);
            contextInformation.setParameters(fact.parameters);
            contextInformation.setValue(fact.value);
            return contextInformation;
        },

        'public equals': function(contextInformation) {
            var isEqual = true;
            if (this.getID() != contextInformation.getID()) isEqual = false;
            for(parameter in this.getParameters()) {
                if (this.getParameter(parameter) != contextInformation.getParameter(parameter)) isEqual = false;
            }
            return isEqual;
        },

        'public getID': function() {
            return this._id;
        },

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