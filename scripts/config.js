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
        MoCD: 'motivate_adaptation_engine/context/ContextDetector',
        // custom widgets
        MoWI_UnixTime: 'motivate_adaptation_engine/context/widgets/UnixTimeWidget',
        MoWI_GeoLocation: 'motivate_adaptation_engine/context/widgets/GeoLocationWidget',
        MoWI_FakeCelsiusTemperature: 'motivate_adaptation_engine/context/widgets/FakeCelsiusTemperatureWidget',
        // custom interpreters
        MoIN_UnixTime: 'motivate_adaptation_engine/context/interpreters/UnixTimeInterpreter',
        MoIN_Address: 'motivate_adaptation_engine/context/interpreters/AddressInterpreter',
        MoIN_ISO8601: 'motivate_adaptation_engine/context/interpreters/ISO8601Interpreter',
        MoIN_CelsiusToFahrenheit: 'motivate_adaptation_engine/context/interpreters/CelsiusToFahrenheitInterpreter',
        MoIN_Seconds: 'motivate_adaptation_engine/context/interpreters/SecondsInterpreter',
        MoIN_Distance: 'motivate_adaptation_engine/context/interpreters/DistanceInterpreter'
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