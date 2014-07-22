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

    var ZoomPersistanceProvider = function(scrollList) {
        this._scrollList = scrollList;
        this._currentPage = this._scrollList.getCurrentItem().index;

        this._scrollList.onScaleChanged(this._scaleAllItems.bind(this));
        this._scrollList.onCurrentItemChanged(this._prepForPeek.bind(this));
    };

    ZoomPersistanceProvider.prototype = {
        // Scale all the awesomemaps
        _scaleAllItems: function() {
            if (this._scaleChanging) {
                return;
            }
            if (this._currentPage === this._scrollList.getCurrentItem().index) {
                var scale = this._scrollList.getCurrentItemMap().getScale();
                if (scale === this._persistentZoom) {
                    return;
                }
                this._persistentZoom = scale;
                this._prepForPeek();
            }
        },

        // Adjust how the next and previous awesomemaps are rendered so that weird shit doesn't happen
        _prepForPeek: function() {
            var previous = this._scrollList.getItemMap(this._scrollList.getCurrentItem().index - 1);
            var next = this._scrollList.getItemMap(this._scrollList.getCurrentItem().index + 1);
            this._scaleChanging = true;
            this._scrollList.getCurrentItemMap().zoomTo({ scale: this._persistentZoom });
            if (next) {
                next.zoomTo({ scale: this._persistentZoom });
                next.panTo({ y: 0 });
            }
            if (previous) {
                previous.zoomTo({ scale: this._persistentZoom });
                previous.panTo({ y: -previous.getContentDimensions().height * previous.getScale() });
            }
            this._scaleChanging = false;
            this._currentPage = this._scrollList.getCurrentItem().index;
        }
    };

    return ZoomPersistanceProvider;
});