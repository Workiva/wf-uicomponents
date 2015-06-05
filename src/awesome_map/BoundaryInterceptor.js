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
    var BoundaryTypes = require('wf-js-uicomponents/awesome_map/BoundaryTypes');
    var EasingFunctions = require('wf-js-uicomponents/awesome_map/EasingFunctions');
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');
    var InterceptorMixin = require('wf-js-uicomponents/awesome_map/InterceptorMixin');
    var Observable = require('wf-js-common/Observable');
    var Utils = require('wf-js-common/Utils');

    /**
     * The scaling factor used when applying inertial effects.
     * @type {number}
     */
    var INERTIAL_SCALE_FACTOR = 4;

    /** 
     * This constant defines the default minimum number of pixels beyond the boundary a
     * scroll event must reach for boundary events to be fired.
     * @type {number}
     */
    var DEFAULT_BOUNDARY_SENSITIVITY = 25; // Pixels

    /**
     * Values for the mode option.
     * @readonly
     * @enum {string}
     */
    var Modes = {
        SLOW: 'slow',
        STOP: 'stop'
    };

    /**
     * Gets the position after applying an inertial effect.
     * @param {number} target - The target position.
     * @param {number} boundary - The boundary position.
     * @param {number} delta - The cumulative delta position for the interaction.
     * @param {number} start - The start position for the interaction.
     * @param {number} threshold - The maximum distance beyond the boundary.
     * @returns {number} The inertial position if the boundaries are violated, else the target.
     */
    function getInertialPosition(target, boundary, delta, start, threshold) {
        var excessDimension;
        var scaledValue;
        var returnValue = target;

        if (target < boundary) {
            excessDimension = (delta + (start - boundary));
            scaledValue = excessDimension / INERTIAL_SCALE_FACTOR;
            returnValue = boundary + Math.max(scaledValue, -threshold);
        }
        else { // (target > boundary) - Cannot get here without boundary violation.
            excessDimension = (delta - (boundary - start));
            scaledValue = excessDimension / INERTIAL_SCALE_FACTOR;
            returnValue = boundary + Math.min(scaledValue, threshold);
        }

        return Math.round(returnValue);
    }

    /**
     * Create a new BoundaryInterceptor with the given options.
     *
     * @classdesc
     *
     * A BoundaryInterceptor ensures that AwesomeMap content is
     * constrained to fit within its viewport boundaries.
     *
     * @name BoundaryInterceptor
     * @constructor
     * @mixes InterceptorMixin
     *
     * @param {Object} [options]
     *
     * @param {number} [options.animationDuration=250]
     *        The animation duration for snapping to boundaries, in ms.
     *
     * @param {boolean} [options.centerContentX=false]
     *        Center the content horizontally in the viewport when applying boundaries if possible.
     *
     * @param {boolean} [options.centerContentY=false]
     *        Center the content vertically in the viewport when applying boundaries if possible.
     *
     * @param {Function} [options.easing=EasingFunctions.easeOutQuart]
     *        The easing function that controls the animation effect.
     *        See {@link module:EasingFunctions|EasingFunctions} for the available strategies.
     *
     * @param {string|{x: string, y: string}} [options.mode='stop']
     *        Determines how to handle boundary violations during interactions:
     *        'stop' disallows dragging beyond the boundaries and
     *        'slow' limits drag and swipe effects beyond boundaries.
     *        A different effect may be applied to each boundary.
     *
     * @param {boolean} [options.pinToLeft=false]
     *        Pins content that does not overflow the viewport to the left.
     *        When options.centerContentX is true it overrides this.
     *
     * @param {boolean} [options.pinToTop=false]
     *        Pins content that does not overflow the viewport to the top.
     *        When options.centerContentY is true it overrides this.
     *
     * @param {number} [options.boundarySensitivity=DEFAULT_BOUNDARY_SENSITIVITY]
     *        This value defines the minimum number of pixels beyond the boundary a scroll event
     *        must reach for boundary events to be fired, so that light touches and small scrolls 
     *        (by default) wont fire events constantly.  A value of 0 will cause every event which
     *        passes a boundary to fire a boundary event.
     *
     * @example
     *
     * new BoundaryInterceptor({
     *     animationDuration: 1000,
     *     easing: EasingFunctions.easeOutCubic,
     *     mode: {
     *         x: 'stop',
     *         y: 'slow'
     *     }
     * });
     */
    var BoundaryInterceptor = function(options) {
        options = options || {};

        /**
         * The animation duration for snapping to boundaries.
         * @type {number}
         * @private
         */
        this._animationDuration = Utils.valueOr(options.animationDuration, 250);

        /**
         * Whether to center the content horizontally in the viewport when applying boundaries.
         * @type {boolean}
         * @private
         */
        this._centerContentX = !!options.centerContentX;

        /**
         * Whether to center the content vertically in the viewport when applying boundaries.
         * @type {boolean}
         * @private
         */
        this._centerContentY = !!options.centerContentY;

        /**
         * The easing function that controls the animation effect.
         * @type {Function}
         * @private
         */
        this._easing = options.easing || EasingFunctions.easeOutQuart;

        /**
         * Defines the minimum number of pixels beyond the boundary which a scroll event
         * must reach for boundary events to be fired.
         * @type {number}
         * @private
         */
        this._boundarySensitivity = options.boundarySensitivity || DEFAULT_BOUNDARY_SENSITIVITY;

        /**
         * Observable for subscribing to scroll events beyond AwesomeMap boundaries.
         *
         * @method AwesomeMap#onScrollPastTopBoundary
         * @param {Function} callback
         *        Invoked with (sender, {
         *            boundary: {@link BoundaryTypes}
         *        })
         */
        this.onScrollPastBoundary = Observable.newObservable();


        /**
         * Determines how to handle boundary violations during interactions.
         * @type {{x: string, y: string}}
         * @private
         */
        this._mode = options.mode;

        if (options.mode === undefined) {
            this._mode = { x: Modes.STOP, y: Modes.STOP };
        }
        else if (typeof options.mode === 'string') {
            this._mode = { x: options.mode, y: options.mode };
        }

        /**
         * Anchors the contents to the left edge of the viewport if it
         * does not overflow the viewport boundaries.
         * @type {boolean}
         * @private
         */
        this._pinToLeft = !!options.pinToLeft;

        /**
         * Anchors the contents to the top edge of the viewport if it
         * does not overflow the viewport boundaries.
         * @type {boolean}
         * @private
         */
        this._pinToTop = !!options.pinToTop;
    };

    BoundaryInterceptor.prototype = {

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Gets the current settings.
         * @method BoundaryInterceptor#getSettings
         * @returns {{
         *     animationDuration: number,
         *     centerContentX: boolean,
         *     centerContentY: boolean,
         *     easing: Function,
         *     mode: {x: string, y: string},
         *     pinToLeft: boolean,
         *     pinToTop: boolean
         * }}
         */
        getSettings: function() {
            return {
                animationDuration: this._animationDuration,
                centerContentX: this._centerContentX,
                centerContentY: this._centerContentY,
                easing: this._easing,
                mode: this._mode,
                pinToLeft: this._pinToLeft,
                pinToTop: this._pinToTop
            };
        },

        /**
         * Intercepts transforms and applies boundary constraints.
         * @method BoundaryInterceptor#handleTransformStarted
         * @param {AwesomeMap} source
         * @param {InteractionEvent} args.event
         * @param {TransformState} args.targetState
         */
        handleTransformStarted: function(source, args) {
            var event = args.event;
            var targetState = args.targetState;
            var eventType = event.type;
            var originalState;


            // BoundaryEvent Detection
            // @Note: Be aware, this event can be triggered by inertial events generated by 
            // the browser.  That is, a hard scroll in one direction which causes the view to
            // reach the content boundary but has remaining scroll momentum may continue to 
            // generate residual scroll events which may trigger boundary events even if the
            // user has not initiated any scroll gestures since reaching that boundary.
            var boundedPosition = this._getBoundedPosition(targetState);
            var currentState = this._awesomeMap.getCurrentTransformState();
            if (currentState.translateY === boundedPosition.y) {
                if (targetState.translateY - boundedPosition.y > this._boundarySensitivity) {
                    this.onScrollPastBoundary.dispatch([this, {
                        boundary: BoundaryTypes.TOP
                    }]);
                }
                if (targetState.translateY - boundedPosition.y < -this._boundarySensitivity) {
                    this.onScrollPastBoundary.dispatch([this, {
                        boundary: BoundaryTypes.BOTTOM
                    }]);
                }
            }
            if (currentState.translateX === boundedPosition.x) {
                if (targetState.translateX - boundedPosition.x > this._boundarySensitivity) {
                    this.onScrollPastBoundary.dispatch([this, {
                        boundary: BoundaryTypes.LEFT
                    }]);
                }
                if (targetState.translateX - boundedPosition.x < -this._boundarySensitivity) {
                    this.onScrollPastBoundary.dispatch([this, {
                        boundary: BoundaryTypes.RIGHT
                    }]);
                }
            }

            switch (eventType) {
            case EventTypes.TOUCH:

                // Track translations on touch events to scale inertial calculations.
                this._touchState = targetState;
                break;

            case EventTypes.DRAG:
            case EventTypes.DRAG_END:
            case EventTypes.DRAG_START:

                if (!event.simulated && this._mode.x === Modes.SLOW) {
                    this._pullToBoundaries(event, targetState, 'x');
                }
                else {
                    this._stopAtBoundaries(event, targetState, 'x');
                }
                if (!event.simulated && this._mode.y === Modes.SLOW) {
                    this._pullToBoundaries(event, targetState, 'y');
                }
                else {
                    this._stopAtBoundaries(event, targetState, 'y');
                }
                break;

            case EventTypes.MOUSE_WHEEL:

                this._stopAtBoundaries(event, targetState);
                break;

            case EventTypes.RELEASE:
            case EventTypes.RESIZE:

                this._snapToBoundaries(event, targetState);
                break;

            case EventTypes.SWIPE:

                originalState = targetState.clone();
                if (this._mode.x === Modes.SLOW) {
                    this._bounceAtBoundaries(event, targetState, 'x');
                }
                else {
                    this._stopAtBoundaries(event, targetState, 'x');
                }
                if (this._mode.y === Modes.SLOW) {
                    this._bounceAtBoundaries(event, targetState, 'y');
                }
                else {
                    this._stopAtBoundaries(event, targetState, 'y');
                }
                this._accelerateAnimationAtBoundaries(event, targetState, originalState);

                break;

            case EventTypes.TRANSFORM:

                if (event.simulated) {
                    this._stopAtBoundaries(event, targetState);
                }
                break;
            }
        },

        //---------------------------------------------------------
        // Private methods
        //---------------------------------------------------------

        /**
         * Accelerate animations at boundaries based upon distance to travel.
         * This is useful when handling gestures that yield large out-of-bounds
         * values over a long duration; these would cause a long animation
         * over a short distance, and would appear very slow to an end user.
         * @param {InteractionEvent} event
         * @param {TransformState} targetState
         * @param {TransformState} originalState - The state before boundary enforcement.
         * @private
         */
        _accelerateAnimationAtBoundaries: function(event, targetState, originalState) {
            var gesture = event.iterativeGesture;
            var currentState = this._awesomeMap.getCurrentTransformState();

            var durationFactorX = 1;
            var durationFactorY = 1;
            var originalDelta;
            var boundedDelta;
            var acceleratedDuration;

            if (originalState.translateX !== targetState.translateX &&
                (gesture.direction === 'left' || gesture.direction === 'right')) {

                originalDelta = originalState.translateX - currentState.translateX;
                boundedDelta = targetState.translateX - currentState.translateX;
                durationFactorX = boundedDelta / originalDelta;
            }

            if (originalState.translateY !== targetState.translateY &&
                (gesture.direction === 'up' || gesture.direction === 'down')) {

                originalDelta = originalState.translateY - currentState.translateY;
                boundedDelta = targetState.translateY - currentState.translateY;
                durationFactorY = boundedDelta / originalDelta;
            }

            // Apply acceleration. This effect should be relative to, but faster
            // than other snap backs.
            acceleratedDuration = targetState.duration * Math.min(durationFactorX, durationFactorY);
            targetState.duration = Math.max(this._animationDuration / 2, acceleratedDuration);
        },

        /**
         * Allow event translation to move content slightly outside of boundaries
         * so that when release event occurs the content will snap back to boundaries.
         * @param {InteractionEvent} event
         * @param {TransformState} targetState
         * @param {string} [axis]
         */
        _bounceAtBoundaries: function(event, targetState, axis) {
            var originalState = targetState.clone();
            var viewportSize = this._awesomeMap.getViewportDimensions();

            // Enforce the viewport boundaries.
            var boundedPosition = this._getBoundedPosition(targetState);
            var bounceDistance;
            var direction;

            // If the targetState ends up out of bounds, allow the translation to carry
            // beyond the bounds by 10% of the relevant viewport dimension.
            // On release event handling, the content will "bounce back".
            // Switch the sign of the bounce distance to account for location:
            // left/top has the distance added, right/bottom has the distance subtracted.
            if (!axis || axis === 'x') {
                if (boundedPosition.x !== originalState.translateX) {
                    bounceDistance = 0.1 * viewportSize.width;
                    direction = boundedPosition.x < originalState.translateX ? 1 : -1;
                    targetState.translateX = boundedPosition.x + bounceDistance * direction;
                }
            }
            if (!axis || axis === 'y') {
                if (boundedPosition.y !== originalState.translateY) {
                    bounceDistance = 0.1 * viewportSize.height;
                    direction = boundedPosition.y < originalState.translateY ? 1 : -1;
                    targetState.translateY = boundedPosition.y + bounceDistance * direction;
                }
            }
        },

        /**
         * Gets the bounded position corresponding to the target state.
         * If the content does not violate a boundary, the target state is unchanged.
         * @param {TransformState} targetState
         * @returns {{x: number, y: number}}
         * @private
         */
        _getBoundedPosition: function(targetState) {
            var targetScale = targetState.scale;
            var viewport = this._awesomeMap.getViewportDimensions();
            var content = this._awesomeMap.getContentDimensions();

            // Get the amount of free space around the scaled content.
            var headroomX = viewport.width - targetScale * content.width;
            var headroomY = viewport.height - targetScale * content.height;

            // Get the boundaries along each dimension.
            var boundaryX = this._getBoundedValue(
                headroomX, targetState.translateX, this._centerContentX, this._pinToLeft
            );
            var boundaryY = this._getBoundedValue(
                headroomY, targetState.translateY, this._centerContentY, this._pinToTop
            );

            return {
                x: Math.round(boundaryX),
                y: Math.round(boundaryY)
            };
        },

        /**
         * Gets a value representing the target value or the boundary, if applied.
         * @param {number} headroom
         *        The difference in dimension between the viewport and content:
         *        for content that fits the viewport, headroom will be positive;
         *        for content that overflows, headroom will be negative.
         * @param {number} targetValue - The value being bound.
         * @param {boolean} centerContent
         *        If this is true, and headroom is greater than zero, the returned
         *        value will force content to be centered in the viewport.
         * @param {boolean} pinToEdge
         *        If this is true, and headroom is greater than zero, the returned
         *        value will force content to be aligned to the left or top
         *        of the viewport. This setting is ignored if centerContent
         *        is true.
         * @returns {number}
         * @private
         */
        _getBoundedValue: function(headroom, targetValue, centerContent, pinToEdge) {
            var boundary = targetValue;

            // Content dimension fits within the viewport:
            if (headroom > 0) {

                // If centering, use an absolute position.
                if (centerContent) {
                    boundary = headroom / 2;
                }
                else if (pinToEdge) {
                    boundary = 0;
                }
                else {
                    // Enforce min boundary.
                    if (targetValue < 0) {
                        boundary = 0;
                    }
                    // Enforce max boundary.
                    else if (targetValue > headroom) {
                        boundary = headroom;
                    }
                }
            }
            // Content dimension overflows the viewport:
            else {

                // Enforce min boundary.
                if (targetValue > 0) {
                    boundary = 0;
                }
                // Enforce max boundary.
                else if (targetValue < headroom) {
                    boundary = headroom;
                }
            }

            return boundary;
        },

        /**
         * Modifies the target state to simulate an inertial pull to boundaries.
         * @param {InteractionEvent} event
         * @param {TransformState} targetState
         * @param {string} [axis]
         * @private
         */
        _pullToBoundaries: function(event, targetState, axis) {
            var targetScale = targetState.scale;
            var viewport = this._awesomeMap.getViewportDimensions();
            var content = this._awesomeMap.getContentDimensions();
            var scaledContentWidth = targetScale * content.width;
            var touchState = this._touchState || { translateX: 0, translateY: 0 };
            var originalX;
            var originalY;

            // Get the position of the viewport boundaries.
            var boundedPosition = this._getBoundedPosition(targetState);

            // If boundaries have been exceeded, then apply inertial effect.
            // Limit the behavior to the specified axis, if given.
            if (!axis || axis === 'x') {
                originalX = targetState.translateX;
                if (boundedPosition.x !== originalX) {
                    targetState.translateX = getInertialPosition(
                        originalX,
                        boundedPosition.x,
                        event.cumulativeGesture.deltaX,
                        touchState.translateX,
                        scaledContentWidth / INERTIAL_SCALE_FACTOR
                    );
                }
            }
            if (!axis || axis === 'y') {
                originalY = targetState.translateY;
                if (boundedPosition.y !== originalY) {
                    targetState.translateY = getInertialPosition(
                        originalY,
                        boundedPosition.y,
                        event.cumulativeGesture.deltaY,
                        touchState.translateY,
                        viewport.height / INERTIAL_SCALE_FACTOR
                    );
                }
            }
        },

        /**
         * Modifies the target state to simulate a snap back to boundaries.
         * @param {InteractionEvent} event
         * @param {TransformState} targetState
         * @private
         */
        _snapToBoundaries: function(event, targetState) {
            // Save off the original values.
            var originalState = targetState.clone();

            // Enforce the viewport boundaries.
            var boundedPosition = this._getBoundedPosition(targetState);
            targetState.translateX = boundedPosition.x;
            targetState.translateY = boundedPosition.y;

            // If we applied boundaries, then animate snap back to boundary.
            if (originalState.translateX !== targetState.translateX ||
                originalState.translateY !== targetState.translateY) {

                // If this is a resize event, don't animate.
                if (event.type !== EventTypes.RESIZE) {

                    targetState.duration = this._animationDuration;
                    targetState.easing = this._easing;
                }
            }
        },

        /**
         * Modifies the target state to impose hard boundaries.
         * @param {InteractionEvent} event
         * @param {TransformState} targetState
         * @param {string} [axis]
         * @private
         */
        _stopAtBoundaries: function(event, targetState, axis) {
            var boundedPosition = this._getBoundedPosition(targetState);

            if (!axis || axis === 'x') {
                targetState.translateX = boundedPosition.x;
            }
            if (!axis || axis === 'y') {
                targetState.translateY = boundedPosition.y;
            }
        }
    };

    _.assign(BoundaryInterceptor.prototype, InterceptorMixin);

    return BoundaryInterceptor;
});
