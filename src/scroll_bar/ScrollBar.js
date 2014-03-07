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
     
    var ScrollBar = function (scrollList, verticalOffset) {
        var clickOffset, offset;
        var scrollbarScrolling = false;
        var viewportHeight, virtualHeight, scrollbarHeight, scrollbar;
        var TOTAL_ITEMS, scrollList, layout;
        var navbarBottem, objHeight, avgObjHeight, y, scrollbarContainer;

        // Access the layout
        layout = scrollList.getLayout();
        
        TOTAL_ITEMS = scrollList._items.length;
        viewportHeight = layout.getViewportSize().height;
        virtualHeight = layout.getSize().height;
        
        // Calculate the size of the scrollbar depending on the virtual height
        // The scrollbar shouldn't be shorter than 16px
        scrollbarHeight = Math.max(16, ((viewportHeight/(virtualHeight)) * viewportHeight));
        
        // The scrollbar and it's container are here for us to manipulate the height and offset of
        scrollbar = $('#scroll-bar');
        scrollbarContainer = $('#scroll-bar-container');
        // Set the container height to the viewport height
        scrollbarContainer.height(viewportHeight);
        // Set the scrollbar height
        scrollbar.height(scrollbarHeight);
        scrollbarContainer.css('margin-top', verticalOffset);
        
        avgObjHeight = virtualHeight/TOTAL_ITEMS;
        
        // Get the initial position, in case it's not at 0, and set the scrollbar position and page number
        setTimeout(function() {
                var currentPosition = layout.getVisiblePosition().top;
                var availableScrollbarHeight = viewportHeight - scrollbarHeight;
                var scrollableVirtualHeight = virtualHeight - viewportHeight;
                var translatedPosition = availableScrollbarHeight / scrollableVirtualHeight * currentPosition;
                scrollbar.css('top', translatedPosition);
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
                scrollbar.css('top', translatedPosition);
            }, 0);
        });

        function updateScrollBar(event) {
            // Don't go past the window bounds
            var scrollbarPos = Math.max(0, event.clientY - clickOffset);
            scrollbarPos = Math.min(scrollbarPos, viewportHeight - scrollbarHeight);
            scrollbar.css('top', scrollbarPos);
            var offset = (viewportHeight/avgObjHeight)/2;
           
            // Use the ratio of scrollbar position inside the scrolling area to calculate
            // the current item we should be interested in.
            var positionOfInterest = ((scrollbarPos) / (viewportHeight - scrollbarHeight)) * (TOTAL_ITEMS - offset) + offset;
            // We can't allow position of interest to somehow become undefined
            if (!positionOfInterest) {
                positionOfInterest = 0;
            }
            // We can't allow scrolling past the document height
            if ( positionOfInterest == TOTAL_ITEMS ) {
                positionOfInterest = TOTAL_ITEMS - .1;
            } 
          
            var indexOfItem = Math.floor(positionOfInterest);
            var remainder = positionOfInterest - indexOfItem;
            
            objHeight = scrollList._items[indexOfItem].height;
            
            // The first and last objects have extra padding
            if ( ( indexOfItem == 0 ) || ( indexOfItem == TOTAL_ITEMS ) ) {
                y = (objHeight + 10) * remainder;
            }
            
            else
                y = (objHeight + 5) * remainder;
            
            y = objHeight * remainder;                           
            
            scrollList.scrollTo({
                index: indexOfItem,
                center: {x: 0, y: y}
            });                    
        }
        
        function stopUpdatingScrollbar(event) {
            clickOffset = undefined;
            $(document).off('mousemove', updateScrollBar);
            scrollbarScrolling = false;
            removeDocumentEventWatching();
        }
        
        function removeDocumentEventWatching () {
            $(document).off('mouseup', stopUpdatingScrollbar);
        }
        
        scrollbar.on('mousedown', function(event) {
            offset = scrollbar.offset();
            clickOffset = event.clientY - offset.top + verticalOffset;
            scrollbarScrolling = true;
            $(document).on('mousemove', updateScrollBar);
            $(document).on('mouseup', stopUpdatingScrollbar);
        });
    };
    
    return ScrollBar;
   
 });