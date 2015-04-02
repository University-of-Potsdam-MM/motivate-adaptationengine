define("MoCI", [], function() {
    var ContextInformation = (function() {

        /**
         * A context information
         * @class
         * @constructs ContextInformation
         * @param [id=null] {string}
         * @param [value=null] {string}
         * @param [parameters] {object}
         */
        function ContextInformation(id, value, parameters) {
            this._id = typeof id != "undefined" ? id : null;
            this._value = typeof value != "undefined" ? value : null;
            this._parameters = typeof parameters != "undefined" ? parameters : {};
        }

        /**
         * Creates a context information from a fact that was extracted from a nools adaptation rule.
         * @static
         * @alias fromFact
         * @memberof ContextInformation
         * @constructs ContextInformation
         * @param fact {Object} The fact to create the context information from.
         * @returns {ContextInformation}
         */
        ContextInformation.fromFact = function(fact) {
            return new ContextInformation(fact.id, fact.value, fact.parameters);
        };

        /**
         * Creates a context information from a attribute value that was gathered by the contactJS framework.
         * @static
         * @alias fromAttributeValue
         * @memberof ContextInformation
         * @constructs ContextInformation
         * @param attributeValue
         * @returns {ContextInformation}
         */
        ContextInformation.fromAttributeValue = function(attributeValue) {
            return new ContextInformation(attributeValue.getName(), attributeValue.getValue(), attributeValue.getParameters().getItemsAsJson());
        };

        /**
         *
         * @alias description
         * @memberof ContextInformation#
         * @returns {string} description
         */
        ContextInformation.prototype.description = function() {
            var description = "";

            description += this.getID();
            if (!$.isEmptyObject(this.getParameters())) {
                description += " [";
                for(var parameter in this.getParameters()) {
                    description += parameter+":"+this.getParameterValue(parameter);
                }
                description += "]";
            }
            description += " IS "+this.getValue();

            return description;
        };

        /**
         * Compares two context information and returns true if ID and parameters are equal.
         * @alias equals
         * @memberof ContextInformation#
         * @param contextInformation {ContextInformation} The context information to compare.
         * @returns {boolean}
         */
        ContextInformation.prototype.equals = function(contextInformation) {
            var isEqual = true;
            if (this.getID() != contextInformation.getID()) isEqual = false;
            for(parameter in this.getParameters()) {
                if (this.getParameterValue(parameter) != contextInformation.getParameterValue(parameter)) isEqual = false;
            }
            return isEqual;
        };

        /**
         * Returns the context information's id.
         * @memberof ContextInformation#
         * @alias getID
         * @returns {String} id The context information's id.
         */
        ContextInformation.prototype.getID = function() {
            return this._id;
        };

        /**
         * Sets the context information's id.
         * @memberof ContextInformation#
         * @alias setID
         * @param newID {String} The new id.
         */
        ContextInformation.prototype.setID  = function(newID) {
            this._id = newID;
        };

        /**
         * Returns the value for a parameter by name.
         * @alias getParameterValue
         * @memberof ContextInformation#
         * @param name {String} The name of the parameter.
         * @returns value {String} The value of the parameter.
         */
        ContextInformation.prototype.getParameterValue = function(name) {
            return this._parameters[name];
        };

        /**
         * Sets a parameter value for a parameter by name.
         * @alias setParameterValue
         * @memberof ContextInformation#
         * @param name {String} The name of the parameter.
         * @param value {String} The value for the parameter.
         * @example
         * contextInformation.setParameterValue("TemperatureScaleContextParameter", "FAHRENHEIT");
         */
        ContextInformation.prototype.setParameterValue = function(name, value) {
            this._parameters[name] = value;
        };

        /**
         * Returns all parameters.
         * @alias getParameter
         * @memberof ContextInformation#
         * @returns {Object}
         */
        ContextInformation.prototype.getParameters = function() {
            return this._parameters;
        };

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
        ContextInformation.prototype.setParameters = function(parameters) {
            this._parameters = parameters;
        };

        /**
         * Returns the value for the context information.
         * @alias getValue
         * @memberof ContextInformation#
         * @returns {String}
         */
        ContextInformation.prototype.getValue = function() {
            return this._value;
        };

        /**
         * Sets the value for the context information.
         * @alias setValue
         * @memberof ContextInformation#
         * @param value {String} The new value.
         */
        ContextInformation.prototype.setValue = function(value) {
            this._value = value
        };

        return ContextInformation;
    })();

    return ContextInformation;
});