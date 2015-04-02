(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD.
    define(['easejs', 'jquery', 'MathUuid'],factory);
  } else {
    	root.contactJS = factory(root.easejs, root.$, root.MathUuid);
  }
}(this, function(easejs, $, MathUuid) {/**
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
 * This module represents a RetrievalResult.
 * It contains the data that were retrieved from the database
 * 
 * @module RetrievalResult
 * @fileOverview
 */
define('retrievalResult',['easejs'],
    function(easejs){
    	var Class = easejs.Class;
    	/**
    	 * @class RetrievalResult
    	 * @classdesc Contains the data that were retrieved from the database.
    	 * @requires easejs
    	 */
		var RetrievalResult = Class('RetrievalResult',{
			
			/**
			 * @alias name
			 * @private
			 * @type {string}
			 * @memberof RetrievalResult#
			 * @desc Name of the retrieved Attribute.
			 */
			'private name' : '', 
			/**
			 * @alias timestamp
			 * @private
			 * @type {date}
			 * @memberof RetrievalResult#
			 * @desc Time of the retrieval.
			 */
			'private timestamp' : '',
			/**
			 * @alias values
			 * @private
			 * @type {AttributeValueList}
			 * @memberof RetrievalResult#
			 * @desc Retrieved Attributes.
			 */
			'private values' : [],
				
			/**
			 * Builder for name.
			 * 
			 * @public
			 * @alias withName
			 * @memberof RetrievalResult#
			 * @param {String} _name name
			 * @returns {RetrievalResult}
			 */
    		'public withName' : function(_name){
    			this.setName(_name);
    			return this;
    		},

    		/**
			 * Builder for timestamp.
			 * 
			 * @public
			 * @alias withTimestamp
			 * @memberof RetrievalResult#
			 * @param {String} _timestamp timestamp
			 * @returns {RetrievalResult}
			 */
    		'public withTimestamp' : function(_timestamp){
    			this.setTimestamp(_timestamp);
    			return this;
    		},

    		/**
			 * Builder for values.
			 * 
			 * @public
			 * @alias withValues
			 * @memberof RetrievalResult#
			 * @param {Array} _values values
			 * @returns {RetrievalResult}
			 */
    		'public withValues' : function(_values){
    			this.setValues(_values);
    			return this;
    		},
    		
    		/**
    		 * Returns the Attribute name.
    		 * 
    		 * @public
    		 * @alias getName
    		 * @memberof RetrievalResult#
    		 * @returns {string}
    		 */
			'public getName' : function(){
				return this.name;
			},
			
			/**
			 * Returns the retrieval time.
			 * 
			 * @public
			 * @alias getTimestamp
			 * @memberof RetrievalResult#
			 * @returns {date}
			 */
			'public getTimestamp' : function(){
				return this.timestamp;
			},
			
			/**
			 * Returns the retrieved Attributes.
			 * 
			 * @public
			 * @alias getValues
			 * @memberof RetrievalResult#
			 * @returns {Array}
			 */
			'public getValues' : function(){
				return this.values;
			},

			/**
    		 * Sets the Attribute name.
    		 * 
    		 * @public
    		 * @alias setName
    		 * @memberof RetrievalResult#
    		 * @param {string} _name Name of the retrieved Attribute.
    		 */
			'public setName' : function(_name){
				if(typeof _name === 'string'){
					this.name = _name;
				}
			},

			/**
    		 * Sets the retrieval time.
    		 * 
    		 * @public
    		 * @alias setTimestamp
    		 * @memberof RetrievalResult#
    		 * @param {date} _timstamp Retrieval time.
    		 */
			'public setTimestamp' : function(_timesstamp){
				if(_timesstamp instanceof Date){
					this.type = _timesstamp;
				}
			},
			
			/**
    		 * Sets the retrieved values.
    		 * 
    		 * @public
    		 * @alias setValues
    		 * @memberof RetrievalResult#
    		 * @param {Array} _values Retrieved Attributes.
    		 */
			'public setValues' : function(_values){
				if(_values instanceof Array){
					this.values = _values;
				}
			}

			});

		return RetrievalResult;
	
});
/**
 * This module represents a List. 
 * It is an abstract Class.
 * 
 * @module AbstractList
 * @fileOverview
 */
define('abstractList',[ 'easejs' ], function(easejs) {
	var AbstractClass = easejs.AbstractClass;
	/**
	 * @class AbstractList
	 * @classdesc This class represents a list.
	 * @requires easejs
	 */
	var AbstractList = AbstractClass('AbstractList', {

		/**
		 * @alias counter
		 * @protected
		 * @type {int}
		 * @memberof AbstractList#
		 * @desc Number of Items.
		 */
		'protected counter' : 0,
		/**
		 * @alias items
		 * @protected
		 * @memberof AbstractList#
		 * @desc ItemList
		 */
		'protected items' : [],

		/**
		 * Builder for Item list.
		 * 
		 * @function
		 * @abstract
		 * @public
		 * @alias withItems
		 * @memberof AbstractList#
		 * @param {*} list
		 * @returns {*}
		 */
		'abstract public withItems' : [ 'list' ],
		/**
		 * Adds the specified item to the itemList.
		 * 
		 * @function
		 * @abstract
		 * @public
		 * @alias put
		 * @memberof AbstractList#
		 * @param {*} item item that shoud be added
		 */
		'abstract public put' : [ 'item' ],
		/**
		 * Adds all items in the specified list to the
		 * itemList.
		 *  
		 * @function
		 * @abstract
		 * @public
		 * @alias putAll
		 * @memberof AbstractList#
		 * @param {*} list list of items that should be added
		 */
		'abstract public putAll' : [ 'list' ],
		/**
		 * Verifies whether the given item is included
		 * in this list.
		 * 
		 * @function
		 * @abstract
		 * @public
		 * @alias contains
		 * @memberof AbstractList#
		 * @param {*} item Item that should be checked.
		 * @returns {boolean}
		 */
		'abstract public contains' : [ 'item' ],
		/**
		 * Compare the specified WidgetHandleList with this instance.
		 * 
		 * @function
		 * @abstract
		 * @public
		 * @alias equals
		 * @memberof AbstractList#
		 * @param {*} list List that should be compared.
		 */
		'abstract public equals' : [ 'list' ],

		/**
		 * Verifies whether an item exists for the specified key.
		 * 
		 * @public
		 * @alias containsKey
		 * @memberof AbstractList#
		 * @param {string} _key Key that should be verified.
		 * @returns {boolean}
		 */
		'public containsKey' : function(_key) {
			return !!(typeof _key !== 'undefined' && typeof this.items[_key] !== 'undefined');
		},

		/**
		 * Returns the item for the specified key.
		 * @public
		 * @alias getItem
		 * @memberof AbstractList#
		 * @param {string} _key key that should be searched for
		 * @returns {*} 
		 */
		'virtual public getItem' : function(_key) {
			return this.items[_key];
		},

		/**
		 * Removes the item from this list for the specified key.
		 * @public
		 * @alias removeItem
		 * @memberof AbstractList#
		 * @param {string} _key key that should be searched for
		 */
		'public removeItem' : function(_key) {
			if (this.containsKey(_key)) {
				delete this.items[_key];				
				this.counter--;
			}
		},

		/**
		 * Returns the keys of all items.
		 * @public
		 * @alias getKeys
		 * @memberof AbstractList#
		 * @returns {Array}
		 */
		'public getKeys' : function() {
			var listKeys = new Array();
			for ( var key in this.items) {
				listKeys.push(key);
			}
			return listKeys;
		},

		/**
		 * Returns all items.
		 * @virtual
		 * @public
		 * @alias getItems
		 * @memberof AbstractList#
		 * @returns {Array}
		 */
		'virtual public getItems' : function() {
			var listValues = new Array();
			for ( var key in this.items) {
				listValues.push(this.items[key]);
			}
			return listValues;
		},

		/**
		 * Returns the number of items that are included.
		 * 
		 * @public
		 * @alias size
		 * @memberof AbstractList#
		 * @returns {int}
		 */
		'public size' : function() {
			return this.counter;
		},

		/**
		 * Verifies whether the list is empty.
		 * @public
		 * @alias isEmpty
		 * @memberof AbstractList#
		 * @returns {boolean}
		 */
		'public isEmpty' : function() {
			return this.counter == 0;
		},
		
		/**
		 * Clears this list.
		 * @public
		 * @alias clear
		 * @memberof AbstractList#
		 */
		'public clear' : function() {
			this.items = [];
			this.counter = 0;
		}

	});

	return AbstractList;
});
/**
 * This module represents a Parameter.
 * Parameter specifies the Attributes to which they are associated.
 * 
 * @module Parameter
 * @fileOverview
 */
define('parameter',['easejs'],
    function(easejs){
    	var Class = easejs.Class;
    	/**
		 * @class Parameter
		 * @classdesc Parameter specifies the Attributes to that these are associated.
		 * @requires easejs
		 */
		var Parameter = Class('Parameter',{
			
			/**
			 * @alias key
			 * @protected
			 * @type {string}
			 * @memberof Parameter#
			 */
			'protected key' : '',
			/**
			 * @alias value
			 * @protected
			 * @type {string}
			 * @memberof Parameter#
			 */
			'protected value' : '', 
		
			/**
			 * Builder for key.
			 * 
			 * @public
			 * @alias withKey
			 * @memberof Parameter#
			 * @param {String} _key Key
			 * @returns {Parameter}
			 */
    		'public withKey' : function(_key){
    			this.setKey(_key);
    			return this;
    		},

    		/**
			 * Builder for value.
			 * 
			 * @public
			 * @alias withValue
			 * @memberof Parameter#
			 * @param {String} _value Value
			 * @returns {Parameter}
			 */
    		'public withValue' : function(_value){
    			this.setValue(_value);
    			return this;
    		},

    		/**
			 * Returns the key.
			 * 
			 * @public
			 * @alias getKey
			 * @memberof Parameter#
			 * @returns {string}
			 */
			'public getKey' : function(){
				return this.key;
			},
			
			/**
			 * Returns the value.
			 * 
			 * @public
			 * @alias getValue
			 * @memberof Parameter#
			 * @returns {string}
			 */
			'public getValue' : function(){
				return this.value;
			},

			/**
			 * Sets the key.
			 * 
			 * @public
			 * @alias setKey
			 * @memberof Parameter#
			 * @param {string} _key Key
			 */
			'public setKey' : function(_key){
				if(typeof _key === 'string'){
					this.key = _key;
                }
            },

			/**
			 * Sets the value.
			 * 
			 * @public
			 * @alias setValue
			 * @memberof Parameter#
			 * @param {string} _value Value
			 */
			'public setValue' : function(_value){
				if(typeof _value === 'string'){
					this.value = _value;
                }
            },
			
			/**
			 * Compares this instance with the given one.
			 * 
			 * @virtual
			 * @public
			 * @alias equals
			 * @memberof Parameter#
			 * @param {Parameter} _parameter Parameter that should be compared.
			 * @returns {boolean}
			 */
			'public equals' : function(_parameter) {
				if(Class.isA(Parameter, _parameter)){
					if(_parameter.getIdentifier() == this.getIdentifier()){
						return true;
					}
                }
                return false;

			},

            'public toString': function() {
                return "Parameter '"+this.key+" with value '"+this.value+"'.\n";
            },

            'public getIdentifier': function() {
                return "["+this.key+":"+this.value+"]";
            }

		});

        return Parameter;
	
});
/**
 * This module represents a ParameterList. It is a subclass of AbstractList.
 * 
 * @module ParameterList
 * @fileOverview
 */
define('parameterList',[ 'easejs', 'abstractList', 'parameter' ],
	function(easejs, AbstractList, Parameter) {
		var Class = easejs.Class;
		/**			 
		 * @class ParameterList
		 * @classdesc This class represents a list for Parameter.
		 * @extends AbstractList
		 * @requires easejs
		 * @requires AbstractList
		 * @requires Parameter
		 */
		var ParameterList = Class('ParameterList').extend(AbstractList,{

			/**
			 * @alias counter
			 * @protected
			 * @type {integer}
			 * @memberof ParameterList#
			 * @desc Number of items.
			 */
			'protected counter' : 0,
			/**
			 * @alias items
			 * @protected
			 * @type {ParameterList}
			 * @memberof ParameterList#
			 * @desc ItemList
			 */
			'protected items' : [],

			/**
			 * Builder for item list.
			 * 
			 * @public
			 * @alias withItems
			 * @memberof ParameterList#
			 * @param {(ParameterList|Array)} _parameterList ParameterList
			 * @returns {ParameterList}
			 */
			'public withItems' : function(_parameterList) {
				var list = [];
				if (_parameterList instanceof Array) {
					list = _parameterList;
				} else if (Class.isA(ParameterList, _parameterList)) {
					list = _parameterList.getItems();
				}
				for ( var i in list) {
					var parameter = list[i];
					if (Class.isA(Parameter, parameter)) {
						this.items[parameter.getKey()] = parameter.getValue();
						this.counter++;
					}
				}
				return this;
			},

			/**
			 * Adds the specified item to the item list.
			 * 
			 * @public
			 * @alias put
			 * @memberof ParameterList#
			 * @param {Parameter} _parameter ParameterList
			 */
			'public put' : function(_parameter) {
				if (Class.isA(Parameter, _parameter)) {

					if (!(this.containsKey(_parameter.getKey()))) {
						this.counter++;
					}
					this.items[_parameter.getKey()] = _parameter.getValue();
				}
			},

			/**
			 * Adds all items in the specified list to the item list.
			 * 
			 * @public
			 * @alias putAll
			 * @memberof ParameterList#
			 * @param {ParameterList} _parameterList ParameterList
			 */
			'public putAll' : function(_parameterList) {
				var list = [];
				if (_parameterList instanceof Array) {
					list = _parameterList;
				} else if (Class.isA(ParameterList,	_parameterList)) {
					list = _parameterList.getItems();
				}
				for ( var i in list) {
					var parameter = list[i];
					if (Class.isA(Parameter, parameter)) {
						if (!(this.containsKey(parameter.getKey()))) {
							this.counter++;
						}
						this.items[parameter.getKey()] = parameter.getValue();
					}
				}
			},

			/**
			 * Verifies whether the given item is contained in the list.
			 * 
			 * @public
			 * @alias contains
			 * @memberof ParameterList#
			 * @param {Parameter}
			 *            _item Parameter that should be
			 *            verified
			 * @returns {boolean}
			 */
			'public contains' : function(_item) {
				if (Class.isA(Parameter, _item)) {
					var tmp = this.getItem(_item.getKey());
					if (tmp === _item.getValue()) {
						return true;
					}
				}
				return false;
			},

			/**
			 * Compare the specified ParameterList with this instance. 
			 * 
			 * @public
			 * @alias equals
			 * @memberof ParameterList#
			 * @param {ParameterList} _list ParameterList that should be compared
			 * @returns {boolean}
			 */
			'public equals' : function(_parameterList) {
				if (Class.isA(ParameterList, _parameterList) && _parameterList.size() == this.size()) {
                    for (var index in _parameterList.getItems()) {
                        var theParameter = _parameterList.getItems()[index];
                        if (!this.contains(theParameter)) return false;
                    }
					return true;
				}
				return false;
			},

			/**
			 * Returns all items as parameter objects.
			 * @public
			 * @alias getItems
			 * @memberof ParameterList#
			 * @returns {Array}
			 */
			'override public getItems' : function() {
				var parameters = [];
				for (var key in this.items) {
					var parameter = new Parameter().withKey(key)
									.withValue(this.items[key]);
					parameters.push(parameter);
				}
				return parameters;
			},

            'public getItemsAsJson': function() {
                var parameters = {};
                for (var key in this.items) {
                    parameters[key] = this.items[key];
                }
                return parameters;
            },

            'public getIdentifier': function() {
                var identifier = "";
                for (var key in this.items) {
                    var value = this.items[key];
                    identifier += "["+key+":"+value+"]";
                }
                return identifier;
            }
		});

		return ParameterList;
	});
/**
 * This module represents an AttributeType.
 * AttributeTypes defines name, type (string, double,...) an associated parameter of an attribute.
 * 
 * @module AttributeType
 * @fileOverview
 */
define('attributeType',['easejs',
        'parameterList'],
    function(easejs,
    		ParameterList){
    	var Class = easejs.Class;
		var AttributeType = Class('AttributeType',{
			/**
			 * @alias name
			 * @protected
			 * @type {string}
			 * @memberof AttributeType#
			 * @desc Name of the Attribute
			 */
			'protected name' : '', 
			/**
			 * @alias type
			 * @protected
			 * @type {string}
			 * @memberof AttributeType#
			 * @desc Defines the type of the Attribute (i.e String, Double,...)
			 */
			'protected type' : '', 
			/**
			 * @alias parameterList
			 * @protected
			 * @type {ParameterList}
			 * @memberof AttributeType#
			 * @desc Name of the Attribute
			 */
			'protected parameterList' : [],

			/**
			 * Constructor: Initializes the ParameterList.
			 * 
			 * @class AttributeType
			 * @classdesc AttributeTypes defines name, type (string, double,...) an associated parameter of an attribute.
			 * @requires easejs
			 * @requires ParameterList
			 * @constructs AttributeType
			 */
			'public __construct' : function(){
				this.parameterList = new ParameterList();
			},

			/**
			 * Builder for name.
			 * 
			 * @public
			 * @alias withName
			 * @memberof AttributeType#
			 * @param {String} _name Name
			 * @returns {AttributeType}
			 */
    		'public withName' : function(_name){
    			this.setName(_name);
    			return this;
    		},

    		/**
			 * Builder for type.
			 * 
			 * @public
			 * @alias withType
			 * @memberof AttributeType#
			 * @param {String} _type Type
			 * @returns {AttributeType}
			 */
    		'public withType' : function(_type){
    			this.setType(_type);
    			return this;
    		},
    		
    		/**
			 * Builder for parameterList.
			 * 
			 * @public
			 * @alias withParameters
			 * @memberof AttributeType#
			 * @param {(ParameterList|Array)} _parameterList ParameterList
			 * @returns {AttributeType}
			 */
    		'public withParameters' : function(_parameterList){
    			this.setParameters(_parameterList);
    			return this;
    		},
    		
    		/**
			 * Builder for one parameter.
			 * 
			 * @public
			 * @alias withParameters
			 * @memberof AttributeType#
			 * @param {Parameter} _parameter Parameter
			 * @returns {AttributeType}
			 */
    		'public withParameter' : function(_parameter){
    			this.addParameter(_parameter);
    			return this;
    		},

    		/**
			 * Returns the name.
			 * 
			 * @public
			 * @alias getName
			 * @memberof AttributeType#
			 * @returns {string}
			 */
			'public getName' : function(){
				return this.name;
			},
			
			/**
			 * Returns the type.
			 * 
			 * @public
			 * @alias getType
			 * @memberof AttributeType#
			 * @returns {string}
			 */
			'public getType' : function(){
				return this.type;
			},
			
			/**
			 * Returns the parameters.
			 * 
			 * @public
			 * @alias getParameters
			 * @memberof AttributeType#
			 * @returns {ParameterList}
			 */
			'public getParameters' : function(){
				return this.parameterList;
			},

			/**
			 * Sets the name.
			 * 
			 * @public
			 * @alias setName
			 * @memberof AttributeType#
			 * @param {string} _name Name
			 */
			'public setName' : function(_name){
				if(typeof _name === 'string'){
					this.name = _name;
                }
            },

			/**
			 * Sets the type.
			 * 
			 * @public
			 * @alias setType
			 * @memberof AttributeType#
			 * @param {string} _type Type
			 */
			'public setType' : function(_type){
				if(typeof _type === 'string'){
					this.type = _type;
                }
            },
			
			/**
			 * Adds a parameter.
			 * 
			 * @public
			 * @alias addParameter
			 * @memberof AttributeType#
			 * @param {Parameter} _parameter Parameter
			 */
			'public addParameter' : function(_parameter){
					this.parameterList.put(_parameter);
			},
			
			/**
			 * Adds a list of Parameter.
			 * 
			 * @public
			 * @alias setParameters
			 * @memberof AttributeType#
			 * @param {ParameterList} _parameters ParameterList
			 */
			'public setParameters' : function(_parameters){
				this.parameterList.putAll(_parameters);
			},

            'public hasParameters' : function() {
                return this.parameterList.size() > 0;
            },

			/**
			 * Compares this instance with the given one.
			 * 
			 * @virtual
			 * @public
			 * @alias equals
			 * @memberof AttributeType#
			 * @param {AttributeType} _attributeType AttributeType that should be compared
			 * @returns {boolean}
			 */
			'virtual public equals' : function(_attributeType) {				
				if(Class.isA(AttributeType, _attributeType)){
					if (this.getIdentifier() == _attributeType.getIdentifier()) {
						return true;
                    }
                }
                return false;
			},

            'virtual public toString': function() {
                return this.getIdentifier();
            },

            'public getIdentifier': function() {
                var identifier = "("+this.name+":"+this.type+")";
                if (this.hasParameters()) {
                    identifier += "#";
                    identifier += this.parameterList.getIdentifier();
                }
                return identifier;
            }

        });

		return AttributeType;
	
});
/**
 * This module represents an AttributeValue. AttributeValue extends
 * AttributeTypes and adds the associated value.
 * 
 * @module AttributeValue
 * @fileOverview
 */
define('attributeValue',[ 'easejs', 'attributeType' ], function(easejs, AttributeType) {
	var Class = easejs.Class;

	/**
	 * @class AttributeValue
	 * @classdesc AttributeValue extends AttributeTypes and adds the associated
	 *            value.
	 * @requires easejs
	 * @requires AttributeType
	 */
	var AttributeValue = Class('AttributeValue').extend(
			AttributeType,
			{
				/**
				 * @alias value
				 * @protected
				 * @type {string}
				 * @memberof AttributeValue#
				 */
				'protected value' : '',
				/**
				 * @alias timestamp
				 * @protected
				 * @type {Date}
				 * @memberof AttributeValue#
				 * @desc Time when the value was set.
				 */
				'protected timestamp' : '',

				/**
				 * Builder for value.
				 *
				 * @public
				 * @alias withValue
				 * @memberof AttributeValue#
				 * @param {String} _value value
				 * @returns {AttributeValue}
				 */
				'public withValue' : function(_value) {
					this.setValue(_value);
					this.setTimestamp(Date.now());
					return this;
				},

				/**
				 * Builder for timestamp.
				 *
				 * @public
				 * @alias withTimestamp
				 * @memberof AttributeValue#
				 * @param {Date} _timestamp timestamp
				 * @returns {AttributeValue}
				 */
				'public withTimestamp' : function(_timestamp) {
					this.setTimestamp(_timestamp);
					return this;
				},

				/**
				 * Sets the value.
				 *
				 * @public
				 * @alias setValue
				 * @memberof AttributeValue#
				 * @param {string} _value value
				 */
				'public setValue' : function(_value) {
					this.value = _value;
				},

				/**
				 * Returns the value.
				 *
				 * @public
				 * @alias getValue
				 * @memberof AttributeValue#
				 * @returns {string}
				 */
				'public getValue' : function() {
					return this.value;
				},

				/**
				 * Sets the timestamp.
				 *
				 * @public
				 * @alias setTimestamp
				 * @memberof AttributeValue#
				 * @param {Date} _timestamp timestamp
				 */
				'public setTimestamp' : function(_time) {
					this.timestamp = _time;
				},

				/**
				 * Returns the timestamp.
				 *
				 * @public
				 * @alias getTimestamp
				 * @memberof AttributeValue#
				 * @returns {string}
				 */
				'public getTimestamp' : function() {
					return this.timestamp;
				},

				/**
				 * Compares this instance with the given one.
				 *
				 * @public
				 * @alias equals
				 * @memberof AttributeValue#
				 * @param {AttributeValue} _attributeValue AttributeValue that should be compared
				 * @returns {boolean}
				 */
				'override public equals' : function(_attributeValue) {
					if (Class.isA(AttributeValue, _attributeValue)) {
						if (this.__super(_attributeValue.getAttributeType())
								&& _attributeValue.getValue() == this
										.getValue()) {
							return true;
						}
					}
					return false;
				},

				/**
				 * Returns the AttributeType of an AttributeValue.
				 *
				 * @public
				 * @alias getAttributeType
				 * @memberof AttributeValue#
				 * @returns {AttributeType}
				 */
				'public getAttributeType' : function() {
                    return new AttributeType().withName(this.name)
                        .withType(this.type).withParameters(
                        this.parameterList);
				},

				/**
				 * Builds a new AttributeValue from the given type.
				 *
				 * @public
				 * @alias buildFromAttributeType
				 * @memberof AttributeValue#
				 * @param {AttributeType} _attributeType AttributeType for build process.
				 * @returns {AttributeValue}
				 */
				'public buildFromAttributeType' : function(_attributeType) {
					if (Class.isA(AttributeType, _attributeType)) {
                        return new AttributeValue().withName(_attributeType.getName())
                            .withType(_attributeType.getType()).withParameters(_attributeType.getParameters()).withValue('undefined');
					}
					return null;
				},

                'override public toString': function() {
                    return this.getIdentifier()+":"+this.getValue();
                }
			});

	return AttributeValue;
});
/**
 * This module represents an AttributeTypeList. It is a subclass of AbstractList.
 * 
 * @module AttributeTypeList
 * @fileOverview
 */
define('attributeTypeList',[ 'easejs', 'abstractList', 'attributeType', 'parameterList' ],
	function(easejs, AbstractList, AttributeType, ParameterList) {
		var Class = easejs.Class;
		/**
		 * @class AttributeTypeList
		 * @classdesc This class represents a list for AttributeType.
		 * @extends AbstractList
		 * @requires easejs
		 * @requires AbstractList
		 * @requires AttributeType
		 */
		var AttributeTypeList = Class('AttributeTypeList').extend(AbstractList,	{
			/**
			 * @alias counter
			 * @protected
			 * @type {integer}
			 * @memberof AttributeTypeList#
			 * @desc Number of items.
			 */
			'protected counter' : 0,
			/**
			 * @alias items
			 * @protected
			 * @type {AttributeTypeList}
			 * @memberof AttributeTypeList#
			 * @desc ItemList
			 */
			'protected items' : {},

			/**
			 * Builder for item list.
			 * 
			 * @public
			 * @alias withItems
			 * @memberof AttributeTypeList#
			 * @param {(AttributeTypeList)} _attributeTypeList AttributeTypeList
			 * @returns {AttributeTypeList}
			 */
			'public withItems' : function(_attributeTypeList) {
				var list = {};
				if (Class.isA(AttributeTypeList, _attributeTypeList)) {
					list = _attributeTypeList.getItems();
				} else {
                    throw "Not an AttributeTypeList";
                }
				for ( var i in list) {
					var attributeType = list[i];
					if (Class.isA(AttributeType, attributeType)) {
						this.items[attributeType.getIdentifier()] = attributeType;
						this.counter++;
					}
				}
				return this;
			},

			/**
			 * Adds the specified item to the itemList.
			 * 
			 * @public
			 * @alias put
			 * @memberof AttributeTypeList#
			 * @param {AttributeType} _attributeType AttributeType
			 */
			'public put' : function(_attributeType) {
				if (Class.isA(AttributeType, _attributeType)) {
					if (!(this.containsKey(_attributeType.getIdentifier()))) {
						this.counter++;
					}
					this.items[_attributeType.getIdentifier()] = _attributeType;
				}
			},

			/**
			 * Adds all items in the specified list to the
			 * itemList.
			 * 
			 * @public
			 * @alias putAll
			 * @memberof AttributeTypeList#
			 * @param {(AttributeTypeList|Array)} _attributeTypeList AttributeTypeList
			 */
			'public putAll' : function(_attributeTypeList) {
				var list = [];
				if (_attributeTypeList instanceof Array) {
					list = _attributeTypeList;
				} else if (Class.isA(AttributeTypeList,	_attributeTypeList)) {
					list = _attributeTypeList.getItems();
				}
				for ( var i in list) {
					var attributeType = list[i];
					if (Class.isA(AttributeType, attributeType)) {						
						if (!(this.containsKey(attributeType.getIdentifier()))) {
							this.counter++;
						}
						this.items[attributeType.getIdentifier()] = attributeType;
					}
				}
			},

			/**
			 * Verifies whether the given item is included
			 * in this list.
			 * 
			 * @public
			 * @alias contains
			 * @memberof AttributeTypeList#
			 * @param {AttributeType} _item AttributeType that should be verified.
			 * @returns {boolean}
			 */
			'public contains' : function(_item) {
				if (Class.isA(AttributeType, _item)) {
					var tmp = this.getItem(_item.getIdentifier());
					if (!(typeof tmp === 'undefined')
							&& tmp.equals(_item)) {
						return true;
					}
				}
				return false;
			},

			/**
			 * Compare the specified AttributeTypeList with this instance.
			 * 
			 * @public
			 * @alias equals
			 * @memberof AttributeTypeList#
			 * @param {AttributeTypeList} _list AttributeTypeList that should be compared.
			 * @returns {boolean}
			 */
			'public equals' : function(_list) {
				if (Class.isA(AttributeTypeList, _list)	&& _list.size() == this.size()) {
					var items = _list.getItems();
					for (var i in items) {
						var item = items[i];
						if (!this.contains(item)) {
							return false;
						}
					}
					return true;
				}
				return false;
			},

            /**
             * Returns the item for the specified key.
             * @public
             * @alias getItem
             * @memberof AbstractList#
             * @param {string} _key Key that should be searched for
             * @returns {*}
             */
            'override public getItem' : function(_identifier) {
                return this.items[_identifier];
            },

            'public clone': function() {
                var newList = new AttributeTypeList();
                for (var index in this.items) {
                    var oldAttributeType = this.items[index];
                    var newAttributeType = new AttributeType().
                        withName(oldAttributeType.getName()).
                        withType(oldAttributeType.getType()).
                        withParameters(oldAttributeType.getParameters());
                    newList.put(newAttributeType);
                }
                return newList;
            }
        });

		return AttributeTypeList;
	});
/**
 * This module represents a AttributeValueList. It is a subclass of
 * AbstractList.
 * 
 * @module AttributeValueList
 * @fileOverview
 */
define('attributeValueList',['easejs', 'abstractList', 'attributeValue', 'attributeType', 'attributeTypeList', 'parameterList'],
	function(easejs, AbstractList, AttributeValue, AttributeType, AttributeTypeList, ParameterList) {
		var Class = easejs.Class;

		/**
		 * @class AttributeValueList
		 * @classdesc This class represents a list for AttributeValue.
		 * @extends AbstractList
		 * @requires easejs
		 * @requires AbstractList
		 * @requires AttributeValue
		 * @requires AttributeType
		 * @requires AttributeTypeList)
		 */
		var AttributeValueList = Class('AttributeValueList').extend(AbstractList,{
			/**
			 * @alias counter
			 * @protected
			 * @type {integer}
			 * @memberof AttributeValueList#
			 * @desc Number of items.
			 */
			'protected counter' : 0,
			/**
			 * @alias items
			 * @protected
			 * @type {AttributeValueList}
			 * @memberof AttributeValueList#
			 * @desc ItemList.
			 */
			'protected items' : {},

			/**
			 * Builder for item list.
			 * 
			 * @public
			 * @alias withItems
			 * @memberof AttributeValueList#
			 * @param {(AttributeValueListst|Array)} _attributeValueList AttributeValueList
			 * @returns {AttributeValueList}
			 */
			'public withItems' : function(_attributeValueList) {
				var list = [];
				if (Class.isA(AttributeValueList,
						_attributeValueList)) {
					list = _attributeValueList.getItems();
				} else {
                    throw "Not an AttributeValueList";
                }
				for (var i in list) {
					var attributeValue = list[i];
					if (Class.isA(AttributeValue, attributeValue)) {
						this.items[attributeValue.getIdentifier()] = attributeValue;
						this.counter++;
					}
				}
				return this;
			},

			/**
			 * Add the specified item to this itemList.
			 * 
			 * @public
			 * @alias put
			 * @memberof AttributeValueList#
			 * @param {AttributeValue} _attributeValue AttributeValue
			 */
			'public put' : function(_attributeValue) {
				if (Class.isA(AttributeValue, _attributeValue)) {
					if (!(this.containsKey(_attributeValue.getIdentifier()))) {
						this.counter++;
					}
					this.items[_attributeValue.getIdentifier()] = _attributeValue;
				}
			},

			/**
			 * Adds all items in the specified list to this.
			 * itemList
			 * 
			 * @public
			 * @alias putAll
			 * @memberof AttributeValueList#
			 * @param {AttributeValueList} _attributeValueList AttributeValueList
			 */
			'public putAll' : function(_attributeValueList) {
				var list = [];
				if (_attributeValueList instanceof Array) {
					list = _attributeValueList;
				} else if (Class.isA(AttributeValueList, _attributeValueList)) {
					list = _attributeValueList.getItems();
				}
				for ( var i in list) {
					var attributeValue = list[i];
					if (Class.isA(AttributeValue, attributeValue)) {
						if (!(this.containsKey(attributeValue.getIdentifier()))) {
							this.counter++;
						}
						this.items[attributeValue.getIdentifier()] = attributeValue;
					}
				}
			},

			/**
			 * Verifies whether the given item is included
			 * in the list.
			 * 
			 * @public
			 * @alias contains
			 * @memberof AttributeValueList#
			 * @param {AttributeValue} _item AttributeValue that should be verified.
			 * @returns {boolean}
			 */
			'public contains' : function(_item) {
				if (Class.isA(AttributeValue, _item)) {
					var tmp = this.getItem(_item.getIdentifier());
					if (!(typeof tmp === 'undefined') && tmp.equals(_item)) {
						return true;
					}
				}
				return false;
			},

			/**
			 * Compare the specified AttributeValueList with
			 * this instance.
			 * 
			 * @public
			 * @alias equals
			 * @memberof AttributeValueList#
			 * @param {AttributeValueList} _list AttributeValueList that should be compared.
			 * @returns {boolean}
			 */
			'public equals' : function(_list) {
				if (Class.isA(AttributeValueList, _list) && _list.size() == this.size()) {
					var items = _list.getItems();
					for ( var i in items) {
						var item = items[i];
						if (!this.contains(item)) {
							return false;
						}
					}
					return true;
				}
				return false;
			},

			/**
			 * Returns only this values that matches to the
			 * given type.
			 * 
			 * @public
			 * @alias getSubset
			 * @memberof AttributeValueList#
			 * @param {(AttributeTypeList|Array)} _attributeTypeList AttributeTypes that should be returned.
			 * @returns {AttributeValueList}
			 */
			'public getSubset' : function(_attributeTypeList) {
				var response = new AttributeValueList();
				var list = [];
				if (_attributeTypeList instanceof Array) {
					list = _attributeTypeList;
				} else if (Class.isA(AttributeTypeList,	_attributeTypeList)) {
					list = _attributeTypeList.getItems();
				}
				for ( var i in list) {
					var attributeType = list[i];
					if (Class.isA(AttributeType, attributeType)) {
						var attribute = this.items[attributeType.getIdentifier()];
						if (typeof attribute != "undefined") {
							response.put(attribute);
						}
					}
				}
				return response;
			},
			
			/**
			 * Returns a subset without the given types.
			 * 
			 * @public
			 * @alias getSubsetWithoutItems
			 * @memberof AttributeValueList#
			 * @param {(AttributeTypeList|Array)} _attributeTypeList AttributeTypes that should not be included
			 * @returns {AttributeValueList}
			 */
			'public getSubsetWithoutItems' : function(_attributeTypeList) {
				var response = this;
				var list = [];
				if (_attributeTypeList instanceof Array) {
					list = _attributeTypeList;
				} else if (Class.isA(AttributeTypeList,	_attributeTypeList)) {
					list = _attributeTypeList.getItems();
				}
				for (var i in list) {
					var attributeType = list[i];
					if (Class.isA(AttributeType, attributeType)) {
						response.removeItem(attributeType.getIdentifier());
					}
				}
				return response;
			},

            /**
             * Alias for {#getItem}.
             *
             * @public
             * @alias getValue
             * @param _key The value key.
             * @returns {*}
             */
            'public getAttributeValue': function(_key) {
                return this.getItem(_key);
            },

            'public getValueForAttributeType': function(_attributeType) {
                return this.getAttributeValue(_attributeType.getIdentifier()).getValue();
            },

			'public getItemsForWildcard': function(_wildcardIdentifier, _attributeTypes) {

			}

		});

		return AttributeValueList;
	});
/**
 * This module representing a Storage.
 * The Storage handles the access to the database.
 * 
 * @module Widget
 * @fileOverview
 */
define('storage',['easejs', 'attributeValue', 'attributeValueList', 'attributeType',
        'retrievalResult', 'parameter', 'parameterList'],
 	function( easejs, AttributeValue, AttributeValueList, AttributeType,
 			RetrievalResult, Parameter, ParameterList){
 	var Class = easejs.Class;
	var Storage =  Class('Storage',		
	{
		
		/**
		 * @alias attributeNames
		 * @private
		 * @type {Array}
		 * @memberof Storage#
		 * @desc Names of all stored Attributes (tableNames as string).
		 */
		'private attributeNames' : [],
		/**
		 * @alias attributes
		 * @private
		 * @type {RetrievalResult}
		 * @memberof Storage#
		 * @desc Data of a retrieval.
		 */
		'private attributes' : '',
		/**
		 * @alias data
		 * @private
		 * @type {AttributeValueList}
		 * @memberof Storage#
		 * @desc Cache before storing the new data in the database.
		 */
		'private data' : [],
		/**
		 * @alias dataCount
		 * @private
		 * @type {Integer}
		 * @memberof Storage#
		 * @desc Names of all stored Attributes.
		 */
		'private dataCount' : '',
		/**
		 * @alias lastFlush
		 * @private
		 * @type {Date}
		 * @memberof Storage#
		 * @desc Time of the last flush.
		 */
		'private lastFlush' : '',
		/**
		 * @alias  timeCondition
		 * @private
		 * @type {Integer}
		 * @memberof Storage#
		 * @desc Condition (ms) at which point of time data are supposed to be flushed. 
		 * If the value is more than the value of 'timeCondition' ago, data should be 
		 * flushed again. The initial value is two hours.
		 */
		'private timeCondition' : 7200000,
		/**
		 * @alias countCondition
		 * @private
		 * @type {Number}
		 * @memberof Storage#
		 * @desc Condition at which point of time data are supposed to be flushed. 
		 * If at least 'countCondition' attributes are collected data will be flushed. 
		 * Initial value is 5.
		 */
		'private countCondition' : 5,
		/**
		 * @alias db
		 * @private
		 * @type {Database}
		 * @memberof Storage#
		 * @desc Associated database.
		 */
		'private db' : '',
		
		/**
		 * Constructor: Initializes the database and all return values.
		 * 
		 * @class Storage
		 * @classdesc Storage handles the access to the database.
		 * @requires easejs
		 * @requires AttributeValue
		 * @requires AttributeValueList
		 * @requires Parameter
		 * @requires ParameterList
		 * @requires RetrievalResult
		 * @constructs Storage
		 */

		'public __construct' : function(_name, _time, _counter){
			this.initStorage(_name);
			this.attributes = new RetrievalResult();
			this.data = new AttributeValueList();
			this.dataCount = 0;
			this.lastFlush = new Date();
			if(_time && _time === parseInt(_time) && _time!=0)
				this.timeCondition = _time;
			if(_counter && _counter === parseInt(_counter) && _counter != 0)
				this.countCondition = _counter;
		},
		
		/**
		 * Returns the last retrieved Attributes.
		 * 
		 * @public
		 * @alias getCurrentData
		 * @memberof Storage#
		 * @returns {RetrievalResult} 
		 */		
		'public getCurrentData' : function(){
			return this.attributes;
		},
		
		/**
		 * Returns the names of all stored Attributes (tableNames as string).
		 * 
		 * @public
		 * @alias getAttributesOverview
		 * @memberof Storage#
		 * @returns {Array} 
		 */	
		'public getAttributesOverview' : function(){
			return this.attributeNames;
		},
		
		/**
		 * Initializes a new database.
		 * 
		 * @private
		 * @alias initStorage
		 * @memberof Storage#
		 * @param {String} _name Name of the database.
		 */
		'private initStorage' : function(_name){
			if(!window.openDatabase) {
		        console.log('Databases are not supported in this browser.');
			}else{
				this.db = window.openDatabase(_name, "1.0", "DB_" + _name, 1024*1024);
				console.log('initStorage: ' + _name);
			}
		},
		
		/**
		 * Creates a new table. A table contains the values of one AttributeType.
		 * So the name is the AttributeName.
		 * 
		 * @private
		 * @alias createTable
		 * @memberof Storage#
		 * @param {String} _attribute tableName (should be the attributeName)
		 * @param {?function} _function For alternative actions, if an asynchronous function is used.
		 */
		'private createTable' : function(_attribute, _function){
			if(this.db){
				var tableName = this.tableName(_attribute);
				var statement = 'CREATE TABLE IF NOT EXISTS ' + tableName + ' (value_, type_, created_)';
				if(_function && typeof(_function) == 'function'){
					this.db.transaction(function(tx){tx.executeSql(statement);}, this.errorCB, _function);	
				} else {
					this.db.transaction(function(tx){tx.executeSql(statement);}, this.errorCB, this.successCB);			
				}
				if(!this.attributeNames.indexOf(name) > -1){
					this.attributeNames.push(tableName);
				}
				console.log('CREATE TABLE IF NOT EXISTS ' + tableName);
			}
		},
		
		/**
		 * Inserts value into a table. The name of the given Attribute
		 * identifies the table. 
		 * 
		 * @private
		 * @alias insertIntoTable
		 * @memberof Storage#
		 * @param {AttributeValue} _attributeValue Attribute that should be stored.
		 * @param {?function} _function For alternative actions, if an asynchronous function is used.
		 */	
		'private insertIntoTable' : function(_attributeValue, _function){
			if(this.db && _attributeValue && Class.isA(AttributeValue, _attributeValue)){
				var tableName = this.tableName(_attributeValue);
				var statement = 'INSERT INTO ' + tableName 
									 + ' (value_, type_, created_) VALUES ("'
									 + _attributeValue.getValue() + '", "' 
									 + _attributeValue.getType() + '", "'
									 + _attributeValue.getTimestamp() + '")';
	
				if(_function && typeof(_function) == 'function'){
					this.db.transaction(function(tx){tx.executeSql(statement);}, this.errorCB, _function);	
				} else {
					this.db.transaction(function(tx){tx.executeSql(statement);}, this.errorCB, this.successCB);
				}
				console.log('INSERT INTO '+tableName+' VALUES ('+_attributeValue.getValue()+", "+_attributeValue.getType()+", "+_attributeValue.getTimestamp());
			}
		},
		
		/**
		 * error function 
		 * 
		 * @callback
		 * @private
		 * @alias errorCB
		 * @memberof Storage#
		 */	
		'private errorCB' : function(err) {
		    console.log("Error processing SQL: "+err.message);
		},

		/**
		 * success function 
		 * 
		 * @callback
		 * @private
		 * @alias successCB
		 * @memberof Storage#
		 */	
		'private successCB' : function() {
		    console.log("SQL processed successfully!");
		},
		
		
		/**
		 * Sets the attributeNames array. 
		 * 
		 * @public
		 * @alias getAttributeNames
		 * @memberof Storage#
		 * @param {?function} _function For alternative actions, if an asynchronous function is used.
		 */	
		'public getAttributeNames' : function(_function){
			if(this.db){
				var self = this;
				this.db.transaction(function(_tx){self.queryTables(_tx,self, _function);},
		    						function(error){self.errorCB(error);} );
			}		    
		},
		
		/**
		 * Sets the attributeNames array. Is used in getAttributeNames(). 
		 * 
		 * @callback
		 * @private
		 * @alias queryTables
		 * @memberof Storage#
		 * @param {*} _tx
		 * @param {@this} self
		 * @param {?function} _function For alternative actions, if an asynchronous function is used.
		 */	
		'private queryTables' : function(_tx, self, _function){
			var statement = "SELECT * from sqlite_master WHERE type = 'table'";
			_tx.executeSql(statement, [], function(_tx,results){self.queryTableSuccess(_tx,results,self, _function);}, 
						function(error){self.errorCB(error);});	
					
		},
		
		/**
		 * Success function for queryTable. 
		 * 
		 * @callback
		 * @private
		 * @alias queryTableSucces
		 * @memberof Storage#
		 * @param {*} _tx
		 * @param {*} results
		 * @param {@this} self
		 */	
		'private queryTableSuccess' : function(_tx, results, self, _function){
			self.attributeNames = [];
			var len = results.rows.length;
			for(var i=0; i<len; i++){
				var table = results.rows.item(i).name;
				if(table.indexOf("DatabaseInfoTable") == -1){
					self.attributeNames.push(results.rows.item(i).name);
				}
				
			}
			if(_function && typeof(_function) == 'function'){
				_function();
			}

		},
		
		/**
		 * Verifies if a table for an attribute exists. 
		 * 
		 * @private
		 * @alias tableExists
		 * @memberof Storage#
		 * @param {(AttributeValue|String)} _attribute Attribute or name for the verification.
		 * @returns {boolean}
		 */	
		'private tableExists' : function(_attribute){
			if(Class.isA(AttributeValue, _attribute) || Class.isA(AttributeType, _attribute)){
				var name = this.tableName(_attribute);
				return this.attributeNames.indexOf(name) > -1;				
			} else if(typeof _attribute === 'string'){
				return this.attributeNames.indexOf(_attribute) > -1;	
			}
			return false;
		},
		
		/**
		 * Retrieves a table and sets the RetrievalResult. 
		 * 
		 * @public
		 * @alias retrieveAttributes
		 * @memberof Storage#
		 * @param {String} _tableName Name for the table that should be retrieved.
		 * @param {?function} _function For additional actions, if an asynchronous function is used.
		 */	
		'public retrieveAttributes' : function(_tableName, _function){
			if(this.db){
				var self = this;	
				self.flushStorage();
				this.db.transaction(function(_tx){self.queryValues(_tx,_tableName,self, _function);},
		    						function(error){self.errorCB(error);} );	
			}
		},
		
		/**
		 * Query function for given attribute. 
		 * 
		 * @callback
		 * @private
		 * @alias queryValues
		 * @memberof Storage#
		 * @param {*} _tx 
		 * @param {String} _tableName Name for the table that should be retrieved.
		 * @param {@this} self
		 * @param {?function} _function For additional actions, if an asynchronous function is used.
		 */	
		'private queryValues' : function(_tx,_tableName,self, _function){
			if(self.tableExists(_tableName)){	
				var statement = 'SELECT * FROM ' + _tableName;
				_tx.executeSql(statement, [], 
					function(_tx,results){self.queryValuesSuccess(_tx,results,_tableName, self, _function);}, 
					function(error){self.errorCB(error);});			
			} else {
				console.log('Table "'+_tableName+'" unavailable');
			}
		},
		
		/**
		 * Success function for retrieveAttributes(). 
		 * Puts the retrieved data in RetrievalResult object.
		 * 
		 * @callback
		 * @private
		 * @alias queryValuesSucces
		 * @memberof Storage#
		 * @param {*} _tx
		 * @param {*} results
		 * @param {String} _tableName Name of the searched attribute.
		 * @param self
         * @param {?function} _function For additional actions, if an asynchronous function is used.
		 */	
		'private queryValuesSuccess' : function(_tx, results,_tableName, self, _function){
			var len = results.rows.length;
			var attributeList = [];
			var attributeName = this.resolveAttributeName(_tableName);
			var parameterList = this.resolveParameters(_tableName);
			for(var i=0; i<len; i++){
				var attribute = new AttributeValue().
								withName(attributeName).withValue(results.rows.item(i).value_).
								withType(results.rows.item(i).type_).
								withTimestamp(results.rows.item(i).created_).
								withParameters(parameterList);
				attributeList.push(attribute);
			}
			self.attributes = new RetrievalResult().withName(_tableName)
													.withTimestamp(new Date())
													.withValues(attributeList);
			if(_function && typeof(_function) == 'function'){
				_function();
			}
			 
		},
		
		/**
		 * Stores the given Attribute.
		 * If the flush condition does not match, 
		 * the data is first added to the local cache before.
		 * 
		 * @public
		 * @alias store
		 * @memberof Storage#
		 * @param {AttributeValue} _attributeValue Value that should be stored.
		 */		
		'public store' : function(_attributeValue){
			
			this.addData(_attributeValue);
			if(this.checkFlushCondition){
				this.flushStorage();
				this.resetForFlush();
			}
			
		},
		
		/**
		 * Adds data to the local cache. 
		 * The cache is used to decrease the database access.
		 * 
		 * @private 
		 * @alias addData
		 * @memberof Storage#
		 * @param {AttributeValue} _attributeValue Value that should be stored.
		 */		
		'private addData' : function(_attributeValue){
			if(Class.isA(AttributeValue, _attributeValue)){
				this.data.put(_attributeValue);
				this.dataCount++;
			}
		},
		
		/**
		 * Verifies the flush conditions.
		 * 
		 * @private 
		 * @alias checkFlushCondition
		 * @memberof Storage#
		 * @returns {boolean}
		 */	
		'private checkFlushCondition' : function(){
			if(this.dataCount > this.countCondition){
				return true;
			}
			var currentDate = new Date();
			if((currentDate.getTime() - lastFlush.getTime()) < this.timeCondition ){
				return true;
			} //2 stunden??
			return false;
		},
		
		/**
		 * Clears the local cache.
		 * 
		 * @private 
		 * @alias resetForFlush
		 * @memberof Storage#
		 */	
		'private resetForFlush' : function(){
			this.data = new AttributeValueList();
			this.dataCount = 0;
			this.lastFlush = new Date();
		},
		
		/**
		 * Stores all data from the local cache to the database.
		 * 
		 * @private 
		 * @alias flushStorage
		 * @memberof Storage#
		 */
		'private flushStorage' : function(){
			var self = this;
			if(self.data.size() == 0){
				return;
			}
			var keys = self.data.getKeys();
			for(var i in keys){
				var key = keys[i];
				var item = self.data.getItem(key);
				if(!self.tableExists(item)){
					self.createTable(item, function(){self.insertIntoTable(item);});
				} else {
					self.insertIntoTable(item);
				}
			}
		},
		
		/**
		 * Sets the time condition for flush.
		 * 
		 * @public
		 * @alias setTimeCondition
		 * @memberof Storage#
		 * @param {integer} _time time in ms
		 */
		'public setTimeCondition' : function(_time){
			this.timeCondition = _time;
		},
		
		/**
		 * Sets the counter for flush.
		 * 
		 * @public
		 * @alias setCountCondition
		 * @memberof Storage#
		 * @param {integer} _counter counter
		 */
		'public setCountCondition' : function(_counter){
			this.countCondition = _counter;
		},
		
		/**
		 * Returns the current time condition for flush.
		 * 
		 * @public
		 * @alias getTimeCondition
		 * @memberof Storage#
		 * @returns {integer}
		 */
		'public getTimeCondition' : function(){
			return this.timeCondition;
		},
		
		/**
		 *  Returns the current count condition for flush.
		 * 
		 * @public 
		 * @alias getCountCondition
		 * @memberof Storage#
		 * @returns{integer}
		 */
		'public getCountCondition' : function(){
			return this.countCondition;
		},

		/****************************
		 * 			Helper			*
		 ****************************/
		/**
		 * Builds the tableName for the given attribute.
		 * 
		 * @private 
		 * @alias tableName
		 * @memberof Storage#
		 * @param {AttributeValue} _attribute Attribute that should be stored.
		 * @returns{String}
		 */
		'private tableName' : function(_attribute){
			var tableName = _attribute.getName();
			var parameterList = _attribute.getParameters();
			if(!parameterList.isEmpty()){
				var keys = parameterList.getKeys();
				for(var i in keys){
					tableName = tableName + '__' +keys[i] + '_'+parameterList.getItem(keys[i]);
				}
			}
			return tableName;
		},
		
		/**
		 * Extracts the attributeName form the table name.
		 * 
		 * @private 
		 * @alias resolveAttributeName
		 * @memberof Storage#
		 * @param {String} _tableName Table name that should be resolved.
		 * @returns{String}
		 */
		'private resolveAttributeName' : function(_tableName){
			var resolvedTableName = _tableName.split('__');
            return resolvedTableName[0];
		},
		
		/** Extracts the parameters form the table name.
		 * 
		 * @private 
		 * @alias resolveParameters
		 * @memberof Storage#
		 * @param {String} _tableName Table name that should be resolved.
		 * @returns{String}
		 */
		'private resolveParameters' : function(_tableName){
			var resolvedTableName = _tableName.split('__');

			var parameterList = new ParameterList();
			for(var i = 1; i < resolvedTableName.length; i++ ){
				var resolvedParameter =  resolvedTableName[i].split('_');
				var parameter= new Parameter().withKey(resolvedParameter[0]).withValue(resolvedParameter[1]);
				parameterList.put(parameter);
			}
			return parameterList;
		}
		
	});

	return Storage;
});
/**
 * This module represents a Callback.
 * Callbacks defines events for sending data to subscribers
 * 
 * @module Callback
 * @fileOverview
 */
define('callback',['easejs', 'attributeType', 'attributeTypeList'],
 	function(easejs, AttributeType, AttributeTypeList){
 	var Class = easejs.Class;
 	
	var Callback = Class('Callback',
	{

		/**
		 * @alias name
		 * @private
		 * @type {string}
		 * @memberof Callback#
		 * @desc Name of the Callback (i.e. Update).
		 */
		'private name' : '', 
		/**
		 * @alias attributeTypes
		 * @private
		 * @type {AttributeTypeList}
		 * @memberof Callback#
		 * @desc Associated Attributes that will be send to Subscriber.
		 */
		'private attributeTypes' : [], 
		
		/**
		 * Constructor: Initializes the AttributeTypeList.
		 * 
		 * @class Callback
		 * @classdesc Callbacks defines events for sending data to subscribers.
		 * 			The data to be sent, are specified in the attributeTypeList.
		 * @requires easejs
		 * @requires ParameterList
		 * @requires AttributeType
		 * @requires AttributeTypeList
		 * @constructs Callback
		 */
		'public __construct': function()
        {
			this.attributeTypes = new AttributeTypeList();
        },

        /**
		 * Builder for name.
		 * 
		 * @public
		 * @alias withName
		 * @memberof Callback#
		 * @param {String} _name Name
		 * @returns {Callback}
		 */
		'public withName' : function(_name){
			this.setName(_name);
			return this;
		},
		
		/**
		 * Builder for AttributeTypes.
		 * 
		 * @public
		 * @alias withAttributeTypes
		 * @memberof Callback#
		 * @param {(AttributeTypeList|Array)} _attributeTypes attributeTypes
		 * @returns {Callback}
		 */
		'public withAttributeTypes' : function(_attributeTypes){
			this.setAttributeTypes(_attributeTypes);
			return this;
		},

		/**
		 * Returns the name.
		 * 
		 * @public
		 * @alias getName
		 * @memberof Callback#
		 * @returns {string}
		 */
		'public getName' : function(){
			return this.name;
		},

		/**
		 * Sets the name.
		 * 
		 * @public
		 * @alias setName
		 * @memberof Callback#
		 * @param {string} _name Name
		 */
		'public setName' : function(_name){
			if(typeof _name === 'string'){
				this.name = _name;
			};
		},

		/**
		 * Returns the associated attributes (only the types).
		 * 
		 * @public
		 * @alias getAttributeTypes
		 * @memberof Callback#
		 * @returns {AttributeTypeList}
		 */
		'public getAttributeTypes' : function(){
			return this.attributeTypes;
		},

		/**
		 * Adds a list of AttributeTypes.
		 * 
		 * @public
		 * @alias setAttributeTypes
		 * @memberof Callback#
		 * @param {AttributeTypeList} _attributeTypes AttributeTypeList
		 */
		'public setAttributeTypes' : function(_attributeTypes){
			var list = [];
			if(_attributeTypes instanceof Array){
				list = _attributeTypes;
			} else if (Class.isA( AttributeTypeList, _attributeTypes)) {
				list = _attributeTypes.getItems();
			}
			for(var i in list){
				var attributeType = list[i];
				if(Class.isA( AttributeType, attributeType )){
					this.attributeTypes.put(attributeType);
				}
			}
		},

		/**
		 * Adds an attribute to AttributeTypeList.
		 * 
		 * @public
		 * @alias addAttributeType
		 * @memberof Callback#
		 * @param {AttributeType} _attributeType AttributeType
		 */
		'public addAttributeType' : function(_attributeType){
			if(Class.isA( AttributeType, _attributeType )){
				if(!this.attributeTypes.contains(_attributeType)){
					this.attributeTypes.put(_attributeType);	
				}
			};
		},

		/**
		 * Removes an attribute from AttributeTypeList.
		 * 
		 * @public
		 * @alias removeAttributeType
		 * @memberof Callback#
		 * @param {AttributeType} _attributeType AttributeType
		 */
		'public removeAttributeType' : function(_attributeType){
			if(Class.isA( AttributeType, _attributeType )){
				this.attributeTypes.removeItem(_attributeType.getName());
			};
		},
		
		/**
		 * Compares this instance with the given one.
		 * 
		 * @virtual
		 * @public
		 * @alias equals
		 * @memberof Callback#
		 * @param {Callback} _callback Callback that should be compared
		 * @returns {boolean}
		 */
		'public equals' : function(_callback) {				
			if(Class.isA(Callback, _callback)){
				if(_callback.getName() == this.getName()
					&& _callback.getAttributeTypes().equals(this.getAttributeTypes())){
					return true;
				};
			};
			return false;

		},


		});

	return Callback;
});
/**
 * This module represents an CallbackList. It is a subclass of AbstractList.
 * 
 * @module CallbackList
 * @fileOverview
 */
define('callbackList',['easejs', 'abstractList', 'callback'],
 	function(easejs, AbstractList, Callback){
 	var Class = easejs.Class;
 	
 	/**
	 * @class CallbackList
	 * @classdesc This class represents a list for Callback.
	 * @extends AbstractList
	 * @requires easejs
	 * @requires AbstractList
	 * @requires Callback
	 */
	var CallbackList = Class('CallbackList').
					extend(AbstractList,{

		/**
		 * @alias counter
		 * @protected
		 * @type {integer}
		 * @memberof CallbackList#
		 * @desc Number of items.
		 */
		'protected counter' : 0,
		/**
		 * @alias items
		 * @protected
		 * @type {CallbackList}
		 * @memberof CallbackList#
		 * @desc ItemList.
		 */
		'protected items' : [],
		
		/**
		 * Builder for item list.
		 * 
		 * @public
		 * @alias withItems
		 * @memberof CallbackList#
		 * @param {(CallbackList|Array)} _callbackList CallbackList
		 * @returns {CallbackList}
		 */
		'public withItems': function(_callbackList){
			var list = [];
			if(_callbackList instanceof Array){
				list = _callbackList;
			} else if (Class.isA(CallbackList, _callbackList)) {
				list = _callbackList.getItems();
			}
			for(var i in list){
				var callback = list[i];
				if(Class.isA( Callback, callback )){
					this.items[callback.getName()] = callback;
					this.counter++;
				}
			}
			return this;
		},

		/**
		 * Adds the specified item to the itemList.
		 * 
		 * @public
		 * @alias put
		 * @memberof CallbackList#
		 * @param {Callback} _callback Callback
		 */
		'public put' : function(_callback){
			if(Class.isA(Callback, _callback)){
				if(!(this.containsKey(_callback.getName()))){
					this.counter++;
				}
				this.items[_callback.getName()] = _callback;
			}
		},

		/**
		 * Adds all items in the specified list to this
		 * itemList
		 * 
		 * @public
		 * @alias putAll
		 * @memberof CallbackList#
		 * @param {(CallbackList|Array)} _callbackList CallbackList
		 */
		'public putAll' : function(_callbackList){
			var list = [];
			if(_callbackList instanceof Array){
				list = _callbackList;
			} else if (Class.isA(CallbackList, _callbackList)) {
				list = _callbackList.getItems();
			}
			for(var i in list){
				var callback = list[i];
				if(Class.isA(Callback, callback)){
					if(!(this.containsKey(callback.getName()))){
						this.counter++;
					}
					this.items[callback.getName()] = callback;
				}
			}
		},

		/**
		 * Verifies whether the given item is included
		 * in this list.
		 * 
		 * @public
		 * @alias contains
		 * @memberof CallbackList#
		 * @param {Callback} _item CallbackType that should be verified.
		 * @returns {boolean}
		 */
		'public contains' : function(_item){
			if(Class.isA(Callback,_item)){
				var tmp = this.getItem(_item.getName());
				if(!(typeof tmp === 'undefined') && tmp.equals(_item)){
					return true;
				}
			} 
			return false;
		},
		
		/**
		 * Compare the specified CallbackList with this instance.
		 * @public
		 * @alias equals
		 * @memberof CallbackList#
		 * @param {CallbackList} _list CallbackList that should be compared.
		 * @returns {boolean}
		 */
		'public equals' : function(_list){
			if(Class.isA(CallbackList,_list) && _list.size() == this.size()){
				var items = _list.getItems();
				for(var i in items){
					var item = items[i];
					if(!this.contains(item)){
						return false;
					}
				}
				return true;
			} 
			return false;
		}

	});

	return CallbackList;
});
/**
 * This module represents an interface for ConditionMethod. 
 * 
 * @module ConditionMethod
 * @fileOverview
 */
define('conditionMethod',['easejs'],
 	function(easejs){
 	var Interface = easejs.Interface;
 	/**
	 * @class ConditionMethod
	 * @classdesc This interface defines the interface for conditionMethod.
	 * @requires easejs
	 */
	var ConditionMethod = Interface('ConditionMethod',
	{
		
		/**
		 * Processes the method.
		 * .
		 * 
		 * @function
		 * @abstract
		 * @public
		 * @alias process
		 * @memberof ConditionMethod#
		 * @param {*} reference Comparison value, if one is required.
		 * @param {*} firstValue Value (from an attribute) that should be compared. 
		 * @param {*} secondValue Value (from an attribute) for comparison, if one is required.
		 */
		'public process': ['reference', 'firstValue', 'secondValue'],
		
		});

	return ConditionMethod;
});
/**
 * This module represents a Condition. 
 * Condition specifies subscriptions. 
 * The associated attributes are only sent, if the condition applies. 
 * 
 * @module Condition
 * @fileOverview
 */
define('condition',['easejs','attributeType','attributeValue', 'conditionMethod'],
 	function(easejs, AttributeType, AttributeValue, ConditionMethod){
 	var Class = easejs.Class;
 	/**
	 * @class Condition
	 * @classdesc Condition for subscribed Attributes.
	 * @requires easejs
	 * @requires AttributeType
	 * @requires AttributeValue
	 * @rewuires ConditionMethod
	 */
	var Condition = Class('Condition',
	{

		/**
		 * @alias name
		 * @private
		 * @type {string}
		 * @memberof Condition#
		 * @desc Name of the Condition.
		 */
		'private name' :'',
		/**
		 * @alias attributeType
		 * @private
		 * @type {AttributeType}
		 * @memberof Condition#
		 * @desc AttributeType that should be checked.
		 */
		'private attributeType' : '', 
		/**
		 * @alias comparisonMethod
		 * @private
		 * @type {ConditionMethod}
		 * @memberof Condition#
		 * @desc Method for comparison.
		 */
		'private comparisonMethod' : '',
		/**
		 * @alias referenceValue
		 * @private
		 * @type {*}
		 * @memberof Condition#
		 * @desc Comparison value.
		 */
		'private referenceValue' : '',

		/**
		 * Builder for name.
		 * 
		 * @public
		 * @alias withName
		 * @memberof Condition#
		 * @param {String} _name Name
		 * @returns {Condition}
		 */
		'public withName' : function(_name){
			this.setName(_name);
			return this;
		},
		/**
		 * Builder for AttributeType.
		 * 
		 * @public
		 * @alias withAttributeType
		 * @memberof Condition#
		 * @param {AttributeType} _attributeType Attributes that would be verified.
		 * @returns {Condition}
		 */
		'public withAttributeType' : function(_attributeType){
			this.setAttributeType(_attributeType);
			return this;
		},
		/**
		 * Builder for comparison method.
		 * 
		 * @public
		 * @alias withComparisonMethod
		 * @memberof Condition#
		 * @param {ConditionMethod} _comparisonMethod method for comparison
		 * @returns {Condition}
		 */
		'public withComparisonMethod' : function(_comparisonMethod){
			this.setComparisonMethod(_comparisonMethod);
			return this;
		},
		/**
		 * Builder for comparison value.
		 * 
		 * @public
		 * @alias withReferenceValue
		 * @memberof Condition#
		 * @param {String} _referenceValue comparisonValue
		 * @returns {Condition}
		 */
		'public withReferenceValue' : function(_referenceValue){
			this.setReferenceValue(_referenceValue);
			return this;
		},

		/**
		 * Sets the name.
		 * 
		 * @public
		 * @alias setName
		 * @memberof Condition#
		 * @param {string} _name Name
		 */
		'public setName' : function(_name){
			if(typeof _name === 'string'){
				this.name = _name;
			}
		},
		
		/**
		 * Sets the attributeType.
		 * 
		 * @public
		 * @alias setAttributeType
		 * @memberof Condition#
		 * @param {AttributeType} _attributeType AttributeType
		 */
		'public setAttributeType' : function(_attributeType){
			if(Class.isA(AttributeType,_attributeType)){
				this.attributeType = _attributeType;
			}
		},

		/**
		 * Sets the ComparisonMethod.
		 * 
		 * @public
		 * @alias setComparisonMethod
		 * @memberof Condition#
		 * @param {ConditionMethod} _comparisonMethod comparison Method
		 */
		'public setComparisonMethod' : function(_comparisonMethod){
			if(Class.isA(ConditionMethod,_comparisonMethod)){
				this.comparisonMethod = _comparisonMethod;
			}
		},

		/**
		 * Sets the referenceValue.
		 * 
		 * @public
		 * @alias setReferenceValue
		 * @memberof Condition#
		 * @param {*} _referenceValue comparison value
		 */
		'public setReferenceValue' : function(_referenceValue){
			this.referenceValue = _referenceValue;
		},
		
		/**
		 * Returns the name.
		 * 
		 * @public
		 * @alias getName
		 * @memberof Condition#
		 * @returns {string}
		 */
		'public getName' : function(){
			return this.name;
		},
		
		/**
		 * Returns the AttributeType.
		 * 
		 * @public
		 * @alias getAttributeType
		 * @memberof Condition#
		 * @returns {AttributeType}
		 */
		'public getAttributeType' : function(){
			return this.attributeType;
		},
		
		/**
		 * Returns the comparison method.
		 * 
		 * @public
		 * @alias getComparisonMethod
		 * @memberof Condition#
		 * @returns {ConditionMethod}
		 */
		'public getComparisonMethod' : function(){
			return this.comparisonMethod;
		},
		
		/**
		 * Returns the comparison value.
		 * 
		 * @public
		 * @alias getReferenceValue
		 * @memberof Condition#
		 * @returns {*}
		 */
		'public getReferenceValue' : function(){
			return this.referenceValue;
		},
		
		/**
		 * Processes the comparison.
		 * 
		 * @public
		 * @alias compare
		 * @memberof Condition#
		 * @param {AttributeValue} _newAttributeValue new Attribute that should be compared
		 * @param {AttributeValue} _oldAttributeValue old Attribute 
		 * @returns {boolean}
		 */
		'public compare' : function(_newAttributeValue, _oldAttributeValue){
			if(!this.attributeType.equals(_newAttributeValue.getAttributeType())
					&& !this.attributeType.equals(_oldAttributeValue.getAttributeType())){
				return false;
			};
			if(!this.comparisonMethod){
				return false;
			};
			if(Class.isA(AttributeValue,_newAttributeValue) && Class.isA(AttributeValue,_oldAttributeValue)){
				return this.comparisonMethod.process(this.referenceValue, _newAttributeValue.getValue(), _oldAttributeValue.getValue());
			};
			return false;
		},
		
		/**
		 * Compares this instance with the given one.
		 * 
		 * @public
		 * @alias equals
		 * @memberof Condition#
		 * @param {Condition} _condition Condition that should be compared
		 * @returns {boolean}
		 */
		'public equals' : function(_condition) {				
			if(Class.isA(Condition, _condition)){
				if(_condition.getName() == this.getName()
						&& _condition.getReferenceValue() == this.getReferenceValue()
						&& _condition.getAttributeType().equals(this.attributeType)
						&& _condition.getComparisonMethod() === this.comparisonMethod){
					return true;
				};
			};
			return false;

		},
		

		});

	return Condition;
});
/**
 * This module represents a ConditionList. It is a subclass of AbstractList.
 * 
 * @module ConditionList
 * @fileOverview
 */
define('conditionList',['easejs','abstractList', 'condition'],
 	function(easejs, AbstractList, Condition){
 	var Class = easejs.Class;
 	/**
	 * @class ConditionList
	 * @classdesc This class represents a list for Conditions.
	 * @extends AbstractList
	 * @requires easejs
	 * @requires AbstractList
	 * @requires Condition
	 */
	var ConditionList = Class('ConditionList').
						extend(AbstractList,{

		/**
		* @alias counter
		* @protected
		* @type {integer}
		* @memberof ConditionList#
		* @desc Number of items.
		*/
		'protected counter' : 0,
		/**
		 * @alias items
		 * @protected
		 * @type {ConditioList}
		 * @memberof ConditionList#
		 * @desc ItemList
		 */
		'protected items' : [],
		
		/**
		 * Builder for item list.
		 * 
		 * @public
		 * @alias withItems
		 * @memberof ConditionList#
		 * @param {(ConditionList|Array)} _conditionList ConditionList
		 * @returns {ConditionList}
		 */
		'public withItems': function(_conditionList){
			var list = new Array();
			if(_conditionList instanceof Array){
				list = _conditionList;
			} else if (Class.isA(ConditionList, _conditionList)) {
				list = _conditionList.getItems();
			}
			for(var i in list){
				var condition = list[i];
				if(Class.isA( Condition, condition )){
					this.items[condition.getName()] = condition;
					this.counter++;
				}
			}
			return this;
		},		

		/**
		 * Adds the specified item to the item list.
		 * 
		 * @public
		 * @alias put
		 * @memberof ConditionList#
		 * @param {Condition} _condition Condition
		 */
		'public put' : function(_condition){
			if(Class.isA(Condition, _condition)){
				if(!(this.containsKey(_condition.getName()))){
					this.counter++;
				}
				this.items[_condition.getName()] = _condition;
			}
		},

		/**
		 * Adds all items in the specified list to the
		 * item list.
		 * 
		 * @public
		 * @alias putAll
		 * @memberof ConditionList#
		 * @param {(ConditioneList|Array)} _conditionList ConditionList
		 */
		'public putAll' : function(_conditionList){
			var list = new Array();
			if(_conditionList instanceof Array){
				list = _conditionList;
			} else if (Class.isA(ConditionList, _conditionList)) {
				list = _conditionList.getItems();
			}
			for(var i in list){
				var condition = list[i];
				if(Class.isA(Condition, condition)){
					if(!(this.containsKey(condition.getName()))){
						this.counter++;
					}
					this.items[condition.getName()] = condition;
				}
			}
		},

		/**
		 * Verifies whether the given item is included
		 * in this list.
		 * 
		 * @public
		 * @alias contains
		 * @memberof ConditionList#
		 * @param {Condition} _item Condition that should be verified.
		 * @returns {boolean}
		 */
		'public contains' : function(_item){
			if(Class.isA(Condition,_item)){
				var tmp = this.getItem(_item.getName());
				if(!(typeof tmp === 'undefined') && tmp.equals(_item)){
					return true;
				}
			} 
			return false;
		},
		
		/**
		 * Compare the specified AttributeTypeList with this instance.
		 * 
		 * @public
		 * @alias equals
		 * @memberof ConditionList#
		 * @param {ConditionList} _list ConditionList that should be compared.
		 * @returns {boolean}
		 */
		'public equals' : function(_list){
			if(Class.isA(ConditionList,_list) && _list.size() == this.size()){
				var items = _list.getItems();
				for(var i in items){
					var item = items[i];
					if(!this.contains(item)){
						return false;
					}
				}
				return true;
			} 
			return false;
		},



	});

	return ConditionList;
});
/**
 * This module represents a Subscriber.
 * 
 * @module Subscriber
 * @fileOverview
 */
define('subscriber',['easejs', 'attributeTypeList', 'callbackList', 'condition', 'conditionList'],
 	function(easejs, AttributeTypeList, CallbackList, Condition, ConditionList){

 	/*
 	* Callback: name and associated Attributes
 	*/
 	var Class = easejs.Class;
	var Subscriber = Class('Subscriber',
	{

		/**
		 * @alias subscriberName
		 * @private
		 * @type {string}
		 * @memb Name of the subscriber.
		 */
		'private subscriberName' : '',
		/**
		 * @alias subscriberId
		 * @private
		 * @type {string}
		 * @memberof Subscriber#
		 * @desc ID of the Subscriber.
		 */
		'private subscriberId' : '',
		/**
		 * @alias subscriptionCallbacks
		 * @private
		 * @type {CallbackList}
		 * @memberof Subscriber#
		 * @desc Callbacks that should be subscribed.
		 */
		'private subscriptionCallbacks' : [],
		/**
		 * @alias attributesSubset
		 * @private
		 * @type {AttributeTypeList}
		 * @memberof Subscriber#
		 * @desc Restricts the associated Attributes of the callback to a subset
		 * 		(i.e: the subscriber wants a subset from the available the context data).  
		 * 		If no attributes are specified, all available attributes will returned.
		 */
		'private attributesSubset' : [],
		/**
		 * @alias conditions
		 * @private
		 * @type {ConditionList}
		 * @memberof Subscriber#
		 * @desc Defines special conditions for notification.
		 */
		'private conditions' : [],

		/**
		 * Constructor: Initializes the subscriptionCallbacks, subscriptionCallbacks
		 * 				and conditions.
		 * 
		 * @class Subscriber
		 * @classdesc Subscriber defines the name and the ID of the Subscriber and the Callbacks 
		 * 			 (with possible restrictions) what the subscriber is interested in.
		 * @requires easejs
		 * @requires AttributeTypeList 
		 * @requires CallbackList 
		 * @requires Condition
		 * @requires ConditionList
		 * @constructs Subscriber
		 */
		'virtual public __construct': function()
        {
			this.subscriptionCallbacks = new CallbackList();
			this.subscriptionCallbacks = new AttributeTypeList();
			this.attributesSubset = new AttributeTypeList();
			this.conditions = new ConditionList();
        },
			
		/**
		 * Builder for subscriberName.
		 * 
		 * @public
		 * @alias withSubscriberName
		 * @memberof Subscriber#
		 * @param {String} _subscriberName subscriberName
		 * @returns {Subscriber}
		 */
		'public withSubscriberName' : function(_subscriberName){
			this.setSubscriberName(_subscriberName);
			return this;
		},
		
		/**
		 * Builder for subscriberId.
		 * 
		 * @public
		 * @alias withSubscriberId
		 * @memberof Subscriber#
		 * @param {String} _subscriberId subscriberId
		 * @returns {Subscriber}
		 */
		'public withSubscriberId' : function(_subscriberId){
			this.setSubscriberId(_subscriberId);
			return this;
		},
		
		/**
		 * Builder for subscriptionCallbacks.
		 * 
		 * @public
		 * @alias withSubscriptionCallbacks
		 * @memberof Subscriber#
		 * @param {CallbackList} _subscriptionCallbacks subscriptionCallbacks
		 * @returns {Subscriber}
		 */
		'public withSubscriptionCallbacks' : function(_subscriptionCallbacks){
			this.setSubscriptionCallbacks(_subscriptionCallbacks);
			return this;
		},
		
		/**
		 * Builder for attributesSubset.
		 * 
		 * @public
		 * @alias withAttributesSubset
		 * @memberof Subscriber#
		 * @param {AttributeTypeList} _attributesSubset attributesSubset
		 * @returns {Subscriber}
		 */
		'public withAttributesSubset' : function(_attributesSubset){
			this.setAttributesSubset(_attributesSubset);
			return this;
		},
		
		/**
		 * Builder for conditions.
		 * 
		 * @public
		 * @alias withConditions
		 * @memberof Subscriber#
		 * @param {(ConditionList|Array)} _conditions conditions
		 * @returns {Subscriber}
		 */
		'public withConditions' : function(_conditions){
			this.setConditions(_conditions);
			return this;
		},

		
		/**
		 * Returns the name.
		 * 
		 * @public
		 * @alias getSubscriberName
		 * @memberof Subscriber#
		 * @returns {string}
		 */
		'public getSubscriberName' : function(){
			return this.subscriberName;
		},

		/**
		 * Sets the setSubscriberName.
		 * 
		 * @public
		 * @alias setSubscriberName
		 * @memberof Subscriber#
		 * @param {string} _subscriberName subscriberName
		 */
		'public setSubscriberName' : function(_subscriberName){
			if(typeof _subscriberName === 'string'){
				this.subscriberName = _subscriberName;
			};
			
		},
		
		/**
		 * Returns the subscriberId.
		 * 
		 * @public
		 * @alias getSubscriberId
		 * @memberof Subscriber#
		 * @returns {string}
		 */
		'public getSubscriberId' : function(){
			return this.subscriberId;
		},

		/**
		 * Sets the subscriberId.
		 * 
		 * @public
		 * @alias setSubscriberId
		 * @memberof Subscriber#
		 * @param {string} _subscriberId subscriberId
		 */
		'public setSubscriberId' : function(_subscriberId){
			if(typeof _subscriberId === 'string'){
				this.subscriberId = _subscriberId;
			};
		},
		
		/**
		 * Returns the subscriptionCallbacks.
		 * 
		 * @public
		 * @alias getSubscriptionCallbacks
		 * @memberof Subscriber#
		 * @returns {CallbackList}
		 */
		'public getSubscriptionCallbacks' : function(){
			return this.subscriptionCallbacks;
		},

		/**
		 * Sets the subscriptionCallbacks.
		 * 
		 * @public
		 * @alias setSubscriptionCallbacks
		 * @memberof Subscriber#
		 * @param {CallbackList} _subscriptionCallbacks subscriptionCallbacks
		 */
		'public setSubscriptionCallbacks' : function(_subscriptionCallbacks){
			if(Class.isA(CallbackList, _subscriptionCallbacks)){
				this.subscriptionCallbacks = _subscriptionCallbacks;
			};
		},
		
		/**
		 * Returns the attributesSubset.
		 * 
		 * @public
		 * @alias getAttributesSubset
		 * @memberof Subscriber#
		 * @returns {string}
		 */
		'public getAttributesSubset' : function(){
			return this.attributesSubset;
		},

		/**
		 * Sets the attributesSubset.
		 * 
		 * @public
		 * @alias setAttributesSubset
		 * @memberof Subscriber#
		 * @param {AttributeTypeList} _attributesSubset attributesSubset
		 */
		'public setAttributesSubset' : function(_attributesSubset){
			if(Class.isA(AttributeTypeList, _attributesSubset)){
				this.attributesSubset = _attributesSubset;
			};
		},
		
		/**
		 * Returns the conditions.
		 * 
		 * @public
		 * @alias getConditions
		 * @memberof Subscriber#
		 * @returns {string}
		 */
		'public getConditions' : function(){
			return this.conditions;
		},

		/**
		 * Sets the conditions.
		 * 
		 * @public
		 * @alias setConditions
		 * @memberof Subscriber#
		 * @param {(Callback|Array)} _conditions conditions
		 */
		'public setConditions' : function(_conditions){
			var list = new Array();
			if(_conditions instanceof Array){
				list = _conditions;
			} else if (Class.isA( ConditionList, _conditions)) {
				list = _conditions.getItems();
			}
			for(var i in list){
				var condition = list[i];
				if(Class.isA( Condition, condition )){
					this.attributeTypes.put(condition);
				};
			};
		},
		
		/**
		 * Adds a condition.
		 * 
		 * @public
		 * @alias addCondition
		 * @memberof Subscriber#
		 * @param {Condition} _condition Condition
		 */
		'public addCondition' : function(_condition){
			if(Class.isA( Condition, _condition )){
				if(!this.condition.contains(_condition)){
					this.conditiond.put(_condition);	
				}
			};
		},

		/**
		 * Removes a condition.
		 * 
		 * @public
		 * @alias removeCondition
		 * @memberof Subscriber#
		 * @param {Condition} _condition Condition
		 */
		'public removeCondition' : function(_condition){
			if(Class.isA( Condition, _condition )){
				this.conditions.removeItem(_condition.getName());
			};
		},
		
		/**
		 * Compares this instance with the given one.
		 * 
		 * @public
		 * @alias equals
		 * @memberof Subscriber#
		 * @param {Subscriber} _subscriber Subscriber that should be compared.
		 * @returns {boolean}
		 */
		'public equals' : function(_subscriber) {				
			if(Class.isA(Subscriber, _subscriber)){
				if(_subscriber.getSubscriberName() == this.subscriberName
							&& _subscriber.getSubscriberId() == this.subscriberId
							&& _subscriber.getSubscriptionCallbacks().equals(this.getSubscriptionCallbacks())
							&& _subscriber.getAttributesSubset().equals(this.getAttributesSubset())
							&& _subscriber.getConditions().equals(this.getConditions())){
					return true;
				};
			};
			return false;

		},
				
		});

	return Subscriber;
});
/**
 * This module represents a SubscriberList. It is a subclass of AbstractList.
 * 
 * @module SubscriberList
 * @fileOverview
 */
define('subscriberList',['easejs', 'abstractList', 'subscriber'],
 	function(easejs, AbstractList, Subscriber){
 	var Class = easejs.Class;
 	
 	/**
	 * @class SubscriberList
	 * @classdesc This class represents a list for Subscriber.
	 * @extends AbstractList
	 * @requires easejs
	 * @requires AbstractList
	 * @requires Subscriber
	 */
	var SubscriberList = Class('SubscriberList').
					extend(AbstractList,{
					
		/**
		 * @alias counter
		 * @protected
		 * @type {integer}
		 * @memberof SubscriberList#
		 * @desc Number of items.
		 */
 		'protected counter' : 0,
 		/**
		 * @alias items
		 * @protected
		 * @type {SubscriberList}
		 * @memberof SubscriberList#
		 * @desc ItemList
		 */
		'protected items' : [],
		
		/**
		 * Builder for item list.
		 * 
		 * @public
		 * @alias withItems
		 * @memberof SubscriberList#
		 * @param {(SubscriberList|Array)}
		 *            _subscriberList SubscriberList
		 * @returns {SubscriberList}
		 */
		'public withItems': function(_subscriberList){
			var list = new Array();
			if(_subscriberList instanceof Array){
				list = _subscriberList;
			} else if (Class.isA( SubscriberList, _subscriberList)) {
				list = _subscriberList.getItems();
			}
			for(var i in list){
				var subscriber = list[i];
				if(Class.isA( Subscriber, subscriber )){
					this.items[subscriber.getSubscriberId()] = subscriber;
					this.counter++;
				}
			}
			return this;
		},

		/**
		 * Adds the specified item to the item list.
		 * 
		 * @public
		 * @alias put
		 * @memberof SubscriberList#
		 * @param {Subscriber}
		 *            _subscriber Subscriber
		 */
		'public put' : function(_subscriber){
			if(Class.isA(Subscriber, _subscriber)){
				if(!(this.containsKey(_subscriber.getSubscriberId()))){
					this.counter++;
				}
				this.items[_subscriber.getSubscriberId()] = _subscriber;
			}
		},

		/**
		 * Adds all items in the specified list to the item list.
		 * 
		 * @public
		 * @alias putAll
		 * @memberof SubscriberList#
		 * @param {(SubscriberList|Array)} _subscriberList SubscriberList
		 */
		'public putAll' : function(_subscriberList){
			var list = new Array();
			if(_subscriberList instanceof Array){
				list = _subscriberList;
			} else if (Class.isA(SubscriberList, _subscriberList)) {
				list = _subscriberList.getItems();
			}
			for(var i in list){
				var subscriber = list[i];
				if(Class.isA(Subscriber, subscriber)){
					if(!(this.containsKey(subscriber.getSubscriberId()))){
						this.counter++;
					}
					this.items[subscriber.getSubscriberId()] = subscriber;
				}
			}
		},

		/**
		 * Verifies whether the given item is contained in this list.
		 * 
		 * @public
		 * @alias contains
		 * @memberof SubscriberList#
		 * @param {Subscriber}
		 *            _item Subscriber that should be verified.
		 * @returns {boolean}
		 */
		'public contains' : function(_item){
			if(Class.isA(Subscriber,_item)){
				var tmp = this.getItem(_item.getSubscriberId());
				if(!(typeof tmp === 'undefined') && tmp.equals(_item)){
					return true;
				}
			} 
			return false;
		},
		
		/**
		 * Compare the specified SubscriberList with this instance.
		 * @public
		 * @alias equals
		 * @memberof SubscriberList#
		 * @param {SubscriberList} _list SubscriberList that should be compared.
		 * @returns {boolean}
		 */
		'public equals' : function(_list){
			if(Class.isA(SubscriberList,_list) && _list.size() == this.size()){
				var items = _list.getItems();
				for(var i in items){
					var item = items[i];
					if(!this.contains(item)){
						return false;
					}
				}
				return true;
			} 
			return false;
		},

	});

	return SubscriberList;
});
/**
 * This module represents the WidgetDescription. 
 * It describes the most important information for the communication with a specific widget. 
 * 
 * @module WidgetDescription
 * @fileOverview
 */
define('widgetDescription',['easejs', 'attributeTypeList'],
    function(easejs, AttributeTypeList){
    	var Class = easejs.Class;
		var WidgetDescription = Class('WidgetDescription',{
			
			/**
			 * @alias id
			 * @protected
			 * @type {string}
			 * @memberof WidgetDescription#
			 * @desc Id of the Widget that are described by this object.
			 */
			'protected id' : '', 
			/**
			 * @alias name
			 * @protected
			 * @type {string}
			 * @memberof WidgetDescription#
			 * @desc Name of the Widget that are described by this object.
			 */
			'protected name' : '', 
			/**
			 * @alias outAttributeTypes
			 * @protected
			 * @type {AttributeTypeList}
			 * @memberof WidgetDescription#
			 * @desc List of attributeTypes that are provided.
			 */
			'protected outAttributeTypes' : [],
            /**
             * @alias callbackNames
             * @protected
             * @type {array}
             * @memberof WidgetDescription#
             * @desc Array of available callback names.
             */
            'protected callbackNames' : [],

			/**
			 * Constructor: Initializes the inAttributeTypes.
			 * 
			 * @virtual
			 * @class WidgetDescription
			 * @classdesc The description of a Widget and the communication with it.
			 * @requires easejs
			 * @requires AttributeTypeList
			 * @constructs WidgetDescription
			 */
			'virtual public __construct' : function(){
				this.outAttributeTypes = new AttributeTypeList();
			},

			/**
			 * Builder for name
			 * 
			 * @public
			 * @alias withName
			 * @memberof WidgetDescription#
			 * @param {string} _name Name of the Widget that are described by this object.
			 * @returns {WidgetDescription}
			 */
    		'public withName' : function(_name){
    			this.setName(_name);
    			return this;
    		},

    		/**
			 * Builder for id
			 * 
			 * @public
			 * @alias withId
			 * @memberof WidgetDescription#
			 * @param {string} _id Id of the Widget that are described by this object.
			 * @returns {WidgetDescription}
			 */
    		'public withId' : function(_id){
    			this.setId(_id);
    			return this;
    		},
    		
    		/**
			 * Builder for outAttributeType list
			 * 
			 * @public
			 * @alias withOutAttributeTypes
			 * @memberof WidgetDescription#
			 * @param {(AttributeTypeList|Array)} _outAttributeTypes List of AttributeType that are provided
			 * @returns {WidgetDescription}
			 */
    		'public withOutAttributeTypes' : function(_outAttributeTypes){
    			this.setOutAttributeTypes(_outAttributeTypes);
    			return this;
    		},
    		
    		/**
			 * Builder for outAttributeType
			 * 
			 * @public
			 * @alias withInAttributeType
			 * @memberof WidgetDescription#
			 * @param {AttributeType} _outAttributeType AttributeType that are provided
			 * @returns {WidgetDescription}
			 */
    		'public withOutAttributeType' : function(_outAttributeType){
    			this.setOutAttributeType(_outAttributeType);
    			return this;
    		},

    		/**
			 * Returns the name of the described widget.
			 * 
			 * @public
			 * @alias getName
			 * @memberof WidgetDescription#
			 * @returns {String}
			 */
			'public getName' : function(){
				return this.name;
			},
			
			/**
			 * Returns the id of the described widget.
			 * 
			 * @public
			 * @alias getId
			 * @memberof WidgetDescription#
			 * @returns {String}
			 */
			'public getId' : function(){
				return this.id;
			},
			
			/**
			 * Returns outAttributeTypes of the widget.
			 * 
			 * @public
			 * @alias getOutAttributeTypes
			 * @memberof WidgetDescription#
			 * @returns {AttributeTypeList}
			 */
			'public getOutAttributeTypes' : function(){
				return this.outAttributeTypes;
			},

			/**
			 * Sets the name of the described widget.
			 * 
			 * @public
			 * @alias setName
			 * @memberof WidgetDescription#
			 * @params {String} _name Name of the described widget
			 */
			'public setName' : function(_name){
				if(typeof _name === 'string'){
					this.name = _name;
				}
			},

			/**
			 * Sets the id of the described widget.
			 * 
			 * @public
			 * @alias setId
			 * @memberof WidgetDescription#
			 * @params {String} _id Id of the described widget
			 */
			'public setId' : function(_id){
				if(typeof _id === 'string') {
					this.id = _id;
				}
			},
			
			/**
			 * Adds an outAttributeType to the list
			 * 
			 * @public
			 * @alias addOutAttributeType
			 * @memberof WidgetDescription#
			 * @param {AttributeType} _outAttributeType AttributeType that are provided
			 */
			'public addOutAttributeType' : function(_outAttributeType){
					this.outAttributeTypes.put(_outAttributeType);
			},
			
			/**
			 * Adds outAttributeTypes that are provided by the Widget
			 * 
			 * @public
			 * @alias addOutAttributeTypes
			 * @memberof WidgetDescription#
			 * @param {(AttributeTypeList|Array)} _outAttributeTypes List of AttributeType that are provided
			 */
			'public addOutAttributeTypes' : function(_outAttributeTypes){
				this.outAttributeTypes.putAll(_outAttributeTypes);
			},

            'public setCallbackNames' : function(_callbackNames) {
                this.callbackNames = _callbackNames;
            },

            'public addCallbackName' : function(_callbackName) {
                this.callbackNames.push(_callbackName);
            },

            'public doesSatisfyAttributeType': function(_attributeType) {
                return this.getOutAttributeTypes().contains(_attributeType);
            }
		});

        return WidgetDescription;
	
});
/**
 * This module representing a Context Widget.
 * 
 * @module Widget
 * @fileOverview
 */
define('widget',[ 'easejs', 'MathUuid', 'callback', 'callbackList', 'attributeType',
		 'attributeValue', 'attributeTypeList', 'attributeValueList', 'conditionList',
		 'subscriber', 'subscriberList', 'widgetDescription'],
	function(easejs, MathUuid, Callback, CallbackList, AttributeType,
			AttributeValue, AttributeTypeList, AttributeValueList, ConditionList,
			Subscriber, SubscriberList, WidgetDescription) {
		
		var AbstractClass = easejs.AbstractClass;
		var Class = easejs.Class;
		var Widget = AbstractClass('Widget',{
			/**
			 * @alias name
			 * @public
			 * @type {string}
			 * @memberof Widget#
			 * @desc Name of the Widget.
			*/
			'public name' : 'Widget',
			/**
			* @alias id
			* @public
			* @type {string}
			* @memberof Widget#
			* @desc ID of the Widget. Will be generated.
			*/
			'public id' : '',
			/**
			* @alias attributeTypes
			* @protected
			* @type {AttributeTypeList}
			* @memberof Widget#
			* @desc Types of all available attributes.
			*/
			'protected attributeTypes' : [],
			/**
			* @alias constantAttributeTypes
			* @protected
			* @type {AttributeTypeList}
			* @memberof Widget#
			* @desc Types of all available ConstantAttributes.
			*/
			'protected constantAttributeTypes' : [],

			/**
			 * @alias attributes
			 * @protected
			 * @type {AttributeValueList}
			 * @memberof Widget#
			 * @desc All available Attributes and their values.
			 */
			'protected attributes' : [],
			/**
			 * @alias oldAttributes
			 * @protected
			 * @type {AttributeValueList}
			 * @memberof Widget#
			 * @desc This temporary variable is used for storing the old attribute values. 
			 * 			So these can be used to check conditions.
			 */
			'protected oldAttributes' : [],
			/**
			 * @alias constantAttributes
			 * @protected
			 * @type {AttributeValueList}
			 * @memberof Widget#
			 * @desc All available constant Attributes and their values.
			 */
			'protected constantAttributes' : [],
			/**
			 * @alias callbacks
			 * @protected
			 * @type {CallbackList}
			 * @memberof Widget#
			 * @desc List of Callbacks.
			 */
			'protected callbacks' : [],
			/**
			 * @alias subscribers
			 * @protected
			 * @type {SubscriberList}
			 * @memberof Widget#
			 * @desc List of Subscriber.
			 */
			'protected subscribers' : [],

			/**
			 * @alias discoverer
			 * @protected
			 * @type {Discoverer}
			 * @memberof Widget#
			 * @desc Associated discoverer.
			 */
			'protected discoverer' : '',

			/**
			 * Constructor: Generates the ID and initializes the
			 * Widget with attributes, callbacks and subscriber
			 * that are specified in the provided functions.
			 * 
			 * @abstract
			 * @class Widget
			 * @classdesc The Widget handles the access to sensors.
			 * @requires easejs
			 * @requires MathUuid
			 * @requires Callback
			 * @requires CallbackList
			 * @requires AttributeType
			 * @requires AttributeValue
			 * @requires AttributeTypeList
			 * @requires AttributeValueList
			 * @requires ConditionList
			 * @requires Subscriber
			 * @requires SubscriberList
			 * @requires WidgetDescription
			 * @requires Discoverer
			 * @constructs Widget
			 */
			'virtual public __construct' : function(_discoverer, _attributeTypes) {
				this.id = Math.uuid();
                this.discoverer = _discoverer;
                this.register();
				this.attributeTypes = new AttributeTypeList();
				this.constantAttributeTypes = new AttributeTypeList();
				this.attributes = new AttributeValueList();
				this.constantAttributes = new AttributeValueList();
				this.subscribers = new SubscriberList();
				this.callbacks = new CallbackList();
				this.init(_attributeTypes);
			},

			/**
			 * Returns the name of the widget.
			 * 
			 * @public
			 * @alias getName
			 * @memberof Widget#
			 * @returns {string} 
			 */
			'public getName' : function() {
				return this.name;
			},

			/**
			 * Returns the id of the widget.
			 * 
			 * @public
			 * @alias getId
			 * @memberof Widget#
			 * @returns {string}
			 */
			'public getId' : function() {
				return this.id;
			},

			/**
			 * Returns the type of this class, in this case
			 * "Widget".
			 * 
			 * @virtual
			 * @public
			 * @alias getType
			 * @memberof Widget#
			 * @returns {string}
			 */
			'virtual public getType' : function() {
				return 'Widget';
			},

			/**
			 * Returns the available AttributeTypes.
			 * 
			 * @public
			 * @alias getAttributeTypes
			 * @memberof Widget#
			 * @returns {AttributeTypeList}
			 */
			'public getAttributeTypes' : function() {
				return this.attributeTypes;
			},

			/**
			 * Returns the available ConstantAttributeTypes
			 * (attributes that do not change).
			 * 
			 * @public
			 * @alias getWidgetConstantAttributeTypes
			 * @memberof Widget#
			 * @returns {AttributeTypeList}
			 */
			'public getWidgetConstantAttributeTypes' : function() {
				return this.constantAttributeTypes;
			},

			/**
			 * Returns the last acquired attribute values.
			 * 
			 * @public
			 * @alias getAttributes
			 * @memberof Widget#
             * @param {AttributeTypeList} _attributeTypeList
			 * @returns {AttributeValueList}
			 */
			'public getAttributeValues' : function(_attributeTypeList) {
                if (Class.isA(AttributeTypeList, _attributeTypeList)) {
                    return this.attributes.getSubset(_attributeTypeList);
                } else {
                    return this.attributes;
                }
			},

            /**
             * Returns the last acquired attribute value with the given attribute type.
             *
             * @param {AttributeType} _attributeType The attribute type to return the last value for.
             * @returns {*}
             */
            'public getAttributeValue': function(_attributeType) {
                return this.getAttributeValues().getItem(_attributeType.getIdentifier()).getValue();
            },
			
			/**
			 * Returns the old Attributes.
			 * 
			 * @private
			 * @alias getOldAttributes
			 * @memberof Widget#
			 * @returns {AttributeValueList}
			 */
			'public getOldAttributes' : function() {
				return this.oldAttributes;
			},

			/**
			 * Returns the ConstantAttributes.
			 * 
			 * @public
			 * @alias getConstantAttributes
			 * @memberof Widget#
			 * @returns {AttributeValueList}
			 */
			'public getConstantAttributes' : function() {
				return this.constantAttributes;
			},

			/**
			 * Returns a list of callbacks that can be
			 * subscribed to.
			 * 
			 * @public
			 * @alias getCallbacks
			 * @memberof Widget#
			 * @returns {CallbackList}
			 */
			'public getCallbackList' : function() {
				return this.callbacks;
			},

            /**
             * Returns the specified callbacks that can be
             * subscribed to.
             *
             * @public
             * @alias getCallbacks
             * @memberof Widget#
             * @returns {Array}
             */
            'public getCallbacks' : function() {
                return this.callbacks.getItems();
            },

			'public queryServices' : function() {
				return this.services;
			},

			/**
			 * Returns the Subscriber.
			 * 
			 * @public
			 * @alias getSubscriber
			 * @memberof Widget#
			 * @returns {SubscriberList}
			 */
			'public getSubscriber' : function() {
				return this.subscribers;
			},

			/**
			 * Sets the name of the Widget.
			 * 
			 * @protected
			 * @alias setName
			 * @memberof Widget#
			 * @param {string}
			 *            _name Name of the Widget.
			 */
			'protected setName' : function(_name) {
				if (typeof _name === 'string') {
					this.name = _name;
				}
			},

			/**
			 * Sets the id of the Widget.
			 * 
			 * @protected
			 * @alias setId
			 * @memberof Widget#
			 * @param {string}
			 *            _id Id of the Widget.
			 */
			'protected setId' : function(_id) {
				if (typeof _id === 'string') {
					this.id = _id;
				}
			},

			/**
			 * Sets the AttributeValueList and also the associated
			 * AttributeTypes.
			 * 
			 * @protected
			 * @alias setAttributes
			 * @memberof Widget#
			 * @param {(AttributeValueList|Array)}
			 *            _attributes List or Array of
			 *            AttributeValues
			 */
			'protected setAttributes' : function(_attributes) {
				var list = new Array();
				if (_attributes instanceof Array) {
					list = _attributes.reduce(function(o, v, i) {
                        o[i] = v;
                        return o;
                    }, {});
				} else if (Class.isA(AttributeValueList,_attributes)) {
					list = _attributes.getItems();
				}
				this.oldAttributes = this.attributes;
				for ( var i in list) {
					var attribute = list[i];
					if (Class.isA(AttributeValue, attribute)) {
						attribute.setTimestamp(this.getCurrentTime());
						this.attributes.put(attribute);

						var type = new AttributeType().withName(attribute.getName())
													.withType(attribute.getType())
													.withParameters(attribute.getParameters());
						this.attributeTypes.put(type);
					}
				}
			},

			/**
			 * Adds a new AttributeValue. If the given value is
			 * not included in the list, the associated type will
			 * be also added. Otherwise, only the value will be
			 * updated.
			 * 
			 * @public
			 * @alias addAttribute
			 * @memberof Widget#
			 * @param {AttributeValue}
			 *            _attribute AttributeValue
			 */
			'public addAttribute' : function(_attribute) {
				if (Class.isA(AttributeValue, _attribute)) {
					if (!this.attributes.contains(_attribute)) {

						var type = new AttributeType().withName(_attribute.getName())
													.withType(_attribute.getType())
													.withParameters(_attribute.getParameters());
						this.attributeTypes.put(type);

					}
					this.oldAttributes = this.attributes;

					_attribute.setTimestamp(this.getCurrentTime());
					this.attributes.put(_attribute);
				}
			},

			/**
			 * Sets the ConstantAttributeValueList and also the
			 * associated AttributeTypes.
			 * 
			 * @protected
			 * @alias setConstantAttributes
			 * @memberof Widget#
			 * @param {(AttributeValueList|Array)}
			 *            _constantAttributes List or Array of
			 *            AttributeValues
			 */
			'protected setConstantAttributes' : function(_constantAttributes) {
				var list = new Array();
				if (_constantAttributes instanceof Array) {
					list = _constantAttributes;
				} else if (Class.isA(AttributeValueList,_constantAttributes)) {
					list = _constantAttributes.getItems();
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
			},

			/**
			 * Adds a new constantAttributeValue. If the given value is
			 * not included in the list, the associated type will
			 * be also added. Otherwise, only the value will be
			 * updated.
			 * 
			 * @protected
			 * @alias addConstantAttribute
			 * @memberof Widget#
			 * @param {AttributeValue}
			 *            _constantAttribute AttributeValue
			 */
			'protected addConstantAttribute' : function(_constantAttribute) {
				if (Class.isA(AttributeValue, _constantAttribute)) {
					if (!this.constantAttributes
							.contains(_constantAttribute)) {

						var type = new AttributeType().withName(_constantAttribute.getName())
													  .withType(_constantAttribute.getType())
													  .withParameters(_constantAttribute.getParameters());
						this.constantAttributeTypes.put(type);
					}
					_attribute.setTimestamp(this.getCurrentTime());
					this.constantAttributes.put(_constantAttribute);
				}

			},

			/**
			 * Sets Callbacks.
			 * 
			 * @protected
			 * @alias setCallbacks
			 * @memberof Widget#
			 * @param {(CallbackList|Array)} _callbacks List or Array of Callbacks.
			 */
			'protected setCallbacks' : function(_callbacks) {
				var list = new Array();
				if (_callbacks instanceof Array) {
					list = _subscriber;
				} else if (Class.isA(CallbackList, _callbacks)) {
					list = _callbacks.getItems();
				}
				for ( var i in list) {
					var callback = list[i];
					if (Class.isA(Callback, callback)) {
						this.callbacks.put(callback);
					}
				}
			},

			/**
			 * Adds a new Callback.
			 * 
			 * @protected
			 * @alias addCallback
			 * @memberof Widget#
			 * @param {Callback} _callback List or Array of AttributeValues.
			 */
			'protected addCallback' : function(_callback) {
				if (Class.isA(Callback, _callback)) {
					this.callbacks.put(_callback);
				}
			},

			'protected setServices' : function(_services) {
				this.services = _services;
			},

			/**
			 * Sets SubscriberList.
			 * 
			 * @protected
			 * @alias setSubscriber
			 * @memberof Widget#
			 * @param {(SubscriberList|Array)}  _subscriber List or Array of Subscriber.
			 */
			'protected setSubscriber' : function(_subscriber) {
				var list = new Array();
				if (_subscriber instanceof Array) {
					list = _subscriber;
				} else if (Class.isA(SubscriberList, _subscriber)) {
					list = _subscriber.getItems();
				}
				for ( var i in list) {				
					var singleSubscriber = list[i];
					if (Class.isA(Subscriber, singleSubscriber)) {
						this.subscribers.put(singleSubscriber);
					}
				}
			},

			/**
			 * Adds a new Subscriber.
			 * 
			 * @public
			 * @alias addSubscriber
			 * @memberof Widget#
			 * @param {Subscriber}  _subscriber Subscriber
			 */
			'public addSubscriber' : function(_subscriber) {
				if (Class.isA(Subscriber, _subscriber)) {
					this.subscribers.put(_subscriber);
				}
			},

			/**
			 * Removes the specified Subscriber.
			 * 
			 * @public
			 * @alias removeSubscriber
			 * @memberof Widget#
			 * @param {Subscriber} _subscriber Subscriber
			 */
			'public removeSubscriber' : function(_subscriberId) {
					this.subscribers.removeItem(_subscriberId);
			},

			/**
			 * Returns the current time.
			 * 
			 * @private
			 * @alias getCurrentTime
			 * @memberof Widget#
			 * @returns {Date}
			 */
			'private getCurrentTime' : function() {
				return new Date();
			},

			/**
			 * Verifies whether the specified attributes is a
			 * provided Attribute.
			 * 
			 * @protected
			 * @alias isAttribute
			 * @memberof Widget#
			 * @param {AttributeValue}
			 *            _attribute
			 * @returns {boolean}
			 */
			'protected isAttribute' : function(_attribute) {
				return !!this.attributeTypes.contains(_attribute.getAttributeType());
			},

			/**
			 * Initializes the provided Attributes.
			 * 
			 * @function
			 * @abstract
			 * @protected
			 * @alias initAttributes
			 * @memberof Widget#
			 */
			'abstract protected initAttributes' : [],
			
			/**
			 * Initializes the provided ConstantAttributes.
			 * 
			 * @function
			 * @abstract
			 * @protected
			 * @alias initConstantAttributes
			 * @memberof Widget#
			 */
			'abstract protected initConstantAttributes' : [],

			/**
			 * Initializes the provided Callbacks.
			 * 
			 * @function
			 * @abstract
			 * @protected
			 * @alias initCallbacks
			 * @memberof Widget#
			 */
			'abstract protected initCallbacks' : [],

			/**
			 * Function for initializing. Calls all initFunctions
			 * and will be called by the constructor.
			 * 
			 * @protected
			 * @alias init
			 * @memberof Widget#
			 */
			'protected init' : function(_attributeTypes) {
				this.initAttributes();
				this.initConstantAttributes();
				this.initCallbacks();

                this.didFinishInitialization(_attributeTypes);
			},

            'public virtual didFinishInitialization' : function(_attributeTypes) {

            },

			/**
			 * Notifies other components and sends the attributes.
			 * 
			 * @virtual
			 * @public
			 * @alias initCallbacks
			 * @memberof Widget#
			 */
			'virtual public notify' : function() {
                var callbacks = this.getCallbacks();
                for (var i in callbacks) {
                    this.sendToSubscriber(callbacks[i]);
                }
			},

			/**
			 * Queries the associated sensor and updates the attributes with new values. 
			 * Must be overridden by the subclasses. Overriding subclasses can call
             * this.__super(_function) to invoke the provided callback function.
			 * 
			 * @virtual
			 * @public
			 * @alias queryGenerator
			 * @memberof Widget#
			 * @param {?function} _function For alternative actions, because an asynchronous function can be used.
			 */
			'virtual protected queryGenerator' : function(_function) {
                if (_function && typeof(_function) == 'function') {
                    _function();
                }
			},

			/**
			 * Updates the attributes by calling queryGenerator.
			 * 
			 * @public
			 * @alias updateWidgetInformation
			 * @memberof Widget#
			 * @param {?function} _function For alternative  actions, because an asynchronous function can be used.
			 *
			 */
			'public updateWidgetInformation' : function(_function) {
				this.queryGenerator(_function);
			},

			/**
			 * Updates the Attributes by external components.
			 * 
			 * @virtual
			 * @public
			 * @alias putData
			 * @memberof Widget#
			 * @param {(AttributeValueList|Array)} _data Data that should be entered.
			 * 
			 */
			'virtual public putData' : function(_data) {
				var list = new Array();
				if (_data instanceof Array) {
					list = _data;
				} else if (Class.isA(AttributeValueList, _data)) {
					list = _data.getItems();
				}
				for ( var i in list) {
					var x = list[i];
					if (Class.isA(AttributeValue, x) && this.isAttribute(x)) {
						this.addAttribute(x);
					}
				}

			},

			/**
			 * Returns all available AttributeValues, Attributes and
			 * ConstantAtrributes.
			 * 
			 * @public
			 * @alias queryWidget
			 * @memberof Widget#
			 * @returns {AttributeValueList}
			 */
			'public queryWidget' : function() {
				var response = new AttributeValueList();
				response.putAll(this.getAttributeValues());
				response.putAll(this.getConstantAttributes());
				return response;
			},

			/**
			 * Updates and returns all available AttributeValues,
			 * Attributes and ConstantAtrributes.
			 * 
			 * @public
			 * @alias updateAndQueryWidget
			 * @memberof Widget#
			 * @param {?function} _function For alternative  actions, because an asynchronous function can be used.
			 * @returns {?AttributeValueList}
			 */
			'virtual public updateAndQueryWidget' : function(_function) {
				if(_function && typeof(_function) === 'function'){
					this.queryGenerator(_function);
				} else {
					this.queryGenerator();
					var response = new AttributeValueList();
					response.putAll(this.getAttributeValues());
					response.putAll(this.getConstantAttributes());
					return response;
				}
			},

			/**
			 * Sends all Attributes, specified in the given callback, 
			 * to components which are subscribed to this Callback.
			 * @protected
			 * @alias sendToSubscriber
			 * @memberof Widget#
			 * @param {string} _callbackName Name of the searched Callback.
			 */
			'protected sendToSubscriber' : function(_callback) {
				if (_callback && Class.isA(Callback, _callback)) {
					var subscriberList = this.subscribers.getItems();
					for ( var i in subscriberList) {
						var subscriber = subscriberList[i];
						if (subscriber.getSubscriptionCallbacks().containsKey( _callback.getName())) {
							if(this.dataValid(subscriber.getConditions())){
								var subscriberInstance = this.discoverer.getComponent(subscriber.getSubscriberId());
								var callSubset =  _callback.getAttributeTypes();
								var subscriberSubset = subscriber.getAttributesSubset();
								var data = this.attributes.getSubset(callSubset);
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
			},

			/**
			 * Verifies if the attributes match to the specified conditions in case any exists.
			 * 
			 * @private
			 * @alias dataValid
			 * @memberof Widget#
			 * @param {string} _conditions List of Conditions that will be verified.
			 * @returns {boolean}
			 */
			'private dataValid' : function(_conditions) {
				if (Class.isA(ConditionList, _conditions)) {
					return true;
				}
				if (!_conditions.isEmpty()) {
					var items = _condition.getItems();
					for ( var i in items) {
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
			},

			/**
			 * Returns the description of this component.
			 * @virtual
			 * @public
			 * @alias getDescription
			 * @memberof Widget#
			 * @returns {WidgetDescription} 
			 */
			'virtual public getDescription' : function() {
				var description = new WidgetDescription().withId(this.id).withName(this.name);
				description.addOutAttributeTypes(this.attributeTypes);
				description.addOutAttributeTypes(this.constantAttributeTypes);
                var widgetCallbacks = this.callbacks.getItems();
                for(var i in widgetCallbacks) {
                    description.addCallbackName(widgetCallbacks[i].getName());
                }
				return description;
			},

			/**
			 * Runs the context acquisition constantly in an interval.
			 * Can be called by init.
			 * 
			 * @virtual
			 * @protected
			 * @alias intervalRunning
			 * @memberof Widget#
			 * @param {integer} _interval Interval in ms
			 */
			'virtual protected intervalRunning' : function(_interval) {
				var self = this;
				if (_interval === parseInt(_interval)) {
					setInterval(function() {self.queryGenerator();}, _interval);
				}
			},

			/**
			 * Sets the associated Discoverer and registers to that.
			 * @public
			 * @alias setDiscoverer
			 * @memberof Widget#
			 * @param {Discoverer} _discoverer Discoverer
			 */
			'public setDiscoverer' : function(_discoverer) {
				if (!this.discoverer) {
					this.discoverer = _discoverer;
					this.register();
				}
			},

			/**
			 * Registers the component to the associated Discoverer.
			 * 
			 * @public
			 * @alias register
			 * @memberof Widget#
			 */
			'protected register' : function() {
				if (this.discoverer) {
					this.discoverer.registerNewComponent(this);
				}
			}
			
//			/**
//			 * Unregisters the component to the associated discoverer
//			 * and deletes the reference.
//			 * 
//			 * @public
//			 * @alias register
//			 * @memberof Widget#
//			 */
//			'protected unregister' : function() {
//				if (this.discoverer) {
//					this.discoverer.unregisterComponent(this.getId());
//					this.discoverer = null;
//				}
//			},

		});

		return Widget;
});
/**
 * This module represents the InterpreterDescription. 
 * It describes the most important information for the communication with a specific interpreter. 
 * 
 * @module InterpreterDescription
 * @fileOverview
 */
define('interpreterDescription',['easejs','attributeTypeList','widgetDescription'],
    function(easejs,AttributeTypeList,WidgetDescription){
    	var Class = easejs.Class;
		var InterpreterDescription = Class('InterpreterDescription').
						extend(WidgetDescription, {
			/**
			* @alias inAttributeTypes
			* @private
			* @type {AttributeTypeList}
			* @memberof InterpreterDescription#
			* @desc List of all Attributes that are expected for interpretation.
			*/
			'private inAttributeTypes' : [], 

			/**
			 * Constructor: Calls the constructor of the WidgetDescription
			 * and initializes the inAttributeTypes.
			 * 
			 * @class InterpreterDescription
			 * @classdesc The description of an interpreter and the communication with it.
			 * @extends WidgetDescription
			 * @requires easejs
			 * @requires AttributeTypeList
			 * @requires WidgetDescription
			 * @constructs InterpreterDescription
			 */
			'override public __construct' : function(){
				this.__super();
				this.inAttributeTypes = new AttributeTypeList();
			},
			
			/**
			 * Builder for inAttributeType list
			 * 
			 * @public
			 * @alias withInAttributeTypes
			 * @memberof InterpreterDescription#
			 * @param {(AttributeTypeList|Array)} _inAttributeTypes List of AttributeType that are expected
			 * @returns {InterpreterDescription}
			 */
    		'public withInAttributeTypes' : function(_inAttributeTypes){
    			this.setInAttributeTypes(_inAttributeTypes);
    			return this;
    		},
    		
    		/**
			 * Builder for inAttributeType
			 * 
			 * @public
			 * @alias withInAttributeType
			 * @memberof InterpreterDescription#
			 * @param {AttributeType} _inAttributeType AttributeType that are expected
			 * @returns {InterpreterDescription}
			 */
    		'public withInAttributeType' : function(_inAttributeType){
    			this.setInAttributeType(_inAttributeType);
    			return this;
    		},

    		/**
			 * Returns inAttributeTypes of the interpreter
			 * 
			 * @public
			 * @alias getInAttributeTypes
			 * @memberof InterpreterDescription#
			 * @returns {AttributeTypeList}
			 */
			'public getInAttributeTypes' : function(){
				return this.inAttributeTypes;
			},

			/**
			 * Adds an inAttributeType to the list
			 * 
			 * @public
			 * @alias setInAttributeType
			 * @memberof InterpreterDescription#
			 * @param {AttributeType} _inAttributeType AttributeType that are expected
			 */
			'public setInAttributeType' : function(_inAttributeType){
					this.inAttributeTypes.put(_inAttributeType);
			},
			
			/**
			 * Adds inAttributeTypes that are expected
			 * 
			 * @public
			 * @alias setInAttributeTypes
			 * @memberof InterpreterDescription#
			 * @param {(AttributeTypeList|Array)} _inAttributeTypes List of AttributeType that are expected
			 */
			'public setInAttributeTypes' : function(_inAttributeTypes){
				this.inAttributeTypes.putAll(_inAttributeTypes);
			}

            });

        return InterpreterDescription;
});
/**
 * This module represents a InterpreterResult.
 * 
 * @module InterpreterResult
 * @fileOverview
 */
define('interpreterResult',['easejs', 'attributeValueList'],
    function(easejs, AttributeValueList){
    	var Class = easejs.Class;
    	
		var InterpreterResult = Class('InterpreterResult',{
					
			/**
			 * @alias timestamp
			 * @private
			 * @type {date}
			 * @memberof InterpreterResult#
			 * @desc Time of the interpretation.
			 */
			'private timestamp' : '',
			/**
			 * @alias outAttributes
			 * @private
			 * @type {AttributeValueList}
			 * @memberof InterpreterResult#
			 * @desc Interpreted data.
			 */
			'private outAttributes' : [],
				
			/**
			 * @alias inAttributes
			 * @private
			 * @type {AttributeValueList}
			 * @memberof InterpreterResult#
			 * @desc Data, which were used for the interpretation.
			 */
			'private inAttributes' : [],
			
			/**
			 * Constructor: Initializes the in- and outAttributes.
			 *
			 * @class InterpreterResult
			 * @classdesc Contains the interpreted data, inclusive the input for the interpretation.
			 * @requires easejs
			 * @requires AttributeValueList
			 */
			'public __construct' : function() {
				this.inAttributes = new AttributeValueList();
				this.outAttributes = new AttributeValueList();
			},
			
    		/**
			 * Builder for timestamp.
			 * 
			 * @public
			 * @alias withTimestamp
			 * @memberof InterpreterResult#
			 * @param {String} _timestamp timestamp
			 * @returns {InterpreterResult}
			 */
    		'public withTimestamp' : function(_timestamp){
    			this.setTimestamp(_timestamp);
    			return this;
    		},

    		/**
			 * Builder for outAttributes.
			 * 
			 * @public
			 * @alias withOutAttributes
			 * @memberof InterpreterResult#
			 * @param {(AttributeValueList|Array)} _outAttributes values
			 * @returns {InterpreterResult}
			 */
    		'public withOutAttributes' : function(_outAttributes){
    			this.setOutAttributes(_outAttributes);
    			return this;
    		},
    		
    		/**
			 * Builder for inAttributes.
			 * 
			 * @public
			 * @alias withInAttributes
			 * @memberof InterpreterResult#
			 * @param {(AttributeValueList|Array)} _inAttributes values
			 * @returns {InterpreterResult}
			 */
    		'public withInAttributes' : function(_inAttributes){
    			this.setInAttributes(_inAttributes);
    			return this;
    		},
    		
			
			/**
			 * Returns the interpretation time.
			 * 
			 * @public
			 * @alias getTimestamp
			 * @memberof InterpreterResult#
			 * @returns {date}
			 */
			'public getTimestamp' : function(){
				return this.timestamp;
			},
			
			/**
			 * Returns the interpreted attributes.
			 * 
			 * @public
			 * @alias getOutAttributes
			 * @memberof InterpreterResult#
			 * @returns {AttributeValueList}
			 */
			'public getOutAttributes' : function(){
				return this.outAttributes;
			},
			
			/**
			 * Returns the inAttributes.
			 * 
			 * @public
			 * @alias getInAttributes
			 * @memberof InterpreterResult#
			 * @returns {AttributeValueList}
			 */
			'public getInAttributes' : function(){
				return this.inAttributes;
			},

			/**
    		 * Sets the interpretation time.
    		 * 
    		 * @public
    		 * @alias setTimestamp
    		 * @memberof InterpreterResult#
    		 * @param {date} _timstamp interpretation time
    		 */
			'public setTimestamp' : function(_timesstamp){
				if(_timesstamp instanceof Date){
					this.type = _timesstamp;
				};
			},
			
			/**
    		 * Sets the interpreted values.
    		 * 
    		 * @public
    		 * @alias setOutAttributes
    		 * @memberof InterpreterResult#
    		 * @param {(AttributeValueList|Array)} _outAttributes retrieved attributes
    		 */
			'public setOutAttributes' : function(_outAttributes){
				if (_outAttributes instanceof Array) {
					for(var i in _outAttributes){
						this.outAttributes.put(_outAttributes[i]);
					};
				} else if (Class.isA(AttributeValueList, _outAttributes)) {
					this.outAttributes = _outAttributes;
				};
			},
			
			/**
    		 * Sets the inAttributes.
    		 * 
    		 * @public
    		 * @alias setInAttributes
    		 * @memberof InterpreterResult#
    		 * @param {(AttributeValueList|Array)} _inAttributes inAttributes
    		 */
			'public setInAttributes' : function(_inAttributes){
				if (_inAttributes instanceof Array) {
					for(var i in _outAttributes){
						this.inAttributes.put(_inAttributes[i]);
					};
				} else if (Class.isA(AttributeValueList, _inAttributes)) {
					this.inAttributes = _inAttributes;
				};
			}

		});

		return InterpreterResult;
	
});
/**
 * This module represents an Context Interpreter.
 * 
 * @module Interpreter
 * @fileOverview
 */
define('interpreter',[ 'easejs', 'MathUuid', 'attributeType', 'attributeTypeList',
		'attributeValue', 'attributeValueList', 'interpreterDescription', 'interpreterResult' ],
		function(easejs, MathUuid, AttributeType, AttributeTypeList,
				AttributeValue, AttributeValueList, InterpreterDescription, InterpreterResult) {
			var Class = easejs.Class;
			var AbstractClass = easejs.AbstractClass;
			var Interpreter = AbstractClass('Interpreter',
			{
				/**
				 * @alias name
				 * @public
				 * @type {string}
				 * @memberof Interpreter#
				 * @desc Name of the Interpreter.
				 */
				'public name' : 'Interpreter',
				/**
				 * @alias id
				 * @public
				 * @type {string}
				 * @memberof Interpreter#
				 * @desc Id of the Interpreter. Will be generated.
				 */
				'public id' : '',
				/**
				 * @alias inAttributeTypes
				 * @protected
				 * @type {AttributeTypeList}
				 * @memberof Interpreter#
				 * @desc Types of all attributes that can be handled.
				 */
				'protected inAttributeTypes' : [],
				/**
				 * @alias outAttributeTypes
				 * @protected
				 * @type {AttributeTypeList}
				 * @memberof Interpreter#
				 * @desc Types of all attributes that will be returned.
				 */
				'protected outAttributeTypes' : [],
				/**
				 * @alias inAttributeValues
				 * @protected
				 * @type {AttributeValueList}
				 * @memberof Interpreter#
				 * @desc List of the data that should be interpreted.
				 */
				'protected inAttributeValues' : [],
				/**
				 * @alias outAttributeValues
				 * @protected
				 * @type {AttributeValueList}
				 * @memberof Interpreter#
				 * @desc List of interpreted data.
				 */
				'protected outAttributeValues' : [],
				/**
				 * @alias lastInterpretation
				 * @protected
				 * @type {Date}
				 * @memberof Interpreter#
				 * @desc Last interpretation time.
				 */
				'protected lastInterpretation' : '',
				/**
				 * @alias discoverer
				 * @protected
				 * @type {Discoverer}
				 * @memberof Interpreter#
				 * @desc Associated Discoverer.
				 */
				'protected discoverer' : '',

				/**
				 * Constructor: Generates the id and initializes the (in and out) types and values.
				 * 
				 * @abstract
				 * @class Interpreter
				 * @classdesc The Widget handles the access to sensors.
				 * @requires easejs
				 * @requires MathUuid
				 * @requires AttributeType
				 * @requires AttributeValue
				 * @requires AttributeTypeList
				 * @requires AttributeValueList
				 * @requires InterpreterDescription
				 * @constructs Interpreter
				 */
				'public __construct' : function(_discoverer) {
					this.id = Math.uuid();
                    this.discoverer = _discoverer;
                    this.register();
					this.inAttributeTypes = new AttributeTypeList();
					this.outAttributeTypes = new AttributeTypeList();
					this.inAttributeValues = new AttributeValueList();
					this.outAttributeValues = new AttributeValueList();
					this.initInterpreter();
				},
				
				/**
				 * Returns the name of the interpreter.
				 * 
				 * @public
				 * @alias getName
				 * @memberof Interpreter#
				 * @returns {string}
				 */
				'public getName' : function() {
					return this.name;
				},

				/**
				 * Returns the id of the interpreter.
				 * 
				 * @public
				 * @alias getId
				 * @memberof Interpreter#
				 * @returns {string}
				 */
				'public getId' : function() {
					return this.id;
				},
				
				/**
				 * Returns the type of this class, in this case
				 * "Interpreter".
				 * 
				 * @public
				 * @alias getType
				 * @memberof Interpreter#
				 * @returns {string}
				 */
				'public getType' : function() {
					return 'Interpreter';
				},

				/**
				 * Initializes interpreter and sets the expected inAttributes
				 * and provided outAttributes.
				 * @private
				 * @alias initInterpreter
				 * @memberof Interpreter#
				 */
				'private initInterpreter' : function() {
					this.initInAttributes();
					this.initOutAttributes();
				},

				/**
				 * Initializes the inAttributes.
				 * 
				 * @function
				 * @abstract
				 * @protected
				 * @alias initInAttributes
				 * @memberof Interpreter#
				 */
				'abstract protected initInAttributes' : [],
				/**
				 * Initializes the outAttributes.
				 * 
				 * @function
				 * @abstract
				 * @protected
				 * @alias initOutAttributes
				 * @memberof Interpreter#
				 */
				'abstract protected initOutAttributes' : [],

				/**
				 * Returns the expected inAttributeTypes.
				 * 
				 * @public
				 * @alias getInAttributeTypes
				 * @memberof Interpreter#
				 * @returns {AttributeTypeList} 
				 */
				'public getInAttributeTypes' : function() {
					return this.inAttributeTypes;
				},

				/**
				 * Sets an inAttribute.
				 * 
				 * @protected
				 * @alias setInAttribute
				 * @memberof Interpreter#
				 * @param {string} _name name of the attribute
				 * @param {string} _type type of the attribute
				 * @param {string} _value value of the attribute
				 * @param {ParameterList|Array} _parameter Parameter of the attribute.
				 */
				'protected setInAttribute' : function(_name, _type, _value,	_parameters) {
					var attributeValue = new AttributeValue().withName(_name)
							.withValue(_value).withType(_type).withParameters(_parameters);
					if (this.isInAttribute(attributeValue)) {
						this.inAttributeValues.put(attributeValue);
					}
				},

				/**
				 * Sets an inAttributes.
				 * 
				 * @protected
				 * @alias setInAttributeValues
				 * @memberof Interpreter#
				 * @param {(AttributeValueList|Array)} _attributeValueList Attributes to set.
				 */
				'protected setInAttributeValues' : function(_attributeValueList) {
					this.inAttributeValues = new AttributeValueList().withItems(_attributeValueList);
				},
				/**
				 * Verifies whether the specified attribute is contained in inAttributeList.
				 * 
				 * @protected
				 * @alias isInAttribute
				 * @memberof Interpreter#
				 * @param {AttributeValue} _attribute Attribute that should be verified.
				 * @return {boolean}
				 */
				'protected isInAttribute' : function(_attribute) {
					var type = _attribute.getAttributeType();
					if (this.inAttributeTypes.contains(type)) {
						return true;
					} else {
						return false;
					}
				},

				/**
				 * Returns the provided outAttributeTypes.
				 * 
				 * @public
				 * @alias getOutAttributeTypes
				 * @memberof Interpreter#
				 * @returns {AttributeTypeList} 
				 */
				'public getOutAttributeTypes' : function() {
					return this.outAttributeTypes;
				},

				/**
				 * Adds an outAttribute.
				 * 
				 * @protected
				 * @alias setOutAttribute
				 * @memberof Interpreter#
				 * @param {string} _name name of the attribute
				 * @param {string} _type type of the attribute
				 * @param {string} _value value of the attribute
				 * @param {ParameterList|Array} _parameter Parameter of the attribute.
				 */
				'protected setOutAttribute' : function(_name, _type, _value,_parameters) {
					var attributeValue = new AttributeValue().withName(_name)
							.withValue(_value).withType(_type).withParameters(_parameters);
					if (this.isOutAttribute(attributeValue)) {
						this.outAttributeValues.put(attributeValue);
					}
				},

				/**
				 * Verifies whether the specified attribute is contained in outAttributeList.
				 * 
				 * @protected
				 * @alias isOutAttribute
				 * @memberof Interpreter#
				 * @param {AttributeValue} _attribute Attribute that should be verified.
				 * @return {boolean}
				 */
				'protected isOutAttribute' : function(_attribute) {
					return !!this.outAttributeTypes.contains(_attribute.getAttributeType());
				},

				/**
				 * Validates the data and calls interpretData.
				 * 
				 * @public
				 * @alias callInterpreter
				 * @memberof Interpreter#
				 * @param {AttributeValueList} _dataToInterpret Data that should be interpreted.
				 * @param {?function} _function For additional actions, if an asynchronous function is used.
				 */
				'public callInterpreter' : function(_dataToInterpret, _function) {
					if (_dataToInterpret && this.canHandle(_dataToInterpret)) {
						if(_function && typeof(_function) == 'function'){
							this.interpretData(_dataToInterpret, _function);
						} else {
							this.interpretData(_dataToInterpret);
						}
						this.setInAttributeValues(_dataToInterpret);
						this.lastInterpretation = new Date();
					} else {
						var list = this.outAttributeTypes.getItems();
						for ( var i in list) {
							this.setOutAttribute(list[i].getName(), list[i].getType(), 'unavailable');
						}
                        _function();
					}
				},

				/**
				 * Interprets the data.
				 * 
				 * @function
				 * @abstract
				 * @public
				 * @alias interpretData
				 * @memberof Interpreter#
				 * @param {AttributeValueList} _data Data that should be interpreted.
				 * @param {?function} _function For additional actions, if an asynchronous function is used.
				 */
				'abstract protected interpretData' : [ '_data', '_function' ],

				/**
				 * Checks whether the specified data match the expected.
				 * 
				 * @protected
				 * @alias canHandle
				 * @memberof Interpreter#
				 * @param {AttributeValueList} _inAtts Data that should be verified.
				 */
				'protected canHandle' : function(_inAtts) {
					var list = []
					if (_inAtts instanceof Array) {
						list = _inAtts;
					} else if (Class.isA(AttributeValueList, _inAtts)) {
						list = _inAtts.getItems();
					}
					if (list.length == 0 || _inAtts.size() != this.getInAttributeTypes().size()) {
						return false;
					}
					for ( var i in list) {
						var inAtt = list[i];
						if (!this.isInAttribute(inAtt)) {
							return false;
						}
					}
					return true;
				},

				/**
				 * Returns the interpreted data.
				 * 
				 * @protected
				 * @alias getInterpretedData
				 * @memberof Interpreter#
				 * @returns {AttributeValueList} 
				 */
				'public getInterpretedData' : function() {
					var result = new InterpreterResult().withTimestamp(this.lastInterpretation).
								withInAttributes(this.inAttributeValues).
								withOutAttributes(this.outAttributeValues);
					return result;
				},

				/**
				 * Returns the time of the last interpretation.
				 * 
				 * @protected
				 * @alias getLastInterpretionTime
				 * @memberof Interpreter#
				 * @returns {Date} 
				 */
				'public getLastInterpretionTime' : function() {
					return this.lastInterpretation;
				},

				/**
				 * Returns the description of this component.
				 * @virtual
				 * @public
				 * @alias getInterpreterDescription
				 * @memberof Interpreter#
				 * @returns {InterpreterDescription} 
				 */
				'virtual public getDescription' : function() {
					var description = new InterpreterDescription().withId(
							this.id).withName(this.name);
					description.addOutAttributeTypes(this.outAttributeTypes);
					description.setInAttributeTypes(this.inAttributeTypes);
					return description;
				},

				/**
				 * Sets and registers to the associated Discoverer.
				 * @public
				 * @alias setDiscoverer
				 * @memberof Interpreter#
				 * @param {Discoverer} _discoverer Discoverer
				 */
				'public setDiscoverer' : function(_discoverer) {
					if (!this.discoverer) {
						this.discoverer = _discoverer;
						this.register();
					}
				},

				/**
				 * Registers the component to the associated Discoverer.
				 * 
				 * @public
				 * @alias register
				 * @memberof Interpreter#
				 */
				'protected register' : function() {
					if (this.discoverer) {
						this.discoverer.registerNewComponent(this);
					}

				}
				
//				/**
//				 * Unregisters the component to the associated discoverer
//				 * and deletes the reference.
//				 * 
//				 * @public
//				 * @alias register
//				 * @memberof Widget#
//				 */
//				'protected unregister' : function() {
//					if (this.discoverer) {
//						this.discoverer.unregisterComponent(this.getId());
//						this.discoverer = null;
//					}
//				},

			});

			return Interpreter;
		});
/**
 * This module representing a Context Aggregator. 
 * It aggregates data from multiple widgets.
 * 
 * @module Aggregator
 * @fileOverview
 */
define('aggregator',['easejs', 'MathUuid','widget',
        'attributeType', 'attributeValue', 'attributeValueList', 'subscriber', 
        'subscriberList', 'callbackList', 'storage', 'widgetDescription', 'interpreter', 'attributeTypeList'],
 	function(easejs, MathUuid, Widget, AttributeType,
 			AttributeValue, AttributeValueList, Subscriber, SubscriberList,
 			CallbackList, Storage, WidgetDescription, Interpreter, AttributeTypeList){

 	var Class = easejs.Class;
	var Aggregator =  Class('Aggregator').
				extend(Widget, 
			
	{
	   /**
	    * @alias name
	    * @public
	    * @type {string}
	    * @memberof Aggregator#
	    * @desc Name of the Widget.
        */
		'public name' : 'Aggregator',
		
		/**
		 * @alias id
		 * @public
		 * @type {string}
		 * @memberof Aggregator#
		 * @desc ID of the Aggregator. Will be generated.
		 */
		'public id' : '', 
		
		/**
		 * @alias widgets
		 * @protected
		 * @type {Array}
		 * @memberof Aggregator#
		 * @desc List of subscribed widgets referenced by ID.
		 */
		'protected widgets' : [],

        /**
         * @alias interpreters
         * @protected
         * @type {Array}
         * @memberof Aggregator#
         * @desc List of subscribed interpreters referenced by ID.
         */
        'protected interpreters' : [],

		/**
		 * @alias db
		 * @protected
		 * @type {Storage}
		 * @memberof Aggregator#
		 * @desc Database of the Aggregator.
		 */
		'protected db' : '',
		
		/**
		 * Constructor: Generates the id and initializes the Aggregator.
		 * 
		 * @abstract
		 * @class Aggregator
		 * @extends Widget
		 * @classdesc The Widget handles the access to sensors.
		 * @requires easejs
		 * @requires MathUuid
		 * @requires CallbackList
		 * @requires AttributeType
		 * @requires AttributeValue
		 * @requires AttributeValueList
		 * @requires Subscriber
		 * @requires SubscriberList
		 * @requires Storage
		 * @requires Widget
		 * @constructs Aggregator
		 */
		'override virtual public __construct': function(_discoverer, _attributeTypes)
        {
			this.id = Math.uuid();
			this.widgets = [];
            this.interpreters = [];
			this.__super(_discoverer, _attributeTypes);
        },
        
        /**
		 * Returns the type of this class, in this case
		 * "Aggregator".
		 * 
		 * @override
		 * @public
		 * @alias getType
		 * @memberof Aggregator#
		 * @returns {string}
		 */
		'override public getType' : function(){
		    return 'Aggregator';
		 },
		 
		/**
		 * Adds new AttributeTypes, useful when a new Widget is subscribed.
		 * 
		 * @protected
	   	 * @alias addAttributeType
		 * @memberof Aggregator#
		 * @param {AttributeType} _attributeType attributeType
	     */
		'protected addAttributeType' : function(_attributeType){
			if(Class.isA( AttributeType, _attributeType )){			
				this.attributeTypes.put(_attributeType);
				var attVal = new AttributeValue().buildFromAttributeType(_attributeType);
				this.attributes.put(attVal);
            }
        },
		
		/**
		 * Sets Widget IDs.
		 * 
		 * @protected
	   	 * @alias setWidgets
		 * @memberof Aggregator#
		 * @param {Array} _widgetIds List of Widget IDs
	     */
		'protected setWidgets' : function(_widgetIds){
			this.widgets = _widgetIds;
		},
		
		/**
		 * Adds Widget ID.
		 * 
		 * @public
	   	 * @alias addWidget
		 * @memberof Aggregator#
		 * @param {String|Widget} _widgetIdOrWidget Widget ID
	     */
		'public addWidget' : function(_widgetIdOrWidget){
            if (Class.isA(Widget, _widgetIdOrWidget)) {
                this.widgets.push(_widgetIdOrWidget.getId());
            } else if(typeof _widgetIdOrWidget == "string") {
                this.widgets.push(_widgetIdOrWidget);
            }
		},
		
		/**
		 * Returns the available Widget IDs.
		 * 
		 * @public
		 * @alias getWidgets
		 * @memberof Aggregator#
		 * @returns {Array}
		 */
		'public getWidgets' : function() {
			return this.widgets;
		},
		
		/**
		 * Removes Widget ID from list.
		 * 
		 * @protected
	   	 * @alias removeWidget
		 * @memberof Aggregator#
		 * @param {String} _widgetId Id of the Widget
	     */
		'protected removeWidget' : function(_widgetId){
            var index = this.widgets.indexOf(_widgetId);
            if (index > -1) {
                this.widgets = this.widgets.splice(index, 1);
            }
		},
		
		/**
		 * Retrieves all Attributes of the specified widgets.
		 * 
		 * @protected
	   	 * @alias initAttributes
		 * @memberof Aggregator#
	     */
		'protected initAttributes' : function(){
			if(this.widgets.length > 0){
				var widgetIdList = this.widgets;
				for(var i in widgetIdList){
					var widgetId = widgetIdList[i];
					var widgetInstance = this.discoverer.getComponent(widgetId);
					if (widgetInstance) {
						this.setAttributes(widgetInstance.queryAttributes());
					}
                }
            }
        },
		
		/**
		 * Retrieves all ConstantAttributes of the specified widgets.
		 * 
		 * @protected
	   	 * @alias initConstantAttributes
		 * @memberof Aggregator#
	     */
		'protected initConstantAttributes' : function(){
			if(this.widgets.length > 0){
                var widgetIdList = this.widgets;
				for(var i in widgetIdList){
					var widgetId = widgetIdList[i];
					var widgetInstance = this.discoverer.getComponent(widgetId);
					if (widgetInstance) {
						this.setConstantAttributes(widgetInstance.queryConstantAttributes());
					}
                }
            }
        },
		
		/**
		 * Retrieves all actual Callbacks of the specified Widgets.
		 * 
		 * @protected
	   	 * @alias initCallbacks
		 * @memberof Aggregator#
	     */
		'protected initCallbacks' : function(){
			if(this.widgets.length > 0){
				var widgetIdList = this.widgets;
				for(var i in widgetIdList){
					var widgetId = widgetIdList[i];
					this.initWidgetSubscription(widgetId);
                }
            }
        },

        'override public didFinishInitialization': function(_attributeTypes) {
            this.aggregatorSetup(_attributeTypes);
        },
		
		/**
		 * InitMethod for Aggregators. Called by constructor.
		 * Initializes the associated Storage.
		 * 
		 * @protected
	   	 * @alias aggregatorSetup
		 * @memberof Aggregator#
	     */
		'protected aggregatorSetup' : function(_attributeTypes){
			this.initStorage('DB_'+this.name);
			this.setAggregatorAttributeValues(_attributeTypes);
			this.setAggregatorConstantAttributeValues();
			this.setAggregatorCallbacks();

            this.didFinishSetup();
		},
		
		/**
		 * Initializes the provided attributeValues that are only specific to the Aggregator.
		 * Called by aggregatorSetup().
		 * 
		 * @function
		 * @abstract
		 * @protected
		 * @alias setAggregatorAttributeValues
		 * @memberof Aggregator#
		 */
		'virtual protected setAggregatorAttributeValues' : function(_attributeTypes) {
            for (var index in _attributeTypes) {
                var theAttributeType = _attributeTypes[index];
                this.addAttribute(new AttributeValue().buildFromAttributeType(theAttributeType));
            }
        },

		/**
		 * Initializes the provided ConstantAttributeValues that are only specific to the Aggregator.
		 * Called by aggregatorSetup().
		 * 
		 * @function
		 * @abstract
		 * @protected
		 * @alias setAggregatorConstantAttributeValues
		 * @memberof Aggregator#
		 */
		'virtual protected setAggregatorConstantAttributeValues' : function() {

        },

		/**
		 * Initializes the provided Callbacks that are only specific to the Aggregator.
		 * Called by aggregatorSetup().
		 * 
		 * @function
		 * @abstract
		 * @protected
		 * @alias setAggregatorCallbacks
		 * @memberof Aggregator#
		 */
		'virtual protected setAggregatorCallbacks' : function() {

        },

        'public addInterpreter': function(_theInterpreter) {
            this.interpreters.push(_theInterpreter.getId());
        },

        'public getInterpreters': function() {
            return this.interpreters;
        },

		/**
		 * Returns the current Attributes that are saved in the cache.
		 * 
		 * @public
	   	 * @alias getCurrentData
		 * @memberof Aggregator#
		 * @returns {AttributeValueList}
	     */
		'public getCurrentData' : function(){
			var response = new AttributeValueList();
			response.putAll(this.attributes);
			return response;
		},
		
		/**
		 * Subscribes to the given widget for the specified Callbacks.
		 * 
		 * @protected
	   	 * @alias subscribeTo
		 * @memberof Aggregator#
		 * @param {Widget} _widget Widget that should be subscribed to.
		 * @param {CallbackList} _callbacks required Callbacks
	     */
		'protected subscribeTo' : function(_widget, _callbacks, _subSet, _conditions){	
			if(Class.isA(Widget, _widget)){
				var subscriber = new Subscriber().withSubscriberId(this.id).
									withSubscriberName(this.name).
									withSubscriptionCallbacks(_callbacks).
									withAttributesSubset(_subSet).
									withConditions(_conditions);
				_widget.addSubscriber(subscriber);
            }
        },
		
		/**
		 * Subscribes to the widgets that are defined in the Widget ID List
         * used in the initCallback method.
		 * 
		 * @protected
	   	 * @alias initWidgetSubscription
		 * @memberof Aggregator#
		 * @param {String} _widgetId Widget that should be subscribed.
		 * @returns {?CallbackList}
	     */
		'protected initWidgetSubscription' : function(_widgetId){
			var calls = null;
			if(Class.isA(String, _widgetId)){
				var widget = this.discoverer.getComponent(_widgetId);
				if (widget){
					//subscribe to all callbacks
					calls = widget.queryCallbacks();
					this.subscribeTo(widget, calls);
				}
            }
            return calls;
		},
		
		/**
		 * Adds the specified callbacks of a widget to the aggregator.
         * 
		 * @public
	   	 * @alias addWidgetSubscription
		 * @memberof Aggregator#
		 * @param {String|Widget|WidgetDescription} _widgetIdOrWidget Widget that should be subscribed.
		 * @param {CallbackList} _callbackList required Callbacks
	     */
		'public addWidgetSubscription' : function(_widgetIdOrWidget, _callbackList){
            if (Class.isA(Widget, _widgetIdOrWidget) || Class.isA(WidgetDescription, _widgetIdOrWidget)) {
                if (Class.isA(Widget, _widgetIdOrWidget) && (!_callbackList || !Class.isA(CallbackList, _callbackList))) {
                    _callbackList = _widgetIdOrWidget.getCallbackList();
                }
                _widgetIdOrWidget = _widgetIdOrWidget.getId();
            }
			if(typeof _widgetIdOrWidget == "string" && Class.isA(CallbackList, _callbackList)){
				var widget = this.discoverer.getComponent(_widgetIdOrWidget);
				if (widget) {
					this.subscribeTo(widget, _callbackList);			
					this.callbacks.putAll(_callbackList);			
					var callsList = _callbackList.getItems();		
					for(var x in callsList){
						var singleCallback = callsList[x];			
						var typeList = singleCallback.getAttributeTypes().getItems();
						for(var y in typeList){
							var singleType = typeList[y];
							this.addAttributeType(singleType);
                        }
                    }
                    this.addWidget(_widgetIdOrWidget);
                }
            }
        },
		
		/**
		 * Removes subscribed Widgets and deletes the entry 
		 * for subscribers in the associated Widget.
		 * 
		 * @public
	   	 * @alias unsubscribeFrom
		 * @memberof Aggregator#
		 * @param {String} _widgetId Widget that should be removed.
	     */
		'public unsubscribeFrom' : function(_widgetId){
			if(typeof _widgetId == "string"){
				var widget = this.discoverer.getComponent(_widgetId);
				if (widget) {
					console.log('aggregator unsubscribeFrom: ' + widget.getName());
					widget.removeSubscriber(this.id);
					this.removeWidget(_widgetId);
                }
            }
        },
		
		/**
		 * Puts context data to Widget and expects an array.
		 * 
		 * @override
		 * @public
	   	 * @alias putData
		 * @memberof Aggregator#
		 * @param {(AttributeValueList|Array)}  _data data that shall be input
	     */
		'override public putData' : function(_data){
			var list = [];
			if(_data instanceof Array){
				list = _data;
			} else if (Class.isA(AttributeValueList, _data)) {
				list = _data.getItems();
			}
			for(var i in list){
				var x = list[i];
				if(Class.isA( AttributeValue, x ) && this.isAttribute(x)){
					this.addAttribute(x);
					if(this.db){
						this.store(x);
					}
                }
            }
        },
		
		/**
		 * Calls the given Interpreter for interpretation the data.
		 * 
		 * @public
	   	 * @alias interpretData
		 * @memberof Aggregator#
		 * @param {String} _interpreterId ID of the searched Interpreter
		 * @param {(AttributeValueList|Array)} _data data that should be interpreted
		 * @param {?function} _function for additional actions, if an asynchronous function is used
	     */
		'public interpretData' : function(_interpreterId, _function){
			var interpreter = this.discoverer.getComponent(_interpreterId);
			if (Class.isA(Interpreter, interpreter)) {
				interpreter.callInterpreter(this.getAttributeValues(interpreter.getInAttributeTypes()), _function);
			}
		},
		
		/**
		 * Calls the given Interpreter for getting the data.
		 * 
		 * @public
	   	 * @alias getInterpretedData
		 * @memberof Aggregator#
		 * @param {String} _interpreterId ID of the searched Interpreter
		 * @returns {?AttributeValueList}
	     */
		'public getInterpretedData' : function(_interpreterId){
			var response = 'undefined';
			var interpreter = this.discoverer.getComponent(_interpreterId);
			if (interpreter) {
				response = interpreter.getInterpretedData();
				var attributeList = response.getOutAttributes().getItems();
				for (var i in attributeList) {
					var theAttribute = attributeList[i];
					if (Class.isA(AttributeValue, theAttribute) && this.isAttribute(theAttribute)) {
						this.addAttribute(theAttribute);
						if(this.db){
							this.store(theAttribute);
						}
                    }
                }
            }
			return response;
		},
		
		/**
		 * Initializes the database with the specified name.
		 * 
		 * @protected
	   	 * @alias initStorage
		 * @memberof Aggregator#
		 * @param {String} _name Name of the Storage
	     */
		'protected initStorage' : function(_name){
			this.db = new Storage(_name, 7200000, 5);
		},
		
		/**
		 * Stores the data.
		 * 
		 * @protected
	   	 * @alias store
		 * @memberof Aggregator#
		 * @param {AttributeValue} _attributeValue data that should be stored
	     */
		'protected store' : function(_attributeValue){
			this.db.store(_attributeValue);
		},
		
		/**
		 * Queries the database and returns the last retrieval result. 
		 * It may be that the retrieval result is not up to date, 
		 * because an asynchronous function is used for the retrieval.
		 * For retrieving the current data, this function can be used as callback function
		 * in retrieveStorage().
		 * 
		 * @public
	   	 * @alias queryAttribute
		 * @memberof Aggregator#
		 * @param {String} _name Name of the searched AtTributes.
		 * @param {?function} _function for alternative  actions, because an asynchronous function is used
	     */
		'public queryAttribute' : function(_name, _function){
			this.db.retrieveAttributes(_name, _function);	
		},
		
		/**
		 * Queries a specific table and only actualizes the storage cache.
		 * For an alternativ action can be used a callback.
		 * 
		 * @public
	   	 * @alias retrieveStorage
		 * @memberof Aggregator#
		 * @returns {RetrievalResult}
	     */
		'public retrieveStorage' : function(){
			return this.db.getCurrentData();
		},
		
		/**
		 * Returns an overview about the stored attributes.
		 * It may be that the overview about the stored attributes is not up to date, 
		 * because an asynchronous function is used for the retrieval.
		 * For retrieving the current data, this function can be used as callback function
		 * in queryTables().
		 * 
		 * @public
	   	 * @alias getStorageOverview
		 * @memberof Aggregator#
		 * @returns {?Array}
	     */
		'public getStorageOverview' : function(){
			return this.db.getAttributesOverview();
		},

		/**
		 * Only actualizes the attributeType cache in th database.
		 * For an alternativ action can be used a callback.
		 *
		 * @public
	   	 * @alias queryTables
		 * @memberof Aggregator#
		 * @param {?function} _function for alternative actions, because an asynchronous function is used
	     */
		'public queryTables' : function(_function){
			this.db.getAttributeNames(_function);
        },

        /**
         * Updates the information for the widget with the provided ID and calls the callback afterwards.
         *
         * @public
         * @virtual
         * @alias queryReferencedWidget
         * @memberof Aggregator#
         * @param {String} _widgetId The ID of the widget to query.
         * @param {Callback} _callback The callback to query after the widget was updated.
         */
        'virtual public queryReferencedWidget' :function(_widgetId, _callback){
            this.discoverer.getWidget(_widgetId).updateWidgetInformation(_callback);
        },

        'private getComponentUUIDs': function() {
            return this.widgets.concat(this.interpreters);
        },

        'private hasComponent': function(uuid) {
            return jQuery.inArray(uuid, this.getComponentUUIDs()) != -1;
        },

        'private doesSatisfyAttributeType': function(_attributeType) {
            var componentUUIDs = this.getComponentUUIDs();
            var doesSatisfy = false;

            for (var index in componentUUIDs) {
                var theComponent = this.discoverer.getComponent(componentUUIDs[index]);
                if (theComponent.getDescription().doesSatisfyAttributeType(_attributeType)) {
                    doesSatisfy = true;
                }
            }

            return doesSatisfy;
        },

        'private getComponentsForUnsatisfiedAttributeTypes': function(_unsatisfiedAttributes, _all, _componentTypes) {
            var relevantComponents = this.discoverer.getComponentsByAttributes(_unsatisfiedAttributes, _all, _componentTypes);
            console.log("I found "+relevantComponents.length+" component(s) of type "+_componentTypes+" that might satisfy the requested attributes.");

            for(var index in relevantComponents) {
                var theComponent = relevantComponents[index];
                console.log("Let's look at component "+theComponent.getName()+".");

                if (!this.hasComponent(theComponent.getId())) {
                    var outAttributes = theComponent.getDescription().getOutAttributeTypes().getItems();

                    // if component is a widget and it wasn't added before, subscribe to its callbacks
                    if (Class.isA(Widget, theComponent)) {
                        console.log("It's a widget.");

                        this.addWidgetSubscription(theComponent);
                        // remove satisfied attributes
                        for (var widgetOutAttributeIndex in outAttributes) {
                            var widgetOutAttribute = outAttributes[widgetOutAttributeIndex];
                            if (!this.getAttributeTypes().contains(widgetOutAttribute)) this.addAttributeType(widgetOutAttribute);
                            console.log("I can now satisfy attribute "+widgetOutAttribute.getIdentifier()+" with the help of "+theComponent.getName()+"! That was easy :)");
                            _unsatisfiedAttributes.removeItem(widgetOutAttribute.getIdentifier());
                        }
                    } else if (Class.isA(Interpreter, theComponent)) { // if the component is an interpreter and all its in attributes can be satisfied, add the interpreter
                        console.log("It's an interpreter.");

                        var inAttributes = theComponent.getInAttributeTypes().getItems();
                        var canSatisfyInAttributes = true;

                        for (var inAttributeIdentifier in inAttributes) {
                            var theInAttribute = inAttributes[inAttributeIdentifier];
                            console.log("The interpreter needs the attribute "+theInAttribute.getIdentifier()+".");

                            if (!this.doesSatisfyAttributeType(theInAttribute)) {
                                console.log("It seems that I can't satisfy "+theInAttribute.getIdentifier()+", but I will search for components that can.");
                                var newAttributeList = new AttributeTypeList();
                                newAttributeList.put(theInAttribute);
                                this.getComponentsForUnsatisfiedAttributeTypes(newAttributeList, false, [Widget, Interpreter]);
                                if (!this.doesSatisfyAttributeType(theInAttribute)) {
                                    console.log("I couldn't find a component to satisfy "+theInAttribute.getIdentifier()+". Dropping interpreter "+theComponent.getName()+". Bye bye.");
                                    canSatisfyInAttributes = false;
                                    break;
                                }
                            } else {
                                console.log("It seems that I already satisfy the attribute "+theInAttribute.getIdentifier()+". Let's move on.");
                            }
                        }

                        if (canSatisfyInAttributes) {
                            this.addInterpreter(theComponent);
                            // remove satisfied attribute
                            for (var interpreterOutAttributeIndex in outAttributes) {
                                var interpreterOutAttribute = outAttributes[interpreterOutAttributeIndex];
                                if (!this.getAttributeTypes().contains(interpreterOutAttribute)) this.addAttributeType(interpreterOutAttribute);
                                console.log("I can now satisfy attribute "+interpreterOutAttribute.getIdentifier()+" with the help of "+theComponent.getName()+"! Great!");
                                _unsatisfiedAttributes.removeItem(interpreterOutAttribute.getIdentifier());
                            }
                        } else {
                            console.log("Found interpreter but can't satisfy required attributes.");
                            for (var j in theComponent.getDescription().getInAttributeTypes().getItems()) {
                                console.log("Missing "+theComponent.getDescription().getInAttributeTypes().getItems()[j].getIdentifier()+".");
                            }
                        }
                    }
                } else {
                    console.log("Aggregator already has component "+theComponent.getName()+". Nothing to do here ;)");
                }
            }
        },

        'virtual public didFinishSetup': function() {
            unsatisfiedAttributes = this.getAttributeTypes().clone();

            // get all widgets that satisfy attribute types
            this.getComponentsForUnsatisfiedAttributeTypes(unsatisfiedAttributes, false, [Widget]);
            // get all interpreters that satisfy attribute types
            this.getComponentsForUnsatisfiedAttributeTypes(unsatisfiedAttributes, false, [Interpreter]);

			console.log(unsatisfiedAttributes);
			console.log(this.attributeTypes);
        },

        /**
         * Updates all the widgets referenced by the aggregator and calls the callback afterwards.
         *
         * @param {Callback} _callback The callback to query after all the widget where updated.
         */
        'virtual public queryReferencedWidgets': function(_callback) {
            var self = this;
            var completedQueriesCounter = 0;

            if (this.widgets.length > 0) {
                for (var index in this.widgets) {
                    var theWidgetId = this.widgets[index];
                    this.queryReferencedWidget(theWidgetId, function () {
                        completedQueriesCounter++;
                        if (completedQueriesCounter == self.widgets.length) {
                            if (_callback && typeof(_callback) == 'function') {
                                _callback(self.getAttributeValues());
                            }
                        }
                    });
                }
            } else {
                if (_callback && typeof(_callback) == 'function') {
                    _callback(self.getAttributeValues());
                }
            }
        },

        'public queryReferencedInterpreters': function(_callback) {
            var self = this;
            var completedQueriesCounter = 0;

            if (this.interpreters.length > 0) {
                for(var index in this.interpreters) {
                    var theInterpreterId = this.interpreters[index];

                    self.interpretData(theInterpreterId, function() {
                        self.getInterpretedData(theInterpreterId);

                        completedQueriesCounter++;
                        if (completedQueriesCounter == self.interpreters.length) {
                            if (_callback && typeof(_callback) == 'function') {
                                _callback(self.getAttributeValues());
                            }
                        }
                    });
                }
            } else {
                if (_callback && typeof(_callback) == 'function') {
                    _callback(self.getAttributeValues());
                }
            }
        },

        'public queryReferencedComponents': function(_callback) {
            var self = this;

            this.queryReferencedWidgets(function(_attributeValues) {
                self.queryReferencedInterpreters(function(_attributeValues) {
                    if (_callback && typeof(_callback) == 'function') {
                        _callback(_attributeValues);
                    }
                });
            });
        }
    });

	return Aggregator;
});
/**
 * This module represents the conditionMethod Equals. 
 * 
 * @module Equals
 * @fileOverview
 */
define('equals',['easejs', 'conditionMethod'],
 	function(easejs, ConditionMethod){
 	var Class = easejs.Class;
 	/**
	 * @class Equals
	 * @implements {ConditionMethod}
	 * @classdesc This class is the conditionMethod equals. 
	 * 			  It compares the values of two attributes.
	 * @requires easejs
	 * @requires conditionMethod
	 */
	var Equals = Class('Equals').implement( ConditionMethod ).extend(
	{
		/**
		 * Processes the equation.
		 * 
		 * @public
		 * @alias process
		 * @memberof Equals#
		 * @param {*} reference Is not used.
		 * @param {*} firstValue Value (from an attribute) that should be compared. 
		 * @param {*} secondValue Value (from an attribute) for comparison.
		 * @returns {boolean}
		 */
		'public process': function( reference, firstValue, secondValue){
			if(firstValue === secondValue){
				return true;
			}
			return false;
		},
		
		});

	return Equals;
});
/**
 * This module represents the conditionMethod Equals. 
 * 
 * @module Equals
 * @fileOverview
 */
define('unequals',['easejs', 'conditionMethod'],
 	function(easejs, ConditionMethod){
 	var Class = easejs.Class;
 	/**
	 * @class Equals
	 * @implements {ConditionMethod}
	 * @classdesc This class is the conditionMethod equals. 
	 * 			  It compares the values of two attributes.
	 * @requires easejs
	 * @requires conditionMethod
	 */
	var UnEquals = Class('UnEquals').implement( ConditionMethod ).extend(
	{
		/**
		 * Processes the equation.
		 * 
		 * @public
		 * @alias process
		 * @memberof Equals#
		 * @param {*} reference Is not used.
		 * @param {*} firstValue Value (from an attribute) that should be compared.
		 * @param {*} secondValue Value (from an attribute) for comparison.
		 * @returns {boolean}
		 */
		'public process': function( reference, firstValue, secondValue){
			if(firstValue !== secondValue){
				return true;
			}
			return false;
		},
		
		});

	return UnEquals;
});
/**
 * This module representing a Context Discoverer.
 * 
 * @module Discoverer
 * @fileOverview
 */
define('discoverer',[ 'easejs', 'attributeTypeList', 'widget', 'interpreter', 'aggregator' ], function(easejs,
		AttributeTypeList, Widget, Interpreter, Aggregator) {
	var Class = easejs.Class;
	
	var Discoverer = Class('Discoverer', {

		/**
		 * @alias widgets
		 * @private
		 * @type {Object}
		 * @memberof Discoverer#
		 * @desc List of available Widgets.
		 */
		'private widgets' : {},
		
		/**
		 * @alias aggregators
		 * @private
		 * @type {Object}
		 * @memberof Discoverer#
		 * @desc List of available Aggregators.
		 */
		'private aggregators' : {},
		
		/**
		 * @alias interpreter
		 * @private
		 * @type {Object}
		 * @memberof Discoverer#
		 * @desc List of available Interpreter.
		 */
		'private interpreter' : {},

		/**
		 * Constructor: All known components given in the associated functions will be registered as startup.
		 * 
		 * @class Discoverer
		 * @classdesc The Discoverer handles requests for components and attributes. 
		 * @requires easejs
		 * @requires AttributeTypeList
		 * @constructs Discoverer
		 */
		'public __construct' : function() {
			this.register();
		},

		/**
		 * Returns the type of this class, in this case
		 * "Discoverer".
		 * 
		 * @public
		 * @alias getType
		 * @memberof Discoverer#
		 * @returns {string}
		 */
		'public getType' : function() {
			return 'Discoverer';
		},

		/*
		 * single call for registering the different categories of components
		 */
		/**
		 * Single call for registration of the different categories of components.
		 * Calls: registerWidgets(), registerAggregators(), registerInterpreter()
		 * 
		 * @private
		 * @alias register
		 * @memberof Discoverer#
		 */
		'private register' : function() {
			this.registerWidgets();
			this.registerAggregators();
			this.registerInterpreter();
		},

		/**
		 * Registers all specified widgets.
		 * 
		 * @private
		 * @alias registerWidgets
		 * @memberof Discoverer#
		 */
		'private registerWidgets' : function() {
		},

		/**
		 * Registers all specified aggregators.
		 * 
		 * @private
		 * @alias registerAggregators
		 * @memberof Discoverer#
		 */
		'private registerAggregators' : function() {
		},

		/**
		 * Registers all specified interpreters.
		 * 
		 * @private
		 * @alias registerInterpreter
		 * @memberof Discoverer#
		 */
		'private registerInterpreter' : function() {
		},

		/**
		 * Registers the specified component.
		 * 
		 * @public
		 * @alias registerNewComponent
		 * @memberof Discoverer#
		 * @param {Widget|Aggregator|Interpreter} _component the component that should be registered 
		 */
		'public registerNewComponent' : function(_component) {
			var category = this.identificationHelper(_component);			
			if (category) {
				this.registryHelper(category, _component);
			}
		},

		/**
		 * Deletes a component from the Discoverer.
		 * 
		 * @public
		 * @alias unregisterComponent
		 * @memberof Discoverer#
		 * @param {string} _id id of the component that should be registered 
		 */
		'public unregisterComponent' : function(_id) {
			var component = this.getComponent(_id);
			var category = this.identificationHelper(component);
			if (category) {
				category.splice(_id, 1);
			}
		},

		/**
		 * Returns the widget for the specified id.
		 * 
		 * @public
		 * @alias getWidget
		 * @memberof Discoverer#
		 * @param {string} _id id of the component that should be returned
		 * @returns {?Widget}
		 */
		'public getWidget' : function(_id) {
			var widget =  this.widgets[_id];
			if(!widget){
				delete(this.widgets[_id]);
				return null;
			}
			return widget;
		},

		/**
		 * Returns the aggregator for the specified id.
		 * 
		 * @public
		 * @alias getAggregator
		 * @memberof Discoverer#
		 * @param {string} _id id of the component that should be returned
		 * @returns {Aggregator}
		 */
		'public getAggregator' : function(_id) {
			var aggregator = this.aggregators[_id];
			if(!aggregator ){
				delete(this.aggregators[_id]);
				return null;
			}
			return aggregator;
		},

		/**
		 * Returns the interpreter for the specified id.
		 * 
		 * @public
		 * @alias getInterpreter
		 * @memberof Discoverer#
		 * @param {string} _id id of the component that should be returned
		 * @returns {Interpreter}
		 */
		'public getInterpreter' : function(_id) {
			var interpret = this.interpreter[_id];
			if(!interpret){
                delete(this.interpreter[_id]);
				return null;
			}
			return interpret;
		},

		/**
		 * Returns the instance (widget, aggregator or interpreter) for the specified id.
		 * 
		 * @public
		 * @alias getComponent
		 * @memberof Discoverer#
		 * @param {string} _id id of the component that should be returned
		 * @returns {?(Widget|Aggregator|Interpreter)}
		 */
		'public getComponent' : function(_id) {
			var component = this.getWidget(_id);
			if (component) {
				return component;
			}
			var component = this.getAggregator(_id);
			if (component) {
				return component;
			}
			var component = this.getInterpreter(_id);
			if (component) {
				return component;
			}
			return null;
		},

		/**
		 * Returns the description of all registered widgets.
		 * 
		 * @public
		 * @alias getWidgetDescriptions
		 * @memberof Discoverer#
		 * @returns {Array}
		 */
		'private getWidgetDescriptions' : function() {
			var widgetDescription = [];
			var widgets = this.widgets;
			for (var i in widgets) {
				var singleWidget = widgets[i];
				widgetDescription.push(singleWidget.getDescription());
			}
			return widgetDescription;
		},

		/**
		 * Returns the description of all registered aggregators.
		 * 
		 * @public
		 * @alias getAggregatorDescriptions
		 * @memberof Discoverer#
		 * @returns {Array}
		 */
		'private getAggregatorDescriptions' : function() {
			var aggregatorDescription = [];
			var aggregators = this.aggregators;
			for (var i in aggregators) {
				var singleAggregator = aggregators[i];
				aggregatorDescription.push(singleAggregator.getDescription());
			}
			return aggregatorDescription;
		},

		/**
		 * Returns the description of all registered interpreter.
		 * 
		 * @public
		 * @alias getInterpreterDescriptions
		 * @memberof Discoverer#
		 * @returns {Array}
		 */
		'private getInterpreterDescriptions' : function() {
			var interpreterDescription = [];
			var interpreters = this.interpreter;
			for ( var i in interpreters) {
				var singleInterpreter = interpreters[i];
				interpreterDescription.push(singleInterpreter.getDescription());
			}
			return interpreterDescription;
		},

		/**
		 * Returns the description of all registered components (widget, aggregator and interpreter).
		 * 
		 * @public
		 * @alias getDescriptions
		 * @memberof Discoverer#
         * @param {Array} _componentTypes Component types to get descriptions for. Defaults to Widget, Interpreter and Aggregator.
		 * @returns {Array}
		 */
		'public getDescriptions' : function(_componentTypes) {
            if (typeof _componentTypes == "undefined") _componentTypes = [Widget, Interpreter, Aggregator];
			var response = [];
			if (jQuery.inArray(Widget, _componentTypes) != -1) response = response.concat(this.getWidgetDescriptions());
            if (jQuery.inArray(Aggregator, _componentTypes) != -1) response = response.concat(this.getAggregatorDescriptions());
            if (jQuery.inArray(Interpreter, _componentTypes) != -1) response = response.concat(this.getInterpreterDescriptions());
			return response;
		},

		/**
		 * Returns all components that have the specified attribute as
		 * outAttribute. It can be chosen between the verification of 
		 * all attributes or at least one attribute.
		 * 
		 * @public
		 * @alias getComponentsByAttributes
		 * @memberof Discoverer#
		 * @param {AttributeTypeList} _attributeTypeList list of searched attributes
		 * @param {boolean} _all choise of the verification mode
         * @param {Array} _componentTypes Components types to search for
		 * @returns {Array}
		 */
		'public getComponentsByAttributes' : function(_attributeTypeList, _all, _componentTypes) {
			var componentList = [];
			var list = {};
            if (typeof _componentTypes == "undefined") _componentTypes = [Widget, Interpreter, Aggregator];
            if (Class.isA(AttributeTypeList, _attributeTypeList)) {
				list = _attributeTypeList.getItems();
			} else {
                throw "Not an AttributeTypeList";
            }
			if (typeof list != "undefined") {
				var descriptions = this.getDescriptions(_componentTypes);
				for (var i in descriptions) {
					var description = descriptions[i];
						if(_all && this.containsAllAttributes(description, list)){
							componentList.push(this.getComponent(description.getId()));
						} else if(!_all && this.containsAtLeastOneAttribute(description, list)){
							componentList.push(this.getComponent(description.getId()));
					}
				}
			}
			return componentList;
		},

		/***********************************************************************
		 * Helper *
		 **********************************************************************/
		/**
		 * Helper: Verifies whether a component description contains all searched attributes.
		 * 
		 * @private
		 * @alias containsAllAttributes
		 * @memberof Discoverer#
		 * @param {(WidgetDescription|InterpreterDescription)} _description description of a component
		 * @param {Array} _list searched attributes
		 * @returns {boolean}
		 */
		'private containsAllAttributes' : function(_description,_list) {
			for ( var j in _list) {
				var attribute = _list[j];
				if (!_description.doesSatisfyAttributeType(attribute)) {
					return false;
				}
			}
			return true;
		},

		/**
		 * Helper: Verifies whether a component description contains at least on searched attributes.
		 * 
		 * @private
		 * @alias containsAtLeastOneAttribute
		 * @memberof Discoverer#
		 * @param {(WidgetDescription|InterpreterDescription)} _description description of a component
		 * @param {Array} _list searched attributes
		 * @returns {boolean}
		 */
		'private containsAtLeastOneAttribute' : function(_description,_list) {
			for ( var j in _list) {
				var attribute = _list[j];
				if (_description.doesSatisfyAttributeType(attribute)) {
					return true;
				}
			}
			return false;
		},
		
		/**
		 * Helper: Saves the given component in the category list.
		 * 
		 * @private
		 * @alias registryHelper
		 * @memberof Discoverer#
		 * @param {string} _category category of component to register
		 * @param {(Widget|Aggregator|Interpreter)} _component component that should be registered
		 */
		'private registryHelper' : function(_category, _component) {
			_category[_component.getId()] = _component;
		},

		/*
		 * identifies the category of an instance widgets, aggregators,
		 * interpreter are currently supported
		 */
		/**
		 * Helper: Identifies the category of an instance. Widgets, aggregators,
		 * interpreter are currently supported.
		 * 
		 * @private
		 * @alias identificationHelper
		 * @memberof Discoverer#
		 * @param {(Widget|Aggregator|Interpreter)} _component that should be identified
		 */
		'private identificationHelper' : function(_component) {
			if (_component.getType() == 'Widget') {
				return this.widgets;
			} else if (_component.getType() == 'Aggregator') {
				return this.aggregators;
			} else if (_component.getType() == 'Interpreter') {
				return this.interpreter;
			} else {
				return null;
			}
		}

	});

	return Discoverer;
});
	define('contactJS',['retrievalResult',
			'storage',
			'aggregator',
		    'attributeType',
		    'attributeValue',
		    'attributeTypeList',
		    'attributeValueList',
		    'parameter',
		    'parameterList',		
		    'condition',
		    'conditionList',
		    'conditionMethod',
		    'equals',
            'unequals',
		    'interpreterDescription',
		    'widgetDescription',	    
		    'discoverer',
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
			    AttributeType,
			    AttributeValue,
			    AttributeTypeList,
			    AttributeValueList,
			    Parameter,
			    ParameterList,		
			    Condition,
			    ConditionList,
			    ConditionMethod,
			    Equals,
                UnEquals,
			    InterpreterDescription,
			    WidgetDescription,	    
			    Discoverer,
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
	contactJS.VERSION = '1.1.0';
	// Methods
	contactJS.RetrievalResult = RetrievalResult;
	contactJS.Storage = Storage;
	contactJS.Aggregator = Aggregator;
	contactJS.AttributeType = AttributeType;
	contactJS.AttributeValue = AttributeValue;
	contactJS.AttributeTypeList = AttributeTypeList;
	contactJS.AttributeValueList = AttributeValueList;
	contactJS.Parameter = Parameter;
	contactJS.ParameterList = ParameterList;
	contactJS.Condition = Condition;
	contactJS.ConditionList = ConditionList;
	contactJS.ConditionMethod = ConditionMethod;
	contactJS.Equals = Equals;
    contactJS.UnEquals = UnEquals;
	contactJS.InterpreterDescription = InterpreterDescription;
	contactJS.WidgetDescription = WidgetDescription;
	contactJS.Discoverer = Discoverer;
	contactJS.Interpreter = Interpreter;
	contactJS.InterpreterResult = InterpreterResult;
	contactJS.Callback = Callback;
	contactJS.CallbackList = CallbackList;
	contactJS.Subscriber =Subscriber;
	contactJS.SubscriberList = SubscriberList;
	contactJS.Widget = Widget;
	contactJS.AbstractList = AbstractList;
	return contactJS;
});
 	define('easejs', function() {
    return easejs;
  });
  define('jquery', function() {
    return $;
  });
  define('MathUuid', function() {
    return MathUuid;
  });
 
  return require('contactJS');
}));