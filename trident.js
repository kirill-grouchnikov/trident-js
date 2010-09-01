var lastTime = new Date().getTime();

var timelineId = 0;

var TimelineState = {"IDLE":0, "READY":1, "PLAYING_FORWARD":2, 
  "PLAYING_REVERSE":3, "SUSPENDED":4, "CANCELLED":5, "DONE":6};
  
function RGBPropertyInterpolator() {
	var interpolateSingle = function(from, to, at) {
	  var intFrom = parseInt(from);
	  var intTo = parseInt(to);
	  return parseInt(parseFloat(intFrom + at * (intTo - intFrom)));
	}

	this.interpolate = function(from, to, timelinePosition) {
	  var fromParts = from.substring(4,from.length-1).split(',');
	  var toParts = to.substring(4,to.length-1).split(',');
	  var red = interpolateSingle(fromParts[0], toParts[0], timelinePosition);
	  var green = interpolateSingle(fromParts[1], toParts[1], timelinePosition);
	  var blue = interpolateSingle(fromParts[2], toParts[2], timelinePosition);
	  return "rgb(" + red + "," + green + "," + blue + ")";
	}
}

function IntPropertyInterpolator() {
	this.interpolate = function(from, to, timelinePosition) {
	  return parseInt(parseFloat(from + (to - from) * timelinePosition));
	}
}

function PropertyInfo(mainObject, field, from, to, interpolator) {
	this.mainObject = mainObject;
	this.field = field;
	this.from = from;
	this.to = to;
	this.interpolator = interpolator;
	
	this.updateValue = function(timelinePosition) {
		mainObject[field] = interpolator.interpolate(from, to, timelinePosition);
	}
}

function Timeline(mainObject) {
	this.durationFraction = 0;
	this.duration = 500;
	this.state = TimelineState.IDLE;

	var mainObject = mainObject;
	var callbacks = new Array;
	var properties = new Array;
	var id = timelineId++;

	var getMainObject = function() {
		return mainObject;
	}
	
	var getId = function() {
		return id;
	}
	
	var getProperties = function() {
		return properties;
	}
	
	var addProperty = function(property) {
		var currProperties = getProperties();
		currProperties[currProperties.length] = property;
	}
	
	var getCallbacks = function() {
		return callbacks;
	}
	
	this.addCallback = function(callback) {
		var currCallbacks = getCallbacks();
		currCallbacks[currCallbacks.length] = callback;
	}
	
	this.addPropertyToInterpolate = function(field, from, to, interpolator) {
		var propInfo = new PropertyInfo(getMainObject(), field, from, to, interpolator);
		addProperty(propInfo);
	}
	
	this.addPropertiesToInterpolate = function(properties) {
    for (var i=0; i<properties.length; i++) {
      var propDefinition = properties[i];
      var from = propDefinition["from"];
      var to = propDefinition["to"];
      var propName = propDefinition["property"];
      var interpolator = propDefinition["interpolator"];
      var propInfo = new PropertyInfo(getMainObject(), propName, from, to, interpolator);
      addProperty(propInfo);
    }
	}
	
	this.play = function() {
	  if (this.state == TimelineState.IDLE) {
	    this.durationFraction = 0;
	  }
	  this.state = TimelineState.PLAYING_FORWARD;
	  timelineSet[getId()] = this;
	}

	this.playReverse = function() {
	  if (this.state == TimelineState.IDLE) {
	    this.durationFraction = 1;
	  }
	  this.state = TimelineState.PLAYING_REVERSE;
	  timelineSet[getId()] = this;
	}
	
	this.__update = function() {
		// TODO: convert duration fraction into timeline position
		
		var callbacks = getCallbacks();
		for (var i=0; i<callbacks.length; i++) {
			callbacks[i](this.durationFraction);
		}
		var properties = getProperties();
		for (var i=0; i<properties.length; i++) {
			properties[i].updateValue(this.durationFraction);
		}
	}
}

var timelineSet = {};

setInterval("globalTimerCallback()", 100);

globalTimerCallback = function() {
	var currTime = new Date().getTime();
	var delta = currTime - lastTime;
	var liveTimelines = 0;
	var totalTimelines = 0;
	for (var timelineId in timelineSet) {
	  totalTimelines++;
		var timeline = timelineSet[timelineId];
		var timelineState = timeline.state;
		var hasEnded = false;
		if (timelineState == TimelineState.PLAYING_FORWARD) {
			timeline.durationFraction += (delta / timeline.duration);
			if (timeline.durationFraction > 1) {
				timeline.durationFraction = 1;
				hasEnded = true;
			}
			timeline.__update();
		}
		if (timelineState == TimelineState.PLAYING_REVERSE) {
			timeline.durationFraction -= (delta / timeline.duration);
			if (timeline.durationFraction < 0) {
				timeline.durationFraction = 0;
				hasEnded = true;
			}
			timeline.__update();
		}

		if (hasEnded) {
		  timeline.state = TimelineState.IDLE;
		  delete timelineSet[timelineId];
		} else {
			liveTimelines++;
		}
	}
//	document.title = liveTimelines + " live timeline(s) out of " + totalTimelines;
	lastTime = currTime;
}