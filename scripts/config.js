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
        jquery: 'lib/jquery-2.1.4.min',
        underscore: 'lib/underscore-min',
        MathUuid: 'lib/Math.uuid',
        nools: 'lib/nools.min',
        'node-rules': 'lib/node-rules',
        contactJS: 'lib/contactJS',
        // adaptation engine
        MoAE: 'motivate_adaptation_engine/AdaptationEngine',
        // rule engine
        MoRE: 'motivate_adaptation_engine/rules/RuleEngine',
        // context detection
        MoCD: 'motivate_adaptation_engine/context/ContextDetector'
    },
    shim:{
        'jquery': {
            exports: '$'
        },
        'MathUuid': {
            exports: 'MathUuid'
        },
        'underscore': {
            exports: '_'
        }
    }
});