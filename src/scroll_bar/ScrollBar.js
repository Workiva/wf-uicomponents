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

    var requestAnimFrame = require('wf-js-common/requestAnimationFrame');

    /**
     * Creates a new ScrollBar with the given ScrollList and options.
     *
     * @classdesc
     *
     * A ScrollBar provides a UI based on the traditional browser scrollbar
     * for users to scroll the ScrollList.
     *
     * @name ScrollBar
     * @constructor
     *
     * @param {ScrollList} scrollList
     *        The ScrollList that the ScrollBar is constructed for
     *
     * @param {HTMLElement} parent
     *        The parent element for the ScrollBar to be created within
     *
     * @param {Object} options
     *        An object with optional classes and ids to be placed on the
     *        scrollbarEL and scrollbarContainerEL.
     *
     * @param {number} options.minHeight
     *        The minimum height, in pixes, of the ScrollBar
     *        If not provided, the minHeight will default to 16px
     *
     */

    var ScrollBar = function(scrollList, parent, options) {
        var offset;
        var that = this;

        if (scrollList === undefined) {
            throw new Error('ScrollBar#ScrollBar: scrollList is required');
        }
        else {
            this._scrollList = scrollList;
        }
            
        if (parent === undefined) {
            throw new Error('ScrollBar#ScrollBar: parent is required.');
        }
        else {
            this._parent = parent;
        }
        
        this._options = options;

        this._layout = scrollList.getLayout();
        
        this._TOTAL_ITEMS = scrollList.getItemMetadata().length;
        
        this._viewportHeight = this._layout.getViewportSize().height;
        
        this._virtualHeight = this._layout.getSize().height;

        this._setUpDOM();
        
        // Set scrollbarScrolling to initially false
        this._scrollbarScrolling = false;
        
        this._clickOffset = null;
        
        // Set the initial scale
        this._scale = this._scrollList.getScale();
        
        // Set the effective virtual height.
        // This is a scaled version of the height of the scrollList
        this._effectiveVirtualHeight = this._virtualHeight * (1 / this._scale);
        
        this._scrollbarHeight = this._calculateScrollBarHeight(that);
        
        // Get the initial position, in case it's not at 0, and set the scrollbar position
        requestAnimFrame(function() {
            that._placeScrollBar(that, that._elements.scrollbar);
        });

        // Match the scroll bar positioning to the users scrolling
        this._scrollList.getListMap().onTranslationChanged(function() {
            if (that._scrollbarScrolling) {
                return;
            }
            requestAnimFrame(function() {
                that._placeScrollBar(that, that._elements.scrollbar);
            });
        });

        // Make necessary adjustments when the users zooms in or out
        this._scrollList.getListMap().onScaleChanged(function() {
            that._adjustScale(that);
        });

        // Attach handlers for scrolling the ScrollBar
        this._elements.scrollbar.addEventListener('mousedown', function(event) {
            offset = that._elements.scrollbar.offsetTop + that._elements.scrollbarContainer.offsetTop;
            that._clickOffset = event.clientY - offset + that._elements.scrollbarContainer.offsetTop;
            that._scrollbarScrolling = true;
            
            that._mouseupHandler = function() {
                that._stopUpdatingScrollbar(that);
            };
            
            that._mousemoveHandler = function(e) {
                that._updateScrollBar(e, that, that._clickOffset);
            };
            
            document.addEventListener('mousemove', that._mousemoveHandler);
            
            document.addEventListener('mouseup', that._mouseupHandler);
        });

    };

    ScrollBar.prototype = {
    
        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------
        
        /**
         * Destruct the ScrollBar created HTML elements
         * @method ScrollBar#deinitialize
         */
        deinitialize: function() {
            this._elements.scrollbarContainer.removeChild(this._elements.scrollbar);
            this._parent.removeChild(this._elements.scrollbarContainer);
        },
        
        //---------------------------------------------------------
        // Private methods
        //---------------------------------------------------------
        
        /**
         * Initialize the HTML elements used by this instance of ScrollBar
         * @private
         */
        _setUpDOM: function() {
            // Create the scrollbar's container
            var scrollbarContainerEL = document.createElement('div');
            var scrollbarEL = document.createElement('div');
            
            // Set the given classes and ids scrollbar and it's container
            if (this._options.scrollbarId) {
                scrollbarEL.setAttribute('id', this._options.scrollbarId);
            }
            if (this._options.scrollbarClass) {
                scrollbarEL.classNames += this._options.scrollbarClass;
            }
            if (this._options.scrollbarContainerId) {
                scrollbarContainerEL.setAttribute('id', this._options.scrollbarContainerId);
            }
            if (this._options.scrollbarContainerClass) {
                scrollbarContainerEL.classnames += this._options.scrollbarContainerClass;
            }

            // Append the scrollbar and it's parent container to the given parent element
            scrollbarContainerEL.appendChild(scrollbarEL);
            this._parent.appendChild(scrollbarContainerEL);
            
            this._elements = {scrollbar: scrollbarEL, scrollbarContainer: scrollbarContainerEL};
            
            this._adjustScale(this);

            // Set the container height to the viewport height
            scrollbarContainerEL.style.height = this._viewportHeight + 'px';
            // Set the scrollbar height
            scrollbarEL.style.height = this._scrollbarHeight + 'px';
        },
        
        /**
         * Position the scrollbar based on the current position of the ScrollList
         */
        _placeScrollBar: function(that) {
            var currentPosition = that._layout.getVisiblePosition().top;
            var availableScrollbarHeight = that._viewportHeight - that._scrollbarHeight;
            var scrollableVirtualHeight = that._virtualHeight - (that._layout.getVisiblePosition().bottom - that._layout.getVisiblePosition().top);
            var translatedPosition = availableScrollbarHeight / scrollableVirtualHeight * currentPosition;
            that._elements.scrollbar.style.top = translatedPosition + 'px';
        },
        
        /**
         * Position the scrollbar based on the position of a click event
         */
        _updateScrollBar: function(event, that, clickOffset) {
            // Don't go past the window bounds
            var scrollbarPos = Math.max(0, event.clientY - clickOffset);
            scrollbarPos = Math.min(scrollbarPos, that._viewportHeight - that._scrollbarHeight);
            that._elements.scrollbar.style.top = scrollbarPos + 'px';

            // Use the ratio of scrollbar position inside the scrolling area to calculate
            // the current item we should be interested in.
            var positionOfInterest = ((scrollbarPos) / (that._viewportHeight - that._scrollbarHeight)) * (that._virtualHeight);
            
            // Ensure that positionOfInterest isn't undefined.
            if (!positionOfInterest) {
                positionOfInterest = 0;
            }

            that._scrollList.scrollToPosition({
                y: positionOfInterest
            });
        },
        
        /**
         * Remove the event listeners that update the scrollbar from the document
         */
        _stopUpdatingScrollbar: function(that) {
            that._clickOffset = undefined;
            document.removeEventListener('mousemove', that._mousemoveHandler);
            that._scrollbarScrolling = false;
            that._removeDocumentEventWatching(that);
        },
        
        /**
         * Remove the mouseup listener from the document
         */
        _removeDocumentEventWatching: function(that) {
            document.removeEventListener('mouseup', that._mouseupHandler);
        },
        
        /**
         * Calculate the scroll bar height based on the viewport height and the scaled virtual height
         */
        _calculateScrollBarHeight: function(that) {
            // Calculate the size of the scrollbar depending on the virtual height
            // The scrollbar shouldn't be shorter than MIN_HEIGHT
            var MIN_HEIGHT = that._options.minHeight || 16;
            var height =  Math.max(MIN_HEIGHT, (that._viewportHeight / that._effectiveVirtualHeight) * that._viewportHeight);
            return height;
        },
        
        /**
         * Scale the virtual height and re-calculate the scroll bar height
         */
        _adjustScale: function(that) {
            that._scale = that._scrollList.getScale();
            that._effectiveVirtualHeight = that._layout.getSize().height * that._scale;
            that._scrollbarHeight = that._calculateScrollBarHeight(that);
            that._elements.scrollbar.style.height = that._scrollbarHeight + 'px';
        }
        
    };

    return ScrollBar;

});
