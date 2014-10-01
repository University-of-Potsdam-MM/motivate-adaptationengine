define(['easejs', 
        'MoCD_AttributeValue',
        'MoCD_AttributeType',
        'MoCD_AttributeTypeList'],
 	function(easejs, AttributeValue, AttributeType, AttributeTypeList){

 	/*
 	* AttributeValue, extends Attribute
 	* contains an attribute with his associated value
 	*/

 	var Class = easejs.Class;
	var AttributeValueList = Class('AttributeValueList').
		extend( AttributeTypeList,
			{
			
			'protected count' : 0,
			'protected items' : [],


		'override public withItems': function(_attributeValueList){
			var list = new Array();
			if(_attributeValueList instanceof Array){
				list = _attributeValueList;
			} else if (Class.isA( AttributeValueList, _attributeValueList)) {
				list = _attributeValueList.getItems();
			}
			for(var i in list){
				var attributeValue = list[i];
				if(Class.isA(AttributeValue, attributeValue)){
					this.items[attributeValue.getName()] = attributeValue;
					this.count++;
				}
			}
			return this;
		},


		'override public put' : function(_attributeValue){
			if(Class.isA(AttributeValue, _attributeValue)){
				if(!(this.containsKey(_attributeValue.getName()))){
					this.count++;
				}
				this.items[_attributeValue.getName()] = _attributeValue;
			}
		},

		'override public putAll' : function(_attributeValueList){
			var list = new Array();;
			if(_attributeValueList instanceof Array){
				list = _attributeValueList;
			} else if (Class.isA( AttributeValueList, _attributeValueList)) {
				list = _attributeValueList.getItems();
			}
			for(var i in list){
				var attributeValue = list[i];
				if(Class.isA(AttributeValue, attributeValue)){
					this.items[attributeValue.getName()] = attributeValue;
					if(!(this.containsKey(attributeValue.getName()))){
						this.count++;
					}
				}
			}
		},


		'override public contains' : function(_item){
			if(Class.isA(AttributeValue,_item)){
				var tmp = this.getItem(_item.getName());
				if(!(typeof tmp === 'undefined') && tmp.equals(_item)){
					return true;
				}
			} 
			return false;
		},
		
		'public getSubset' : function(_attributeTypeList){
			var response = new AttributeValueList();
			var list = new Array();;
			if(_attributeTypeList instanceof Array){
				list = _attributeTypeList;
			} else if (Class.isA( AttributeTypeList, _attributeTypeList)) {
				list = _attributeTypeList.getItems();
			}
			for (var i in list){
				var attributeType = list[i];
				if(Class.isA(AttributeType, attributeType)){
					var attribute = this.items[attributeType.getName()];
					if(attribute){
						response.put(attribute);
					};
				};
			};
			return response;
		},
		

	});

	return AttributeValueList;
});