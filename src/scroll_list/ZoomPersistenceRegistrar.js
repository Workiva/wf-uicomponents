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
            var currentItemMap = scrollList.getCurrentItemMap();
            if (!currentItemMap) {
                return;
            }
            var newScale = currentItemMap.getScale();
            if (newScale === scale) {
                return;
            }
            scale = newScale;
            currentItemIndex = scrollList.getCurrentItem().index;
            _zoomNextPrevious(scrollList, scale, currentItemIndex);
        });
        scrollList.onCurrentItemChanged(function() {
            var previousItemIndex = currentItemIndex;
            currentItemIndex = scrollList.getCurrentItem().index;

            if (Math.abs(currentItemIndex - previousItemIndex) > 1) {
                // We jumped more than one page so we need to set the zoom and
                // page location on the current page in addition to the new
                // next and previous
                var current = scrollList.getCurrentItemMap();
                current.zoomTo({
                    scale: scale
                });
                current.panTo({
                    y: 0
                });
            }

            _zoomNextPrevious(scrollList, scale, currentItemIndex);
        });
    }

    function _zoomNextPrevious(scrollList, scale, currentItemIndex) {
        var previous = scrollList.getItemMap(currentItemIndex - 1);
        if (previous) {
            previous.zoomTo({
                scale: scale
            });
            previous.panTo({
                y: -previous.getContentDimensions().height * scale
            });
        }

        var next = scrollList.getItemMap(currentItemIndex + 1);
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
