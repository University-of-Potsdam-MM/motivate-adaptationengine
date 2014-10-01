define(['easejs', 
        'MoCD_AttributeType',
        'MoCD_AttributeTypeList'],
 	function(easejs, AttributeType, AttributeTypeList){

 	/*
 	* Callback: name and associated Attributes
 	*/
 	var Class = easejs.Class;
	var Callback = Class('Callback',
	{

		// name of the callback (like UPDATE)
		'private name' : '', 
		// list of attributes
		'private attributeTypes' : [], 
		
		'public __construct': function()
        {
			this.attributeTypes = new AttributeTypeList();
        },

		'public withName' : function(_name){
			this.setName(_name);
			return this;
		},
		
		'public withAttributeTypes' : function(_attributeTypes){
			this.setAttributeTypes(_attributeTypes);
			return this;
		},

		'public getName' : function(){
			return this.name;
		},

		'public setName' : function(_name){
			if(typeof _name === 'string'){
				this.name = _name;
			};
		},

		'public getAttributeTypes' : function(){
			return this.attributeTypes;
		},

		'public setAttributeTypes' : function(_attributeTypes){
			var list = new Array();
			if(_attributeTypes instanceof Array){
				list = _attributeTypes;
			} else if (Class.isA( AttributeTypeList, _attributeTypes)) {
				list = _attributeTypes.getItems();
			}
			for(var i in list){
				var attributeType = list[i];
				if(Class.isA( AttributeType, attributeType )){
					this.attributeTypes.put(attributeType);
				};
			};
		},

		/*
		 * adds attribute to list (variable attributes)
		 */
		'public addAttributeType' : function(_attributeType){
			if(Class.isA( AttributeType, _attributeType )){
				if(!this.attributeTypes.contains(_attributeType)){
					//if attribute is not in the List, push also the type to typesList
					this.attributeTypes.put(_attributeType);	
				}
			};
		},

		'public removeAttributeType' : function(_attributeType){
			if(Class.isA( AttributeType, _attributeType )){
				this.attributeTypes.removeItem(_attributeType.getName());
			};
		},

		//toString, toJson

		});

	return Callback;
});