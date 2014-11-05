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

        this._isVertical = this._options.orientation === 'horizontal' ? false : true;

        this._disposed = false;

        this._layout = scrollList.getLayout();

        this._TOTAL_ITEMS = scrollList.getItemSizeCollection ? scrollList.getItemSizeCollection()._items.length :
                            scrollList.getItemMetadata().length;

        var visiblePosition = this._layout.getVisiblePosition();
        var size = this._layout.getSize();
        if (this._isVertical) {
            this._visibleSize = visiblePosition.bottom - visiblePosition.top;
            this._virtualSize = size.height - this._visibleSize;
            this._scrollableVirtualSize = size.height;
        } else {
            this._visibleSize = visiblePosition.right - visiblePosition.left;
            this._virtualSize = size.width - this._visibleSize;
            this._scrollableVirtualSize = size.width;
        }

        this._listMap = this._scrollList.getListMap();

        this._setUpDOM();

        // Set scrollbarScrolling to initially false
        this._scrollbarScrolling = false;

        this._clickOffset = null;

        // Get the initial position, in case it's not at 0, and set the scrollbar position
        self._placeScrollBar();

        // Match the scroll bar positioning to the users scrolling
        this._listMap.onTranslationChanged(function() {
            requestAnimFrame(function() {
                if (!self._scrollbarScrolling && !self._disposed) {
                    self._placeScrollBar();
                }
            });
        });

        // Make necessary adjustments when the users zooms in or out
        this._listMap.onScaleChanged(function() {
            self._adjustScale();
            self._placeScrollBar();
        });

        this._scrollList.onItemsInserted(function() {
            self._TOTAL_ITEMS = scrollList.getItemSizeCollection()._items.length;
            self._adjustScale();
            self._placeScrollBar();
        });

        // Make adjustments when the scrollList is resized
        this._scrollList.onInteraction(function(scrollList, args) {
            if (args.event.type === EventTypes.RESIZE) {
                self._resize = true;
            }

            if (args.event.type === EventTypes.RELEASE && self._resize === true) {
                self._adjustScale();
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
            self._updateScrollBar(e, self._clickOffset);
        };

        // Attach handlers for scrolling the ScrollBar
        this._mousedownHandler = function(event) {
            // _mouseupHandler will ensure that, in the event that the mousemove event is not caught,
            // the event handlers will be unbound before being bound again.
            self._mouseupHandler();

            var offset;
            if (self._isVertical) {
                offset = self._elements.scrollbar.offsetTop + self._elements.scrollbarContainer.offsetTop;
                self._clickOffset = event.clientY - offset + self._elements.scrollbarContainer.offsetTop;
            } else {
                offset = self._elements.scrollbar.offsetLeft + self._elements.scrollbarContainer.offsetLeft;
                self._clickOffset = event.clientX - offset + self._elements.scrollbarContainer.offsetLeft;
            }
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
         * Initialize the HTML elements used by this instance of ScrollBar
         * @private
         */
        _setUpDOM: function() {
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

            // Append the scrollbar and it's parent container to the given parent element
            scrollbarContainerEl.appendChild(scrollbarEl);
            this._parent.appendChild(scrollbarContainerEl);

            this._elements = { scrollbar: scrollbarEl, scrollbarContainer: scrollbarContainerEl };

            this._adjustScale();

            // Set the container size to the viewport size and the scroll bar size to the set size.
            var viewportSize = this._layout.getViewportSize();
            if (this._isVertical) {
                scrollbarContainerEl.style.height = viewportSize.height + 'px';
                scrollbarEl.style.height = this._scrollbarSize + 'px';
            } else {
                scrollbarContainerEl.style.width = viewportSize.width + 'px';
                scrollbarEl.style.width = this._scrollbarSize + 'px';
            }
        },

        /**
         * Position the scrollbar based on the current position of the ScrollList
         */
        _placeScrollBar: function() {
            var visiblePosition = this._layout.getVisiblePosition();
            var currentPosition;
            if (this._isVertical) {
                currentPosition = visiblePosition.top;
            } else {
                currentPosition = visiblePosition.left;
            }

            var translatedPosition = Math.round(
                    this._availableScrollbarSize / this._virtualSize * currentPosition);
            translatedPosition = Math.max(0, translatedPosition);
            translatedPosition = Math.min(translatedPosition, this._availableScrollbarSize);

            if (this._isVertical) {
                this._elements.scrollbar.style.top = translatedPosition + 'px';
            } else {
                this._elements.scrollbar.style.left = translatedPosition + 'px';
            }
        },

        /**
         * Position the scrollbar based on the position of a click event
         */
        _updateScrollBar: function(event, clickOffset) {
            var scrollbarPos;
            if (this._isVertical) {
                scrollbarPos = Math.max(0, event.clientY - clickOffset);
            } else {
                scrollbarPos = Math.max(0, event.clientX - clickOffset);
            }
            // Don't go past the bounds of the scrollbar container
            scrollbarPos = Math.min(scrollbarPos, this._availableScrollbarSize);

            if (this._isVertical) {
                this._elements.scrollbar.style.top = scrollbarPos + 'px';
            } else {
                this._elements.scrollbar.style.left = scrollbarPos + 'px';
            }

            var scrollListPos = scrollbarPos;
            // Use the ratio of scrollbar position inside the scrolling area to calculate
            // the current item we should be interested in.
            var positionOfInterest = (scrollListPos * this._scale / this._availableScrollbarSize) * this._virtualSize;
            // Ensure that positionOfInterest isn't undefined.
            if (!positionOfInterest) {
                positionOfInterest = 0;
            }
            positionOfInterest = Math.min(positionOfInterest, this._virtualSize * this._scale);

            var transformState = this._listMap.getCurrentTransformState();
            if (this._isVertical) {
                var x = transformState.translateX;
                this._listMap.transform({
                    x: x,
                    y: -positionOfInterest,
                    scale: this._scale
                });
            } else {
                var y = transformState.translateY;
                this._listMap.transform({
                    x: -positionOfInterest,
                    y: y,
                    scale: this._scale
                });
            }

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
        _calculateScrollBarSize: function() {
            // Calculate the size of the scrollbar depending on the virtual height
            // The scrollbar shouldn't be shorter than MIN_SIZE
            var MIN_SIZE = this._options.minSize || DEFAULT_MIN_SIZE;

            var viewportSize = this._layout.getViewportSize();
            var scrollBarSize;
            if (this._isVertical) {
                scrollBarSize = Math.max(
                        MIN_SIZE, (this._visibleSize / this._scrollableVirtualSize) * viewportSize.height);
                if (scrollBarSize >= viewportSize.height) {
                    scrollBarSize = 0;
                }
            } else {
                scrollBarSize = Math.max(
                        MIN_SIZE, (this._visibleSize / this._scrollableVirtualSize) * viewportSize.width);
                if (scrollBarSize >= viewportSize.width) {
                    scrollBarSize = 0;
                }
            }
            return scrollBarSize;
        },

        /**
         * Scale the virtual height and re-calculate the scroll bar height
         */
        _adjustScale: function() {
            var transformState = this._listMap.getCurrentTransformState();
            var visiblePosition = this._layout.getVisiblePosition();
            var size = this._layout.getSize();
            var viewportSize = this._layout.getViewportSize();

            this._scale = transformState.scale;
            
            if (this._isVertical) {
                this._visibleSize = visiblePosition.bottom - visiblePosition.top;
                this._virtualSize = size.height - this._visibleSize;
                this._scrollableVirtualSize = size.height;
            } else {
                this._visibleSize = visiblePosition.right - visiblePosition.left;
                this._virtualSize = size.width - this._visibleSize;
                this._scrollableVirtualSize = size.width;
            }
            this._scrollbarSize = this._calculateScrollBarSize();

            if (this._isVertical) {
                this._elements.scrollbar.style.height = this._scrollbarSize + 'px';
                this._elements.scrollbarContainer.style.height = viewportSize.height + 'px';
                this._availableScrollbarSize = viewportSize.height - this._scrollbarSize;
            } else {
                this._elements.scrollbar.style.width = this._scrollbarSize + 'px';
                this._elements.scrollbarContainer.style.width = viewportSize.width + 'px';
                this._availableScrollbarSize = viewportSize.width - this._scrollbarSize;
            }
        }

    };

    return ScrollBar;

});
