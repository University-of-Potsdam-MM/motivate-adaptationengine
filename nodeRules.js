var _contactJS = require("contactJS");
var _d = new _contactJS.Discoverer();

var _rules = [
  {
    "id": "172ac635-0072-4d36-b300-4a4a8242a38c",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_USER_ROLE", type: "STRING", parameters: []}),
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_TIME", type: "STRING", parameters: []}),
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_TIME", type: "STRING", parameters: []}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_USER_ROLE", type: "STRING", parameters: []}), "!=", "Student") || this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_TIME", type: "STRING", parameters: []}), ">", "16:00:00") || this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_TIME", type: "STRING", parameters: []}), "<", "09:00:00")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["restrictFeatureCallback"] != "undefined") {
        window["ruleEngine"]._callbacks["restrictFeatureCallback"]("AppUsageFeature", null);
      }
      R.next();
    }
  },
  {
    "id": "a03f2415-730c-4a1c-ae70-d09a9dca276d",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_DID_ARRIVE_AT_LOCATION", type: "BOOLEAN", parameters: [["CP_LATITUDE", "FLOAT", "52.39351"],["CP_LONGITUDE", "FLOAT", "13.13024"]]}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_DID_ARRIVE_AT_LOCATION", type: "BOOLEAN", parameters: [["CP_LATITUDE", "FLOAT", "52.39351"],["CP_LONGITUDE", "FLOAT", "13.13024"]]}), "==", "true")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["selectLearningUnit"] != "undefined") {
        window["ruleEngine"]._callbacks["selectLearningUnit"](129, null);
      }
      R.next();
    }
  },
  {
    "id": "e54f7ff0-e124-4772-b253-6d0f2413c4a5",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_FINISHED_LEARNING_UNIT", type: "INTEGER", parameters: []}),
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_FINISHED_LEARNING_UNIT", type: "INTEGER", parameters: []}),
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_FINISHED_LEARNING_UNIT", type: "INTEGER", parameters: []}),
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_FINISHED_LEARNING_UNIT", type: "INTEGER", parameters: []}),
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_FINISHED_LEARNING_UNIT", type: "INTEGER", parameters: []}),
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_USER_MOVEMENT_SPEED", type: "FLOAT", parameters: [["CP_VELOCITY_UNIT", "STRING", "KILOMETERS_PER_HOUR"]]}),
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_DEVICE_TYPE", type: "STRING", parameters: []}),
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_USER_LOCATION_LONGITUDE", type: "FLOAT", parameters: []}),
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_USER_LOCATION_LATITUDE", type: "FLOAT", parameters: []}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_FINISHED_LEARNING_UNIT", type: "INTEGER", parameters: []}), "==", "127") && (this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_FINISHED_LEARNING_UNIT", type: "INTEGER", parameters: []}), "==", "124") || this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_FINISHED_LEARNING_UNIT", type: "INTEGER", parameters: []}), "==", "125")) && (this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_FINISHED_LEARNING_UNIT", type: "INTEGER", parameters: []}), "==", "128") || this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_FINISHED_LEARNING_UNIT", type: "INTEGER", parameters: []}), "==", "125")) && this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_USER_MOVEMENT_SPEED", type: "FLOAT", parameters: [["CP_VELOCITY_UNIT", "STRING", "KILOMETERS_PER_HOUR"]]}), "<", "20.0") && this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_DEVICE_TYPE", type: "STRING", parameters: []}), "==", "FEATURE_PHONE")) && (this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_USER_LOCATION_LONGITUDE", type: "FLOAT", parameters: []}), "==", "13.13021") && this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_USER_LOCATION_LATITUDE", type: "FLOAT", parameters: []}), "==", "52.39346")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["selectLearningUnit"] != "undefined") {
        window["ruleEngine"]._callbacks["selectLearningUnit"](126, null);
      }
      R.next();
    }
  },
  {
    "id": "f678e187-a678-416f-971c-6aae86af6fb9",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameters: []}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameters: []}), "==", "126")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["preloadLearningUnitCallback"] != "undefined") {
        window["ruleEngine"]._callbacks["preloadLearningUnitCallback"](127, null);
      }
      R.next();
    }
  },
  {
    "id": "0a14fc3f-9358-4af4-977c-07afe27bc80a",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameters: []}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameters: []}), "==", "126")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["preloadLearningUnitCallback"] != "undefined") {
        window["ruleEngine"]._callbacks["preloadLearningUnitCallback"](124, null);
      }
      R.next();
    }
  },
  {
    "id": "216a6b10-64a6-476a-8165-583a2c83fbf4",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameters: []}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameters: []}), "==", "126")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["preloadLearningUnitCallback"] != "undefined") {
        window["ruleEngine"]._callbacks["preloadLearningUnitCallback"](128, null);
      }
      R.next();
    }
  },
  {
    "id": "5f27bac0-b9d8-4750-8294-22622e0e7c4a",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_DEVICE_TYPE", type: "STRING", parameters: []}),
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_TEMPERATURE", type: "FLOAT", parameters: [["CP_TEMPERATURE_SCALE", "STRING", "FAHRENHEIT"]]}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_DEVICE_TYPE", type: "STRING", parameters: []}), "==", "FEATURE_PHONE")) && (this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_TEMPERATURE", type: "FLOAT", parameters: [["CP_TEMPERATURE_SCALE", "STRING", "FAHRENHEIT"]]}), ">", "30.0")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["selectLearningUnit"] != "undefined") {
        window["ruleEngine"]._callbacks["selectLearningUnit"](130, null);
      }
      R.next();
    }
  },
  {
    "id": "1f473e14-4ff1-4dba-aaa2-e011a860f761",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_TEMPERATURE", type: "FLOAT", parameters: [["CP_TEMPERATURE_SCALE", "STRING", "FAHRENHEIT"]]}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_TEMPERATURE", type: "FLOAT", parameters: [["CP_TEMPERATURE_SCALE", "STRING", "FAHRENHEIT"]]}), ">", "30.0")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["selectLearningUnit"] != "undefined") {
        window["ruleEngine"]._callbacks["selectLearningUnit"](124, null);
      }
      R.next();
    }
  },
  {
    "id": "85066052-01e4-40eb-b6de-6ae8da0a48d3",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameters: []}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameters: []}), "==", "124")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["preloadLearningUnitCallback"] != "undefined") {
        window["ruleEngine"]._callbacks["preloadLearningUnitCallback"](125, null);
      }
      R.next();
    }
  },
  {
    "id": "8ac1eef5-ea42-4731-b632-e85d6c28f799",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameters: []}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameters: []}), "==", "125")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["preloadLearningUnitCallback"] != "undefined") {
        window["ruleEngine"]._callbacks["preloadLearningUnitCallback"](124, null);
      }
      R.next();
    }
  },
  {
    "id": "7ad24b89-4920-4a8c-843a-a37210b927b2",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameters: []}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameters: []}), "==", "125")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["preloadLearningUnitCallback"] != "undefined") {
        window["ruleEngine"]._callbacks["preloadLearningUnitCallback"](128, null);
      }
      R.next();
    }
  },
  {
    "id": "fc3a807b-55b4-4d78-9524-03cab4405361",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameters: []}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameters: []}), "==", "128")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["preloadLearningUnitCallback"] != "undefined") {
        window["ruleEngine"]._callbacks["preloadLearningUnitCallback"](125, null);
      }
      R.next();
    }
  },
  {
    "id": "7d01e637-2da5-452d-9787-200c805fac7d",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameters: []}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameters: []}), "==", "128")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["preloadLearningUnitCallback"] != "undefined") {
        window["ruleEngine"]._callbacks["preloadLearningUnitCallback"](129, null);
      }
      R.next();
    }
  }
];