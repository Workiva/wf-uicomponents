WebFilings JavaScript UI Components
===================================

> UI components that support a rich HTML5 user experience. _Optimized for mobile!_

Components
-----------------------------------

#### {@link AwesomeMap}

The AwesomeMap defines a viewport that supports direct interactions via touch and mouse,
and simulated interactions view its public API.
Available interactions include panning, swiping and zooming.

An AwesomeMap is also highly extensible through the use of interceptors.
Interceptors subscribe to events in the AwesomeMap and modify transformations
before they are executed, making it easy to encapsulate transformation behavior.
There are three interceptors provided out of the box:

- **BoundaryInterceptor**: Restricts panning of content to the viewport boundaries.
- **ScaleInterceptor**: Restricts zooming of content to specified scale limits.
- **SwipeInterceptor**: Animates a swipe when swipe events are transformed.

#### {@link ScrollList}

The ScrollList renders a virtualized list of items in its host element.
The list can be scrolled and zoomed using both touch and mouse interactions
or via methods on instances of the object.
