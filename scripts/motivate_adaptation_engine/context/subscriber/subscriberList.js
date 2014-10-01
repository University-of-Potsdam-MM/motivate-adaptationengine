define([ 'easejs',
         'MoCD_Subscriber'],
 	function(easejs, Subscriber){

 	/*
 	* AttributeValue, extends Attribute
 	* contains an attribute with his associated value
 	*/

 	var Class = easejs.Class;
	var SubscriberList = Class('SubscriberList',{

		'protected count' : 0,
		'protected items' : [],
		
		

		'virtual public withItems': function(_subscriberList){
			var list = new Array();
			if(_subscriberList instanceof Array){
				list = _subscriberList;
			} else if (Class.isA( SubscriberList, _subscriberList)) {
				list = _subscriberList.getItems();
			}
			for(var i in list){
				var subscriber = list[i];
				if(Class.isA( Subscriber, subscriber )){
					this.items[subscriber.getSubscriptionId()] = subscriber;
					this.count++;
				}
			}
			return this;
		},

		'public containsKey' : function(_key){
			if(!(typeof _key === 'undefined') && !(typeof this.items[_key] === 'undefined')){
				return true;
			}
			return false;
		},
		

		'virtual public put' : function(_subscriber){
			if(Class.isA(Subscriber, _subscriber)){
				if(!(this.containsKey(_subscriber.getSubscriptionId()))){
					this.count++;
				}
				this.items[_subscriber.getSubscriptionId()] = _subscriber;
			}
		},

		'virtual public putAll' : function(_subscriberList){
			var list = new Array();
			if(_subscriberList instanceof Array){
				list = _subscriberList;
			} else if (Class.isA(SubscriberList, _subscriberList)) {
				list = _subscriberList.getItems();
			}
			for(var i in list){
				var subscriber = list[i];
				if(Class.isA(Subscriber, subscriber)){
					this.items[subscriber.getSubscriptionId()] = subscriber;
					if(!(this.containsKey(subscriber.getSubscriptionId()))){
						this.count++;
					}
				}
			}
		},

		'public getItem' : function(_key){
			return this.items[_key];
		},

		'virtual public contains' : function(_item){
			if(Class.isA(Subscriber,_item)){
				var tmp = this.getItem(_item.getSubscriptionId());
				if(!(typeof tmp === 'undefined') && tmp.equals(_item)){
					return true;
				}
			} 
			return false;
		},

		'public removeItem' : function(_key){
			if(this.containsKey(_key)){
				this.items.splice(_key, 1);
				this.count--;
			};
		},

		'public getKeys' : function(){
			var listKeys = new Array();
			for(var key in this.items){
				listKeys.push(key);
			}
			return listKeys;
		},

		'public getItems' : function(){
			var listValues = new Array();
			for(var key in this.items){
				listValues.push(this.items[key]);
			}
			return listValues;
		},

		'virtual public size' : function(){
			return this.count;
		},

		'public isEmpty' : function(){
			if(this.count == 0){
				return true;
			} else{
				return false;
			}
		},

		'public clear' : function(){
			this.items = [];
			this.count = 0;
		}

	});

	return SubscriberList;
});