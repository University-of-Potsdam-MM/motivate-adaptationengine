define(['easejs',
        'aggregator/aggregator'],
 	function( easejs, Aggregator){

 	/*
 	* Aggregator
 	*/
 	var Class = easejs.Class;
	var TestAggregator =  Class('TestAggregator').
				extend(Aggregator, 
			
	{
		/*
		 * name and id of the widget
		 * must be changed
		 */
		'public name' : 'TestAggregator', 
		'public id' : 3, 
		
		/*
		*specified attributeList, constantAttributeList, callbackList 
		*and serviceList, thats are only specific to the aggregator
		*must be implemented
		*/
		'protected setAggregatorAttributeValues' : function(){},
		'protected setAggregatorConstantAttributeValues' : function(){},
		'protected setAggregatorCallbacks' : function(){},
		'protected setAggregatorServices' : function(){},

		
	});

	return TestAggregator;
});