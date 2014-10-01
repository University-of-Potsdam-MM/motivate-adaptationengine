define(['easejs',
        'attribute/attributeValue',
        'attribute/attributeValueList'],
 	function( easejs,
 			AttributeValue,
 			AttributeValueList){

 	/*
 	* Aggregator
 	*/
 	var Class = easejs.Class;
	var Storage =  Class('Storage',		
	{
		
		'private attributeNames' : [],
		'private attributes' : [],
		
		
		'public initStorage' : function(_name){
			var db = window.openDatabase(_name, "1.0", "DB_" + _name, 1000000);
			console.log('initStorage: ' + _name);
			return db;
		},
		
		'public createTable' : function(_database,_tableName){
			var statement = 'CREATE TABLE IF NOT EXISTS ' + _tableName + ' (value_, type_, created_)';
		    _database.transaction(function(tx){tx.executeSql(statement);}, this.errorCB, this.successCB);			
		},
				
		'public insertIntoTable' : function(_database,_attributeValue){
			if(_database && _attributeValue && Class.isA(AttributeValue, _attributeValue)){
				var statement = 'INSERT INTO ' + _attributeValue.getName() 
									 + ' (value_, type_, created_) VALUES ("'
									 + _attributeValue.getValue() + '", "' 
									 + _attributeValue.getType() + '", "'
									 + _attributeValue.getTimestamp() + '")';
	
				_database.transaction(function(tx){tx.executeSql(statement);}, this.errorCB, this.successCB);	
			};
		},
		
		'private errorCB' : function(err) {
		    console.log("Error processing SQL: "+err.message);
		},

		'private successCB' : function() {
		    console.log("success!");
		},
		
		
		/*
		 * show tables
		 */
		'public getAttributeNames' : function(_database){
			var self = this;
		    _database.transaction(function(_tx){self.queryTables(_tx,self);},
		    						function(error){self.errorCB(error);} );
		    		    
		},
		
		'private queryTables' : function(_tx,self){
			var statement = "SELECT * from sqlite_master WHERE type = 'table'";
			_tx.executeSql(statement, [], 
					function(_tx,results){self.queryTableSuccess(_tx,results,self);}, 
					function(error){self.errorCB(error);});			
		},
		
		'private queryTableSuccess' : function(_tx, results,self){
			var len = results.rows.length;
			self.attributeNames = new Array();
			for(var i=0; i<len; i++){
				self.attributeNames.push(results.rows.item(i).name);
			}
			 
		},
		
		/*
		 * show values in table
		 */
		'public getFullAttributes' : function(_database, _tableName){
			var self = this;			
		    _database.transaction(function(_tx){self.queryValues(_tx,_tableName,self);},
		    						function(error){self.errorCB(error);} );	    
		},
		
		'private queryValues' : function(_tx,_tableName,self){
			var statement = 'SELECT * FROM ' + _tableName;
			_tx.executeSql(statement, [], 
					function(_tx,results){self.queryValuesSuccess(_tx,results,_tableName, self);}, 
					function(error){self.errorCB(error);});			
		},
		
		'private queryValuesSuccess' : function(_tx, results,_tableName, self){
			var len = results.rows.length;
			self.attributes = new AttributeValueList();
			for(var i=0; i<len; i++){
				var attribute = new AttributeValue().
								withName(_tableName).withValue(results.rows.item(i).value_).
								withType(results.rows.item(i).type_).
								withTimestamp(results.rows.item(i).created_);
				self.attributes.put(attribute);
			}
			 
		},
		
		
	});

	return Storage;
});