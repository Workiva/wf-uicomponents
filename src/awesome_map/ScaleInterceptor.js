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
    var EasingFunctions = require('wf-js-uicomponents/awesome_map/EasingFunctions');
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');
    var InterceptorMixin = require('wf-js-uicomponents/awesome_map/InterceptorMixin');
    var Utils = require('wf-js-common/Utils');

    /**
     * The factor at which scaling stops when applying inertial effect beyond limits.
     * @type {number}
     */
    var HARD_SCALE_LIMIT_FACTOR = 1.5;

    /**
     * The scaling factor used when applying inertial effects.
     * @type {number}
     */
    var INERTIAL_SCALE_FACTOR = 4;

    /**
     * The difference between the viewport and content dimension below which
     * the content will be snapped to fit after zooming.
     * @type {number}
     */
    var SNAP_TO_BOUNDS_THRESHOLD = 40;

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
     * Gets the scale after applying an inertial effect.
     * @param {number} target - The target scale.
     * @param {number} boundary - The boundary scale.
     * @param {number} delta - The cumulative delta scale for the interaction.
     * @param {number} start - The start scale for the interaction.
     * @returns {number} The inertial scale if limits are passed, else the target.
     */
    function getInertialScale(target, boundary, delta, start) {
        var threshold;
        var scaledValue;

        if (target < boundary) {
            threshold = start - (boundary / HARD_SCALE_LIMIT_FACTOR);
            scaledValue = (delta * start - boundary) / INERTIAL_SCALE_FACTOR;
            return boundary + Math.min(scaledValue, threshold);
        }

        // (target > boundary) - Cannot get here without boundary violation.
        threshold = (boundary * HARD_SCALE_LIMIT_FACTOR) - start;
        scaledValue = (delta * start - boundary) / INERTIAL_SCALE_FACTOR;
        return boundary + Math.min(scaledValue, threshold);
    }

    /**
     * Creates a new ScaleInterceptor with the given options.
     *
     * @classdesc
     *
     * A ScaleInterceptor enforces minimum and maximum scale limits for an AwesomeMap.
     *
     * @name ScaleInterceptor
     * @constructor
     * @mixes InterceptorMixin
     *
     * @param {Object} [options]
     *
     * @param {number} options.map
     *        The AwesomeMap this interceptor applies to.
     *
     * @param {number} [options.animationDuration=250]
     *        The animation duration for snapping to scale limits, in ms.
     *
     * @param {Function} [options.easing=EasingFunctions.easeOutQuart]
     *        The easing function that controls the animation effect.
     *        See {@link module:EasingFunctions|EasingFunctions} for the available strategies.
     *
     * @param {number} [options.minimum=1]
     *        The minimum allowable scale.
     *
     * @param {number} [options.maximum=1]
     *        The maximum allowable scale.
     *
     * @param {string} [options.mode='stop']
     *        Determines how to handle scale limit violations during interactions:
     *        'stop' disallows scaling beyond the limits and
     *        'slow' slows the scaling effect once limits are violated.
     *
     * @example
     *
     * new ScaleInterceptor({
     *     map: someAwesomeMap,
     *     animationDuration: 1000,
     *     easing: EasingFunctions.easeOutQuart,
     *     minimum: 0.5,
     *     maximum: 10,
     *     mode: 'slow'
     * });
     */
    var ScaleInterceptor = function(options) {
        options = options|| {};

        //---------------------------------------------------------
        // Private properties
        //---------------------------------------------------------

        /**
         * The animation duration for snapping to scale limits.
         * @type {number}
         * @private
         */
        this._animationDuration = Utils.valueOr(options.animationDuration, 250);

        /**
         * The easing function that controls the animation effect.
         * @type {Function}
         * @private
         */
        this._easing = options.easing || EasingFunctions.easeOutQuart;

        /**
         * The minimum allowable scale.
         * @type {number}
         * @private
         */
        this._minimum = options.minimum || 1;

        /**
         * The maximum allowable scale.
         * @type {number}
         * @private
         */
        this._maximum = options.maximum || 1;

        /**
         * Determines how to handle scale limit violations during interactions.
         * @type {string}
         * @private
         */
        this._mode = options.mode || Modes.STOP;
    };

    ScaleInterceptor.prototype = {

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Gets the current settings.
         * @method ScaleInterceptor#getSettings
         * @returns {{
         *     animationDuration: number,
         *     easing: Function,
         *     minimum: number,
         *     maximum: number,
         *     mode: string
         * }}
         */
        getSettings: function() {
            return {
                animationDuration: this._animationDuration,
                easing: this._easing,
                minimum: this._minimum,
                maximum: this._maximum,
                mode: this._mode
            };
        },

        /**
         * Intercepts transforms and applies scale limits.
         * @method ScaleInterceptor#handleTransformStarted
         * @param {AwesomeMap} source
         * @param {InteractionEvent} args.event
         * @param {TransformState} args.targetState
         */
        handleTransformStarted: function(source, args) {
            var evt = args.event;
            var targetState = args.targetState;
            var eventType = evt.type;

            // Track translations on touch events to scale inertial calculations.
            if (eventType === EventTypes.TOUCH) {

                this._touchState = targetState;
            }
            else if (eventType === EventTypes.RELEASE) {

                this._snapToLimit(evt, targetState);
            }
            else if (
                eventType === EventTypes.TRANSFORM ||
                eventType === EventTypes.TRANSFORM_START
                /* NOTE: transform end events do not report cumulative scale
                 * and cannot therefore be pulled to scale limits. */) {

                if (this._mode === Modes.SLOW) {
                    this._pullToLimit(evt, targetState);
                }
                else {
                    this._stopAtLimit(evt, targetState);
                }
            }
        },

        /**
         * Sets the maximum scale limit.
         * @param {number} value
         */
        setMaximumScale: function(value) {
            this._maximum = value;
        },

        /**
         * Sets the minimum scale limit.
         * @param {number} value
         */
        setMinimumScale: function(value) {
            this._minimum = value;
        },

        //---------------------------------------------------------
        // Private methods
        //---------------------------------------------------------

        /**
         * Modifies the target state to simulate an inertial pull to scale limits.
         * @param {InteractionEvent} event
         * @param {TransformState} targetState
         * @private
         */
        _pullToLimit: function(event, targetState) {
            var originalScale = targetState.scale;
            var newScale = targetState.scale;
            var deltaScale = event.cumulativeGesture.scale;
            var touchState = this._touchState || { scale: 1 };

            if (originalScale < this._minimum) {
                newScale = getInertialScale(
                    originalScale,
                    this._minimum,
                    deltaScale,
                    touchState.scale
                );
            }
            else if (originalScale > this._maximum) {
                newScale = getInertialScale(
                    originalScale,
                    this._maximum,
                    deltaScale,
                    touchState.scale
                );
            }

            if (newScale !== originalScale) {
                targetState.zoomBy(newScale / originalScale, 0, 0, event.position.x, event.position.y);
            }
        },

        /**
         * Modifies the target state to simulate a snap back to scale limits.
         * @param {InteractionEvent} event
         * @param {TransformState} targetState
         * @private
         */
        _snapToLimit: function(event, targetState) {
            var originalScale = targetState.scale;
            var newScale = targetState.scale;

            // Enforce the scale limits.
            if (originalScale < this._minimum) {
                newScale = this._minimum;
            }
            else if (originalScale > this._maximum) {
                newScale = this._maximum;
            }
            else { // REVIEW: Limit to touch events?
                var contentSize = this._awesomeMap.getContentDimensions();
                var viewportSize = this._awesomeMap.getViewportDimensions();
                var widthDelta = Math.abs(viewportSize.width - contentSize.width * originalScale);
                if (widthDelta <= SNAP_TO_BOUNDS_THRESHOLD) {
                    newScale = viewportSize.width / contentSize.width;
                }
                else {
                    var heightDelta = Math.abs(viewportSize.height - contentSize.height * originalScale);
                    if (heightDelta <= SNAP_TO_BOUNDS_THRESHOLD) {
                        newScale = viewportSize.height / contentSize.height;
                    }
                }
            }

            // If the scale has been limited, zoom the targetState over duration.
            if (newScale !== originalScale) {
                targetState.zoomBy(newScale / originalScale, 0, 0, event.position.x, event.position.y);
                targetState.duration = this._animationDuration;
                targetState.easing = this._easing;
            }
        },

        /**
         * Modifies the target state to impose hard scale limits.
         * @param {InteractionEvent} event
         * @param {TransformState} targetState
         * @private
         */
        _stopAtLimit: function(event, targetState) {
            var originalScale = targetState.scale;
            var newScale = targetState.scale;
            var minimumScale = this._minimum;
            var maximumScale = this._maximum;

            if (originalScale < minimumScale) {
                newScale = minimumScale;
            }
            else if (originalScale > maximumScale) {
                newScale = maximumScale;
            }

            if (newScale !== originalScale) {
                targetState.zoomBy(newScale / originalScale, 0, 0, event.position.x, event.position.y);
            }
        }
    };

    _.assign(ScaleInterceptor.prototype, InterceptorMixin);

    return ScaleInterceptor;
});
