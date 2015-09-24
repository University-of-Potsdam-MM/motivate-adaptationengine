define("MoCI", [], function() {
    return (function() {

        /**
         * A context information
         *
         * @constructs ContextInformation
         * @param {string} [id=null]
         * @param {string} [value=null]
         * @param {object} [parameters]
         * @param [timestamp]
         */
        function ContextInformation(id, value, parameters, timestamp) {
            this._id = typeof id != "undefined" ? id : null;
            this._value = typeof value != "undefined" ? value : null;
            this._parameters = typeof parameters != "undefined" ? parameters : {};
            this._timestamp = typeof timestamp != "undefined" ? timestamp : null;

            return this;
        }

        /**
         * Creates a context information from a fact that was extracted from a nools adaptation rule.
         *
         * @static
         * @constructs ContextInformation
         * @param fact {Object} The fact to create the context information from.
         * @returns {ContextInformation}
         */
        ContextInformation.fromFact = function(fact) {
            return new ContextInformation(fact.id, fact.value, fact.parameters);
        };

        /**
         * Creates a context information from a attribute value that was gathered by the contactJS framework.
         *
         * @static
         * @constructs ContextInformation
         * @param {Attribute} attribute
         * @returns {ContextInformation}
         */
        ContextInformation.fromAttribute = function(attribute) {
            return new ContextInformation(attribute.getName(), attribute.getValue(), attribute.getParameters().getItemsAsJson(), attribute.getTimestamp());
        };

        /**
         *
         * @returns {string} description
         */
        ContextInformation.prototype.description = function() {
            var description = "";

            description += "AT "+this._timestamp;
            description += " "+this.getID();
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
         *
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
         *
         * @returns {String} id The context information's id.
         */
        ContextInformation.prototype.getID = function() {
            return this._id;
        };

        /**
         * Sets the context information's id.
         *
         * @param newID {String} The new id.
         */
        ContextInformation.prototype.setID  = function(newID) {
            this._id = newID;
        };

        /**
         * Returns the value for a parameter by name.
         *
         * @param name {String} The name of the parameter.
         * @returns value {String} The value of the parameter.
         */
        ContextInformation.prototype.getParameterValue = function(name) {
            return this._parameters[name];
        };

        /**
         * Sets a parameter value for a parameter by name.
         *
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
         *
         * @returns {Object}
         */
        ContextInformation.prototype.getParameters = function() {
            return this._parameters;
        };

        /**
         * Sets an object with parameters.
         *
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
         *
         * @returns {String}
         */
        ContextInformation.prototype.getValue = function() {
            return this._value;
        };

        /**
         * Sets the value for the context information.
         *
         * @param value {String} The new value.
         */
        ContextInformation.prototype.setValue = function(value) {
            this._value = value
        };

        /**
         *
         * @returns {*}
         */
        ContextInformation.prototype.getTimestamp = function() {
            return this._timestamp;
        };

        /**
         *
         * @returns {string}
         */
        ContextInformation.prototype.getFormatedTimestamp = function() {
            return this.getTimestamp().getDate()+"."+this.getTimestamp().getMonth()+"."+this.getTimestamp().getFullYear()+" "+this.getTimestamp().getHours()+":"+this.getTimestamp().getMinutes()+":"+this.getTimestamp().getSeconds();
        };

        return ContextInformation;
    })();
});