/*
 * Copyright 2014 WebFilings, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

part of wUIComponents;

// TODO - Figure out Hammer and MouseAdapter Ports


// TOMTODO - Clean up
//var BrowserInfo = require('wf-js-common/BrowserInfo');
//var DestroyUtil = require('wf-js-common/DestroyUtil');
//var DOMUtil = require('wf-js-common/DOMUtil');
//var EventSource = require('wf-js-common/EventSource');
//var Hammer = require('hammerjs');
//var MouseAdapter = require('wf-js-common/MouseAdapter');
//var Observable = require('wf-js-common/Observable');
//var Utils = require('wf-js-common/Utils');

// TOMTODO - pass this in the constructor
 /// Module that facilitates testing dependencies, as the methods can be mocked.
var dependencies = {
    'createHammerInstance': (host) {
        /* jshint camelcase:false */
        CustomSwipeGesture.register();
        return new Hammer(host, {
            'hold_threshold': 10,
            'hold_timeout': 250,
            'transform_min_scale': 0.05
        });
    },
    'createMouseAdapter': (host) {
        return new MouseAdapter(host);
    },
    'getWindow': () {
        return window;
    }
};
// TOMTODO - don't do this anymore
//EventSynthesizer.dependencies = dependencies;


/**
 * Creates a new EventSynthesizer with the given configuration.
 * An EventSynthesizer captures all the interaction events affecting
 * the host element and normalizes them into discrete actionable events.
 *
 * @param {Object} configuration
 *
 * @param {HTMLElement} configuration.host
 *        The element that hosts the event synthesizer.
 *
 * @param {boolean} [configuration.cancelMouseWheelEvents=true]
 *        Cancel mouse wheel events when handled so that browser window does not shift.
 *
 * @param {boolean} [configuration.cancelTouchContextMenuEvents=true]
 *        Stop propagation and default actions of touch events that have a type of contextmenu.
 *        EventSynthesizer will still handle these type of events. Can be used together with
 *        ignoreTouchContextMenuEvents to entirely snuff this kind of event. These events
 *        are fired by Windows 8 for holds.
 *
 * @param {boolean} [configuration.ignoreTouchContextMenuEvents=true]
 *        Make the EventSynthesizer not handle touch events that have a type of contextmenu.
 *        Events will still propagate and do their default action. Can be used together with
 *        cancelTouchContextMenuEvents to entirely snuff this kind of event. Touch contextmenu
 *        events are fired by Windows 8 for holds.
 *
 * @example
 *
 * var host = document.getElementById('host');
 * var eventSynthesizer = new EventSynthesizer({ host: host });
 * eventSynthesizer.onEventSynthesized(function(interactionEvent) { });
 */
class EventSynthesizer {
  /// Observable for subscribing to interaction events.
  Stream onEventSynthesized;
  StreamController _eventSynthesizedController;
  bool _cancelMouseWheelEvents;
  bool _cancelTouchContextMenuEvents;
  /// The rectangle for the current host.
  Rectangle _currentHostRect;
  /// Collection of deferred event handlers.
  /// Used to delay dispatching events emitted out of order.
  List<Function> _deferredEventHandlers;
  /// Whether a drag interaction is currently in progress.
  /// Necessary to defer transform events that occur during drags.
  bool _dragging;
  /// Handlers used to listen to events.
  /// Handlers are stored in a hash of event names and handler functions.
  Map<Function> _eventHandlers;
  bool _ignoreTouchContextMenuEvents;
  /// Tracks the previous gesture in order to yield iterative event deltas.
  Gesture _lastGesture;
  /// The hammer instance used to capture touch and mouse events.
  var _hammer;
  HtmlElement _host;
  /// The MouseAdapter used to normalize mouse wheel events.
  MouseAdapter _mouseAdapter;
  /// Whether a transform interaction is currently in progress.
  /// Necessary to defer drag events that occur during transforms.
  bool _transforming;
  /// Used to be explicit that the event listeners are not using capture. The consistency also
  /// makes sure that we remove the same listener as we add. See
  /// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener
  bool _useCapture;


  //TOMTODO - port the constructor
  EventSynthesizer(Map configuration) {
    _validateConfiguration(configuration);

    _eventSynthesizedController = new StreamController.broadcast();
    onEventSynthesized = _eventSynthesizedController.stream;

    var handlers;
    var hammer;

    _currentHostRect = _measureHost();

    // Initialize and track event handlers so they can be
    // inspected by property getter and removed on dispose.
    handlers = {};
    handlers[EventTypes.CONTEXT_MENU] = handleContextMenu;
    handlers[EventTypes.DOUBLE_TAP] = handleDoubleTap;
    handlers[EventTypes.DRAG] = handleDrag;
    handlers[EventTypes.DRAG_END] = handleDragEnd;
    handlers[EventTypes.DRAG_START] = handleDragStart;
    handlers[EventTypes.HOLD] = handleHold;
    handlers[EventTypes.MOUSE_MOVE] = handleMouseMove;
    handlers[EventTypes.MOUSE_WHEEL] = handleMouseWheel;
    handlers[EventTypes.MOUSE_WHEEL_START] = handleMouseWheelStart;
    handlers[EventTypes.MOUSE_WHEEL_END] = handleMouseWheelEnd;
    handlers[EventTypes.MS_HOLD_VISUAL] = handleMsHoldVisual;
    handlers[EventTypes.RELEASE] = handleRelease;
    handlers[EventTypes.RESIZE] = handleWindowResize;
    handlers[EventTypes.SWIPE] = handleSwipe;
    handlers[EventTypes.TAP] = handleTap;
    handlers[EventTypes.TOUCH] = handleTouch;
    handlers[EventTypes.TRANSFORM] = handleTransform;
    handlers[EventTypes.TRANSFORM_END] = handleTransformEnd;
    handlers[EventTypes.TRANSFORM_START] = handleTransformStart;
    _eventHandlers = handlers;

    // Initialize hammer.
    hammer = _hammer = dependencies.createHammerInstance(_host);
    [
        EventTypes.DOUBLE_TAP,
        EventTypes.DRAG,
        EventTypes.DRAG_END,
        EventTypes.DRAG_START,
        EventTypes.HOLD,
        EventTypes.RELEASE,
        EventTypes.SWIPE,
        EventTypes.TAP,
        EventTypes.TOUCH,
        EventTypes.TRANSFORM,
        EventTypes.TRANSFORM_END,
        EventTypes.TRANSFORM_START
    ].forEach((eventType) {
        hammer.on(eventType, handlers[eventType]);
    });

    // Initialize mouse event handlers.
    _mouseAdapter = dependencies.createMouseAdapter(_host);
    _mouseAdapter.onMouseWheel(handlers[EventTypes.MOUSE_WHEEL]);
    _mouseAdapter.onMouseWheelStart(handlers[EventTypes.MOUSE_WHEEL_START]);
    _mouseAdapter.onMouseWheelEnd(handlers[EventTypes.MOUSE_WHEEL_END]);
    _host.addEventListener(EventTypes.MOUSE_MOVE, handlers[EventTypes.MOUSE_MOVE], _useCapture);

    // Handle contextmenu events.
    _host.addEventListener('contextmenu', handlers[EventTypes.CONTEXT_MENU], _useCapture);

    _host.addEventListener(EventTypes.MS_HOLD_VISUAL,
        handlers[EventTypes.MS_HOLD_VISUAL], _useCapture);

    // Initialize the window resize handler.
    dependencies.getWindow().addEventListener('resize', handlers[EventTypes.RESIZE], _useCapture);
  }

  Map get getEventHandlers => _eventHandlers;

  void dispose() {
    var eventType;

    // Remove hammer event handlers.
    for (eventType in _eventHandlers) {
        if (!/contextmenu|mouse|resize/.test(eventType)) {
            _hammer.off(eventType, handlers[eventType]);
        }
    }

    _mouseAdapter.dispose();
    _host.removeEventListener(EventTypes.MOUSE_MOVE, _eventHandlers[EventTypes.MOUSE_MOVE], _useCapture);
    _host.removeEventListener(EventTypes.CONTEXT_MENU, _eventHandlers[EventTypes.CONTEXT_MENU], _useCapture);
    _host.removeEventListener(EventTypes.MS_HOLD_VISUAL, _eventHandlers[EventTypes.MS_HOLD_VISUAL], _useCapture);

    // TOMTODO
    var window = dependencies.getWindow();
    window.removeEventListener('resize', handlers[EventTypes.RESIZE], _useCapture);

  }

  // TOMTODO - explore the naming of this method  How does getting the new host rect invalidate?
  invalidate() {
      _currentHostRect = _measureHost();
  }

  InteractionEvent _createInteractionEvent(String type, Gesture gesture) {
    var lastGesture = _lastGesture;
    var iterativeGesture;

    // In Firefox, when dragging/releasing outside the window,
    // the gesture target is the document, not the host.
    // Ensure we use the host for gesture targets.
    gesture.target = _host;

    // Perform iterative calculations if we're in a multi-gesture interaction.
    // The slate is cleaned on release events.
    if (lastGesture) {
        iterativeGesture = gesture.createIterativeGesture(lastGesture);
    } else {
        iterativeGesture = gesture;
    }

    // Save this gesture for next time.
    _setLastGesture(gesture);

    return new InteractionEvent(type, gesture, iterativeGesture);
  }

  /// Defers the execution of the event handler.
  /// NOTE: Hammer will sometimes report events out of logical order.
  /// This method is used to correct the ordering of the dispatched events.
  void _deferEvent(event, Function handler) {
    // When the event is finally emitted, don't include stale deltas.
    var gesture = new Gesture.fromHammerGesture(event.gesture);
    _setLastGesture(gesture);

    _deferredEventHandlers.add(handler);
  }

  void _dispatchEvent(String type, HammerGesture hammerGesture) {
    var gesture = Gesture.fromHammerGesture(hammerGesture);
    var event = _createInteractionEvent(type, gesture);

    // Publish the event to subscribers.
    _eventSynthesizedController.add({ 'event': event });

    // If this is a hammer gesture, prevent the default browser behavior.
    if (hammerGesture.preventDefault) {
        hammerGesture.preventDefault();
    }
  }

  void handleContextMenu(event) {
    if (EventSource.isTouch(event) && _cancelTouchContextMenuEvents) {
      BrowserInfo.Events.cancelEvent(event);
    }

    if (EventSource.isTouch(event) && _ignoreTouchContextMenuEvents) {
      return;
    }

    Gesture gesture = new Gesture(
      center: new Point(event.pageX, event.pageY),
      source: event
    );
    _dispatchEvent(EventTypes.CONTEXT_MENU, gesture);
  }

  void handleDoubleTap(event) {
    _dispatchEvent(EventTypes.DOUBLE_TAP, event.gesture);
  }

  void handleDrag(event) {
    void handler() {
        _dispatchEvent(EventTypes.DRAG, event.gesture);
    };
    if (_transforming) {
        _deferEvent(event, handler);
    } else {
        handler();
    }
  }

  /// Yields the cumulative changes over the entire drag interaction.
  void handleDragEnd(event) {
    void handler() {
        _dispatchEvent(EventTypes.DRAG_END, event.gesture);
        _dragging = false;
    };
    if (_transforming) {
        _deferEvent(event, handler);
    } else {
        handler();
        _invokeDeferredEventHandlers();
    }
  }

  void handleDragStart(event) {
   void handler() {
        _dragging = true;
        _dispatchEvent(EventTypes.DRAG_START, event.gesture);
    };
    if (_transforming) {
        _deferEvent(event, handler);
    } else {
        handler();
    }
  }

  void handleHold(event) {
    _dispatchEvent(EventTypes.HOLD, event.gesture);
  }

  void handleMouseMove(event) {
    if (_dragging || _transforming) {
        return;
    }
    var gesture = {
        center: {
            pageX: event.pageX,
            pageY: event.pageY
        },
        srcEvent: event
    };
    _dispatchEvent(EventTypes.MOUSE_MOVE, gesture);
  }

  void _mouseWheelHandler(String eventType, event) {
    var gesture = {
        deltaX: event.distance.x,
        deltaY: event.distance.y,
        srcEvent: event.source // Event.source because this is a normalized event from MouseAdapter.
    };

    // Dispatch the mouse wheel.
    _dispatchEvent(eventType, gesture);

    // Don't save the last gesture, as we're not in an interaction.
    _lastGesture = null;

    // Prevent bubbling so the screen doesn't shift.
    if (_cancelMouseWheelEvents) {
        BrowserInfo.Events.cancelEvent(event.source);
    }
  }

  void handleMouseWheel(event) {
    _mouseWheelHandler(EventTypes.MOUSE_WHEEL, event);
  }
  void handleMouseWheelStart(event) {
    _mouseWheelHandler(EventTypes.MOUSE_WHEEL_START, event);
  }
  void handleMouseWheelEnd(event) {
    _mouseWheelHandler(EventTypes.MOUSE_WHEEL_END, event);
  }

  void handleMsHoldVisual(event) {
    if (_cancelTouchContextMenuEvents) {
        // Prevent the Windows "box hint" that appears during a hold.
        event.preventDefault();
    }
  }

  void handleRelease(event) {
    _invokeDeferredEventHandlers();
    _dispatchEvent(EventTypes.RELEASE, event.gesture);
    _lastGesture = null;
  }

  void handleSwipe(event) {
    void handler() {
        _dispatchEvent(EventTypes.SWIPE, event.gesture);
    };
    if (_dragging) {
        _deferEvent(event, handler);
    } else {
        handler();
    }
  }

  void handleTap(event) {
    _dispatchEvent(EventTypes.TAP, event.gesture);
  }

  void handleTouch(event) {
    _dispatchEvent(EventTypes.TOUCH, event.gesture);
  }

  void handleTransform(event) {
    void handler() {
        _dispatchEvent(EventTypes.TRANSFORM, event.gesture);
    };
    if (_dragging) {
        _deferEvent(event, handler);
    } else {
        handler();
    }
  }

  void handleTransformEnd(event) {
    void handler() {
        _dispatchEvent(EventTypes.TRANSFORM_END, event.gesture);
        _transforming = false;
    };
    if (_dragging) {
        _deferEvent(event, handler);
    } else {
        handler();
        _invokeDeferredEventHandlers();
    }
  }

  void handleTransformStart(event) {
    void handler() {
        _transforming = true;
        _dispatchEvent(EventTypes.TRANSFORM_START, event.gesture);
    };
    if (_dragging) {
        _deferEvent(event, handler);
    } else {

        handler();
    }
  }

  void handleWindowResize(event) {
    var hostRect = _measureHost();
    var gesture;

    if (hostRect.width != _currentHostRect.width ||
        hostRect.height != _currentHostRect.height) {

        _currentHostRect = hostRect;

        gesture = {
            'srcEvent': event,
            'target': _host
        };

        _dispatchEvent(EventTypes.RESIZE, gesture);
    }
  }

  /// Invokes all the deferred event handlers.
  /// NOTE: Hammer will sometimes report events out of logical order.
  /// This method is used to correct the ordering of the dispatched events.
  void _invokeDeferredEventHandlers() {
      var i = 0;
      var length = _deferredEventHandlers.length;

      for (; i < length; i++) {
          Function.apply(_deferredEventHandlers.removeAt(0), []);
      }
  }

  /// Saves the state of the last gesture in order to
  /// create iterative deltas during drag and transform events.
  _setLastGesture(Gesture gesture) {
      _lastGesture = gesture.clone();
  }

  /**
   * Ensures that the given configuration is valid.
   */
  void _validateConfiguration(Map configuration) {
    if (configuration == null) {
        throw new ArgumentError('EventSynthesizer configuration is required.');
    }
    if (configuration['host'] == null) {
        throw new ArgumentError('EventSynthesizer configuration: host is required.');
    }
  }

  Rectangle _measureHost() => _host.getBoundingClientRect();
}
