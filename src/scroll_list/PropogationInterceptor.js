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
    var InterceptorMixin = require('wf-js-uicomponents/awesome_map/InterceptorMixin');

    /**
     * Creates a new PropogationInterceptor for the given {@link ScrollList}.
     *
     * @classdesc
     *
     * The PropogationInterceptor propogates interaction events from a
     * list map to the current item map if the event is not cancelled
     * by the list map.
     *
     * @name PropogationInterceptor
     * @constructor
     * @mixes InterceptorMixin
     *
     * @param  {ScrollList} scrollList
     */
    var PropogationInterceptor = function(scrollList) {

        //---------------------------------------------------------
        // Private properties
        //---------------------------------------------------------

        /**
         * The scroll list this interceptor applies to.
         * @type {ScrollList}
         */
        this._scrollList = scrollList;
    };

    PropogationInterceptor.prototype = {

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Passes interactions to the current item map.
         * @param {AwesomeMap} source - The source of the event.
         * @param {InteractionEvent} args.event - The interaction event.
         * @return {undefined|false}
         */
        handleInteraction: function(source, args) {
            var event = args.event;

            // The source map can cancel an event after it is handled to prevent transfer.
            // Also want to let simulations play out on source map only.
            if (event.cancelled || event.simulated) {
                return;
            }

            this._scrollList.getCurrentItemMap().handleInteractionEvent(this, { event: event });

            return false;
        }
    };

    _.assign(PropogationInterceptor.prototype, InterceptorMixin);

    return PropogationInterceptor;
});
