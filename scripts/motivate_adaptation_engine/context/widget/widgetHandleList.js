define(['easejs', 
        'widget/widgetHandle'],
 	function(easejs, WidgetHandle){

 	/*
 	* AttributeValue, extends Attribute
 	* contains an attribute with his associated value
 	*/

 	var Class = easejs.Class;
	var WidgetHandleList = Class('WidgetHandleList',{

		'private count' : 0,
		'private items' : [],
		
		

		'virtual public withItems': function(_widgetHandleList){
			var list = new Array();
			if(_widgetHandleList instanceof Array){
				list = _widgetHandleList;
			} else if (Class.isA(WidgetHandleList, _widgetHandleList)) {
				list = _widgetHandleList.getItems();
			}
			for(var i in list){
				var widgetHandle = list[i];
				if(Class.isA(WidgetHandle, widgetHandle)){
					this.items[widgetHandle.getName()] = widgetHandle;
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
		

		'virtual public put' : function(_widgetHandle){
			if(Class.isA(WidgetHandle, _widgetHandle)){
				if(!(this.containsKey(_widgetHandle.getName()))){
					this.count++;
				}
				this.items[_widgetHandle.getName()] = _widgetHandle;
			}
		},

		'virtual public putAll' : function(_widgetHandleList){
			var list = new Array();
			if(_widgetHandleList instanceof Array){
				list = _widgetHandleList;
			} else if (Class.isA(WidgetHandleList, _widgetHandleList)) {
				list = _widgetHandleList.getItems();
			}
			for(var i in list){
				var widgetHandle = list[i];
				if(Class.isA(WidgetHandle, widgetHandle)){
					this.items[widgetHandle.getName()] = widgetHandle;
					if(!(this.containsKey(widgetHandle.getName()))){
						this.count++;
					}
				}
			}
		},

		'public getItem' : function(_key){
			return this.items[_key];
		},

		'virtual public contains' : function(_item){
			if(Class.isA(WidgetHandle,_item)){
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

	return WidgetHandleList;
});