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

    var _ = require('lodash');
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');
    var InterceptorMixin = require('wf-js-uicomponents/awesome_map/InterceptorMixin');

    /**
     * Creates a new MouseWheelNavigationInterceptor for the given {@link PresentationScrollList}.
     *
     * @classdesc
     *
     * The MouseWheelNavigationInterceptor is used by the PresentationScrollList to enable
     * mouse wheel navigation of content. It is smart enough to pause when the user
     * scrolls overflowed content to its boundary so that a touchy page jump doesn't
     * happen, and it's also smart enough to prevent continued scrolling immediately
     * after a page jump.
     *
     * @name MouseWheelNavigationInterceptor
     * @constructor
     * @mixes InterceptorMixin
     *
     * @param {PresentationScrollList} scrollList
     *        The scroll list that owns this interceptor.
     */
    var MouseWheelNavigationInterceptor = function(scrollList) {

        //---------------------------------------------------------
        // Private properties
        //---------------------------------------------------------

        /**
         * The scrolll list that owns this interceptor.
         * @type {PresentationScrollList}
         * @private
         */
        this._scrollList = scrollList;

        /**
         * The window timeout handle used to debounce mouse wheels.
         * @type {number}
         * @private
         */
        this._debounced = null;
    };

    MouseWheelNavigationInterceptor.prototype = {

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Handles mousewheel interactions and either scrolls or navigates among
         * the content accordingly.
         * @method MouseWheelNavigationInterceptor#handleInteraction
         * @param {AwesomeMap} source - The source map.
         * @param {InteractionEvent} args.event - The interaction event.
         * @return {undefined|false}
         */
        handleInteraction: function(source, args) {
            var event = args.event;

            if (event.type === EventTypes.MOUSE_WHEEL) {

                if (this._debounced || this._handleMouseWheel(event)) {
                    this._debounce();
                    return false;
                }
            }
        },

        //---------------------------------------------------------
        // Private methods
        //---------------------------------------------------------

        /**
         * Debounces mousewheel events using a window timeout.
         * @private
         */
        _debounce: function() {
            var self = this;

            if (this._debounced) {
                clearTimeout(this._debounced);
            }

            this._debounced = setTimeout(function() {
                self._debounced = null;
            }, 100);
        },

        /**
         * Performs mousewheel event handling.
         * @param {InteractionEvent} event
         * @return {boolean} true when the mouse wheel is handled.
         * @private
         */
        _handleMouseWheel: function(event) {
            var deltaY = event.iterativeGesture.deltaY;

            var scrollList = this._scrollList;
            var currentContentIndex = scrollList.getCurrentItem().index;
            if (currentContentIndex === -1) {
                return;
            }
            var newContentIndex;

            var listMap = this._awesomeMap;
            var viewportHeight = listMap.getViewportDimensions().height;

            var itemMap = scrollList.getCurrentItemMap();
            var contentState = itemMap.getCurrentTransformState();
            var contentHeight = itemMap.getContentDimensions().height;
            var contentTop = contentState.translateY;
            var contentBottom = contentTop + Math.floor(contentHeight * contentState.scale);

            // If content is overflowing the viewport and mouse wheel is scrolling
            // the overflow into view, debounce future mouse mousewheels if the
            // content will be scrolled to top/bottom by the current event.
            // This will prevent inadvertently jumping to adjoining content
            // when the user probably just wants to scroll the current into view.
            if ((deltaY < 0 && contentBottom > viewportHeight && contentBottom + deltaY <= viewportHeight) ||
                (deltaY > 0 && contentTop < 0 && contentTop + deltaY >= 0)) {

                this._debounce();
                return false;
            }

            // Jump to adjoining content if:
            // - scrolling up and content bottom is visible
            // - scrolling down and content top is visible
            if ((deltaY < 0 && contentBottom <= viewportHeight) ||
                (deltaY > 0 && contentTop >= 0)) {

                newContentIndex = currentContentIndex + (deltaY < 0 ? 1 : -1);
                scrollList.scrollToItem({ index: newContentIndex, duration: 0 });

                return true;
            }

            return false;
        }
    };

    _.assign(MouseWheelNavigationInterceptor.prototype, InterceptorMixin);

    return MouseWheelNavigationInterceptor;
});
