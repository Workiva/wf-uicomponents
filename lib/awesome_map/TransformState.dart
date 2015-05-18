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

    var EasingFunctions = require('wf-js-uicomponents/awesome_map/EasingFunctions');
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');

    /**
     * Creates a new TransformState, copying properties from the given template object.
     *
     * @classdesc
     *
     * A TransformState encapsulates the information needed to apply a
     * {@link Transformation} to an HTML element.
     *
     * @name TransformState
     * @constructor
     *
     * @param {Object} [template]
     *        A TransformState-like object.
     *
     * @example
     *
     * // Will use default values for all properties not specified in the template.
     * var state = new TransformState({
     *     scale: 2,
     *     duration: 500
     * });
     */
    var TransformState = function(template) {
        template = template || {};

        //---------------------------------------------------------
        // Public properties
        //---------------------------------------------------------

        /**
         * The animation duration, in ms.
         * @member TransformState#duration
         * @type {number}
         * @default 0
         */
        this.duration = template.duration || 0;

        /**
         * The easing function to use during animations.
         * See {@link module:EasingFunctions|EasingFunctions}.
         * @member TransformState#easing
         * @type {Function}
         * @default {@link module:EasingFunctions|EasingFunctions}.easeOutQuart
         */
        this.easing = template.easing || EasingFunctions.easeOutQuart;

        /**
         * The scale.
         * @member TransformState#scale
         * @type {number}
         * @default 1
         */
        this.scale = template.scale || 1;

        /**
         * The translation along the x-axis.
         * @member TransformState#translateX
         * @type {number}
         * @default 0
         */
        this.translateX = template.translateX || 0;

        /**
         * The translation along the y-axis.
         * @member TransformState#translateY
         * @type {number}
         * @default 0
         */
        this.translateY = template.translateY || 0;
    };

    TransformState.prototype = {

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Clones the instance.
         * @method TransformState#clone
         * @returns {TransformState}
         */
        clone: function() {
            return new TransformState(this);
        },

        /**
         * Checks whether this state is equal to the other state.
         * @method
         * @param {TransformState} other
         * @returns {boolean}
         */
        equals: function(other) {
            return other.scale === this.scale &&
                   other.translateX === this.translateX &&
                   other.translateY === this.translateY;
        },

        /**
         * Modify the state by simulating a pan.
         * @param {number} deltaX - The position change along the x-axis.
         * @param {number} deltaY - The position change along the y-axis.
         */
        panBy: function(deltaX, deltaY) {
            this.translateX = Math.round(this.translateX + deltaX);
            this.translateY = Math.round(this.translateY + deltaY);
        },

        /**
         * Modify the state by simulating a zoom.
         * @param {number} scale - The relative scale to zoom by.
         * @param {number} deltaX - The position change along the x-axis.
         * @param {number} deltaY - The position change along the y-axis.
         * @param {number} positionX - The x-axis position of the interaction.
         * @param {number} positionY - The y-axis position of the interaction.
         */
        zoomBy: function(scale, deltaX, deltaY, positionX, positionY) {
            var currentScale = this.scale;
            var newScale;

            // Simulate an origin in order to calculate the final translation.
            var translateX = this.translateX;
            var translateY = this.translateY;
            var originX = (positionX - translateX) / currentScale;
            var originY = (positionY - translateY) / currentScale;

            // Offset the current translation by the simulated origin.
            translateX += originX * (currentScale - 1);
            translateY += originY * (currentScale - 1);

            // Update the scale and translation from the gesture.
            newScale = currentScale * scale;
            translateX += deltaX;
            translateY += deltaY;

            // Adjust translation before removing simulated origin.
            translateX -= originX * (newScale - 1);
            translateY -= originY * (newScale - 1);

            // Assign the new values.
            this.scale = newScale;
            this.translateX = Math.round(translateX);
            this.translateY = Math.round(translateY);
        }
    };

    //---------------------------------------------------------
    // Static members
    //---------------------------------------------------------

    /**
     * Gets the target TransformState for the event.
     * @method TransformState.fromEvent
     * @param {InteractionEvent} event - An interaction event.
     * @param {TransformState} currentState - The current transform state.
     * @returns {TransformState}
     *          Returns a target state if the event has a default handler;
     *          otherwise it returns the current transform state.
     */
    TransformState.fromEvent = function(event, currentState) {
        var position = event.position || { x: 0, y: 0 };
        var gesture = event.iterativeGesture;
        var newState = currentState.clone();
        var targetState;

        // Setup the default return values.
        newState.duration = gesture.duration;

        // Handle events that need to defer the calculation of deltas.
        if (event.simulated && event.targetState) {
            targetState = event.targetState;
            if (targetState.translateX !== undefined) {
                gesture.deltaX = targetState.translateX - currentState.translateX;
            }
            if (targetState.translateY !== undefined) {
                gesture.deltaY = targetState.translateY - currentState.translateY;
            }
            if (targetState.scale !== undefined) {
                gesture.scale = targetState.scale / currentState.scale;
            }
        }

        switch (event.type) {

        case EventTypes.DRAG:
        case EventTypes.DRAG_END:
        case EventTypes.DRAG_START:
        case EventTypes.MOUSE_WHEEL:

            newState.panBy(gesture.deltaX, gesture.deltaY);
            break;

        case EventTypes.TRANSFORM:

            newState.zoomBy(gesture.scale, gesture.deltaX, gesture.deltaY, position.x, position.y);
            break;

        case EventTypes.TRANSFORM_END:
        case EventTypes.TRANSFORM_START:

            // No translation on start or end because the gesture deltas can be huge
            // due to the addition and release of fingers.
            // For example: 1 finger at (100, 100) then a 2nd finger at (200, 200)
            // will yield a delta of (50, 50) representing the change from the position
            // of the first finger to the center point between two fingers.
            newState.zoomBy(gesture.scale, 0, 0, position.x, position.y);
            break;

        default:
            break;
        }

        return newState;
    };

    return TransformState;
});
