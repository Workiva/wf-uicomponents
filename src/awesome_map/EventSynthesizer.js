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

define(function(require) {
    'use strict';

    var BrowserInfo = require('wf-js-common/BrowserInfo');
    var CustomSwipeGesture = require('wf-js-uicomponents/awesome_map/CustomSwipeGesture');
    var DestroyUtil = require('wf-js-common/DestroyUtil');
    var DOMUtil = require('wf-js-common/DOMUtil');
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');
    var Gesture = require('wf-js-uicomponents/awesome_map/Gesture');
    var Hammer = require('hammerjs');
    var InteractionEvent = require('wf-js-uicomponents/awesome_map/InteractionEvent');
    var MouseAdapter = require('wf-js-common/MouseAdapter');
    var Observable = require('wf-js-common/Observable');
    var Utils = require('wf-js-common/Utils');

    /**
     * Module that facilitates testing dependencies, as the methods can be mocked.
     */
    var dependencies = {
        createHammerInstance: function(host) {
            /* jshint camelcase:false */
            CustomSwipeGesture.register();
            return new Hammer(host, {
                hold_threshold: 10,
                hold_timeout: 250,
                transform_min_scale: 0.05
            });
        },
        createMouseAdapter: function(host) {
            return new MouseAdapter(host);
        },
        getWindow: function() {
            return window;
        }
    };

    /**
     * Creates a new EventSynthesizer with the given configuration.
     *
     * @classdesc
     *
     * An EventSynthesizer captures all the interaction events affecting
     * the host element and normalizes them into discrete actionable events.
     *
     * @name EventSynthesizer
     * @constructor
     *
     * @param {Object} configuration
     *
     * @param {HTMLElement} configuration.host
     *        The element that hosts the event synthesizer.
     *
     * @param {boolean} [configuration.cancelMouseWheelEvents=true]
     *        Cancel mouse wheel events when handled so that browser window does not shift.
     *
     * @example
     *
     * var host = document.getElementById('host');
     * var eventSynthesizer = new EventSynthesizer({ host: host });
     * eventSynthesizer.onEventSynthesized(function(interactionEvent) { });
     */
    var EventSynthesizer = function(configuration) {
        this._validateConfiguration(configuration);

        //---------------------------------------------------------
        // Observables
        //---------------------------------------------------------

        /**
         * Observable for subscribing to interaction events.
         * @method EventSynthesizer#onEventSynthesized
         * @param {Function} callback
         *        Invoked with (source, {
         *            event: {@link InteractionEvent}
         *        })
         */
        this.onEventSynthesized = Observable.newObservable();

        //---------------------------------------------------------
        // Private properties
        //---------------------------------------------------------

        /**
         * Cancel mouse wheel events so that browser window does not shift.
         * @type {boolean}
         */
        this._cancelMouseWheelEvents = Utils.valueOr(configuration.cancelMouseWheelEvents, true);

        /**
         * The rectangle for the current host.
         * This is used to detect whether window resize events effect the host.
         * @type {Object}
         * @private
         */
        this._currentHostRect = null;

        /**
         * Collection of deferred event handlers.
         * Used to delay dispatching events emitted out of order.
         * @type {Array.<Function>}
         * @private
         */
        this._deferredEventHandlers = [];

        /**
         * Whether a drag interaction is currently in progress.
         * Necessary to defer transform events that occur during drags.
         * @type {boolean}
         * @private
         */
        this._dragging = false;

        /**
         * Handlers used to listen to events.
         * Handlers are stored in a hash of event names and handler functions.
         * @type {Object}
         * @private
         */
        this._eventHandlers = null;

        /**
         * Tracks the previous gesture in order to yield iterative event deltas.
         * @type {Gesture}
         * @private
         */
        this._lastGesture = null;

        /**
         * The hammer instance used to capture touch and mouse events.
         * @type {Hammer.Instance}
         * @private
         */
        this._hammer = null;

        /**
         * The element to watch for events.
         * @type {HTMLElement}
         * @private
         */
        this._host = configuration.host;

        /**
         * The MouseAdapter used to normalize mouse wheel events.
         * @type {MouseAdapter}
         * @private
         */
        this._mouseAdapter = null;

        /**
         * Whether a transform interaction is currently in progress.
         * Necessary to defer drag events that occur during transforms.
         * @type {boolean}
         * @private
         */
        this._transforming = false;

        //---------------------------------------------------------
        // Initialization
        //---------------------------------------------------------

        this._initialize();
    };

    EventSynthesizer.prototype = {

        //---------------------------------------------------------
        // Public properties
        //---------------------------------------------------------

        getEventHandlers: function() {
            return this._eventHandlers;
        },

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Disposes the instance.
         * @method EventSynthesizer#dispose
         */
        dispose: function() {
            var eventType;
            var handlers = this._eventHandlers;

            // Dispose observables.
            this.onEventSynthesized.dispose();

            // Remove hammer event handlers.
            for (eventType in handlers) {
                if (!/contextmenu|mouse|resize/.test(eventType)) {
                    this._hammer.off(eventType, handlers[eventType]);
                }
            }

            this._mouseAdapter.dispose();
            this._host.removeEventListener(EventTypes.MOUSE_MOVE, handlers[EventTypes.MOUSE_MOVE], false);
            this._host.removeEventListener(EventTypes.CONTEXT_MENU, handlers[EventTypes.CONTEXT_MENU], false);

            var window = dependencies.getWindow();
            window.removeEventListener('resize', handlers[EventTypes.RESIZE], false);

            // Destroy the instance.
            DestroyUtil.destroy(this);
        },

        /**
         * Measures the current host rect.
         * @method EventSynthesizer#invalidate
         */
        invalidate: function() {
            this._currentHostRect = this._measureHost();
        },

        //---------------------------------------------------------
        // Private methods
        //---------------------------------------------------------

        /**
         * Creates an interaction event.
         * @param {string} type - The EventType for the event.
         * @param {Gesture} gesture - The gesture the event represents.
         * @returns {InteractionEvent}
         * @private
         */
        _createInteractionEvent: function(type, gesture) {
            var lastGesture = this._lastGesture;
            var iterativeGesture;

            // In Firefox, when dragging/releasing outside the window,
            // the gesture target is the document, not the host.
            // Ensure we use the host for gesture targets.
            gesture.target = this._host;

            // Perform iterative calculations if we're in a multi-gesture interaction.
            // The slate is cleaned on release events.
            if (lastGesture) {
                iterativeGesture = gesture.createIterativeGesture(lastGesture);
            }
            else {
                iterativeGesture = gesture;
            }

            // Save this gesture for next time.
            this._setLastGesture(gesture);

            return new InteractionEvent(type, gesture, iterativeGesture);
        },

        /**
         * Defers the execution of the event handler.
         * NOTE: Hammer will sometimes report events out of logical order.
         * This method is used to correct the ordering of the dispatched events.
         * @param {object} event - The source event.
         * @param {Function} handler - Function that handles the event.
         * @private
         */
        _deferEvent: function(event, handler) {
            // When the event is finally emitted, don't include stale deltas.
            var gesture = Gesture.fromHammerGesture(event.gesture);
            this._setLastGesture(gesture);

            this._deferredEventHandlers.push(handler);
        },

        /**
         * Dispatches events to subscribers.
         * @param {string} type - The event type.
         * @param {Object} hammerGesture - A Hammer gesture-like object.
         * @private
         */
        _dispatchEvent: function(type, hammerGesture) {
            var gesture = Gesture.fromHammerGesture(hammerGesture);
            var event = this._createInteractionEvent(type, gesture);

            // Publish the event to subscribers.
            this.onEventSynthesized.dispatch([this, { event: event }]);

            // If this is a hammer gesture, prevent the default browser behavior.
            if (hammerGesture.preventDefault) {
                hammerGesture.preventDefault();
            }
        },

        //---------------------------------------------------------
        // getXxxHandler are called often so they wrap scope for performance.
        // It makes me cry to have to do this, but 20x operations per second
        // makes it hard to justify style over function.
        //---------------------------------------------------------

        _getContextMenuHandler: function() {
            var self = this;
            /**
             * Handler for double-tap events.
             * @param {Object} event - The source event.
             * @private
             */
            return function(event) {
                var gesture = {
                    center: {
                        pageX: event.pageX,
                        pageY: event.pageY
                    },
                    srcEvent: event.source
                };
                self._dispatchEvent(EventTypes.CONTEXT_MENU, gesture);
            };
        },

        _getDoubleTapHandler: function() {
            var self = this;
            /**
             * Handler for double-tap events.
             * @param {Object} event - The source event.
             * @private
             */
            return function(event) {
                self._dispatchEvent(EventTypes.DOUBLE_TAP, event.gesture);
            };
        },

        _getDragHandler: function() {
            var self = this;
            /**
             * Handler for drag events.
             * @param {Object} event - The source event.
             * @private
             */
            return function(event) {
                var handler = function() {
                    self._dispatchEvent(EventTypes.DRAG, event.gesture);
                };
                if (self._transforming) {
                    self._deferEvent(event, handler);
                }
                else {
                    handler();
                }
            };
        },

        _getDragEndHandler: function() {
            var self = this;
            /**
             * Handler for drag end events.
             * Yields the cumulative changes over the entire drag interaction.
             * @param {Object} event - The source event.
             * @private
             */
            return function(event) {
                var handler = function() {
                    self._dispatchEvent(EventTypes.DRAG_END, event.gesture);
                    self._dragging = false;
                };
                if (self._transforming) {
                    self._deferEvent(event, handler);
                }
                else {
                    handler();
                    self._invokeDeferredEventHandlers();
                }
            };
        },

        _getDragStartHandler: function() {
            var self = this;
            /**
             * Handler for drag start events.
             * @param {Object} event - The source event.
             * @private
             */
            return function(event) {
                var handler = function() {
                    self._dragging = true;
                    self._dispatchEvent(EventTypes.DRAG_START, event.gesture);
                };
                if (self._transforming) {
                    self._deferEvent(event, handler);
                }
                else {
                    handler();
                }
            };
        },

        _getHoldHandler: function() {
            var self = this;
            /**
             * Handler for hold events.
             * @param {Object} event - The source event.
             * @private
             */
            return function(event) {
                self._dispatchEvent(EventTypes.HOLD, event.gesture);
            };
        },

        _getMouseMoveHandler: function() {
            var self = this;
            /**
             * Handler for mouse move events.
             * @param {Object} event - The source event.
             * @private
             */
            return function(event) {
                if (self._dragging || self._transforming) {
                    return;
                }
                var gesture = {
                    center: {
                        pageX: event.pageX,
                        pageY: event.pageY
                    },
                    srcEvent: event.source
                };
                self._dispatchEvent(EventTypes.MOUSE_MOVE, gesture);
            };
        },

        _getMouseWheelHandler: function(eventType) {
            var self = this;
            /**
             * Handler for mouse wheel events.
             * @param {Object} event - The source event.
             * @private
             */
            return function(event) {
                var gesture = {
                    deltaX: event.distance.x,
                    deltaY: event.distance.y,
                    srcEvent: event.source
                };

                // Dispatch the mouse wheel.
                self._dispatchEvent(eventType, gesture);

                // Don't save the last gesture, as we're not in an interaction.
                self._lastGesture = null;

                // Prevent bubbling so the screen doesn't shift.
                if (self._cancelMouseWheelEvents) {
                    BrowserInfo.Events.cancelEvent(event.source);
                }
            };
        },

        _getReleaseHandler: function() {
            var self = this;
            /**
             * Handler for release events.
             * @param {Object} event - The source event.
             * @private
             */
            return function(event) {
                self._invokeDeferredEventHandlers();
                self._dispatchEvent(EventTypes.RELEASE, event.gesture);
                self._lastGesture = null;
            };
        },

        _getSwipeHandler: function() {
            var self = this;
            /**
             * Handler for swipe events.
             * @param {Object} event - The source event.
             * @private
             */
            return function(event) {
                var handler = function() {
                    self._dispatchEvent(EventTypes.SWIPE, event.gesture);
                };
                if (self._dragging) {
                    self._deferEvent(event, handler);
                }
                else {
                    handler();
                }
            };
        },

        _getTapHandler: function() {
            var self = this;
            /**
             * Handler for tap events.
             * @param {Object} event - The source event.
             * @private
             */
            return function(event) {
                self._dispatchEvent(EventTypes.TAP, event.gesture);
            };
        },

        _getTouchHandler: function() {
            var self = this;
            /**
             * Handler for touch events.
             * @param {Object} event - The source event.
             * @private
             */
            return function(event) {
                self._dispatchEvent(EventTypes.TOUCH, event.gesture);
            };
        },

        _getTransformHandler: function() {
            var self = this;
            /**
             * Handler for transform events.
             * @param {Object} event - The source event.
             * @private
             */
            return function(event) {
                var handler = function() {
                    self._dispatchEvent(EventTypes.TRANSFORM, event.gesture);
                };
                if (self._dragging) {
                    self._deferEvent(event, handler);
                }
                else {
                    handler();
                }
            };
        },

        _getTransformEndHandler: function() {
            var self = this;
            /**
             * Handler for transform end events.
             * @param {Object} event - The source event.
             * @private
             */
            return function(event) {
                var handler = function() {
                    self._dispatchEvent(EventTypes.TRANSFORM_END, event.gesture);
                    self._transforming = false;
                };
                if (self._dragging) {
                    self._deferEvent(event, handler);
                }
                else {
                    handler();
                    self._invokeDeferredEventHandlers();
                }
            };
        },

        _getTransformStartHandler: function() {
            var self = this;
            /**
             * Handler for transform end events.
             * @param {Object} event - The source event.
             * @private
             */
            return function(event) {
                var handler = function() {
                    self._transforming = true;
                    self._dispatchEvent(EventTypes.TRANSFORM_START, event.gesture);
                };
                if (self._dragging) {
                    self._deferEvent(event, handler);
                }
                else {
                    handler();
                }
            };
        },

        _getWindowResizeHandler: function() {
            var self = this;
            /**
             * Handler for window resize events.
             * @param {Event} event - The window resize event.
             * @private
             */
            return function(event) {
                var hostRect = self._measureHost();
                var gesture;

                if (hostRect.width !== self._currentHostRect.width ||
                    hostRect.height !== self._currentHostRect.height) {

                    self._currentHostRect = hostRect;

                    gesture = {
                        srcEvent: event,
                        target: self._host
                    };

                    self._dispatchEvent(EventTypes.RESIZE, gesture);
                }
            };
        },

        /**
         * Initializes the event synthesizer.
         * @private
         */
        _initialize: function() {
            var handlers;
            var hammer;

            this._currentHostRect = this._measureHost();

            // Initialize and track event handlers so they can be
            // inspected by property getter and removed on dispose.
            handlers = {};
            handlers[EventTypes.CONTEXT_MENU] = this._getContextMenuHandler();
            handlers[EventTypes.DOUBLE_TAP] = this._getDoubleTapHandler();
            handlers[EventTypes.DRAG] = this._getDragHandler();
            handlers[EventTypes.DRAG_END] = this._getDragEndHandler();
            handlers[EventTypes.DRAG_START] = this._getDragStartHandler();
            handlers[EventTypes.HOLD] = this._getHoldHandler();
            handlers[EventTypes.MOUSE_MOVE] = this._getMouseMoveHandler();
            handlers[EventTypes.MOUSE_WHEEL] = this._getMouseWheelHandler(EventTypes.MOUSE_WHEEL);
            handlers[EventTypes.MOUSE_WHEEL_START] = this._getMouseWheelHandler(EventTypes.MOUSE_WHEEL_START);
            handlers[EventTypes.MOUSE_WHEEL_END] = this._getMouseWheelHandler(EventTypes.MOUSE_WHEEL_END);
            handlers[EventTypes.RELEASE] = this._getReleaseHandler();
            handlers[EventTypes.RESIZE] = this._getWindowResizeHandler();
            handlers[EventTypes.SWIPE] = this._getSwipeHandler();
            handlers[EventTypes.TAP] = this._getTapHandler();
            handlers[EventTypes.TOUCH] = this._getTouchHandler();
            handlers[EventTypes.TRANSFORM] = this._getTransformHandler();
            handlers[EventTypes.TRANSFORM_END] = this._getTransformEndHandler();
            handlers[EventTypes.TRANSFORM_START] = this._getTransformStartHandler();
            this._eventHandlers = handlers;

            // Initialize hammer.
            hammer = this._hammer = dependencies.createHammerInstance(this._host);
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
            ].forEach(function(eventType) {
                hammer.on(eventType, handlers[eventType]);
            });

            // Initialize mouse event handlers.
            this._mouseAdapter = dependencies.createMouseAdapter(this._host);
            this._mouseAdapter.onMouseWheel(handlers[EventTypes.MOUSE_WHEEL]);
            this._mouseAdapter.onMouseWheelStart(handlers[EventTypes.MOUSE_WHEEL_START]);
            this._mouseAdapter.onMouseWheelEnd(handlers[EventTypes.MOUSE_WHEEL_END]);
            this._host.addEventListener(EventTypes.MOUSE_MOVE, handlers[EventTypes.MOUSE_MOVE]);

            // Handle contextmenu events.
            this._host.addEventListener('contextmenu', handlers[EventTypes.CONTEXT_MENU]);

            // Initialize the window resize handler.
            dependencies.getWindow().addEventListener('resize', handlers[EventTypes.RESIZE]);
        },

        /**
         * Invokes all the deferred event handlers.
         * NOTE: Hammer will sometimes report events out of logical order.
         * This method is used to correct the ordering of the dispatched events.
         * @private
         */
        _invokeDeferredEventHandlers: function() {
            var i = 0;
            var length = this._deferredEventHandlers.length;

            for (; i < length; i++) {
                this._deferredEventHandlers.shift().apply();
            }
        },

        /**
         * Saves the state of the last gesture in order to
         * create iterative deltas during drag and transform events.
         * @param {Gesture} gesture
         * @private
         */
        _setLastGesture: function(gesture) {
            this._lastGesture = gesture.clone();
        },

        /**
         * Ensures that the given configuration is valid.
         * @param {Object} configuration
         * @private
         */
        _validateConfiguration: function(configuration) {
            if (!configuration) {
                throw new Error('EventSynthesizer configuration is required.');
            }
            if (!configuration.host) {
                throw new Error('EventSynthesizer configuration: host is required.');
            }
        },

        /**
         * Returns the width and height even when the host is not displayed
         * @return {Object} The size of the host
         *         {Object.width} The width and height of the host
         *         {Object.height} The width and height of the host
         * @private
         */
        _measureHost: function() {
            return {
                width: DOMUtil.width(this._host),
                height: DOMUtil.height(this._host)
            };
        }
    };

    //---------------------------------------------------------
    // Static members
    //---------------------------------------------------------

    EventSynthesizer.dependencies = dependencies;

    return EventSynthesizer;
});
