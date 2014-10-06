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

    var DestroyUtil = require('wf-js-common/DestroyUtil');
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');
    var Gesture = require('wf-js-uicomponents/awesome_map/Gesture');
    var InteractionEvent = require('wf-js-uicomponents/awesome_map/InteractionEvent');
    var Observable = require('wf-js-common/Observable');
    var Utils = require('wf-js-common/Utils');

    /**
     * Creates an InteractionSimulator from the given configuration.
     *
     * @classdesc
     *
     * An InteractionSimulator simulates multi-event interactions on a target element.
     *
     * @name InteractionSimulator
     * @constructor
     *
     * @param {Object} configuration
     *
     * @param {HTMLElement} configuration.target
     *        The target element for simulated events.
     *
     * @param {number} [configuration.animationDuration=500]
     *        The default animation duration to use for interactions.
     *
     * @example
     *
     * var target = document.getElementById('target');
     *
     * var simulator = new InteractionSimulator({ target: target });
     */
    var InteractionSimulator = function(configuration) {
        this._validateConfiguration(configuration);

        //---------------------------------------------------------
        // Observables
        //---------------------------------------------------------

        /**
         * Observable for subscribing to simulated events.
         * @method AwesomeMap#onInteraction
         * @param {Function} callback
         *        Invoked with (sender, {
         *            event: {@link InteractionEvent},
         *            done: Function
         *        })
         */
        this.onEventSimulated = Observable.newObservable();

        //---------------------------------------------------------
        // Private properties
        //---------------------------------------------------------

        /**
         * The default animation duration to use for interactions.
         * @type {number}
         * @private
         */
        this._animationDuration = configuration.animationDuration || 0;

        /**
         * The target element to assign to generated events.
         * @type {HTMLElement}
         * @private
         */
        this._target = configuration.target;
    };

    InteractionSimulator.prototype = {

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Disposes the instance.
         * @method InteractionSimulator#dispose
         */
        dispose: function() {
            this.onEventSimulated.dispose();
            DestroyUtil.destroy(this);
        },

        /**
         * Simulate a pan interaction.
         * @method InteractionSimulator#simulatePan
         * @param {string} [options.type='by'] - The type of pan; either 'by' or 'to'.
         * @param {number} [options.x=0] - The delta or position along the x-axis.
         * @param {number} [options.y=0] - The delta or position along the y-axis.
         * @param {number} [options.duration=500] - The duration of the animation, in ms.
         * @param {Function} [options.done] - Callback invoked after pan finishes.
         */
        simulatePan: function(options) {
            // Prepare state for events.
            var type = Utils.valueOr(options.type, 'by');
            var x = Utils.valueOr(options.x, 0);
            var y = Utils.valueOr(options.y, 0);
            var duration = Utils.valueOr(options.duration, this._animationDuration);

            // Build simulated events.
            var touch = this._createTouchEvent();
            var drag;
            var release = this._createReleaseEvent();

            // Setup event data depending on the type of pan.
            if (type === 'to') {
                drag = this._createDragEvent(0, 0, duration);
                drag.targetState = {
                    translateX: x,
                    translateY: y
                };
            }
            else {
                drag = this._createDragEvent(x, y, duration);
            }

            this._dispatchEach([touch], [drag], [release, options.done]);
        },

        /**
         * Simulates a swipe interaction.
         * @method InteractionSimulator#simulateSwipe
         * @param {string} options.direction - The swipe direction: 'up', 'down', 'left', 'right'.
         * @param {number} [options.velocity=1] - The velocity of the swipe.
         * @param {number} [options.duration=500] - The duration of the animation, in ms.
         * @param {Function} [options.done] - Callback invoked after the swipe finishes.
         */
        simulateSwipe: function(options) {
            // Validate options
            if (!options.direction) {
                throw new Error('InteractionSimulator.simulateSwipe: direction is required');
            }

            // Prepare state for events.
            var direction = options.direction;
            var velocity = Utils.valueOr(options.velocity, 1);
            var duration = Utils.valueOr(options.duration, this._animationDuration);

            // Build simulated events.
            var touch = this._createTouchEvent();
            var swipe = this._createSwipeEvent(direction, velocity, duration);
            var release = this._createReleaseEvent();

            this._dispatchEach([touch], [swipe], [release, options.done]);
        },

        /**
         * Simulate a zoom interaction.
         * @method InteractionSimulator#simulateZoom
         * @param {string} [options.type='to'] - The type of zoom; either 'by' or 'to'.
         * @param {number} [options.scale=1] - The scale delta or absolute value.
         * @param {number} [options.originX] - The host-relative zoom origin along the x-axis.
         * @param {number} [options.originY] - The host-relative zoom origin along the y-axis.
         * @param {number} [options.duration=500] - The duration of the animation, in ms.
         * @param {Function} [options.done] - Callback invoked after the zoom finishes.
         */
        simulateZoom: function(options) {
            // Prepare state for events.
            var type = Utils.valueOr(options.type, 'to');
            var scale = Utils.valueOr(options.scale, 1);
            var duration = Utils.valueOr(options.duration, this._animationDuration);
            var origin = this._getZoomOrigin(options.originX, options.originY);

            // Build simulated events.
            var touch = this._createTouchEvent();
            var transform;
            var release = this._createReleaseEvent();

            // Setup event data depending on the type of zoom.
            if (type === 'to') {
                transform = this._createTransformEvent(1, origin, duration);
                transform.targetState = { scale: scale };
            }
            else {
                transform = this._createTransformEvent(scale, origin, duration);
            }

            this._dispatchEach([touch], [transform], [release, options.done]);
        },

        //---------------------------------------------------------
        // Private methods
        //---------------------------------------------------------

        /**
         * Factory method for creating events.
         * @param {string} type - The event type.
         * @param {object} [cumulativeGesture] - A Gesture-like object for cumulative state.
         * @param {object} [iterativeGesture=cumulativeGesture] - A Gesture-like object for iterative state.
         * @returns {InteractionEvent}
         * @private
         */
        _createEvent: function(type, cumulativeGesture, iterativeGesture) {
            var target = this._target;
            var event;

            function setDefaultGestureValues(gesture) {
                gesture.target = target;
            }

            // Get ourselves some usable gesture state:
            cumulativeGesture = cumulativeGesture || {};
            iterativeGesture = iterativeGesture || cumulativeGesture;

            setDefaultGestureValues(cumulativeGesture);
            setDefaultGestureValues(iterativeGesture);

            event = new InteractionEvent(
                type,
                new Gesture(cumulativeGesture),
                new Gesture(iterativeGesture)
            );

            event.simulated = true;

            return event;
        },

        /**
         * Creates a drag event.
         * @param {number} deltaX
         * @param {number} deltaY
         * @param {number} duration
         * @returns {InteractionEvent}
         * @private
         */
        _createDragEvent: function(deltaX, deltaY, duration) {
            return this._createEvent(EventTypes.DRAG, {
                deltaX: 0,
                deltaY: 0
            }, {
                deltaX: deltaX,
                deltaY: deltaY,
                duration: duration
            });
        },

        /**
         * Creates a release event.
         * @returns {InteractionEvent}
         * @private
         */
        _createReleaseEvent: function() {
            var origin = this._getZoomOrigin();

            return this._createEvent(EventTypes.RELEASE, {
                center: {
                    pageX: origin.pageX,
                    pageY: origin.pageY
                }
            });
        },

        /**
         * Creates a swipe event.
         * @param {string} direction
         * @param {number} velocity
         * @param {number} duration
         * @returns {InteractionEvent}
         * @private
         */
        _createSwipeEvent: function(direction, velocity, duration) {
            var velocityX = 0;
            var velocityY = 0;

            switch (direction) {
            case 'up':
            case 'down':
                velocityY = velocity;
                break;

            case 'left':
            case 'right':
                velocityX = velocity;
                break;
            }

            return this._createEvent(EventTypes.SWIPE, {
                direction: direction,
                duration: duration,
                velocityX: velocityX,
                velocityY: velocityY
            });
        },

        /**
         * Creates a touch event.
         * @returns {InteractionEvent}
         * @private
         */
        _createTouchEvent: function() {
            return this._createEvent(EventTypes.TOUCH);
        },

        /**
         * Creates a transform event.
         * @param {number} scale
         * @param {{ pageX: number, pageY: number }} origin
         * @param {number} duration
         * @returns {InteractionEvent}
         * @private
         */
        _createTransformEvent: function(scale, origin, duration) {
            return this._createEvent(EventTypes.TRANSFORM, {
                center: {
                    pageX: origin.pageX,
                    pageY: origin.pageY
                },
                duration: duration,
                scale: scale
            });
        },

        /**
         * Dispatches onEventSimulated serially with the given event parameters.
         * @param {...Array} arguments
         * @private
         */
        _dispatchEach: function() {
            var self = this;
            var eventParameters = Array.prototype.slice.call(arguments, 0);

            eventParameters.forEach(function(params) {
                self.onEventSimulated.dispatch([self, {
                    event: params[0],
                    done: params[1]
                }]);
            });
        },

        /**
         * Gets the zoom origin, considering offsets and defaults.
         * @param {number} [originX]
         * @param {number} [originY]
         * @returns {{ pageX: number, pageY: number }}
         * @private
         */
        _getZoomOrigin: function(originX, originY) {
            var target = this._target;
            var targetRect = target.getBoundingClientRect();
            var pageX = targetRect.left + Utils.valueOr(originX, targetRect.width / 2);
            var pageY = targetRect.top + Utils.valueOr(originY, targetRect.height / 2);

            return {
                pageX: pageX,
                pageY: pageY
            };
        },

        /**
         * Ensures that the given configuration is valid.
         * @param {object} configuration
         * @private
         */
        _validateConfiguration: function(configuration) {
            if (!configuration) {
                throw new Error('InteractionSimulator configuration is required.');
            }
            if (!configuration.target) {
                throw new Error('InteractionSimulator configuration: target is required.');
            }
        }
    };

    return InteractionSimulator;
});
