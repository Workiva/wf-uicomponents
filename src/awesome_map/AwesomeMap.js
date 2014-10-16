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

    var _ = require('lodash');
    var DestroyUtil = require('wf-js-common/DestroyUtil');
    var DOMUtil = require('wf-js-common/DOMUtil');
    var EventSynthesizer = require('wf-js-uicomponents/awesome_map/EventSynthesizer');
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');
    var InteractionSimulator = require('wf-js-uicomponents/awesome_map/InteractionSimulator');
    var Observable = require('wf-js-common/Observable');
    var TransformationQueue = require('wf-js-uicomponents/awesome_map/TransformationQueue');
    var TransformState = require('wf-js-uicomponents/awesome_map/TransformState');
    var TransformUtil = require('wf-js-uicomponents/awesome_map/TransformUtil');

    /**
     * Create a new AwesomeMap with the given configuration.
     *
     * @classdesc
     *
     * An AwesomeMap provides touch-enabled panning and zooming of content
     * via a transformation plane set within a clipping container (aka viewport).
     *
     * @name AwesomeMap
     * @constructor
     *
     * @param {HTMLElement} host
     *        The HTMLElement that hosts the AwesomeMap.
     *        NOTE: Ensure that the host has "position: relative|absolute",
     *        otherwise various dimension measurements will fail.
     *
     * @param {boolean} [options.cancelMouseWheelEvents=true]
     *        Cancel wheel events so that the browser hosting the map doesn't
     *        bounce when attempting to scroll with a mouse.
     *
     * @param {boolean} [options.touchScrollingEnabled=true]
     *        When touch scrolling is enabled, dragging and swiping will scroll
     *        the list and pan items. When disabled, the following events have
     *        no effect: drag, swipe, dragstart, dragend
     *
     * @example <caption>Simple Instantiation</caption>
     *
     * // AwesomeMap will provide unlimited panning and zooming by default.
     * var awesomeMap = new AwesomeMap({
     *     host: document.getElementById('host')
     * });
     *
     * @example <caption>Observing Events</caption>
     *
     * // AwesomeMaps expose a number of events that you can observe.
     * var awesomeMap = new AwesomeMap(document.getElementById('host'));
     * awesomeMap.onInteraction(function(sender, args) { });
     * awesomeMap.onInteractionStarted(function(sender, args) { });
     * awesomeMap.onInteractionFinished(function(sender, args) { });
     * awesomeMap.onScaleChanged(function(sender, args) { });
     * awesomeMap.onTransformStarted(function(sender, args) { });
     * awesomeMap.onTransformFinished(function(sender, args) { });
     * awesomeMap.onTranslationChanged(function(sender, args) { });
     *
     * @example <caption>Registering Interceptors</caption>
     *
     * // Interceptors conveniently wrap observable subscriptions into reusable behaviors.
     * // See {@link InterceptorMixin} for more information.
     * //
     * // The following AwesomeMap provides common behavior using interceptors:
     * // - {@link SwipeInterceptor} translates swipe gestures into a transformation
     * // - {@link ScaleInterceptor} limits the scale of the content to a minimum and maximum
     * // - {@link BoundaryInterceptor} applies viewport boundary constraints to the content
     * var awesomeMap = new AwesomeMap(document.getElementById('host'));
     * awesomeMap.addInterceptor(new SwipeInterceptor());
     * awesomeMap.addInterceptor(new ScaleInterceptor({ minimum: 1, maximum: 5 }));
     * awesomeMap.addInterceptor(new BoundaryInterceptor());
     *
     */
    var AwesomeMap = function(host, options) {

        /**
         * User-configurable options.
         * @type {Object}
         */
        this._options = _.extend({
            cancelMouseWheelEvents: true,
            touchScrollingEnabled: true
        }, options);

        //---------------------------------------------------------
        // Observables
        //---------------------------------------------------------

        /**
         * Observable for subscribing to user interactions.
         *
         * @method AwesomeMap#onInteraction
         * @param {Function} callback
         *        Invoked with (sender, {
         *            event: {@link InteractionEvent},
         *            currentState: {@link TransformState}
         *        })
         */
        this.onInteraction = Observable.newObservable();

        /**
         * Observable for subscribing to the start of user interactions.
         * User interactions start on the capture of a touch event.
         * Mouse wheel events do not trigger this event.
         *
         * @method AwesomeMap#onInteractionStarted
         * @param {Function} callback
         *        Invoked with (sender)
         */
        this.onInteractionStarted = Observable.newObservable();

        /**
         * Observable for subscribing to the end of user interactions.
         * User interactions are deemed finished once a release event has been
         * transformed. Mouse wheel events do not trigger this event.
         *
         * @method AwesomeMap#onInteractionFinished
         * @param {Function} callback
         *        Invoked with (sender)
         */
        this.onInteractionFinished = Observable.newObservable();

        /**
         * Observable for subscribing to changes in scale.
         *
         * @method AwesomeMap#onScaleChanged
         * @param {Function} callback
         *        Invoked with (sender, {
         *            scale: {number}
         *        })
         */
        this.onScaleChanged = Observable.newObservable();

        /**
         * Observable for subscribing to the end of a transform.
         *
         * @method AwesomeMap#onTransformFinished
         * @param {Function} callback
         *        Invoked with (sender, {
         *            event: {@link InteractionEvent},
         *            finalState: {@link TransformState}
         *        })
         */
        this.onTransformFinished = Observable.newObservable();

        /**
         * Observable for subscribing to changes in content translation.
         *
         * @method AwesomeMap#onTranslationChanged
         * @param {Function} callback
         *        Invoked with (sender, {
         *            x: {number},
         *            y: {number}
         *        })
         */
        this.onTranslationChanged = Observable.newObservable();

        /**
         * Observable for subscribing to the start of a transform.
         * Subscribers receive the source interaction event and the target
         * transform state as arguments.
         *
         * @method AwesomeMap#onTransformStarted
         * @param {Function} callback
         *        Invoked with (sender, {
         *            event: {@link InteractionEvent},
         *            targetState: {@link TransformState}
         *        })
         */
        this.onTransformStarted = Observable.newObservable();

        //---------------------------------------------------------
        // Private properties
        //---------------------------------------------------------

        /**
         * Cached content dimensions that are invalidated on resize.
         * @type {Object}
         * @private
         */
        this._contentDimensions = null;

        /**
         * The current transform state of the transformation plane.
         * @type {TransformState}
         * @private
         */
        this._currentTransformState = null;

        /**
         * Custom content dimensions supplied by the consumer; useful when
         * content is dynamic and cannot be determined by inspecting the DOM.
         * @type {{ height: number, width: number }}
         * @private
         */
        this._customContentDimensions = null;

        /**
         * Whether the map will handle direct user interaction.
         * @type {Boolean}
         * @private
         */
        this._disabled = false;

        /**
         * Whether the instance is disposed.
         * @type {boolean}
         * @private
         */
        this._disposed = false;

        /**
         * Captures and synthesizes events occurring on the viewport.
         * @type {EventSynthesizer}
         * @private
         */
        this._eventSynthesizer = null;

        /**
         * The host element.
         * @type {HTMLElement}
         * @private
         */
        this._host = host;

        /**
         * Simulates interactions triggered via the public api.
         * @type {InteractionSimulator}
         * @private
         */
        this._interactionSimulator = null;

        /**
         * Collection of registered interceptors that extend default behavior.
         * @type {Array.<Object>}
         * @private
         */
        this._interceptors = [];

        /**
         * The transformation plane used to pan and zoom content.
         * @type {HTMLElement}
         * @private
         */
        this._transformationPlane = null;

        /**
         * The queue used to process events that generate transformations.
         * @type {TransformationQueue}
         * @private
         */
        this._transformationQueue = null;

        /**
         * The viewport.
         * @type {HTMLElement}
         * @private
         */
        this._viewport = null;

        /**
         * Cached viewport dimensions that are invalidated on resize.
         * @type {Object}
         * @private
         */
        this._viewportDimensions = null;

        //---------------------------------------------------------
        // Initialization
        //---------------------------------------------------------

        this._initialize();
    };

    AwesomeMap.prototype = {

        //---------------------------------------------------------
        // Public properties
        //---------------------------------------------------------

        /**
         * Gets the bounding dimensions of all the content in the AwesomeMap.
         * @method AwesomeMap#getContentDimensions
         * @returns {{
         *     width: number,
         *     height: number
         * }}
         */
        getContentDimensions: function() {
            if (this._contentDimensions) {
                return this._contentDimensions;
            }

            var customContentDimensions = this._customContentDimensions;
            var contents;
            var i;
            var length;
            var content;
            var height = 0;
            var width = 0;

            // If custom content dimensions have been configured, use them; ...
            if (customContentDimensions) {
                width = customContentDimensions.width;
                height = customContentDimensions.height;
            }
            // ... otherwise get dimensions by inspecting the DOM.
            // We want the total height and max width.
            else {
                contents = this._transformationPlane.childNodes;
                for (i = 0, length = contents.length; i < length; i++) {
                    content = contents[i];
                    width = Math.max(width, content.offsetWidth);
                    height += content.offsetHeight;
                }
            }

            // Cache the dimensions.
            this._contentDimensions = {
                width: Math.ceil(width),
                height: Math.ceil(height)
            };

            return this._contentDimensions;
        },

        /**
         * Gets the current transform state applied to the transformation plane.
         * @method AwesomeMap#getCurrentTransformState
         * @returns {TransformState}
         */
        getCurrentTransformState: function() {
            return this._currentTransformState;
        },

        /**
         * Gets the host element for this instance.
         * @param {HTMLElement} element
         */
        getHost: function() {
            return this._host;
        },

        /**
         * Gets the current scale.
         * @method AwesomeMap#getScale
         * @return {number}
         */
        getScale: function() {
            return this._currentTransformState.scale;
        },

        /**
         * Gets the transformation plane.
         * @method AwesomeMap#getTransformationPlane
         * @returns {HTMLElement}
         */
        getTransformationPlane: function() {
            return this._transformationPlane;
        },

        /**
         * Gets the current content translation.
         * @method AwesomeMap#getTranslation
         * @return {{ x: number, y: number }}
         */
        getTranslation: function() {
            return {
                x: this._currentTransformState.translateX,
                y: this._currentTransformState.translateY
            };
        },

        /**
         * Gets the viewport element.
         * @method AwesomeMap#getViewport
         * @returns {HTMLElement}
         */
        getViewport: function() {
            return this._viewport;
        },

        /**
         * Gets the dimensions of the viewport.
         * @method AwesomeMap#getViewportDimensions
         * @returns {{
         *     height: number,
         *     width: number
         * }}
         */
        getViewportDimensions: function() {
            if (this._viewportDimensions) {
                return this._viewportDimensions;
            }

            // The viewport is absolutely positioned with respect to the host element,
            // so get the style info from the host instead.
            var viewportDimensions;
            DOMUtil.makeMeasureReady(this._host, function(el) {
                var viewportStyle = window.getComputedStyle(el);
                viewportDimensions = {
                    height: parseInt(viewportStyle.height, 10),
                    width: parseInt(viewportStyle.width, 10)
                };
            });

            this._viewportDimensions = viewportDimensions;
            return viewportDimensions;
        },

        /**
         * Gets whether interactions are disabled.
         * @method AwesomeMap#isDisabled
         * @return {boolean}
         */
        isDisabled: function() {
            return this._disabled;
        },

        /**
         * Gets whether the instance is disposed.
         * @method AwesomeMap#isDisposed
         * @returns {boolean}
         */
        isDisposed: function() {
            return this._disposed;
        },

        /**
         * Gets whether a transformation is currently running.
         * @method AwesomeMap#isTransforming
         * @return {boolean}
         */
        isTransforming: function() {
            return this._transformationQueue.isProcessing();
        },

        /**
         * Sets the content dimensions to a custom value;
         * this is useful when dynamically injecting content into the map,
         * which makes it impossible to inspect the DOM to get the dimensions.
         * @method AwesomeMap#setContentDimensions
         * @param {{ height: number, width: number }} dimensions
         */
        setContentDimensions: function(dimensions) {
            this._customContentDimensions = dimensions;
            this._invalidateContentDimensions(true /* force */);
        },

        /**
         * Sets the current transform state for the map and dispatches events
         * if the scale or translation changes.
         * @method AwesomeMap#setCurrentTransformState
         * @param {TransformState} state
         */
        setCurrentTransformState: function(state) {
            var oldState = this._currentTransformState;
            this._currentTransformState = state.clone();
            if (oldState.scale !== state.scale) {
                this.onScaleChanged.dispatch([this, {
                    scale: state.scale
                }]);
            }
            if (oldState.translateX !== state.translateX ||
                oldState.translateY !== state.translateY) {
                this.onTranslationChanged.dispatch([this, {
                    x: state.translateX,
                    y: state.translateY
                }]);
            }
        },

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Registers an interceptor to listen for interaction events.
         * @method AwesomeMap#addInterceptor
         * @param {Object} interceptor
         */
        addInterceptor: function(interceptor) {
            interceptor.register(this);
            this._interceptors.push(interceptor);
        },

        /**
         * Appends content to the transformation plane.
         * @method AwesomeMap#appendContent
         * @param {HTMLElement} content
         */
        appendContent: function(content) {
            this._transformationPlane.appendChild(content);
            this._invalidateContentDimensions();
        },

        /**
         * Clears all content from the transformation plane.
         * @method AwesomeMap#clearContent
         */
        clearContent: function() {
            var container = this._transformationPlane;

            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }

            this._invalidateContentDimensions();
        },

        /**
         * Disables direct interaction with the map.
         * @method AwesomeMap#disable
         */
        disable: function() {
            this._disabled = true;
        },

        /**
         * Disposes the instance.
         * @method AwesomeMap#dispose
         */
        dispose: function() {
            var i;
            var length;

            // Remove this from the DOM.
            this._host.removeChild(this._viewport);

            // Dispose dependencies.
            this._eventSynthesizer.dispose();
            this._interactionSimulator.dispose();

            // Dispose interceptors.
            for (i = 0, length = this._interceptors.length; i < length; i++) {
                this._interceptors[i].dispose();
            }

            // Dispose observables.
            this.onInteraction.dispose();
            this.onScaleChanged.dispose();
            this.onTransformFinished.dispose();
            this.onTransformStarted.dispose();
            this.onTranslationChanged.dispose();

            DestroyUtil.destroy(this);

            this._disposed = true;
        },

        /**
         * Enable direct interaction with the map.
         * @method AwesomeMap#enable
         */
        enable: function() {
            this._disabled = false;
        },

        /**
         * Gets a registered interceptor by type.
         * @method AwesomeMap#getInterceptor
         * @param {Type} Type
         * @returns {Object|null} The interceptor, if it exists.
         */
        getInterceptor: function(Type) {
            var i;
            var length;
            var interceptor;

            for (i = 0, length = this._interceptors.length; i < length; i++) {
                interceptor = this._interceptors[i];
                if (interceptor instanceof Type) {
                    return interceptor;
                }
            }

            return null;
        },

        /**
         * Handles interaction events published by either the event synthesizer
         * or the interaction simulator.
         * @param {Object} source - The source of the interaction event.
         * @param {InteractionEvent} args.event - The interaction event.
         * @param {Function} [args.done] - Callback invoked after the event is handled.
         */
        handleInteractionEvent: function(source, args) {
            if (['dragstart', 'drag', 'dragend'].indexOf(args.event.type) !== -1) {
                return;
            }
            var self = this;
            var queue = this._transformationQueue;
            var event = args.event;
            var eventType = event.type;
            var done = function() {
                // Let consumers know that an interaction is complete
                // when a release event is finished processing.
                if (eventType === EventTypes.RELEASE || eventType === EventTypes.MOUSE_WHEEL_END) {
                    self.onInteractionFinished.dispatch([self]);
                    if (self._deferInteractionStarted) {
                        self.onInteractionStarted.dispatch([self]);
                        self._deferInteractionStarted = false;
                    }
                }
                if (args.done) {
                    args.done();
                }
            };

            // If this is a touch event, cancel the current transformation
            // and notify the consumer that an interaction has started.
            if (eventType === EventTypes.TOUCH || eventType === EventTypes.MOUSE_WHEEL_START) {
                var cancelledState = queue.cancelCurrentTransformation();
                if (cancelledState) {
                    this.setCurrentTransformState(cancelledState);
                    // To preserve logical ordering of events when cancelling
                    // transforms via touch events, dispatch onInteractionStarted
                    // after the previous interaction's release event is handled.
                    this._deferInteractionStarted = true;
                }
                else {
                    this.onInteractionStarted.dispatch([this]);
                }
            }
            // If resizing, invalidate the viewport dimensions.
            else if (eventType === EventTypes.RESIZE) {
                this.invalidateViewportDimensions();
            }

            // Dispatch to observers; they can cancel the event by returning false.
            this.onInteraction.dispatch([
                this,
                { event: event, currentState: this.getCurrentTransformState() }
            ], function observed(returnValue) {
                event.cancelled = event.cancelled || (returnValue === false);
            });

            if (this._isEventCanceled(event)) {
                return done();
            }

            // Queue the event for transformation and process queue immediately.
            queue.enqueue(event, function(endState) {
                self.setCurrentTransformState(endState);
                done();
            });
            queue.processEvents();
        },

        /**
         * Invalidates the cached viewport dimensions.
         * @method AwesomeMap#invalidateViewportDimensions
         */
        invalidateViewportDimensions: function() {
            this._viewportDimensions = null;
        },

        /**
         * Pans the transformation plane by the given amount.
         * @method AwesomeMap#panBy
         * @param {Object} options
         * @param {number} [options.x] - The relative position change along the x-axis.
         * @param {number} [options.y] - The relative position change along the y-axis.
         * @param {number} [options.duration] - The duration of the pan animation, in ms.
         * @param {Function} [options.done] - Callback invoked after panning finishes.
         */
        panBy: function(options) {
            options.type = 'by';
            this._interactionSimulator.simulatePan(options);
        },

        /**
         * Pans the transformation plane to the given position.
         * @method AwesomeMap#panTo
         * @param {Object} options
         * @param {number} [options.x] - The absolute position along the x-axis.
         * @param {number} [options.y] - The absolute position along the y-axis.
         * @param {number} [options.duration] - The duration of the pan animation, in ms.
         * @param {Function} [options.done] - Callback invoked after panning finishes.
         */
        panTo: function(options) {
            options.type = 'to';
            this._interactionSimulator.simulatePan(options);
        },

        /**
         * Removes content from the transformation plane.
         * @method AwesomeMap#removeContent
         * @param {HTMLElement} content
         */
        removeContent: function(content) {
            this._transformationPlane.removeChild(content);
            this._invalidateContentDimensions();
        },

        /**
         * Remove interceptors of the given type.
         * @method AwesomeMap#removeInterceptor
         * @param {Type} Type
         */
        removeInterceptor: function(Type) {
            var i;
            var interceptor;

            for (i = this._interceptors.length - 1; i > -1; i--) {
                interceptor = this._interceptors[i];
                if (interceptor instanceof Type) {
                    interceptor.dispose();
                    this._interceptors.splice(i, 1);
                }
            }
        },

        /**
         * Simulates a swipe interaction.
         * @method AwesomeMap#swipe
         * @param {Object} options
         * @param {number} options.direction - The direction of the swipe.
         * @param {number} [options.velocity=1] - The velocity of the swipe.
         * @param {number} [options.duration] - The duration of the animation, in ms.
         * @param {Function} [options.done] - Callback invoked after the swipe finishes.
         */
        swipe: function(options) {
            this._interactionSimulator.simulateSwipe(options);
        },

        /**
         * Transforms the transformation plane directly,
         * bypassing all event handling logic and interceptors.
         * This is useful when initializing the position of the content.
         * @method AwesomeMap#transform
         * @param {Object} options
         * @param {number} [options.x] - The target x-axis scroll position.
         * @param {number} [options.y] - The target y-axis scroll position.
         * @param {number} [options.scale] - The target scale.
         */
        transform: function(options) {
            var newState = new TransformState({
                translateX: options.x,
                translateY: options.y,
                scale: options.scale
            });
            TransformUtil.applyTransform(this._transformationPlane, newState);
            this.setCurrentTransformState(newState);
        },

        /**
         * Zooms the transformation plane by the given amount.
         * @method AwesomeMap#zoomBy
         * @param {Object} options
         * @param {number} [options.scale] - The relative scale factor; 1 is the current scale.
         * @param {number} [options.originX] - The host-relative zoom origin along the x-axis.
         * @param {number} [options.originY] - The host-relative zoom origin along the y-axis.
         * @param {number} [options.duration] - The duration of the zoom animation, in ms.
         * @param {Function} [options.done] - Callback invoked after zooming finishes.
         */
        zoomBy: function(options) {
            options.type = 'by';
            this._interactionSimulator.simulateZoom(options);
        },

        /**
         * Zooms the transformation plane to the given scale.
         * @method AwesomeMap#zoomTo
         * @param {Object} options
         * @param {number} [options.scale] - The scale factor; where 1 is equivalent to a 100% zoom.
         * @param {number} [options.originX] - The host-relative zoom origin along the x-axis.
         * @param {number} [options.originY] - The host-relative zoom origin along the y-axis.
         * @param {number} [options.duration] - The duration of the zoom animation, in ms.
         * @param {Function} [options.done] - Callback invoked after zooming finishes.
         */
        zoomTo: function(options) {
            options.type = 'to';
            this._interactionSimulator.simulateZoom(options);
        },

        //---------------------------------------------------------
        // Private methods
        //---------------------------------------------------------

        /**
         * Initialize this instance.
         * @private
         */
        _initialize: function() {
            this._validateConfiguration();

            var eventHandler = this.handleInteractionEvent.bind(this);

            this._initializeHTMLElements();

            this._currentTransformState = new TransformState();

            this._eventSynthesizer = new EventSynthesizer({
                host: this._viewport,
                cancelMouseWheelEvents: this._options.cancelMouseWheelEvents
            });
            this._eventSynthesizer.onEventSynthesized(eventHandler);

            this._interactionSimulator = new InteractionSimulator({ target: this._viewport });
            this._interactionSimulator.onEventSimulated(eventHandler);

            this._transformationQueue = new TransformationQueue(this);
        },

        /**
         * Initializes the HTML elements used by AwesomeMap.
         */
        _initializeHTMLElements: function() {

            function applyDefaultStyles(target) {
                target.style.position = 'absolute';
                target.style.top = '0px';
                target.style.bottom = '0px';
                target.style.left = '0px';
                target.style.right = '0px';
            }

            // Viewport
            this._viewport = document.createElement('div');
            this._viewport.className = 'awesomeMap-viewport';
            applyDefaultStyles(this._viewport);
            this._viewport.style.overflow = 'hidden';

            // Transformation Plane
            this._transformationPlane = document.createElement('div');
            this._transformationPlane.className = 'awesomeMap-transformationPlane';
            this._transformationPlane.style.position = 'absolute';
            TransformUtil.clearTransformationOrigin(this._transformationPlane);

            // Add the elements to the DOM
            this._viewport.appendChild(this._transformationPlane);

            this._host.appendChild(this._viewport);
        },

        /**
         * Invalidates the cached content dimensions.
         * @param {boolean} [force=false]
         *        Forces invalidation even when custom content dimensions are set.
         */
        _invalidateContentDimensions: function(force) {
            var contentDimensions;

            // Do not invalidate if the consumer has set custom content dimensions,
            // unless we are being forced to!
            if (force || !this._customContentDimensions) {
                this._contentDimensions = null;
                contentDimensions = this.getContentDimensions();
            }
        },

        /**
         * Returns true if the event is cancelled by a consumer, the AwesomeMap
         * is disabled, or if touch scrolling is disabled.
         */
        _isEventCanceled: function(event) {
            // The event was cancelled by a subscriber to onInteraction
            if (event.cancelled) {
                return true;
            }

            // Don't cancel events that were initiated by the API
            // (as opposed to direct user interaction)
            if (event.simulated) {
                return false;
            }

            if (this.isDisabled()) {
                return true;
            }

            if (!this._options.touchScrollingEnabled && (
                event.type === EventTypes.DRAG ||
                event.type === EventTypes.SWIPE ||
                event.type === EventTypes.DRAG_START ||
                event.type === EventTypes.DRAG_END
            )) {
                return true;
            }

            return false;
        },

        /**
         * Ensures that the given configuration is valid.
         */
        _validateConfiguration: function() {
            var host = this._host;
            if (!host) {
                throw new Error('AwesomeMap configuration: host is required.');
            }

            // Host validation
            // ---------------
            // Ensure the host element is in the DOM.
            if (!document.body.contains(host)) {
                throw new Error('AwesomeMap configuration: host is not in the DOM.');
            }
            // Ensure the host element has both a width and height.
            var style = window.getComputedStyle(host);
            if (!parseInt(style.width, 10) || !parseInt(style.height, 10)) {
                throw new Error('AwesomeMap configuration: host does not have any size.');
            }
        }
    };

    return AwesomeMap;
});
