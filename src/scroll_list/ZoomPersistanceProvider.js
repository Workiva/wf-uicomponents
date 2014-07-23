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
 * limitations under the License.*
 */

define(function() {
    'use strict';

    /**
     * Creates a new ZoomPersistanceProvider tied to the provided ScrollList
     *
     * @classdesc
     * A ZoomPersistanceProvider maintains the zoom level of the ScrollList when
     * changing between AwesomeMaps in peek/single modes.
     *
     * @name ZoomPersistanceProvider
     * @constructor
     *
     * @param {ScrollList} scrollList
     *        The ScrollList to persist zoom on.
     *
     */
    var ZoomPersistanceProvider = function(scrollList) {
        this._scrollList = scrollList;
        this._currentPage = this._scrollList.getCurrentItem().index;

        this._scrollList.onScaleChanged(this._updateZoom.bind(this));
        this._scrollList.onCurrentItemChanged(this._zoomNextPrevious.bind(this));
    };

    ZoomPersistanceProvider.prototype = {
        //---------------------------------------------------------
        // Private methods
        //---------------------------------------------------------

        /*
         * _updateZoom reacts to scale changes and sets the new zoom
         * level to maintain across pages.
         */
        _updateZoom: function() {
            if (this._scaleChanging) {
                return;
            }
            if (this._currentPage === this._scrollList.getCurrentItem().index) {
                var scale = this._scrollList.getCurrentItemMap().getScale();
                if (scale === this._persistentZoom) {
                    return;
                }
                this._persistentZoom = scale;
                this._zoomNextPrevious();
            }
        },

        /*
         * _zoomNextPrevious sets the zoom on the current, next, and previous
         * pages. It also scrolls the previous and next pages to appropriate
         * positions.
         */
        _zoomNextPrevious: function() {
            this._currentPage = this._scrollList.getCurrentItem().index;
            var previous = this._scrollList.getItemMap(this._currentPage - 1);
            var next = this._scrollList.getItemMap(this._currentPage + 1);
            this._scaleChanging = true;

            // In the case that we've just jumped to a new page that wasn't the next
            // or previous page, we need to make sure it's at the previous scale.
            this._scrollList.getCurrentItemMap().zoomTo({ scale: this._persistentZoom });

            // When we peek at the next page, we want to see the top of the page.
            if (next) {
                next.zoomTo({ scale: this._persistentZoom });
                next.panTo({ y: 0 });
            }
            // When we peek at the previous page, we want to see the bottom of the page.
            if (previous) {
                previous.zoomTo({ scale: this._persistentZoom });
                previous.panTo({
                    y: -previous.getContentDimensions().height * this._persistentZoom
                });
            }

            this._scaleChanging = false;
        }
    };

    return ZoomPersistanceProvider;
});