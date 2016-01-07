var _contactJS = require("contactJS");
var _d = new _contactJS.Discoverer();

var _rules = [
  {
    "id": "dadc0448-df54-48f7-a892-091e3a91db73",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_USER_ROLE", type: "STRING", parameterList: []}),
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_TIME", type: "STRING", parameterList: []}),
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_TIME", type: "STRING", parameterList: []}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_USER_ROLE", type: "STRING", parameterList: []}), "!=", "Student") || this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_TIME", type: "STRING", parameterList: []}), ">", "16:00:00") || this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_TIME", type: "STRING", parameterList: []}), "<", "09:00:00")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["restrictFeatureCallback"] != "undefined") {
        window["ruleEngine"]._callbacks["restrictFeatureCallback"]("AppUsageFeature", null);
      }
      R.next();
    }
  },
  {
    "id": "57f235ae-84f7-4fdf-afa4-eda5148f4375",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_DID_ARRIVE_AT_LOCATION", type: "BOOLEAN", parameterList: [["CP_LATITUDE", "FLOAT", "52.39351"],["CP_LONGITUDE", "FLOAT", "13.13024"]]}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_DID_ARRIVE_AT_LOCATION", type: "BOOLEAN", parameterList: [["CP_LATITUDE", "FLOAT", "52.39351"],["CP_LONGITUDE", "FLOAT", "13.13024"]]}), "==", "true")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["selectLearningUnit"] != "undefined") {
        window["ruleEngine"]._callbacks["selectLearningUnit"](129, null);
      }
      R.next();
    }
  },
  {
    "id": "682f09de-4fac-47f2-965e-2dc8eeabb114",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_FINISHED_LEARNING_UNIT", type: "INTEGER", parameterList: []}),
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_FINISHED_LEARNING_UNIT", type: "INTEGER", parameterList: []}),
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_FINISHED_LEARNING_UNIT", type: "INTEGER", parameterList: []}),
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_FINISHED_LEARNING_UNIT", type: "INTEGER", parameterList: []}),
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_FINISHED_LEARNING_UNIT", type: "INTEGER", parameterList: []}),
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_USER_MOVEMENT_SPEED", type: "FLOAT", parameterList: [["CP_VELOCITY_UNIT", "STRING", "KILOMETERS_PER_HOUR"]]}),
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_DEVICE_TYPE", type: "STRING", parameterList: []}),
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_USER_LOCATION_LONGITUDE", type: "FLOAT", parameterList: []}),
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_USER_LOCATION_LATITUDE", type: "FLOAT", parameterList: []}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_FINISHED_LEARNING_UNIT", type: "INTEGER", parameterList: []}), "==", "127") && (this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_FINISHED_LEARNING_UNIT", type: "INTEGER", parameterList: []}), "==", "124") || this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_FINISHED_LEARNING_UNIT", type: "INTEGER", parameterList: []}), "==", "125")) && (this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_FINISHED_LEARNING_UNIT", type: "INTEGER", parameterList: []}), "==", "128") || this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_FINISHED_LEARNING_UNIT", type: "INTEGER", parameterList: []}), "==", "125")) && this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_USER_MOVEMENT_SPEED", type: "FLOAT", parameterList: [["CP_VELOCITY_UNIT", "STRING", "KILOMETERS_PER_HOUR"]]}), "<", "20.0") && this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_DEVICE_TYPE", type: "STRING", parameterList: []}), "==", "FEATURE_PHONE")) && (this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_USER_LOCATION_LONGITUDE", type: "FLOAT", parameterList: []}), "==", "13.13021") && this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_USER_LOCATION_LATITUDE", type: "FLOAT", parameterList: []}), "==", "52.39346")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["selectLearningUnit"] != "undefined") {
        window["ruleEngine"]._callbacks["selectLearningUnit"](126, null);
      }
      R.next();
    }
  },
  {
    "id": "2a4151b0-6a42-4458-bfbd-735ba363b906",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameterList: []}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameterList: []}), "==", "126")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["preloadLearningUnitCallback"] != "undefined") {
        window["ruleEngine"]._callbacks["preloadLearningUnitCallback"](127, null);
      }
      R.next();
    }
  },
  {
    "id": "bf3cab04-7f51-4afa-8d77-74a1d9183b99",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameterList: []}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameterList: []}), "==", "126")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["preloadLearningUnitCallback"] != "undefined") {
        window["ruleEngine"]._callbacks["preloadLearningUnitCallback"](124, null);
      }
      R.next();
    }
  },
  {
    "id": "ca05f753-e69c-47be-9ba9-2576863634f2",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameterList: []}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameterList: []}), "==", "126")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["preloadLearningUnitCallback"] != "undefined") {
        window["ruleEngine"]._callbacks["preloadLearningUnitCallback"](128, null);
      }
      R.next();
    }
  },
  {
    "id": "c9927fac-34b9-43f8-9173-bed42ae0c954",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_DEVICE_TYPE", type: "STRING", parameterList: []}),
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_TEMPERATURE", type: "FLOAT", parameterList: [["CP_TEMPERATURE_SCALE", "STRING", "FAHRENHEIT"]]}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_DEVICE_TYPE", type: "STRING", parameterList: []}), "==", "FEATURE_PHONE")) && (this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_TEMPERATURE", type: "FLOAT", parameterList: [["CP_TEMPERATURE_SCALE", "STRING", "FAHRENHEIT"]]}), ">", "30.0")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["selectLearningUnit"] != "undefined") {
        window["ruleEngine"]._callbacks["selectLearningUnit"](130, null);
      }
      R.next();
    }
  },
  {
    "id": "68e79e20-cdb1-466c-9f18-a9aa2b09287f",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_TEMPERATURE", type: "FLOAT", parameterList: [["CP_TEMPERATURE_SCALE", "STRING", "FAHRENHEIT"]]}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_TEMPERATURE", type: "FLOAT", parameterList: [["CP_TEMPERATURE_SCALE", "STRING", "FAHRENHEIT"]]}), ">", "30.0")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["selectLearningUnit"] != "undefined") {
        window["ruleEngine"]._callbacks["selectLearningUnit"](124, null);
      }
      R.next();
    }
  },
  {
    "id": "32b2aa15-ea0e-4ba9-8f6e-fa1b03994ae8",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameterList: []}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameterList: []}), "==", "124")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["preloadLearningUnitCallback"] != "undefined") {
        window["ruleEngine"]._callbacks["preloadLearningUnitCallback"](125, null);
      }
      R.next();
    }
  },
  {
    "id": "b4ac552f-487b-41e4-9f22-196050a492d1",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameterList: []}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameterList: []}), "==", "125")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["preloadLearningUnitCallback"] != "undefined") {
        window["ruleEngine"]._callbacks["preloadLearningUnitCallback"](124, null);
      }
      R.next();
    }
  },
  {
    "id": "f69c2616-095d-4332-9d4b-f4a27947afba",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameterList: []}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameterList: []}), "==", "125")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["preloadLearningUnitCallback"] != "undefined") {
        window["ruleEngine"]._callbacks["preloadLearningUnitCallback"](128, null);
      }
      R.next();
    }
  },
  {
    "id": "36472eca-63a7-41b7-8188-9bfd56ce5fcc",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameterList: []}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameterList: []}), "==", "128")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["preloadLearningUnitCallback"] != "undefined") {
        window["ruleEngine"]._callbacks["preloadLearningUnitCallback"](125, null);
      }
      R.next();
    }
  },
  {
    "id": "4017721b-8e1b-4163-91b4-fc5226ddc1e5",
    "relatedContextInformation": [
      _contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameterList: []}),
    ],
    "condition": function(R) {
      R.when((this.fulfils(_contactJS.ContextInformation.fromContextInformationDescription(_d, {name: "CI_CURRENT_LEARNING_UNIT", type: "INTEGER", parameterList: []}), "==", "128")));
    },
    "consequence": function(R) {
      if (typeof window["ruleEngine"]._callbacks["preloadLearningUnitCallback"] != "undefined") {
        window["ruleEngine"]._callbacks["preloadLearningUnitCallback"](129, null);
      }
      R.next();
    }
  }
];