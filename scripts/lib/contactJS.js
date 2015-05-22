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
			if (item.constructor === this._type) {
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
define('parameter',[],function(){
	return (function() {
		/**
		 * @classdesc Parameter specifies the Attributes to that these are associated.
		 * @constructs Parameter
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
		Parameter.prototype.getKey = function(){
			return this._key;
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
			if(typeof newKey === 'string'){
				this._key = newKey;
			}
		};

		/**
		 * Sets the value.
		 *
		 * @public
		 * @param {string} newValue Value
		 */
		Parameter.prototype.setValue = function(newValue){
			if(typeof newValue === 'string'){
				this._value = newValue;
			}
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
					return this.getKey() == parameter.getKey();
				} else {
					return this.getKey() == parameter.getKey() && this.getValue() == parameter.getValue();
				}
			}
			return false;
		};

		/**
		 * Returns a description of the parameter.
		 * Format: [ParameterName:ParameterValue]
		 *
		 * @example [CP_UNIT:KILOMETERS]
		 */
		Parameter.prototype.toString = function() {
			return "["+this.getKey()+":"+this.getValue()+"]";
		};

		return Parameter;
	})();
});
define('parameterList',['abstractList', 'parameter'], function(AbstractList, Parameter) {
	return (function() {
		/**
		 *
		 * @classdesc This class represents a list for Parameter.
		 * @extends AbstractList
		 * @constructs ParameterList
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
		 * @public
		 * @returns {{}}
		 */
		ParameterList.prototype.getItemsAsJson = function() {
			var parameters = {};
			for (var key in this._items) {
				var theParameter = this._items[key];
				parameters[theParameter.getKey()] = theParameter.getValue();
			}
			return parameters;
		};

		/**
		 * Return true if the list contains a parameter that is set at runtime.
		 *
		 * @public
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
/**
 * @module Attribute
 */
define('attribute',['parameterList'], function(ParameterList) {
    return (function() {
        /**
         * Initializes the Attribute.
         *
         * @classdesc Attribute defines name, type (string, double,...) an associated parameter of an attribute.
         * @constructs Attribute
         */
        function Attribute() {
            /**
             * Name of the Attribute.
             *
             * @type {String}
             * @private
             */
            this._name = '';

            /**
             * Defines the type of the Attribute (i.e String, Double,...).
             *
             * @type {string}
             * @private
             */
            this._type = '';

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
             * @type {string}
             * @private
             */
            this._value = 'NO_VALUE';

            /**
             * Time when the value was set.
             *
             * @type {Date}
             * @private
             */
            this._timestamp = new Date();

            return this;
        }

        /**
         * Builder for name.
         *
         * @param {String} name The attribute name to build with.
         * @returns {Attribute}
         */
        Attribute.prototype.withName = function(name){
            this.setName(name);
            return this;
        };

        /**
         * Builder for type.
         *
         * @param {String} type The attribute type to build with.
         * @returns {Attribute}
         */
        Attribute.prototype.withType = function(type){
            this.setType(type);
            return this;
        };

        /**
         * Builder for one parameter.
         *
         * @param {Parameter} parameter The parameter to build with.
         * @returns {Attribute}
         */
        Attribute.prototype.withParameter = function(parameter){
            this.addParameter(parameter);
            return this;
        };

        /**
         * Builder for parameterList.
         *
         * @param {(ParameterList|Array)} parameterList ParameterList
         * @returns {Attribute}
         */
        Attribute.prototype.withParameters = function(parameterList){
            this.setParameters(parameterList);
            return this;
        };

        /**
         * Builder for value.
         *
         * @param {String} value value
         * @returns {Attribute}
         */
        Attribute.prototype.withValue = function(value) {
            this.setValue(value);
            this.setTimestamp(new Date());
            return this;
        };

        /**
         * Builder for timestamp.
         *
         * @param {Date} timestamp timestamp
         * @returns {Attribute}
         */
        Attribute.prototype.withTimestamp = function(timestamp) {
            this.setTimestamp(timestamp);
            return this;
        };

        /**
         * Builder for synonyms from single translation, called by discoverer's buildAttribute().
         *
         * @param translation
         * @returns {Attribute}
         */
        Attribute.prototype.withSynonym = function(translation){
            this.addSynonym(translation);
            return this;
        };

        /**
         * Builder for synonyms from translations, called by discoverer's buildAttribute().
         *
         * @param translations
         * @returns {Attribute}
         */
        Attribute.prototype.withSynonyms = function(translations){
            this.setSynonyms(translations);
            return this;
        };

        /**
         * Returns the name.
         *
         * @returns {string}
         */
        Attribute.prototype.getName = function(){
            return this._name;
        };

        /**
         * Returns the type.
         *
         * @returns {string}
         */
        Attribute.prototype.getType = function(){
            return this._type;
        };

        /**
         * Returns the parameters.
         *
         * @returns {ParameterList}
         */
        Attribute.prototype.getParameters = function(){
            return this._parameterList;
        };

        /**
         * Returns the list of synonyms
         *
         * @returns {Array}
         */
        Attribute.prototype.getSynonyms = function(){
            return this._synonymList;
        };

        /**
         * Sets the name.
         *
         * @param {string} name Name
         */
        Attribute.prototype.setName = function(name){
            if(typeof name === 'string'){
                this._name = name;
            }
        };

        /**
         * Sets the type.
         *
         * @param {string} type Type
         */
        Attribute.prototype.setType = function(type){
            if(typeof type === 'string'){
                this._type = type;
            }
        };

        /**
         * Adds a parameter.
         *
         * @param {Parameter} parameter Parameter
         */
        Attribute.prototype.addParameter = function(parameter){
            this._parameterList.put(parameter);
        };

        /**
         * Adds one synonym.
         *
         * @param synonym
         */
        Attribute.prototype.addSynonym = function(synonym){
            if (synonym instanceof Attribute)
                this.synonymList.push(synonym.getName());
            else if (typeof _synonym == 'string')
                this.synonymList.push(synonym);
        };

        /**
         * Adds a list of Parameter.
         *
         * @param {ParameterList} parameters ParameterList
         */
        Attribute.prototype.setParameters = function(parameters){
            this._parameterList.putAll(parameters);
        };

        /**
         * Adds a list of synonyms.
         *
         * @param synonyms
         */
        Attribute.prototype.setSynonyms = function(synonyms){
            for (var synIndex in synonyms) {
                this.addSynonym(synonyms[synIndex]);
            }
        };

        /**
         * Returns true if the attribute is parameterized.
         *
         * @returns {boolean}
         */
        Attribute.prototype.hasParameters = function() {
            return this._parameterList.size() > 0;
        };

        /**
         * Sets the value.
         *
         * @param {string} value value
         * @returns {Attribute}
         */
        Attribute.prototype.setValue = function(value) {
            this._value = value;
            return this;
        };

        /**
         * Returns the value.
         *
         * @returns {string}
         */
        Attribute.prototype.getValue = function() {
            return this._value;
        };

        /**
         * Sets the timestamp.
         *
         * @param {Date} time timestamp
         */
        Attribute.prototype.setTimestamp = function(time) {
            this._timestamp = time;
        };

        /**
         * Returns the timestamp.
         *
         * @returns {Number}
         */
        Attribute.prototype.getTimestamp = function() {
            return this._timestamp;
        };

        /**
         *
         * @returns {boolean}
         */
        Attribute.prototype.hasInputParameter = function() {
            return this.hasParameters() && this._parameterList.hasInputParameter();
        };

        /**
         * Compares this instance with the given one.
         *
         * @param {Attribute} attribute Attribute that should be compared.
         * @returns {boolean}
         */
        Attribute.prototype.equalsTypeOf = function(attribute) {
            var name = attribute.getName();
            if (attribute instanceof Attribute) {
                if ((this.getName() == name || this.getSynonyms().indexOf(name) != -1)
                    && this.getType() == attribute.getType()
                    && this.getParameters().equals(attribute.getParameters())) {
                    return true;
                }
            }
            return false;
        };

        /**
         *
         * @param {Attribute} attribute
         * @returns {Boolean}
         */
        Attribute.prototype.equalsValueOf = function(attribute) {
            if (attribute instanceof Attribute) {
                if (this.equalsTypeOf(attribute) && this.getValue() == attribute.getValue()) {
                    return true;
                }
            }
            return false;
        };

        /**
         * Returns an identifier that uniquely describes the attribute type and its parameters.
         * The identifier can be used to compare two attribute types. <br/>
         * Format: (AttributeName:AttributeType)#[FirstParameterName:FirstParameterValue]…
         *
         * @returns {String}
         * @example (CI_USER_LOCATION_DISTANCE:FLOAT)#[CP_TARGET_LATITUDE:52][CP_TARGET_LONGITUDE:13][CP_UNIT:KILOMETERS]
         */
        Attribute.prototype.toString = function(typeOnly) {
            var identifier = "(" + this.getName() + ":" + this.getType() + ")";
            if (this.hasParameters()) {
                identifier += "#";
                for (var index in this.getParameters().getItems()) {
                    var theParameter = this.getParameters().getItems()[index];
                    identifier += theParameter.toString();
                }
            }
            if (!typeOnly) identifier += ":" + this.getValue();
            return identifier;
        };

        return Attribute;
    })();
});
/**
 * @module Attribute
 */
define('attributeList',['abstractList', 'attribute'], function(AbstractList, Attribute) {
    return (function() {
        /**
         * @class
         * @classdesc This class represents a list for Attribute.
         * @requires Attribute~Attribute
         * @extends AbstractList
         * @constructs AttributeList
         */
        function AttributeList() {
            AbstractList.call(this);

            this._type = Attribute;

            return this;
        }

        AttributeList.prototype = Object.create(AbstractList.prototype);
        AttributeList.prototype.constructor = AttributeList;

        /**
         * Adds the specified item to the itemList.
         *
         * @public
         * @param {Attribute} attribute AttributeType
         * @param {boolean} multipleInstances
         */

        AttributeList.prototype.put = function(attribute, multipleInstances) {
            multipleInstances = typeof multipleInstances == "undefined" ? false : multipleInstances;
            if (attribute instanceof this._type) {
                if (multipleInstances || !(this.containsTypeOf(attribute))) {
                    this._items.push(attribute);
                } else {
                    this.updateValue(attribute);
                }
            }
        };

        /**
         * Adds all items in the specified list to the
         * itemList.
         *
         * @public
         * @param {(AttributeList|Array)} attributeList AttributeList
         */
        AttributeList.prototype.putAll = function(attributeList) {
            var list = [];
            if (attributeList instanceof Array) {
                list = attributeList;
            } else if (attributeList.constructor === AttributeList) {
                list = attributeList.getItems();
            }
            for ( var i in list) {
                this.put(list[i]);
            }
        };

        /**
         *
         * @deprecated Use containsTypeOf or containsValueOf instead.
         * @param {Attribute} attribute
         * @param {?Boolean} typeOnly
         * @returns {Boolean}
         */
        AttributeList.prototype.contains = function(attribute, typeOnly) {
            typeOnly = typeof typeOnly == "undefined" ? false : typeOnly;
            return typeOnly ? this.containsTypeOf(attribute) : this.containsValueOf(attribute);
        };

        /**
         * Verifies whether an attribute with the type of the given item is included in this list.
         *
         * @param {Attribute} attribute AttributeType that should be verified.
         * @returns {Boolean}
         */
        AttributeList.prototype.containsTypeOf = function(attribute) {
            if (attribute.constructor === Attribute) {
                for (var index in this.getItems()) {
                    var theAttribute = this.getItems()[index];
                    if (theAttribute.equalsTypeOf(attribute)) {
                        return true;
                    }
                }
            }
            return false;
        };

        /**
         * Verifies whether the given item is included in the list.
         *
         * @param {Attribute} attribute AttributeValue that should be verified.
         * @returns {Boolean}
         */
        AttributeList.prototype.containsValueOf = function(attribute) {
            if (attribute.constructor === Attribute) {
                for (var index in this._items) {
                    var theAttribute = this._items[index];
                    if (theAttribute.equalsValueOf(attribute)) {
                        return true;
                    }
                }
            }
            return false;
        };

        /**
         *
         * @deprecated Use equalsTypesIn or equalsValuesIn instead.
         * @param {AttributeList} attributeList
         * @param {Boolean} typeOnly
         * @returns {Boolean}
         */
        AttributeList.prototype.equals = function(attributeList, typeOnly) {
            typeOnly = typeof typeOnly == "undefined" ? false : typeOnly;
            return typeOnly ? this.equalsTypesIn(attributeList) : this.equalsValuesIn(attributeList);
        };

        /**
         * Compare the specified AttributeList with this instance.
         *
         * @param {AttributeList} attributeList AttributeList that should be compared.
         * @returns {boolean}
         */
        AttributeList.prototype.equalsTypesIn = function(attributeList) {
            if (attributeList.constructor === AttributeList  && attributeList.size() == this.size()) {
                for (var index in attributeList.getItems()) {
                    var theAttribute = attributeList.getItems()[index];
                    if (!this.containsTypeOf(theAttribute)) return false;
                }
                return true;
            }
            return false;
        };

        /**
         * Compare the specified AttributeList with this instance.
         *
         * @param {AttributeList} attributeList AttributeList that should be compared.
         * @returns {boolean}
         */
        AttributeList.prototype.equalsValuesIn = function(attributeList) {
            if (attributeList.constructor === AttributeList && attributeList.size() == this.size()) {
                for (var index in attributeList.getItems()) {
                    var theAttribute = attributeList.getItems()[index];
                    if (!this.containsValueOf(theAttribute)) return false;
                }
                return true;
            }
            return false;
        };

        /**
         * Returns only this values that matches to the given type.
         *
         * @param {(AttributeList|Array)} attributeList Attributes that should be returned.
         * @returns {AttributeList}
         */
        AttributeList.prototype.getSubset = function(attributeList) {
            var response = new AttributeList();
            var list = [];
            if (attributeList instanceof Array) {
                list = attributeList;
            } else if (attributeList.constructor === AttributeList) {
                list = attributeList.getItems();
            }
            for (var i in list) {
                var theAttribute = list[i];
                if (theAttribute.constructor === Attribute) {
                    var responseAttribute = this.getAttributeWithTypeOf(theAttribute);
                    if (typeof responseAttribute != "undefined") {
                        response.put(responseAttribute);
                    }
                }
            }
            return response;
        };

        /**
         * Returns a subset without the given types.
         *
         * @param {(AttributeList|Array)} attributeList AttributeTypes that should not be included
         * @returns {AttributeList}
         */
        AttributeList.prototype.getSubsetWithoutItems = function(attributeList) {
            var response = this;
            var list = [];
            if (attributeList instanceof Array) {
                list = attributeList;
            } else if (attributeList.constructor === AttributeList) {
                list = attributeList.getItems();
            }
            for (var i in list) {
                var attribute = list[i];
                if (attribute.constructor === Attribute) {
                    response.removeAttributeWithTypeOf(attribute);
                }
            }
            return response;
        };

        /**
         * Creates a clone of the current list.
         *
         * @param {Boolean} typeOnly
         * @returns {AttributeList}
         */
        AttributeList.prototype.clone = function(typeOnly) {
            var newList = new AttributeList();
            for (var index in this._items) {
                var oldAttribute = this._items[index];
                var newAttribute = new Attribute().withName(oldAttribute.getName()).withType(oldAttribute.getType()).withParameters(oldAttribute.getParameters());
                if (!typeOnly) newAttribute.setValue(oldAttribute.getValue());
                newList.put(newAttribute);
            }
            return newList;
        };

        /**
         *
         * @param {Attribute} attribute
         * @param {Boolean} allOccurrences
         */
        AttributeList.prototype.removeAttributeWithTypeOf = function(attribute, allOccurrences) {
            allOccurrences = typeof allOccurrences == "undefined" ? false : allOccurrences;
            for (var index in this._items) {
                var theAttribute = this._items[index];
                if (theAttribute.equalsTypeOf(attribute)) {
                    this._items.splice(index, 1);
                }
            }
            if (allOccurrences && this.contains(attribute)) this.removeAttributeWithTypeOf(attribute, allOccurrences);
        };

        /**
         *
         * @returns {boolean}
         */
        AttributeList.prototype.hasAttributesWithInputParameters = function() {
            for (var index in this._items) {
                var theAttribute = this._items[index];
                if (theAttribute.hasInputParameter()) return true;
            }
            return false;
        };

        /**
         *
         * @returns {AttributeList}
         */
        AttributeList.prototype.getAttributesWithInputParameters = function() {
            var list = new AttributeList();
            for (var index in this._items) {
                var theAttribute = this._items[index];
                if (theAttribute.hasInputParameter()) list.put(theAttribute);
            }
            return list;
        };

        /**
         * Returns the attribute value that matches the provided attribute type.
         *
         * @param {AttributeType} attribute
         * @returns {Attribute}
         */
        AttributeList.prototype.getValueForAttributeWithTypeOf = function(attribute) {
            return this.getAttributeWithTypeOf(attribute).getValue();
        };

        /**
         *
         * @param {Attribute} attribute
         * @returns {Attribute}
         */
        AttributeList.prototype.getAttributeWithTypeOf = function(attribute) {
            for (var index in this.getItems()) {
                var theAttribute = this.getItems()[index];
                if (theAttribute.equalsTypeOf(attribute)) return theAttribute;
            }
        };

        /**
         *
         * @param {Attribute} attribute
         */
        AttributeList.prototype.updateValue = function(attribute) {
            for (var index in this._items) {
                var theAttribute = this._items[index];
                if (theAttribute.equalsTypeOf(attribute)) this._items[index] = attribute;
            }
        };

        return AttributeList;
    })();
});
define('retrievalResult',["attributeList"], function(AttributeList){
	return (function() {
		/**
		 * @classdesc Contains the data that were retrieved from the database.
		 * @constructs RetrievalResult
		 */
		function RetrievalResult() {
			/**
			 * Name of the retrieved Attribute.
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
			 * Retrieved Attributes.
			 *
			 * @type {AttributeList}
			 * @private
			 */
			this._values = new AttributeList();

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
		 * Returns the Attribute name.
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
		 * Returns the retrieved Attributes.
		 *
		 * @returns {AttributeList}
		 */
		RetrievalResult.prototype.getValues = function(){
			return this._values;
		};

		/**
		 * Sets the Attribute name.
		 *
		 * @param {string} name Name of the retrieved Attribute.
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
		 * @param {Array} values Retrieved Attributes.
		 */
		RetrievalResult.prototype.setValues = function(values){
			if(values instanceof Array){
				this._values = values;
			}
		};

		return RetrievalResult;
	})();
});
define('storage',['attribute', 'attributeList', 'retrievalResult', 'parameter', 'parameterList'],
 	function(Attribute, AttributeList, RetrievalResult, Parameter, ParameterList){
		return (function() {
			/**
			 * Initializes the database and all return values.
			 *
			 * @classdesc Storage handles the access to the database.
			 * @param {String} name
			 * @param {Number} time
			 * @param {Number} counter
			 * @returns {Storage}
			 * @constructs Storage
			 */
			function Storage(name, time, counter) {
				/**
				 * Names of all stored Attributes (tableNames as string).
				 *
				 * @type {Array}
				 * @private
				 */
				this._attributeNames = [];

				/**
				 * Data of a retrieval.
				 *
				 * @type {RetrievalResult}
				 * @private
				 */
				this._attributes = new RetrievalResult();

				/**
				 * Cache before storing the new data in the database.
				 *
				 * @type {AttributeList}
				 * @private
				 */
				this._data = new AttributeList();

				/**
				 * Names of all stored Attributes.
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
				 * If at least 'countCondition' attributes are collected data will be flushed.
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
				this._db = '';

				this._initStorage(name);
				if(time && time === parseInt(time) && time != 0) this._timeCondition = time;
				if(counter && counter === parseInt(counter) && counter != 0) this._countCondition = counter;

				return this;
			}

			/**
			 * Returns the last retrieved Attributes.
			 *
			 * @returns {RetrievalResult}
			 */
			Storage.prototype.getCurrentData = function() {
				return this._attributes;
			};

			/**
			 * Returns the names of all stored Attributes (tableNames as string).
			 *
			 * @returns {Array}
			 */
			Storage.prototype.getAttributesOverview = function() {
				return this._attributeNames;
			};

			/**
			 * Initializes a new database.
			 *
			 * @private
			 * @param {String} name Name of the database.
			 */
			Storage.prototype._initStorage = function(name){
				if(!window.openDatabase) {
					console.log('Databases are not supported in this browser.');
				}else{
					this._db = window.openDatabase(name, "1.0", "DB_" + name, 1024*1024);
					console.log('initStorage: ' + name);
				}
			};

			/**
			 * Creates a new table. A table contains the values of one AttributeType.
			 * So the name is the AttributeName.
			 *
			 * @private
			 * @param {Attribute} attribute tableName (should be the attributeName)
			 * @param {?function} callback For alternative actions, if an asynchronous function is used.
			 */
			Storage.prototype._createTable = function(attribute, callback){
				if(this._db){
					var tableName = this._tableName(attribute);
					var statement = 'CREATE TABLE IF NOT EXISTS "' + tableName + '" (value_, type_, created_)';
					console.log('CREATE TABLE IF NOT EXISTS "' + tableName + '"');
					if(callback && typeof(callback) == 'function'){
						this._db.transaction(function(tx){tx.executeSql(statement);}, this._errorCB, callback);
					} else {
						this._db.transaction(function(tx){tx.executeSql(statement);}, this._errorCB, this._successCB);
					}
					if(!this._attributeNames.indexOf(attribute.getName()) > -1){
						this._attributeNames.push(tableName);
					}
				}
			};

			/**
			 * Inserts value into a table. The name of the given Attribute
			 * identifies the table.
			 *
			 * @private
			 * @param {Attribute} attribute Attribute that should be stored.
			 * @param {?function} callback For alternative actions, if an asynchronous function is used.
			 */
			Storage.prototype._insertIntoTable = function(attribute, callback){
				if(this._db && attribute && attribute.constructor === Attribute){
					var tableName = this._tableName(attribute);
					var statement = 'INSERT INTO "' + tableName
						+ '" (value_, type_, created_) VALUES ("'
						+ attribute.getValue() + '", "'
						+ attribute.getType() + '", "'
						+ attribute.getTimestamp() + '")';
					console.log('INSERT INTO "'+tableName+'" VALUES ('+attribute.getValue()+", "+attribute.getType()+", "+attribute.getTimestamp());
					if(callback && typeof(callback) == 'function'){
						this._db.transaction(function(tx){tx.executeSql(statement);}, this._errorCB, callback);
					} else {
						this._db.transaction(function(tx){tx.executeSql(statement);}, this._errorCB, this._successCB);
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
			 * Sets the attributeNames array.
			 *
			 * @param {?function} [callback] For alternative actions, if an asynchronous function is used.
			 */
			Storage.prototype.getAttributeNames = function(callback){
				if(this._db){
					var self = this;
					this._db.transaction(function(tx) {
							self._queryTables(tx, self, callback);
						}, function(error) {
							self._errorCB(error);
						}
					);
				}
			};

			/**
			 * Sets the attributeNames array. Is used in getAttributeNames().
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
				self._attributeNames = [];
				var len = results.rows.length;
				for(var i=0; i<len; i++){
					var table = results.rows.item(i).name;
					if(table.indexOf("DatabaseInfoTable") == -1){
						self._attributeNames.push(results.rows.item(i).name);
					}

				}
				if(callback && typeof(callback) == 'function'){
					callback();
				}
			};

			/**
			 * Verifies if a table for an attribute exists.
			 *
			 * @private
			 * @param {(Attribute|String)} attributeOrName Attribute or name for the verification.
			 * @returns {boolean}
			 */
			Storage.prototype._tableExists = function(attributeOrName){
				if(attributeOrName.constructor === Attribute){
					var name = this._tableName(attributeOrName);
					return this._attributeNames.indexOf(name) > -1;
				} else if(typeof attributeOrName === 'string'){
					return this._attributeNames.indexOf(attributeOrName) > -1;
				}
				return false;
			};

			/**
			 * Retrieves a table and sets the RetrievalResult.
			 *
			 * @param {String} tableName Name for the table that should be retrieved.
			 * @param {?function} callback For additional actions, if an asynchronous function is used.
			 */
			Storage.prototype.retrieveAttributes = function(tableName, callback){
				console.log("retrieveAttributes from "+tableName);

				if(this._db){
					var self = this;
					self._flushStorage();
					this._db.transaction(function(tx) {
						self._queryValues(tx, tableName, self, callback);
					}, function(error) {
						self._errorCB(error);
					});
				}
			};

			/**
			 * Query function for given attribute.
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
					console.log('SELECT * FROM "' +tableName+"'");
					var statement = 'SELECT * FROM "' + tableName+'"';
					tx.executeSql(statement, [],
						function(tx, results) {
							self._queryValuesSuccess(tx, results, tableName, self, callback);
						}, function(error) {
							self._errorCB(error);
						});
				} else {
					console.log('Table "'+tableName+'" unavailable');
				}
			};

			/**
			 * Success function for retrieveAttributes().
			 * Puts the retrieved data in RetrievalResult object.
			 *
			 * @callback
			 * @private
			 * @param {*} tx
			 * @param {*} results
			 * @param {String} tableName Name of the searched attribute.
			 * @param self
			 * @param {?function} callback For additional actions, if an asynchronous function is used.
			 */
			Storage.prototype._queryValuesSuccess = function(tx, results, tableName, self, callback){
				var len = results.rows.length;
				var attributeList = [];
				var attributeName = this._resolveAttributeName(tableName);
				var parameterList = this._resolveParameters(tableName);
				for(var i=0; i<len; i++){
					var attribute = new Attribute().
						withName(attributeName).withValue(results.rows.item(i).value_).
						withType(results.rows.item(i).type_).
						withTimestamp(results.rows.item(i).created_).
						withParameters(parameterList);
					attributeList.push(attribute);
				}
				self._attributes = new RetrievalResult().withName(tableName)
					.withTimestamp(new Date())
					.withValues(attributeList);
				if(callback && typeof(callback) == 'function'){
					callback();
				}
			};

			/**
			 * Stores the given Attribute.
			 * If the flush condition does not match,
			 * the data is first added to the local cache before.
			 *
			 * @public
			 * @param {Attribute} attributeValue Value that should be stored.
			 */
			Storage.prototype.store = function(attributeValue) {
				this._addData(attributeValue);
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
			 * @param {Attribute} _attribute Value that should be stored.
			 */
			Storage.prototype._addData = function(_attribute){
				if(_attribute.constructor === Attribute){
					this._data.put(_attribute);
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
				this._data = new AttributeList();
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
			 * Builds the tableName for the given attribute.
			 *
			 * @private
			 * @param {Attribute} attribute Attribute that should be stored.
			 * @returns{String}
			 */
			Storage.prototype._tableName = function(attribute){
				return attribute.toString(true);
			};

			/**
			 * Extracts the attributeName form the table name.
			 *
			 * @private
			 * @param {String} tableName Table name that should be resolved.
			 * @returns{String}
			 */
			Storage.prototype._resolveAttributeName = function(tableName){
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
 * This module represents a Callback.
 * Callbacks define events for sending data to subscribers
 * 
 * @module Subscriber
 */
define('callback',['attribute', 'attributeList'], function(Attribute, AttributeList){
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
			 * Associated Attributes that will be send to Subscriber.
			 *
			 * @type {AttributeList}
			 * @private
			 */
			this._attributes = new AttributeList();

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
		 * @param {(AttributeList|Array)} attributeListOrArray attributeTypes
		 * @returns {Callback}
		 */
		Callback.prototype.withAttributeTypes = function(attributeListOrArray) {
			this.setAttributeTypes(attributeListOrArray);
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
		 * Returns the associated attributes (only the types).
		 *
		 * @returns {AttributeList}
		 */
		Callback.prototype.getAttributeTypes = function() {
			return this._attributes;
		};

		/**
		 * Adds a list of AttributeTypes.
		 *
		 * @param {AttributeList|Array} _attributes AttributeTypeList
		 */
		Callback.prototype.setAttributeTypes = function(_attributes){
			var list = [];
			if(_attributes instanceof Array){
				list = _attributes;
			} else if (_attributes.constructor === AttributeList) {
				list = _attributes.getItems();
			}
			for(var i in list){
				this.addAttributeType(list[i]);
			}
		};

		/**
		 * Adds an attribute to AttributeTypeList.
		 *
		 * @param {Attribute} attribute Attribute
		 */
		Callback.prototype.addAttributeType = function(attribute){
			if(attribute.constructor === Attribute && !this._attributes.containsTypeOf(attribute)){
				this._attributes.put(attribute);
			}
		};

		/**
		 * Removes an attribute from AttributeTypeList.
		 *
		 * @param {Attribute} attribute AttributeType
		 */
		Callback.prototype.removeAttributeType = function(attribute){
			if(attribute.constructor === Attribute){
				this._attributes.removeItem(attribute);
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
					&& _callback.getAttributeTypes().equals(this.getAttributeTypes())) {
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
			if (callback.constructor === Callback) {
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
define('condition',['attribute', 'conditionMethod'],
 	function(Attribute, ConditionMethod){
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
				 * AttributeType that should be checked.
				 *
				 * @type {Attribute}
				 * @private
				 */
				this._attributeType = '';

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
			 * Builder for AttributeType.
			 *
			 * @param {Attribute} attribute Attributes that would be verified.
			 * @returns {Condition}
			 */
			Condition.prototype.withAttributeType = function(attribute){
				this.setAttributeType(attribute);
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
			 * Sets the attributeType.
			 *
			 * @param {Attribute} attribute AttributeType
			 */
			Condition.prototype.setAttributeType = function(attribute){
				if(attribute.constructor === Attribute){
					this._attributeType = attribute;
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
			 * Returns the AttributeType.
			 *
			 * @returns {Attribute}
			 */
			Condition.prototype.getAttributeType = function(){
				return this._attributeType;
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
			 * @param {Attribute} newAttribute new Attribute that should be compared
			 * @param {Attribute} oldAttribute old Attribute
			 * @returns {boolean}
			 */
			Condition.prototype.compare = function(newAttribute, oldAttribute){
				if(!this.getAttributeType().equalsTypeOf(newAttribute) && !this.getAttributeType().equalsTypeOf(oldAttribute)){
					return false;
				}
				if(!this.getComparisonMethod()){
					return false;
				}
				if(newAttribute.constructor === Attribute && oldAttribute.constructor === Attribute){
					return this.getComparisonMethod().process(this.getReferenceValue(), newAttribute.getValue(), oldAttribute.getValue());
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
						&& condition.getAttributeType().equalsTypeOf(this.getAttributeType())
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
define('subscriber',['attributeList', 'callbackList', 'condition', 'conditionList'],
 	function(AttributeList, CallbackList, Condition, ConditionList)  {
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
				 * Restricts the associated Attributes of the callback to a subset
				 * 		(i.e: the subscriber wants a subset from the available the context data).
				 * 		If no attributes are specified, all available attributes will returned.
				 *
				 * @private
				 * @type {AttributeList}
				 */
				this._attributesSubset = new AttributeList();

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
			 * Builder for attributesSubset.
			 *
			 * @param {AttributeList} attributesSubset attributesSubset
			 * @returns {Subscriber}
			 */
			Subscriber.prototype.withAttributesSubset = function(attributesSubset) {
				this.setAttributesSubset(attributesSubset);
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
			 * Returns the attributesSubset.
			 *
			 * @returns {string}
			 */
			Subscriber.prototype.getAttributesSubset = function() {
				return this._attributesSubset;
			};

			/**
			 * Sets the attributesSubset.
			 *
			 * @param {AttributeList} attributesSubset attributesSubset
			 */
			Subscriber.prototype.setAttributesSubset = function(attributesSubset){
				if(attributesSubset && attributesSubset.constructor === AttributeList) {
					this._attributesSubset = attributesSubset;
				}
			};

			/**
			 * Returns the conditions.
			 *
			 * @returns {string}
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
						&& subscriber.getAttributesSubset().equals(this.getAttributesSubset())
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
 * This module representing a Context Widget.
 * 
 * @module Widget
 */
define('widget',['MathUuid', 'callback', 'callbackList', 'attribute', 'attributeList', 'conditionList', 'subscriber', 'subscriberList'],
	function(MathUuid, Callback, CallbackList, Attribute, AttributeList, ConditionList, Subscriber, SubscriberList) {
		return (function() {
			/**
			 * Constructor: Generates the ID and initializes the
			 * Widget with attributes, callbacks and subscriber
			 * that are specified in the provided functions.
			 *
			 * @abstract
			 * @classdesc The Widget handles the access to sensors.
			 * @constructs Widget
			 */
			function Widget(discoverer, attributes) {
				var self = this;

				/**
				 * Name of the Widget.
				 *
				 * @public
				 * @type {string}
				 */
				this.name = 'Widget';

				/**
				 * ID of the Widget. Will be generated.
				 *
				 * @type {string}
				 */
				this.id = Math.uuid();

				/**
				 *
				 * @protected
				 * @type {AttributeList}
				 * @memberof Widget#
				 * @desc All available Attributes and their values.
				 */
				this._outAttributes = new AttributeList();

				/**
				 * @alias oldAttributes
				 * @protected
				 * @type {AttributeList}
				 * @memberof Widget#
				 * @desc This temporary variable is used for storing the old attribute values.
				 * 			So these can be used to check conditions.
				 */
				this._oldOutAttributes = new AttributeList();

				/**
				 * @alias constantAttributes
				 * @protected
				 * @type {AttributeList}
				 * @memberof Widget#
				 * @desc All available constant Attributes and their values.
				 */
				this._constantOutAttributes = new AttributeList();

				/**
				 * @alias callbacks
				 * @protected
				 * @type {CallbackList}
				 * @memberof Widget#
				 * @desc List of Callbacks.
				 */
				this._callbacks = new CallbackList();

				/**
				 * @alias subscribers
				 * @protected
				 * @type {SubscriberList}
				 * @memberof Widget#
				 * @desc List of Subscriber.
				 */
				this._subscribers = new SubscriberList();

				/**
				 * Associated discoverer.
				 *
				 * @type {Discoverer}
				 * @private
				 */
				this._discoverer = discoverer;

				this._register();
				this._init(attributes);

				return this;
			}

			/**
			 * Returns the name of the widget.
			 *
			 * @public
			 * @alias getName
			 * @memberof Widget#
			 * @returns {string}
			 */
			Widget.prototype.getName = function() {
				return this.name;
			};

			/**
			 * Returns the id of the widget.
			 *
			 * @public
			 * @alias getId
			 * @memberof Widget#
			 * @returns {string}
			 */
			Widget.prototype.getId = function() {
				return this.id;
			};

			/**
			 * Returns the available AttributeTypes.
			 *
			 * @public
			 * @param {?AttributeList} [attributes]
			 * @returns {AttributeList}
			 */
			Widget.prototype.getOutAttributes = function(attributes) {
				// test if attributeList is a list
				if (attributes && attributes instanceof AttributeList) {
					return this._outAttributes.getSubset(attributes);
				} else {
					return this._outAttributes;
				}
			};

			/**
			 * Returns the available ConstantAttributeTypes
			 * (attributes that do not change).
			 *
			 * @public
			 * @param {?AttributeList} attributes
			 * @returns {AttributeList}
			 */
			Widget.prototype.getConstantOutAttributes = function(attributes) {
				if (attributes && attributes instanceof AttributeList) {
					return this._constantOutAttributes.getSubset(attributes);
				} else {
					return this._constantOutAttributes;
				}
			};

			/**
			 * Returns the last acquired attribute value with the given attribute type.
			 *
			 * @param {AttributeType} attributeType The attribute type to return the last value for.
			 * @returns {*}
			 */
			Widget.prototype.getValueForAttributeWithTypeOf = function(attributeType) {
				return this.getOutAttributes().getAttributeWithTypeOf(attributeType).getValue();
			};

			/**
			 * Returns the old Attributes.
			 *
			 * @private
			 * @alias getOldAttributes
			 * @memberof Widget#
			 * @returns {AttributeList}
			 */
			Widget.prototype.getOldAttributes = function() {
				return this._oldOutAttributes;
			};

			/**
			 * Returns a list of callbacks that can be
			 * subscribed to.
			 *
			 * @public
			 * @alias getCallbacks
			 * @memberof Widget#
			 * @returns {CallbackList}
			 */
			Widget.prototype.getCallbackList = function() {
				return this._callbacks;
			};

			/**
			 * Returns the specified callbacks that can be
			 * subscribed to.
			 *
			 * @public
			 * @alias getCallbacks
			 * @memberof Widget#
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
			 * @public
			 * @alias getSubscriber
			 * @memberof Widget#
			 * @returns {SubscriberList}
			 */
			Widget.prototype.getSubscriber = function() {
				return this._subscribers;
			};

			/**
			 * Sets the name of the Widget.
			 *
			 * @protected
			 * @alias setName
			 * @memberof Widget#
			 * @param {string} name Name of the Widget.
			 */
			Widget.prototype.setName = function(name) {
				if (typeof name === 'string') {
					this.name = name;
				}
			};

			/**
			 * Sets the id of the Widget.
			 *
			 * @protected
			 * @alias setId
			 * @memberof Widget#
			 * @param {string} id Id of the Widget.
			 */
			Widget._setId = function(id) {
				if (typeof id === 'string') {
					this.id = id;
				}
			};

			/**
			 * Sets the AttributeValueList and also the associated
			 * AttributeTypes.
			 *
			 * @protected
			 * @param {(AttributeList|Array)} attributesOrArray List or Array of AttributeValues
			 */
			Widget.prototype._setOutAttributes = function(attributesOrArray) {
				this._outAttributes = new AttributeList().withItems(attributesOrArray);
			};

			/**
			 * Adds a new AttributeValue. If the given value is
			 * not included in the list, the associated type will
			 * be also added. Otherwise, only the value will be
			 * updated.
			 *
			 * @public
			 * @param {Attribute} attribute
			 * @param {Boolean} multipleInstances
			 */
			Widget.prototype.addOutAttribute = function(attribute, multipleInstances) {
				multipleInstances = typeof multipleInstances == "undefined" ? false : multipleInstances;
				if (attribute instanceof Attribute) {
					if (!this._outAttributes.containsTypeOf(attribute)) {
						this._oldOutAttributes = this._outAttributes;
						attribute.setTimestamp(this.getCurrentTime());
						this._outAttributes.put(attribute, multipleInstances);
					}
				}
			};

			/**
			 * Sets the ConstantAttributeValueList and also the
			 * associated AttributeTypes.
			 *
			 * @protected
			 * @alias setConstantOutAttributes
			 * @memberof Widget#
			 * @param {(AttributeList|Array)} constantAttributes List or Array of AttributeValues
			 */
			Widget.prototype._setConstantOutAttributes = function(constantAttributes) {
				var list = [];
				if (constantAttributes instanceof Array) {
					list = constantAttributes;
				} else if (Class.isA(AttributeValueList, constantAttributes)) {
					list = constantAttributes.getItems();
				}
				for ( var i in list) {
					var constantAttribute = list[i];
					if (Class.isA(AttributeValue, constantAttribute)) {
						constantAttribute.setTimestamp(this.getCurrentTime());
						this.constantAttributes.put(constantAttribute);
						var type = new AttributeType().withName(constantAttribute.getName())
							.withType(constantAttribute.getType())
							.withParameters(constantAttribute.getParameters());
						this.constantAttributeTypes.put(type);
					}
				}
			};

			/**
			 * Adds a new constantAttributeValue. If the given value is
			 * not included in the list, the associated type will
			 * be also added. Otherwise, only the value will be
			 * updated.
			 *
			 * @protected
			 * @param {Attribute} constantAttribute AttributeValue
			 */
			Widget.prototype._addConstantOutAttribute = function(constantAttribute) {
				if (Class.isA(AttributeValue, constantAttribute)) {
					if (!this.constantAttributes
							.contains(constantAttribute)) {

						var type = new AttributeType().withName(constantAttribute.getName())
							.withType(constantAttribute.getType())
							.withParameters(constantAttribute.getParameters());
						this.constantAttributeTypes.put(type);
					}
					_attribute.setTimestamp(this.getCurrentTime());
					this.constantAttributes.put(constantAttribute);
				}
			};

			/**
			 * Sets Callbacks.
			 *
			 * @protected
			 * @alias setCallbacks
			 * @memberof Widget#
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
			 * @alias addCallback
			 * @memberof Widget#
			 * @param {Callback} callback List or Array of AttributeValues.
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
			 * @alias setSubscriber
			 * @memberof Widget#
			 * @param {(SubscriberList|Array)}  subscribers List or Array of Subscriber.
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
			 * Returns the current time.
			 *
			 * @private
			 * @returns {Date}
			 */
			Widget.prototype.getCurrentTime = function() {
				return new Date();
			};

			/**
			 * Verifies whether the specified attributes is a
			 * provided Attribute.
			 *
			 * @protected
			 * @alias isOutAttribute
			 * @memberof Widget#
			 * @param {Attribute} attribute
			 * @returns {boolean}
			 */
			Widget.prototype._isOutAttribute = function(attribute) {
				return !!this._outAttributes.containsTypeOf(attribute);
			};

			/**
			 * Initializes the provided Attributes.
			 *
			 * @abstract
			 * @protected
			 */
			Widget.prototype._initOutAttributes = function() {
				throw new Error("Call to abstract function '_initOutAttributes'!");
			};

			/**
			 * Initializes the provided ConstantAttributes.
			 *
			 * @abstract
			 * @protected
			 */
			Widget.prototype._initConstantOutAttributes = function() {
				throw new Error("Abstract function!");
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
			 * Function for initializing. Calls all initFunctions
			 * and will be called by the constructor.
			 *
			 * @protected
			 */
			Widget.prototype._init = function(attributes) {
				this._initOutAttributes();
				this._initConstantOutAttributes();
				this._initCallbacks();

				this.didFinishInitialization(attributes);
			};

			/**
			 * Method will be invoked after the initialization of the widget finished.
			 * Can be overridden by inheriting classes to take action after initialization.
			 *
			 * @public
			 * @virtual
			 * @param attributes
			 */
			Widget.prototype.didFinishInitialization = function(attributes) {

			};

			/**
			 * Notifies other components and sends the attributes.
			 *
			 * @virtual
			 * @public
			 */
			Widget.prototype.notify = function() {
				var callbacks = this.getCallbacks();
				for (var i in callbacks) {
					this.sendToSubscriber(callbacks[i]);
				}
			};

			/**
			 * Queries the associated sensor and updates the attributes with new values.
			 * Must be overridden by the subclasses. Overriding subclasses can call
			 * this.__super(_function) to invoke the provided callback function.
			 *
			 * @virtual
			 * @public
			 * @param {?function} callback For alternative actions, because an asynchronous function can be used.
			 */
			Widget.prototype.sendToSubscriber = function(callback) {
				if (callback && typeof(callback) == 'function') {
					callback();
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
			 * Updates the attributes by calling queryGenerator.
			 *
			 * @public
			 * @alias updateWidgetInformation
			 * @memberof Widget#
			 * @param {?function} callback For alternative  actions, because an asynchronous function can be used.
			 *
			 */
			Widget.prototype.updateWidgetInformation = function(callback) {
				this.queryGenerator(callback);
			};

			/**
			 * Updates the Attributes by external components.
			 *
			 * @param {(AttributeList|Array)} attributes Data that should be entered.
			 */
			Widget.prototype.putData = function(attributes) {
				var list = [];
				if (attributes instanceof Array) {
					list = attributes;
				} else if (attributes instanceof AttributeList) {
					list = attributes.getItems();
				}
				for ( var i in list) {
					var theAttribute = list[i];
					if (theAttribute.type === Attribute && this.isOutAttribute(theAttribute)) {
						this.addOutAttribute(theAttribute);
					}
				}
			};

			/**
			 * Returns all available AttributeValues, Attributes and ConstantAttributes.
			 *
			 * @public
			 * @returns {AttributeList}
			 */
			Widget.prototype.queryWidget = function() {
				var response = new AttributeList();
				response.putAll(this.getOutAttributes());
				response.putAll(this.getConstantOutAttributes());
				return response;
			};

			/**
			 * Updates and returns all available AttributeValues,
			 * Attributes and ConstantAtrributes.
			 *
			 * @public
			 * @alias updateAndQueryWidget
			 * @memberof Widget#
			 * @param {?function} callback For alternative  actions, because an asynchronous function can be used.
			 * @returns {?AttributeList}
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
			 * Sends all Attributes, specified in the given callback,
			 * to components which are subscribed to this Callback.
			 *
			 * @protected
			 * @param {string} callback Name of the searched Callback.
			 */
			Widget.prototype._sendToSubscriber = function(callback) {
				if (callback && callback instanceof Callback) {
					var subscriberList = this._subscribers.getItems();
					for (var i in subscriberList) {
						var subscriber = subscriberList[i];
						if (subscriber.getSubscriptionCallbacks().contains(callback)) {
							if(this.dataValid(subscriber.getConditions())){
								var subscriberInstance = this._discoverer.getComponent(subscriber.getSubscriberId());
								var callSubset =  callback.getAttributeTypes();
								var subscriberSubset = subscriber.getAttributesSubset();
								var data = this.outAttributes.getSubset(callSubset);
								if (subscriberSubset && subscriberSubset.size() > 0) {
									data = data.getSubset(subscriberSubset);
								}
							}
							if (data) {
								subscriberInstance.putData(data);
							}
						}
					}
				}
			};

			/**
			 * Verifies if the attributes match to the specified conditions in case any exists.
			 *
			 * @private
			 * @alias dataValid
			 * @memberof Widget#
			 * @param {string} conditions List of Conditions that will be verified.
			 * @returns {boolean}
			 */
			Widget.prototype._dataValid = function(conditions) {
				if (conditions instanceof ConditionList) {
					return true;
				}
				if (!conditions.isEmpty()) {
					var items = _condition.getItems();
					for (var i in items) {
						var condition = items[i];
						var conditionAttributeType = condition.getAttributeType();
						var conditionAttributeTypeList = new AttributeTypeList()
							.withItems(new Array(conditionAttributeType));
						var newValue = this.getAttributes().getSubset(conditionAttributeTypeList);
						var oldValue = this.getOldAttributes.getSubset(conditionAttributeTypeList);
						return condition.compare(newValue, oldValue);
					}
				}
				return false;
			};

			/**
			 * Runs the context acquisition constantly in an interval.
			 * Can be called by init.
			 *
			 * @virtual
			 * @protected
			 * @param {Number} interval Interval in ms
			 */
			Widget.prototype._intervalRunning = function(interval) {
				var self = this;
				if (interval === parseInt(interval)) {
					setInterval(function() {self.queryGenerator();}, interval);
				}
			};

			/**
			 * Sets the associated Discoverer and registers to that.
			 *
			 * @public
			 * @param {Discoverer} _discoverer Discoverer
			 */
			Widget.prototype.setDiscoverer = function(_discoverer) {
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
			Widget.prototype._register = function() {
				if (this._discoverer) {
					this._discoverer.registerNewComponent(this);
				}
			};

			/**
			 * Returns true if the widget can satisfy the requested attribute type.
			 *
			 * @public
			 * @param {AttributeType} attribute
			 * @returns {boolean}
			 */
			Widget.prototype.doesSatisfyTypeOf = function(attribute) {
				return this._outAttributes.containsTypeOf(attribute);
			};

			return Widget;
		})();
	}
);
define('interpreterResult',['attributeList'], function(AttributeList){
	return (function() {
		/**
		 * Initializes the in- and outAttributes.
		 *
		 * @classdesc Contains the interpreted data, inclusive the input for the interpretation.
		 * @constructs InterpreterResult
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
			 * @type {AttributeList}
			 * @private
			 */
			this._outAttributes = new AttributeList();

			/**
			 * Data, which were used for the interpretation.
			 *
			 * @type {AttributeList}
			 * @private
			 */
			this._inAttributes = new AttributeList();


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
		 * Builder for outAttributes.
		 *
		 * @param {(AttributeList|Array)} attributeListOrArray values
		 * @returns {InterpreterResult}
		 */
		InterpreterResult.prototype.withOutAttributes = function(attributeListOrArray){
			this.setOutAttributes(attributeListOrArray);
			return this;
		};

		/**
		 * Builder for inAttributes.
		 *
		 * @param {(AttributeList|Array)} attributeListOrArray values
		 * @returns {InterpreterResult}
		 */
		InterpreterResult.prototype.withInAttributes = function(attributeListOrArray) {
			this.setInAttributes(attributeListOrArray);
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
		 * Returns the interpreted attributes.
		 *
		 * @returns {AttributeList}
		 */
		InterpreterResult.prototype.getOutAttributes = function(){
			return this._outAttributes;
		};

		/**
		 * Returns the inAttributes.
		 *
		 * @returns {AttributeList}
		 */
		InterpreterResult.prototype.getInAttributes = function(){
			return this._inAttributes;
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
		 * @param {(AttributeList|Array)} attributeListOrArray retrieved attributes
		 */
		InterpreterResult.prototype.setOutAttributes = function(attributeListOrArray){
			if (attributeListOrArray instanceof Array) {
				for(var i in attributeListOrArray){
					this.outAttributes.put(attributeListOrArray[i]);
				}
			} else if (attributeListOrArray.constructor === AttributeValueList) {
				this.outAttributes = attributeListOrArray.getItems();
			}
		};

		/**
		 * Sets the inAttributes.
		 *
		 * @param {(AttributeList|Array)} attributeListOrArray inAttributes
		 */
		InterpreterResult.prototype.setInAttributes = function(attributeListOrArray){
			if (attributeListOrArray instanceof Array) {
				for(var i in attributeListOrArray){
					this.inAttributes.put(attributeListOrArray[i]);
				}
			} else if (attributeListOrArray.constructor === AttributeValueList) {
				this.inAttributes = attributeListOrArray.getItems();
			}
		};

		return InterpreterResult;
	});
});
define('interpreter',['MathUuid', 'attribute', 'attributeList', 'interpreterResult' ],
	function(MathUuid, Attribute, AttributeList, InterpreterResult) {
		return (function() {
			/**
			 * Generates the id and initializes the (in and out) types and values.
			 *
			 * @abstract
			 * @classdesc The Widget handles the access to sensors.
			 * @constructs Interpreter
			 */
			function Interpreter(discoverer) {
				/**
				 * Name of the Interpreter.
				 *
				 * @public
				 * @type {string}
				 */
				this.name = 'Interpreter';

				/**
				 * Id of the Interpreter. Will be generated.
				 *
				 * @public
				 * @type {string}
				 */
				this.id = Math.uuid();

				/**
				 * Types of all attributes that can be handled.
				 *
				 * @private
				 * @type {AttributeList}
				 */
				this._inAttributes = new AttributeList();

				/**
				 * Types of all attributes that will be returned.
				 *
				 * @private
				 * @type {AttributeList}
				 */
				this._outAttributes = new AttributeList();

				/**
				 * Last interpretation time.
				 *
				 * @protected
				 * @type {?Date}
				 */
				this._lastInterpretation = null;

				/**
				 * @alias discoverer
				 * @protected
				 * @type {Discoverer}
				 * @memberof Interpreter#
				 * @desc Associated Discoverer.
				 */
				this._discoverer = discoverer;

				this._register();
				this._initInterpreter();

				return this;
			}

			/**
			 * Returns the name of the interpreter.
			 *
			 * @public
			 * @returns {string}
			 */
			Interpreter.prototype.getName = function() {
				return this.name;
			};

			/**
			 * Returns the id of the interpreter.
			 *
			 * @public
			 * @returns {string}
			 */
			Interpreter.prototype.getId = function() {
				return this.id;
			};

			/**
			 * Initializes interpreter and sets the expected inAttributes and provided outAttributes.
			 *
			 * @private
			 */
			Interpreter.prototype._initInterpreter = function() {
				this._initInAttributes();
				this._initOutAttributes();
			};

			/**
			 * Initializes the inAttributes.
			 *
			 * @abstract
			 * @protected
			 */
			Interpreter.prototype._initInAttributes = function() {
				throw Error("Abstract function call!");
			};

			/**
			 * Initializes the outAttributes.
			 *
			 * @abstract
			 * @protected
			 */
			Interpreter.prototype._initOutAttributes = function() {
				throw Error("Abstract function call!");
			};

			/**
			 * Returns the expected inAttributeTypes.
			 *
			 * @public
			 * @returns {AttributeList}
			 */
			Interpreter.prototype.getInAttributes = function() {
				return this._inAttributes;
			};

			/**
			 * Sets an inAttribute.
			 *
			 * @protected
			 * @param {Attribute} attribute
			 */
			Interpreter.prototype._setInAttribute = function(attribute) {
				this._inAttributes.put(attribute);
			};

			/**
			 * Sets an inAttributes.
			 *
			 * @protected
			 * @param {(AttributeList|Array)} attributesOrArray Attributes to set.
			 */
			Interpreter.prototype._setInAttributes = function(attributesOrArray) {
				this._inAttributes = new AttributeList().withItems(attributesOrArray);
			};

			/**
			 * Verifies whether the specified attribute is contained in inAttributeList.
			 *
			 * @protected
			 * @param {Attribute} attribute Attribute that should be verified.
			 * @return {boolean}
			 */
			Interpreter.prototype._isInAttribute = function(attribute) {
				return !!this._inAttributes.containsTypeOf(attribute);
			};

			/**
			 * Returns the provided outAttributeTypes.
			 *
			 * @public
			 * @returns {AttributeList}
			 */
			Interpreter.prototype.getOutAttributes = function() {
				return this._outAttributes;
			};

			/**
			 * Adds an outAttribute.
			 *
			 * @protected
			 * @param {Attribute} attribute
			 */
			Interpreter.prototype._setOutAttribute = function(attribute) {
				this._outAttributes.put(attribute);
			};

			/**
			 * Sets an outAttributes.
			 *
			 * @protected
			 * @param {(AttributeList|Array)} attributesOrArray Attributes to set.
			 */
			Interpreter.prototype._setOutAttributes = function(attributesOrArray) {
				this._outAttributes = new AttributeList().withItems(attributesOrArray);
			};

			/**
			 * Verifies whether the specified attribute is contained in outAttributeList.
			 *
			 * @protected
			 * @param {Attribute} attribute Attribute that should be verified.
			 * @return {boolean}
			 */
			Interpreter.prototype._isOutAttribute = function(attribute) {
				return !!this._outAttributes.containsTypeOf(attribute);
			};

			/**
			 * Validates the data and calls interpretData.
			 *
			 * @public
			 * @param {AttributeList} inAttributes Data that should be interpreted.
			 * @param {AttributeList} outAttributes
			 * @param {?function} callback For additional actions, if an asynchronous function is used.
			 */
			Interpreter.prototype.callInterpreter = function(inAttributes, outAttributes, callback) {
				var self = this;

				if (!inAttributes || !this._canHandleInAttributes(inAttributes)) throw "Empty input attribute list or unhandled input attribute.";
				if (!outAttributes || !this._canHandleOutAttributes(outAttributes)) throw "Empty output attribute list or unhandled output attribute.";

				this._interpretData(inAttributes, outAttributes, function(interpretedData) {
					var response = new AttributeList().withItems(interpretedData);

					if (!self._canHandleOutAttributes(response)) throw "Unhandled output attribute generated.";

					self._setInAttributes(inAttributes);
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
			 * @param {AttributeList} inAttributes
			 * @param {AttributeList} outAttributes
			 * @param {Function} callback
			 */
			Interpreter.prototype._interpretData = function (inAttributes, outAttributes, callback) {
				throw Error("Abstract function call!");
			};

			/**
			 * Checks whether the specified data match the expected.
			 *
			 * @protected
			 * @param {AttributeList|Array.<Attribute>} attributeListOrArray Data that should be verified.
			 */
			Interpreter.prototype._canHandleInAttributes = function(attributeListOrArray) {
				var list = [];
				if (attributeListOrArray instanceof Array) {
					list = attributeListOrArray;
				} else if (attributeListOrArray.constructor === AttributeList) {
					list = attributeListOrArray.getItems();
				}
				if (list.length == 0 || attributeListOrArray.size() != this.getInAttributes().size()) {
					return false;
				}
				for ( var i in list) {
					var inAtt = list[i];
					if (!this._isInAttribute(inAtt)) {
						return false;
					}
				}
				return true;
			};

			/**
			 * Checks whether the specified data match the expected.
			 *
			 * @protected
			 * @param {AttributeList|Array.<Attribute>} attributeListOrArray Data that should be verified.
			 */
			Interpreter.prototype._canHandleOutAttributes = function(attributeListOrArray) {
				var list = [];
				if (attributeListOrArray instanceof Array) {
					list = attributeListOrArray;
				} else if (attributeListOrArray.constructor === AttributeList) {
					list = attributeListOrArray.getItems();
				}
				if (list.length == 0 || attributeListOrArray.size() != this.getOutAttributes().size()) {
					return false;
				}
				for ( var i in list) {
					var inAtt = list[i];
					if (!this._isOutAttribute(inAtt)) {
						return false;
					}
				}
				return true;
			};

			/**
			 * Returns the time of the last interpretation.
			 *
			 * @public
			 * @returns {Date}
			 */
			Interpreter.prototype.getLastInterpretionTime = function() {
				return this._lastInterpretation;
			};

			/**
			 * Sets and registers to the associated Discoverer.
			 *
			 * @public
			 * @param {Discoverer} discoverer Discoverer
			 */
			Interpreter.prototype.setDiscoverer = function(discoverer) {
				if (!this._discoverer) {
					this._discoverer = discoverer;
					this._register();
				}
			};

			/**
			 * Registers the component to the associated Discoverer.
			 *
			 * @public
			 */
			Interpreter.prototype._register = function() {
				if (this._discoverer) {
					this._discoverer.registerNewComponent(this);
				}
			};

			/**
			 *
			 * @returns {boolean}
			 */
			Interpreter.prototype.hasOutAttributesWithInputParameters = function() {
				return this._outAttributes.hasAttributesWithInputParameters();
			};

			/**
			 *
			 * @returns {AttributeList}
			 */
			Interpreter.prototype.getOutAttributesWithInputParameters = function() {
				return this._outAttributes.getAttributesWithInputParameters();
			};

			/**
			 *
			 * @param {Attribute}attribute
			 * @returns {boolean}
			 */
			Interpreter.prototype.doesSatisfyTypeOf = function(attribute) {
				return this._outAttributes.containsTypeOf(attribute);
			};

			return Interpreter;
		})();
	}
);
define('interpretation',['interpreter', 'attributeList'], function(Interpreter, AttributeList) {
    return (function () {
        /**
         *
         * @param {String} interpreterId
         * @param {AttributeList} inAttributes
         * @param {AttributeList} outAttributes
         * @returns {Interpretation}
         * @constructs Interpretation
         */
        function Interpretation(interpreterId, inAttributes, outAttributes) {
            /**
             *
             * @type {String}
             */
            this.interpreterId = interpreterId;

            /**
             *
             * @type {AttributeList}
             */
            this.inAttributeTypes = inAttributes;

            /**
             *
             * @type {AttributeList}
             */
            this.outAttributeTypes = outAttributes;

            return this;
        }

        return Interpretation;
    })();
});
define('aggregator',['MathUuid', 'widget', 'attribute', 'attributeList', 'subscriber', 'subscriberList', 'callbackList', 'storage', 'interpreter', 'interpretation'],
 	function(MathUuid, Widget, Attribute, AttributeList, Subscriber, SubscriberList, CallbackList, Storage, Interpreter, Interpretation){
		return (function() {
			/**
			 * Generates the id and initializes the Aggregator.
			 *
			 * @classdesc The Widget handles the access to sensors.
			 * @constructs Aggregator
			 * @extends Widget
			 */
			function Aggregator(discoverer, attributes) {
				/**
				 * List of subscribed widgets referenced by ID.
				 *
				 * @protected
				 * @type {Array.<String>}
				 */
				this._widgets = [];

				/**
				 *
				 * @protected
				 * @type {Array.<Interpretation>}
				 */
				this._interpretations = [];

				/**
				 * Database of the Aggregator.
				 *
				 * @protected
				 * @type {Storage}
				 */
				this._db = new Storage("DB_Aggregator", 7200000, 5);

				Widget.call(this, discoverer, attributes);

				/**
				 * Name of the Aggregator.
				 *
				 * @type {string}
				 */
				this.name = 'Aggregator';

				return this;
			}

			Aggregator.prototype = Object.create(Widget.prototype);
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
			 * Retrieves all Attributes of the specified widgets.
			 *
			 * @protected
			 */
			Aggregator.prototype._initOutAttributes = function() {
				if(this._widgets.length > 0){
					for(var i in this._widgets){
						var widgetId = this._widgets[i];
						/** @type {Widget} */
						var theWidget = this._discoverer.getComponent(widgetId);
						if (theWidget) {
							this._setOutAttributes(theWidget.getOutAttributes());
						}
					}
				}
			};

			/**
			 * Retrieves all ConstantAttributes of the specified widgets.
			 *
			 * @protected
			 * @override
			 */
			Aggregator.prototype._initConstantOutAttributes = function() {
				if(this._widgets.length > 0){
					for(var i in this._widgets){
						var widgetId = this._widgets[i];
						/** @type {Widget} */
						var theWidget = this._discoverer.getComponent(widgetId);
						if (theWidget) {
							this._setConstantOutAttributes(theWidget.getConstantOutAttributes());
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
				if(this._widgets.length > 0){
					for(var i in this._widgets){
						var widgetId = this._widgets[i];
						this.initWidgetSubscription(widgetId);
					}
				}
			};

			/**
			 * Start the setup of the aggregator after the initialisation has finished.
			 *
			 * @public
			 * @override
			 * @param {AttributeList} attributes
			 */
			Aggregator.prototype.didFinishInitialization = function(attributes) {
				this._aggregatorSetup(attributes);
			};

			/**
			 * InitMethod for Aggregators. Called by constructor. Initializes the associated Storage.
			 *
			 * @protected
			 */
			Aggregator.prototype._aggregatorSetup = function(attributes) {
				this._setAggregatorAttributeValues(attributes);
				this._setAggregatorConstantAttributeValues();
				this._setAggregatorCallbacks();

				this.didFinishSetup();
			};

			/**
			 * Initializes the provided attributeValues that are only specific to the Aggregator.
			 * Called by aggregatorSetup().
			 *
			 * @virtual
			 * @protected
			 */
			Aggregator.prototype._setAggregatorAttributeValues = function(attributes) {
				for (var index in attributes) {
					var theAttribute = attributes[index];
					this.addOutAttribute(theAttribute);
				}
			};

			/**
			 * Initializes the provided ConstantAttributeValues that are only specific to the Aggregator.
			 * Called by aggregatorSetup().
			 *
			 * @virtual
			 * @protected
			 */
			Aggregator.prototype._setAggregatorConstantAttributeValues = function() {

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
			 * Returns the current Attributes that are saved in the cache.
			 *
			 * @public
			 * @returns {AttributeList}
			 */
			Aggregator.prototype.getCurrentData = function() {
				return this._outAttributes;
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
					var subscriber = new Subscriber().withSubscriberId(this.id).
						withSubscriberName(this.name).
						withSubscriptionCallbacks(callbacks).
						withAttributesSubset(subSet).
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
			 * @param {CallbackList} callbackList required Callbacks
			 */
			Aggregator.prototype.addWidgetSubscription = function(widgetIdOrWidget, callbackList){
				if (typeof widgetIdOrWidget != "string" && widgetIdOrWidget instanceof Widget && !(widgetIdOrWidget instanceof Aggregator)) {
					if (!callbackList || callbackList instanceof CallbackList) {
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
							var typeList = singleCallback.getAttributeTypes().getItems();
							for(var y in typeList){
								var singleType = typeList[y];
								this.addOutAttribute(singleType);
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
						console.log('aggregator unsubscribeFrom: ' + widget.getName());
						widget.removeSubscriber(this.id);
						this._removeWidget(widgetId);
					}
				}
			};

			/**
			 * Puts context data to Widget and expects an array.
			 *
			 * @override
			 * @public
			 * @param {(AttributeList|Array)} attributeListOrArray data that shall be input
			 */
			Aggregator.prototype.putData = function(attributeListOrArray){
				var list = [];
				if(attributeListOrArray instanceof Array){
					list = attributeListOrArray;
				} else if (attributeListOrArray instanceof AttributeList) {
					list = attributeListOrArray.getItems();
				}
				for(var i in list){
					var theAttribute = list[i];
					if(theAttribute instanceof Attribute && this._isOutAttribute(theAttribute)){
						this.addOutAttribute(theAttribute);
						if(this._db){
							this._store(theAttribute);
						}
					}
				}
			};

			/**
			 * Calls the given Interpreter for interpretation the data.
			 *
			 * @public
			 * @param {String} interpreterId ID of the searched Interpreter
			 * @param {AttributeList} inAttributes
			 * @param {AttributeList} outAttributes
			 * @param {?function} callback for additional actions, if an asynchronous function is used
			 */
			Aggregator.prototype.interpretData = function(interpreterId, inAttributes, outAttributes, callback){
				var interpreter = this._discoverer.getComponent(interpreterId);
				if (interpreter instanceof Interpreter) {
					interpreter.callInterpreter(inAttributes, outAttributes, callback);
				}
			};

			/**
			 * Stores the data.
			 *
			 * @protected
			 * @param {Attribute} attribute data that should be stored
			 */
			Aggregator.prototype._store = function(attribute) {
				this._db.store(attribute);
			};

			/**
			 * Queries the database and returns the last retrieval result.
			 * It may be that the retrieval result is not up to date,
			 * because an asynchronous function is used for the retrieval.
			 * For retrieving the current data, this function can be used as callback function
			 * in retrieveStorage().
			 *
			 * @public
			 * @param {String} name Name of the searched AtTributes.
			 * @param {?function} callback for alternative  actions, because an asynchronous function is used
			 */
			Aggregator.prototype.queryAttribute = function(name, callback){
				this._db.retrieveAttributes(name, callback);
			};

			/**
			 * Queries a specific table and only actualizes the storage cache.
			 * For an alternativ action can be used a callback.
			 *
			 * @public
			 * @returns {RetrievalResult}
			 */
			Aggregator.prototype.retrieveStorage = function() {
				return this._db.getCurrentData();
			};

			/**
			 * Returns an overview about the stored attributes.
			 * It may be that the overview about the stored attributes is not up to date,
			 * because an asynchronous function is used for the retrieval.
			 * For retrieving the current data, this function can be used as callback function
			 * in queryTables().
			 *
			 * @public
			 * @returns {?Array}
			 */
			Aggregator.prototype.getStorageOverview = function() {
				return this._db.getAttributesOverview();
			};

			/**
			 * Only updates the attribute cache in the database.
			 * For an alternative action a callback can be used.
			 *
			 * @public
			 * @param {?function} callback for alternative actions, because an asynchronous function is used
			 */
			Aggregator.prototype.queryTables = function(callback) {
				this._db.getAttributeNames(callback);
			};

			/**
			 * Updates the information for the widget with the provided ID and calls the callback afterwards.
			 *
			 * @public
			 * @virtual
			 * @param {String} widgetId The ID of the widget to query.
			 * @param {Callback} callback The callback to query after the widget was updated.
			 */
			Aggregator.prototype.queryReferencedWidget = function(widgetId, callback) {
				this._discoverer.getWidget(widgetId).updateWidgetInformation(callback);
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
			 * @private
			 * @alias hasComponent
			 * @memberof Aggregator#
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
			 * @param {Attribute} attribute
			 * @returns {boolean}
			 */
			Aggregator.prototype.doesSatisfyTypeOf = function(attribute) {
				var componentUUIDs = this.getComponentUUIDs();
				var doesSatisfy = false;

				for (var index in componentUUIDs) {
					var theComponent = this._discoverer.getComponent(componentUUIDs[index]);
					if (theComponent.doesSatisfyTypeOf(attribute)) {
						doesSatisfy = true;
					}
				}

				return doesSatisfy;
			};

			/**
			 * Searches for components that can satisfy the requested attributes. Through recursion it is possible to search
			 * for components that satisfy attributes of components that have been found in the process.
			 *
			 * @private
			 * @param {AttributeList} unsatisfiedAttributes A list of attributes that components should be searched for.
			 * @param {boolean} all If true all attributes must be satisfied by a single component.
			 * @param {Array} componentTypes An array of components classes that should be searched for (e.g. Widget, Interpreter and Aggregator).
			 */
			Aggregator.prototype._getComponentsForUnsatisfiedAttributes = function(unsatisfiedAttributes, all, componentTypes) {
				// ask the discoverer for components that satisfy the requested components
				var relevantComponents = this._discoverer.getComponentsByAttributes(unsatisfiedAttributes, all, componentTypes);
				console.log("I found "+relevantComponents.length+" component(s) that might satisfy the requested attributes.");

				// iterate over all found components
				for(var index in relevantComponents) {
					// get the component
					var theComponent = relevantComponents[index];
					console.log("Let's look at component "+theComponent.getName()+".");

					// if the component was added before, ignore it
					if (!this._hasComponent(theComponent.getId())) {
						var outAttributes = theComponent.getOutAttributes().getItems();

						// if component is a widget and it wasn't added before, subscribe to its callbacks
						if (theComponent instanceof Widget) {
							console.log("It's a widget.");

							this.addWidgetSubscription(theComponent);
							// remove satisfied attributes
							for (var widgetOutAttributeIndex in outAttributes) {
								var widgetOutAttribute = outAttributes[widgetOutAttributeIndex];
								// add the attribute type to the aggregators list of handled attribute types
								if (!this.getOutAttributes().containsTypeOf(widgetOutAttribute)) this.addOutAttribute(widgetOutAttribute);
								console.log("I can now satisfy attribute "+widgetOutAttribute+" with the help of "+theComponent.getName()+"! That was easy :)");
								unsatisfiedAttributes.removeAttributeWithTypeOf(widgetOutAttribute);
							}
						} else if (theComponent instanceof Interpreter) { // if the component is an interpreter and all its in attributes can be satisfied, add the interpreter
							console.log("It's an interpreter.");

							var inAttributes = theComponent.getInAttributes().getItems();
							var canSatisfyInAttributes = true;

							// iterate over the attributes needed to satisfy the interpreter
							for (var inAttributeIdentifier in inAttributes) {
								// get the attribute
								var theInAttribute = inAttributes[inAttributeIdentifier];
								console.log("The interpreter needs the attribute "+theInAttribute+".");

								// if required attribute is not already satisfied by the aggregator search for components that do
								if (!this.doesSatisfyTypeOf(theInAttribute)) {
									console.log("It seems that I can't satisfy "+theInAttribute+", but I will search for components that can.");
									var newAttributeList = new AttributeList();
									newAttributeList.put(theInAttribute);
									this._getComponentsForUnsatisfiedAttributes(newAttributeList, false, [Widget, Interpreter]);
									// if the attribute still can't be satisfied drop the interpreter
									if (!this.doesSatisfyTypeOf(theInAttribute)) {
										console.log("I couldn't find a component to satisfy "+theInAttribute+". Dropping interpreter "+theComponent.getName()+". Bye bye.");
										canSatisfyInAttributes = false;
										break;
									}
								} else {
									console.log("It seems that I already satisfy the attribute "+theInAttribute+". Let's move on.");
								}
							}

							if (canSatisfyInAttributes) {
								// remove satisfied attribute
								for (var interpreterOutAttributeIndex in outAttributes) {
									var interpreterOutAttribute = outAttributes[interpreterOutAttributeIndex];
									// add the attribute type to the aggregators list of handled attribute types
									for (var unsatisfiedAttributeIndex in unsatisfiedAttributes.getItems()) {
										var theUnsatisfiedAttribute = unsatisfiedAttributes.getItems()[unsatisfiedAttributeIndex];
										if (theUnsatisfiedAttribute.equalsTypeOf(interpreterOutAttribute)) {
											this.addOutAttribute(theUnsatisfiedAttribute);
											console.log("I can now satisfy attribute "+theUnsatisfiedAttribute+" with the help of "+theComponent.getName()+"! Great!");
											this._interpretations.push(new Interpretation(theComponent.getId(), theComponent.getInAttributes(), new AttributeList().withItems([theUnsatisfiedAttribute])));
										}
									}
									unsatisfiedAttributes.removeAttributeWithTypeOf(interpreterOutAttribute, true);
								}
							} else {
								console.log("Found interpreter but can't satisfy required attributes.");
								for (var j in theComponent.getInAttributes().getItems()) {
									console.log("Missing "+theComponent.getInAttributes().getItems()[j]+".");
								}
							}
						}
					} else {
						console.log("Aggregator already has component "+theComponent.getName()+". Nothing to do here ;)");
					}
				}
			};

			/**
			 * After the aggregator finished its setup start searching for component that satisfy the attributes that where requrested.
			 *
			 * @public
			 * @virtual
			 */
			Aggregator.prototype.didFinishSetup = function() {
				var unsatisfiedAttributes = this.getOutAttributes().clone();

				// get all widgets that satisfy attribute types
				this._getComponentsForUnsatisfiedAttributes(unsatisfiedAttributes, false, [Widget]);
				// get all interpreters that satisfy attribute types
				this._getComponentsForUnsatisfiedAttributes(unsatisfiedAttributes, false, [Interpreter]);

				console.log("Unsatisfied attributes: "+unsatisfiedAttributes.size());
				console.log("Satisfied attributes: "+this.getOutAttributes().size());
				console.log("Interpretations "+this._interpretations.length);
			};

			/**
			 * Updates all the widgets referenced by the aggregator and calls the provided callback afterwards.
			 *
			 * @public
			 * @virtual
			 * @param {Function} callback The callback to query after all the widget where updated.
			 */
			Aggregator.prototype.queryReferencedWidgets = function(callback) {
				var self = this;
				var completedQueriesCounter = 0;

				if (this._widgets.length > 0) {
					for (var index in this._widgets) {
						var theWidgetId = this._widgets[index];
						this.queryReferencedWidget(theWidgetId, function () {
							completedQueriesCounter++;
							if (completedQueriesCounter == self._widgets.length) {
								if (callback && typeof(callback) == 'function') {
									callback(self.getOutAttributes());
								}
							}
						});
					}
				} else {
					if (callback && typeof(callback) == 'function') {
						callback(self.getOutAttributes());
					}
				}
			};

			/**
			 * Let's all connected interpreters interpret data.
			 *
			 * @public
			 * @param {function} callback The callback to query after all the interpreters did interpret data.
			 */
			Aggregator.prototype.queryReferencedInterpreters = function(callback) {
				/**
				 *
				 * @type {Aggregator}
				 */
				var self = this;
				var completedQueriesCounter = 0;

				if (this._interpretations.length > 0) {
					for (var index in this._interpretations) {
						var theInterpretation = this._interpretations[index];
						var theInterpreterId = theInterpretation.interpreterId;
						var interpretationInAttributeValues = this.getOutAttributes(theInterpretation.inAttributeTypes);
						var interpretationOutAttributeValues = this.getOutAttributes(theInterpretation.outAttributeTypes);

						self.interpretData(theInterpreterId, interpretationInAttributeValues, interpretationOutAttributeValues, function(interpretedData) {
							for (var j in interpretedData.getItems()) {
								var theInterpretedData = interpretedData.getItems()[j];

								self.addOutAttribute(theInterpretedData);
								if (self._db){
									self._store(theInterpretedData);
								}
							}

							completedQueriesCounter++;
							if (completedQueriesCounter == self._interpretations.length) {
								if (callback && typeof(callback) == 'function') {
									callback(self.getOutAttributes());
								}
							}
						});
					}
				} else {
					if (callback && typeof(callback) == 'function') {
						callback(self.getOutAttributes());
					}
				}
			};

			/**
			 * Query all referenced widgets and afterwards all connected interpreters.
			 *
			 * @public
			 * @alias queryReferencedComponents
			 * @memberof Aggregator#
			 * @param {Function} callback the callback to query after all components did finish their work.
			 */
			Aggregator.prototype.queryReferencedComponents = function(callback) {
				var self = this;

				this.queryReferencedWidgets(function(_attributeValues) {
					self.queryReferencedInterpreters(function(_attributeValues) {
						if (callback && typeof(callback) == 'function') {
							callback(_attributeValues);
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
define('discoverer',['attributeList', 'widget', 'interpreter', 'aggregator' ],
	function(AttributeList, Widget, Interpreter, Aggregator) {
		return (function() {
			/**
			 * Constructor: All known components given in the associated functions will be registered as startup.
			 *
			 * @classdesc The Discoverer handles requests for components and attributes.
			 * @constructs Discoverer
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
				 * List of translations or synonymous attributes, respectively.
				 *
				 * @type {Array}
				 * @private
				 */
				this._translations = (translations instanceof Array) ? translations : [];

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
			 * Returns all components that have the specified attribute as
			 * outAttribute. It can be chosen between the verification of
			 * all attributes or at least one attribute.
			 *
			 * @param {AttributeList|Array} attributeListOrArray list of searched attributes
			 * @param {Boolean} all choise of the verification mode
			 * @param {Array} componentTypes Components types to search for
			 * @returns {Array}
			 */
			Discoverer.prototype.getComponentsByAttributes = function(attributeListOrArray, all, componentTypes) {
				var componentList = [];
				var list = [];
				if (typeof componentTypes == "undefined") componentTypes = [Widget, Interpreter, Aggregator];
				if (attributeListOrArray instanceof Array) {
					list = attributeListOrArray;
				} else if (attributeListOrArray.constructor === AttributeList) {
					list = attributeListOrArray.getItems();
				}
				if (typeof list != "undefined") {
					var components = this.getComponents(componentTypes);
					for (var i in components) {
						var theComponent = components[i];
						if(all && this._containsAllAttributes(theComponent, list)) {
							componentList.push(theComponent);
						} else if(!all && this._containsAtLeastOneAttribute(theComponent, list)) {
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
			 * Builds a new attribute from given name, type and parameters,
			 * adding known translations to its synonyms.
			 *
			 * @param name
			 * @param type
			 * @param parameterList
			 * @returns {Attribute}
			 */
			Discoverer.prototype.buildAttribute = function(name, type, parameterList) {
				var newAttribute = new Attribute().withName(name).withType(type);

				while (typeof parameterList != 'undefined' && parameterList.length > 0)
				{
					var param = parameterList.pop();
					var value = param.pop();
					var key = param.pop();
					if (typeof key != 'undefined' && typeof value != 'undefined')
						newAttribute = newAttribute.withParameter(new Parameter().withKey(key).withValue(value));
				}
				for (var index in this._translations) {
					var translation = this._translations[index];
					if (translation.translates(newAttribute))
						newAttribute = newAttribute.withSynonym(translation.getSynonym());
				}
				return newAttribute;
			};


			/***********************************************************************
			 * Helper *
			 **********************************************************************/
			/**
			 * Helper: Verifies whether a component description contains all searched attributes.
			 *
			 * @private
			 * @param {Widget|Interpreter|Aggregator} component description of a component
			 * @param {Array} list searched attributes
			 * @returns {boolean}
			 */
			Discoverer.prototype._containsAllAttributes = function(component, list) {
				for (var j in list) {
					var attribute = list[j];
					if (!component.doesSatisfyTypeOf(attribute)) {
						return false;
					}
				}
				return true;
			};

			/**
			 * Helper: Verifies whether a component description contains at least on searched attributes.
			 *
			 * @private
			 * @param {Widget|Interpreter|Aggregator} component description of a component
			 * @param {Array} list searched attributes
			 * @returns {boolean}
			 */
			Discoverer.prototype._containsAtLeastOneAttribute = function(component, list) {
				for (var j in list) {
					var attribute = list[j];
					if (component.doesSatisfyTypeOf(attribute)) {
						return true;
					}
				}
				return false;
			};

			return Discoverer;
		})();
	}
);
/**
 * This module represents the helper class Translation. 
 * 
 * @module Translation
 */
define('translation', ['attribute'], function(Attribute) {
	return (function() {
		/**
		 * Constructs a translation tuple.
		 *
		 * @classdesc This class represents a translation tuple. It holds two synonymous attribute types.
		 * @requires attribute
		 * @constructs Translation
		 */
		function Translation(fromAttribute, toAttribute) {
			/**
			 *
			 * @type {?Attribute}
			 * @private
			 */
			this._fromAttribute = null;

			/**
			 *
			 * @type {?Attribute}
			 * @private
			 */
			this._toAttribute = null;

			if (fromAttribute instanceof Attribute && toAttribute instanceof Attribute) {
				this._fromAttribute = fromAttribute;
				this._toAttribute = toAttribute;
			}

			return this;
		}

		/**
		 * Look for a translation and return the found synonym.
		 *
		 * @returns {Attribute} The synonymous attribute
		 */
		Translation.prototype.getSynonym = function() {
			return this._toAttribute;
		};

		/**
		 * Look for a translation and return true if one exists.
		 *
		 * @param {Attribute} attribute Attribute whose synonym is queried
		 * @returns {boolean}
		 */
		Translation.prototype.translates = function(attribute) {
			return this._fromAttribute.equalsTypeOf(attribute);
		};

		return Translation;
	})();
});
	define('contactJS',['retrievalResult',
			'storage',
			'aggregator',
		    'attribute',
		    'attributeList',
		    'parameter',
		    'parameterList',		
		    'condition',
		    'conditionList',
		    'conditionMethod',
		    'equals',
            'unequals',
		    'discoverer',
		    'translation',
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
			    Attribute,
			    AttributeList,
			    Parameter,
			    ParameterList,		
			    Condition,
			    ConditionList,
			    ConditionMethod,
			    Equals,
                UnEquals,
			    Discoverer,
			    Translation,
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
	contactJS.VERSION = '2.0.1';
	// Methods
	contactJS.RetrievalResult = RetrievalResult;
	contactJS.Storage = Storage;
	contactJS.Aggregator = Aggregator;
	contactJS.Attribute = Attribute;
	contactJS.AttributeList = AttributeList;
	contactJS.Parameter = Parameter;
	contactJS.ParameterList = ParameterList;
	contactJS.Condition = Condition;
	contactJS.ConditionList = ConditionList;
	contactJS.ConditionMethod = ConditionMethod;
	contactJS.Equals = Equals;
    contactJS.UnEquals = UnEquals;
	contactJS.Discoverer = Discoverer;
	contactJS.Translation = Translation;
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