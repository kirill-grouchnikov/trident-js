Trident.js is a Javascript animation library available under BSD license.

#Hello world

*Timeline* is the most important concept in Trident.js. Most often you
use a timeline to change one or more properties of some object over a
certain period of time. Here is a simple example:

    &lt;span id="span" style="color:rgb(0,0,255)" 
      onmouseover="rolloverTimeline.play();" 
      onmouseout="rolloverTimeline.playReverse();"&gt;Some text&lt;/span&gt;

    &lt;script&gt;
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
    &lt;/script&gt;

Here, a timeline is created to interpolate the *color* and *backgroundColor*
attributes of the *span.style* object over a period of two seconds (2,000 milliseconds).
The timeline is *play()*ed when the mouse is moved over the *span* element,
and *playReverse()*ed when the mouse is moved out of the *span* element. This
implements a simple rollover effect that is reversed automatically when the mouse
is moved quickly over and out of this element.
