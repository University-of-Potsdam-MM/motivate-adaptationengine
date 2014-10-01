define(['easejs'],
    function(easejs){

    	var Class = easejs.Class;
		var AttributeType = Class('AttributeType',{
			
			//name of the attribute
			'protected name' : '', 
			//type of the attribute (i.e. Integer, String...)
			'protected type' : '', 

			
			//builder
    		'public withName' : function(_name){
    			this.setName(_name);
    			return this;
    		},

    		'public withType' : function(_type){
    			this.setType(_type);
    			return this;
    		},

			'public getName' : function(){
				return this.name;
			},
			
			'public getType' : function(){
				return this.type;
			},

			'public setName' : function(_name){
				if(typeof _name === 'string'){
					this.name = _name;
				};
			},

			'public setType' : function(_type){
				if(typeof _type === 'string'){
					this.type = _type;
				};
			},

			
			//returns this attribute as a string
			//TODO schoener printen
			'virtual public toString' : function(){
				var string = "name=" + this.name + ", type=" + this.type;  
				return string;
			},

			'public lengthOfSubAttributes' : function(){
				return this.subAttributes.length;
			},

			'virtual public equals' : function(_attributeType) {
				if(Class.isA(AttributeType, _attributeType)){
					if(_attributeType.getName() == this.getName() && _attributeType.getType() == this.getType()){
						return true;
					}
					else {
						return false;
					}
				} else {
					return false;
				}

			},

			//TODO equals, compare wird das gebraucht??

			});

		return AttributeType;
	
});