var Class = easejs.Class;

var RuleEngine = Class('RuleEngine',
    {
        'private nools': '',
        'private flow': '',

        __construct: function(noolsDSL)
        {
        	this.nools = require("nools");
            this.flow = this.nools.parse(noolsDSL);
            console.log(this.flow);
			for (p in this.flow) {
				if (p == 'rules') {
					for (rule in p) {
						console.log(rule);				
					}
				}
			}
        }

    }
);