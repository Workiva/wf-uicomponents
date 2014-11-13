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

    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');
    var DestroyUtil = require('wf-js-common/DestroyUtil');

    var DEFAULT_MIN_SIZE = 16;
    var DEFAULT_SCROLLER_Z_INDEX = 3;

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
     *        scrollerEl and scrollTrackEl.
     *
     * @param {number} options.minSize
     *        The minimum height or width, in pixels, of the ScrollBar
     *        If not provided, the minSize will default to 16
     *
     * @param {string} options.orientation
     *        The orientation of the scrollbar, can be either 'horizontal'
     *        or 'vertical'. Defaults to 'vertical'.
     *
     * @param {number} options.trackMargin
     *        An amount (in px) to subtract from the end of the scroll track.
     *        Can be used to keep horizontal and vertical scroll bars from
     *        crossing.
     *
     * @param {number} options.scrollerThickness
     *        The thickness of the actual scroller. This will be width for a
     *        vertical scrollbar and height for a horizontal one.
     *
     * @param {number} options.scrollTrackThickness
     *        The thickness of the scroll track. Usually the same as scroller
     *        thickness. Width for a vertical scrollbar and height for a
     *        horizontal one.
     *
     * @param {number} options.scrollBarOffset
     *        The offset from the "natural" position of the scrollbar. The
     *        natural position is the far right for a vertical scrollbar and
     *        the bottom for a horizontal one.
     *
     * @param {number} options.scrollerZIndex
     *        The z-index to apply to the scroller.
     *
     *
     * @example
     *
     * var parent = getElementById('parent');
     * var options = {};
     *
     * options.scrollerId = "scrollbar";
     * options.scrollerClass = "scrollbar";
     * options.scrollTrackId = "scrollbar-container";
     * options.scrollTrackClass = "scrollbar-container";
     * options.minSize = 8;
     * options.orientation = 'vertical';
     *
     * var scrollBar = new ScrollBar(scrollList, parent, options);
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

        // This is the currently active map, it can be either a list map, or an
        // item map, depending on the scroll mode.
        this._activeMap = this._scrollList.getListMap();

        this._options = options;
        this._trackMargin = this._options.trackMargin || 0;
        this._isVertical = this._options.orientation === 'horizontal' ? false : true;
        this._scrollerPosition = 0.0;
        this._scrollerScrolling = false;
        this._resize = false;
        this._disposed = false;

        this._setupDOM();
        this._placeScroller();

        // Callbacks

        // Make adjustments when the user zooms
        var mapScaleChangedHandler = function() {
            self._cacheDimensions();
            self._setTrackSize();
            self._setScrollerSize();
            self._placeScroller();
        };

        // Match the scroll bar to the document position
        var mapTranslationChangedHandler = function(sender, offset) {
            if (self._isVertical) {
                self._extent = -offset.y;
            } else {
                self._extent = -offset.x;
            }
                
            if (!self._scrollerScrolling && !self._disposed) {
                self._placeScroller();
            }
        };

        // Bind map callbacks

        function updateMap() {
            var itemMap = self._scrollList.getCurrentItemMap();
            if (itemMap) {
                // We are in single or peek mode
                self._activeMap = itemMap;
                self._cacheDimensions();
                self._placeScroller();
            }
        }

        function bindHandlers() {
            self._activeMap.onScaleChanged(mapScaleChangedHandler);
            self._activeMap.onTranslationChanged(mapTranslationChangedHandler);
        }

        function unbindHandlers() {
            self._activeMap.onScaleChanged.remove(mapScaleChangedHandler);
            self._activeMap.onTranslationChanged.remove(mapTranslationChangedHandler);
        }

        updateMap();
        bindHandlers();

        this._scrollList.onCurrentItemChanged(function changeItemMap() {
            unbindHandlers();
            updateMap();
            bindHandlers();
        });

        // Bind scroll list callbacks

        // Adjust sizes and bar when items are inserted
        this._scrollList.onItemsInserted(function() {
            self._cacheDimensions();
            self._placeScroller();
        });

        // Make adjustments when the scrollList is resized
        this._scrollList.onInteraction(function(scrollList, args) {
            if (args.event.type === EventTypes.RESIZE) {
                self._resize = true;
            }

            if (args.event.type === EventTypes.RELEASE && self._resize === true) {
                self._cacheDimensions();
                self._setTrackSize();
                self._setScrollerSize();
                self._resize = false;
            }
        });

        // If part of the page is highlighted and the user clicks and drags on the page,
        // a 'drag' event may be triggered instead of the standard mousedown-mouseup event.
        // This results in mouseup never firing, and the mousemove handler never being unbound.
        // Preventing default on dragstarts on the scroller prevents this from occuring.
        this._elements.scroller.addEventListener('dragstart', function(event) {
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
            self._updateScroller(coord);
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
                barOffset = self._elements.scroller.offsetTop;
            } else {
                coord = e.clientX;
                barOffset = self._elements.scroller.offsetLeft;
            }

            self._clickOffset = coord - barOffset;
            self._scrollerScrolling = true;

            document.addEventListener('mousemove', self._mousemoveHandler);
            document.addEventListener('mouseup', self._mouseupHandler);
        };

        this._elements.scroller.addEventListener('mousedown', this._mousedownHandler);
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
            this._elements.scroller.removeEventListener('mousedown', this._mousedownHandler);
            this._elements.scrollTrack.removeChild(this._elements.scroller);
            this._parent.removeChild(this._elements.scrollTrack);
            DestroyUtil.destroy(this);
            this._disposed = true;
        },

        //---------------------------------------------------------
        // Private methods
        //---------------------------------------------------------

        /**
         * Set the position of the scroller to the given value. The value
         * should be in [0.0, 1.0], where 0.0 is the top/left and 1.0 is the
         * bottom/right. The value will be clamped if it is out of range. If no
         * value is provided, the currently set value will be used.
         *
         * @method ScrollBar#setScrollerPosition
         * @param value {number}
         */
        _setScrollerPosition: function(value) {
            if (value === undefined) {
                value = this._scrollerPosition;
            }

            if (value < 0.0) {
                value = 0.0;
            }
            if (value > 1.0) {
                value = 1.0;
            }

            this._scrollerPosition = value;

            var barOffset = Math.round(this._scrollerPosition * (this._trackSize - this._scrollerSize));
            if (this._isVertical) {
                this._elements.scroller.style.top = barOffset + 'px';
            } else {
                this._elements.scroller.style.left = barOffset + 'px';
            }
        },

        /**
         * Calculate the scroll bar height based on the viewport height and the scaled virtual height
         */
        _setScrollerSize: function() {
            var minSize = this._options.minSize || DEFAULT_MIN_SIZE;
            var scrollerSize = Math.max(
                    minSize,
                    (this._viewportSize / this._contentSize * this._viewportSize));
            if (scrollerSize >= this._viewportSize) {
                scrollerSize = 0;
            }

            this._scrollerSize = scrollerSize;

            if (this._isVertical) {
                this._elements.scroller.style.height = scrollerSize + 'px';
            } else {
                this._elements.scroller.style.width = scrollerSize + 'px';
            }
        },

        /**
         * Compute and set the track size to the size of the viewport in the
         * appropriate dimension.
         *
         * @method ScrollBar#setTrackSize
         */
        _setTrackSize: function() {
            var trackSize = this._viewportSize - this._trackMargin;
            this._trackSize = trackSize;

            if (this._isVertical) {
                this._elements.scrollTrack.style.height = trackSize + 'px';
            } else {
                this._elements.scrollTrack.style.width = trackSize + 'px';
            }
        },

        /**
         * Initialize the HTML elements used by this instance of ScrollBar
         * @private
         */
        _setupDOM: function() {
            var scrollerEl = document.createElement('div');
            if (this._options.scrollerId) {
                scrollerEl.setAttribute('id', this._options.scrollerId);
            }
            if (this._options.scrollerClass) {
                scrollerEl.className += ' ' + this._options.scrollerClass;
            }


            var scrollTrackEl = document.createElement('div');
            if (this._options.scrollTrackId) {
                scrollTrackEl.setAttribute('id', this._options.scrollTrackId);
            }
            if (this._options.scrollTrackClass) {
                scrollTrackEl.className += ' ' + this._options.scrollTrackClass;
            }

            var scrollerThickness = this._options.scrollerThickness || '';
            var scrollTrackThickness = this._options.scrollTrackThickness || '';
            var scrollBarOffset = this._options.scrollBarOffset || 0;

            if (this._isVertical) {
                scrollerEl.style.width = scrollerThickness + 'px';
                scrollTrackEl.style.width = scrollTrackThickness + 'px';
                scrollTrackEl.style.right = scrollBarOffset + 'px';
            } else {
                scrollerEl.style.height = scrollerThickness + 'px';
                scrollTrackEl.style.height = scrollTrackThickness + 'px';
                scrollTrackEl.style.bottom = scrollBarOffset + 'px';
            }

            scrollerEl.style.position = 'absolute';
            scrollerEl.style.zIndex = this._options.scrollerZIndex || DEFAULT_SCROLLER_Z_INDEX;

            scrollTrackEl.style.position = 'absolute';

            // Append the scroller and its scroll track to the given
            // parent element.
            scrollTrackEl.appendChild(scrollerEl);
            this._parent.appendChild(scrollTrackEl);

            this._elements = { scroller: scrollerEl, scrollTrack: scrollTrackEl };

            // Compute scale and size attributes
            this._cacheDimensions();

            this._setTrackSize();
            this._setScrollerSize();
        },

        /**
         * Position the scroller based on the current position of the ScrollList
         */
        _placeScroller: function() {
            var scrollerPosition = this._extent / this._virtualSize;
            this._setScrollerPosition(scrollerPosition);
        },

        /**
         * Attempt to move the scroller to a particular location, move it to
         * the closest valid position. The input is either an x or y coordinate
         * depending on whether the scrollbar is horizontal (x) or vertical
         * (y).
         */
        _updateScroller: function(coord) {
            // Clamp to the beginning of the scroll track
            var scrollerCoord = Math.max(0, coord - this._clickOffset);
            // Clamp to the end of the scroll track
            scrollerCoord = Math.min(scrollerCoord, this._trackSize - this._scrollerSize);

            var scrollerPosition = scrollerCoord / (this._trackSize - this._scrollerSize);
            this._setScrollerPosition(scrollerPosition);


            // Use the ratio of the scroller position to find the current
            // item in the list map.
            var itemPosition = scrollerPosition * this._virtualSize;

            var transformState = this._activeMap.getCurrentTransformState();
            var x, y;
            if (this._isVertical) {
                x = transformState.translateX;
                y = -itemPosition;
            } else {
                x = -itemPosition;
                y = transformState.translateY;
            }

            this._activeMap.transform({
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
            this._scrollerScrolling = false;
            document.removeEventListener('mousemove', this._mousemoveHandler);
            document.removeEventListener('mouseup', this._mouseupHandler);
        },

        /**
         * Scale the virtual height and re-calculate the scroll bar height
         */
        _cacheDimensions: function() {
            var transformState = this._activeMap.getCurrentTransformState();
            var contentSize = this._activeMap.getContentDimensions();
            var viewportSize = this._activeMap.getViewportDimensions();
            
            this._scale = transformState.scale;
            if (this._isVertical) {
                this._extent = -transformState.translateY;
                this._viewportSize = viewportSize.height;
                this._contentSize = contentSize.height * this._scale;
                this._virtualSize = this._contentSize - this._viewportSize;
            } else {
                this._extent = -transformState.translateX;
                this._viewportSize = viewportSize.width;
                this._contentSize = contentSize.width * this._scale;
                this._virtualSize = this._contentSize - this._viewportSize;
            }
        }

    };

    return ScrollBar;

});
