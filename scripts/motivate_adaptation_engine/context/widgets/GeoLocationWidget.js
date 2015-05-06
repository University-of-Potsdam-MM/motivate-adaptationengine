/**
 * Created by tobias on 25.04.15.
 */
define(['easejs', 'contactJS'], function (easejs, contactJS) {
    var Class = easejs.Class;

    var GeoLocationWidget = Class('GeoLocationWidget').extend(contactJS.Widget, {
        'public name': 'GeoLocationWidget',

        'protected initOutAttributes': function () {
            this.addOutAttribute(
                new contactJS.Attribute()
                    .withName('CI_USER_LOCATION_LATITUDE')
                    .withType('FLOAT')
            );
            this.addOutAttribute(
                new contactJS.Attribute()
                    .withName('CI_USER_LOCATION_LONGITUDE')
                    .withType('FLOAT')
            );
        },

        'protected initConstantOutAttributes': function () {

        },

        'protected initCallbacks': function () {
            this.addCallback(new contactJS.Callback().withName('UPDATE').withAttributeTypes(this.getOutAttributes()));
        },

        'override protected queryGenerator': function (_function) {
            var self = this;
            var response = new contactJS.AttributeList();

            if(navigator.geolocation){
                navigator.geolocation.getCurrentPosition(function(_position) {
                    response.put(self.getOutAttributes().getItems()[0].setValue(_position.coords.latitude));
                    response.put(self.getOutAttributes().getItems()[1].setValue(_position.coords.longitude));

                    self.sendResponse(response, _function);
                }, function(error) {
                    //TODO: handle error
                    self.sendResponse(response, _function);
                });
            } else {
                //TODO: handle error
                self.sendResponse(response, _function);
            }
        },

        'private sendResponse': function(response, _function) {
            this.putData(response);
            this.notify();

            if (_function && typeof(_function) == 'function') {
                _function();
            }
        }
    });

    return GeoLocationWidget;
});