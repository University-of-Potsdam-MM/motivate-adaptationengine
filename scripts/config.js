require.config({
    baseUrl: 'scripts',
    packages: [
        {
            name: 'widgets',
            location: 'motivate_adaptation_engine/context/widgets',
            main: 'widgets'
        },
        {
            name: 'interpreters',
            location: 'motivate_adaptation_engine/context/interpreters',
            main: 'interpreters'
        }
    ],
    paths: {
        // external libraries
        jquery: 'lib/jquery-2.1.1.min',
        MathUuid: 'lib/Math.uuid',
        nools: 'lib/nools.min',
        contactJS: 'lib/contactJS',
        // adaptation engine
        MoAE: 'motivate_adaptation_engine/AdaptationEngine',
        // rule engine
        MoRE: 'motivate_adaptation_engine/rules/RuleEngine',
        // context information
        MoCI: 'motivate_adaptation_engine/context/ContextInformation',
        // context detection
        MoCD: 'motivate_adaptation_engine/context/ContextDetector'
    },
    shim:{
        'jquery' : {
            exports : '$'
        },
        'MathUuid' : {
            exports : 'MathUuid'
        }
    }
});