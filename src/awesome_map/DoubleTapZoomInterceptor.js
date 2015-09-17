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
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');
    var InterceptorMixin = require('wf-js-uicomponents/awesome_map/InterceptorMixin');

    /**
     * Creates a new DoubleTapZoomInterceptor.
     *
     * @classdesc
     *
     * The DoubleTapZoomInterceptor will zoom an {@link AwesomeMap} in and out on
     * double tap events:
     * if the map is currently scaled at 100%, it will be scaled to 200%;
     * otherwise, the map will be scaled to 100%.
     *
     * @name DoubleTapZoomInterceptor
     * @constructor
     * @mixes InterceptorMixin
     *
     * @param {number} [options.animationDuration=500]
     *        The duration of the zoom animation, in ms.
     */
    var DoubleTapZoomInterceptor = function(options) {
        this._handleDoubleTap = false;

        this._options = _.extend({
            animationDuration: 500
        }, options);
    };

    DoubleTapZoomInterceptor.prototype = {

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * If this is a double tap interaction, flag the upcoming release event.
         * @param {AwesomeMap} source
         * @param {InteractionEvent} args.event
         * @param {TransformState} args.currentState
         */
        handleInteraction: function(source, args) {
            if (args.event.type === EventTypes.DOUBLE_TAP &&
                args.event.source.type.indexOf('touch') === 0
            ) {
                this._handleDoubleTap = true;
            }
        },

        /**
         * If we just encountered a double tap, then perform the zoom on the
         * release event that will follow. This allows the zooming to happen at
         * the same time as boundary interception.
         * @param {AwesomeMap} source
         * @param {InteractionEvent} args.event
         * @param {TransformState} args.targetState
         */
        handleTransformStarted: function(source, args) {
            var event = args.event;

            if (this._handleDoubleTap && event.type === EventTypes.RELEASE) {
                this._performZoom(event, args.targetState);
                this._handleDoubleTap = false;
            }
        },

        //---------------------------------------------------------
        // Private methods
        //---------------------------------------------------------

        /**
         * Performs the zoom logic for double tap events.
         * @param {InteractionEvent} event
         * @param {TranformState} currentState
         */
        _performZoom: function(event, targetState) {
            var currentScale = targetState.scale;
            var newScale = currentScale === 1 ? 2 : 1;
            var position = event.position;

            targetState.zoomBy(newScale / currentScale, 0, 0, position.x, position.y);
            targetState.duration = this._options.animationDuration;
        }
    };

    _.assign(DoubleTapZoomInterceptor.prototype, InterceptorMixin);

    return DoubleTapZoomInterceptor;
});
