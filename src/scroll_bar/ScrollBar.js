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

    /**
     * Creates a new ScrollBar with the given ScrollList and options.
     * ScrollBar expects the template for the scrollbar to follow this structure:
     * <div id="scroll-bar-container">
     *   <div id="scroll-bar"></div>
     * </div>
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
     * @param {number} verticalOffset
     *        The distance between the scrollList and the top of the
     *        page, used for positioning purposes.
     *
     */

    var ScrollBar = function (scrollList, parentEL, verticalOffset, options) {
        var clickOffset, offset;
        var scrollbarScrolling = false;
        var viewportHeight, virtualHeight, scrollbarHeight, scrollbar;
        var TOTAL_ITEMS, layout;
        var objHeight, avgObjHeight, y, scrollbarContainerEL, scrollbarEL;

        // Access the layout
        layout = scrollList.getLayout();

        TOTAL_ITEMS = scrollList._items.length;
        viewportHeight = layout.getViewportSize().height;
        virtualHeight = layout.getSize().height;

        // Calculate the size of the scrollbar depending on the virtual height
        // The scrollbar shouldn't be shorter than 16px
        scrollbarHeight = Math.max(16, ((viewportHeight/(virtualHeight)) * viewportHeight));

        // Create the scrollbar's container
        scrollbarContainerEL = document.createElement("div");
        scrollbarEL = document.createElement("div");

        // Set the given classes and ids scrollbar and it's container
        if ( options.scrollbarId )
            scrollbarEL.setAttribute("id", options.scrollbarId);
        if ( options.scrollbarClass )
            scrollbarEL.classNames += options.scrollbarClass;
        if ( options.scrollbarContainerId )
            scrollbarContainerEL.setAttribute("id", options.scrollbarContainerId);
        if ( options.scrollbarContainerClass)
            scrollbarContainerEL.classnames += options.scrollbarContainerClass;

        scrollbarContainerEL.appendChild(scrollbarEL);
        parentEL.appendChild(scrollbarContainerEL);

        // Set the container height to the viewport height
        scrollbarContainerEL.style.height = viewportHeight + "px";
        // Set the scrollbar height
        scrollbarEL.style.height = scrollbarHeight + "px";
        scrollbarContainerEL.style.marginTop = verticalOffset + "px";

        avgObjHeight = virtualHeight/TOTAL_ITEMS;

        // Get the initial position, in case it's not at 0, and set the scrollbar position and page number
        setTimeout(function() {
                var currentPosition = layout.getVisiblePosition().top;
                var availableScrollbarHeight = viewportHeight - scrollbarHeight;
                var scrollableVirtualHeight = virtualHeight - viewportHeight;
                var translatedPosition = availableScrollbarHeight / scrollableVirtualHeight * currentPosition;
                scrollbarEL.style.top = translatedPosition + "px";
            }, 0);

        // Match the scroll bar positioning to the users scrolling
        scrollList.getListMap().onTranslationChanged(function(/*sender, args*/) {
            if (scrollbarScrolling) {
                return;
            }
            setTimeout(function() {
                var currentPosition = layout.getVisiblePosition().top;
                var availableScrollbarHeight = viewportHeight - scrollbarHeight;
                var scrollableVirtualHeight = virtualHeight - viewportHeight;
                var translatedPosition = availableScrollbarHeight / scrollableVirtualHeight * currentPosition;
                scrollbarEL.style.top = translatedPosition + "px";
            }, 0);
        });

        function updateScrollBar(event) {
            // Don't go past the window bounds
            var scrollbarPos = Math.max(0, event.clientY - clickOffset);
            scrollbarPos = Math.min(scrollbarPos, viewportHeight - scrollbarHeight);
            scrollbarEL.style.top = scrollbarPos + "px";
            var offset = (viewportHeight/avgObjHeight)/2;

            // Use the ratio of scrollbar position inside the scrolling area to calculate
            // the current item we should be interested in.
            var positionOfInterest = ((scrollbarPos) / (viewportHeight - scrollbarHeight)) * (TOTAL_ITEMS - offset) + offset;
            // Ensure that positionOfInterest isn't undefined.
            if (!positionOfInterest) {
                positionOfInterest = 0;
            }
            // We can't allow scrolling past the document height
            if ( positionOfInterest === TOTAL_ITEMS ) {
                positionOfInterest = TOTAL_ITEMS - 0.1;
            }

            var indexOfItem = Math.floor(positionOfInterest);
            var remainder = positionOfInterest - indexOfItem;

            objHeight = scrollList._items[indexOfItem].height;

            y = objHeight * remainder;

            scrollList.scrollTo({
                index: indexOfItem,
                center: {x: 0, y: y}
            });
        }

        function stopUpdatingScrollbar() {
            clickOffset = undefined;
            document.removeEventListener('mousemove', updateScrollBar);
            scrollbarScrolling = false;
            removeDocumentEventWatching();
        }

        function removeDocumentEventWatching () {
            document.removeEventListener('mouseup', stopUpdatingScrollbar);
        }

        scrollbarEL.addEventListener('mousedown', function(event) {
            offset = scrollbarEL.offsetTop + scrollbarContainerEL.offsetTop;
            clickOffset = event.clientY - offset + verticalOffset;
            scrollbarScrolling = true;
            document.addEventListener('mousemove', updateScrollBar);
            document.addEventListener('mouseup', stopUpdatingScrollbar);
        });
    };

    return ScrollBar;

});
