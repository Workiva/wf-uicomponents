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

    var ScrollModes = require('wf-js-uicomponents/scroll_list/ScrollModes');

    /**
     * Creates a new KeyNavigator tied to the provided ScrollList
     *
     * @classdesc
     *
     * A key navigator watches for keypresses and scrolls the ScrollList
     * in response to Up/Left/Down/Right arrow, Home/End, Ctrl+Home/Ctrl+End,
     * and PageUp/PageDown. The responses to these actions are intended to
     * approximate standard key navigation behavior in the browser.
     *
     * @name KeyNavigator
     * @constructor
     *
     * @param {ScrollList} scrollList
     *        The scrollList that the KeyNavigator is associated with.
     *
     */
    var KeyNavigator = function (scrollList) {
        this._scrollList = scrollList;
        this._listener = this._keyNavListener.bind(this);

        // Watch for keydown events and if the documentViewer is enabled,
        // translate the event into the appropriate scrolling
        document.addEventListener('keydown', this._listener);
    };

    /* Keycodes */
    var keys = {
        LEFT: 37,
        RIGHT: 39,
        UP: 38,
        DOWN: 40,
        PAGEUP: 33,
        PAGEDOWN: 34,
        HOME: 36,
        END: 35
    };

    KeyNavigator.prototype = {
        /**
         * Dispose of this instance of KeyNavigator
         * @method KeyNavigator#dispose
         */
        dispose: function() {
            document.removeEventListener('keydown', this._listener);
        },

        /**
         * Determine whether an event needs to be handled
         *
         * @private
         * @param {Event} event
         *        The event in question
         */
        _keyNavListener: function(event) {
            if (!this._scrollList.isDisabled()) {
                this._layout = this._scrollList.getLayout();
                this._handleKeyPress(event);
            }
        },

        /**
         * Identify and handle key press events by passing the event to the appropriate handler
         *
         * @private
         * @param {Event} event
         *        The event to be handled
         */

        _handleKeyPress: function(event) {
            if ((event.keyCode === keys.LEFT || event.keyCode === keys.RIGHT) &&
                this._scrollList._options.mode === ScrollModes.FLOW) {
                this._moveX(event.keyCode);
            }

            if (event.keyCode === keys.UP || event.keyCode === keys.DOWN) {
                if (this._scrollList._options.mode === ScrollModes.FLOW) {
                    this._moveY(event.keyCode);
                }
                else {
                    this._movePagePrevNext(event.keyCode);
                }
            }

            if (event.keyCode === keys.PAGEUP || event.keyCode === keys.PAGEDOWN) {
                if (this._scrollList._options.mode === ScrollModes.FLOW) {
                    this._movePage(event.keyCode);
                }
                else {
                    this._movePagePrevNext(event.keyCode);
                }
            }

            if (event.keyCode === keys.HOME || event.keyCode === keys.END) {
                if (event.ctrlKey) {
                    this._moveCtrlHomeEnd(event.keyCode);
                }
                else {
                    if (this._scrollList._options.mode === ScrollModes.FLOW) {
                        this._moveHomeEnd(event.keyCode);
                    }
                }
            }
        },

        /**
         * Move the scrollList horizontally by 40.
         *
         * @private
         * @param {number} direction
         *        Which horizontal direction to move in (left or right)
         */
        _moveX: function(direction) {
            var currentX = -this._scrollList.getListMap().getCurrentTransformState().translateX;
            var scale = this._scrollList.getListMap().getCurrentTransformState().scale;
            if (direction === keys.LEFT) {
                this._scrollList.scrollToPosition({ x: (currentX / scale) - 40 });
            }
            else {
                this._scrollList.scrollToPosition({ x: (currentX / scale) + 40 });
            }
        },

        /**
         * Move the scrollList vertically by 40
         *
         * @private
         * @param {number} direction
         *        Which vertical direction to move in (up or down)
         */
        _moveY: function(direction) {
            var currentY = this._validateY(this._layout.getVisiblePosition().top);
            if (direction === keys.UP) {
                this._scrollList.scrollToPosition({ y: currentY - 40 });
            }
            else {
                if (this._layout.getVisiblePosition().bottom === this._layout.getSize().height) {
                    return;
                }
                else {
                    this._scrollList.scrollToPosition({ y: currentY + 40 });
                }
            }
        },

        /**
         * Move up or down by one page
         *
         * @private
         * @param {number} direction
         *        The direction to move by a page (PageUp or PageDown)
         */
        _movePage: function(direction) {
            var currentPosition = this._layout.getVisiblePosition();

            var visiblePortion = this._validateY(currentPosition.bottom - currentPosition.top);

            if (direction === keys.PAGEUP) {
                this._scrollList.scrollToPosition({ y: this._validateY(currentPosition.top) - visiblePortion });
            }
            else {
                this._scrollList.scrollToPosition({ y: this._validateY(currentPosition.top) + visiblePortion });
            }
        },

        /**
         * Move to the next or the previous page
         *
         * @private
         * @param {number} direction
         *        The direction to move in
         */
        _movePagePrevNext: function(direction) {
            var currentPage = this._scrollList.getCurrentItem().index;
            if (direction === keys.UP || direction === keys.PAGEUP) {
                this._scrollList.scrollToItem({ index: currentPage - 1 });
            }
            else {
                this._scrollList.scrollToItem({ index: currentPage + 1 });
            }
        },

        /**
         * Move to the top or the bottom of the current page
         *
         * @private
         * @param {number} direction
         *        The keyCode indicating whether to go to home or end
         */
        _moveHomeEnd: function(direction) {
            var currentPage = this._scrollList.getCurrentItem();
            var currentPosition;
            var viewport;

            if (direction === keys.HOME) {
                this._scrollList.scrollToItem({ index: currentPage.index });
            }

            if (direction === keys.END) {
                this._scrollList.scrollToItem({ index: currentPage.index + 1 });
                currentPosition = this._layout.getVisiblePosition();
                viewport = this._validateY(currentPosition.bottom - currentPosition.top);

                this._scrollList.scrollToPosition({
                    y: this._validateY(currentPosition.top) - viewport
                });
            }
        },

        /**
         * Move to the beginning or end of the scrollList
         *
         * @private
         * @param {number} direction
         *        The direction to move in (Home or End)
         */
        _moveCtrlHomeEnd: function(direction) {
            if (direction === keys.HOME) {
                this._scrollList.scrollToItem({ index: 0 });
            }
            else {
                var items = this._scrollList.getItemSizeCollection()._items;
                this._scrollList.scrollToItem({
                    index: items.length,
                    viewportAnchorLocation: 'center',
                    offset: { y: items[items.length - 1].height }
                });
            }
        },

        _validateY: function(y) {
            return (y < 0) ? -y : y;
        }
    };

    return KeyNavigator;
});
