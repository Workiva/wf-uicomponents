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

    var Transformation = require('wf-js-uicomponents/awesome_map/Transformation');
    var TransformState = require('wf-js-uicomponents/awesome_map/TransformState');
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');

    /**
     * Module that facilitates testing dependencies, as the methods can be mocked.
     */
    var dependencies = {
        createTransformation: function(target, targetState, currentState) {
            return new Transformation(target, targetState, currentState);
        }
    };

    /**
     * Creates a TransformationQueue for the given AwesomeMap.
     *
     * @classdesc
     *
     * A TransformationQueue ensures that all InteractionEvents observed
     * by an AwesomeMap are eventually transformed.
     *
     * @name TransformationQueue
     * @constructor
     *
     * @param {AwesomeMap} map
     *        The AwesomeMap that owns this instance.
     *
     * @example
     *
     * var queue = new TransformationQueue(map);
     *
     * queue.enqueue(interactionEvent, function(transformState) {
     *     // Do something when the transform eventually finishes.
     * });
     */
    var TransformationQueue = function(map) {

        //---------------------------------------------------------
        // Private properties
        //---------------------------------------------------------

        /**
         * The currently executing transformation.
         * @type {Transformation}
         * @private
         */
        this._currentTransformation = null;

        /**
         * The AwesomeMap that owns this instance.
         * @type {AwesomeMap}
         * @private
         */
        this._map = map;

        /**
         * Whether the queue is currently being processed.
         * @type {boolean}
         * @private
         */
        this._processing = false;

        /**
         * The queue of events and callbacks.
         * @type {Array.<{InteractionEvent, Function}>}
         * @private
         */
        this._queue = [];
    };

    TransformationQueue.prototype = {

        //---------------------------------------------------------
        // Public properties
        //---------------------------------------------------------

        /**
         * Gets whether queued items are being processed.
         * @method TransformationQueue#isProcessing
         * @return {boolean}
         */
        isProcessing: function() {
            return this._processing;
        },

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Cancel the currently executing transformation and return the state
         * of the map at the time of cancellation.
         * @method TransformationQueue#cancelCurrentTransformation
         * @returns {TransformState|undefined}
         */
        cancelCurrentTransformation: function() {
            if (this._currentTransformation) {
                return this._currentTransformation.cancel();
            }
        },

        /**
         * Queues an event for transformation.
         * @method TransformationQueue#enqueue
         * @param {InteractionEvent} event - The event to eventually transform.
         * @param {Function} done - Callback invoked when the transform finishes.
         * @return {Array.<{InteractionEvent, Function}>} - The current queue.
         */
        enqueue: function(event, done) {
            // There is no need to worry about transforming mousemove events.
            // Furthermore, if transforming has finished and there are mousemove
            // events in the TransformatmionQueue, it will prevent new placeholders
            // from being rendered at all.
            if (this._processing && event.type === EventTypes.MOUSE_MOVE) {
                return this._queue;
            }

            this._queue.push({
                event: event,
                done: done
            });

            return this._queue;
        },

        /**
         * Processes all the events in the queue.
         * @method TransformationQueue#processEvents
         * @returns {false|undefined} Returns false if the queue is already processing.
         */
        processEvents: function() {
            var self = this;
            var map = this._map;
            var target = map.getTransformationPlane();
            var processEvent;
            var createTransformation = dependencies.createTransformation;

            // If we're already processing, bail.
            if (this._processing) {
                return false;
            }
            this._processing = true;

            // Processes all the items in the queue recursively.
            processEvent = function() {
                var item;
                var oldState;
                var event;
                var targetState;

                // If there's nothing left in the queue, return.
                if (self._queue.length === 0) {
                    return;
                }

                // Get the target state for the transform.
                item = self._queue.shift();
                event = item.event;
                oldState = map.getCurrentTransformState();
                targetState = TransformState.fromEvent(event, oldState);

                // Allow interception and modification of the target state.
                map.onTransformStarted.dispatch([map, {
                    event: event,
                    targetState: targetState
                }]);

                // Track the current transformation so it can be cancelled.
                self._currentTransformation = createTransformation(target, targetState, oldState);
                self._currentTransformation.execute(function(newState) {

                    self._currentTransformation = null;
                    self._processing = self._queue.length > 0;

                    item.done(newState);

                    // Notify subscribers that the transform finished.
                    map.onTransformFinished.dispatch([map, {
                        event: event,
                        finalState: newState
                    }]);

                    processEvent();
                });
            };
            processEvent();
        }
    };

    //---------------------------------------------------------
    // Static members
    //---------------------------------------------------------

    TransformationQueue.dependencies = dependencies;

    return TransformationQueue;
});
