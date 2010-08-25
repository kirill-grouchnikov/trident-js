var lastTime = new Date().getTime();

var timelineId = 0;

var TimelineState = {"IDLE":0, "READY":1, "PLAYING_FORWARD":2, 
  "PLAYING_REVERSE":3, "SUSPENDED":4, "CANCELLED":5, "DONE":6};
  
function ColorPropertyInterpolator() {
}

var interpolateSingle = function(from, to, at) {
  var intFrom = parseInt(from);
  var intTo = parseInt(to);
  return parseInt(parseFloat(intFrom + at * (intTo - intFrom)));
}

ColorPropertyInterpolator.prototype.interpolate = function(from, to, timelinePosition) {
  var fromParts = from.substring(4,from.length-1).split(',');
  var toParts = to.substring(4,to.length-1).split(',');
  var red = interpolateSingle(fromParts[0], toParts[0], timelinePosition);
  var green = interpolateSingle(fromParts[1], toParts[1], timelinePosition);
  var blue = interpolateSingle(fromParts[2], toParts[2], timelinePosition);
  return "rgb(" + red + "," + green + "," + blue + ")";
}

function Timeline() {
 this.mainObject = null;
 this.duration = 500;
 this.durationFraction = 0;
 this.callbacks = new Array;
 this.properties = new Array;
 this.state = TimelineState.IDLE;
 this.id = timelineId++;
}

function Timeline(mainObject) {
	this.mainObject = mainObject;
	this.duration = 500;
	this.durationFraction = 0;
	this.callbacks = new Array;
	this.properties = new Array;
	this.state = TimelineState.IDLE;
	this.id = timelineId++;
}

Timeline.prototype.addCallback = function(callback) {
	this.callbacks[this.callbacks.length] = callback;
}

Timeline.prototype.addPropertyToInterpolate = function(field, from, to) {
  var interpolator = new ColorPropertyInterpolator();
  var timelineObj = this;
  var propCallback = function(timelinePosition) {
    var currValue = interpolator.interpolate(from, to, timelinePosition);
    timelineObj.mainObject[field] = currValue;
  }
  this.callbacks[this.callbacks.length] = propCallback;
}

Timeline.prototype.play = function() {
  if (this.state == TimelineState.IDLE) {
    this.durationFraction = 0;
  }
  this.state = TimelineState.PLAYING_FORWARD;
  timelineSet[this.id] = this;
}

Timeline.prototype.playReverse = function() {
  if (this.state == TimelineState.IDLE) {
    this.durationFraction = 1;
  }
  this.state = TimelineState.PLAYING_REVERSE;
  timelineSet[this.id] = this;
}

function TimelineArray() {
	this.timelines = new Array;
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
			for (var j=0; j<timeline.callbacks.length; j++) {
				timeline.callbacks[j](timeline.durationFraction);
			}
		}
		if (timelineState == TimelineState.PLAYING_REVERSE) {
			timeline.durationFraction -= (delta / timeline.duration);
			if (timeline.durationFraction < 0) {
				timeline.durationFraction = 0;
				hasEnded = true;
      }		  
			for (var j=0; j<timeline.callbacks.length; j++) {
				timeline.callbacks[j](timeline.durationFraction);
			}
		}

		if (hasEnded) {
		  timeline.state = TimelineState.IDLE;
		  delete timelineSet[timelineId];
		} else {
			liveTimelines++;
		}
	}
	//document.title = liveTimelines + " live timeline(s) out of " + totalTimelines;
	lastTime = currTime;
}