/**
 * Created by tobias on 13.03.15.
 */
define([ 'easejs', 'contactJS' ], function(easejs, contactJS) {
	var Class = easejs.Class;

	var SecondsInterpreter = Class('SecondsInterpreter').extend(
			contactJS.Interpreter,
			{
				'public name' : 'SecondsInterpreter',

				'protected initInAttributes' : function(_translations) {
					var nativeInAttributeType = new contactJS.AttributeType()
							.withName('CI_BASE_UNIT_OF_TIME')
							.withType('INTEGER')
							.withParameter(new contactJS.Parameter()
											.withKey("CP_UNIT")
											.withValue("MILLISECONDS"));
					this.inAttributeTypes.put(nativeInAttributeType);
					// add synonyms
					for (type in _translations) {
						if (_translations[type].equals(nativeInAttributeType))
							this.inAttributeTypes.put(type);
						if (type.equals(nativeInAttributeType))
							this.inAttributeTypes.put(_translations[type]);
					}
				},

				'protected initOutAttributes' : function(_translations) {
					var nativeOutAttributeType = new contactJS.AttributeType()
							.withName('CI_BASE_UNIT_OF_TIME').withType(
									'INTEGER').withParameter(
									new contactJS.Parameter()
											.withKey("CP_UNIT").withValue(
													"SECONDS"));
					this.outAttributeTypes.put(nativeOutAttributeType);					
					// add synonyms
					for (type in _translations) {
						if (_translations[type].equals(nativeOutAttributeType))
							this.outAttributeTypes.put(type);
						if (type.equals(nativeOutAttributeType))
							this.outAttributeTypes.put(_translations[type]);
					}
				},

				'protected interpretData' : function(_data, _function) {
					this.setOutAttribute('CI_BASE_UNIT_OF_TIME', 'INTEGER',
							Math.floor(_data.getItems()[0].getValue() / 1000),
							[ new contactJS.Parameter().withKey("CP_UNIT")
									.withValue("SECONDS") ]);

					if (_function && typeof (_function) == 'function') {
						_function();
					}
				}
			});

	return SecondsInterpreter;
});