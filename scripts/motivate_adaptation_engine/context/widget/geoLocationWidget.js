define(['easejs',
        'MoCD_Widget',
        'MoCD_AttributeType',
        'MoCD_AttributeTypeList',
        'MoCD_AttributeValue',
        'MoCD_AttributeValueList',
        'MoCD_Callback'],
 	function(easejs, Widget,
 			AttributeType, AttributeTypeList,
 			AttributeValue, AttributeValueList,
 			Callback){

 	/*
 	* Callback: name and associated Attributes
 	*/
 	var Class = easejs.Class;
	var GeoLocationWidget = Class('GeoLocationWidget').
		extend(Widget,
	{
		// name of the widget
		//must be changed
		'public name' : 'GeoLocationWidget', 
		'public id' : 1,
		
		'private latitude' : '',
		 
		/*
		*initializes the attributeList, constantAttributeList, callbackList and serviceList
		*must be implemented
		*/
		'protected initAttributes' : function(){
			var latitude = new AttributeValue().withName('latitude')
										.withType('double')
										.withValue('undefined');
			this.addAttribute(latitude);
			var longitude = new AttributeValue().withName('longitude')
									.withType('double')
									.withValue('undefined');
			this.addAttribute(longitude);
		},
		
		'protected initConstantAttributes' : function(){
			//no constantAttributes available
		},
		
		'protected initCallbacks' : function(){
			var latitudeType = new AttributeType().withName('latitude')
						.withType('double');
			var longitudeType = new AttributeType().withName('longitude')
						.withType('double');
			var list = new AttributeTypeList();
			list.put(latitudeType);
			list.put(longitudeType);

			var call = new Callback().withName('UPDATE').withAttributeTypes(list);
			this.addCallback(call);
		},
		
		'protected initServices' : function(){
			//no services available
		},
		
		'override public updateWigetInformation' : function(){
			this.queryGenerator();
		},
		
		
		'override protected queryGenerator' : function(){			
			var self = this;
			navigator.geolocation.getCurrentPosition(function(_position){self.onSuccess(_position,self);},
									function(error){self.onError(error);});
		},
		
		
		'private onSuccess' : function(_position,self){
			self.latitude = new AttributeValue().withName('latitude')
				.withType('double')
				.withValue(_position.coords.latitude);
			self.longitude = new AttributeValue().withName('longitude')
				.withType('double')
				.withValue(_position.coords.longitude);
			var response = new AttributeValueList();
	    	response.put(self.latitude);
	    	response.put(self.longitude);
	    	self.putData(response);
		},
		
		'private onError' : function(error){
			alert('code: '    + error.code    + '\n' +
			          'message: ' + error.message + '\n');
		},
		


	});

	return GeoLocationWidget;
});