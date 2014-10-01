define(['easejs',
        'MoCD_AttributeTypeList',
        'MoCD_CallbackList'],
 	function(easejs, AttributeTypeList, CallbackList){

 	/*
 	* Callback: name and associated Attributes
 	*/
 	var Class = easejs.Class;
	var Subscriber = Class('Subscriber',
	{

		'private subscriptionId' : '',
		'private subscriberName' : '',
		'private subscriberId' : '',
		'private subscriptionCallbacks' : [],
		'private conditions' : [],
		/*
		 * specifies the attributes, a subscriber is interested in
		 * i.e: the subscriber only wants a subset from the available context data  
		 * if no attributes are specified, all available attributes will returned
		 */
		'private attributesSubset' : [],
		
		'virtual public __construct': function()
        {
			this.subscriptionCallbacks = new CallbackList();
			this.attributesSubset = new AttributeTypeList();
        },
		
		'public withSubscriptionId' : function(_setSubscriptionId){
			this.setSubscriptionId(_setSubscriptionId);
			return this;
		},
		
		'public withSubscriberName' : function(_subscriberName){
			this.setSubscriberName(_subscriberName);
			return this;
		},
		
		'public withSubscriberId' : function(_subscriberId){
			this.setSubscriberId(_subscriberId);
			return this;
		},
		
		'public withSubscriptionCallbacks' : function(_subscriptionCallbacks){
			this.setSubscriptionCallbacks(_subscriptionCallbacks);
			return this;
		},
		
		'public withAttributesSubset' : function(_attributesSubset){
			this.setAttributesSubset(_attributesSubset);
			return this;
		},

		'public getSubscriptionId' : function(){
			return this.subscriptionId;
		},

		'public setSubscriptionId' : function(_subscriptionId){
			if(_subscriptionId === parseInt(_subscriptionId)){
				this.subscriptionId = _subscriptionId;
			};
		},
		
		'public getSubscriberName' : function(){
			return this.subscriberName;
		},

		'public setSubscriberName' : function(_subscriberName){
			if(typeof _subscriberName === 'string'){
				this.subscriberName = _subscriberName;
			};
			
		},
		
		'public getSubscriberId' : function(){
			return this.subscriberId;
		},

		'public setSubscriberId' : function(_subscriberId){
			if(_subscriberId === parseInt(_subscriberId)){
				this.subscriberId = _subscriberId;
			};
		},
		
		'public getSubscriptionCallbacks' : function(){
			return this.subscriptionCallbacks;
		},

		'public setSubscriptionCallbacks' : function(_subscriptionCallbacks){
			if(Class.isA(CallbackList, _subscriptionCallbacks)){
				this.subscriptionCallbacks = _subscriptionCallbacks;
			};
		},
		
		'public getAttributesSubset' : function(){
			return this.attributesSubset;
		},

		'public setAttributesSubset' : function(_attributesSubset){
			if(Class.isA(AttributeTypeList, _attributesSubset)){
				this.attributesSubset = _attributesSubset;
			};
		},
				
		});

	return Subscriber;
});