define(['easejs', 
        'MoCD_AttributeType'],
 	function(easejs, AttributeType){

 	/*
 	* AttributeValue, extends Attribute
 	* contains an attribute with his associated value
 	*/

 	var Class = easejs.Class;
	var AttributeValue = Class('AttributeValue').
		extend( AttributeType,
			{
		//value of this attribute
		'protected value' : '', 
		//time, when the value was set
		'protected timestamp':'',

		'public withValue' : function(_value){
    			this.setValue(_value);
    			this.setTimestamp(new Date());
    			return this;
    	},
    	
    	'public withTimestamp' : function(_timestamp){
			this.setTimestamp(_timestamp);
			return this;
	},

		//getter und setter
		'public setValue' : function(_value){
			this.value = _value;
		},

		'public getValue' : function(){
			return this.value;
		},

		'public setTimestamp' : function(_time){
			this.timestamp = _time;
		},

		'public getTimestamp' : function(){
			return this.timestamp;
		},

		'override public equals' : function(_attributeValue) {
			if(Class.isA(AttributeValue, _attributeValue)){
				if(_attributeValue.getName() == this.getName() 
					&& _attributeValue.getType() == this.getType()){
					//TODO value?
					return true;
				}
				else {
					return false;
				}
			} else {
				return false;
			}

		},

		//returns this attribute as a string
			//TODO schoener printen
		'override public toString' : function(){
			var string = "name=" + this.getName() +  ", type=" 
						+ this.getType() + ", value=" + this.getValue() + ", timestamp=" + this.getTimestamp();  
				return string;
			},

	});

	return AttributeValue;
});