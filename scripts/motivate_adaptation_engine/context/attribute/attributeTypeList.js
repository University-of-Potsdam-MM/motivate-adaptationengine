define(['easejs', 
        'MoCD_AttributeType'],
 	function(easejs, AttributeType){

 	/*
 	* AttributeValue, extends Attribute
 	* contains an attribute with his associated value
 	*/

 	var Class = easejs.Class;
	var AttributeTypeList = Class('AttributeTypeList',{

		'protected count' : 0,
		'protected items' : [],
		
		

		'virtual public withItems': function(_attributeTypeList){
			var list = new Array();
			if(_attributeTypeList instanceof Array){
				list = _attributeTypeList;
			} else if (Class.isA( AttributeTypeList, _attributeTypeList)) {
				list = _attributeTypeList.getItems();
			}
			for(var  i in list){
				var attributeType = list[i];
				if(Class.isA( AttributeType, attributeType )){
					this.items[attributeType.getName()] = attributeType;
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
		

		'virtual public put' : function(_attributeType){
			if(Class.isA(AttributeType, _attributeType)){
				if(!(this.containsKey(_attributeType.getName()))){
					this.count++;
				}
				this.items[_attributeType.getName()] = _attributeType;
			}
		},

		'virtual public putAll' : function(_attributeTypeList){
			var list = new Array();
			if(_attributeTypeList instanceof Array){
				list = _attributeTypeList;
			} else if (Class.isA( AttributeTypeList, _attributeTypeList)) {
				list = _attributeTypeList.getItems();
			}
			for(var i in list){
				var attributeType = list[i];
				if(Class.isA(AttributeType, attributeType)){
					this.items[attributeType.getName()] = attributeType;
					if(!(this.containsKey(attributeType.getName()))){
						this.count++;
					}
				}
			}
		},

		'public getItem' : function(_key){
			return this.items[_key];
		},

		'virtual public contains' : function(_item){
			if(Class.isA(AttributeType,_item)){
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
			this.items = new Array();
			this.count = 0;
		}

	});

	return AttributeTypeList;
});