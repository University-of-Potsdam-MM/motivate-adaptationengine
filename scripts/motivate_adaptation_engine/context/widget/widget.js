define(['easejs',
        'MoCD_Callback',
        'MoCD_CallbackList',
        'MoCD_AttributeType',
        'MoCD_AttributeValue',
        'MoCD_AttributeTypeList',
        'MoCD_AttributeValueList',
        'MoCD_Subscriber',
        'MoCD_SubscriberList'],
 	function(easejs, Callback, CallbackList, 
 			AttributeType, AttributeValue, AttributeTypeList,
 			AttributeValueList, Subscriber, SubscriberList){

 	/*
 	* Callback: name and associated Attributes
 	*/
 	var AbstractClass = easejs.AbstractClass;
 	var Class = easejs.Class;
	var Widget = AbstractClass('Widget', 
	{
		// name of the widget
		//must be changed
		'public name' : 'Widget', 
		'public id' : 0, 
		
		'public status' : 'available',
		// list of attributesTypes 
		'protected attributeTypes' : [],
		// list of constantAttributeTypes 
		'protected constantAttributeTypes' : [],
		// list of attributes 
		'protected attributes' : [],
		// list of constantAttributes 
		'protected constantAttributes' : [],
		//list of callbacks
		'protected callbacks' : [],
		//list of subscriber
		'protected subscribers' : [],
		//list of Services
		'protected services' : [],

		'protected discoverer' : '',
		'virtual public __construct': function(_discoverer)
        {
			this.attributeTypes = new AttributeTypeList();
			this.constantAttributeTypes = new AttributeTypeList();
			this.attributes = new AttributeValueList();
			this.constantAttributes = new AttributeValueList();
			this.subscribers = new SubscriberList();
			this.callbacks = new CallbackList();
			this.discoverer = _discoverer;
            this.init();
        },

		//returns name and id of the widget
		'public getName' : function(){
			return this.name;
		},
		
		'public getId' : function(){
			return this.id;
		},
		
		'virtual public getType' : function(){
		    return 'Widget';
		 },
		
		'public getStatus' : function(){
			return this.status;
		},


		//Returns information about the collected data. Only name and type, not the values.
		'public getWidgetAttributeTypes' : function(){
			return this.attributeTypes;
		},


		'public getWidgetConstantAttributeTypes' : function(){
			return this.constantAttributeTypes;
		},

		//queries for attributes and constantAttribute, like getter
		'public queryAttributes' : function(){
			return this.attributes;
		},

		'public queryConstantAttributes' : function(){
			return this.constantAttributes;
		},

		//queries for callbacks and provided services
		'public queryCallbacks' : function(){
			return this.callbacks;
		},

		'public queryServices' : function(){
			return this.services;
		},
		
		'public getSubscriber' : function(){
			return this.subscribers;
		},
		
		/*
		*setter and adding methods for all variables
		*/
		'protected setName' : function(_name){
			if(typeof _name === 'string'){
				this.name = _name;
			}
		},

		'protected setId' : function(_id){
			if(_id === parseInt(_id)){
				this.id = _id;
			};
		},
		
		'protected setStatus' : function(_status){
			if(typeof _status === 'string'){
				this.status = _status;
			};
		},

		'protected setAttributes' : function(_attributes){
			var list = new Array();
			if(_attributes instanceof Array){
				list = _attributes;
			} else if (Class.isA( AttributeValueList, _attributes)) {
				list = _attributes.getItems();
			}
			for(var i in list){
				var attribute = list[i];
				if(Class.isA( AttributeValue, attribute )){
					//set timestamp
					attribute.setTimestamp(this.getCurrentTime());
					this.attributes.put(attribute);
					//set type
					var type = new AttributeType().withName(attribute.getName()).withType(attribute.getType());
					this.attributeTypes.put(type);
				};
			};
		},


		'protected addAttribute' : function(_attribute){
			if(Class.isA( AttributeValue, _attribute )){
				if(!this.attributes.contains(_attribute)){
					//if attribute is not in the List, push also the type to typesList
					var type = new AttributeType().withName(_attribute.getName()).withType(_attribute.getType());
					this.attributeTypes.put(type);
					
				}
				//add the new value
				_attribute.setTimestamp(this.getCurrentTime());
				this.attributes.put(_attribute);
			};
		},
		
		'protected setConstantAttributes' : function(_constantAttributes){
			var list = new Array();
			if(_constantAttributes instanceof Array){
				list = _constantAttributes;
			} else if (Class.isA( AttributeValueList, _constantAttributes)) {
				list = _constantAttributes.getItems();
			}
			for(var i in list){
				var constantAttribute = list[i];
				if(Class.isA( AttributeValue, constantAttribute )){
					//set timestamp
					constantAttribute.setTimestamp(this.getCurrentTime());
					this.constantAttributes.put(constantAttribute);
						//set type
					var type = new AttributeType().withName(constantAttribute.getName()).withType(constantAttribute.getType());
					this.constantAttributeTypes.put(type);
				};
			};
		},

		'protected addConstantAttribute' : function(_constantAttribute){
			if(Class.isA( AttributeValue, _constantAttribute )){
				if(!this.constantAttributes.contains(_constantAttribute)){
					//if attribute is not in the List, push also the type to typesList
					var type = new AttributeType().withName(_constantAttribute.getName()).withType(_constantAttribute.getType());
					this.constantAttributeTypes.put(type);
				}
				//add the new value
				_attribute.setTimestamp(this.getCurrentTime());
				this.constantAttributes.put(_constantAttribute);
			};
				
		},

		'protected setCallbacks' : function(_callbacks){		
			var list = new Array();
			if(_callbacks instanceof Array){
				list = _subscriber;
			} else if (Class.isA(CallbackList, _callbacks)) {
				list = _callbacks.getItems();
			}
			for(var i in list){
				var callback = list[i];
				if(Class.isA( Callback, callback )){
					this.callbacks.put(callback);
				};
			};
		},
		
		'protected addCallback' : function(_callback){
			if(Class.isA( Callback, _callback )){
				this.callbacks.put(_callback);
			};			
		},


		'protected setServices' : function(_services){
			this.services = _services;
		},
		
		'protected setSubscriber' : function(_subscriber){
			var list = new Array();
			if(_subscriber instanceof Array){
				list = _subscriber;
			} else if (Class.isA( SubscriberList, _subscriber)) {
				list = _subscriber.getItems();
			}
			for(var i in list){
				var singleSubscriber = list[i];
				if(Class.isA( Subscriber, singleSubscriber )){
					this.subscribers.put(singleSubscriber);
				};
			};
		},
		
		'public addSubscriber' : function(_subscriber){
			if (Class.isA( Subscriber, _subscriber)) {
				this.subscribers.put(_subscriber);
			};
		},
		
		'public removeSubscriber' : function(_subscriber){
			if (Class.isA( Subscriber, _subscriber)) {
				this.subscribers.removeItem(_subscriber.getSubscriptionId());
			};
		},

		/*
		*returns the current time
		*/
		'private getCurrentTime' : function() {
    		return new Date();
  		},

  		/*
  		*Checks, wether the specified attribute is an element of the collected date from this widgit.
  		*If the attributeTypeList contains one with same name and same type, true is returned.
  		*/
  		'protected isAttribute' : function(_attribute){
			var type = new AttributeType().withName(_attribute.getName()).withType(_attribute.getType());
			if(this.attributeTypes.contains(type)){
				return true;
			} else {
				return false;
			};
		},


		/*
		*initializes the attributeList, constantAttributeList, callbackList and serviceList
		*must be implemented
		*/
		'abstract protected initAttributes' : [],
		'abstract protected initConstantAttributes' : [],
		'abstract protected initCallbacks' : [],
		'abstract protected initServices' : [],

		/*
		*initiliazes the widget with relevant data, like Attributes and so on 
		*/
		'protected init' : function(){
			this.initAttributes();
			this.initConstantAttributes();
			this.initCallbacks();
			this.initServices();
		},


		/*
		*Empty method, which should be overridden by classes, who extends widget.
		* notifies all subscriber
		*/
		'virtual public notify' : function() {
		},

		/*
		* Interface to sensors or other context sources
		* must be implemented, when classes, who extends widget, should be connected to sensors
		*/
		'virtual protected queryGenerator' : function(){
			
		},

		/*
		* collects new context information
		* it must be overridden, if:
		* if there are delays in queryGenerator or 
		* if queryGenerator does not return any response
		* 
		*/
		'virtual public updateWigetInformation' : function(){
			var attributes = this.queryGenerator();
			if (!(typeof attributes === 'undefined')){
				this.setAttributes(attributes);
			};
		},

		/*
		* put context data to widget, expects an array
		*/
		'virtual public putData' : function(_data){
			var list = new Array();
			if(_data instanceof Array){
				list = _data;
			} else if (Class.isA( AttributeValueList, _data)) {
				list = _data.getItems();
			}
			for(var i in list){
				var x = list[i];
				if(Class.isA( AttributeValue, x ) && this.isAttribute(x)){
					this.addAttribute(x);
				};
			};
			
		},

		/*
		*returns the collect context information, both attributes and constantAttributes
		*/
		'public queryWidget' : function(){
			var response = new AttributeValueList();
			response.putAll(this.queryAttributes());
			response.putAll(this.queryConstantAttributes());
			return response;
		},

		/*
		* updates the context information and returns the new collected data
		* if there are delays in queryGenerator, it must be overridden to intercept this
		*/
		'virtual public updateAndQueryWidget' : function(){
			this.queryGenerator();
			var response = new AttributeValueList();
			response.putAll(this.queryAttributes());
			response.putAll(this.queryConstantAttributes());
			return response;
		},
		
		'public sendToSubscriber' : function(_callbackName){
			var callback = this.callbacks.getItem(_callbackName);
			if(callback){
				var subscriberList = this.subscribers.getItems();
				for(var i in subscriberList){
					var subscriber = subscriberList[i];
					if(subscriber.getSubscriptionCallbacks().containsKey(callback.getName())){
						var subscriberInstance = this.discoverer.getComponent(subscriber.getSubscriberId());
						var callSubset = callback.getAttributeTypes();
						var subscriberSubset = subscriber.getAttributesSubset();
						var data = this.attributes.getSubset(callSubset);
						if(subscriberSubset.size() > 0 ){
							data = data.getSubset(subscriberSubset);
						}						
						if (data){
							subscriberInstance.putData(data);
						};
					};
				};
			};
		},

		/*
		* Widget description: At the moment only name and id will be returned. 
		* For other information, the method must be overridden.
		*/
		'virtual public getWidgetDescription' : function(){
			var response = "name="+ this.name + ", id=" + this.id;
			return response;
		},
		
		'virtual protected intervalRunning' : function(_interval){
			if(_interval === parseInt(_interval)){
				setInterval(function () {this.queryGenerator();}, _interval);
			}
		},
		

		
	});

	return Widget;
});