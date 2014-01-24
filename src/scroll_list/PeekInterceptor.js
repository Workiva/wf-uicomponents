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
     * Creates a new PeekInterceptor.
     *
     * @classdesc
     *
     * The PeekInterceptor is used by the ScrollList to enable dragging
     * adjoining content into view and either snapping the content back into
     * place if peeking below a threshold distance or initiating a content jump
     * if peeking beyond the throshold.
     *
     * @name PeekInterceptor
     * @constructor
     * @mixes InterceptorMixin
     *
     * @param {ScrollList} scrollList
     *        The scroll list that owns this interceptor.
     */
    var PeekInterceptor = function(scrollList) {

        //---------------------------------------------------------
        // Private properties
        //---------------------------------------------------------

        /**
         * Flag to force a content jump along the direction of a peek on release.
         * Can be falsey to signify no forced jump is in effect, or can be +/- 1
         * to force jump to next or previous item.
         * @type {boolean|number}
         * @private
         */
        this._forceJump = false;

        /**
         * The pixel amount that is being peeked at.
         * @type {number}
         * @private
         */
        this._peekDelta = 0;

        /**
         * Whether or not adjoining content is peeked at.
         * @type {boolean}
         * @private
         */
        this._peeking = false;

        /**
         * The scroll list that owns this interceptor.
         * @type {ScrollList}
         * @private
         */
        this._scrollList = scrollList;
    };

    PeekInterceptor.prototype = {

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Intercepts drag events generated by direct user interaction
         * and peeks at adjoining content if contextually appropriate.
         * Note that transforms are applied DIRECTLY to to list map,
         * and are not sent through the normal handling process. This can lead
         * to some tricky behavior if you do not account for the bypass.
         * @param {AwesomeMap} source - The source map of the event.
         * @param {InteractionEvent} args.event - The interaction event.
         * @return {undefined|boolean}
         */
        handleInteraction: function(source, args) {
            var event = args.event;

            if (event.simulated || this._scrollList.isDisabled()) {
                return;
            }

            switch (event.type) {

            case EventTypes.TOUCH:

                // Must return after setting peek delta to avoid cancelling touch event.
                this._setPeekDeltaByCurrentPosition();
                return;

            case EventTypes.DRAG:
            case EventTypes.DRAG_END:
            case EventTypes.DRAG_START:

                this._handleDragEvent(event);
                break;

            case EventTypes.SWIPE:

                this._handleSwipeEvent(event);
                break;

            case EventTypes.RELEASE:

                this._handleReleaseEvent();
                break;
            }

            return !this._peeking;
        },

        //---------------------------------------------------------
        // Private methods
        //---------------------------------------------------------

        /**
         * Handles drag events and peeks if appropriate.
         * @param {InteractionEvent} event
         */
        _handleDragEvent: function(event) {
            var itemMap = this._scrollList.getCurrentItemMap();
            var viewportHeight = itemMap.getViewportDimensions().height;
            var contentHeight = itemMap.getContentDimensions().height;
            var contentState = itemMap.getCurrentTransformState();
            var contentTop = contentState.translateY;
            var contentBottom = contentState.translateY +
                                Math.floor(contentHeight * contentState.scale);

            var listMap = this._awesomeMap;
            var listState = listMap.getCurrentTransformState();
            var listHeight = listMap.getContentDimensions().height;
            var listTop = listState.translateY;
            var listBottom = listState.translateY + listHeight;
            var currentY = listState.translateY;

            this._setPeekDeltaByCurrentPosition();

            var peekDelta = this._peekDelta;
            var deltaY = event.iterativeGesture.deltaY;
            var newY;

            // Ignore event if:
            // - dragging down and list will be at top, or
            // - dragging up and list will be at bottom.
            if ((deltaY > 0 && listTop + contentTop + deltaY >= 0) ||
                (deltaY < 0 && listBottom + (contentBottom - viewportHeight) + deltaY <= viewportHeight)) {

                newY = deltaY > 0 ? 0 : viewportHeight - listHeight;
                this._resetPeekState();
            }
            // Start/continue peeking if:
            // - dragging down and top is visible, or
            // - dragging up and bottom is visible.
            else if (
                (deltaY > 0 && contentTop >= 0) ||
                (deltaY < 0 && contentBottom <= viewportHeight)) {

                newY = currentY + deltaY;
                this._peeking = true;
                this._peekDelta += deltaY;
            }
            // Undo peeking:
            else if (peekDelta !== 0) {

                // Reversing direction if:
                // - dragging down with peek into next content item still visible, or
                // - dragging up with peek into previous content item still visible.
                if ((deltaY > 0 && peekDelta + deltaY < 0) ||
                    (deltaY < 0 && peekDelta + deltaY > 0)) {

                    newY = currentY + deltaY;
                    this._peekDelta += deltaY;
                }
                // Stop peeking if:
                // - dragging down and deltaY will bring content to bottom of viewport, or
                // - dragging up and deltaY will bring content to top of viewport
                else if (deltaY !== 0) {

                    newY = currentY - this._peekDelta;
                    this._resetPeekState();
                }
            }

            // If we have a new Y value, transform the list directly.
            if (newY !== undefined) {
                listMap.transform({
                    x: listState.translateX,
                    y: newY,
                    scale: listState.scale
                });
            }
        },

        /**
         * Force a jump to an adjoining item on swipe events. Detect whether the
         * jump is necessary by inspecting the current peek delta and direction
         * of swipe. For instance: if starting on item 1 and dragging up so that
         * the top of item 2 crosses the viewport center, then do not force a
         * jump on release, as the default behavior will pull item 2 to the top;
         * however, if item 1 is still the item at center when the swipe occurs,
         * then we need to jump to item 2.
         * @param {InteractionEvent} event
         */
        _handleSwipeEvent: function(event) {
            var peekDelta = this._peekDelta;
            if (this._peekDelta !== 0) {
                var direction = event.iterativeGesture.direction;
                if (direction === 'up' && peekDelta < 0) {
                    this._forceJump = 1;
                }
                else if (direction === 'down' && peekDelta > 0) {
                    this._forceJump = -1;
                }
            }
        },

        /**
         * Jump to an adjoining item if peeking beyond viewport center.
         * If forcing a jump due to handling swipes, then jump one item in the
         * direction specified.
         */
        _handleReleaseEvent: function() {
            if (!this._peeking) {
                return;
            }

            var scrollList = this._scrollList;
            var layout = scrollList.getLayout();
            var itemIndex = layout.getCurrentItemIndex();

            if (this._forceJump) {
                itemIndex += this._forceJump;
            }
            else {
                var peekDelta = this._peekDelta;
                var viewportHeight = layout.getViewportSize().height;
                if (Math.abs(peekDelta) > viewportHeight / 2) {
                    itemIndex += peekDelta > 0 ? -1 : 1;
                }
            }

            // Let this release event play out before scrolling.
            setTimeout(function() {
                scrollList.scrollTo({ index: itemIndex, duration: 250 });
            }, 0);

            this._resetPeekState();
        },

        /**
         * Resets the private peek state.
         */
        _resetPeekState: function() {
            this._peekDelta = 0;
            this._peeking = false;
            this._forceJump = false;
        },

        /**
         * Sets the peek delta by looking at the top position of the current
         * item and the current list/viewport position. This is used to handle
         * two cases: 1) interrupting an animated page change mid-stream and
         * 2) updating the peek delta when the current item changes due to
         * crossing the center of the viewport.
         */
        _setPeekDeltaByCurrentPosition: function() {
            var currentState = this._awesomeMap.getCurrentTransformState();
            var viewportTop = -currentState.translateY / currentState.scale;

            var layout = this._scrollList.getLayout();
            var currentItemIndex = layout.getCurrentItemIndex();
            var currentItemLayout = layout.getItemLayout(currentItemIndex);
            var currentItemTop = currentItemLayout.top;

            if (viewportTop !== currentItemTop) {
                this._peeking = true;
                this._peekDelta = currentItemTop - viewportTop;
            }
        }
    };

    _.assign(PeekInterceptor.prototype, InterceptorMixin);

    return PeekInterceptor;
});

