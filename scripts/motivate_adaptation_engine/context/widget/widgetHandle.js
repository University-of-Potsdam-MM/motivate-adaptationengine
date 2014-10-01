define(['easejs'],
 	function(easejs){

 	/*
 	* Callback: name and associated Attributes
 	*/
 	var Class = easejs.Class;
	var WidgetHandle = Class('WidgetHandle',
	{

		// name of the widget, which should be subscribed to
		'private name' : '', 
		// id of the widget, which should be subscribed to
		'private id' : '', 

		'public withName' : function(_name){
			this.setName(_name);
			return this;
		},
		
		'public withId' : function(_id){
			this.setId(_id);
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
		
		'public getId' : function(){
			return this.id;
		},

		'public setId' : function(_id){
			if(_id === parseInt(_id)){
				this.id = _id;
			};
		},


		});

	return WidgetHandle;
});