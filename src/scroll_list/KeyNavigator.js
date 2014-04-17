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
 
define(function() {
    'use strict';

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
        
        // Watch for keydown events and if the documentViewer is enabled, 
        // translate the event into the appropriate scrolling
        
        document.addEventListener('keydown', (this._keyNavListener).bind(this));
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

        _handleKeyPress: function (event) {
            if ( event.keyCode === keys.LEFT || event.keyCode === keys.RIGHT ) {
                this._moveX(event.keyCode);
            }
            
            if ( event.keyCode === keys.UP || event.keyCode === keys.DOWN ) {
                this._moveY(event.keyCode);
            }
            
            if ( event.keyCode === keys.PAGEUP || event.keyCode === keys.PAGEDOWN ) {
                this._movePage(event.keyCode);
            }

            if ( event.keyCode === keys.HOME || event.keyCode === keys.END ) {
                if ( event.ctrlKey ) {
                    this._moveCtrlHomeEnd(event.keyCode);
                }
                else {
                    this._moveHomeEnd(event.keyCode);
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
        _moveX: function (direction) {
            var currentX = -this._scrollList.getListMap().getCurrentTransformState().translateX;
            
            if (direction === keys.LEFT) {
                this._scrollList.scrollToPosition({x: currentX - 40});
            }
            else {
                
                this._scrollList.scrollToPosition({x: currentX + 40});
            }
        },

        /**
         * Move the scrollList vertically by 40
         *
         * @private
         * @param {number} direction
         *        Which vertical direction to move in (up or down)
         */
        _moveY: function (direction) {
            var currentY = this._layout.getVisiblePosition().top;
            if (direction === keys.UP) {
                this._scrollList.scrollToPosition({y: currentY - 40});
            }
            else {
                if (this._layout.getVisiblePosition().bottom === this._layout.getSize().height) {
                    return;
                }
                else {
                    this._scrollList.scrollToPosition({y: currentY + 40});
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
        _movePage: function (direction) {
            var currentPage = this._scrollList.getCurrentItem();
            var currentPosition = this._layout.getVisiblePosition();
            
            var itemHeight = this._scrollList.getItemSizeCollection();
            itemHeight = itemHeight._items[currentPage.index].height;
            
            if (direction === keys.PAGEUP) {
                this._scrollList.scrollToPosition({y: currentPosition.top - itemHeight});
            }
            else {
                if (currentPosition.bottom === this._layout.getSize().height) {
                    return;
                }
                this._scrollList.scrollToPosition({y: currentPosition.top + itemHeight});
            }
        },

        /**
         * Move to the top or the bottom of the current page
         *
         * @private
         * @param {number} direction 
         *        The keyCode indicating whether to go to home or end
         */
        _moveHomeEnd: function (direction) {
            var currentPage = this._scrollList.getCurrentItem();
            var items = this._scrollList.getItemSizeCollection()._items;
            var position = 0;
            
            if (direction === keys.HOME) {
                for (var i = 0; i < currentPage.index; i++ ) {
                    position += items[i].height;
                }
                
                position = position * 1.5;
                position += ( currentPage.index * 5 );

            }
            
            if (direction === keys.END) {
                for (var j = 0; j <= currentPage.index; j++ ) {
                    position += items[j].height;
                }
                
                position = position * 1.5;
                position += ( currentPage.index * 5 );
                position -= (this._layout.getVisiblePosition().bottom - this._layout.getVisiblePosition().top);
            }
                                        
            this._scrollList.scrollToPosition({y: position});
        },

        /**
         * Move to the beginning or end of the scrollList
         *
         * @private
         * @param {number} direction
         *        The direction to move in (Home or End)
         */
        _moveCtrlHomeEnd: function (direction) {
            if ( direction === keys.HOME ) {
                this._scrollList.scrollToPosition({y: 0});
            }
            else {
                var height = this._layout.getSize().height;
                this._scrollList.scrollToPosition({y: height});
            }
        }
    };
    
    return KeyNavigator;
});
