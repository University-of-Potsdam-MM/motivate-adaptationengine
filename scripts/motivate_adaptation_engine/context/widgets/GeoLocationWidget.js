/**
 * Created by tobias on 25.04.15.
 */
define(['easejs', 'contactJS'], function (easejs, contactJS) {
    var Class = easejs.Class;

    var GeoLocationWidget = Class('GeoLocationWidget').extend(contactJS.Widget, {
        'public name': 'GeoLocationWidget',

        'protected initAttributes': function () {
            var latitude = new contactJS.AttributeValue()
                .withName('CI_USER_LOCATION_LATITUDE')
                .withType('FLOAT')
                .withValue('NO_VALUE');

            var longitude = new contactJS.AttributeValue()
                .withName('CI_USER_LOCATION_LONGITUDE')
                .withType('FLOAT')
                .withValue('NO_VALUE');

            this.addAttribute(latitude);
            this.addAttribute(longitude);
        },

        'protected initConstantAttributes': function () {

        },

        'protected initCallbacks': function () {
            this.addCallback(new contactJS.Callback().withName('UPDATE').withAttributeTypes(this.getAttributeTypes()));
        },

        'override protected queryGenerator': function (_function) {
            var self = this;
            var response = new contactJS.AttributeValueList();

            if(navigator.geolocation){
                navigator.geolocation.getCurrentPosition(function(_position) {
                    response.put(self.getAttributeValues().getItems()[0].setValue(_position.coords.latitude))
                    response.put(self.getAttributeValues().getItems()[1].setValue(_position.coords.longitude));

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