/*
 * Copyright 2015 Workiva, Inc.
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
     * Creates an InteractionEvent from the given type and gestures.
     *
     * @classdesc
     *
     * An InteractionEvent represents the events synthesized by an
     * {@link EventSynthesizer} or simulated by an {@link InteractionSimulator}.
     *
     * @name InteractionEvent
     * @constructor
     *
     * @param {string} type
     *        The type of event.
     *
     * @param {Gesture} cumulativeGesture
     *        Gesture representing the current state of the interaction.
     *
     * @param {Gesture} iterativeGesture
     *        Gesture representing the iterative state of the gesture.
     *
     * @example
     *
     * // Create an InteractionEvent from a captured gesture.
     * var cumulativeGesture = new Gesture(...);
     * var iterativeGesture = lastGesture.createIterativeGesture(cumulativeGesture);
     *
     * var interactionEvent = new InteractionEvent(EventTypes.DRAG, cumulativeGesture, iterativeGesture);
     */
    var InteractionEvent = function(type, cumulativeGesture, iterativeGesture) {

        //---------------------------------------------------------
        // Public properties
        //---------------------------------------------------------

        /**
         * Whether the event has been cancelled by an observer.
         * @member InteractionEvent#cancelled
         * @type {boolean}
         * @default false
         */
        this.cancelled = false;

        /**
         * The cumulative state of the interaction when the event was triggered.
         * This should reflect the change in state from the initial touch gesture.
         * @member InteractionEvent#cancelled
         * @type {Gesture}
         */
        this.cumulativeGesture = cumulativeGesture;

        /**
         * The incremental state of the gesture that triggered this event.
         * This should reflect the change in state from the previous gesture.
         * @member InteractionEvent#iterativeGesture
         * @type {Gesture}
         */
        this.iterativeGesture = iterativeGesture;

        /**
         * The center point of the gesture relative to the target element.
         * @member InteractionEvent#position
         * @type {{ x: number, y: number }}
         */
        this.position = iterativeGesture.getPosition();

        /**
         * Flag to mark simulated events and distinguish from gesture-based events.
         * @member InteractionEvent#simulated
         * @type {boolean}
         * @default false
         */
        this.simulated = false;

        /**
         * The Event that serves as the source of this instance.
         * @member InteractionEvent#source
         * @type {Event}
         */
        this.source = cumulativeGesture.source;

        /**
         * The target element of the event.
         * @property InteractionEvent#target
         * @type {HTMLElement}
         */
        this.target = cumulativeGesture.target;

        /**
         * The target transform state for this event. This is used when simulated
         * events need to finish at a specific state and therefore must wait to
         * calculate gesture deltas until the moment when the event is processed.
         * If this is not done, deltas might be calculated from a current
         * transform state that is modified by the time this event is processed.
         * @member InteractionEvent#targetState
         * @type {{ translateX: number, translateY: number, scale: number }}
         */
        this.targetState = null;

        /**
         * The event type. See {@link module:EventTypes|EventTypes}.
         * @member InteractionEvent#type
         * @type {string}
         */
        this.type = type;
    };

    return InteractionEvent;
});