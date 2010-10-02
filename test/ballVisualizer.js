var visDotCount = 0;
var extraVerticalPadding = 0.2;
var extraHorizontalPadding= 10;

function TimelineVisualizerDot(x, y) {
  this.alpha = 1;
  this.x = x;
  this.y = y;
  this.id = visDotCount++;

  this.draw = function(ctx, w, h) {
    if (this.alpha < 1e-5) {
      return;
    }
    ctx.beginPath();
    var vPadding = parseInt(h * extraVerticalPadding);
    ctx.arc(extraHorizontalPadding + this.x * (w - 2 * extraHorizontalPadding), 
      vPadding + this.y * (h - 2 * vPadding), 3, 0, 360, false);
    ctx.fillStyle = "rgba(0, 200, 40, " + this.alpha + ")";  
    ctx.fill();
  }
}

function TimelineVisualizer(graphicsLib) {
  this.dots = {}
  this.timelines = {}
  this.graphicsLib = graphicsLib;
  this.ease = undefined;
  var that = this;

  this.setEase = function(_ease) {
    this.ease = _ease;
  }

  function deleteDot(dot) {
    delete that.dots[dot.id];
    delete that.timelines[dot.id];
  }

  this.addDot = function(absoluteTimelinePosition, perceivedTimelinePosition) {
    var dot = new TimelineVisualizerDot(absoluteTimelinePosition,
      perceivedTimelinePosition);

    var dotTimeline = new Timeline(dot);
    dotTimeline.addPropertiesToInterpolate([
      { property: "alpha",
        goingThrough: { 0: 0, 0.8: 1, 1: 0},
        interpolator: new FloatPropertyInterpolator() }
    ]);
    dotTimeline.addEventListener("onstatechange", 
      function(timeline, oldState, newState, durationFraction, timelinePosition) {
        if (newState == TimelineState.DONE) {
          deleteDot(dot);
        }
      }
    );
    this.dots[dot.id] = dot;
    this.timelines[dot.id] = dotTimeline;
    dotTimeline.duration = 2000;
    dotTimeline.play();
  }

  this.draw = function(ctx, w, h) {
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0,0,w,h);

    var vPadding = parseInt(h * extraVerticalPadding);
    ctx.strokeStyle = "rgba(0, 200, 40, 0.2)";
    ctx.beginPath();
    ctx.moveTo(0,vPadding);
    ctx.lineTo(w,vPadding);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0,h-vPadding);
    ctx.lineTo(w,h-vPadding);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(extraHorizontalPadding,0);
    ctx.lineTo(extraHorizontalPadding,h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w-extraHorizontalPadding,0);
    ctx.lineTo(w-extraHorizontalPadding,h);
    ctx.stroke();
    
    if (this.ease != undefined) {
      ctx.strokeStyle="rgba(0, 40, 200, 0.7)";
      var pts = [];
      var index = 0;
      for (var i=0; i<=100; i++) {
        var x = i / 100.0;
        pts[index++] = extraHorizontalPadding + x * (w - 2 * extraHorizontalPadding);
        pts[index++] = vPadding + this.ease.map(x) * (h - 2 * vPadding);
      }
      ctx.beginPath();
      this.graphicsLib.cardinalSpline(ctx, pts, 0.1, false);
      ctx.stroke();
    }

    var size = 0;
    for (var dotId in this.dots) {
      var dot = this.dots[dotId];
      dot.draw(ctx, w, h);
      size++;
    }
  }
}