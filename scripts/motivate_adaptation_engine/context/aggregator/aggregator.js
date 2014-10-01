define(['easejs',
        'widget/widget', 
        'widget/widgetHandle', 
        'widget/widgetHandleList', 
        'attribute/attributeType',
        'attribute/attributeValue',
        'attribute/attributeValueList',
        'subscriber/subscriber', 
        'subscriber/subscriberList',
        'subscriber/CallbackList'],
 	function( easejs, Widget, 
 			WidgetHandle,WidgetHandleList, AttributeType,
 			AttributeValue, AttributeValueList,
 			Subscriber, SubscriberList,
 			CallbackList){

 	/*
 	* Aggregator
 	*/
 	var Class = easejs.Class;
 	var AbstractClass = easejs.AbstractClass;
	var Aggregator =  AbstractClass('Aggregator').
				extend(Widget, 
			
	{
		/*
		 * name and id of the widget
		 * must be changed
		 */
		'public name' : 'Aggregator', 
		'public id' : 2, 
		
		/*
		 * list of subscribed widgets 
		 */
		'protected widgets' : [],		
		
		/*
		 * list of all collected attributes, which are up to date
		 */
		'protected attributesCache' : [],
		
		/*
		 * constructor
		 */
		'override public __construct': function(_discoverer)
        {
			this.widgets = new WidgetHandleList();	
			this.attributesCache = new AttributeValueList();
			this.__super(_discoverer);			
			this.aggregatorSetup();
        },
        
        /*
         * 
         */
		'override public getType' : function(){
		    return 'Aggregator';
		 },
		 
		/*
		 * adds new attributeTypes, useful when a new widget is subscribed 
		 */
		'protected addAttributeType' : function(_attributeType){
			if(Class.isA( AttributeType, _attributeType )){			
				this.attributeTypes.put(_attributeType);
			};
		},
		
		'protected setWidgets' : function(_widgetList){
			this.widgets = new WidgetHandleList().withItems(_widgetList);		
		},
		
		'protected addWidget' : function(_widget){
			this.widgets.put(_widget);
		},
		
		'protected removeWidget' : function(_key){
			this.widgets.removeItem(_key);
		},
		
		/*
         * retrieves all attributes of the specified widgets
         * if the defined name in WidgetHandle does not match the name of the 
         * returned instance, widgetHandel will be removed from list
         */
		'protected initAttributes' : function(){
			if(this.widgets.size() > 0){
				var widgetList = this.widgets.getItems();
				for(var i in widgetList){
					var widgetHandle = widgetList[i];
					var widgetInstance = this.discoverer.getComponent(widgetHandle.getId());
					if(widgetInstance && widgetInstance.getName() === widgetHandle.getName()){
						this.setAttributes(widgetInstance.queryAttributes());
					} else {
						this.removeWidget(widgetHandle.getName());
					}
				};
			};
		},
		
		/*
         * retrieves all constantAttributes of the specified widgets
         * if the defined name in WidgetHandle does not match the name of the 
         * returned instance, widgetHandel will be removed from list
         */
		'protected initConstantAttributes' : function(){
			if(this.widgets.size() > 0){
				var widgetList = this.widgets.getItems();
				for(var i in widgetList){
					var widgetHandle = widgetList[i];					
					var widgetInstance = this.discoverer.getComponent(widgetHandle.getid());
					if(widgetInstance && widgetInstance.getName() === widgetHandle.getName()){
						this.setConstantAttributes(widgetInstance.queryConstantAttributes());
					} else {
						this.removeWidget(widgetHandle.getName());
					};
				};
			};

		},
		
		/*
         * retrieves all actual callbacks of the specified widgets
         */
		'protected initCallbacks' : function(){
			if(this.widgets.size() > 0){
				var widgetList = this.widgets.getItems();
				for(var i in widgetList){
					var widgetHandle = widgetList[i];
					this.initWidgetSubscription(widgetHandle);
				};
			};
		},
		
		'protected initServices' : function(){

		},
		
		/*
         * initMethod for aggreagtors
         * called by constructor
         */
		'protected aggregatorSetup' : function(){
			this.initStorage();
		},
		
		/*
		*specified attributeList, constantAttributeList, callbackList 
		*and serviceList, thats are only specific to the aggregator
		*must be implemented
		*/
		'abstract protected setAggregatorAttributeValues' : [],
		'abstract protected setAggregatorConstantAttributeValues' : [],
		'abstract protected setAggregatorCallbacks' : [],
		'abstract protected setAggregatorServices' : [],

		
		/*
         * returns the current attributes, which are saved in the cache
         */
		'public queryAggregator' : function(){
			var response = new AttributeValueList();
			response.putAll(this.attributesCache);
			return response;
		},
		
		/*
         * subscribes to the given widget for the specified callbacks
         */
		'protected subscribeTo' : function(_widget, _callbacks){
			if(Class.isA(Widget, _widget)){
				var num = _widget.getSubscriber().size();
				var subscriber = new Subscriber().withSubscriberId(this.id).
									withSubscriptionId(num + 1).
									withSubscriberName(this.name).
									withSubscriptionCallbacks(_callbacks);	
				console.log(this.name + ' subscribeTo: ' + _widget.getName());
				_widget.addSubscriber(subscriber);
			};
		},
		
		/*
         * subscribes to the widgets are defined in the widgetHandleList
         * used in the initCallback method
         */
		'protected initWidgetSubscription' : function(_widgetHandle){
			var calls = null;
			if(Class.isA(WidgetHandle, _widgetHandle)){
				var widget = this.discoverer.getComponent(_widgetHandle.getId());
				if(widget && widget.getName() === _widgetHandle.getName()){
					//subscribe to all callbacks
					calls = widget.queryCallbacks();
					this.subscribeTo(_widgetHandle, calls);
				} else {
					this.removeWidget(_widgetHandle.getName());
				};
				
			};
			
			return calls;
		},
		
		/*
         * add a new subscription to this aggregator
         * if the defined name in WidgetHandle does not match the name of the 
         * returned instance, widgetHandel will be removed from list
         */
		'public addWidgetSubscription' : function(_widgetHandle, _callbackList){
			if(Class.isA(WidgetHandle, _widgetHandle)){
				var widget = this.discoverer.getComponent(_widgetHandle.getId());				
				if(widget && widget.getName() === _widgetHandle.getName()){
					this.subscribeTo(widget, _callbackList);
							
					this.callbacks.putAll(_callbackList);			
					var callsList = _callbackList.getItems();		
					for(var x in callsList){
						var singleCallback = callsList[x];			
						var typeList = singleCallback.getAttributeTypes().getItems();
						for(var y in typeList){
							var singleType = typeList[y];
							this.addAttributeType(singleType);
						};				
					};
					
					this.addWidget(_widgetHandle);
				};
				
			};
			
			
		},
		
		/*
         * removes subscribed widgets and deletes the entry for subscribers in the associated widget
         */
		'public unsubscribeFrom' : function(_widgetHandle){
			if(Class.isA(WidgetHandle, _widgetHandle)){
				var widget = this.discoverer.getComponent(_widgetHandle.getId());
				if(widget && widget.getName() === _widgetHandle.getName()){
					console.log('aggregator unsubscribeFrom: ' + widget.getName());
					widget.removeSubscriber(subscriber);
				};				
			};	
			
			//remove widgetHandle and attributes??
		},
		
		/*
		* put context data to widget, expects an array
		*/
		'override public putData' : function(_data){
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
		
		'private initStorage' : function(){
			var db = window.openDatabase(this.name, "1.0", "DB" + this.name, 1000000);
		},
		
		'protected store' : function(){
			//TODO: noch keine Datenbank vorhanden
		},
		
		'protected retrieveAggregator' : function(){
			//TODO: noch keine Datenbank vorhanden
		},
		
		/*
		* Widget description: At the moment only name and id will be returned. 
		* For other information, the method must be overridden.
		*/
		'virtual public getAggregatorDescription' : function(){
			var response = "name="+ this.name + ", id=" + this.id;
			return response;
		},
		
	});

	return Aggregator;
});