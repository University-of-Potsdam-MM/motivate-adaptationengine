require.config({
    baseUrl: 'scripts',
    paths: {
        // external libraries
        jquery: 'lib/jquery-2.1.1.min',
        easejs: 'lib/ease-latest',
        nools: 'lib/nools.min',
        // adaptation engine
        MoAE: 'motivate_adaptation_engine/adaptationengine',
        // rule engine
        MoRE: 'motivate_adaptation_engine/rules/ruleengine',
        // context detection
        MoCD: 'motivate_adaptation_engine/context/ContextDetector',
        MoCD_AttributeType: 'motivate_adaptation_engine/context/attribute/attributeType',
        MoCD_AttributeTypeList: 'motivate_adaptation_engine/context/attribute/attributeTypeList',
        MoCD_AttributeValue: 'motivate_adaptation_engine/context/attribute/attributeValue',
        MoCD_AttributeValueList: 'motivate_adaptation_engine/context/attribute/attributeValueList',
        MoCD_Callback: 'motivate_adaptation_engine/context/subscriber/callback',
        MoCD_CallbackList: 'motivate_adaptation_engine/context/subscriber/callbackList',
        MoCD_Discoverer: 'motivate_adaptation_engine/context/discoverer/discoverer',
        MoCD_Subscriber: 'motivate_adaptation_engine/context/subscriber/subscriber',
        MoCD_SubscriberList: 'motivate_adaptation_engine/context/subscriber/subscriberList',
        MoCD_Widget: 'motivate_adaptation_engine/context/widget/widget',
        // context detection widgets
        MoCD_GeoLocationWidget: 'motivate_adaptation_engine/context/widget/geoLocationWidget'
    },
    shim:{
        'easejs' : {
            exports : 'easejs'
        }
    }
});