define(['easejs', 
        'MoCD_Callback'],
 	function(easejs, Callback){

 	/*
 	* AttributeValue, extends Attribute
 	* contains an attribute with his associated value
 	*/

 	var Class = easejs.Class;
	var CallbackList = Class('CallbackList',{

		'private count' : 0,
		'private items' : [],
		
		

		'public withItems': function(_callbackList){
			var list = new Array();
			if(_callbackList instanceof Array){
				list = _callbackList;
			} else if (Class.isA(CallbackList, _callbackList)) {
				list = _callbackList.getItems();
			}
			for(var i in list){
				var callback = list[i];
				if(Class.isA( Callback, callback )){
					this.items[callback.getName()] = callback;
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
		

		'public put' : function(_callback){
			if(Class.isA(Callback, _callback)){
				if(!(this.containsKey(_callback.getName()))){
					this.count++;
				}
				this.items[_callback.getName()] = _callback;
			}
		},

		'public putAll' : function(_callbackList){
			var list = new Array();
			if(_callbackList instanceof Array){
				list = _callbackList;
			} else if (Class.isA(CallbackList, _callbackList)) {
				list = _callbackList.getItems();
			}
			for(var i in list){
				var callback = list[i];
				if(Class.isA(Callback, callback)){
					this.items[callback.getName()] = callback;
					if(!(this.containsKey(callback.getName()))){
						this.count++;
					}
				}
			}
		},

		'public getItem' : function(_key){
			return this.items[_key];
		},

		'public contains' : function(_item){
			if(Class.isA(Callback,_item)){
				var tmp = this.getItem(_item.getName());
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

	return CallbackList;
});