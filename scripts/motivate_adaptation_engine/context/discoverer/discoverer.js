define(['easejs',
        'MoCD_GeoLocationWidget'],
 	function(easejs, GeoLocationWidget){

 	/*
 	* Discoverer
 	*/
 	var Class = easejs.Class;
	var Discoverer =  Class('Discoverer', 		
	{
		/*
		 * description of available widgets
		 */
		'private widgets':[],
		/*
		 * description of available aggregtors
		 */
		'private aggregators':[],
		/*
		 * description of available interpreter
		 */
		'private interpreter':[],
		
		/*
		 * constructor
		 * all known components will be registered at startup
		 */
		'public __construct' : function(){
			this.register();
		},
		
		'public getType' : function(){
			return 'Discoverer';
		},
		
		/*
		 * single call for registering the different categories of components
		 */
		'private register' : function(){
			this.registerWidgets();
			this.registerAggregators();
			this.registerInterpreter();
		},
		
		/*
		 * registers widgets
		 */
		'private registerWidgets' : function(){
			var geoLocationWidget = new GeoLocationWidget(this);
			//register in Widgets
			this.registryHelper(this.widgets, geoLocationWidget);
		},
		
		/*
		 * registers aggregators
		 */
		'private registerAggregators' : function(){		
		},
		
		/*
		 * registers interpreter
		 */
		'private registerInterpreter' : function(){		
		},
		
		
		/*
		 * registers a new component
		 */
		'public registerNewComponent' : function(_component){
			var category = this.identificationHelper(_component);
			if(category){
				this.registryHelper(category, _component);
			};
		},
		
		/*
		 * deletes a component from the discoverer
		 */
		'public unregisterComponent' : function(_id){
			var component = this.getComponent(_id);	
			var category = this.identificationHelper(component);
			if(category){
				category.splice(_id, 1);
			};
		},
		
		/*
		 * returns all registered widgets
		 */
		'public getWidget' : function(_id){
			return this.widgets[_id];
		},
		
		/*
		 * returns registered aggregators
		 */
		'public getAggregator' : function(_id){
			return this.aggregators[_id];
		},
		
		/*
		 * returns registered interpreter
		 */
		'public getInterpreter' : function(_id){
			return this.interpreter[_id];
		},
		
		/*
		 * returns the instance for the given id
		 */
		'public getComponent' : function(_id){
			var component = this.getWidget(_id);
			if(component){
				return component;
			};
			var component = this.getAggregator(_id);
			if(component){
				return component;
			}; 
			var component = this.getInterpreter(_id);
			if(component){
				return component;
			};
			return null;
		},
		
		/*
		 * returns the description of all registered widgets
		 */
		'public getWidgetDescriptions' : function(){
			var widgetDescription = new Array();
			var widgets = this.widgets;
			for (var i in widgets){
				var singleWidget = widgets[i];
				widgetDescription.push(singleWidget.getWidgetDescription());
			}
			return widgetDescription;
		},
		
		/*
		 * returns the description of all registered aggregators
		 */
		'public getAggregatorDescriptions' : function(){
			var aggregatorDescription = new Array();
			var aggregators = this.aggregators;
			for (var i in aggregators){
				var singleAggregator = aggregators[i];
				aggregatorDescription.push(singleAggregator.getAggregatorDescription());
			}
			return aggregatorDescription;
		},
		
		/*
		 * returns the description of all registered interpreter
		 */
		'public getInterpreterDescriptions' : function(){
			var interpreterDescription = new Array();
			var interpreters = this.interpreters;
			for (var i in interpreters){
				var singleInterpreter = interpreters[i];
				interpreterDescription.push(singleInterpreter.getInterpreterDescription());
			}
			return interpreterDescription;
		},
		
		/*
		 * returns the description of all registered components
		 */
		'public getDescriptions' : function(){
			var response = [];
			response.concat(this.getWidgetDescriptions());
			response.concat(this.getAggregatorDescriptions());
			response.concat(this.getInterpreterDescriptions());
			return response;
		},
		
		/************
		 * 	Helper  *
		 ************/
		
		/*
		 * saves the given component in the category list
		 */
		'private registryHelper' : function(_category, _component){
			_category[_component.getId()] = _component;
		},
		
		/*
		 * identifies the category of an instance
		 * widgets, aggregators, interpreter are currently supported 
		 */
		'private identificationHelper' : function(_component){
			if(_component.getType() == 'Widget'){
				return this.widgets;
			} else if (_component.getType() == 'Aggregator'){
				return this.aggregators;
			} else if (_component.getType() == 'Interpreter'){
				return this.interpreter;
			} else {
				return null;
			};
		},
				
	});

	return Discoverer;
});