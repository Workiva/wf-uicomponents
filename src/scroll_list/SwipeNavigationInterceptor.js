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
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');
    var InterceptorMixin = require('wf-js-uicomponents/awesome_map/InterceptorMixin');

    /**
     * Creates a SwipeNavigationInterceptor.
     *
     * @classdesc
     *
     * A SwipeNavigationInterceptor triggers a jump to adjoining content if the
     * current content is at its relevant boundary. For example, if the current
     * content bottom is visible and the user swipes up, the scroll list will
     * jump to the next page.
     *
     * @name SwipeNavigationInterceptor
     * @constructor
     * @mixes InterceptorMixin
     *
     * @param {PresentationScrollList} scrollList
     *        The scroll list that owns the interceptor.
     */
    var SwipeNavigationInterceptor = function(scrollList) {
        this._validateConfiguration(scrollList);

        //---------------------------------------------------------
        // Private properties
        //---------------------------------------------------------

        /**
         * The scroll list that owns the interceptor.
         * @type {PresentationScrollList}
         * @private
         */
        this._scrollList = scrollList;
    };

    SwipeNavigationInterceptor.prototype = {

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Intercepts swipes and translates them into page changes if the content
         * is at the relevant boundary. For example, if swiping up, and the bottom
         * of the content is visible, then a page change will occur.
         * @param {AwesomeMap} source
         * @param {InteractionEvent} args.event
         * @returns {undefined|boolean}
         * @private
         */
        handleInteraction: function(source, args) {
            var event = args.event;
            var currentContentIndex;
            var newContentIndex;
            var direction;

            if (event.type === EventTypes.SWIPE) {

                // See if we are changing to another content item.
                // If so, jump to that content.

                direction = event.iterativeGesture.direction;
                currentContentIndex = this._scrollList.getCurrentItem().index;
                newContentIndex = this._getContentIndex(direction);

                if (newContentIndex !== currentContentIndex && this._isContentBoundaryVisible(direction)) {
                    this._scrollList.scrollToItem({ index: newContentIndex });
                    return false;
                }
            }
        },

        //---------------------------------------------------------
        // Private methods
        //---------------------------------------------------------

        /**
         * Gets the content index from the navigation direction.
         * @param {string} direction - Either 'up' or 'down'.
         * @private
         */
        _getContentIndex: function(direction) {
            var currentContentIndex = this._scrollList.getCurrentItem().index;
            var numberOfItems = this._scrollList.getItemSizeCollection().getLength();

            if (direction === 'up' && currentContentIndex < numberOfItems - 1) {
                return currentContentIndex + 1;
            }
            else if (direction === 'down' && currentContentIndex > 0) {
                return currentContentIndex - 1;
            }

            return currentContentIndex;
        },

        /**
         * Tests whether the content top or bottom is visible in the viewport.
         * @param {string} direction
         * @return {boolean}
         * @private
         */
        _isContentBoundaryVisible: function(direction) {
            var map = this._scrollList.getCurrentItemMap();
            var viewportHeight = map.getViewportDimensions().height;
            var contentHeight = map.getContentDimensions().height;
            var currentState = map.getCurrentTransformState();
            var contentBottom = (contentHeight * currentState.scale) + currentState.translateY;

            if (direction === 'up' && contentBottom <= viewportHeight) {
                return true;
            }
            else if (direction === 'down' && currentState.translateY >= 0) {
                return true;
            }

            return false;
        },

        /**
         * Validates the configuration.
         * @param {Object} scrollList
         */
        _validateConfiguration: function(scrollList) {
            if (!scrollList) {
                throw new Error('SwipeNavigationInterceptor configuration: scrollList is required.');
            }
        }
    };

    _.assign(SwipeNavigationInterceptor.prototype, InterceptorMixin);

    return SwipeNavigationInterceptor;
});
