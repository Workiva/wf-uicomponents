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
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');

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
     *        The minimum height, in pixels, of the ScrollBar
     *        If not provided, the minHeight will default to 16
     *
     *
     * @example
     *
     * var parent = getElementById('parent');
     * var options = {};
     *
     * options.scrollbarId = "scrollbar";
     * options.scrollbarClass = "scrollbar";
     * options.scrollbarContainerId = "scrollbar-container";
     * options.scrollbarContainerClass = "scrollbar-container";
     * options.minHeight = 8;
     *
     * scrollBar = new ScrollBar(scrollList, parent, options);
     */

    var ScrollBar = function(scrollList, parent, options) {
        var offset;
        var that = this;

        if (!scrollList) {
            throw new Error('ScrollBar#ScrollBar: scrollList is required');
        }
        else {
            this._scrollList = scrollList;
        }

        if (!parent) {
            throw new Error('ScrollBar#ScrollBar: parent is required.');
        }
        else {
            this._parent = parent;
        }

        this._options = options;

        this._layout = scrollList.getLayout();

        this._TOTAL_ITEMS = scrollList.getItemSizeCollection ? scrollList.getItemSizeCollection()._items.length :
                            scrollList.getItemMetadata().length;

        this._viewportHeight = this._layout.getVisiblePosition().bottom - this._layout.getVisiblePosition().top;

        this._virtualHeight = this._layout.getSize().height - this._viewportHeight;

        this._scrollableVirtualHeight = this._layout.getSize().height;

        this._listMap = this._scrollList.getListMap();

        this._setUpDOM();

        this._availableScrollbarHeight = this._viewportHeight - this._scrollbarHeight;

        // Set scrollbarScrolling to initially false
        this._scrollbarScrolling = false;

        this._clickOffset = null;

        // Get the initial position, in case it's not at 0, and set the scrollbar position
        requestAnimFrame(function() {
            that._placeScrollBar(that, that._elements.scrollbar);
        });

        // Match the scroll bar positioning to the users scrolling
        this._listMap.onTranslationChanged(function() {
            if (that._scrollbarScrolling) {
                return;
            }
            requestAnimFrame(function() {
                that._placeScrollBar();
            });
        });

        // Make necessary adjustments when the users zooms in or out
        this._listMap.onScaleChanged(function() {
            that._adjustScale();
            that._placeScrollBar();
        });

        this._scrollList.onItemsInserted(function() {
            that._TOTAL_ITEMS = scrollList.getItemSizeCollection()._items.length;
            that._adjustScale();
            that._placeScrollBar();
        });

        // Make adjustments when the scrollList is resized
        this._scrollList.onInteraction(function(scrollList, args) {
            if (args.event.type === EventTypes.RESIZE) {
                that._resize = true;
            }

            if (args.event.type === EventTypes.RELEASE && that._resize === true) {
                that._adjustScale();
                that._resize = false;
            }
        });

        // Attach handlers for scrolling the ScrollBar
        this._elements.scrollbar.addEventListener('mousedown', function(event) {
            that._mouseupHandler = function() {
                // _stopUpdatingScrollbar unbinds the 'mousemove' and 'mouseup' handlers from the document
                that._stopUpdatingScrollbar();
            };
            // _mouseupHandler will ensure that, in the event that the mousemove event is not caught,
            // the event handlers will be unbound before being bound again.
            that._mouseupHandler();

            offset = that._elements.scrollbar.offsetTop + that._elements.scrollbarContainer.offsetTop;
            that._clickOffset = event.clientY - offset + that._elements.scrollbarContainer.offsetTop;
            that._scrollbarScrolling = true;

            that._mousemoveHandler = function(e) {
                that._updateScrollBar(e, that._clickOffset);
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
         * @method ScrollBar#dispose
         */
        dispose: function() {
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
                scrollbarEL.className += ' ' + this._options.scrollbarClass;
            }
            if (this._options.scrollbarContainerId) {
                scrollbarContainerEL.setAttribute('id', this._options.scrollbarContainerId);
            }
            if (this._options.scrollbarContainerClass) {
                scrollbarContainerEL.className += ' ' + this._options.scrollbarContainerClass;
            }

            // Append the scrollbar and it's parent container to the given parent element
            scrollbarContainerEL.appendChild(scrollbarEL);
            this._parent.appendChild(scrollbarContainerEL);

            this._elements = { scrollbar: scrollbarEL, scrollbarContainer: scrollbarContainerEL };

            this._adjustScale();

            // Set the container height to the viewport height
            scrollbarContainerEL.style.height = this._layout.getViewportSize().height + 'px';
            // Set the scrollbar height
            scrollbarEL.style.height = this._scrollbarHeight + 'px';
        },

        /**
         * Position the scrollbar based on the current position of the ScrollList
         */
        _placeScrollBar: function() {
            var currentPosition = this._layout.getVisiblePosition().top;
            var translatedPosition = this._availableScrollbarHeight / this._virtualHeight * currentPosition;
            this._elements.scrollbar.style.top = translatedPosition + 'px';
        },

        /**
         * Position the scrollbar based on the position of a click event
         */
        _updateScrollBar: function(event, clickOffset) {
            var scrollbarPos = Math.max(0, event.clientY - clickOffset);
            var scrollListPos = scrollbarPos;
            // Don't go past the bounds of the scrollbar container
            scrollbarPos = Math.min(scrollbarPos, this._availableScrollbarHeight);
            this._elements.scrollbar.style.top = scrollbarPos + 'px';

            // Use the ratio of scrollbar position inside the scrolling area to calculate
            // the current item we should be interested in.
            var positionOfInterest = (scrollListPos * this._scale / this._availableScrollbarHeight) * this._virtualHeight;

            // Ensure that positionOfInterest isn't undefined.
            if (!positionOfInterest) {
                positionOfInterest = 0;
            }
            positionOfInterest = Math.min(positionOfInterest, this._virtualHeight * this._scale);

            var x = this._listMap.getCurrentTransformState().translateX;

            this._listMap.transform({
                x: x,
                y: -positionOfInterest,
                scale: this._scale
            });

            this._scrollList.render();
        },

        /**
         * Remove the event listeners that update the scrollbar from the document
         */
        _stopUpdatingScrollbar: function() {
            this._clickOffset = undefined;
            this._scrollbarScrolling = false;
            document.removeEventListener('mousemove', this._mousemoveHandler);
            document.removeEventListener('mouseup', this._mouseupHandler);
        },

        /**
         * Calculate the scroll bar height based on the viewport height and the scaled virtual height
         */
        _calculateScrollBarHeight: function() {
            // Calculate the size of the scrollbar depending on the virtual height
            // The scrollbar shouldn't be shorter than MIN_HEIGHT
            var MIN_HEIGHT = this._options.minHeight || 8;
            var height = Math.max(MIN_HEIGHT, (this._viewportHeight / this._scrollableVirtualHeight) * this._layout.getViewportSize().height);

            return height;
        },

        /**
         * Scale the virtual height and re-calculate the scroll bar height
         */
        _adjustScale: function() {
            this._scale = this._listMap.getCurrentTransformState().scale;
            this._viewportHeight = this._layout.getVisiblePosition().bottom - this._layout.getVisiblePosition().top;
            this._virtualHeight = this._layout.getSize().height - this._viewportHeight;
            this._scrollableVirtualHeight = this._layout.getSize().height;
            this._scrollbarHeight = this._calculateScrollBarHeight();
            this._elements.scrollbar.style.height = this._scrollbarHeight + 'px';
            this._elements.scrollbarContainer.style.height = this._layout.getViewportSize().height + 'px';
            this._availableScrollbarHeight = this._layout.getViewportSize().height - this._scrollbarHeight;
        }

    };

    return ScrollBar;

});
