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
     */

    var ScrollBar = function (scrollList, parent, options) {
        var clickOffset, offset;
        var MIN_HEIGHT = '16';
        
        var that = this;

        function calculateScrollBarHeight ( viewportHeight, virtualHeight ) {
            // Calculate the size of the scrollbar depending on the virtual height
            // The scrollbar shouldn't be shorter than MIN_HEIGHT
            return Math.max(MIN_HEIGHT, ((viewportHeight/(virtualHeight)) * viewportHeight));
        }
        
        // Set the scrollList
        if (scrollList === undefined) {
            throw new Error('ScrollBar#ScrollBar: scrollList is required');
        }
        else {
            this._scrollList = scrollList;
        }
            
        // Set the parent
        if (parent === undefined) {
            throw new Error('ScrollBar#ScrollBar: parent is required.');
        }
        else {
            this._parent = parent;
        }
        
        // Set the options
        this._options = options;

        // Set the layout
        this._layout = scrollList.getLayout();
        
        // Set the number of items
        this._TOTAL_ITEMS = scrollList._items.length;
        
        // Set the viewportHeight
        this._viewportHeight = this._layout.getViewportSize().height;
        
        // Set the virtualHeight
        this._virtualHeight = this._layout.getSize().height;
        
        // Set the initial scrollbar height
        this._scrollbarHeight = calculateScrollBarHeight(this._viewportHeight, this._virtualHeight);

        // Set up the DOM and set the scrollbar and scrollbarContainer elements
        this._elements = this.setUpDOM();

        // Set the average object height
        this._avgObjHeight = this._virtualHeight/this._TOTAL_ITEMS;
        
        // Set scrollbarScrolling to initially false
        this._scrollbarScrolling = false;
        
        // Get the initial position, in case it's not at 0, and set the scrollbar position and page number
        requestAnimFrame(function() {
            that.placeScrollBar(that, that._elements.scrollbar);
        });

        // Match the scroll bar positioning to the users scrolling
        this._scrollList.getListMap().onTranslationChanged(function() {
            if (this._scrollbarScrolling) {
                return;
            }
            requestAnimFrame(function() {
                that.placeScrollBar(that, that._elements.scrollbar);
            });
        });

        // Make necessary adjustments when the users zooms in or out
        this._scrollList.getListMap().onScaleChanged(function() {
            that._virtualHeight = that._layout.getSize().height * scrollList._scaleTranslator._map.getCurrentTransformState().scale;
            that._scrollbarHeight = calculateScrollBarHeight(that._viewportHeight, that._virtualHeight);
            that._elements.scrollbar.style.height = that._scrollbarHeight + 'px';
            that._avgObjHeight = that._virtualHeight/that._TOTAL_ITEMS;
        });

        // Attach handlers for scrolling the ScrollBar
        this._elements.scrollbar.addEventListener('mousedown', function(event) {
            offset = that._elements.scrollbar.offsetTop + that._elements.scrollbarContainer.offsetTop;
            clickOffset = event.clientY - offset + that._elements.scrollbarContainer.offsetTop;
            that._scrollbarScrolling = true;
            
            that._mouseupHandler = function () {
                that.stopUpdatingScrollbar(that);
            };
            
            that._mousemoveHandler = function (e) {
                that.updateScrollBar(e, that, clickOffset);
            };
            
            document.addEventListener('mousemove', that._mousemoveHandler);
            
            document.addEventListener('mouseup', that._mouseupHandler);
        });

    };

    ScrollBar.prototype = {
        setUpDOM: function () {
            // Create the scrollbar's container
            var scrollbarContainerEL = document.createElement('div');
            var scrollbarEL = document.createElement('div');

            // Set the given classes and ids scrollbar and it's container
            if ( this._options.scrollbarId ) {
                scrollbarEL.setAttribute('id', this._options.scrollbarId);
            }
            if ( this._options.scrollbarClass ) {
                scrollbarEL.classNames += this._options.scrollbarClass;
            }
            if ( this._options.scrollbarContainerId ) {
                scrollbarContainerEL.setAttribute('id', this._options.scrollbarContainerId);
            }
            if ( this._options.scrollbarContainerClass) {
                scrollbarContainerEL.classnames += this._options.scrollbarContainerClass;
            }

            // Append the scrollbar and it's parent container to the given parent element
            scrollbarContainerEL.appendChild(scrollbarEL);
            this._parent.appendChild(scrollbarContainerEL);

            // Set the container height to the viewport height
            scrollbarContainerEL.style.height = this._viewportHeight + 'px';
            // Set the scrollbar height
            scrollbarEL.style.height = this._scrollbarHeight + 'px';

            return {scrollbar: scrollbarEL, scrollbarContainer: scrollbarContainerEL};
        },
        
        placeScrollBar: function (that) {
            var currentPosition = that._layout.getVisiblePosition().top;
            var availableScrollbarHeight = that._viewportHeight - that._scrollbarHeight;
            var scrollableVirtualHeight = this._virtualHeight - that._viewportHeight;
            var translatedPosition = availableScrollbarHeight / scrollableVirtualHeight * currentPosition;
            that._elements.scrollbar.style.top = translatedPosition + 'px';
        },
        
        updateScrollBar: function (event, that, clickOffset) {
            // Don't go past the window bounds
            var scrollbarPos = Math.max(0, event.clientY - clickOffset);
            scrollbarPos = Math.min(scrollbarPos, that._viewportHeight - that._scrollbarHeight);
            that._elements.scrollbar.style.top = scrollbarPos + 'px';
            var offset = (that._viewportHeight/that._avgObjHeight)/2;

            // Use the ratio of scrollbar position inside the scrolling area to calculate
            // the current item we should be interested in.
            var positionOfInterest = ((scrollbarPos) / (that._viewportHeight - that._scrollbarHeight)) * (that._TOTAL_ITEMS - offset) + offset;
            // Ensure that positionOfInterest isn't undefined.
            if (!positionOfInterest) {
                positionOfInterest = 0;
            }
            // We can't allow scrolling past the document height
            if ( positionOfInterest === that._TOTAL_ITEMS ) {
                positionOfInterest = that._TOTAL_ITEMS - 0.1;
            }

            var indexOfItem = Math.floor(positionOfInterest);
            var remainder = positionOfInterest - indexOfItem;

            var objHeight = that._scrollList._items[indexOfItem].height;

            var y = objHeight * remainder;

            that._scrollList.scrollTo({
                index: indexOfItem,
                center: {x: 0, y: y}
            });
        },
        
        stopUpdatingScrollbar: function (that) {
            document.removeEventListener('mousemove', that._mousemoveHandler);
            that._scrollbarScrolling = false;
            that.removeDocumentEventWatching(that);
        },
        
        removeDocumentEventWatching: function (that) {
            document.removeEventListener('mouseup', that._mouseupHandler);
        }
    };

    return ScrollBar;

});
