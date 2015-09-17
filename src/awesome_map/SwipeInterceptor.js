/*
 * Copyright 2015 Workiva Inc.
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
    var EasingFunctions = require('wf-js-uicomponents/awesome_map/EasingFunctions');
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');
    var InterceptorMixin = require('wf-js-uicomponents/awesome_map/InterceptorMixin');

    /**
     * Factor used to convert degrees to radians.
     * @type {number}
     */
    var DEGREES_TO_RADIANS = Math.PI / 180;

    /**
     * Creates a new SwipeInterceptor from the given options.
     *
     * @classdesc
     *
     * A SwipeInterceptor triggers a swipe animation when swipe interactions
     * are captured in an AwesomeMap.
     *
     * @name SwipeInterceptor
     * @constructor
     * @mixes InterceptorMixin
     *
     * @param {Object} [options]
     *
     * @param {number} [options.animationDuration=1000]
     *        The animation duration for swipes, in ms.
     *
     * @param {boolean} [options.constrainToAxes=false]
     *        Constrains swipes to horizontal and vertical axes.
     *        The default behavior allows diagonal swipes.
     *
     * @param {Function} [options.easing=EasingFunctions.easeOutQuart]
     *        The easing function that controls the animation effect.
     *        See {@link module:EasingFunctions|EasingFunctions} for the available strategies.
     *
     * @param {number} [options.throttleVelocity=4]
     *        Throttles the velocity of swipe gestures.
     *        Repeated swiping can yield huge velocities and wacky results.
     *        To disable throttling, set the option to zero.
     *
     * @example
     *
     * new SwipeInterceptor({
     *     animationDuration: 500,
     *     constrainToAxes: true,
     *     easing: EasingFunctions.easeOutCubic,
     *     throttleVelocity: 10
     * });
     */
    var SwipeInterceptor = function(options) {
        options = options || {};

        //---------------------------------------------------------
        // Private properties
        //---------------------------------------------------------

        /**
         * The animation duration for swipes.
         * @type {number}
         * @private
         */
        this._animationDuration = options.animationDuration === undefined ? 1000 : options.animationDuration;

        /**
         * Constrains swipes to horizontal and vertical axes.
         * @type {boolean}
         * @private
         */
        this._constrainToAxes = !!options.constrainToAxes;

        /**
         * The easing function that controls the animation effect.
         * @type {Function}
         * @private
         */
        this._easing = options.easing || EasingFunctions.easeOutQuart;

        /**
         * Throttles the velocity of swipe gestures.
         * @type {number}
         */
        this._throttleVelocity = options.throttleVelocity === undefined ? 4 : options.throttleVelocity;
    };

    SwipeInterceptor.prototype = {

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Gets the current settings.
         * @method SwipeInterceptor#getSettings
         * @returns {{
         *     animationDuration: number,
         *     easing: Function
         * }}
         */
        getSettings: function() {
            return {
                animationDuration: this._animationDuration,
                constrainToAxes: this._constrainToAxes,
                easing: this._easing,
                throttleVelocity: this._throttleVelocity
            };
        },

        /**
         * Intercepts swipe transforms and modifes the target state accordingly.
         * @param {AwesomeMap} source
         * @param {InteractionEvent} args.event
         * @param {TransformState} args.targetState
         * @private
         */
        handleTransformStarted: function(source, args) {
            var event = args.event;
            var targetState = args.targetState;
            var gesture = event.iterativeGesture;
            var originalTranslateX;
            var originalTranslateY;

            if (event.type === EventTypes.SWIPE) {
                originalTranslateX = targetState.translateX;
                originalTranslateY = targetState.translateY;

                if (this._constrainToAxes) {
                    this._swipeByDirection(gesture, targetState);
                }
                else {
                    this._swipeByAngle(gesture, targetState);
                }

                // Update the target state if anything has changed.
                if (targetState.translateX !== originalTranslateX ||
                    targetState.translateY !== originalTranslateY) {

                    targetState.duration = this._animationDuration;
                    targetState.easing = this._easing;
                }
            }
        },

        //---------------------------------------------------------
        // Private methods
        //---------------------------------------------------------

        /**
         * Gets the delta x/y for a swipe gesture, throttling velocity if enabled.
         * @param  {Gesture} gesture
         * @return {{x: number, y: number}}
         */
        _getDeltas: function(gesture) {
            var viewportDimensions = this._awesomeMap.getViewportDimensions();
            var throttle = this._throttleVelocity;
            var velocityX = gesture.velocityX;
            var velocityY = gesture.velocityY;
            var deltaX;
            var deltaY;

            if (throttle) {
                velocityX = Math.min(throttle, velocityX);
                velocityY = Math.min(throttle, velocityY);
            }

            deltaX = velocityX * viewportDimensions.width;
            deltaY = velocityY * viewportDimensions.height;

            return {
                x: deltaX,
                y: deltaY
            };
        },

        /**
         * Modifies the target TransformState to perform a swipe
         * along the angle of the interaction.
         * @param {Gesture} gesture
         * @param {TransformState} targetState
         * @private
         */
        _swipeByAngle: function(gesture, targetState) {
            var deltas = this._getDeltas(gesture);

            // Calculate the target translation point from the angle of the swipe.
            var radians = gesture.angle * DEGREES_TO_RADIANS;
            var deltaX =  Math.cos(radians) * deltas.x;
            var deltaY =  Math.sin(radians) * deltas.y;

            // Update the target state.
            targetState.translateX += deltaX;
            targetState.translateY += deltaY;
        },

        /**
         * Modifies the target TransformState to perform a swipe
         * along either the vertical or horizontal axis (up, down, left, right).
         * @param {Gesture} gesture
         * @param {TransformState} targetState
         * @private
         */
        _swipeByDirection: function(gesture, targetState) {
            var deltas = this._getDeltas(gesture);

            // Handle x-axis swipes.
            if (gesture.direction === 'right') {
                targetState.translateX += deltas.x;
            }
            else if (gesture.direction === 'left') {
                targetState.translateX += -deltas.x;
            }

            // Handle y-axis swipes.
            if (gesture.direction === 'down') {
                targetState.translateY += deltas.y;
            }
            else if (gesture.direction === 'up') {
                targetState.translateY += -deltas.y;
            }
        }
    };

    _.assign(SwipeInterceptor.prototype, InterceptorMixin);

    return SwipeInterceptor;
});
