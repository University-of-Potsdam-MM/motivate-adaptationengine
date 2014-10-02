define("MoCD", ['nools', 'easejs', 'jquery', 'MoCD_Discoverer', 'MoCD_GeoLocationWidget', 'lib/parser/constraint/parser'], function(nools, easejs, $, Discoverer, GeoLocationWidget) {
    var Class = easejs.Class;

    var ContextDetector = Class('ContextDetector', {
        'private _adaptationRules': null,
        'private _discoverer': null,
        'private _contextInformations': [],
        'private _lastContextInformation': [],

        __construct: function(adaptationRules) {
            this._adaptationRules = adaptationRules;
            this._discoverer = new Discoverer();

            // register geo location widget
            this._discoverer.registerNewComponent(new GeoLocationWidget(this._discoverer));

            console.log(this._discoverer.getWidgetDescriptions());


            for(var index in adaptationRules) {
                var adaptationRule = adaptationRules[index];
                var lastConstraint = adaptationRule.constraints[adaptationRule.constraints.length - 1];
                this._extractContextInformationsFromParsedConstraints(parser.parse(lastConstraint[lastConstraint.length - 1]));
            }

            console.log(this._contextInformations);
        },

        'private _extractContextInformationsFromParsedConstraints': function(parsedConstraints) {
            for(index in parsedConstraints) {
                var parsedConstraint = parsedConstraints[index];
                if ($.isArray(parsedConstraint)) {
                    this._extractContextInformationsFromParsedConstraints(parsedConstraint);
                } else if (parsedConstraint != null && typeof parsedConstraint == "string") {
                    if (parsedConstraint.indexOf("MeasurableInformation") > -1) {
                        this._lastContextInformation = parsedConstraint;
                        this._contextInformations.push(parsedConstraint);
                    } else if (parsedConstraint.indexOf("ContextParameter") > -1) {
                        console.log(parsedConstraints);
                        console.log(this._lastContextInformation + " " + parsedConstraint);
                    } else {
                        console.log(parsedConstraints);
                    }
                    //$.inArray(parsedConstraint, this._contextInformations) == -1
                }
            }
        }
    });

    return ContextDetector;
});