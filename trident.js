var lastTime = new Date().getTime();

var timelineId = 0;

var TimelineState = {"IDLE":"IDLE", "READY":"READY", 
  "PLAYING_FORWARD":"PLAYING_FORWARD", "PLAYING_REVERSE":"PLAYING_REVERSE", 
  "SUSPENDED":"SUSPENDED", "CANCELLED":"CANCELLED", "DONE":"DONE"};

var RepeatBehavior = {"LOOP":"LOOP", "REVERSE":"REVERSE"};

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
    return toReturn;
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
  this.isLooping = false;
  this.timelinePosition = 0;
  this.toCancelAtCycleBreak = false;

  this.cycleDelay = 0;
  this.repeatCount = -1;
  this.repeatBehavior;

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

  this.__play = function(reset, msToSkip) {
    var existing = timelineSet[getId()];
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
  
  this.play = function() {
    this.isLooping = false;
    this.__play(false, 0);
  }

  this.replay = function() {
    this.isLooping = false;
    this.__play(true, 0);
  }

  this.__playReverse = function(reset, msToSkip) {
    var existing = timelineSet[getId()];
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

  this.playReverse = function() {
    this.isLooping = false;
    this.__playReverse(false, 0);
  }

  this.replayReverse = function() {
    this.isLooping = false;
    this.__playReverse(true, 0);
  }

  this.__playLoop = function(msToSkip) {
    var existing = timelineSet[getId()];
    if (existing == undefined) {
      var oldState = this.getState();
      this.timeUntilPlay = this.initialDelay - msToSkip;
      if (this.timeUntilPlay < 0) {
        this.durationFraction = -this.timeUntilPlay / this.duration;
        // TODO: timeline position
        // timeline.timelinePosition = timeline.ease
        //.map(timeline.durationFraction);
        this.timeUntilPlay = 0;
      } else {
        this.durationFraction = 0;
        this.timelinePosition = 0;
      }
      this.__pushState(TimelineState.PLAYING_FORWARD);
      this.__pushState(TimelineState.READY);
      this.toCancelAtCycleBreak = false;

      timelineSet[getId()] = this;
      this.__callbackCallTimelineStateChanged(oldState);
    } else {
      this.toCancelAtCycleBreak = false;
    }
  }

  this.playLoopSkipping = function(loopCount, repeatBehavior, msToSkip) {
    this.isLooping = true;
    this.repeatCount = loopCount;
    this.repeatBehavior = repeatBehavior;
    this.__playLoop(msToSkip);
  }
  
  this.playInfiniteLoop = function(repeatBehavior) {
    this.playLoop(-1, repeatBehavior);
  }

  this.playInfiniteLoopSkipping = function(repeatBehavior, msToSkip) {
    this.playLoopSkipping(-1, repeatBehavior, msToSkip);
  }

  this.playLoop = function(loopCount, repeatBehavior) {
    this.playLoopSkipping(loopCount, repeatBehavior, 0);
  }

  this.cancelAtCycleBreak = function() {
    this.toCancelAtCycleBreak = true;
  }

  this.cancel = function() {
    var existing = timelineSet[getId()];
    if (existing == undefined) {
      return;
    }
    delete timelineSet[getId()];
    var oldState = this.getState();
    while (this.getState() != TimelineState.IDLE) {
      this.__popState();
    }
    this.__pushState(TimelineState.CANCELLED);
    this.__callbackCallTimelineStateChanged(oldState);
    this.__popState();
    this.__callbackCallTimelineStateChanged(TimelineState.CANCELLED);
  }

  this.end = function() {
    var existing = timelineSet[getId()];
    if (existing == undefined) {
      return;
    }
    delete timelineSet[getId()];
    var oldState = timeline.getState();
    var endFraction = timeline.durationFraction;
    while (this.getState() != TimelineState.IDLE) {
      var state = this.__popState();
      if (state == TimelineState.PLAYING_FORWARD) {
        endFraction = 1;
      }
      if (state == TimelineState.PLAYING_REVERSE) {
        endFraction = 0;
      }
    }
    this.durationFraction = endFraction;
    this.timelinePosition = endFraction;
    this.__callbackCallTimelinePulse();
    this.__pushState(TimelineState.DONE);
    this.__callbackCallTimelineStateChanged(oldState);
    this.__popState();
    this.__callbackCallTimelineStateChanged(TimelineState.DONE);
  }

  this.abort = function() {
    var existing = timelineSet[getId()];
    if (existing == undefined) {
      return;
    }
    delete timelineSet[getId()];
    while (this.getState() != TimelineState.IDLE) {
      this.__popState();
    }
  }

  this.suspend = function() {
    var existing = timelineSet[getId()];
    if (existing == undefined) {
      return;
    }
    var oldState = this.getState();
    if ((oldState != TimelineState.PLAYING_FORWARD)
        && (oldState != TimelineState.PLAYING_REVERSE)
        && (oldState != TimelineState.READY)) {
      return;
    }
    this.__pushState(TimelineState.SUSPENDED);
    this.__callbackCallTimelineStateChanged(oldState);
  }

  this.resume = function() {
    var existing = timelineSet[getId()];
    if (existing == undefined) {
      return;
    }
    var oldState = this.getState();
    if (oldState != TimelineState.SUSPENDED) {
    return;
    }
    this.__popState();
    this.__callbackCallTimelineStateChanged(oldState);
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
    var properties = getProperties();
    for (var i=0; i<properties.length; i++) {
      properties[i].updateValue(this.durationFraction);
    }
  }
}

var timelineSet = {};

setInterval("globalTimerCallback()", 40);

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
        timeline.timelinePosition = 1;
        if (timeline.isLooping) {
          var stopLoopingAnimation = timeline.toCancelAtCycleBreak;
          var loopsToLive = timeline.repeatCount;
          if (loopsToLive > 0) {
            loopsToLive--;
            stopLoopingAnimation = stopLoopingAnimation || (loopsToLive == 0);
            timeline.repeatCount = loopsToLive;
          }
          if (stopLoopingAnimation) {
            // end looping animation
            hasEnded = true;
          } else {
            if (timeline.repeatBehavior == RepeatBehavior.REVERSE) {
              timeline.__replaceState(TimelineState.PLAYING_REVERSE);
              if (timeline.cycleDelay > 0) {
                timeline.__pushState(TimelineState.READY);
                timeline.timeUntilPlay = timeline.cycleDelay;
              }
              timeline.__callbackCallTimelineStateChanged(TimelineState.PLAYING_FORWARD);
            } else {
              timeline.durationFraction = 0;
              timeline.timelinePosition = 0;
              if (timeline.cycleDelay > 0) {
                timeline.__pushState(TimelineState.READY);
                timeline.timeUntilPlay = timeline.cycleDelay;
                timeline.__callbackCallTimelineStateChanged(TimelineState.PLAYING_FORWARD);
              } else {
                // it's still playing forward, but lets
                // the app code know that the new loop has begun
                timeline.__callbackCallTimelineStateChanged(TimelineState.PLAYING_FORWARD);
              }
            }
          }
        } else {
          hasEnded = true;
        }
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
        timeline.timelinePosition = 0;
        if (timeline.isLooping) {
          var stopLoopingAnimation = timeline.toCancelAtCycleBreak;
          var loopsToLive = timeline.repeatCount;
          if (loopsToLive > 0) {
            loopsToLive--;
            stopLoopingAnimation = stopLoopingAnimation || (loopsToLive == 0);
            timeline.repeatCount = loopsToLive;
          }
          if (stopLoopingAnimation) {
            // end looping animation
            hasEnded = true;
          } else {
            timeline.__replaceState(TimelineState.PLAYING_FORWARD);
            if (timeline.cycleDelay > 0) {
              timeline.__pushState(TimelineState.READY);
              timeline.timeUntilPlay = timeline.cycleDelay;
            }
            timeline.__callbackCallTimelineStateChanged(TimelineState.PLAYING_REVERSE);
          }
        } else {
          hasEnded = true;
        }
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