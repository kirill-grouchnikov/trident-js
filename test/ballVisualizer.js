var visDotCount = 0;

function TimelineVisualizerDot(x, y) {
  this.alpha = 1;
  this.x = x;
  this.y = y;
  this.id = visDotCount++;

  this.draw = function(ctx, w, h) {
    ctx.beginPath();
    ctx.arc(this.x * w, this.y * h, 3, 0, 360, false);
    var a = (this.alpha < 0.5) ? 2 * this.alpha : 2 * (1 - this.alpha);
    ctx.fillStyle = "rgba(0, 200, 40, " + a + ")";  
    ctx.fill();
  }
}

function TimelineVisualizer() {
  this.dots = {}
  this.timelines = {}
  var that = this;

  function deleteDot(dot) {
    delete that.dots[dot.id];
    delete that.timelines[dot.id];
  }

  this.addDot = function(absoluteTimelinePosition, perceivedTimelinePosition) {
    var dot = new TimelineVisualizerDot(absoluteTimelinePosition,
      perceivedTimelinePosition);

    var dotTimeline = new Timeline(dot);
    dotTimeline.addPropertiesToInterpolate([
      // interpolate the ball Y position
      { property: "alpha", from: 0, to: 1, 
        interpolator: new FloatPropertyInterpolator() }
    ]);
    dotTimeline.addCallbacks([
      { onTimelineStateChanged: 
          function(oldState, newState, durationFraction, timelinePosition) {
            if (newState == TimelineState.DONE) {
              deleteDot(dot);
            }
      } }
    ]);
    this.dots[dot.id] = dot;
    this.timelines[dot.id] = dotTimeline;
    dotTimeline.duration = 2000;
    dotTimeline.play();
  }

  this.draw = function(ctx, w, h) {
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0,0,w,h);
    var size = 0;
    for (var dotId in this.dots) {
      var dot = this.dots[dotId];
      dot.draw(ctx, w, h);
      size++;
    }
  }
}