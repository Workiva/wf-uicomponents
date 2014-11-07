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
    var DestroyUtil = require('wf-js-common/DestroyUtil');

    var DEFAULT_MIN_SIZE = 16;

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
     * @param {number} options.minSize
     *        The minimum height or width, in pixels, of the ScrollBar
     *        If not provided, the minSize will default to 16
     *
     * @param {string} options.orientation
     *        The orientation of the scrollbar, can be either 'horizontal'
     *        or 'vertical'. Defaults to 'vertical'.
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
     * options.minSize = 8;
     * options.orientation = 'vertical';
     *
     * scrollBar = new ScrollBar(scrollList, parent, options);
     */

    var ScrollBar = function(scrollList, parent, options) {
        var self = this;

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
        this._listMap = this._scrollList.getListMap();
        this._layout = this._scrollList.getLayout();
        this._isVertical = this._options.orientation === 'horizontal' ? false : true;
        this._barPosition = 0.0;
        this._trackSize = 100.0;
        this._barSize = DEFAULT_MIN_SIZE;
        this._clickOffset = null;
        this._scrollbarScrolling = false;
        this._resize = false;
        this._disposed = false;

        this._setupDOM();
        this._placeScrollBar();

        // The current item map, used in peek and single modes.
        this._itemMap = self._scrollList.getCurrentItemMap();
        this._scrollList.onCurrentItemChanged(function() {
            self._itemMap = self._scrollList.getCurrentItemMap();
        });

        // Match the scroll bar positioning to the users scrolling
        this._listMap.onTranslationChanged(function() {
            if (!self._scrollbarScrolling && !self._disposed) {
                self._placeScrollBar();
            }
        });

        // Make necessary adjustments when the users zooms in or out
        this._listMap.onScaleChanged(function() {
            self._cacheDimensions();
            self._setTrackSize();
            self._setBarSize();
            self._placeScrollBar();
        });

        // Adjust sizes and bar when items are inserted
        this._scrollList.onItemsInserted(function() {
            self._cacheDimensions();
            self._placeScrollBar();
        });

        // Make adjustments when the scrollList is resized
        this._scrollList.onInteraction(function(scrollList, args) {
            if (args.event.type === EventTypes.RESIZE) {
                self._resize = true;
            }

            if (args.event.type === EventTypes.RELEASE && self._resize === true) {
                self._cacheDimensions();
                self._setTrackSize();
                self._setBarSize();
                self._resize = false;
            }
        });

        // If part of the page is highlighted and the user clicks and drags on the page,
        // a 'drag' event may be triggered instead of the standard mousedown-mouseup event.
        // This results in mouseup never firing, and the mousemove handler never being unbound.
        // Preventing default on dragstarts on the scrollbar prevents this from occuring.
        this._elements.scrollbar.addEventListener('dragstart', function(event) {
            event.preventDefault();
        });

        this._mouseupHandler = function() {
            // _stopUpdatingScrollbar unbinds the 'mousemove' and 'mouseup' handlers from the document
            self._stopUpdatingScrollbar();
        };

        this._mousemoveHandler = function(e) {
            var coord;
            if (self._isVertical) {
                coord = e.clientY;
            } else {
                coord = e.clientX;
            }
            self._updateScrollBar(coord);
        };

        // Attach handlers for scrolling the ScrollBar
        this._mousedownHandler = function(e) {
            // Prevent the event from bubbling so that we don't end up with
            // weird selections all over the page.
            e.preventDefault();

            // _mouseupHandler will ensure that, in the event that the mousemove event is not caught,
            // the event handlers will be unbound before being bound again.
            self._mouseupHandler();

            var coord;
            var barOffset;
            if (self._isVertical) {
                coord = e.clientY;
                barOffset = self._elements.scrollbar.offsetTop;
            } else {
                coord = e.clientX;
                barOffset = self._elements.scrollbar.offsetLeft;
            }

            self._clickOffset = coord - barOffset;
            self._scrollbarScrolling = true;

            document.addEventListener('mousemove', self._mousemoveHandler);
            document.addEventListener('mouseup', self._mouseupHandler);
        };

        this._elements.scrollbar.addEventListener('mousedown', this._mousedownHandler);
    };

    ScrollBar.prototype = {

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Find out whether the scrollbar is vertical.
         * @return bool
         */
        isVertical: function() {
            return this._isVertical;
        },

        /**
         * Destruct the ScrollBar created HTML elements
         * @method ScrollBar#dispose
         */
        dispose: function() {
            this._elements.scrollbar.removeEventListener('mousedown', this._mousedownHandler);
            this._elements.scrollbarContainer.removeChild(this._elements.scrollbar);
            this._parent.removeChild(this._elements.scrollbarContainer);
            DestroyUtil.destroy(this);
            this._disposed = true;
        },

        //---------------------------------------------------------
        // Private methods
        //---------------------------------------------------------

        /**
         * Set the position of the scrollbar to the given value. The value
         * should be in [0.0, 1.0], where 0.0 is the top/left and 1.0 is the
         * bottom/right. The value will be clamped if it is out of range. If no
         * value is provided, the currently set value will be used.
         *
         * @method ScrollBar#setBarPosition
         * @param value {number}
         */
        _setBarPosition: function(value) {
            if (value === undefined) {
                value = this._barPosition;
            }

            if (value < 0.0) {
                value = 0.0;
            }
            if (value > 1.0) {
                value = 1.0;
            }

            this._barPosition = value;

            var barOffset = Math.round(this._barPosition * (this._trackSize - this._barSize));
            if (this._isVertical) {
                this._elements.scrollbar.style.top = barOffset + 'px';
            } else {
                this._elements.scrollbar.style.left = barOffset + 'px';
            }
        },

        /**
         * Calculate the scroll bar height based on the viewport height and the scaled virtual height
         */
        _setBarSize: function() {
            var minSize = this._options.minSize || DEFAULT_MIN_SIZE;
            var barSize = Math.max(
                    minSize,
                    (this._visibleSize / this._layoutSize) * this._viewportSize);
            if (barSize >= this._viewportSize) {
                barSize = 0;
            }

            this._barSize = barSize;

            if (this._isVertical) {
                this._elements.scrollbar.style.height = barSize + 'px';
            } else {
                this._elements.scrollbar.style.width = barSize + 'px';
            }
        },

        /**
         * Compute and set the track size to the size of the viewport in the
         * appropriate dimension.
         *
         * @method ScrollBar#setTrackSize
         */
        _setTrackSize: function() {
            var trackSize = this._viewportSize;
            this._trackSize = trackSize;

            if (this._isVertical) {
                this._elements.scrollbarContainer.style.height = trackSize + 'px';
            } else {
                this._elements.scrollbarContainer.style.width = trackSize + 'px';
            }
        },

        /**
         * Initialize the HTML elements used by this instance of ScrollBar
         * @private
         */
        _setupDOM: function() {
            var scrollbarEl = document.createElement('div');
            if (this._options.scrollbarId) {
                scrollbarEl.setAttribute('id', this._options.scrollbarId);
            }
            if (this._options.scrollbarClass) {
                scrollbarEl.className += ' ' + this._options.scrollbarClass;
            }

            var scrollbarContainerEl = document.createElement('div');
            if (this._options.scrollbarContainerId) {
                scrollbarContainerEl.setAttribute('id', this._options.scrollbarContainerId);
            }
            if (this._options.scrollbarContainerClass) {
                scrollbarContainerEl.className += ' ' + this._options.scrollbarContainerClass;
            }

            // Append the scrollbar and its parent container to the given
            // parent element.
            scrollbarContainerEl.appendChild(scrollbarEl);
            this._parent.appendChild(scrollbarContainerEl);

            this._elements = { scrollbar: scrollbarEl, scrollbarContainer: scrollbarContainerEl };

            // Compute scale and size attributes
            this._cacheDimensions();

            this._setTrackSize();
            this._setBarSize();
        },

        /**
         * Position the scrollbar based on the current position of the ScrollList
         */
        _placeScrollBar: function() {
            var visiblePosition = this._layout.getVisiblePosition();

            var viewExtent;
            if (this._isVertical) {
                viewExtent = visiblePosition.bottom;
            } else {
                viewExtent = visiblePosition.right;
            }

            var barPosition = (viewExtent - this._visibleSize) / (this._layoutSize - this._visibleSize);
            this._setBarPosition(barPosition);
        },

        /**
         * Attempt to move the scrollbar to a particular location, move it to
         * the closest valid position. The input is either an x or y coordinate
         * depending on whether the scrollbar is horizontal (x) or vertical
         * (y).
         */
        //_updateScrollBar: function(event, clickOffset) {
        _updateScrollBar: function(coord) {
            // Clamp to the beginning of the scrollbar
            var barCoord = Math.max(0, coord - this._clickOffset);
            // Clamp to the end of the scrollbar
            barCoord = Math.min(barCoord, this._trackSize - this._barSize);

            var barPosition = barCoord / (this._trackSize - this._barSize);
            this._setBarPosition(barPosition);


            // Use the ratio of the scrollbar position to find the current
            // item in the list map.
            var itemPosition = barPosition * this._scale * this._virtualSize;

            // TODO Do we really need this? It could be NaN, but can that really happen?
            if (!itemPosition) {
                itemPosition = 0;
            }

            var transformState = this._listMap.getCurrentTransformState();
            var x, y;
            if (this._isVertical) {
                x = transformState.translateX;
                y = -itemPosition;
            } else {
                x = -itemPosition;
                y = transformState.translateY;
            }

            this._listMap.transform({
                x: x,
                y: y,
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
         * Scale the virtual height and re-calculate the scroll bar height
         */
        _cacheDimensions: function() {
            var transformState = this._listMap.getCurrentTransformState();
            this._scale = transformState.scale;

            var visiblePosition = this._layout.getVisiblePosition();
            var layoutSize = this._layout.getSize();
            var viewportSize = this._layout.getViewportSize();
            
            if (this._isVertical) {
                this._viewportSize = viewportSize.height;
                this._visibleSize = visiblePosition.bottom - visiblePosition.top;
                this._layoutSize = layoutSize.height;
                this._virtualSize = this._layoutSize - this._visibleSize;
            } else {
                this._viewportSize = viewportSize.width;
                this._visibleSize = visiblePosition.right - visiblePosition.left;
                this._layoutSize = layoutSize.width;
                this._virtualSize = this._layoutSize - this._visibleSize;
            }
        }

    };

    return ScrollBar;

});
