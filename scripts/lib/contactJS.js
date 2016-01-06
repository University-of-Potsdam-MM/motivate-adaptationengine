(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD.
    define(['jquery', 'MathUuid'],factory);
  } else {
    	root.contactJS = factory(root.$, root.MathUuid);
  }
}(this, function($, MathUuid) {/**
 * almond 0.1.2 Copyright (c) 2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var defined = {},
        waiting = {},
        config = {},
        defining = {},
        aps = [].slice,
        main, req;

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {},
            nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part;

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; (part = name[i]); i++) {
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            return true;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (waiting.hasOwnProperty(name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!defined.hasOwnProperty(name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    function makeMap(name, relName) {
        var prefix, plugin,
            index = name.indexOf('!');

        if (index !== -1) {
            prefix = normalize(name.slice(0, index), relName);
            name = name.slice(index + 1);
            plugin = callDep(prefix);

            //Normalize according
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            p: plugin
        };
    }

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    main = function (name, deps, callback, relName) {
        var args = [],
            usingExports,
            cjsModule, depName, ret, map, i;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i++) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = makeRequire(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = defined[name] = {};
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = {
                        id: name,
                        uri: '',
                        exports: defined[name],
                        config: makeConfig(name)
                    };
                } else if (defined.hasOwnProperty(depName) || waiting.hasOwnProperty(depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else if (!defining[depName]) {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                    cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync) {
        if (typeof deps === "string") {
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 15);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        waiting[name] = [name, deps, callback];
    };

    define.amd = {
        jQuery: true
    };
}());

define("../libs/almond/almond", function(){});

/**
 * This module represents a List. 
 * It is an abstract Class.
 * 
 * @module AbstractList
 */
define('abstractList',[],function() {
	return (function() {
		/**
		 * @classdesc This class represents a list.
		 * @constructs AbstractList
		 */
		function AbstractList() {
			/**
			 *
			 * @type {Array}
			 * @private
			 */
			this._items = [];

			/**
			 *
			 * @type {Object}
			 * @private
			 */
			this._type = Object;

			return this;
		}

		/**
		 * Builder for Item list.
		 *
		 * @param {*} list
		 * @returns {*}
		 */
		AbstractList.prototype.withItems = function(list) {
			if (list instanceof Array) {
				this._items = list;
			} else if (list.constructor === this.constructor) {
				this._items = list.getItems();
			}
			return this;
		};

		/**
		 * Adds the specified item to the itemList.
		 *
		 * @public
		 * @param {*} item item that should be added
		 */
		AbstractList.prototype.put = function(item) {
			if (item instanceof this._type) {
				if (!(this.contains(item))) {
					this._items.push(item);
				}
			}
		};

		/**
		 * Adds all items in the specified list to the itemList.
		 *
		 * @public
		 * @param {*} listOrArray list of items that should be added
		 */
		AbstractList.prototype.putAll = function(listOrArray) {
			var list = [];
			if (listOrArray instanceof Array) {
				list = listOrArray;
			} else if (listOrArray.constructor === this.constructor) {
				list = listOrArray.getItems();
			}
			for (var i in list) {
				this.put(list[i]);
			}
		};

		/**
		 * Verifies whether the given item is included
		 * in this list.
		 *
		 * @public
		 * @param {*} item Item that should be checked.
		 * @returns {boolean}
		 */
		AbstractList.prototype.contains = function(item) {
			if (item.constructor === this._type) {
				for (var index in this._items) {
					var theItem = this._items[index];
					if (theItem.equals(item)) {
						return true;
					}
				}
			}
			return false;
		};

		/**
		 * Compare the specified WidgetHandleList with this instance.
		 *
		 * @abstract
		 * @public
		 * @param {*} list List that should be compared.
		 */
		AbstractList.prototype.equals = function(list) {
			if (list.constructor === this.constructor && list.size() == this.size()) {
				for (var index in list.getItems()) {
					var theItem = list.getItems()[index];
					if (!this.contains(theItem)) return false;
				}
				return true;
			}
			return false;
		};

		/**
		 * Returns the item for the specified key.
		 *
		 * @param {string} key key that should be searched for
		 * @returns {*}
		 */
		AbstractList.prototype.getItem = function(key) {
			return this._items[key];
		};

		/**
		 * Removes the item from this list for the specified key.
		 *
		 * @public
		 * @param {string} key key that should be searched for
		 */
		AbstractList.prototype.removeItem = function(key) {
			if (this.containsKey(key)) {
				delete this._items[key];
			}
		};

		/**
		 * Returns the keys of all items.
		 *
		 * @public
		 * @returns {Array}
		 */
		AbstractList.prototype.getKeys = function() {
			var listKeys = [];
			for (var key in this._items) {
				listKeys.push(key);
			}
			return listKeys;
		};

		/**
		 * Returns all items.
		 *
		 * @virtual
		 * @public
		 * @returns {Array}
		 */
		AbstractList.prototype.getItems = function() {
			return this._items;
		};

		/**
		 * Returns the number of items that are included.
		 *
		 * @public
		 * @returns {Number}
		 */
		AbstractList.prototype.size = function() {
			return this._items.length;
		};

		/**
		 * Verifies whether the list is empty.
		 *
		 * @public
		 * @returns {boolean}
		 */
		AbstractList.prototype.isEmpty = function() {
			return this.size() == 0;
		};

		/**
		 * Clears this list.
		 *
		 * @public
		 */
		AbstractList.prototype.clear = function() {
			this._items = [];
		};

		return AbstractList;
	})();
});
/**
 * Created by tobias on 30.09.15.
 */
define('data',['data'],
    function(Data) {
        return (function() {

            /**
             *
             * @returns {Data}
             * @class Data
             */
            function Data() {


                return this;
            }

            return Data;
        })();
    }
);
/**
 * Created by tobias on 01.10.15.
 */
define('dataList',['abstractList', 'data'], function(AbstractList, Data) {
    return (function() {
        /**
         * This class represents a list for Data.
         *
         * @extends AbstractList
         * @class DataList
         * @returns DataList
         */
        function DataList() {
            AbstractList.call(this);
            this._type = Data;
            return this;
        }

        DataList.prototype = Object.create(AbstractList.prototype);
        DataList.prototype.constructor = DataList;

        return DataList;
    })();
});
define('parameter',[],function(){
	return (function() {
		/**
		 * Parameter specifies the Attributes to that these are associated.
		 *
		 * @class Parameter
		 */
		function Parameter() {
			/**
			 *
			 * @type {string}
			 * @private
			 */
			this._key = '';

			/**
			 *
			 * @type {string}
			 * @private
			 */
			this._dataType = '';

			/**
			 *
			 * @type {string}
			 * @private
			 */
			this._value = '';

			return this;
		}

		/**
		 * Builder for key.
		 *
		 * @public
		 * @param {String} key Key
		 * @returns {Parameter}
		 */
		Parameter.prototype.withKey = function(key){
			this.setKey(key);
			return this;
		};

		/**
		 * Builder for type.
		 *
		 * @param dataType
		 * @return {Parameter}
		 */
		Parameter.prototype.withDataType = function(dataType) {
			this.setDataType(dataType);
			return this;
		};

		/**
		 * Builder for value.
		 *
		 * @public
		 * @param {String} value Value
		 * @returns {Parameter}
		 */
		Parameter.prototype.withValue = function(value){
			this.setValue(value);
			return this;
		};

		/**
		 * Returns the key.
		 *
		 * @public
		 * @returns {string}
		 */
		Parameter.prototype.getKey = function() {
			return this._key;
		};

		/**
		 * Return the type.
		 *
		 * @returns {string}
		 */
		Parameter.prototype.getDataType = function() {
			return this._dataType;
		};

		/**
		 * Returns the value.
		 *
		 * @public
		 * @returns {string}
		 */
		Parameter.prototype.getValue = function(){
			return this._value;
		};

		/**
		 * Sets the key.
		 *
		 * @public
		 * @param {string} newKey Key
		 */
		Parameter.prototype.setKey = function(newKey){
			if(typeof newKey === 'string') this._key = newKey;
		};

		/**
		 * Sets the type.
		 *
		 * @param newDataType
		 */
		Parameter.prototype.setDataType = function(newDataType) {
			if(typeof newDataType === "string") this._dataType = newDataType;
		};

		/**
		 * Sets the value.
		 *
		 * @public
		 * @param {string} newValue Value
		 */
		Parameter.prototype.setValue = function(newValue){
			if(typeof newValue === 'string') this._value = newValue;
		};

		/**
		 * Compares this instance with the given one.
		 *
		 * @param {Parameter} parameter Parameter that should be compared.
		 * @returns {boolean}
		 */
		Parameter.prototype.equals = function(parameter) {
			if(parameter.constructor === Parameter){
				if (parameter.getValue() == "PV_INPUT" || this.getValue() == "PV_INPUT") {
					return this.getKey() == parameter.getKey() && this.getDataType() == parameter.getDataType();
				} else {
					return this.getKey() == parameter.getKey() && this.getDataType() == parameter.getDataType() && this.getValue() == parameter.getValue();
				}
			}
			return false;
		};

		/**
		 * Returns a description of the parameter.
		 * Format: [ParameterName:ParameterType:ParameterValue]
		 *
		 * @example [CP_UNIT:STRING:KILOMETERS]
		 */
		Parameter.prototype.toString = function() {
			return "["+this.getKey()+":"+this.getDataType()+":"+this.getValue()+"]";
		};

		return Parameter;
	})();
});
define('parameterList',['abstractList', 'parameter'], function(AbstractList, Parameter) {
	return (function() {
		/**
		 * This class represents a list for Parameter.
		 *
		 * @extends AbstractList
		 * @class ParameterList
		 */
		function ParameterList() {
			AbstractList.call(this);

			/**
			 * @type {Object}
			 * @private
			 */
			this._type = Parameter;

			return this;
		}

		ParameterList.prototype = Object.create(AbstractList.prototype);
		ParameterList.prototype.constructor = ParameterList;

		/**
		 * Returns the objects of the list as JSON objects.
		 *
		 * @returns {{}}
		 */
		ParameterList.prototype.getItemsAsJson = function() {
			var parameters = {};
			this._items.forEach(function(theParameter) {
				parameters[theParameter.getKey()] = theParameter.getValue();
			});
			return parameters;
		};

		/**
		 * Return true if the list contains a parameter that is set at runtime.
		 *
		 * @returns {boolean}
		 */
		ParameterList.prototype.hasInputParameter = function() {
			for (var index in this._items) {
				var theParameter = this._items[index];
				if (theParameter.getValue() == "PV_INPUT") return true;
			}
			return false;
		};

		return ParameterList;
	})();
});
define('contextInformation',['data', 'parameterList'], function(Data, ParameterList) {
    return (function() {

        ContextInformation.OPERATOR_EQUALS = "==";
        ContextInformation.OPERATOR_LESS_THAN = "<";
        ContextInformation.OPERATOR_GREATER_THAN = ">";

        /**
         *
         * @static
         * @constant
         * @type {string}
         */
        ContextInformation.VALUE_UNKNOWN = "CV_UNKNOWN";

        /**
         *
         * @static
         * @constant
         * @type {string}
         */
        ContextInformation.VALUE_ERROR = "CV_ERROR";

        /**
         * ContextInformation defines name, type (string, double,...) an associated parameter of a contextual information.
         *
         * @class ContextInformation
         * @extends Data
         */
        function ContextInformation(overrideBuilderDependency) {
            Data.call(this);

            // avoid inexpert meddling with contextual information construction
            if (typeof overrideBuilderDependency == 'undefined' || !overrideBuilderDependency)
                throw new Error("Contextual information must be created by the discoverer's buildContextInformation() method!");

            /**
             * Name of the ContextInformation.
             *
             * @type {String}
             * @private
             */
            this._name = '';

            /**
             * Defines the data type of the ContextInformation (i.e String, Double,...).
             *
             * @type {string}
             * @private
             */
            this._dataType = '';

            /**
             *
             * @type {ParameterList}
             * @private
             */
            this._parameterList = new ParameterList();

            /**
             *
             * @type {Array}
             * @private
             */
            this._synonymList = [];

            /**
             *
             * @type {*}
             * @private
             */
            this._value = ContextInformation.VALUE_UNKNOWN;

            /**
             * Time when the value was set.
             *
             * @type {Date}
             * @private
             */
            this._timestamp = new Date();

            return this;
        }

        ContextInformation.prototype = Object.create(Data.prototype);
        ContextInformation.prototype.constructor = ContextInformation;

        /**
         *
         * @constructs ContextInformation
         * @param discoverer
         * @param contextInformationDescription
         * @returns {ContextInformation}
         */
        ContextInformation.fromContextInformationDescription = function(discoverer, contextInformationDescription) {
            return discoverer.buildContextInformation(
                contextInformationDescription.name,
                contextInformationDescription.type,
                contextInformationDescription.parameterList,
                true);
        };

        /**
         * Builder for name.
         *
         * @param {String} name The contextual information name to build with.
         * @returns {ContextInformation}
         */
        ContextInformation.prototype.withName = function(name){
            this.setName(name);
            return this;
        };

        /**
         * Builder for type.
         *
         * @param {String} dataType The context information data type to build with.
         * @returns {ContextInformation}
         */
        ContextInformation.prototype.withDataType = function(dataType){
            this.setDataType(dataType);
            return this;
        };

        /**
         * Builder for one parameter.
         *
         * @param {Parameter} parameter The parameter to build with.
         * @returns {ContextInformation}
         */
        ContextInformation.prototype.withParameter = function(parameter){
            this.addParameter(parameter);
            return this;
        };

        /**
         * Builder for parameterList.
         *
         * @param {(ParameterList|Array)} parameterList ParameterList
         * @returns {ContextInformation}
         */
        ContextInformation.prototype.withParameters = function(parameterList){
            this.setParameters(parameterList);
            return this;
        };

        /**
         * Builder for value.
         *
         * @param {String} value value
         * @returns {ContextInformation}
         */
        ContextInformation.prototype.withValue = function(value) {
            this.setValue(value);
            this.setTimestamp(new Date());
            return this;
        };

        /**
         * Builder for timestamp.
         *
         * @param {Date} date The timestamp.
         * @returns {ContextInformation}
         */
        ContextInformation.prototype.withTimestamp = function(date) {
            this.setTimestamp(date);
            return this;
        };

        /**
         * Builder for synonyms from single translation.
         *
         * @param {ContextInformation} contextInformation
         * @returns {ContextInformation}
         */
        ContextInformation.prototype.withSynonym = function(contextInformation){
            this.addSynonym(contextInformation);
            return this;
        };

        /**
         * Builder for synonyms from (several) translations.
         *
         * @param contextInformation
         * @returns {ContextInformation}
         */
        ContextInformation.prototype.withSynonyms = function(contextInformation){
            this.setSynonyms(contextInformation);
            return this;
        };

        /**
         * Returns the name.
         *
         * @returns {string}
         */
        ContextInformation.prototype.getName = function(){
            return this._name;
        };

        /**
         * Returns the type.
         *
         * @returns {string}
         */
        ContextInformation.prototype.getDataType = function(){
            return this._dataType;
        };

        /**
         * Returns the parameters.
         *
         * @returns {ParameterList}
         */
        ContextInformation.prototype.getParameters = function(){
            return this._parameterList;
        };

        /**
         * Returns the synonym with the specified name if existent or itself, otherwise.
         *
         * @param {String} name
         * @returns {ContextInformation}
         */
        ContextInformation.prototype.getSynonymWithName = function(name) {
            var synonyms = this.getSynonyms();
            for (var index in synonyms) {
                if (synonyms.hasOwnProperty(index)) {
                    var synonym = this.getSynonyms()[index];
                    if (synonym.getName() == name) return synonym;
                }
            }
            return this;
        };

        /**
         * Returns the list of synonyms.
         *
         * @returns {Array}
         */
        ContextInformation.prototype.getSynonyms = function(){
            return this._synonymList;
        };

        /**
         * Sets the name.
         *
         * @param {string} name Name
         */
        ContextInformation.prototype.setName = function(name){
            if(typeof name === 'string'){
                this._name = name;
            }
        };

        /**
         * Sets the type.
         *
         * @param {string} type Type
         */
        ContextInformation.prototype.setDataType = function(type){
            if(typeof type === 'string'){
                this._dataType = type;
            }
        };

        /**
         * Adds a parameter.
         *
         * @param {Parameter} parameter Parameter
         */
        ContextInformation.prototype.addParameter = function(parameter){
            this._parameterList.put(parameter);
        };

        /**
         * Adds a synonym to synonymList.
         *
         * @param synonym
         */
        ContextInformation.prototype.addSynonym = function(synonym){
            if (synonym instanceof ContextInformation)
                this._synonymList.push(synonym);
        };

        /**
         * Adds a list of Parameter.
         *
         * @param {ParameterList} parameters ParameterList
         */
        ContextInformation.prototype.setParameters = function(parameters){
            this._parameterList.putAll(parameters);
        };

        /**
         * Adds a list of synonyms.
         *
         * @param synonyms
         */
        ContextInformation.prototype.setSynonyms = function(synonyms){
            for (var synIndex in synonyms) {
                this.addSynonym(synonyms[synIndex]);
            }
        };

        /**
         * Returns true if the context information is parametrized.
         *
         * @returns {boolean}
         */
        ContextInformation.prototype.hasParameters = function() {
            return this._parameterList.size() > 0;
        };

        /**
         * Returns true if the context information has synonyms.
         *
         * @returns {boolean}
         */
        ContextInformation.prototype.hasSynonyms = function() {
            return this._synonymList.length > 0;
        };

        /**
         * Returns true if the contextual information has the given contextual information in its synonymList.
         *
         * @param {ContextInformation} contextInformation
         * @returns {boolean}
         */
        ContextInformation.prototype.hasSynonym = function(contextInformation) {
            for (var i in this._synonymList)
                if (this._synonymList[i].isKindOf(contextInformation)) return true;
            return false;
        };

        /**
         * Sets the value.
         *
         * @param {*} value the value
         * @returns {ContextInformation}
         */
        ContextInformation.prototype.setValue = function(value) {
            this._value = value;
            return this;
        };

        /**
         * Returns the value.
         *
         * @returns {string}
         */
        ContextInformation.prototype.getValue = function() {
            return this._value;
        };

        /**
         * Sets the timestamp.
         *
         * @param {Date} time timestamp
         */
        ContextInformation.prototype.setTimestamp = function(time) {
            this._timestamp = time;
        };

        /**
         * Returns the timestamp.
         *
         * @returns {Number}
         */
        ContextInformation.prototype.getTimestamp = function() {
            return this._timestamp;
        };

        /**
         *
         * @returns {boolean}
         */
        ContextInformation.prototype.hasInputParameter = function() {
            return this.hasParameters() && this._parameterList.hasInputParameter();
        };

        /**
         * Compares two contextual information. Returns true if they or one of their synonyms are of the same kind
         * (i.e. same name, dataType, and parameters).
         *
         * @param {ContextInformation} contextInformation The contextual information that should be compared.
         * @returns {Boolean}
         */
        ContextInformation.prototype.isKindOf = function(contextInformation) {
            // name, type and parameters equivalent
            if(this._isKindOf(contextInformation)) return true;

            // check synonyms for equality
            var theseSynonyms = this.getSynonyms();

            if (contextInformation instanceof ContextInformation) {
                var thoseSynonyms = contextInformation.getSynonyms();
                for (var i in theseSynonyms) {
                    var thisSynonym = theseSynonyms[i];
                    if (contextInformation._isKindOf(thisSynonym)) {
                        return true;
                    }
                }
                for (var i in thoseSynonyms) {
                    var thatSynonym = thoseSynonyms[i];
                    if (this._isKindOf(thatSynonym)) {
                        return true;
                    }
                }
            }
            return false;
        };

        /**
         * Auxiliary function comparing only name, type and parameters (without synonyms)
         *
         * @param {ContextInformation} contextInformation
         * @returns {boolean}
         * @private
         */
        ContextInformation.prototype._isKindOf = function(contextInformation) {
            if (contextInformation instanceof ContextInformation) {
                if ((this.getName() == contextInformation.getName()
                    && this.getDataType() == contextInformation.getDataType()
                    && this.getParameters().equals(contextInformation.getParameters()))) {
                    return true;
                }
            }
            return false;
        };

        /**
         * Compares two contextual information. Returns true if they are exactly equal (i.e. same kind and value).
         *
         * @param {ContextInformation} contextInformation
         * @returns {Boolean}
         */
        ContextInformation.prototype.equals = function(contextInformation) {
            if (contextInformation instanceof ContextInformation) {
                if (this.isKindOf(contextInformation) && this.getValue() == contextInformation.getValue()) {
                    return true;
                }
            }
            return false;
        };

        /**
         * Returns an identifier that uniquely describes the contextual information and its parameters.
         * The identifier shall in no case be used to compare two contextual information (use isKindOf() and isEqualTo() instead). <br/>
         * Format: [ContextInformationName:ContextInformationDataType:ContextInformationValue]#[FirstParameterName:FirstParameterType:FirstParameterValue]…
         *
         * @returns {String}
         * @example [CI_USER_LOCATION_DISTANCE:FLOAT:24]#[CP_TARGET_LATITUDE:INTEGER:52][CP_TARGET_LONGITUDE:INTEGER:13][CP_UNIT:STRING:KILOMETERS]
         */
        ContextInformation.prototype.toString = function(typeOnly) {
            var identifier = "["+this.getName()+":"+this.getDataType();
            if (!typeOnly) identifier += ":"+this.getValue();
            identifier += "]";
            if (this.hasParameters()) {
                identifier += "#";
                for (var index in this.getParameters().getItems()) {
                    var theParameter = this.getParameters().getItems()[index];
                    identifier += theParameter.toString();
                }
            }
            return identifier;
        };

        /**
         *
         */
        ContextInformation.prototype.setValueUnknown = function() {
            this.setValue(ContextInformation.VALUE_UNKNOWN);
        };

        /**
         *
         */
        ContextInformation.prototype.setValueError = function() {
            this.setValue(ContextInformation.VALUE_ERROR);
        };

        /**
         *
         * @returns {boolean}
         */
        ContextInformation.prototype.isKnown = function() {
            return this.getValue() != ContextInformation.VALUE_UNKNOWN && this.getValue() != ContextInformation.VALUE_ERROR;
        };

        /**
         * Returns a JSON representation of the contextual information.
         *
         * @returns {{id: string, parameters: {}, value: string}}
         */
        ContextInformation.prototype.getJSONRepresentation = function() {
            return {
                id: this.getName(),
                parameters: this.getParameters().getItemsAsJson(),
                value: this.getValue()
            }
        };

        return ContextInformation;
    })();
});
define('contextInformationList',['dataList', 'contextInformation'], function(DataList, ContextInformation) {
    return (function() {
        /**
         * This class represents a list for ContextInformation.
         *
         * @extends DataList
         * @class ContextInformationList
         */
        function ContextInformationList() {
            DataList.call(this);
            this._type = ContextInformation;
            return this;
        }

        ContextInformationList.prototype = Object.create(DataList.prototype);
        ContextInformationList.prototype.constructor = ContextInformationList;

        /**
         * Create a ContextInformationList from the description provided by a Widget or Interpreter.
         *
         * @static
         * @param {Discoverer} discoverer
         * @param {Array} contextInformationDescriptions
         * @returns {ContextInformationList}
         */
        ContextInformationList.fromContextInformationDescriptions = function(discoverer, contextInformationDescriptions) {
            var theContextInformationList = new ContextInformationList();
            for(var contextInformationDescriptionIndex in contextInformationDescriptions) {
                theContextInformationList.put(ContextInformation.fromContextInformationDescription(discoverer, contextInformationDescriptions[contextInformationDescriptionIndex]));
            }
            return theContextInformationList;
        };

        /**
         * Creates a ContextInformationList from an array of context information names.
         *
         * @param {Discoverer} discoverer
         * @param {Array<String>} contextInformationNames
         * @returns {ContextInformationList}
         */
        ContextInformationList.fromContextInformationNames = function(discoverer, contextInformationNames) {
            var theContextInformationList = new ContextInformationList();
            var possibleContextInformation = discoverer.getPossibleContextInformation();

            for (var contextInformationNameIndex in contextInformationNames) {
                var theContextInformationName = contextInformationNames[contextInformationNameIndex];
                theContextInformationList.put(possibleContextInformation._getContextInformationWithName(theContextInformationName));
            }

            return theContextInformationList;
        };

        /**
         * Adds the specified item to the itemList.
         *
         * @public
         * @param {ContextInformation} contextInformation
         * @param {Boolean} [multipleInstances=false]
         */

        ContextInformationList.prototype.put = function(contextInformation, multipleInstances) {
            multipleInstances = typeof multipleInstances == "undefined" ? false : multipleInstances;
            if (contextInformation instanceof this._type) {
                if (multipleInstances || !(this.containsKindOf(contextInformation))) {
                    this._items.push(contextInformation);
                } else {
                    this.updateValue(contextInformation);
                }
            }
        };

        /**
         * Adds all items in the specified list to the itemList.
         *
         * @public
         * @param {(ContextInformationList|Array)} contextInformationList ContextInformationList
         */
        ContextInformationList.prototype.putAll = function(contextInformationList) {
            var list = [];
            if (contextInformationList instanceof Array) {
                list = contextInformationList;
            } else if (contextInformationList instanceof ContextInformationList) {
                list = contextInformationList.getItems();
            }
            for ( var i in list) {
                this.put(list[i]);
            }
        };

        /**
         *
         * @param contextInformation
         */
        ContextInformationList.prototype.putIfKindOfNotContained = function(contextInformation) {
            if (!this.containsKindOf(contextInformation)) this.put(contextInformation);
        };

        /**
         * Verifies whether the given item is included in the list.
         *
         * @param {ContextInformation} contextInformation Contextual information that should be verified.
         * @returns {boolean}
         */
        ContextInformationList.prototype.contains = function(contextInformation) {
            if (contextInformation instanceof ContextInformation) {
                for (var index in this.getItems()) {
                    var theContextInformation = this.getItems()[index];
                    if (theContextInformation.equals(contextInformation)) {
                        return true;
                    }
                }
            }
            return false;
        };

        /**
         * Verifies whether a contextual information of the given kind is included in this list.
         *
         * @param {ContextInformation} contextInformation Contextual information that should be verified.
         * @returns {Boolean}
         */
        ContextInformationList.prototype.containsKindOf = function(contextInformation) {
            if (contextInformation instanceof ContextInformation) {
                for (var index in this.getItems()) {
                    var theContextInformation = this.getItems()[index];
                    if (theContextInformation.isKindOf(contextInformation)) {
                        return true;
                    }
                }
            }
            return false;
        };

        /**
         * Compare the specified ContextInformationList with this instance.
         *
         * @param {ContextInformationList} contextInformationList ContextInformationList that should be compared.
         * @returns {boolean}
         */
        ContextInformationList.prototype.equals = function(contextInformationList) {
            if (contextInformationList instanceof ContextInformationList && contextInformationList.size() == this.size()) {
                for (var index in contextInformationList.getItems()) {
                    var theContextInformation = contextInformationList.getItems()[index];
                    if (!this.contains(theContextInformation)) return false;
                }
                return true;
            }
            return false;
        };

        /**
         * Compare the specified ContextInformationList with this instance.
         *
         * @param {ContextInformationList} contextInformationList ContextInformationList that should be compared.
         * @returns {boolean}
         */
        ContextInformationList.prototype.isKindOf = function(contextInformationList) {
            if (contextInformationList instanceof ContextInformationList  && contextInformationList.size() == this.size()) {
                for (var index in contextInformationList.getItems()) {
                    var theContextInformation = contextInformationList.getItems()[index];
                    if (!this.containsKindOf(theContextInformation)) return false;
                }
                return true;
            }
            return false;
        };

        /**
         *
         * @param {String} contextInformationName
         * @returns {?ContextInformation}
         * @private
         */
        ContextInformationList.prototype._getContextInformationWithName = function(contextInformationName) {
            for (var index in this._items) {
                var theContextInformation = this._items[index];
                if (theContextInformation.getName() == contextInformationName) return theContextInformation;
            }
            return null;
        };

        /**
         * Returns only this values that matches to the given type.
         *
         * @param {(ContextInformationList|Array)} contextInformationList Contextual information that should be returned.
         * @returns {ContextInformationList}
         */
        ContextInformationList.prototype.getSubset = function(contextInformationList) {
            var response = new ContextInformationList();
            var list = [];
            if (contextInformationList instanceof Array) {
                list = contextInformationList;
            } else if (contextInformationList instanceof ContextInformationList) {
                list = contextInformationList.getItems();
            }
            for (var i in list) {
                var theContextInformation = list[i];
                if (theContextInformation instanceof ContextInformation) {
                    var responseContextInformation = this.getContextInformationOfKind(theContextInformation);
                    if (typeof responseContextInformation != "undefined") {
                        response.put(responseContextInformation);
                    }
                }
            }
            return response;
        };

        /**
         * Returns a subset without the given types.
         *
         * @param {(ContextInformationList|Array)} contextInformationList Contextual information to be excluded
         * @returns {ContextInformationList}
         */
        ContextInformationList.prototype.getSubsetWithoutItems = function(contextInformationList) {
            var response = this;
            var list = [];
            if (contextInformationList instanceof Array) {
                list = contextInformationList;
            } else if (contextInformationList instanceof ContextInformationList) {
                list = contextInformationList.getItems();
            }
            for (var i in list) {
                var theContextInformation = list[i];
                if (theContextInformation instanceof ContextInformation) {
                    response.removeContextInformationOfKind(theContextInformation);
                }
            }
            return response;
        };

        /**
         * Creates a clone of the current list.
         *
         * @param {Boolean} kindOnly
         * @returns {ContextInformationList}
         */
        ContextInformationList.prototype.clone = function(kindOnly) {
            var newList = new ContextInformationList();
            for (var index in this._items) {
                var oldContextInformation = this._items[index];
                var newContextInformation = new ContextInformation(true)
                    .withName(oldContextInformation.getName())
                    .withDataType(oldContextInformation.getDataType())
                    .withParameters(oldContextInformation.getParameters())
                    .withSynonyms(oldContextInformation.getSynonyms());
                if (!kindOnly) newContextInformation.setValue(oldContextInformation.getValue());
                newList.put(newContextInformation);
            }
            return newList;
        };

        /**
         *
         * @param {ContextInformation} contextInformation
         * @param {Boolean} [allOccurrences]
         */
        ContextInformationList.prototype.removeContextInformationOfKind = function(contextInformation, allOccurrences) {
            allOccurrences = typeof allOccurrences == "undefined" ? false : allOccurrences;
            for (var index in this._items) {
                var theContextInformation = this._items[index];
                if (theContextInformation.isKindOf(contextInformation)) {
                    this._items.splice(index, 1);
                }
            }
            if (allOccurrences && this.contains(contextInformation)) this.removeContextInformationOfKind(contextInformation, allOccurrences);
        };

        /**
         *
         * @returns {boolean}
         */
        ContextInformationList.prototype.hasContextInformationWithInputParameters = function() {
            for (var index in this._items) {
                var theContextInformation = this._items[index];
                if (theContextInformation.hasInputParameter()) return true;
            }
            return false;
        };

        /**
         *
         * @returns {ContextInformationList}
         */
        ContextInformationList.prototype.getContextInformationWithInputParameters = function() {
            var list = new ContextInformationList();
            for (var index in this._items) {
                var theContextInformation = this._items[index];
                if (theContextInformation.hasInputParameter()) list.put(theContextInformation);
            }
            return list;
        };

        /**
         * Returns the value for contextual information that matches the kind of the provided contextual information.
         *
         * @param {ContextInformation} contextInformation
         * @returns {String}
         */
        ContextInformationList.prototype.getValueForContextInformationOfKind = function(contextInformation) {
            return this.getContextInformationOfKind(contextInformation).getValue();
        };

        /**
         *
         * @param {ContextInformation} contextInformation
         * @returns {ContextInformation}
         */
        ContextInformationList.prototype.getContextInformationOfKind = function(contextInformation) {
            for (var index in this.getItems()) {
                var theContextInformation = this.getItems()[index];
                if (theContextInformation.isKindOf(contextInformation)) return theContextInformation;
            }
        };

        /**
         *
         * @param {ContextInformation} contextInformation
         */
        ContextInformationList.prototype.updateValue = function(contextInformation) {
            for (var index in this._items) {
                var existingContextInformation = this._items[index];
                if (existingContextInformation.isKindOf(contextInformation)) this._items[index] = contextInformation;
            }
        };

        /**
         *
         * @param {ContextInformation} contextInformation
         * @returns {Array}
         */
        ContextInformationList.prototype.find = function(contextInformation) {
            var result = [];
            if (contextInformation instanceof ContextInformation) {
                this._items.forEach(function(theContextInformation) {
                    if (theContextInformation.isKindOf(contextInformation)) result.push(theContextInformation);
                });
            }
            return result;
        };

        /**
         *
         * @param {ContextInformation} contextInformation
         * @param operator
         * @param {*} value
         * @returns {boolean}
         */
        ContextInformationList.prototype.fulfils = function(contextInformation, operator, value) {
            var contextInformationOfKind = this.find(contextInformation);
            for (var index in contextInformationOfKind) {
                if (contextInformationOfKind.hasOwnProperty(index) && this._fulfils(contextInformationOfKind[index], operator, value)) return true;
            }
            return false;
        };

        /**
         *
         * @param {ContextInformation} contextInformation
         * @param operator
         * @param {*} value
         * @returns {boolean}
         * @private
         */
        ContextInformationList.prototype._fulfils = function(contextInformation, operator, value) {
            switch(operator) {
                case ContextInformation.OPERATOR_EQUALS:
                    return contextInformation.getValue() == value;
                    break;
                case ContextInformation.OPERATOR_LESS_THAN:
                    return contextInformation.getValue() < value;
                    break;
                case ContextInformation.OPERATOR_GREATER_THAN:
                    return contextInformation.getValue() > value;
                    break;
                default:
                    return false;
            }
        };

        return ContextInformationList;
    })();
});
define('retrievalResult',["contextInformationList"], function(ContextInformationList){
	return (function() {
		/**
		 * Contains the data that were retrieved from the database.
		 *
		 * @class RetrievalResult
		 */
		function RetrievalResult() {
			/**
			 * Name of the retrieved contextual information.
			 *
			 * @private
			 * @type {string}
			 */
			this._name = '';

			/**
			 * Time of the retrieval.
			 *
			 * @type {date}
			 * @private
			 */
			this._timestamp = '';

			/**
			 * Retrieved contextual information.
			 *
			 * @type {ContextInformationList}
			 * @private
			 */
			this._values = new ContextInformationList();

			return this;
		}

		/**
		 * Builder for name.
		 *
		 * @param {String} name name
		 * @returns {RetrievalResult}
		 */
		RetrievalResult.prototype.withName = function(name){
			this.setName(name);
			return this;
		};

		/**
		 * Builder for timestamp.
		 *
		 * @param {String} timestamp timestamp
		 * @returns {RetrievalResult}
		 */
		RetrievalResult.prototype.withTimestamp = function(timestamp){
			this.setTimestamp(timestamp);
			return this;
		};

		/**
		 * Builder for values.
		 *
		 * @param {Array} values values
		 * @returns {RetrievalResult}
		 */
		RetrievalResult.prototype.withValues = function(values){
			this.setValues(values);
			return this;
		};

		/**
		 * Returns the contextual information name.
		 *
		 * @returns {string}
		 */
		RetrievalResult.prototype.getName = function(){
			return this._name;
		};

		/**
		 * Returns the retrieval time.
		 *
		 * @returns {date}
		 */
		RetrievalResult.prototype.getTimestamp = function(){
			return this._timestamp;
		};

		/**
		 * Returns the retrieved contextual information.
		 *
		 * @returns {ContextInformationList}
		 */
		RetrievalResult.prototype.getValues = function(){
			return this._values;
		};

		/**
		 * Sets the contextual information name.
		 *
		 * @param {string} name Name of the retrieved contextual information.
		 */
		RetrievalResult.prototype.setName = function(name){
			if(typeof name === 'string'){
				this._name = name;
			}
		};

		/**
		 * Sets the retrieval time.
		 *
		 * @param {date} timestamp Retrieval time.
		 */
		RetrievalResult.prototype.setTimestamp = function(timestamp){
			if(timestamp instanceof Date){
				this._type = timestamp;
			}
		};

		/**
		 * Sets the retrieved values.
		 *
		 * @param {Array} values Retrieved contextual information.
		 */
		RetrievalResult.prototype.setValues = function(values){
			if(values instanceof Array){
				this._values = values;
			}
		};

		return RetrievalResult;
	})();
});
define('storage',['contextInformation', 'contextInformationList', 'retrievalResult', 'parameter', 'parameterList'],
 	function(ContextInformation, ContextInformationList, RetrievalResult, Parameter, ParameterList){
		return (function() {
			/**
			 * Initializes the database and all return values.
			 *
			 * @classdesc Storage handles the access to the database.
			 * @param {String} name
			 * @param {Number} time
			 * @param {Number} counter
			 * @param {Aggregator} aggregator
			 * @returns {Storage}
			 * @constructs Storage
			 */
			function Storage(name, time, counter, aggregator) {
				/**
				 * @type {Aggregator}
				 */
				this._parent = aggregator;

				/**
				 * Names of all stored contextual information (tableNames as string).
				 *
				 * @type {Array}
				 * @private
				 */
				this._contextInformationNames = [];

				/**
				 * Data of a retrieval.
				 *
				 * @type {RetrievalResult}
				 * @private
				 */
				this._contextInformation = new RetrievalResult();

				/**
				 * Cache before storing the new data in the database.
				 *
				 * @type {ContextInformationList}
				 * @private
				 */
				this._data = new ContextInformationList();

				/**
				 * Names of all stored contextual information.
				 *
				 * @type {Number}
				 * @private
				 */
				this._dataCount = 0;

				/**
				 * Time of the last flush.
				 *
				 * @type {Date}
				 * @private
				 */
				this._lastFlush = new Date();

				/**
				 * Condition (ms) at which point of time data are supposed to be flushed.
				 * If the value is more than the value of 'timeCondition' ago, data should be
				 * flushed again. The initial value is two hours.
				 *
				 * @type {Number}
				 * @private
				 */
				this._timeCondition = 7200000;

				/**
				 * Condition at which point of time data are supposed to be flushed.
				 * If at least 'countCondition' contextual information are collected data will be flushed.
				 * Initial value is 5.
				 *
				 * @type {Number}
				 * @private
				 */
				this._countCondition = 5;

				/**
				 * Associated database.
				 *
				 * @type {Database}
				 * @private
				 */
				this._storage = '';

				this._initStorage(name);
				if(time && time === parseInt(time) && time != 0) this._timeCondition = time;
				if(counter && counter === parseInt(counter) && counter != 0) this._countCondition = counter;

				return this;
			}

			/**
			 * Returns the last retrieved contextual information.
			 *
			 * @returns {RetrievalResult}
			 */
			Storage.prototype.getCurrentData = function() {
				return this._contextInformation;
			};

			/**
			 * Returns the names of all stored contextual information (tableNames as string).
			 *
			 * @returns {Array}
			 */
			Storage.prototype.getContextInformationOverview = function() {
				return this._contextInformationNames;
			};

			/**
			 * Initializes a new database.
			 *
			 * @private
			 * @param {String} name Name of the database.
			 */
			Storage.prototype._initStorage = function(name){
				if(!window.openDatabase) {
					this._parent.log('Databases are not supported in this browser.');
				}else{
					this._storage = window.openDatabase(name, "1.0", "DB_" + name, 1024*1024);
					this._parent.log('I will initialize storage with name '+name+".");
				}
			};

			/**
			 * Creates a new table. A table contains the values of one contextual information.
			 * So the name is the contextual information name.
			 *
			 * @private
			 * @param {ContextInformation} contextInformation tableName (should be the contextual information name)
			 * @param {?function} callback For alternative actions, if an asynchronous function is used.
			 */
			Storage.prototype._createTable = function(contextInformation, callback){
				if(this._storage){
					var tableName = this._tableName(contextInformation);
					var statement = 'CREATE TABLE IF NOT EXISTS "' + tableName + '" (value_, type_, created_)';
					this._parent.log('CREATE TABLE IF NOT EXISTS "' + tableName + '"');
					if(callback && typeof(callback) == 'function'){
						this._storage.transaction(function(tx){tx.executeSql(statement);}, this._errorCB, callback);
					} else {
						this._storage.transaction(function(tx){tx.executeSql(statement);}, this._errorCB, this._successCB);
					}
					if(!this._contextInformationNames.indexOf(contextInformation.getName()) > -1){
						this._contextInformationNames.push(tableName);
					}
				}
			};

			/**
			 * Inserts value into a table. The name of the given contextual information.
			 * identifies the table.
			 *
			 * @private
			 * @param {ContextInformation} contextInformation The contextual information that should be stored.
			 * @param {?function} callback For alternative actions, if an asynchronous function is used.
			 */
			Storage.prototype._insertIntoTable = function(contextInformation, callback){
				if(this._storage && contextInformation && contextInformation instanceof ContextInformation){
					var tableName = this._tableName(contextInformation);
					var statement = 'INSERT INTO "' + tableName
						+ '" (value_, type_, created_) VALUES ("'
						+ contextInformation.getValue() + '", "'
						+ contextInformation.getDataType() + '", "'
						+ contextInformation.getTimestamp() + '")';
					this._parent.log('INSERT INTO "'+tableName+'" VALUES ('+contextInformation.getValue()+", "+contextInformation.getDataType()+", "+contextInformation.getTimestamp());
					if(callback && typeof(callback) == 'function'){
						this._storage.transaction(function(tx){tx.executeSql(statement);}, this._errorCB, callback);
					} else {
						this._storage.transaction(function(tx){tx.executeSql(statement);}, this._errorCB, this._successCB);
					}
				}
			};

			/**
			 * error function
			 *
			 * @callback
			 * @private
			 */
			Storage.prototype._errorCB = function(err) {
				console.log("Error processing SQL: "+err.message);
			};

			/**
			 * success function
			 *
			 * @callback
			 * @private
			 */
			Storage.prototype._successCB = function() {
				console.log("SQL processed successfully!");
			};


			/**
			 * Returns the contextual information names array.
			 *
			 * @param {?function} [callback] For alternative actions, if an asynchronous function is used.
			 */
			Storage.prototype.getContextInformationNames = function(callback){
				if(this._storage){
					var self = this;
					this._storage.transaction(function(tx) {
							self._queryTables(tx, self, callback);
						}, function(error) {
							self._errorCB(error);
						}
					);
				}
			};

			/**
			 *
			 * @callback
			 * @private
			 * @param {*} tx
			 * @param {Storage} self
			 * @param {?function} callback For alternative actions, if an asynchronous function is used.
			 */
			Storage.prototype._queryTables = function(tx, self, callback){
				var statement = "SELECT * from sqlite_master WHERE type = 'table'";
				tx.executeSql(statement, [], function(tx,results) {
						self._queryTableSuccess(tx, results, self, callback);
					}, function(error) {
						self._errorCB(error);
				});
			};

			/**
			 * Success function for queryTable.
			 *
			 * @callback
			 * @private
			 * @param {*} tx
			 * @param {*} results
			 * @param {Storage} self
			 * @param {?function} callback
			 */
			Storage.prototype._queryTableSuccess = function(tx, results, self, callback){
				self._contextInformationNames = [];
				var len = results.rows.length;
				for(var i=0; i<len; i++){
					var table = results.rows.item(i).name;
					if(table.indexOf("DatabaseInfoTable") == -1){
						self._contextInformationNames.push(results.rows.item(i).name);
					}

				}
				if(callback && typeof(callback) == 'function'){
					callback();
				}
			};

			/**
			 * Verifies if a table for an contextual information exists.
			 *
			 * @private
			 * @param {(ContextInformation|String)} contextInformationOrName The contextual information or its name for the verification.
			 * @returns {boolean}
			 */
			Storage.prototype._tableExists = function(contextInformationOrName){
				if(contextInformationOrName instanceof ContextInformation){
					var name = this._tableName(contextInformationOrName);
					return this._contextInformationNames.indexOf(name) > -1;
				} else if(typeof contextInformationOrName === 'string'){
					return this._contextInformationNames.indexOf(contextInformationOrName) > -1;
				}
				return false;
			};

			/**
			 * Retrieves a table and sets the RetrievalResult.
			 *
			 * @param {String} tableName Name for the table that should be retrieved.
			 * @param {?function} callback For additional actions, if an asynchronous function is used.
			 */
			Storage.prototype.retrieveContextInformation = function(tableName, callback){
				console.log("retrieve contextual information from "+tableName);

				if(this._storage){
					var self = this;
					self._flushStorage();
					this._storage.transaction(function(tx) {
						self._queryValues(tx, tableName, self, callback);
					}, function(error) {
						self._errorCB(error);
					});
				}
			};

			/**
			 * Query function for given contextual information.
			 *
			 * @callback
			 * @private
			 * @param {*} tx
			 * @param {String} tableName Name for the table that should be retrieved.
			 * @param {Storage} self
			 * @param {?function} callback For additional actions, if an asynchronous function is used.
			 */
			Storage.prototype._queryValues = function(tx, tableName, self, callback){
				if(self._tableExists(tableName)){
					this._parent.log('SELECT * FROM "' +tableName+"'");
					var statement = 'SELECT * FROM "' + tableName+'"';
					tx.executeSql(statement, [],
						function(tx, results) {
							self._queryValuesSuccess(tx, results, tableName, self, callback);
						}, function(error) {
							self._errorCB(error);
						});
				} else {
					this._parent.log('Table "'+tableName+'" unavailable');
				}
			};

			/**
			 * Success function for retrieveContextInformation().
			 * Puts the retrieved data in RetrievalResult object.
			 *
			 * @callback
			 * @private
			 * @param {*} tx
			 * @param {*} results
			 * @param {String} tableName Name of the searched contextual information.
			 * @param self
			 * @param {?function} callback For additional actions, if an asynchronous function is used.
			 */
			Storage.prototype._queryValuesSuccess = function(tx, results, tableName, self, callback){
				var len = results.rows.length;
				var contextInformationList = [];
				var contextInformationName = this._resolveContextInformationName(tableName);
				var parameterList = this._resolveParameters(tableName);
				for(var i=0; i<len; i++){
					var contextInformation = new ContextInformation(true).
						withName(contextInformationName).withValue(results.rows.item(i).value_).
						withDataType(results.rows.item(i).type_).
						withTimestamp(results.rows.item(i).created_).
						withParameters(parameterList);
					contextInformationList.push(contextInformation);
				}
				self._contextInformation = new RetrievalResult().withName(tableName)
					.withTimestamp(new Date())
					.withValues(contextInformationList);
				if(callback && typeof(callback) == 'function'){
					callback();
				}
			};

			/**
			 * Stores the given contextual information.
			 * If the flush condition does not match,
			 * the data is first added to the local cache before.
			 *
			 * @public
			 * @param {ContextInformation} contextInformation Value that should be stored.
			 */
			Storage.prototype.store = function(contextInformation) {
				this._addData(contextInformation);
				if(this._checkFlushCondition){
					this._flushStorage();
					this._resetForFlush();
				}
			};

			/**
			 * Adds data to the local cache.
			 * The cache is used to decrease the database access.
			 *
			 * @private
			 * @param {ContextInformation} contextInformation Value that should be stored.
			 */
			Storage.prototype._addData = function(contextInformation){
				if(contextInformation instanceof ContextInformation){
					this._data.put(contextInformation);
					this._dataCount++;
				}
			};

			/**
			 * Verifies the flush conditions.
			 *
			 * @private
			 * @returns {boolean}
			 */
			Storage.prototype._checkFlushCondition = function(){
				if(this._dataCount > this._countCondition){
					return true;
				}
				var currentDate = new Date();
				if((currentDate.getTime() - this._lastFlush.getTime()) < this._timeCondition ){
					return true;
				} //2 stunden??
				return false;
			};

			/**
			 * Clears the local cache.
			 *
			 * @private
			 */
			Storage.prototype._resetForFlush = function(){
				this._data = new ContextInformationList();
				this._dataCount = 0;
				this._lastFlush = new Date();
			};

			/**
			 * Stores all data from the local cache to the database.
			 *
			 * @private
			 */
			Storage.prototype._flushStorage = function(){
				var self = this;
				if(self._data.size() == 0){
					return;
				}
				for(var i in self._data.getItems()){
					var item = self._data.getItems()[i];
					if(!self._tableExists(item)){
						self._createTable(item, function() {
							self._insertIntoTable(item);
						});
					} else {
						self._insertIntoTable(item);
					}
				}
			};

			/**
			 * Sets the time condition for flush.
			 *
			 * @param {Number} time time in ms
			 */
			Storage.prototype.setTimeCondition = function(time){
				this._timeCondition = time;
			};

			/**
			 * Sets the counter for flush.
			 *
			 * @param {Number} _counter counter
			 */
			Storage.prototype.setCountCondition = function(_counter){
				this._countCondition = _counter;
			};

			/**
			 * Returns the current time condition for flush.
			 *
			 * @returns {Number}
			 */
			Storage.prototype.getTimeCondition = function(){
				return this._timeCondition;
			};

			/**
			 *  Returns the current count condition for flush.
			 *
			 * @returns {Number}
			 */
			Storage.prototype.getCountCondition = function(){
				return this._countCondition;
			};

			/****************************
			 * 			Helper			*
			 ****************************/
			/**
			 * Builds the tableName for the given contextual information.
			 *
			 * @private
			 * @param {ContextInformation} contextInformation The contextual information that should be stored.
			 * @returns{String}
			 */
			Storage.prototype._tableName = function(contextInformation){
				return contextInformation.toString(true);
			};

			/**
			 * Extracts the contextual information name from the table name.
			 *
			 * @private
			 * @param {String} tableName Table name that should be resolved.
			 * @returns{String}
			 */
			Storage.prototype._resolveContextInformationName = function(tableName){
				var resolvedTableName = tableName.split('__');
				return resolvedTableName[0];
			};

			/** Extracts the parameters form the table name.
			 *
			 * @private
			 * @param {String} _tableName Table name that should be resolved.
			 * @returns{String}
			 */
			Storage.prototype._resolveParameters = function(_tableName){
				var resolvedTableName = _tableName.split('__');

				var parameterList = new ParameterList();
				for(var i = 1; i < resolvedTableName.length; i++ ){
					var resolvedParameter =  resolvedTableName[i].split('_');
					var parameter= new Parameter().withKey(resolvedParameter[0]).withValue(resolvedParameter[1]);
					parameterList.put(parameter);
				}
				return parameterList;
			};

			return Storage;
		})();
	}
);
/**
 * Created by tobias on 30.03.15.
 */
define('component',['data', 'dataList'],
    function(Data, DataList) {
        return (function() {

            Component.lastLogId = "";

            Component.description = {
                out: [
                    {
                        "name":"",
                        "type":""
                    }
                ],
                requiredObjects: []
            };

            /**
            *
            * @returns {Component}
            * @class Component
            */
            function Component(discoverer) {
                /**
                 * the name of the component.
                 *
                 * @type {string}
                 * @private
                 */
                this._name = 'Component';

                /**
                 * The uuid of the object.
                 *
                 * @type {string}
                 * @private
                 */
                this._id  = Math.uuid();

                /**
                 * All available contextual information and their values.
                 *
                 * @type {DataList}
                 * @protected
                 */
                this._outputData = new DataList();

                /**
                 * Associated discoverer.
                 *
                 * @type {Discoverer}
                 * @private
                 */
                this._discoverer = discoverer;

                return this;
            }

            /**
            * Returns the name of the object.
            *
            * @returns {string}
            */
            Component.prototype.getName = function() {
               return this._name;
            };

            /**
            * Sets the name of the component if it wasn't set before.
            *
            * @param {string} name Name of the component.
            */
            Component.prototype.setName = function(name) {
               if (typeof this._name == "undefined" && typeof name === 'string') {
                   this._name = name;
               }
            };

            /**
            * Returns the id of the object.
            *
            * @returns {string}
            */
            Component.prototype.getId = function() {
               return this._id;
            };

            /**
             * Returns the available contextual information.
             *
             * @param {?DataList} [dataList]
             * @returns {DataList}
             */
            Component.prototype.getOutputData = function(dataList) {
                // test if contextual information is a list
                if (dataList && dataList instanceof DataList) {
                    return this._outputData.getSubset(dataList);
                } else {
                    return this._outputData;
                }
            };

            /**
             * Sets the output data.
             *
             * @param {DataList} dataList The data to be set.
             * @protected
             */
            Component.prototype._setOutputData = function(dataList) {
                this._outputData = dataList;
            };

            /**
             *
             * @param data
             * @param multipleInstances
             */
            Component.prototype.addOutputData = function(data, multipleInstances) {
                this.log("will add or update "+data+".");
                multipleInstances = typeof multipleInstances == "undefined" ? false : multipleInstances;
                data.setTimestamp(this.getCurrentTime());
                if (data instanceof Data) {
                    this._outputData.put(data, multipleInstances);
                }
            };

            /**
             * Verifies whether the specified data is provided by the component.
             *
             * @param {Data} data
             * @returns {Boolean}
             * @protected
             */
            Component.prototype._isOutputData = function(data) {
                return !!this._outputData.containsKindOf(data);
            };

            /**
             * Sets and registers to the associated Discoverer.
             *
             * @param {Discoverer} _discoverer Discoverer
             */
            Component.prototype.setDiscoverer = function(_discoverer) {
                if (!this._discoverer) {
                    this._discoverer = _discoverer;
                    this._register();
                }
            };

            /**
             * Registers the component to the associated Discoverer.
             *
             * @protected
             */
            Component.prototype._register = function() {
                if (this._discoverer) {
                    this._discoverer.registerNewComponent(this);
                }
            };

            /**
             * Create a log message.
             *
             * @param {string} string
             */
            Component.prototype.log = function(string) {
               if (Component.lastLogId != this.getId())
                   console.log(this.getName()+" ("+this.getId()+") "+string);
               else
                   console.log(this.getName()+" (...) "+string);
               Component.lastLogId = this.getId();
            };

            /**
             *
             * @param {Data} data
             * @returns {boolean}
             */
            Component.prototype.doesSatisfyKindOf = function(data) {
                return this._outputData.containsKindOf(data);
            };

            /*** Helper ***/

            /**
             * Returns the current time.
             *
             * @returns {Date}
             */
            Component.prototype.getCurrentTime = function() {
                return new Date();
            };

            return Component;
        })();
    }
);
/**
 * This module represents a Callback.
 * Callbacks define events for sending data to subscribers
 * 
 * @module Subscriber
 */
define('callback',['contextInformation', 'contextInformationList'], function(ContextInformation, ContextInformationList){
	return (function() {
		/**
		 * Constructor: Initializes the AttributeTypeList.
		 *
		 * @classdesc Callbacks defines events for sending data to subscribers. The data to be sent, are specified in the attributeTypeList.
		 * @returns {Callback}
		 * @constructs Callback
		 */
		function Callback() {
			/**
			 * Name of the Callback (i.e. Update).
			 * @type {string}
			 * @private
			 */
			this._name = '';

			/**
			 * Associated contextual information that will be send to the subscriber.
			 *
			 * @type {ContextInformationList}
			 * @private
			 */
			this._contextInformation = new ContextInformationList();

			return this;
		}

		/**
		 * Builder for name.
		 *
		 * @param {String} _name Name
		 * @returns {Callback}
		 */
		Callback.prototype.withName = function(_name) {
			this.setName(_name);
			return this;
		};

		/**
		 * Builder for AttributeTypes.
		 *
		 * @param {(ContextInformationList|Array.<ContextInformation>)} contextInformationListOrArray
		 * @returns {Callback}
		 */
		Callback.prototype.withContextInformation = function(contextInformationListOrArray) {
			this.setContextInformation(contextInformationListOrArray);
			return this;
		};

		/**
		 * Returns the name.
		 *
		 * @returns {string}
		 */
		Callback.prototype.getName = function() {
			return this._name;
		};

		/**
		 * Sets the name.
		 *
		 * @param {string} name Name
		 */
		Callback.prototype.setName = function(name) {
			if (typeof name === 'string') {
				this._name = name;
			}
		};

		/**
		 * Returns the associated contextual information.
		 *
		 * @returns {ContextInformationList}
		 */
		Callback.prototype.getContextInformation = function() {
			return this._contextInformation;
		};

		/**
		 * Adds a list of contextual information.
		 *
		 * @param {ContextInformationList|Array.<ContextInformation>} contextInformationListOrArray
		 */
		Callback.prototype.setContextInformation = function(contextInformationListOrArray){
			var list = [];
			if(contextInformationListOrArray instanceof Array){
				list = contextInformationListOrArray;
			} else if (contextInformationListOrArray instanceof ContextInformationList) {
				list = contextInformationListOrArray.getItems();
			}
			for(var i in list){
				this.addContextInformation(list[i]);
			}
		};

		/**
		 * Adds a contextual information to ContextInformationList.
		 *
		 * @param {ContextInformation} contextInformation
		 */
		Callback.prototype.addContextInformation = function(contextInformation){
			if(contextInformation instanceof ContextInformation && !this._contextInformation.containsKindOf(contextInformation)){
				this._contextInformation.put(contextInformation);
			}
		};

		/**
		 * Removes a contextual information from the ContextInformationList.
		 *
		 * @param {ContextInformation} contextInformation
		 */
		Callback.prototype.removeAttributeType = function(contextInformation){
			if(contextInformation instanceof ContextInformation){
				this._contextInformation.removeItem(contextInformation);
			}
		};

		/**
		 * Compares this instance with the given one.
		 *
		 * @param {Callback} _callback Callback that should be compared
		 * @returns {boolean}
		 */
		Callback.prototype.equals = function(_callback) {
			if (_callback.constructor === Callback){
				if(_callback.getName() == this.getName()
					&& _callback.getContextInformation().equals(this.getContextInformation())) {
					return true;
				}
			}
			return false;
		};

		return Callback;
	})();
});
/**
 * This module represents an CallbackList. It is a subclass of AbstractList.
 * 
 * @module CallbackList
 */
define('callbackList',['abstractList', 'callback'], function(AbstractList, Callback){
 	return (function() {
		/**
		 * @classdesc This class represents a list for Callback.
		 * @extends AbstractList
		 * @constructs CallbackList
		 */
		function CallbackList() {
			AbstractList.call(this);

			this._type = Callback;

			return this;
		}

		CallbackList.prototype = Object.create(AbstractList.prototype);
		CallbackList.prototype.constructor = CallbackList;

		/**
		 * Builder for item list.
		 *
		 * @public
		 * @param {(CallbackList|Array)} callbackListOrArray CallbackList
		 * @returns {CallbackList}
		 */
		CallbackList.prototype.withItems = function(callbackListOrArray){
			if (callbackListOrArray instanceof Array) {
				this._items = callbackListOrArray;
			} else if (callbackListOrArray.constructor === CallbackList) {
				this._items = callbackListOrArray.getItems();
			}
			return this;
		};

		/**
		 * Adds the specified item to the itemList.
		 *
		 * @public
		 * @param {Callback} callback Callback
		 */
		CallbackList.prototype.put = function(callback){
			if (callback.constructor === Callback) {
				if (!(this.contains(callback))) {
					this._items.push(callback);
				}
			}
		};

		/**
		 * Adds all items in the specified list to this itemList
		 *
		 * @public
		 * @param {(CallbackList|Array)} callbackListOrArray CallbackList
		 */
		CallbackList.prototype.putAll = function(callbackListOrArray){
			var list = [];
			if (callbackListOrArray instanceof Array) {
				list = callbackListOrArray;
			} else if (callbackListOrArray.constructor === CallbackList) {
				list = callbackListOrArray.getItems();
			}
			for (var i in list) {
				this.put(list[i]);
			}
		};

		/**
		 * Verifies whether the given item is included in this list.
		 *
		 * @public
		 * @param {Callback} callback CallbackType that should be verified.
		 * @returns {boolean}
		 */
		CallbackList.prototype.contains = function(callback){
			if (callback instanceof Callback) {
				for (var index in this._items) {
					var tmp = this._items[index];
					if (tmp.equals(callback)) {
						return true;
					}
				}
			}
			return false;
		};

		/**
		 * Compare the specified CallbackList with this instance.
		 * @public
		 * @alias equals
		 * @memberof CallbackList#
		 * @param {CallbackList} callbackList CallbackList that should be compared.
		 * @returns {boolean}
		 */
		CallbackList.prototype.equals = function(callbackList){
			if (callbackList.constructor === CallbackList && callbackList.size() == this.size()) {
				for (var index in callbackList.getItems()) {
					var theCallback = callbackList.getItems()[index];
					if (!this.contains(theCallback)) return false;
				}
				return true;
			}
			return false;
		};

		return CallbackList;
	})();
});
define('conditionMethod',[],function() {
	return (function() {
		/**
		 * @interface
		 * @classdesc This interface defines the interface for conditionMethod.
		 * @constructs ConditionMethod
		 */
		function ConditionMethod() {

			return this;
		}

		/**
		 * Processes the method.
		 *
		 * @abstract
		 * @param {*} reference Comparison value, if one is required.
		 * @param {*} firstValue Value (from an attribute) that should be compared.
		 * @param {*} secondValue Value (from an attribute) for comparison, if one is required.
		 */
		ConditionMethod.prototype.process = function(reference, firstValue, secondValue) {
			new Error("Abstract function call!");
		};

		return ConditionMethod;
	})();
});
define('condition',['contextInformation', 'conditionMethod'],
 	function(ContextInformation, ConditionMethod){
		return (function() {
			/**
			 * @classdesc Condition for subscribed Attributes.
			 * @constructs Condition
			 */
			function Condition() {
				/**
				 * Name of the Condition.
				 *
				 * @type {string}
				 * @private
				 */
				this._name = '';
				/**
				 * ContextInformation that should be checked.
				 *
				 * @type {ContextInformation}
				 * @private
				 */
				this._contextInformation = '';

				/**
				 * Method for comparison.
				 *
				 * @type {ConditionMethod}
				 * @private
				 */
				this._comparisonMethod =  '';

				/**
				 * Comparison value.
				 *
				 * @type {*}
				 * @private
				 */
				this._referenceValue = '';

				return this;
			}

			/**
			 * Builder for name.
			 *
			 * @param {String} name Name
			 * @returns {Condition}
			 */
			Condition.prototype.withName = function(name){
				this.setName(name);
				return this;
			};

			/**
			 * Builder for ContextInformation.
			 *
			 * @param {ContextInformation} contextInformation Contextual information that should be verified.
			 * @returns {Condition}
			 */
			Condition.prototype.withContextInformation = function(contextInformation){
				this.setContextInformation(contextInformation);
				return this;
			};

			/**
			 * Builder for comparison method.
			 *
			 * @param {ConditionMethod} comparisonMethod method for comparison
			 * @returns {Condition}
			 */
			Condition.prototype.withComparisonMethod = function(comparisonMethod){
				this.setComparisonMethod(comparisonMethod);
				return this;
			};

			/**
			 * Builder for comparison value.
			 *
			 * @param {String} referenceValue comparisonValue
			 * @returns {Condition}
			 */
			Condition.prototype.withReferenceValue = function(referenceValue){
				this.setReferenceValue(referenceValue);
				return this;
			};

			/**
			 * Sets the name.
			 *
			 * @param {string} name Name
			 */
			Condition.prototype.setName = function(name) {
				if(typeof name === 'string'){
					this._name = name;
				}
			};

			/**
			 * Sets the ContextInformation.
			 *
			 * @param {ContextInformation} contextInformation
			 */
			Condition.prototype.setContextInformation = function(contextInformation){
				if(contextInformation instanceof ContextInformation){
					this._contextInformation= contextInformation;
				}
			};

			/**
			 * Sets the ComparisonMethod.
			 *
			 * @param {ConditionMethod} comparisonMethod comparison Method
			 */
			Condition.prototype.setComparisonMethod = function(comparisonMethod){
				if(comparisonMethod.constructor === ConditionMethod){
					this._comparisonMethod = comparisonMethod;
				}
			};

			/**
			 * Sets the referenceValue.
			 *
			 * @param {*} referenceValue comparison value
			 */
			Condition.prototype.setReferenceValue = function(referenceValue){
				this._referenceValue = referenceValue;
			};

			/**
			 * Returns the name.
			 *
			 * @returns {string}
			 */
			Condition.prototype.getName = function(){
				return this._name;
			};

			/**
			 * Returns the ContextInformation.
			 *
			 * @returns {ContextInformation}
			 */
			Condition.prototype.getContextInformation = function(){
				return this._contextInformation;
			};

			/**
			 * Returns the comparison method.
			 *
			 * @returns {ConditionMethod}
			 */
			Condition.prototype.getComparisonMethod = function(){
				return this._comparisonMethod;
			};

			/**
			 * Returns the comparison value.
			 *
			 * @returns {*}
			 */
			Condition.prototype.getReferenceValue = function(){
				return this._referenceValue;
			};

			/**
			 * Processes the comparison.
			 *
			 * @param {ContextInformation} newContextInformation New contextual information that should be compared.
			 * @param {ContextInformation} oldContextInformation Old context information.
			 * @returns {boolean}
			 */
			Condition.prototype.compare = function(newContextInformation, oldContextInformation){
				if(!this.getContextInformation().isKindOf(newContextInformation) && !this.getContextInformation().isKindOf(oldContextInformation)){
					return false;
				}
				if(!this.getComparisonMethod()){
					return false;
				}
				if(newContextInformation instanceof ContextInformation && oldContextInformation instanceof  ContextInformation){
					return this.getComparisonMethod().process(this.getReferenceValue(), newContextInformation.getValue(), oldContextInformation.getValue());
				}
				return false;
			};

			/**
			 * Compares this instance with the given one.
			 *
			 * @param {Condition} condition Condition that should be compared
			 * @returns {boolean}
			 */
			Condition.prototype.equals = function(condition) {
				if(condition.constructor === Condition){
					if(condition.getName() == this.getName()
						&& condition.getReferenceValue() == this.getReferenceValue()
						&& condition.getContextInformation().isKindOf(this.getContextInformation())
						&& condition.getComparisonMethod() === this.getComparisonMethod()){
						return true;
					}
				}
				return false;
			};

			return Condition;
		})();
	}
);
define('conditionList',['abstractList', 'condition'], function(AbstractList, Condition){
	return (function() {
		/**
		 * @classdesc This class represents a list for Conditions.
		 * @constructs ConditionList
		 * @extends AbstractList
		 */
		function ConditionList() {
			AbstractList.call(this);

			/**
			 * @type {Condition}
			 * @private
			 */
			this._type = Condition;

			return this;
		}

		ConditionList.prototype = Object.create(AbstractList.prototype);
		ConditionList.prototype.constructor = ConditionList;

		return ConditionList;
	})();
});
/**
 * This module represents a Subscriber.
 * 
 * @module Subscriber
 */
define('subscriber',['contextInformationList', 'callbackList', 'condition', 'conditionList'],
 	function(ContextInformationList, CallbackList, Condition, ConditionList)  {
		return (function() {
			/**
			 * Constructor: Initializes the subscriptionCallbacks, subscriptionCallbacks and conditions.
			 *
			 * @classdesc Subscriber defines the name and the ID of the Subscriber and the Callbacks (with possible restrictions) what the subscriber is interested in.
			 * @constructs Subscriber
			 */
			function Subscriber() {
				/**
				 * Name of the subscriber.
				 *
				 * @type {string}
				 * @private
				 */
				this._subscriberName = '';

				/**
				 * ID of the Subscriber.
				 *
				 * @private
				 * @type {string}
				 */
				this._subscriberId = '';

				/**
				 * Callbacks that should be subscribed.
				 *
				 * @private
				 * @type {CallbackList}
				 */
				this._subscriptionCallbacks = new CallbackList();

				/**
				 * Restricts the associated contextual information of the callback to a subset
				 * 		(i.e: the subscriber wants a subset from the available the context data).
				 * 		If no contextual information is specified, all available contextual information will be returned.
				 *
				 * @private
				 * @type {ContextInformationList}
				 */
				this._contextInformationSubset = new ContextInformationList();

				/**
				 * Defines special conditions for notification.
				 *
				 * @private
				 * @type {ConditionList}
				 */
				this._conditions = new ConditionList();

				return this;
			}

			/**
			 * Builder for subscriberName.
			 *
			 * @param {String} subscriberName subscriberName
			 * @returns {Subscriber}
			 */
			Subscriber.prototype.withSubscriberName = function(subscriberName) {
				this.setSubscriberName(subscriberName);
				return this;
			};

			/**
			 * Builder for subscriberId.
			 *
			 * @param {String} subscriberId subscriberId
			 * @returns {Subscriber}
			 */
			Subscriber.prototype.withSubscriberId = function(subscriberId) {
				this.setSubscriberId(subscriberId);
				return this;
			};

			/**
			 * Builder for subscriptionCallbacks.
			 *
			 * @param {CallbackList} subscriptionCallbacks subscriptionCallbacks
			 * @returns {Subscriber}
			 */
			Subscriber.prototype.withSubscriptionCallbacks = function(subscriptionCallbacks) {
				this.setSubscriptionCallbacks(subscriptionCallbacks);
				return this;
			};

			/**
			 * Builder for contextInformationSubset.
			 *
			 * @param {ContextInformationList} contextInformationList
			 * @returns {Subscriber}
			 */
			Subscriber.prototype.withContextInformationSubset = function(contextInformationList) {
				this.setContextInformationSubset(contextInformationList);
				return this;
			};

			/**
			 * Builder for conditions.
			 *
			 * @param {(ConditionList|Array)} conditionListOrArray conditions
			 * @returns {Subscriber}
			 */
			Subscriber.prototype.withConditions = function(conditionListOrArray) {
				this.setConditions(conditionListOrArray);
				return this;
			};

			/**
			 * Returns the name.
			 *
			 * @returns {string}
			 */
			Subscriber.prototype.getSubscriberName = function() {
				return this._subscriberName;
			};

			/**
			 * Sets the setSubscriberName.
			 *
			 * @param {string} subscriberName subscriberName
			 */
			Subscriber.prototype.setSubscriberName = function(subscriberName) {
				if(typeof subscriberName === 'string'){
					this._subscriberName = subscriberName;
				}
			};

			/**
			 * Returns the subscriberId.
			 *
			 * @returns {string}
			 */
			Subscriber.prototype.getSubscriberId = function() {
				return this._subscriberId;
			};

			/**
			 * Sets the subscriberId.
			 *
			 * @param {string} subscriberId subscriberId
			 */
			Subscriber.prototype.setSubscriberId = function(subscriberId){
				if(typeof subscriberId === 'string'){
					this._subscriberId = subscriberId;
				}
			};

			/**
			 * Returns the subscriptionCallbacks.
			 *
			 * @returns {CallbackList}
			 */
			Subscriber.prototype.getSubscriptionCallbacks = function() {
				return this._subscriptionCallbacks;
			};

			/**
			 * Sets the subscriptionCallbacks.
			 *
			 * @param {CallbackList} subscriptionCallbacks subscriptionCallbacks
			 */
			Subscriber.prototype.setSubscriptionCallbacks = function(subscriptionCallbacks) {
				if(subscriptionCallbacks.constructor === CallbackList) {
					this._subscriptionCallbacks = subscriptionCallbacks;
				}
			};

			/**
			 * Returns the contextInformationSubset.
			 *
			 * @returns {ContextInformationList}
			 */
			Subscriber.prototype.getContextInformationSubset = function() {
				return this._contextInformationSubset;
			};

			/**
			 * Sets the contextInformationSubset.
			 *
			 * @param {ContextInformationList} contextInformationList
			 */
			Subscriber.prototype.setContextInformationSubset = function(contextInformationList){
				if(contextInformationList && contextInformationList instanceof ContextInformationList) {
					this._contextInformationSubset = contextInformationList;
				}
			};

			/**
			 * Returns the conditions.
			 *
			 * @returns {ConditionList}
			 */
			Subscriber.prototype.getConditions = function() {
				return this._conditions;
			};

			/**
			 * Sets the conditions.
			 *
			 * @param {(ConditionList|Array)} conditionListOrArray conditions
			 */
			Subscriber.prototype.setConditions = function(conditionListOrArray) {
				var list = [];
				if(conditionListOrArray instanceof Array){
					list = conditionListOrArray;
				} else if (conditionListOrArray && conditionListOrArray.constructor === ConditionList) {
					list = conditionListOrArray.getItems();
				}
				for(var i in list) {
					this.addCondition(list[i]);
				}
			};

			/**
			 * Adds a condition.
			 *
			 * @param {Condition} condition Condition
			 */
			Subscriber.prototype.addCondition = function(condition) {
				if (condition.constructor === Condition) {
					if (!this._conditions.contains(condition)) {
						this._conditions.put(condition);
					}
				}
			};

			/**
			 * Removes a condition.
			 *
			 * @param {Condition} condition Condition
			 */
			Subscriber.prototype.removeCondition = function(condition) {
				if (condition.constructor === Condition) {
					this._conditions.removeItem(condition);
				}
			};

			/**
			 * Compares this instance with the given one.
			 *
			 * @param {Subscriber} subscriber Subscriber that should be compared.
			 * @returns {boolean}
			 */
			Subscriber.prototype.equals = function(subscriber) {
				if(subscriber.constructor === Subscriber){
					if(subscriber.getSubscriberName() == this.getSubscriberName()
						&& subscriber.getSubscriberId() == this.getSubscriberId()
						&& subscriber.getSubscriptionCallbacks().equals(this.getSubscriptionCallbacks())
						&& subscriber.getContextInformationSubset().equals(this.getContextInformationSubset())
						&& subscriber.getConditions().equals(this.getConditions())){
						return true;
					}
				}
				return false;
			};

			return Subscriber;
		})();
	}
);
/**
 * This module represents a SubscriberList. It is a subclass of AbstractList.
 * 
 * @module SubscriberList
 */
define('subscriberList',['abstractList', 'subscriber'], function(AbstractList, Subscriber){
	return (function() {
		/**
		 * @classdesc This class represents a list for Subscriber.
		 * @extends AbstractList
		 * @constructs SubscriberList
		 */
		function SubscriberList() {
			AbstractList.call(this);

			/**
			 * @type {Subscriber}
			 * @private
			 */
			this._type = Subscriber;

			return this;
		}

		SubscriberList.prototype = Object.create(AbstractList.prototype);
		SubscriberList.prototype.constructor = SubscriberList;

		/**
		 * @param {String} subscriberId
		 */
		SubscriberList.prototype.removeSubscriberWithId = function(subscriberId) {
			for (var index in this._items) {
				var theSubscriber = this._items[index];
				if (theSubscriber.getSubscriberId() == subscriberId) this._items.splice(index, 1);
			}
		};

		return SubscriberList;
	})();
});
/**
 * Created by tobias on 30.09.15.
 */
define('queryable',['component', 'contextInformation', 'contextInformationList', 'callback', 'callbackList', 'subscriber', 'subscriberList'], function(Component, ContextInformation, ContextInformationList, Callback, CallbackList, Subscriber, SubscriberList) {
    return (function() {
        /**
         * Defines all output contextual information and constant output contextual information as an object.
         * @type {object}
         * @public
         */
        Queryable.description = {
            out: [
                {
                    "name":"",
                    "type":""
                }
            ],
            const: [
                {
                    "name":"",
                    "type":""
                }
            ],
            updateInterval: 30000,
            requiredObjects: []
        };

        /**
         *
         * @returns {Queryable}
         * @class Queryable
         * @extends Component
         */
        function Queryable(discoverer) {
            Component.call(this, discoverer);

            /**
             * Name of the queryable.
             *
             * @type {string}
             * @private
             */
            this._name = 'Queryable';

            /**
             * List of Callbacks.
             *
             * @protected
             * @type {CallbackList}
             */
            this._callbacks = new CallbackList();

            /**
             * All available contextual information and their values.
             *
             * @type {ContextInformationList}
             * @protected
             */
            this._outputData = new ContextInformationList();

            /**
             * This temporary variable is used for storing the old data values.
             * So these can be used to check conditions.
             *
             * @type {ContextInformationList}
             * @protected
             */
            this._oldOutputContextInformation = new ContextInformationList();

            /**
             *
             * @protected
             * @type {ContextInformationList}
             * @desc All available constant contextual information and their values.
             */
            this._constantOutputContextInformation = new ContextInformationList();

            /**
             *
             * @protected
             * @type {SubscriberList}
             * @desc List of Subscriber.
             */
            this._subscribers = new SubscriberList();

            /**
             *
             * @type {null}
             * @private
             */
            this._updateInterval = null;

            return this;
        }

        Queryable.prototype = Object.create(Component.prototype);
        Queryable.prototype.constructor = Queryable;

        /**
         * Initializes the provided contextual information.
         *
         * @protected
         */
        Queryable.prototype._initOutputContextInformation = function() {
            this._outputData = ContextInformationList.fromContextInformationDescriptions(this._discoverer, this.constructor.description.out);
        };

        /**
         *
         * @param {(ContextInformationList|Array.<ContextInformation>)} [contextInformationListOrArray]
         * @returns {ContextInformationList}
         */
        Queryable.prototype.getOutputContextInformation = function(contextInformationListOrArray) {
            return /** @type {ContextInformationList} */ this.getOutputData(contextInformationListOrArray);
        };

        /**
         * Returns the old contextual information.
         *
         * @returns {ContextInformationList}
         */
        Queryable.prototype.getOldOutputContextInformation = function() {
            return this._oldOutputContextInformation;
        };

        /**
         *
         * @param {(ContextInformationList|Array.<ContextInformation>)} contextInformationListOrArray
         * @protected
         */
        Queryable.prototype._setOutputContextInformation = function(contextInformationListOrArray) {
            this._setOutputData(contextInformationListOrArray);
        };

        /**
         *
         * @param {ContextInformation} contextInformation
         * @returns {Boolean}
         * @protected
         */
        Queryable.prototype._isOutputContextInformation = function(contextInformation) {
            return this._isOutputData(contextInformation);
        };

        /**
         * Updates the contextual information that is maintained by the queryable.
         *
         * @param {(ContextInformationList|Array.<ContextInformation>)} contextInformationListOrArray Contextual information that should be entered.
         */
        Queryable.prototype.putData = function(contextInformationListOrArray) {
            var list = [];
            if (contextInformationListOrArray instanceof Array) {
                list = contextInformationListOrArray;
            } else if (contextInformationListOrArray instanceof ContextInformationList) {
                list = contextInformationListOrArray.getItems();
            }
            for ( var i in list) {
                var contextInformation = list[i];
                if (contextInformation instanceof ContextInformation && this._isOutputContextInformation(contextInformation)) {
                    this.addOutputContextInformation(contextInformation);
                }
            }
        };

        /**
         * Adds a new context information value. If the given kind of
         * contextual information is not included in the list, it will be also added.
         * Otherwise, only the value will be updated.
         *
         * @param {ContextInformation} contextInformation
         * @param {boolean} [multipleInstances=false]
         */
        Queryable.prototype.addOutputContextInformation = function(contextInformation, multipleInstances) {
            this.log("will add or update contextual information "+contextInformation+".");
            multipleInstances = typeof multipleInstances == "undefined" ? false : multipleInstances;
            this._oldOutputContextInformation = this._outputData;
            contextInformation.setTimestamp(this.getCurrentTime());
            if (contextInformation instanceof ContextInformation) {
                this._outputData.put(contextInformation, multipleInstances);
            }
        };

        return Queryable;
    })();
});
/**
 * This module representing a Context Widget.
 * 
 * @module Widget
 */
define('widget',['queryable', 'callback', 'callbackList', 'contextInformation', 'contextInformationList', 'conditionList', 'subscriber', 'subscriberList'],
	function(Queryable, Callback, CallbackList, ContextInformation, ContextInformationList, ConditionList, Subscriber, SubscriberList) {
		return (function() {

			/**
			 * Defines all output contextual information and constant output contextual information as an object.
			 * @type {object}
			 * @public
			 */
			Widget.description = {
				out: [
					{
						"name":"",
						"type":""
					}
				],
				const: [
					{
						"name":"",
						"type":""
					}
				],
				updateInterval: 30000,
				requiredObjects: []
			};

			/**
			 * Constructor: Generates the ID and initializes the
			 * Widget with contextual information, callbacks and subscriber
			 * that are specified in the provided functions.
			 *
			 * @abstract
			 * @class Widget
			 * @extends Queryable
			 * @param {Discoverer} discoverer
			 */
			function Widget(discoverer) {
				Queryable.call(this, discoverer);

				/**
				 * Name of the widget.
				 *
				 * @type {string}
				 * @private
				 */
				this._name  = 'Widget';

				this._register();
				this._init();

				return this;
			}

			Widget.prototype = Object.create(Queryable.prototype);
			Widget.prototype.constructor = Widget;

			/**
			 * Function for initializing. Calls all initFunctions
			 * and will be called by the constructor.
			 *
			 * @protected
			 */
			Widget.prototype._init = function() {
				this._initOutputContextInformation();
				this._initConstantOutputContextInformation();
				this._initCallbacks();
			};

			/**
			 * Initializes the provided constant contextual information.
			 *
			 * @private
			 */
			Widget.prototype._initConstantOutputContextInformation = function() {
				this._constantOutputContextInformation = ContextInformationList.fromContextInformationDescriptions(this._discoverer, this.constructor.description.const);
			};

			/**
			 * Initializes the provided Callbacks.
			 *
			 * @abstract
			 * @protected
			 */
			Widget.prototype._initCallbacks = function() {
				throw new Error("Abstract function!");
			};

			/**
			 * Returns the available constant contextual information.
			 * (contextual information that do not change).
			 *
			 * @param {?ContextInformationList} [contextInformationList]
			 * @returns {ContextInformationList}
			 */
			Widget.prototype.getConstantOutputContextInformation = function(contextInformationList) {
				if (typeof contextInformationList != "undefined" && contextInformationList instanceof ContextInformationList) {
					return this._constantOutputContextInformation.getSubset(contextInformationList);
				} else {
					return this._constantOutputContextInformation;
				}
			};

			/**
			 * Returns the last acquired contextual information value with the given contextual information's kind.
			 *
			 * @param {ContextInformation} contextInformation The contextual information to return the last value for.
			 * @returns {*}
			 */
			Widget.prototype.getLastValueForContextInformationOfKind = function(contextInformation) {
				return this.getOutContextInformation().getContextInformationOfKind(contextInformation).getValue();
			};

			/**
			 * Returns a list of callbacks that can be
			 * subscribed to.
			 *
			 * @returns {CallbackList}
			 */
			Widget.prototype.getCallbackList = function() {
				return this._callbacks;
			};

			/**
			 * Returns the specified callbacks that can be
			 * subscribed to.
			 *
			 * @returns {Array}
			 */
			Widget.prototype.getCallbacks = function() {
				return this._callbacks.getItems();
			};

			Widget.prototype.queryServices = function() {
				return this.services;
			};

			/**
			 * Returns the Subscriber.
			 *
			 * @returns {SubscriberList}
			 */
			Widget.prototype.getSubscriber = function() {
				return this._subscribers;
			};

			/**
			 * Sets the constant contextual information list.
			 *
			 * @protected
			 * @param {(ContextInformationList|Array.<ContextInformation>)} contextInformationListOrArray List or Array of contextual information.
			 */
			Widget.prototype._setConstantOutContextInformation = function(contextInformationListOrArray) {
				this._constantOutContextInformation = new ContextInformationList().withItems(contextInformationListOrArray);
			};

			/**
			 * Adds a new constant contextual information. If the given value is
			 * not included in the list, the associated type will
			 * be also added. Otherwise, only the value will be
			 * updated.
			 *
			 * @protected
			 * @param {ContextInformation} contextInformation
			 */
			Widget.prototype._addConstantOutputContextInformation = function(contextInformation) {
				if (contextInformation instanceof ContextInformation) {
					if (!this._constantOutputContextInformation.containsKindOf(contextInformation)) {
						contextInformation.setTimestamp(this.getCurrentTime());
						this._constantOutputContextInformation.put(contextInformation);
					}
				}
			};

			/**
			 * Sets Callbacks.
			 *
			 * @protected
			 * @param {(CallbackList|Array)} callbacks List or Array of Callbacks.
			 */
			Widget.prototype._setCallbacks = function(callbacks) {
				var list = [];
				if (callbacks instanceof Array) {
					list = callbacks;
				} else if (callbacks instanceof CallbackList) {
					list = callbacks.getItems();
				}
				for ( var i in list) {
					var callback = list[i];
					if (callback instanceof Callback) {
						this.callbacks.put(callback);
					}
				}
			};

			/**
			 * Adds a new Callback.
			 *
			 * @protected
			 * @param {Callback} callback List or Array of contextual information.
			 */
			Widget.prototype._addCallback = function(callback) {
				if (callback instanceof Callback) {
					this._callbacks.put(callback);
				}
			};

			Widget.prototype._setServices = function(services) {
				this.services = services;
			};

			/**
			 * Sets SubscriberList.
			 *
			 * @protected
			 * @param {(SubscriberList|Array.<Subscriber>)}  subscribers List or Array of Subscriber.
			 */
			Widget.prototype._setSubscriber = function(subscribers) {
				var list = [];
				if (subscribers instanceof Array) {
					list = subscribers;
				} else if (subscribers instanceof SubscriberList) {
					list = subscribers.getItems();
				}
				for ( var i in list) {
					var singleSubscriber = list[i];
					if (singleSubscriber instanceof Subscriber) {
						this._subscribers.put(singleSubscriber);
					}
				}
			};

			/**
			 * Adds a new Subscriber.
			 *
			 * @public
			 * @param {?Subscriber} subscriber Subscriber
			 */
			Widget.prototype.addSubscriber = function(subscriber) {
				if (subscriber && subscriber instanceof Subscriber) {
					this._subscribers.put(subscriber);
					this._intervalRunning();
				}
			};

			/**
			 * Removes the specified Subscriber.
			 *
			 * @public
			 * @param {Subscriber} subscriberId Subscriber
			 */
			Widget.prototype.removeSubscriber = function(subscriberId) {
				this._subscribers.removeSubscriberWithId(subscriberId);
			};

			/**
			 * Notifies other components and sends the contextual information.
			 *
			 * @virtual
			 * @public
			 */
			Widget.prototype.notify = function() {
				this.log("will notify its subscribers.");
				var callbacks = this.getCallbacks();
				for (var i in callbacks) {
					this._sendToSubscriber(callbacks[i]);
				}
			};

			/**
			 * Queries the associated sensor and updates the contextual information with new values.
			 * Must be overridden by the subclasses.
			 *
			 * @protected
			 * @param {Callback} callback
			 */
			Widget.prototype._sendToSubscriber = function(callback) {
				if (callback && callback instanceof Callback) {
					var subscriberList = this._subscribers.getItems();
					for (var i in subscriberList) {
						var subscriber = subscriberList[i];
						if (subscriber.getSubscriptionCallbacks().contains(callback)) {
							if(this._dataValid(subscriber.getConditions())){
								var subscriberInstance = this._discoverer.getComponent(subscriber.getSubscriberId());
								var callSubset =  callback.getContextInformation();
								var subscriberSubset = subscriber.getContextInformationSubset();
								var data = this.getOutputContextInformation().getSubset(callSubset);
								if (subscriberSubset && subscriberSubset.size() > 0) {
									data = data.getSubset(subscriberSubset);
								}
							}
							if (data) {
								this.log("will send to "+subscriberInstance.getName()+" ("+subscriberInstance.getId()+").");
								subscriberInstance.putData(data);
							}
						}
					}
				}
			};

			/**
			 *
			 * @abstract
			 * @param callback
			 */
			Widget.prototype.queryGenerator = function (callback) {
				throw "Call to abstract method 'queryGenerator'.";
			};

			/**
			 *
			 * @param response
			 * @param callback
			 * @protected
			 */
			Widget.prototype._sendResponse = function(response, callback) {
				this.putData(response);
				this.notify();

				if (callback && typeof(callback) == 'function') {
					callback();
				}
			};

			/**
			 * Updates the contextual information by calling queryGenerator.
			 *
			 * @param {?function} callback For alternative  actions, because an asynchronous function can be used.
			 *
			 */
			Widget.prototype.updateWidgetInformation = function(callback) {
				this.log("will update my contextual information.");

				this.queryGenerator(callback);
			};

			/**
			 * Returns all available contextual information value and constant contextual information.
			 *
			 * @public
			 * @returns {ContextInformationList}
			 */
			Widget.prototype.queryWidget = function() {
				var response = new ContextInformationList();
				response.putAll(this.getOutputContextInformation());
				response.putAll(this.getConstantOutputContextInformation());
				return response;
			};

			/**
			 * Updates and returns all available contextual information value and constant contextual information.
			 *
			 * @param {?function} callback For alternative  actions, because an asynchronous function can be used.
			 * @returns {?ContextInformationList}
			 */
			Widget.prototype.updateAndQueryWidget = function(callback) {
				if(callback && typeof(callback) === 'function'){
					this.queryGenerator(callback);
				} else {
					this.queryGenerator();
					return this.queryWidget();
				}
			};

			/**
			 * Verifies if the contextual information match to the specified conditions in case any exists.
			 *
			 * @param {ConditionList} conditionList List of Conditions that will be verified.
			 * @returns {boolean}
			 */
			Widget.prototype._dataValid = function(conditionList) {
				if (conditionList instanceof ConditionList) {
					return true;
				}
				if (!conditionList.isEmpty()) {
					var items = conditionList.getItems();
					for (var i in items) {
						var condition = items[i];
						var conditionContextInformation = condition.getContextInformation();
						var conditionContextInformationList = new ContextInformationList().withItems(new Array(conditionContextInformation));
						var newValue = this.getOutputContextInformation().getSubset(conditionContextInformationList);
						var oldValue = this.getOldOutputContextInformation.getSubset(conditionContextInformationList);
						return condition.compare(newValue, oldValue);
					}
				}
				return false;
			};

			/**
			 * Runs the context acquisition constantly in an interval.
			 * Can be called by init.
			 *
			 * @private
			 */
			Widget.prototype._intervalRunning = function() {
				var self = this;
				if (typeof this.constructor.description.updateInterval !== "undefined" && !isNaN(this.constructor.description.updateInterval) && this._updateInterval === null) {
					this.log("will query its context generator every "+this.constructor.description.updateInterval+" milliseconds ("+(this.constructor.description.updateInterval/1000)+" seconds).");
					this._updateInterval = setInterval(function() {
						self.log("Interval Trigger -> queryGenerator");
						self.queryGenerator();
					}, this.constructor.description.updateInterval);
				}
			};

			/**
			 *
			 * @returns {boolean}
			 */
			Widget.prototype.available = function() {
				return this._checkRequiredObjects();
			};

			/**
			 *
			 * @returns {boolean}
			 * @private
			 */
			Widget.prototype._checkRequiredObjects = function() {
				if (this.constructor.description.requiredObjects && this.constructor.description.requiredObjects instanceof Array) {
					for (var index in this.constructor.description.requiredObjects) {
						var theRequiredObject = this.constructor.description.requiredObjects[index];
						if (typeof window[theRequiredObject] == "undefined") return false;
					}
				}
				return true;
			};

			return Widget;
		})();
	}
);
define('interpreterResult',['contextInformationList'], function(ContextInformationList){
	return (function() {
		/**
		 * Initializes the input and output contextual information.
		 * Contains the interpreted data, inclusive the input for the interpretation.
		 *
		 * @class InterpreterResult
		 */
		function InterpreterResult() {
			/**
			 * Time of the interpretation.
			 *
			 * @type {date}
			 * @private
			 */
			this._timestamp = '';

			/**
			 * Interpreted data.
			 *
			 * @type {ContextInformationList}
			 * @private
			 */
			this._outContextInformation = new ContextInformationList();

			/**
			 * Data, which were used for the interpretation.
			 *
			 * @type {ContextInformationList}
			 * @private
			 */
			this._inContextInformation = new ContextInformationList();


			return this;
		}

		/**
		 * Builder for timestamp.
		 *
		 * @param {String} timestamp timestamp
		 * @returns {InterpreterResult}
		 */
		InterpreterResult.prototype.withTimestamp = function(timestamp) {
			this.setTimestamp(timestamp);
			return this;
		};

		/**
		 * Builder for output contextual information.
		 *
		 * @param {(ContextInformationList|Array.<ContextInformation>)} contextInformationListOrArray values
		 * @returns {InterpreterResult}
		 */
		InterpreterResult.prototype.withOutContextInformation = function(contextInformationListOrArray){
			this.setOutContextInformation(contextInformationListOrArray);
			return this;
		};

		/**
		 * Builder for input contextual information.
		 *
		 * @param {(ContextInformationList|.<ContextInformation>)} contextInformationListOrArray values
		 * @returns {InterpreterResult}
		 */
		InterpreterResult.prototype.withInContextInformation = function(contextInformationListOrArray) {
			this.setInContextInformation(contextInformationListOrArray);
			return this;
		};

		/**
		 * Returns the interpretation time.
		 *
		 * @returns {Date}
		 */
		InterpreterResult.prototype.getTimestamp = function() {
			return this._timestamp;
		};

		/**
		 * Returns the interpreted contextual information.
		 *
		 * @returns {ContextInformationList}
		 */
		InterpreterResult.prototype.getOutContextInformation = function(){
			return this._outContextInformation;
		};

		/**
		 * Returns the input contextual information.
		 *
		 * @returns {ContextInformationList}
		 */
		InterpreterResult.prototype.getInContextInformation = function(){
			return this._inContextInformation;
		};

		/**
		 * Sets the interpretation time.
		 *
		 * @param {date} timestamp interpretation time
		 */
		InterpreterResult.prototype.setTimestamp = function(timestamp){
			if(timestamp instanceof Date){
				this._timestamp = timestamp;
			}
		};

		/**
		 * Sets the interpreted values.
		 *
		 * @param {(ContextInformationList|Array.<ContextInformation>)} contextInformationListOrArray The retrieved contextual information.
		 */
		InterpreterResult.prototype.setOutContextInformation = function(contextInformationListOrArray){
			if (contextInformationListOrArray instanceof Array) {
				for(var i in contextInformationListOrArray){
					this._outContextInformation.put(contextInformationListOrArray[i]);
				}
			} else if (contextInformationListOrArray instanceof ContextInformationList) {
				this._outContextInformation = contextInformationListOrArray.getItems();
			}
		};

		/**
		 * Sets the put contextual information.
		 *
		 * @param {(ContextInformationList|Array.<ContextInformation>)} contextInformationListOrArray
		 */
		InterpreterResult.prototype.setInContextInformation = function(contextInformationListOrArray){
			if (contextInformationListOrArray instanceof Array) {
				for(var i in contextInformationListOrArray){
					this._inContextInformation.put(contextInformationListOrArray[i]);
				}
			} else if (contextInformationListOrArray instanceof ContextInformationList) {
				this._inContextInformation = contextInformationListOrArray.getItems();
			}
		};

		return InterpreterResult;
	});
});
define('interpreter',['component', 'contextInformation', 'contextInformationList', 'interpreterResult' ],
	function(Component, ContextInformation, ContextInformationList, InterpreterResult) {
		return (function() {

			/**
			 * Defines all in and out contextual information as an object.
			 *
			 * @type {object}
			 * @public
			 */
			Interpreter.description = {
				in: [
					{
						'name':'',
						'type':''
					}
				],
				out: [
					{
						'name':'',
						'type':''
					}
				],
				requiredObjects: []
			};

			/**
			 * Generates the id and initializes the (in and out) types and values.
			 *
			 * @abstract
			 * @class Interpreter
			 * @extends Component
			 */
			function Interpreter(discoverer) {
				Component.call(this, discoverer);

				/**
				 * Name of the interpreter.
				 *
				 * @type {string}
				 * @private
				 */
				this._name = 'Interpreter';

				/**
				 * Types of all contextual information that can be handled.
				 *
				 * @private
				 * @type {ContextInformationList}
				 */
				this._inputContextInformation = new ContextInformationList();

				/**
				 * Last interpretation time.
				 *
				 * @protected
				 * @type {?Date}
				 */
				this._lastInterpretation = null;

				this._register();
				this._initInterpreter();

				return this;
			}

			Interpreter.prototype = Object.create(Component.prototype);
			Interpreter.prototype.constructor = Interpreter;

			/**
			 * Initializes interpreter and sets the expected contextual information and provided output contextual information.
			 *
			 * @private
			 */
			Interpreter.prototype._initInterpreter = function() {
				this._initInputContextInformation();
				this._initOutputContextInformation();
			};

			/**
			 * Initializes the input contextual information.
			 *
			 * @private
			 */
			Interpreter.prototype._initInputContextInformation = function() {
				this._setInputContextInformation(ContextInformationList.fromContextInformationDescriptions(this._discoverer, this.constructor.description.in));
			};

			/**
			 * Initializes the output contextual information.
			 *
			 * @private
			 */
			Interpreter.prototype._initOutputContextInformation = function() {
				this._setOutputContextInformation(ContextInformationList.fromContextInformationDescriptions(this._discoverer, this.constructor.description.out));
			};

			/**
			 * Convenience accessor for getOutputData.
			 *
			 * @param {(ContextInformationList|Array.<ContextInformation>)} [contextInformationListOrArray] Contextual information that should be entered.
			 * @returns {ContextInformationList}
			 */
			Interpreter.prototype.getOutputContextInformation = function(contextInformationListOrArray) {
				return /** @type {ContextInformationList} */ this.getOutputData(contextInformationListOrArray);
			};

			/**
			 * Convenience accessor for _setOutputData.
			 *
			 * @param contextInformation
			 * @private
			 */
			Interpreter.prototype._setOutputContextInformation = function(contextInformation) {
				this._setOutputData(contextInformation);
			};

			/**
			 * Convenience accessor for _isOutputData.
			 *
			 * @param {ContextInformation} contextInformation
			 * @returns {Boolean}
			 * @private
			 */
			Interpreter.prototype._isOutputContextInformation = function(contextInformation) {
				return this._isOutputData(contextInformation);
			};

			/**
			 * Returns the expected input contextual information.
			 *
			 * @public
			 * @returns {ContextInformationList}
			 */
			Interpreter.prototype.getInputContextInformation = function() {
				return this._inputContextInformation;
			};

			/**
			 * Adds an input contextual information.
			 *
			 * @protected
			 * @param {ContextInformation} contextInformation
			 */
			Interpreter.prototype._addInputContextInformation = function(contextInformation) {
				this._inputContextInformation.put(contextInformation);
			};

			/**
			 * Sets the input contextual information.
			 *
			 * @protected
			 * @param {(ContextInformationList|Array)} contextInformationListOrArray The contextual information to set.
			 */
			Interpreter.prototype._setInputContextInformation = function(contextInformationListOrArray) {
				this._inputContextInformation = new ContextInformationList().withItems(contextInformationListOrArray);
			};

			/**
			 * Verifies whether the specified contextual information is contained in _inputContextInformation.
			 *
			 * @protected
			 * @param {ContextInformation} contextInformation The contextual information that should be verified.
			 * @return {boolean}
			 */
			Interpreter.prototype._isInputContextInformation = function(contextInformation) {
				return !!this._inputContextInformation.containsKindOf(contextInformation);
			};

			/**
			 * Validates the data and calls interpretData.
			 *
			 * @public
			 * @param {ContextInformationList} inputContextInformation Data that should be interpreted.
			 * @param {ContextInformationList} outputContextInformation
			 * @param {?function} callback For additional actions, if an asynchronous function is used.
			 */
			Interpreter.prototype.callInterpreter = function(inputContextInformation, outputContextInformation, callback) {
				var self = this;

				if (!inputContextInformation || !this._canHandleInputContextInformation(inputContextInformation)) throw "Empty input contextual information list or unhandled input contextual information.";
				if (!outputContextInformation || !this._canHandleOutputContextInformation(outputContextInformation)) throw "Empty output contextual information list or unhandled output contextual information.";

				// get expected input contextual information
				var expectedInputContextInformation = this._getExpectedInputContextInformation(inputContextInformation);

				this._interpretData(expectedInputContextInformation, outputContextInformation, function(interpretedData) {
					var response = new ContextInformationList().withItems(interpretedData);

					if (!self._canHandleOutputContextInformation(response)) throw "Unhandled output contextual information generated.";

					self._setInputContextInformation(inputContextInformation);
					self.lastInterpretation = new Date();

					if (callback && typeof(callback) == 'function'){
						callback(response);
					}
				});
			};

			/**
			 * Interprets the data.
			 *
			 * @abstract
			 * @protected
			 * @param {ContextInformationList} inContextInformation
			 * @param {ContextInformationList} outContextInformation
			 * @param {Function} callback
			 */
			Interpreter.prototype._interpretData = function (inContextInformation, outContextInformation, callback) {
				throw Error("Abstract function call!");
			};

			/**
			 * Checks whether the specified data match the expected.
			 *
			 * @protected
			 * @param {(ContextInformationList|Array.<ContextInformation>)} contextInformationListOrArray Data that should be verified.
			 */
			Interpreter.prototype._canHandleInputContextInformation = function(contextInformationListOrArray) {
				var list = [];
				if (contextInformationListOrArray instanceof Array) {
					list = contextInformationListOrArray;
				} else if (contextInformationListOrArray instanceof ContextInformationList) {
					list = contextInformationListOrArray.getItems();
				}
				if (list.length == 0 || contextInformationListOrArray.size() != this.getInputContextInformation().size()) {
					return false;
				}
				for (var i in list) {
					var inContextInformation = list[i];
					if (!this._isInputContextInformation(inContextInformation)) {
						return false;
					}
				}
				return true;
			};

			/**
			 * Checks whether the specified data match the expected.
			 *
			 * @protected
			 * @param {(ContextInformationList|Array.<ContextInformation>)} contextInformationListOrArray Data that should be verified.
			 */
			Interpreter.prototype._canHandleOutputContextInformation = function(contextInformationListOrArray) {
				var list = [];
				if (contextInformationListOrArray instanceof Array) {
					list = contextInformationListOrArray;
				} else if (contextInformationListOrArray instanceof ContextInformationList) {
					list = contextInformationListOrArray.getItems();
				}
				if (list.length == 0 || contextInformationListOrArray.size() != this.getOutputContextInformation().size()) {
					return false;
				}
				for (var i in list) {
					var outContextInformation = list[i];
					if (!this._isOutputContextInformation(outContextInformation)) {
						return false;
					}
				}
				return true;
			};

			/**
			 * Returns a contextual information list which consists of the synonyms that are expected by the interpreter, if possible.
			 *
			 * @param {ContextInformationList} contextInformationList
			 * @returns {*}
			 * @private
			 */
			Interpreter.prototype._getExpectedInputContextInformation = function(contextInformationList) {
				var self = this;
				var expectedContextInformation = new ContextInformationList();

				contextInformationList.getItems().forEach(function(contextInformation, index) {
					expectedContextInformation.put(contextInformation.getSynonymWithName(self.getInputContextInformation().getItems()[index].getName()).setValue(contextInformation.getValue()));
				});

				return expectedContextInformation;
			};

			/**
			 * Returns the time of the last interpretation.
			 *
			 * @public
			 * @returns {Date}
			 */
			Interpreter.prototype.getLastInterpretationTime = function() {
				return this._lastInterpretation;
			};

			/**
			 *
			 * @returns {boolean}
			 */
			Interpreter.prototype.hasOutputContextInformationWithInputParameters = function() {
				return this._outputData.hasContextInformationWithInputParameters();
			};

			/**
			 *
			 * @returns {ContextInformationList}
			 */
			Interpreter.prototype.getOutputContextInformationWithInputParameters = function() {
				return this._outputData.getContextInformationWithInputParameters();
			};

			return Interpreter;
		})();
	}
);
define('interpretation',['interpreter', 'contextInformationList'], function(Interpreter, ContextInformationList) {
    return (function () {
        /**
         *
         * @param {String} interpreterId
         * @param {ContextInformationList} inContextInformation
         * @param {ContextInformationList} outContextInformation
         * @returns {Interpretation}
         * @class Interpretation
         */
        function Interpretation(interpreterId, inContextInformation, outContextInformation) {
            /**
             *
             * @type {String}
             */
            this.interpreterId = interpreterId;

            /**
             *
             * @type {ContextInformationList}
             */
            this.inContextInformation = inContextInformation;

            /**
             *
             * @type {ContextInformationList}
             */
            this.outContextInformation = outContextInformation;

            return this;
        }

        return Interpretation;
    })();
});
define('aggregator',['queryable', 'widget', 'contextInformation', 'contextInformationList', 'subscriber', 'subscriberList', 'callbackList', 'storage', 'interpreter', 'interpretation'],
 	function(Queryable, Widget, ContextInformation, ContextInformationList, Subscriber, SubscriberList, CallbackList, Storage, Interpreter, Interpretation){
		return (function() {
			/**
			 * Generates the id and initializes the Aggregator.
			 *
			 * @class Aggregator
			 * @extends Queryable
			 * @param {Discoverer} discoverer
			 * @param {ContextInformationList} contextInformation
			 */
			function Aggregator(discoverer, contextInformation) {
				Queryable.call(this, discoverer);

				/**
				 * Name of the Aggregator.
				 *
				 * @type {string}
				 */
				this._name = 'Aggregator';

				/**
				 * List of subscribed widgets referenced by ID.
				 *
				 * @type {Array.<String>}
				 * @protected
				 */
				this._widgets = [];

				/**
				 *
				 * @type {Array.<Interpretation>}
				 * @protected
				 */
				this._interpretations = [];

				/**
				 * Database of the Aggregator.
				 *
				 * @type {Storage}
				 * @protected
				 */
				this._storage = new Storage("DB_Aggregator", 7200000, 5, this);

				this._register();
				this._aggregatorSetup(contextInformation);

				return this;
			}

			Aggregator.prototype = Object.create(Queryable.prototype);
			Aggregator.prototype.constructor = Aggregator;

			/**
			 * Sets Widget IDs.
			 *
			 * @protected
			 * @param {Array.<String>} widgetIds List of Widget IDs
			 */
			Aggregator.prototype._setWidgets = function(widgetIds) {
				if (typeof widgetIds == "array") {
					this._widgets = widgetIds;
				}
			};

			/**
			 * Adds Widget ID.
			 *
			 * @public
			 * @param {String|Widget} widgetIdOrWidget Widget ID
			 */
			Aggregator.prototype.addWidget = function(widgetIdOrWidget){
				if (widgetIdOrWidget instanceof Widget) {
					this._widgets.push(widgetIdOrWidget.getId());
				} else if(typeof widgetIdOrWidget == "string") {
					this._widgets.push(widgetIdOrWidget);
				}
			};

			/**
			 * Returns the available Widget IDs.
			 *
			 * @public
			 * @returns {Array}
			 */
			Aggregator.prototype.getWidgets = function() {
				return this._widgets;
			};

			/**
			 * Removes Widget ID from list.
			 *
			 * @protected
			 * @param {String} _widgetId Id of the Widget
			 */
			Aggregator.prototype._removeWidget = function(_widgetId) {
				var index = this._widgets.indexOf(_widgetId);
				if (index > -1) {
					this._widgets = this._widgets.splice(index, 1);
				}
			};

			/**
			 * Retrieves all contextual information of the specified widgets.
			 *
			 * @protected
			 */
			Aggregator.prototype._initOutputContextInformation = function() {
				if(typeof this._widgets != "undefined" && this._widgets.length > 0){
					for(var i in this._widgets){
						var widgetId = this._widgets[i];
						/** @type {Widget} */
						var theWidget = this._discoverer.getComponent(widgetId);
						if (theWidget) {
							this._setOutputContextInformation(theWidget.getOutputContextInformation());
						}
					}
				}
			};

			/**
			 * Retrieves all constant contextual information of the specified widgets.
			 *
			 * @protected
			 * @override
			 */
			Aggregator.prototype._initConstantOutputContextInformation = function() {
				if(typeof this._widgets != "undefined" && this._widgets.length > 0){
					for(var i in this._widgets){
						var widgetId = this._widgets[i];
						/** @type {Widget} */
						var theWidget = this._discoverer.getComponent(widgetId);
						if (theWidget) {
							this._setConstantOutputContextInformation(theWidget.getConstantOutputContextInformation());
						}
					}
				}
			};

			/**
			 * Retrieves all actual Callbacks of the specified Widgets.
			 *
			 * @protected
			 * @override
			 */
			Aggregator.prototype._initCallbacks = function() {
				new Error("Call the aggregator _initCallbacks.");
				if(typeof this._widgets != "undefined" && this._widgets.length > 0){
					for(var i in this._widgets){
						var widgetId = this._widgets[i];
						this._initWidgetSubscription(widgetId);
					}
				}
			};

			/**
			 * InitMethod for Aggregators. Called by constructor. Initializes the associated Storage.
			 *
			 * @protected
			 * @param {ContextInformationList} contextInformationList
			 */
			Aggregator.prototype._aggregatorSetup = function(contextInformationList) {
				this._setAggregatorOutputContextInformation(contextInformationList);
				this._setAggregatorConstantContextInformation();
				this._setAggregatorCallbacks();

				this.didFinishSetup();
			};

			/**
			 * Initializes the provided contextual information that are only specific to the Aggregator.
			 * Called by aggregatorSetup().
			 *
			 * @param {ContextInformationList} contextInformationList
			 * @protected
			 */
			Aggregator.prototype._setAggregatorOutputContextInformation = function(contextInformationList) {
				if (contextInformationList instanceof ContextInformationList) {
					for (var index in contextInformationList.getItems()) {
						var theContextInformation = contextInformationList.getItems()[index];
						this.addOutputContextInformation(theContextInformation);
					}
				}
			};

			/**
			 * Initializes the provided constant contextual information that are only specific to the Aggregator.
			 * Called by aggregatorSetup().
			 *
			 * @virtual
			 * @protected
			 */
			Aggregator.prototype._setAggregatorConstantContextInformation = function() {

			};

			/**
			 * Initializes the provided Callbacks that are only specific to the Aggregator.
			 * Called by aggregatorSetup().
			 *
			 * @virtual
			 * @protected
			 */
			Aggregator.prototype._setAggregatorCallbacks = function() {

			};

			/**
			 * Returns the current contextual information that are saved in the cache.
			 *
			 * @public
			 * @returns {ContextInformationList}
			 */
			Aggregator.prototype.getCurrentData = function() {
				return this._outputData;
			};

			/**
			 * Subscribes to the given widget for the specified Callbacks.
			 *
			 * @protected
			 * @param {Widget} widget Widget that should be subscribed to.
			 * @param {CallbackList} callbacks required Callbacks
			 * @param subSet
			 * @param conditions
			 */
			Aggregator.prototype._subscribeTo = function(widget, callbacks, subSet, conditions){
				if(widget instanceof Widget){
					var subscriber = new Subscriber().withSubscriberId(this.getId()).
						withSubscriberName(this.getName()).
						withSubscriptionCallbacks(callbacks).
						withContextInformationSubset(subSet).
						withConditions(conditions);
					widget.addSubscriber(subscriber);
				}
			};

			/**
			 * Subscribes to the widgets that are defined in the Widget ID List
			 * used in the initCallback method.
			 *
			 * @protected
			 * @param {String} widgetId Widget that should be subscribed.
			 * @returns {?CallbackList}
			 */
			Aggregator.prototype._initWidgetSubscription = function(widgetId) {
				var callbacks = null;
				if(typeof widgetId == "string"){
					/** @type {Widget} */
					var theWidget = this._discoverer.getComponent(widgetId);
					if (theWidget) {
						//subscribe to all callbacks
						callbacks = theWidget.getCallbackList();
						this.subscribeTo(theWidget, callbacks);
					}
				}
				return callbacks;
			};

			/**
			 * Adds the specified callbacks of a widget to the aggregator.
			 *
			 * @public
			 * @param {String|Widget} widgetIdOrWidget Widget that should be subscribed.
			 * @param {CallbackList} [callbackList] required Callbacks
			 */
			Aggregator.prototype.addWidgetSubscription = function(widgetIdOrWidget, callbackList){
				if (typeof widgetIdOrWidget != "string" && widgetIdOrWidget instanceof Widget && !(widgetIdOrWidget instanceof Aggregator)) {
					if (!callbackList || !(callbackList instanceof CallbackList)) {
						callbackList = widgetIdOrWidget.getCallbackList();
					}
					widgetIdOrWidget = widgetIdOrWidget.getId();
				}
				if(typeof widgetIdOrWidget == "string" && callbackList instanceof CallbackList) {
					/** @type {?Widget} */
					var theWidget = this._discoverer.getComponent(widgetIdOrWidget);
					if (theWidget) {
						this._subscribeTo(theWidget, callbackList);
						this._callbacks.putAll(callbackList);
						var callsList = callbackList.getItems();
						for(var x in callsList){
							var singleCallback = callsList[x];
							var typeList = singleCallback.getContextInformation().getItems();
							for(var y in typeList){
								var singleType = typeList[y];
								this.addOutputContextInformation(singleType);
							}
						}
						this.addWidget(widgetIdOrWidget);
					}
				}
			};

			/**
			 * Removes subscribed Widgets and deletes the entry
			 * for subscribers in the associated Widget.
			 *
			 * @public
			 * @param {String} widgetId Widget that should be removed.
			 */
			Aggregator.prototype.unsubscribeFrom = function(widgetId) {
				if(typeof widgetId == "string") {
					var widget = this._discoverer.getComponent(widgetId);
					if (widget) {
						this.log('unsubscribeFrom: ' + widget.getName());
						widget.removeSubscriber(this.getId());
						this._removeWidget(widgetId);
					}
				}
			};

			/**
			 * Puts context data to Widget and expects an array.
			 *
			 * @override
			 * @public
			 * @param {(ContextInformationList|Array.<ContextInformation>)} contextInformationListOrArray data that shall be input
			 */
			Aggregator.prototype.putData = function(contextInformationListOrArray){
				this.log("did receive data from a subscribed component.");

				var list = [];

				// prepare contextual information
				if(contextInformationListOrArray instanceof Array){
					list = contextInformationListOrArray;
				} else if (contextInformationListOrArray instanceof ContextInformationList) {
					list = contextInformationListOrArray.getItems();
				}

				var interpretationsToBeQueried = [];

				// add contextual information to memory and persistent storage
				for(var i in list){
					var theContextInformation = list[i];
					if(theContextInformation instanceof ContextInformation && this._isOutputContextInformation(theContextInformation)){
						this.addOutputContextInformation(theContextInformation);
						if(this._storage) {
							this._store(theContextInformation);
						}

						// check for interpreters to be called
						if (this._interpretations.length > 0) {
							for (var index in this._interpretations) {
								var theInterpretation = this._interpretations[index];
								var inContextInformation = theInterpretation.inContextInformation;

								if (inContextInformation.containsKindOf(theContextInformation)) {
									if ($.inArray(theInterpretation, interpretationsToBeQueried) == -1) {
										this.log("found an new interpretation that needs "+theContextInformation+".");
										interpretationsToBeQueried.push(theInterpretation);
									}
								}
							}
						}
					}
				}

				// call interpretations
				for (var index in interpretationsToBeQueried) {
					this.queryReferencedInterpretation(interpretationsToBeQueried[index]);
				}
			};

			/**
			 * Calls the given Interpreter for interpretation the data.
			 *
			 * @public
			 * @param {String} interpreterId ID of the searched Interpreter
			 * @param {ContextInformationList} inContextInformation
			 * @param {ContextInformationList} outContextInformation
			 * @param {?function} callback for additional actions, if an asynchronous function is used
			 */
			Aggregator.prototype.interpretData = function(interpreterId, inContextInformation, outContextInformation, callback){
				var interpreter = this._discoverer.getComponent(interpreterId);
				if (interpreter instanceof Interpreter) {
					interpreter.callInterpreter(inContextInformation, outContextInformation, callback);
				}
			};

			/**
			 * Stores the data.
			 *
			 * @protected
			 * @param {ContextInformation} contextInformation data that should be stored
			 */
			Aggregator.prototype._store = function(contextInformation) {
				this._storage.store(contextInformation);
			};

			/**
			 * Queries the database and returns the last retrieval result.
			 * It may be that the retrieval result is not up to date,
			 * because an asynchronous function is used for the retrieval.
			 * For retrieving the current data, this function can be used as callback function
			 * in retrieveStorage().
			 *
			 * @public
			 * @param {String} name Name of the searched contextual information.
			 * @param {?function} callback for alternative  actions, because an asynchronous function is used
			 */
			Aggregator.prototype.queryContextInformation = function(name, callback){
				this._storage.retrieveContextInformation(name, callback);
			};

			/**
			 * Queries a specific table and only actualizes the storage cache.
			 * For an alternative action can be used a callback.
			 *
			 * @public
			 * @returns {RetrievalResult}
			 */
			Aggregator.prototype.retrieveStorage = function() {
				return this._storage.getCurrentData();
			};

			/**
			 * Returns an overview about the stored contextual information.
			 * It may be that the overview about the stored contextual information is not up to date,
			 * because an asynchronous function is used for the retrieval.
			 * For retrieving the current data, this function can be used as callback function
			 * in queryTables().
			 *
			 * @public
			 * @returns {?Array}
			 */
			Aggregator.prototype.getStorageOverview = function() {
				return this._storage.getContextInformationOverview();
			};

			/**
			 * Only updates the contextual information cache in the database.
			 * For an alternative action a callback can be used.
			 *
			 * @public
			 * @param {?function} callback for alternative actions, because an asynchronous function is used
			 */
			Aggregator.prototype.queryTables = function(callback) {
				this._storage.getContextInformationNames(callback);
			};

			/**
			 * Updates the information for the widget with the provided ID and calls the callback afterwards.
			 *
			 * @param {String} widgetId The ID of the widget to query.
			 * @param {Callback} callback The callback to query after the widget was updated.
			 */
			Aggregator.prototype.queryReferencedWidget = function(widgetId, callback) {
				this.log("I will query "+this._discoverer.getWidget(widgetId).getName()+".");
				this._discoverer.getWidget(widgetId).updateWidgetInformation(callback);
			};

			/**
			 * Updated the information for the interpretation with the provided Id and calls the callback afterwards.
			 *
			 * @param {Interpretation} theInterpretation
			 * @param {function} [callback]
			 */
			Aggregator.prototype.queryReferencedInterpretation = function(theInterpretation, callback) {
				this.log("I will query "+this._discoverer.getInterpreter(theInterpretation.interpreterId).getName()+".");

				var self = this;

				var theInterpreterId = theInterpretation.interpreterId;
				var interpretationInContextInformation = this.getOutputContextInformation(theInterpretation.inContextInformation);
				var interpretationOutContextInformation = this.getOutputContextInformation(theInterpretation.outContextInformation);

				this.interpretData(theInterpreterId, interpretationInContextInformation, interpretationOutContextInformation, function(interpretedData) {
					self.putData(interpretedData);

					if (callback && typeof(callback) == 'function') {
						callback();
					}
				});
			};

			/**
			 * Returns the UUIDs of all connected widgets and interpreters.
			 *
			 * @private
			 * @returns {Array.<T>} The UUIDs.
			 */
			Aggregator.prototype.getComponentUUIDs = function() {
				var uuids = [];
				uuids = uuids.concat(this._widgets);
				for (var index in this._interpretations) {
					var theInterpretation = this._interpretations[index];
					uuids.push(theInterpretation.interpreterId);
				}
				return uuids;
			};

			/**
			 * Return true if a component with the provided UUID was connected to the aggregator.
			 *
			 * @param {String} uuid The UUID of the component to check.
			 * @returns {boolean}
			 */
			Aggregator.prototype._hasComponent = function(uuid) {
				return jQuery.inArray(uuid, this.getComponentUUIDs()) != -1;
			};

			/**
			 *
			 * @override
			 * @public
			 * @param {ContextInformation} contextInformation
			 * @returns {boolean}
			 */
			Aggregator.prototype.doesSatisfyKindOf = function(contextInformation) {
				var componentUUIDs = this.getComponentUUIDs();
				var doesSatisfy = false;

				for (var index in componentUUIDs) {
					var theComponent = this._discoverer.getComponent(componentUUIDs[index]);
					if (theComponent.doesSatisfyKindOf(contextInformation)) {
						doesSatisfy = true;
					}
				}

				return doesSatisfy;
			};

			/**
			 * Searches for components that can satisfy the requested contextual information. Through recursion it is possible to search
			 * for components that satisfy the contextual information of the components that have been found in the process.
			 *
			 * @private
			 * @param {ContextInformationList} unsatisfiedContextInformation A list of contextual information that components should be searched for.
			 * @param {boolean} all If true all contextual information must be satisfied by a single component.
			 * @param {Array} componentTypes An array of components classes that should be searched for (e.g. Widget, Interpreter and Aggregator).
			 */
			Aggregator.prototype._getComponentsForUnsatisfiedContextInformation = function(unsatisfiedContextInformation, all, componentTypes) {
				// ask the discoverer for components that satisfy the requested components
				this.log("needs to satisfy contextual information and will ask the Discoverer.");
				this._discoverer.getComponentsForUnsatisfiedContextInformation(this.getId(), unsatisfiedContextInformation, all, componentTypes);
			};

			/**
			 * After the aggregator finished its setup start searching for component that satisfy the contextual information that where requested.
			 *
			 * @public
			 * @virtual
			 */
			Aggregator.prototype.didFinishSetup = function() {
				var unsatisfiedContextInformation = this.getOutputData().clone();

				// get all components that satisfy contextual information
				this._getComponentsForUnsatisfiedContextInformation(unsatisfiedContextInformation, false, [Widget, Interpreter]);
				this.log("Unsatisfied contextual information: "+unsatisfiedContextInformation.size());
				this.log("Satisfied contextual information: "+this.getOutputData().size());
				this.log("Interpretations "+this._interpretations.length);
			};

			/**
			 * Updates all the widgets referenced by the aggregator and calls the provided callback afterwards.
			 *
			 * @virtual
			 * @param {Function} callback The callback to query after all the widget where updated.
			 */
			Aggregator.prototype.queryReferencedWidgets = function(callback) {
				this.log("will query all referenced Widgets ("+this._widgets.length+").");

				var self = this;
				var completedQueriesCounter = 0;

				if (this._widgets.length > 0) {
					for (var index in this._widgets) {
						var theWidgetId = this._widgets[index];
						this.queryReferencedWidget(theWidgetId, function () {
							self.log("reports that "+self._discoverer.getWidget(theWidgetId).getName()+" did finish its work.");

							completedQueriesCounter++;
							if (completedQueriesCounter == self._widgets.length) {
								if (callback && typeof(callback) == 'function') {
									callback(self.getOutputContextInformation());
								}
							}
						});
					}
				} else {
					if (callback && typeof(callback) == 'function') {
						callback(self.getOutputContextInformation());
					}
				}
			};

			/**
			 * Let's all connected interpreters interpret data.
			 *
			 * @param {function} callback The callback to query after all the interpreters did interpret data.
			 */
			Aggregator.prototype.queryReferencedInterpretations = function(callback) {
				this.log("will query all referenced Interpreters ("+this._interpretations.length+").");

				/**
				 * @type {Aggregator}
				 */
				var self = this;
				var completedQueriesCounter = 0;

				if (this._interpretations.length > 0) {
					for (var index in this._interpretations) {
						var theInterpretation = this._interpretations[index];

						self.queryReferencedInterpretation(theInterpretation, function() {
							completedQueriesCounter++;
							if (completedQueriesCounter == self._interpretations.length) {
								if (callback && typeof(callback) == 'function') {
									callback(self.getOutputContextInformation());
								}
							}
						});
					}
				} else {
					if (callback && typeof(callback) == 'function') {
						callback(self.getOutputContextInformation());
					}
				}
			};

			/**
			 * Query all referenced widgets and afterwards all connected interpreters.
			 *
			 * @param {Function} callback the callback to query after all components did finish their work.
			 */
			Aggregator.prototype.queryReferencedComponents = function(callback) {
				this.log("I will query all referenced Components.");

				var self = this;

				this.queryReferencedWidgets(function(_contextInformation) {
					self.queryReferencedInterpretations(function(_contextInformation) {
						if (callback && typeof(callback) == 'function') {
							callback(_contextInformation);
						}
					});
				});
			};

			return Aggregator;
		})();
	}
);
define('equals',['conditionMethod'], function(ConditionMethod){
	return (function() {
		/**
		 * @implements {ConditionMethod}
		 * @classdesc This class is the conditionMethod equals. It compares the values of two attributes.
		 * @constructs Equals
		 */
		function Equals() {
			ConditionMethod.call(this);

			return this;
		}

		Equals.prototype = Object.create(ConditionMethod.prototype);

		/**
		 * Processes the equation.
		 *
		 * @param {*} reference Is not used.
		 * @param {*} firstValue Value (from an attribute) that should be compared.
		 * @param {*} secondValue Value (from an attribute) for comparison.
		 * @returns {Boolean}
		 */
		Equals.prototype.process = function(reference, firstValue, secondValue){
			return firstValue === secondValue;
		};

		return Equals;
	})();
});
/**
 * This module represents the conditionMethod UnEquals.
 * 
 * @module Condition
 */
define('unequals',['conditionMethod'], function(ConditionMethod){
	return (function() {
		/**
		 * @implements {ConditionMethod}
		 * @classdesc This class is the conditionMethod equals. It compares the values of two attributes.
		 * @constructs UnEquals
		 */
		function UnEquals() {
			ConditionMethod.call(this);

			return this;
		}

		UnEquals.prototype = Object.create(ConditionMethod.prototype);

		/**
		 * Processes the equation.
		 *
		 * @param {*} reference Is not used.
		 * @param {*} firstValue Value (from an attribute) that should be compared.
		 * @param {*} secondValue Value (from an attribute) for comparison.
		 * @returns {boolean}
		 */
		UnEquals.prototype.process = function(reference, firstValue, secondValue){
			return firstValue !== secondValue;
		};

		return UnEquals;
	})();
});
/**
 * This module represents the helper class Translation. 
 * 
 * @module Translation
 */
define('translation', ['contextInformation'], function(ContextInformation) {
	return (function() {
		/**
		 * This class represents a translation tuple. It holds two synonymous contextual information.
		 *
		 * @requires ContextInformation
		 * @class Translation
		 */
		function Translation(fromContextInformation, toContextInformation) {
			/**
			 *
			 * @type {?ContextInformation}
			 * @private
			 */
			this._fromContextInformation = null;

			/**
			 *
			 * @type {?ContextInformation}
			 * @private
			 */
			this._toContextInformation = null;

			if (fromContextInformation instanceof ContextInformation && toContextInformation instanceof ContextInformation) {
				this._fromContextInformation = fromContextInformation;
				this._toContextInformation = toContextInformation;
			}

			return this;
		}

		/**
		 * Return the target synonym.
		 *
		 * @returns {ContextInformation} The synonymous contextual information.
		 */
		Translation.prototype.getSynonym = function() {
			return this._toContextInformation;
		};

		/**
		 * Return the original contextual information for which a translation exists.
		 *
		 * @returns {ContextInformation} The original contextual information
		 */
		Translation.prototype.getOrigin = function() {
			return this._fromContextInformation;
		};

		/**
		 * Look for a translation and return true if one exists.
		 *
		 * @param {ContextInformation} contextInformation The contextual information whose synonym is queried.
		 * @returns {boolean}
		 */
		Translation.prototype.hasTranslation = function(contextInformation) {
			return this._fromContextInformation.isKindOf(contextInformation);
		};

		/**
		 * Look for a translation result and return true if one exists.
		 *
		 * @param {ContextInformation} contextInformation The contextual information whose synonym is queried
		 * @returns {boolean}
		 */
		Translation.prototype.isTranslation = function(contextInformation) {
			return this._toContextInformation.isKindOf(contextInformation);
		};

		/**
		 * Look for a translation and return the (translated) contextual information.
		 *
		 * @param {ContextInformation} contextInformation The contextual information whose synonym is queried
		 * @returns {ContextInformation}
		 */
		Translation.prototype.translate = function(contextInformation) {
			if (this.hasTranslation(contextInformation) && !contextInformation.hasSynonym(this._toContextInformation)) {
				return contextInformation.withSynonym(this._toContextInformation);
			}
			else if (this.isTranslation(contextInformation) && !contextInformation.hasSynonym(this._fromContextInformation)) {
				return contextInformation.withSynonym(this._fromContextInformation);
			}
			else {
				return contextInformation;
			}
		};

		return Translation;
	})();
});
define('discoverer',['contextInformation', 'contextInformationList', 'translation', 'parameter', 'parameterList', 'widget', 'interpreter', 'aggregator',  'interpretation' ],
	function(ContextInformation, ContextInformationList, Translation, Parameter, ParameterList, Widget, Interpreter, Aggregator, Interpretation) {
		return (function() {
			/**
			 * The Discoverer handles requests for components and contextual information.
			 * All known components given in the associated functions will be registered as startup.
			 *
			 * @class Discoverer
			 */
			function Discoverer(widgets, interpreters, translations) {
				/**
				 * List of available Widgets.
				 *
				 * @type {Array}
				 * @private
				 */
				this._widgets = [];

				/**
				 * List of unregistered Widgets
				 *
				 * @type (Array)
				 * @private
				 */
				this._unregisteredWidgets = widgets;


				/**
				 * List of available Aggregators.
				 *
				 * @type {Array}
				 * @private
				 */
				this._aggregators = [];

				/**
				 * List of available Interpreter.
				 *
				 * @type {Object}
				 * @private
				 */
				this._interpreters = [];

				/**
				 * List of unregistered Interpreters
				 *
				 * @type (Array)
				 * @private
				 */
				this._unregisteredInterpreters = interpreters;

				/**
				 * List of translations or synonymous contextual information, respectively.
				 *
				 * @type {Array}
				 * @private
				 */
				this._translations = [];

				// build translations from input array
                for (var i in translations) {
					// get translation (an array) from array of translations
                    var translationArray = translations[i];
					// check for correct cardinality
                    if (translationArray.length != 2)
                        throw new Error("Translations must consist of exactly 2 contextual information!");
					// check for correct number of contextual information building blocks
					for (var j in translationArray) {
                        if (translationArray[j].length > 3 || translationArray[j].length < 2)
                            throw new Error("Please provide a name, type and (optional) list of parameters!");
                    }
					// build contextual information from arrays containing name, type (and parameters)
                    var firstContextInformation = this.buildContextInformation(
                        translationArray[0][0],
                        translationArray[0][1],
                        translationArray[0][2],
                        false
                    );
                    var secondContextInformation = this.buildContextInformation(
                        translationArray[1][0],
                        translationArray[1][1],
                        translationArray[1][2],
                        false
                    );
					// add built contextual information to translations
                    this._translations.push(new Translation(firstContextInformation, secondContextInformation));
                }

				return this;
			}

			/**
			 * Registers the specified component.
			 *
			 * @param {Widget|Aggregator|Interpreter} component the component that should be registered
			 */
			Discoverer.prototype.registerNewComponent = function(component) {
				if (component instanceof Aggregator && this.getAggregator(component.getId()) == null) this._aggregators.push(component);
				if (component instanceof Widget && !(component instanceof Aggregator) && this.getWidget(component.getId()) == null) this._widgets.push(component);
				if (component instanceof Interpreter && this.getInterpreter(component.getId()) == null) this._interpreters.push(component);
			};

			/**
			 * Deletes a component from the Discoverer.
			 *
			 * @param {string} componentId id of the component that should be registered
			 */
			Discoverer.prototype.unregisterComponent = function(componentId) {
				for (var wi in this._widgets) {
					var theWidget = this._widgets[wi];
					if (componentId == theWidget.getId()) this._widgets.splice(wi, 1);
				}
				for (var ii in this._interpreters) {
					var theInterpreter = this._interpreters[ii];
					if (componentId == theInterpreter.getId()) this._interpreters.splice(ii, 1);
				}
				for (var ai in this._aggregators) {
					var theAggregator= this._aggregators[ai];
					if (componentId == theAggregator.getId()) this._aggregators.splice(ai, 1);
				}
			};

			/**
			 * Returns the widget for the specified id.
			 *
			 * @param {string} widgetId id of the component that should be returned
			 * @returns {?Widget}
			 */
			Discoverer.prototype.getWidget = function(widgetId) {
				for (var index in this._widgets) {
					var theWidget = this._widgets[index];
					if (theWidget.getId() == widgetId) return theWidget;
				}
				return null;
			};

			/**
			 * Returns the aggregator for the specified id.
			 *
			 * @param {string} aggregatorId id of the component that should be returned
			 * @returns {?Aggregator}
			 */
			Discoverer.prototype.getAggregator = function(aggregatorId) {
				for (var index in this._aggregators) {
					var theAggregator = this._aggregators[index];
					if (theAggregator.getId() == aggregatorId) return theAggregator;
				}
				return null;
			};

			/**
			 * Returns the interpreter for the specified id.
			 *
			 * @param {string} interpreterId id of the component that should be returned
			 * @returns {Interpreter}
			 */
			Discoverer.prototype.getInterpreter = function(interpreterId) {
				for (var index in this._interpreters) {
					var theInterpreter = this._interpreters[index];
					if (theInterpreter.getId() == interpreterId) return theInterpreter;
				}
				return null;
			};

			/**
			 * Returns all registered components (widget, aggregator and interpreter).
			 *
			 * @param {Array} componentTypes Component types to get descriptions for. Defaults to Widget, Interpreter and Aggregator.
			 * @returns {Array}
			 */
			Discoverer.prototype.getComponents = function(componentTypes) {
				if (typeof componentTypes == "undefined") componentTypes = [Widget, Interpreter, Aggregator];
				var response = [];
				if (jQuery.inArray(Widget, componentTypes) != -1) response = response.concat(this._widgets);
				if (jQuery.inArray(Aggregator, componentTypes) != -1) response = response.concat(this._aggregators);
				if (jQuery.inArray(Interpreter, componentTypes) != -1) response = response.concat(this._interpreters);
				return response;
			};

			/**
			 * Returns the instance (widget, aggregator or interpreter) for the specified id.
			 *
			 * @param {string} componentId id of the component that should be returned
			 * @returns {?(Widget|Aggregator|Interpreter)}
			 */
			Discoverer.prototype.getComponent = function(componentId) {
				var theWidget = this.getWidget(componentId);
				if (theWidget) {
					return theWidget;
				}
				var theAggregator = this.getAggregator(componentId);
				if (theAggregator) {
					return theAggregator;
				}
				var theInterpreter = this.getInterpreter(componentId);
				if (theInterpreter) {
					return theInterpreter;
				}
				return null;
			};

			/**
			 * Returns all registered components that have the specified contextual information as
			 * outputContextInformation. It can be chosen between the verification of
			 * all contextual information or at least one information.
			 *
			 * @param {ContextInformationList|Array.<ContextInformation>} contextInformationListOrArray A list of searched contextual information.
			 * @param {Boolean} all Selection of the verification mode.
			 * @param {Array} componentTypes Components types to search for.
			 * @returns {Array}
			 */
			Discoverer.prototype.getRegisteredComponentsByContextInformation = function(contextInformationListOrArray, all, componentTypes) {
				var componentList = [];
				var list = [];
				if (typeof componentTypes == "undefined") componentTypes = [Widget, Interpreter, Aggregator];
				if (contextInformationListOrArray instanceof Array) {
					list = contextInformationListOrArray;
				} else if (contextInformationListOrArray instanceof ContextInformationList) {
					list = contextInformationListOrArray.getItems();
				}
				if (typeof list != "undefined") {
					var components = this.getComponents(componentTypes);
					for (var i in components) {
						var theComponent = components[i];
						if(all && this._containsAllContextInformation(theComponent, list)) {
							componentList.push(theComponent);
						} else if(!all && this._containsAtLeastOneContextInformation(theComponent, list)) {
							componentList.push(theComponent);
						}
					}
				}
				return componentList;
			};

			/**
			 * Returns an array of all translations known to the discoverer.
			 *
			 * @returns {Array}
			 */
			Discoverer.prototype.getTranslations = function() {
				return this._translations;
			};

			/**
			 * Builds a new {ContextInformation} from given name, type and parameters,
			 * adding known translations to its synonyms.
			 *
			 * @param {string} contextInformationName
			 * @param {string} contextInformationDataType
			 * @param {array} [parameterList=[]]
             * @param {boolean} [withSynonyms=true]
			 * @returns {ContextInformation}
			 */
			Discoverer.prototype.buildContextInformation = function(contextInformationName, contextInformationDataType, parameterList, withSynonyms) {
				if (typeof withSynonyms == 'undefined') withSynonyms = true;
				if (typeof parameterList == 'undefined') parameterList = [];

                if (typeof contextInformationName != 'string' || typeof contextInformationDataType != 'string')
                    throw new Error("Parameters name and type must be of type String!");

                var newContextInformation = new ContextInformation(true).withName(contextInformationName).withDataType(contextInformationDataType);

				for (var i = 0; i < parameterList.length; i++) {
					var param = parameterList[i];
					var value = param[2];
					var type = param[1];
					var key = param[0];
					if (typeof key != 'undefined' && typeof value != 'undefined')
						newContextInformation = newContextInformation.withParameter(new Parameter().withKey(key).withDataType(type).withValue(value));
				}

                if (withSynonyms) {
                    for (var index in this._translations) {
                        var translation = this._translations[index];
						newContextInformation = translation.translate(newContextInformation);
                    }
                }

				return newContextInformation;
			};


			/***********************************************************************
			 * Helper *
			 **********************************************************************/
			/**
			 * Helper: Verifies whether a component description contains all searched contextual information.
			 *
			 * @private
			 * @param {Widget|Interpreter|Aggregator} component description of a component
			 * @param {Array} list searched contextual information
			 * @returns {boolean}
			 */
			Discoverer.prototype._containsAllContextInformation = function(component, list) {
				for (var j in list) {
					var contextInformation = list[j];
					if (!component.doesSatisfyKindOf(contextInformation)) {
						return false;
					}
				}
				return true;
			};

			/**
			 * Helper: Verifies whether a component description contains at least on searched contextual information.
			 *
			 * @private
			 * @param {Widget|Interpreter|Aggregator} component description of a component
			 * @param {Array} list searched contextual information
			 * @returns {boolean}
			 */
			Discoverer.prototype._containsAtLeastOneContextInformation = function(component, list) {
				for (var j in list) {
					var contextInformation = list[j];
					if (component.doesSatisfyKindOf(contextInformation)) {
						return true;
					}
				}
				return false;
			};

			/**
			 * Searches for components that can satisfy the requested contextual information. Searches recursively through all
			 * registered and unregistered components and initiates them.
			 *
			 * @param {String} aggregatorId The aggregator's ID
			 * @param {ContextInformationList} unsatisfiedContextInformation A list of contextual information that components should be searched for.
			 * @param {Boolean} all If true all contextual information must be satisfied by a single component.
			 * @param {Array} componentTypes An array of components classes that should be searched for (e.g. Widget, Interpreter and Aggregator).
			 */
			Discoverer.prototype.getComponentsForUnsatisfiedContextInformation = function(aggregatorId, unsatisfiedContextInformation, all, componentTypes){
				// the discoverer gets a list of contextual information to satisfy
				console.log('Discoverer: I will look for components that satisfy the following contextual information: '+unsatisfiedContextInformation.getItems()+'.' );
				// look at all the already registered components
				this._getRegisteredComponentsForUnsatisfiedContextInformation(aggregatorId, unsatisfiedContextInformation, all, componentTypes);
				// look at all unregistered components
				this._getUnregisteredComponentsForUnsatisfiedContextInformation(aggregatorId, unsatisfiedContextInformation);
			};

			/**
			 * Searches for registered components that satisfy the requested contextual information.
			 *
			 * @param {String} aggregatorId The aggregator's ID
			 * @param {ContextInformationList} unsatisfiedContextInformation A list of contextual information that components should be searched for.
			 * @param {Boolean} all If true all contextual information must be satisfied by a single component.
			 * @param {Array} componentTypes An array of components classes that should be searched for (e.g. Widget, Interpreter and Aggregator).
			 * @private
			 */
			Discoverer.prototype._getRegisteredComponentsForUnsatisfiedContextInformation = function(aggregatorId, unsatisfiedContextInformation, all, componentTypes) {
				var theAggregator = this.getAggregator(aggregatorId);
				console.log("Discoverer: Let's look at my registered components.");

				var relevantComponents = this.getRegisteredComponentsByContextInformation(unsatisfiedContextInformation, all, componentTypes);
				console.log("Discoverer: I found " + relevantComponents.length + " registered component(s) that might satisfy the requested contextual information.");

				//iterate over the found components
				for(var index in relevantComponents) {
					var theComponent = relevantComponents[index];
					console.log("Discoverer: Let's look at component "+theComponent.getName()+".");

					// if the component was added before, ignore it
					if (!theAggregator._hasComponent(theComponent.getId())) {
						// if component is a widget and it wasn't added before, subscribe to its callbacks
						if (theComponent instanceof Widget) {
							theAggregator.addWidgetSubscription(theComponent);
							console.log("Discoverer: I found "+theComponent.getName()+" and the Aggregator did subscribe to it.");
							this._removeContextInformationSatisfiedByWidget(aggregatorId, theComponent, unsatisfiedContextInformation);
						} else if (theComponent instanceof Interpreter) { // if the component is an interpreter and all its input contextual information can be satisfied, add the interpreter
							console.log("Discoverer: It's an Interpreter.");

							if (this._checkInterpreterInputContextInformation(aggregatorId, theComponent)) {
								// remove satisfied contextual information
								this._removeContextInformationSatisfiedByInterpreter(aggregatorId, theComponent, unsatisfiedContextInformation);
							} else {
								console.log("Discoverer: I found a registered Interpreter but I couldn't satisfy the required contextual information.");
								for (var j in theComponent.getInputContextInformation().getItems()) {
									console.log("Discoverer: It is missing " + theComponent.getInputContextInformation().getItems()[j] + ".");
								}
							}
						} else {
							console.log("Discoverer: It seems that the component was added before.");
						}
					}
				}
			};

			/**
			 * Searches for unregistered components that satisfy the requested contextual information.
			 *
			 * @param {String} aggregatorId The aggregator's ID
			 * @param {ContextInformationList} unsatisfiedContextInformation A list of contextual information that components should be searched for.
			 * @private
			 */
			Discoverer.prototype._getUnregisteredComponentsForUnsatisfiedContextInformation = function(aggregatorId, unsatisfiedContextInformation) {
				var theAggregator = this.getAggregator(aggregatorId);
				console.log("Discoverer: Let's look at the unregistered components.");

				//check all Widget's output contextual information
				for(var widgetIndex in this._unregisteredWidgets){
					var theWidget = this._unregisteredWidgets[widgetIndex];
					// check i
					if (this._checkComponentRequirements(theWidget)) {
						for(var unsatisfiedContextInformationIndex in unsatisfiedContextInformation.getItems()){
							var theUnsatisfiedContextInformation = unsatisfiedContextInformation.getItems()[unsatisfiedContextInformationIndex];
							//if a Widget can satisfy the ContextInformation, register it and subscribe the Aggregator

							//create temporary OutputContextInformationList
							var tempWidgetOutList = ContextInformationList.fromContextInformationDescriptions(this, theWidget.description.out);

							for(var tempWidgetOutListIndex in tempWidgetOutList.getItems()) {
								if (theUnsatisfiedContextInformation.isKindOf(tempWidgetOutList.getItems()[tempWidgetOutListIndex])) {
									console.log("Discoverer: I have found an unregistered "+theWidget.name+".");
									var newWidget = new theWidget(this, tempWidgetOutList);
									theAggregator.addWidgetSubscription(newWidget);
									console.log("Discoverer: I registered "+theWidget.name+" and the Aggregator subscribed to it.");
									// remove satisfied contextual information
									this._removeContextInformationSatisfiedByWidget(aggregatorId, newWidget, unsatisfiedContextInformation);
								}
							}
						}
					}
				}

				//check all interpreters' output contextual information
				for (var index in this._unregisteredInterpreters) {
					var theInterpreter = this._unregisteredInterpreters[index];
					if (this._checkComponentRequirements(theInterpreter)) {
						for (var unsatisfiedContextInformationIndex in unsatisfiedContextInformation.getItems()) {
							var theUnsatisfiedContextInformation = unsatisfiedContextInformation.getItems()[unsatisfiedContextInformationIndex];
							//create temporary outputContextInformationList
							var tempOutList = ContextInformationList.fromContextInformationDescriptions(this, theInterpreter.description.out);
							//create temporary inContextInformationList
							var tempInList = ContextInformationList.fromContextInformationDescriptions(this, theInterpreter.description.in);

							for (var tempOutputContextInformationIndex in tempOutList.getItems()) {
								if (theUnsatisfiedContextInformation.isKindOf(tempOutList.getItems()[tempOutputContextInformationIndex])) {
									console.log("Discoverer: I have found an unregistered "+theInterpreter.name+" that might satisfy the requested contextual information.");

									//if an interpreter can satisfy the ContextInformation, check if the inContextInformation are satisfied
									if (this._checkInterpreterInputContextInformation(aggregatorId, theInterpreter)) {
										var newInterpreter = new theInterpreter(this, tempInList, tempOutList);
										//theAggregator.addWidgetSubscription(newInterpreter);
										console.log("Discoverer: I registered the Interpreter \""+theInterpreter.name+"\" .");
										// remove satisfied contextual information
										this._removeContextInformationSatisfiedByInterpreter(aggregatorId, newInterpreter, unsatisfiedContextInformation);
									} else {
										console.log("Discoverer: I found an unregistered Interpreter but I couldn't satisfy the required contextual information.");
									}
								}
							}
						}
					}
				}
			};

			/**
			 *
			 * @param aggregatorId
			 * @param theInterpreter
			 * @returns {boolean}
			 * @private
			 */
			Discoverer.prototype._checkInterpreterInputContextInformation = function(aggregatorId, theInterpreter) {
				var theAggregator = this.getComponent(aggregatorId);
				var canSatisfyInContextInformation = true;
				var contextInformation;
				if (theInterpreter instanceof Interpreter) {
					contextInformation = theInterpreter.getInputContextInformation().getItems();
				} else {
					contextInformation = ContextInformationList.fromContextInformationDescriptions(this, theInterpreter.description.in).getItems();
				}

				for (var contextInformationIdentifier in contextInformation) {
					// get the contextual information
					var theContextInformation = contextInformation[contextInformationIdentifier];
					console.log("Discoverer: The Interpreter needs the contextual information: "+theContextInformation.toString(true)+".");
					// if required contextual information is not already satisfied by the aggregator search for components that do
					if (!theAggregator.doesSatisfyKindOf(theContextInformation)) {
						console.log("Discoverer: The Aggregator doesn't satisfy "+theContextInformation.toString(true)+", but I will search for components that do.");
						var newContextInformationList = new ContextInformationList();
						newContextInformationList.put(theContextInformation);
						this.getComponentsForUnsatisfiedContextInformation(aggregatorId, newContextInformationList, false, [Widget, Interpreter]);
						// if the contextual information still can't be satisfied drop the interpreter
						if (!theAggregator.doesSatisfyKindOf(theContextInformation)) {
							console.log("Discoverer: I couldn't find a component to satisfy "+theContextInformation.toString(true)+". Dropping interpreter.");
							canSatisfyInContextInformation = false;
							break;
						}
					} else {
						console.log("Discoverer: It seems that the Aggregator already satisfies the contextual information "+theContextInformation.toString(true)+". Will move on.");
					}
				}

				return canSatisfyInContextInformation;
			};

			/**
			 *
			 * @param aggregatorId
			 * @param theWidget
			 * @param unsatisfiedContextInformation
			 * @private
			 */
			Discoverer.prototype._removeContextInformationSatisfiedByWidget = function(aggregatorId, theWidget, unsatisfiedContextInformation) {
				var theAggregator = this.getAggregator(aggregatorId);

				var contextInformation = theWidget.getOutputContextInformation().getItems();
				for (var contextInformationIndex in contextInformation) {
					var theContextInformation = contextInformation[contextInformationIndex];
					// add the contextual information type to the aggregator's list of handled contextual information
					if (!theAggregator.getOutputContextInformation().containsKindOf(theContextInformation)) theAggregator.addOutputContextInformation(theContextInformation);
					console.log("Discoverer: The Aggregator can now satisfy contextual information "+theContextInformation.toString(true)+" with the help of "+theWidget.getName()+".");
					unsatisfiedContextInformation.removeContextInformationOfKind(theContextInformation);
				}
			};

			/**
			 *
			 * @param aggregatorId
			 * @param theInterpreter
			 * @param unsatisfiedContextInformation
			 * @private
			 */
			Discoverer.prototype._removeContextInformationSatisfiedByInterpreter = function(aggregatorId, theInterpreter, unsatisfiedContextInformation) {
				var theAggregator = this.getAggregator(aggregatorId);

				var contextInformation = theInterpreter.getOutputContextInformation().getItems();
				for (var contextInformationIndex in contextInformation) {
					var theContextInformation = contextInformation[contextInformationIndex];
					// add the contextual informationto the aggregator's list of handled contextual information
					for (var unsatisfiedContextInformationIndex in unsatisfiedContextInformation.getItems()) {
						var theUnsatisfiedContextInformation = unsatisfiedContextInformation.getItems()[unsatisfiedContextInformationIndex];
						if (theUnsatisfiedContextInformation.isKindOf(theContextInformation)) {
							if (!theAggregator.getOutputContextInformation().containsKindOf(theContextInformation)) theAggregator.addOutputContextInformation(theContextInformation);
							console.log("Discoverer: The Aggregator can now satisfy contextual information "+theContextInformation.toString(true)+" with the help of "+theInterpreter.getName()+".");
							theAggregator._interpretations.push(new Interpretation(theInterpreter.getId(), theInterpreter.getInputContextInformation(), new ContextInformationList().withItems([theUnsatisfiedContextInformation])));
						}
					}
					unsatisfiedContextInformation.removeContextInformationOfKind(theContextInformation, true);
				}
			};

			/**
			 *
			 * @returns {ContextInformationList}
			 */
			Discoverer.prototype.getPossibleContextInformation = function() {
				var possibleContextInformation = new ContextInformationList();

				// iterate over all unregistered widgets
				for (var widgetIndex in this._unregisteredWidgets) {
					var theWidget = this._unregisteredWidgets[widgetIndex];
					for (var contextInformationDescriptionIndex in theWidget.description.out) {
						var theContextInformation = ContextInformation.fromContextInformationDescription(this, theWidget.description.out[contextInformationDescriptionIndex]);
						possibleContextInformation.putIfKindOfNotContained(theContextInformation);
					}
				}

				// iterate over all unregistered interpreters
				for (var interpreterIndex in this._unregisteredInterpreters) {
					var theInterpreter = this._unregisteredInterpreters[interpreterIndex];
					for (var outputContextInformationDescriptionIndex in theInterpreter.description.out) {
						var theContextInformation = ContextInformation.fromContextInformationDescription(this, theInterpreter.description.out[outputContextInformationDescriptionIndex]);
						possibleContextInformation.putIfKindOfNotContained(theContextInformation);
					}
				}

				return possibleContextInformation;
			};

			/**
			 *
			 *
			 * @param contextInformationNames
			 * @returns {ContextInformationList}
			 */
			Discoverer.prototype.getContextInformationWithNames = function(contextInformationNames) {
				return ContextInformationList.fromContextInformationNames(this, contextInformationNames);
			};

			/**
			 *
			 * @param {Component} theComponent
			 * @returns {boolean}
			 * @private
			 */
			Discoverer.prototype._checkComponentRequirements = function(theComponent) {
				if (theComponent.description.requiredObjects && theComponent.description.requiredObjects instanceof Array) {
					for (var index in theComponent.description.requiredObjects) {
						var theRequiredObject = theComponent.description.requiredObjects[index];
						var theRequiredObjectSplit = theRequiredObject.split(".");

						if (theRequiredObjectSplit.length > 1) {
							var scope = window;
							for (var objectIndex in theRequiredObjectSplit) {
								var objectComponent = theRequiredObjectSplit[objectIndex];
								if (typeof scope[objectComponent] !== "undefined") {
									scope = scope[objectComponent]
								} else {
									console.log("Discoverer: A component requires "+theRequiredObject+", but it's not available.");
									return false;
								}
							}
						} else {
							if (typeof window[theRequiredObject] === "undefined") {
								console.log("Discoverer: A component requires "+theRequiredObject+", but it's not available.");
								return false;
							}
						}
					}
				}
				return true;
			};

			return Discoverer;
		})();
	}
);
/**
 * Created by tobias on 30.09.15.
 */
define('callable',['component'],
    function(Component) {
        return (function() {

            /**
             * @type {object}
             * @public
             */
            Callable.description = {
                in: [
                    {
                        'name':'',
                        'type':''
                    }
                ],
                out: [
                    {
                        'name':'',
                        'type':''
                    }
                ],
                requiredObjects: []
            };

            /**
             * Generates the id and initializes the (in and out) types and values.
             *
             * @abstract
             * @classdesc The Widget handles the access to sensors.
             * @class Callable
             */
            function Callable(discoverer) {
                Component.call(this, discoverer);

                /**
                 * Name of the callable.
                 *
                 * @type {string}
                 * @private
                 */
                this.name = 'Callable';

                return this;
            }

            Callable.prototype = Object.create(Component.prototype);
            Callable.prototype.constructor = Callable;

            return Callable;
        })();
    }
);
	define('contactJS',['retrievalResult',
			'storage',
			'aggregator',
			'data',
			'dataList',
		    'contextInformation',
		    'contextInformationList',
		    'parameter',
		    'parameterList',		
		    'condition',
		    'conditionList',
		    'conditionMethod',
		    'equals',
            'unequals',
		    'discoverer',
		    'translation',
			'queryable',
			'callable',
		    'interpreter',
		    'interpreterResult',
		    'callback',   
		    'callbackList',
		    'subscriber',
		    'subscriberList',
		    'widget',
		    'abstractList'], 
		function(RetrievalResult,
			Storage,
			Aggregator,
			Data,
			DataList,
			ContextInformation,
			ContextInformationList,
			Parameter,
			ParameterList,
			Condition,
			ConditionList,
			ConditionMethod,
			Equals,
			UnEquals,
			Discoverer,
			Translation,
			Queryable,
			Callable,
			Interpreter,
			InterpreterResult,
			Callback,
			CallbackList,
			Subscriber,
			SubscriberList,
			Widget,
			AbstractList) {
		
	// Object Contructor
	var contactJS = function(obj) {
		return obj;
	};
	contactJS.VERSION = '3.0.0';
	// Methods
	contactJS.RetrievalResult = RetrievalResult;
	contactJS.Storage = Storage;
	contactJS.Aggregator = Aggregator;
	contactJS.Data = Data;
	contactJS.ContextInformation = ContextInformation;
	contactJS.ContextInformationList = ContextInformationList;
	contactJS.Parameter = Parameter;
	contactJS.ParameterList = ParameterList;
	contactJS.Condition = Condition;
	contactJS.ConditionList = ConditionList;
	contactJS.ConditionMethod = ConditionMethod;
	contactJS.Equals = Equals;
    contactJS.UnEquals = UnEquals;
	contactJS.Discoverer = Discoverer;
	contactJS.Translation = Translation;
	contactJS.Queryable = Queryable;
	contactJS.Callable = Callable;
	contactJS.Interpreter = Interpreter;
	contactJS.InterpreterResult = InterpreterResult;
	contactJS.Callback = Callback;
	contactJS.CallbackList = CallbackList;
	contactJS.Subscriber = Subscriber;
	contactJS.SubscriberList = SubscriberList;
	contactJS.Widget = Widget;
	contactJS.AbstractList = AbstractList;
	return contactJS;
});
  define('jquery', function() {
    return $;
  });
  define('MathUuid', function() {
    return MathUuid;
  });
 
  return require('contactJS');
}));