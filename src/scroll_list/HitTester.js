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

    function getHitData(itemLayout, position, bounds, mapScale) {
        var scaleFactor = mapScale * itemLayout.scaleToFit;
        return {
            index: itemLayout.itemIndex,
            position: {
                x: Math.floor((position.x - bounds.left) / scaleFactor),
                y: Math.floor((position.y - bounds.top) / scaleFactor)
            }
        };
    }

    /**
     * @classdesc
     *
     * HitTester provides methods for hit testing ScrollList items and providing
     * information about the item index and item-relative position of events.
     *
     * @exports HitTester
     */
    var HitTester = {

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Tests whether interaction events occur on an item.
         * If a hit is detected, return the item index and the position of the
         * interaction relative to the actual size of the item.
         *
         * @method
         * @param {ScrollList} scrollList
         * @param {{ x: number, y: number }} point
         * @return {boolean|{ index: number, position: { x: number, y: number }}}
         */
        testItemMap: function(scrollList, point) {
            // Item map may not exist after list invalidation, which happens
            // during window/container resize event cycles.
            var itemMap = scrollList.getCurrentItemMap();
            if (!itemMap) {
                return false;
            }

            var state = itemMap.getCurrentTransformState();
            var mapScale = state.scale;
            var layout = scrollList.getLayout();
            var currentItemIndex = layout.getCurrentItemIndex();
            var itemLayout = layout.getItemLayout(currentItemIndex);

            // This is awful stuff. Tricky currently due to using the item map
            // to center and position content, overriding the layout stuff.
            // Ideally this logic would live in the layout.
            var validBounds = {
                top: state.translateY + itemLayout.paddingTop * mapScale,
                right: state.translateX + (itemLayout.outerWidth - itemLayout.paddingRight) * mapScale,
                bottom: state.translateY + (itemLayout.outerHeight - itemLayout.paddingBottom) * mapScale,
                left: state.translateX + itemLayout.paddingLeft * mapScale
            };

            if (validBounds.left <= point.x && point.x <= validBounds.right &&
                validBounds.top <= point.y && point.y <= validBounds.bottom) {

                return getHitData(itemLayout, point, validBounds, mapScale);
            }

            return false;
        },

        /**
         * Tests whether interaction events occur on an item in the list.
         * If a hit is detected, return the item index and the position of the
         * interaction relative to the actual size of the item.
         *
         * @method
         * @param {ScrollList} scrollList
         * @param {{ x: number, y: number }} point
         * @return {boolean|{ index: number, position: { x: number, y: number }}}
         */
        testListMap: function(scrollList, point) {
            var listMap = scrollList.getListMap();
            var state = listMap.getCurrentTransformState();
            var mapScale = state.scale;

            var layout = scrollList.getLayout();
            var undoLeftBy = (layout.getViewportSize().width - layout.getSize().width) / 2;
            var visibleRange = layout.getVisibleItemRange();
            var itemLayout;
            var validBounds;
            var i;

            // Again, like above: awful stuff. Tricky currently due to using the
            // list map to center and position content, overriding the layout
            // position. Ideally this logic would live in the layout.
            for (i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
                itemLayout = layout.getItemLayout(i);
                validBounds = {
                    top: state.translateY + (itemLayout.top + itemLayout.paddingTop) * mapScale,
                    right: state.translateX + (itemLayout.right - undoLeftBy - itemLayout.paddingRight) * mapScale,
                    bottom: state.translateY + (itemLayout.bottom - itemLayout.paddingBottom) * mapScale,
                    left: state.translateX + (itemLayout.left - undoLeftBy + itemLayout.paddingLeft) * mapScale
                };

                if (point.x >= validBounds.left && point.x <= validBounds.right &&
                    point.y >= validBounds.top && point.y <= validBounds.bottom) {

                    return getHitData(itemLayout, point, validBounds, mapScale);
                }
            }

            return false;
        }
    };

    return HitTester;
});
