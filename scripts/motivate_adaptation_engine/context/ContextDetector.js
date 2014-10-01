define("MoCD", ['nools', 'easejs', 'MoCD_Discoverer'], function(nools, easejs, Discoverer) {
    var Class = easejs.Class;

    var ContextDetector = Class('ContextDetector', {
        'private adaptationRules': null,

        __construct: function(adaptationRules) {
            this._adaptationRules = adaptationRules;
        }
    });

    return ContextDetector;
});