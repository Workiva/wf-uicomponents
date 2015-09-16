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
     * Creates a ViewportResizeInterceptor.
     *
     * @classdesc
     *
     * A ViewportResizeInterceptor refreshes the placeholders in a list map
     * whenever the viewport is resized.
     *
     * @name ViewportResizeInterceptor
     * @constructor
     * @mixes InterceptorMixin
     *
     * @param {Object} scrollList
     *        The scroll list that owns the interceptor.
     */
    var ViewportResizeInterceptor = function(scrollList) {

        //---------------------------------------------------------
        // Private properties
        //---------------------------------------------------------

        /**
         * The scroll list that owns the interceptor.
         * @type {Object}
         * @private
         */
        this._scrollList = scrollList;

        /**
         * The debounced resize handler.
         * @type {Function}
         * @private
         */
        this._debouncedRefresh = _.debounce(function() {
            scrollList.refresh();
        }, 100);
    };

    ViewportResizeInterceptor.prototype = {

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Intercept resize events and refresh the scroll list.
         * @method ViewportResizeInterceptor#handleInteraction
         * @param {AwesomeMap} source
         * @param {InteractionEvent} args.event
         */
        handleInteraction: function(source, args) {
            if (args.event.type === EventTypes.RESIZE) {
                this._debouncedRefresh();
                return false;
            }
        }
    };

    _.assign(ViewportResizeInterceptor.prototype, InterceptorMixin);

    return ViewportResizeInterceptor;
});
