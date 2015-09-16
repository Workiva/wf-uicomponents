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

    var DestroyUtil = require('wf-js-common/DestroyUtil');

    /**
     * @classdesc
     *
     * The InterceptorMixin provides lifecycle management methods to interceptors.
     * These methods are only used inside {@link AwesomeMap} instances.
     *
     * @name InterceptorMixin
     * @mixin
     */
    var InterceptorMixin = {

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Disposes the instance.
         * @method InterceptorMixin.dispose
         */
        dispose: function() {
            var map = this._awesomeMap;

            if (map && !map.isDisposed()) {
                map.onInteraction.remove(this._onInteractionCallback);
                map.onTransformFinished.remove(this._onTransformFinishedCallback);
                map.onTransformStarted.remove(this._onTransformStartedCallback);
            }

            DestroyUtil.destroy(this);
        },

        /**
         * Registers the interceptor against the given AwesomeMap.
         * This method will wire up subscriptions for the AwesomeMap's observables.
         * @method InterceptorMixin.register
         * @param {AwesomeMap} awesomeMap
         */
        register: function(awesomeMap) {
            // Bail if the awesome map is disposed.
            if (awesomeMap.isDisposed()) {
                return;
            }

            // Only allow registration once.
            if (this._awesomeMap) {
                throw new Error('This interceptor is already registered.');
            }

            this._awesomeMap = awesomeMap;

            // TODO: Move to public methods named handleXxx
            if (this._onInteraction || this.handleInteraction) {
                this._onInteractionCallback = (this._onInteraction || this.handleInteraction).bind(this);
                awesomeMap.onInteraction(this._onInteractionCallback);
            }
            if (this._onTransformFinished || this.handleTransformFinished) {
                this._onTransformFinishedCallback = (this._onTransformFinished || this.handleTransformFinished).bind(this);
                awesomeMap.onTransformFinished(this._onTransformFinishedCallback);
            }
            if (this._onTransformStarted || this.handleTransformStarted) {
                this._onTransformStartedCallback = (this._onTransformStarted || this.handleTransformStarted).bind(this);
                awesomeMap.onTransformStarted(this._onTransformStartedCallback);
            }
        }
    };

    return InterceptorMixin;
});