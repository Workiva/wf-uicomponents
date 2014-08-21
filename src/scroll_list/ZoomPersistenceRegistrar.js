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

    function _register(scrollList) {
        var scale = 1;
        var currentItemIndex = scrollList.getCurrentItem().index;
        scrollList.onScaleChanged(function() {
            if (currentItemIndex !== scrollList.getCurrentItem().index) {
                return;
            }
            var newScale = scrollList.getCurrentItemMap().getScale();
            if (newScale === scale) {
                return;
            }
            scale = newScale;
            currentItemIndex = scrollList.getCurrentItem().index;
            _zoomNextPrevious(scrollList, scale);
        });
        scrollList.onCurrentItemChanged(function() {
            currentItemIndex = scrollList.getCurrentItem().index;
            _zoomNextPrevious(scrollList, scale);
        });
    }

    function _zoomNextPrevious(scrollList, scale) {
        // Set the scale on the current page in case we jumped to a page that
        // wasn't the next or previous page.
        scrollList.getCurrentItemMap().zoomTo({
            scale: scale
        });

        var currentIndex = scrollList.getCurrentItem().index;

        var previous = scrollList.getItemMap(currentIndex - 1);
        if (previous) {
            previous.zoomTo({
                scale: scale
            });
            previous.panTo({
                y: -previous.getContentDimensions().height * scale
            });
        }

        var next = scrollList.getItemMap(currentIndex + 1);
        if (next) {
            next.zoomTo({
                scale: scale
            });
            next.panTo({
                y: 0,
            });
        }
    }

    var ZoomPersistenceRegistrar = {
        register: _register
    };

    return ZoomPersistenceRegistrar;
});
