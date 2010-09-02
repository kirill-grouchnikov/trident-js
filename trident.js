var lastTime = new Date().getTime();

var timelineId = 0;

var TimelineState = {"IDLE":"IDLE", "READY":"READY", 
  "PLAYING_FORWARD":"PLAYING_FORWARD", "PLAYING_REVERSE":"PLAYING_REVERSE", 
  "SUSPENDED":"SUSPENDED", "CANCELLED":"CANCELLED", "DONE":"DONE"};
  
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

function TimelineCallback(callbackDef) {
  this.onTimelineStateChanged = callbackDef["onTimelineStateChanged"];
  this.onTimelinePulse = callbackDef["onTimelinePulse"];
}

function Stack() {
  var elements = new Array;
  var liveCount = 0;

  this.empty = function() {
    return (liveCount == 0);
  }

  this.peek = function() {
    return elements[liveCount-1];
  }

  this.pop = function() {
    var toReturn = this.peek();
    liveCount--;
    delete elements[liveCount];
  }

  this.push = function(element) {
    elements[liveCount] = element;
    liveCount++;
  }
}

function Timeline(mainObject) {
  this.durationFraction = 0;
  this.duration = 500;
  this.timeUntilPlay = 0;
  this.initialDelay = 0;

  var mainObject = mainObject;
  var callbacks = new Array;
  var properties = new Array;
  var stateStack = new Stack();
  var id = timelineId++;

  stateStack.push(TimelineState.IDLE);

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

  var addCallback = function(callback) {
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

  this.addCallbacks = function(callbacks) {
    for (var i=0; i<callbacks.length; i++) {
      var callbackDefinition = callbacks[i];
      var callbackInfo = new TimelineCallback(callbackDefinition);
      addCallback(callbackInfo);
    }
  }

  this.getState = function() {
    return stateStack.peek();
  }

  this.__popState = function() {
    return stateStack.pop();
  }

  this.__pushState = function(state) {
    stateStack.push(state);
  }

  this.__replaceState = function(state) {
    stateStack.pop();
    this.__pushState(state);
  }

  this.play = function() {
    var existing = timelineSet[getId()];
    var msToSkip = 0;
    var reset = false;
    if (existing == undefined) {
      var oldState = this.getState();
      this.timeUntilPlay = this.initialDelay - msToSkip;
      if (this.timeUntilPlay < 0) {
        this.durationFraction = -this.timeUntilPlay / this.duration;
        // TODO: map position
        // timeline.timelinePosition = timeline.ease
        //     .map(timeline.durationFraction);
        this.timeUntilPlay = 0;
      } else {
        this.durationFraction = 0;
        // TODO: position
        //timeline.timelinePosition = 0.0f;
      }
      this.__pushState(TimelineState.PLAYING_FORWARD);
      this.__pushState(TimelineState.READY);
      timelineSet[getId()] = this;

      this.__callbackCallTimelineStateChanged(oldState);
    } else {
      var oldState = this.getState();
      if (oldState == TimelineState.READY) {
        // the timeline remains READY, but after that it will be
        // PLAYING_FORWARD
        this.__popState();
        this.__replaceState(TimelineState.PLAYING_FORWARD);
        this.__pushState(TimelineState.READY);
      } else {
        // change the timeline state
        this.__replaceState(TimelineState.PLAYING_FORWARD);
        if (oldState != this.getState()) {
          this.__callbackCallTimelineStateChanged(oldState);
        }
      }
      if (reset) {
        this.durationFraction = 0;
        // TODO: position
        //existing.timelinePosition = 0.0f;
        this.__callbackCallTimelinePulse();
      }
    }
  }

  this.playReverse = function() {
    var existing = timelineSet[getId()];
    var msToSkip = 0;
    var reset = false;
    if (existing == undefined) {
      var oldState = this.getState();
      this.timeUntilPlay = this.initialDelay - msToSkip;
      if (this.timeUntilPlay < 0) {
        this.durationFraction = 1 - this.timeUntilPlay / this.duration;
        // TODO: map position
        // timeline.timelinePosition = timeline.ease
        //     .map(timeline.durationFraction);
        this.timeUntilPlay = 0;
      } else {
        this.durationFraction = 1;
        // TODO: position
        //timeline.timelinePosition = 1;
      }
      this.__pushState(TimelineState.PLAYING_REVERSE);
      this.__pushState(TimelineState.READY);
      timelineSet[getId()] = this;

      this.__callbackCallTimelineStateChanged(oldState);
    } else {
      var oldState = this.getState();
      if (oldState == TimelineState.READY) {
        // the timeline remains READY, but after that it will be
        // PLAYING_REVERSE
        this.__popState();
        this.__replaceState(TimelineState.PLAYING_REVERSE);
        this.__pushState(TimelineState.READY);
      } else {
        // change the timeline state
        this.__replaceState(TimelineState.PLAYING_REVERSE);
        if (oldState != this.getState()) {
          this.__callbackCallTimelineStateChanged(oldState);
        }
      }
      if (reset) {
        this.durationFraction = 1;
        // TODO: position
        //existing.timelinePosition = 1;
        this.__callbackCallTimelinePulse();
      }
    }
  }
  
  this.__callbackCallTimelinePulse = function() {
    // TODO: convert duration fraction into timeline position

    var callbacks = getCallbacks();
    for (var i=0; i<callbacks.length; i++) {
      var callbackOnPulse = callbacks[i].onTimelinePulse;
      if (callbackOnPulse != undefined) {
        callbackOnPulse(this.durationFraction);
      }
    }
    var properties = getProperties();
    for (var i=0; i<properties.length; i++) {
      properties[i].updateValue(this.durationFraction);
    }
  }
  
  this.__callbackCallTimelineStateChanged = function(oldState) {
    var currState = this.getState();
    // TODO: timeline position
    var callbacks = getCallbacks();
    for (var i=0; i<callbacks.length; i++) {
      var callbackOnStateChanged = callbacks[i].onTimelineStateChanged;
      if (callbackOnStateChanged != undefined) {
        callbackOnStateChanged(oldState, this.getState(), 
          this.durationFraction, this.durationFraction);
      }
    }
  }
}

var timelineSet = {};

setInterval("globalTimerCallback()", 100);

globalTimerCallback = function() {
  var currTime = new Date().getTime();
  var passedSinceLastIteration = currTime - lastTime;
  var liveTimelines = 0;
  var totalTimelines = 0;
  for (var timelineId in timelineSet) {
    totalTimelines++;
    var timeline = timelineSet[timelineId];
    var timelineState = timeline.getState();
    
    if (timeline.getState() == TimelineState.SUSPENDED) {
      continue;
    }

    var timelineWasInReadyState = false;
    if (timeline.getState() == TimelineState.READY) {
      if ((timeline.timeUntilPlay - passedSinceLastIteration) > 0) {
        // still needs to wait in the READY state
        timeline.timeUntilPlay -= passedSinceLastIteration;
        continue;
      }

      // can go from READY to PLAYING
      timelineWasInReadyState = true;
      timeline.__popState();
      timeline.__callbackCallTimelineStateChanged(TimelineState.READY);
    }

    var hasEnded = false;
    if (timelineState == TimelineState.PLAYING_FORWARD) {
      if (!timelineWasInReadyState) {
        timeline.durationFraction = timeline.durationFraction
          + passedSinceLastIteration / timeline.duration;
      }
      if (timeline.durationFraction > 1) {
        timeline.durationFraction = 1;
        hasEnded = true;
      }
      timeline.__callbackCallTimelinePulse();
    }
    if (timelineState == TimelineState.PLAYING_REVERSE) {
      if (!timelineWasInReadyState) {
        timeline.durationFraction = timeline.durationFraction
          - passedSinceLastIteration / timeline.duration;
      }
      if (timeline.durationFraction < 0) {
        timeline.durationFraction = 0;
        hasEnded = true;
      }
      timeline.__callbackCallTimelinePulse();
    }

    if (hasEnded) {
      var oldState = timeline.getState();
      timeline.__replaceState(TimelineState.DONE);
      timeline.__callbackCallTimelineStateChanged(oldState);
      timeline.__popState();
      timeline.__callbackCallTimelineStateChanged(TimelineState.DONE);
      delete timelineSet[timelineId];
    } else {
      liveTimelines++;
    }
  }
//	document.title = liveTimelines + " live timeline(s) out of " + totalTimelines;
  lastTime = currTime;
}