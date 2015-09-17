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

define(function(require) {
    'use strict';

    var TransformUtil = require('wf-js-uicomponents/awesome_map/TransformUtil');

    /**
     * Creates a Transformation with a target state to be applied to a target element.
     *
     * @classdesc
     *
     * A Transformation is a command representing the application of CSS transforms
     * to a target element. It may be executed only once, and it can be cancelled
     * mid-stream if the transform is animated.
     *
     * @name Transformation
     * @constructor
     *
     * @param {HTMLElement} target
     *        The element to be transformed.
     *
     * @param {TransformState} targetState
     *        The target transform state to apply.
     *
     * @param {TransformState} currentState
     *        The current transform state of the target element.
     *
     * @example
     *
     * var target = document.getElementById('target');
     * var currentState = new TransformState();
     * var targetState = new TransformState({ translateX: 100 });
     *
     * var transformation = new Transformation(target, targetState, currentState);
     *
     * transformation.execute(function(endState) { });
     * transformation.cancel();
     */
    var Transformation = function(target, targetState, currentState) {

        //---------------------------------------------------------
        // Private properties
        //---------------------------------------------------------

        /**
         * An animation that can be stopped.
         * @type {{ stop: Function }}
         * @private
         */
        this._animation = null;

        /**
         * The current transform state.
         * @type {TransformState}
         * @private
         */
        this._currentState = currentState;

        /**
         * Whether the transformation has been executed.
         * @type {boolean}
         * @private
         */
        this._executed = false;

        /**
         * The target of the transformation.
         * @type {HTMLElement}
         * @private
         */
        this._target = target;

        /**
         * The target transform state.
         * @type {TransformState}
         * @private
         */
        this._targetState = targetState;
    };

    Transformation.prototype = {


        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Cancel an animating transformation and return the transform state at
         * the time of cancellation.
         * @method Transformation#cancel
         * @returns {TransformState|undefined}
         */
        cancel: function() {
            var animation = this._animation;
            if (animation) {
                var cancelledState = animation.stop();
                animation = null;
                return cancelledState;
            }
        },

        /**
         * Execute the transformation.
         * @method Transformation#execute
         * @param {Function} [done]
         */
        execute: function(done) {
            var targetState = this._targetState;
            done = done || function() {};

            // Only execute once!
            if (this._executed) {
                done(targetState);
                return;
            }
            this._executed = true;

            // Don't run the transform if there's no targetState or change.
            if (!targetState || targetState.equals(this._currentState)) {
                done(targetState);
                return;
            }

            this._apply(done);
        },

        //---------------------------------------------------------
        // Private methods
        //---------------------------------------------------------

        /**
         * Applies a transformation.
         * @param {Function} done
         * @private
         */
        _apply: function(done) {
            var target = this._target;
            var targetState = this._targetState;
            var currentState = this._currentState;

            if (targetState.duration > 0) {
                this._animation = TransformUtil.animate(target, targetState, currentState, done);
            }
            else {
                TransformUtil.applyTransform(target, targetState);
                done(targetState);
            }
        }
    };

    return Transformation;
});
