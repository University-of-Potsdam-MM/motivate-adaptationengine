var Class = easejs.Class;

var RuleEngine = Class('RuleEngine',
    {
        'private nools': '',
        'private flow': '',

        __construct: function(noolsDSL)
        {
            this.flow = this.nools.compile(__dirname + "/helloworld.nools");
        }
    }
);