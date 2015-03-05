require.config({
    baseUrl: 'scripts',
    paths: {
        // external libraries
        jquery: 'lib/jquery-2.1.1.min',
        easejs: 'lib/ease-latest',
        MathUuid: 'lib/Math.uuid',
        nools: 'lib/nools.min',
        contactJS: 'lib/contactJS',
        // adaptation engine
        MoAE: 'motivate_adaptation_engine/adaptationengine',
        // rule engine
        MoRE: 'motivate_adaptation_engine/rules/ruleengine',
        // context information
        MoCI: 'motivate_adaptation_engine/context/ContextInformation',
        // context detection
        MoCD: 'motivate_adaptation_engine/context/ContextDetector'
    },
    shim:{
        'easejs' : {
            exports : 'easejs'
        },
        'jquery' : {
            exports : '$'
        },
        'MathUuid' : {
            exports : 'MathUuid'
        }
    }
});