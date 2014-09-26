var Class = easejs.Class;

var AdaptationEngine = Class( 'AdaptationEngine',
    {
        'private ruleEngine': [],
        'private contextDetector': [],
        'private noolsDSL': "",

        __construct: function(noolsDSL)
        {
            this.noolsDSL = noolsDSL;

            this.ruleEngine = new RuleEngine(noolsDSL);
        }
    }
);

