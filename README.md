#Hello world

**Timeline** is the most important concept in Trident.js. Most often you
use a timeline to change one or more properties of some object over a
certain period of time. Here is a simple example:

    <span id="span" style="color:rgb(0,0,255)" 
      onmouseover="rolloverTimeline.play();" 
      onmouseout="rolloverTimeline.playReverse();">Some text</span>

    <script>
      var rolloverTimeline = new Timeline(span.style);
      rolloverTimeline.addPropertiesToInterpolate([
        // interpolate the foreground color between blue and red
        { property: "color", from: "rgb(0,0,255)", to: "rgb(255,0,0)", 
          interpolator: new RGBPropertyInterpolator()},
        // interpolate the background color between white and light yellow
        { property: "backgroundColor", from: "rgb(255,255,255)", to: "rgb(255,255,200)", 
          interpolator: new RGBPropertyInterpolator()}
      ]);
      // over the period of 2 seconds
      rolloverTimeline.duration = 2000;
    </script>

Here, a timeline is created to interpolate the **color** and **backgroundColor**
attributes of the **span.style** object over a period of two seconds (2,000 milliseconds).
The timeline is *play()*ed when the mouse is moved over the **span** element,
and *playReverse()*ed when the mouse is moved out of the **span** element. This
implements a simple rollover effect that is reversed automatically when the mouse
is moved quickly over and out of this element.

A **timeline pulse** is the point where the timeline "wakes up" and changes the values of 
all registered attributes. The values are changed based on how much time has passed since 
the timeline has started playing. There is no guarantee how many pulses the specific
timeline will have, and how much time will pass between each successive pair of pulses.
This depends on the current system load and the specific implementation of the runtime.

The three basic timeline concepts illustrated in this sample are:

- A timeline is associated with an object.
- A timeline interpolates values of object attributes.
- The attributes are modified at timeline pulses.