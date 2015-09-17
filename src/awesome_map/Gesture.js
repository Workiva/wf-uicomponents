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

define(function() {
    'use strict';

    /**
     * The minimum amount of pixel difference between touches to trigger a zoom.
     * @type {number}
     */
    var MINIMUM_PIXEL_DISTANCE_CHANGE = 2; // 4 pixels

    /**
     * Creates a Gesture, copying properties from the given template object.
     *
     * @classdesc
     *
     * A Gesture represents gestures captured by an {@link EventSynthesizer}
     * and attached to an {@link InteractionEvent}.
     *
     * @name Gesture
     * @constructor
     *
     * @param {Object} [template]
     *        A Gesture-like object.
     *
     * @example
     *
     * // Will use default values for all properties not specified in the template.
     * var gesture = new Gesture({
     *     deltaX: 100,
     *     velocityX: 2,5
     * });
     */
    var Gesture = function(template) {
        template = template || {};

        if (template.hasOwnProperty('srcEvent') || template.hasOwnProperty('deltaTime')) {
            throw new Error(
                'The template seems to be a Hammer gesture. ' +
                'Use Gesture.fromHammerGesture to convert ' +
                'before passing into this constructor.');
        }

        //---------------------------------------------------------
        // Public properties
        //---------------------------------------------------------

        /**
         * The angle of the gesture, in degrees.
         * Zero degrees is right of center, and the angle increases clockwise.
         * @member Gesture#angle
         * @type {number}
         */
        this.angle = template.angle || null;

        /**
         * The center point of the gesture, relative to the page.
         * @member Gesture#center
         * @type {{ pageX: number, pageY: number }}
         */
        this.center = template.center || null;

        /**
         * The change in position along the x-axis.
         * @member Gesture#deltaX
         * @type {number}
         * @default 0
         */
        this.deltaX = template.deltaX || 0;

        /**
         * The change in position along the y-axis.
         * @member Gesture#deltaY
         * @type {number}
         * @default 0
         */
        this.deltaY = template.deltaY || 0;

        /**
         * The direction of the gesture: 'up', 'down', 'left' or 'right'.
         * @member Gesture#direction
         * @type {string}
         */
        this.direction = template.direction || null;

        /**
         * The duration of the gesture, in ms.
         * @member Gesture#duration
         * @type {number}
         * @default 0
         */
        this.duration = template.duration || 0;

        /**
         * The scale of the gesture, where 1 represents a zoom level of 100%.
         * @member Gesture#scale
         * @type {number}
         * @default 1
         */
        this.scale = template.scale || 1;

        /**
         * The source event that triggered the gesture.
         * @member Gesture#source
         * @type {Event}
         */
        this.source = template.source || null;

        /**
         * The target element the gesture was performed upon.
         * @member Gesture#target
         * @type {HTMLElement}
         */
        this.target = template.target || null;

        /**
         * The position of the fingers during the gesture, relative to the page.
         * @member Gesture#touches
         * @type {Array.<{ pageX: number, pageY: number }>}
         * @default []
         */
        this.touches = template.touches || [];

        /**
         * The velocity of the gesture along the x-axis.
         * @member Gesture#velocityX
         * @type {number}
         * @default 0
         */
        this.velocityX = template.velocityX || 0;

        /**
         * The velocity of the gesture along the y-axis.
         * @member Gesture#velocityY
         * @type {number}
         * @default 0
         */
        this.velocityY = template.velocityY || 0;
    };

    Gesture.prototype = {

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Clones the gesture.
         * @method Gesture#clone
         * @returns {Gesture}
         */
        clone: function() {
            var center = this.center;
            var touches = [];
            var i;
            var length;
            var touch;

            for (i = 0, length = this.touches.length; i < length; i++) {
                touch = this.touches[i];
                touches.push({
                    pageX: touch.pageX,
                    pageY: touch.pageY
                });
            }

            return new Gesture({
                angle: this.angle,
                center: !center ? undefined : {
                    pageX: center.pageX,
                    pageY: center.pageY
                },
                deltaX: this.deltaX,
                deltaY: this.deltaY,
                direction: this.direction,
                duration: this.duration,
                scale: this.scale,
                source: this.source,
                target: this.target,
                touches: touches,
                velocityX: this.velocityX,
                velocityY: this.velocityY
            });
        },

        /**
         * Creates a gesture with iterative deltas from the given gesture.
         * By default, we track cumulative changes over the entire interaction.
         * @method Gesture#createIterativeGesture
         * @param {Gesture} gesture - The gesture to compare.
         * @returns {Gesture} A gesture with iterative deltas.
         */
        createIterativeGesture: function(gesture) {
            var iterativeGesture = this.clone();

            // Calculate iterative deltas for the gesture.
            iterativeGesture.deltaX -= gesture.deltaX;
            iterativeGesture.deltaY -= gesture.deltaY;
            iterativeGesture.duration -= gesture.duration;

            if (this._validateTouchDistance(gesture)) {
                iterativeGesture.scale /= gesture.scale;
            }
            else {
                iterativeGesture.scale = 1;
            }

            return iterativeGesture;
        },

        /**
         * Gets the gesture position relative to the target.
         * @method Gesture#getPosition
         * @returns {null|{ x: number, y: number }} Returns null if no position data is available.
         */
        getPosition: function() {
            var target = this.target;
            var center = this.center;
            var targetRect;

            if (target && center) {
                targetRect = target.getBoundingClientRect();
                return {
                    x: center.pageX - targetRect.left,
                    y: center.pageY - targetRect.top
                };
            }
            else {
                return null;
            }
        },

        /**
         * Calculates the distance between touches.
         * @method Gesture#getTouchDistance
         * @returns {number}
         */
        getTouchDistance: function() {
            var touches = this.touches;

            if (touches.length !== 2) {
                return 0;
            }

            var touch1 = touches[0];
            var touch2 = touches[1];
            var x = touch1.pageX - touch2.pageX;
            var y = touch1.pageY - touch2.pageY;

            return Math.sqrt(x * x + y * y);
        },

        //---------------------------------------------------------
        // Private methods
        //---------------------------------------------------------

        /**
         * Prevent bad transform behavior by validating the touch distance delta:
         * if the delta is too large there is sticky behavior;
         * if the delta is too small there is screen jiggle.
         * @param {Gesture} gesture - The gesture to compare.
         * @returns {boolean} Returns true if the delta is acceptable.
         * @private
         */
        _validateTouchDistance: function(gesture) {
            var delta = this.getTouchDistance() - gesture.getTouchDistance();
            return Math.abs(delta) > MINIMUM_PIXEL_DISTANCE_CHANGE;
        }
    };

    //---------------------------------------------------------
    // Static members
    //---------------------------------------------------------

    /**
     * Creates a new gesture from a Hammer-like gesture.
     * This method provides a convenient way to map between property names
     * in our Gesture object and the anonymous gesture object Hammer uses.
     * @method Gesture.fromHammerGesture
     * @param {{
     *     angle: number,
     *     center: { pageX: number, pageY: number },
     *     deltaX: number,
     *     deltaY: number,
     *     deltaTime: number,
     *     direction: string,
     *     scale: number,
     *     srcEvent: Event,
     *     target: HTMLElement,
     *     touches: Array.<{ pageX: number, pageY: number }>,
     *     velocityX: number,
     *     velocityY: number
     * }} gesture - A Hammer-like gesture
     * @returns {Gesture}
     */
    Gesture.fromHammerGesture = function(gesture) {
        return new Gesture({
            angle: gesture.angle,
            center: gesture.center,
            deltaX: gesture.deltaX,
            deltaY: gesture.deltaY,
            direction: gesture.direction,
            duration: 0, // No duration after the interaction has happened.
            scale: gesture.scale,
            source: gesture.srcEvent,
            target: gesture.target,
            touches: gesture.touches,
            velocityX: gesture.velocityX,
            velocityY: gesture.velocityY
        });
    };

    return Gesture;
});
