##Hello world

**Timeline** is the most important concept in Trident.js. Most often you
use a timeline to change one or more attributes of some object over a
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
timeline will have or how much time will pass between each successive pair of pulses.
This depends on the current system load and the specific implementation of the runtime
environment.

The three basic timeline concepts illustrated in this sample are:

- A timeline is associated with an object.
- A timeline interpolates values of object attributes.
- The attributes are modified at timeline pulses.

##Timeline lifecycle
###Timeline states

A timeline goes through different **timeline states**. The *TimelineState* enumerates all 
possible timeline states, with the basic ones being:

- **Idle** for timelines that are not playing. A timeline is idle when it's been 
created but not played, or after it has finished playing
- **Playing forward** for timelines that interpolate fields from start value to end value.
- **Playing reverse** for timelines that interpolate fields from end value to start value.
- **Done** for timelines that have finished playing. A done timeline becomes idle 
after notifying all listeners (see below).

###Playing timelines

When the timeline is created, it is in the **idle** state. An idle timeline can be 
configured by the application code - even after it has finished playing. The configuration 
includes adding properties to interpolate, changing the initial delay and duration, 
adding callbacks and changing the ease function.

To start playing a timeline use the <code>Timeline.play()</code> method. At every pulse 
the timeline will interpolate all registered properties (using the public setters), 
as well as notify all registered callbacks. If the timeline is already playing, it 
will continue playing from the **same point**.

Some scenarios required playing the timeline **in reverse**. In the Hello World example 
we wanted to animate the span foreground from blue to red when the mouse moves over it - 
this is done in the <code>onmouseover</code> handler. To provide consistent UI behavior, 
we also want to animate the foreground color from red back to blue when the mouse is 
moved away from the span - this is done by calling the <code>Timeline.playReverse()</code> 
in the <code>onmouseout</code> handler.

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

Suppose the user moves the mouse over the element and then quickly moves it away. You do not 
want to have the reverse play start from the end value (full red color) - this will create a 
noticeable color flicker on the screen. Internally, <code>playReverse()</code> detects that 
this timeline is already playing (forward), and starts playing it in reverse from its 
**current position**. 

###Replaying timelines

While <code>play()</code> and <code>playReverse()</code> respect the current timeline 
position for already playing timelines, some scenarios require restarting the timeline. 
The <code>Timeline.replay()</code> and <code>Timeline.replayReverse()</code> can be used in 
these cases. Code example below shows the <code>replay()</code> API used to restart the rollover 
animation that interpolates the background color of a single grid rectangle from yellow to black color:

    function SnakeRectangle() {
      this.backgroundColor = "rgb(0,0,0)";
      this.isRollover = false;

      // rollover timeline interpolates the BG color from yellow to black
      this.rolloverTimeline = new Timeline(this);
      this.rolloverTimeline.addPropertiesToInterpolate([
        { property: "backgroundColor", from: "rgb(255,255,0)", to: "rgb(0,0,0)", 
          interpolator: new RGBPropertyInterpolator()} ]);
      this.rolloverTimeline.duration = 2500;

      this.setRollover = function(isRollover) {
        if (this.isRollover == isRollover) {
          return;
        }
        this.isRollover = isRollover;
        // replay the rollover timeline when the flag is set to true
        if (this.isRollover) {
          this.rolloverTimeline.replay();
        }
      }
    }

###Looping timelines
While most timelines need to play only once, some application scenarios require 
running timelines in loop. Pulsating the notification bar to indicate new messages 
or showing an indefinite progress while your application connects over a slow 
line are examples of looping timelines. 

Looping timelines are created and configured in exactly the same way as regular 
timelines, and they can interpolate one or more attributes of the associated 
main timeline object. The only difference is the way the looping timeline is played.
There are two <code>Timeline</code> methods to start playing a looping timeline:

- <code>Timeline.playInfiniteLoop(RepeatBehavior)</code>
- <code>Timeline.playLoop(count, RepeatBehavior)</code>

The first method starts an infinite loop (at least until the timeline is canceled). 
The second method runs the timeline for the specified number of loops. The 
<code>RepeatBehavior</code> specifies what happens when the looping timeline reaches the 
"end" of the loop. Each timeline loop changes the internal **duration fraction** 
which is a number between 0.0 and 1.0. While a regular 
timeline ends once the fraction reaches the value 1.0, a looping timeline 
continues. The difference between the repeat behaviors is in the way the timeline 
fraction is computed: 

- In the **loop** mode the timeline fraction starts from 0.0, is 
interpolated to 1.0, and once that value is reached, it is reset 
back to 0.0.
- In the **reverse** mode, the timeline fraction is interpolated during 
odd loops from 0.0 to 1.0, and is interpolated during 
even loops from 1.0 down to 0.0.

As an example, the loop mode can be used for circular indefinite progress indication, 
where the matching "lead" angle is interpolated between 0 and 360 degrees. The reverse 
mode can be used for displaying indefinite linear progress indication that oscillates 
between the left and right markers.

###Additional timeline operations
A timeline can be put in the **suspended** state by calling the <code>Timeline.suspend()</code> 
method. A suspended timeline can be resumed with the <code>Timeline.resume()</code> method.

In some cases you will want to stop a running timeline. There are three different APIs that 
you can use, each with its own semantics:

- <code>Timeline.abort()</code>. The timeline transitions to the **idle** state. No application 
callbacks or field interpolations are done.
- <code>Timeline.end()</code>. The timeline transitions to the **done** state, with the timeline 
position set to 0.0 or 1.0 - based on the direction of the timeline. After application callbacks 
and field interpolations are done on the **done** state, the timeline transitions to the **idle** 
state. Application callbacks and field interpolations are done on this state as well.
- <code>Timeline.cancel()</code>. The timeline transitions to the **cancelled** state, preserving 
its current timeline position. After application callbacks and field interpolations are done on 
the **cancelled** state, the timeline transitions to the **idle** state. Application callbacks 
and field interpolations are done on this state as well.

In addition, there is a method to indicate that a looping timeline should stop once it 
reaches the end of the loop. For example, suppose that you have a pulsating animation of 
a notification bar to indicate unread messages. Once the message is read, this animation is 
canceled in the application code. However, immediate cancellation of the pulsating animation 
may result in jarring visuals, especially if it is done at the "peak" of the pulsation cycle. 
Calling <code>Timeline.cancelAtCycleBreak()</code> method will indicate that the looping 
animation should stop once it reaches the end of the loop.

###Tracking timeline state
Simple application scenarios create timelines, configure them with attributes to interpolate 
and then play them. However, a more complicated application logic may require tracking the 
state changes of the timeline. The <code>Timeline.addEventListener</code> API allows 
registering the following listener types:

- <code>addEventListener("onstatechange", function(timeline, oldState, newState, durationFraction, timelinePosition))</code>.
This listener will be called whenever the **timeline state** is changed. For example, calling 
<code>Timeline.suspend()</code> will notify all the registered listeners that the timeline 
has changed its state from **playing** to **suspended**.
- <code>addEventListener("onpulse", function(timeline, durationFraction, timelinePosition))</code>.
This listener will be called on every **timeline pulse**. 

##Additional configuration
###Timeline duration

By default, a Trident.js timeline runs for 500 milliseconds. To change the default timeline 
duration change the <code>duration</code> attribute, setting the required duration in milliseconds. 
At runtime, the timeline interpolates all registered properties and notifies all registered 
listeners. Note that while the number of timeline pulses is directly proportional to the timeline 
duration, the actual number of pulses, as well as the intervals between each successive pair 
of pulses depends on the current load of the system and the runtime environment. As such, the 
application code **must not** make any assumptions about when the timeline pulses will happen, and how many pulses will happen throughout the duration of the timeline.

The <code>Timeline.initialDelay</code> attribute specifies the number of milliseconds the timeline 
should wait after the application code to <code>play()</code> before starting firing the timeline 
pulses. For a timeline with no initial delay, the following lifecycle events are fired:

- **idle** -> **ready** immediately after call to <code>Timeline.play()</code>
- **ready** -> ** playing forward** immediately afterwards

For a timeline with non-zero delay, the following events are fired:

- **idle** -> **ready** immediately after call to <code>Timeline.play()</code>
- **ready** -> ** playing forward** after the specified initial delay has passed

###Timeline position

Each timeline pulse has two associated fractional values - **duration fraction** and 
**timeline position**. Duration fraction is a number between 0.0 and 
1.0 that indicates the absolute percentage of the full timeline duration 
that has passed. For example, in a timeline that lasts 500 ms, a timeline pulse happening 
200 ms after the timeline has begun has the associated duration fraction of 0.4.

However, some application scenarios require non-linear rate of change for recreating 
realistic animations of the real physical world. For example, if your application timeline 
is interpolating the <code>Y</code> location of a falling ball, strict linear interpolation 
will result in overly artificial movement. When objects in the real world move, they don't 
move at constant speed. For example, a car starts from zero velocity, accelerates to a 
constant speed, maintains it throughout the main part of the movement and then decelerates 
to zero velocity as it reaches its final location.

The **timeline position** is a fractional number between 0.0 and 1.0 
that indicates how far the timeline has progressed based on the current **ease function**. 
The ease function takes the linearly increasing duration fraction and translates it to the 
matching timeline position. The <code>Timeline.ease</code> attribute can be modified to specify 
a custom ease function on the timeline. It should be have a <code>map()</code> function that gets
a duration fraction as a float and returns the matching timeline position.

The core library provides a number ease functions. To illustrate the difference between the 
different ease functions, we will use the core <code>SplineEase</code> ease function. The 
following screenshot shows the mapping between duration fraction and timeline position 
under <code>SplineEase(0.4, 0.0, 0.6, 1.0)</code>:

![ease40!](http://github.com/kirillcool/trident-js/raw/master/img/ease-40.png)

Here, the timeline position has almost linear rate of change throughout the entire duration 
of the timeline, with little acceleration in the beginning, and little deceleration at the 
end. Here is the mapping between duration fraction and timeline position under 
<code>SplineEase(0.8, 0.0, 0.2, 1.0)</code>:

![ease80!](http://github.com/kirillcool/trident-js/raw/master/img/ease-80.png)

Here, the acceleration phase is longer, and the rate of change between the acceleration 
and deceleration phases is higher. As you can see, you can simulate different physical 
processes using different factors of <code>SplineEase</code> ease function. Application code 
can create custom implementation of the ease function as well.

###Putting it all together

Interpolation of field values for fields registered for the specific timeline is done 
based on the **timeline position** and not duration fraction. Application callbacks registered 
with the <code>Timeline.addEventListener</code> method get both values on every timeline
pulse or state change. This provides the application logic with the information how much 
time has passed since the timeline has started, as well as how far along the timeline 
is based on its ease method.

##Key frames

The sample Hello World code shown above interpolates foreground and background colors
of an HTML span between two colors. What if you want to animate a specific color attribute
from yellow to green, and then to black? One option is to create two timelines, one to animate 
from yellow to green, and another to animate from green to black. Since the second timeline 
needs to wait until the first one ends, you will have to either use the timeline callbacks, or 
create a sequential timeline scenario (see later in the documentation).

However, there is a simpler solution for interpolating the value of a specific attribute between 
more than two values - **key frames**. A key frame defines the value of the field at the particular 
timeline duration fraction (**not** timeline position). Let's see an example.

![progressindication!](http://github.com/kirillcool/trident-js/raw/master/img/progressindication.png)

The bluish highlighter moves from left to right, fading in as it appears on the left edge, and 
fading out as it disappears on the right edge. There are two attributes that control the appearance 
of the highlighter:

- **xPosition** - interpolated between the left X and the right X.
- **alpha** - starts at 0.0, goes to 1.0 at 30% of the timeline duration, stays at 1.0 until the timeline reaches its 70% mark and then goes back to 0.0

Here is the matching timeline definition - note the **goingThrough** mapping:

    progressTimeline.addPropertiesToInterpolate([
      { property: "xPosition", from: startX, to: endX, interpolator: new IntPropertyInterpolator()},
      { property: "alpha", 
          goingThrough: { 0: 0.0, 0.3: 1.0, 0.7:1.0, 1: 0.0}, 
          interpolator: new FloatPropertyInterpolator()}
    ]);

##Timeline scenarios
**Timeline scenario** allows combining multiple timelines in a parallel, sequential 
or custom order. To create a timeline scenario, use the following APIs of 
the <code>TimelineScenario</code> class:

- <code>addScenarioActor(actor)</code> adds the specified actor (timeline)
- <code>addDependency(actor, [waitFor])</code> specifies the dependencies between the actors (timelines)

If there are no dependencies between the scenario actors, calling <code>TimelineScenario.play()</code>
will start playing all the scenario timelines at the same time (respecting the individual settings
such as initial delay, duration etc.)

The <code>TimelineScenario.addDependency</code> can be used to specify ordering between
timelines. The simplest example is a *sequential* scenario where the timelines are run one
after another: the first timeline starts, the second one waits for it to complete and then starts
and so on.

A more complex example is a *rendezvous* scenario. Here, the timelines are played in "stages".
Once all the timelines in stage N have completed, the timelines in stage N+1 start playing (in parallel).
Finally, you can also create a completely custom graph of dependencies. Just make sure that 
you don't have any loops. For example, a loop of size 2 would have timeline A depending 
on timeline B and timeline B depending on timeline A. Such a scenario will never complete.
