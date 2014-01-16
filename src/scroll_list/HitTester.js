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
         * @param {InteractionEvent} event - The interaction event under test.
         * @param {TransformState} state - The current transform state of the item map.
         * @return {false|{ index: number, position: { x: number, y: number }}}
         */
        testItemMap: function(scrollList, event, currentState) {
            if (!event.position) {
                return false;
            }

            var position = event.position;
            var scale = currentState.scale;

            var layout = scrollList.getLayout();
            var currentItemIndex = layout.getCurrentItemIndex();
            var itemLayout = layout.getItemLayout(currentItemIndex);

            // This is awful stuff. Tricky currently due to using the item map
            // to center and position content, overriding the layout stuff.
            // Ideally this logic would live in the layout.
            var validBounds = {
                top: currentState.translateY + itemLayout.paddingTop * scale,
                right: currentState.translateX + (itemLayout.outerWidth - itemLayout.paddingRight) * scale,
                bottom: currentState.translateY + (itemLayout.outerHeight - itemLayout.paddingBottom) * scale,
                left: currentState.translateX + itemLayout.paddingLeft * scale
            };

            if (position.x >= validBounds.left && position.x <= validBounds.right &&
                position.y >= validBounds.top && position.y <= validBounds.bottom) {

                return {
                    index: currentItemIndex,
                    position: {
                        x: Math.floor((position.x - validBounds.left) / scale),
                        y: Math.floor((position.y - validBounds.top) / scale)
                    }
                };
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
         * @param {InteractionEvent} event - The interaction event under test.
         * @param {TransformState} state - The current transform state of the item map.
         * @return {false|{ index: number, position: { x: number, y: number }}}
         */
        testListMap: function(scrollList, event, state) {
            if (!event.position) {
                return false;
            }

            var position = event.position;
            var scale = state.scale;

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
                    top: state.translateY + (itemLayout.top + itemLayout.paddingTop) * scale,
                    right: state.translateX + (itemLayout.right - undoLeftBy - itemLayout.paddingRight) * scale,
                    bottom: state.translateY + (itemLayout.bottom - itemLayout.paddingBottom) * scale,
                    left: state.translateX + (itemLayout.left - undoLeftBy + itemLayout.paddingLeft) * scale
                };

                if (position.x >= validBounds.left && position.x <= validBounds.right &&
                    position.y >= validBounds.top && position.y <= validBounds.bottom) {

                    return {
                        index: i,
                        position: {
                            x: Math.floor((position.x - validBounds.left) / scale),
                            y: Math.floor((position.y - validBounds.top) / scale)
                        }
                    };
                }
            }

            return false;
        }
    };

    return HitTester;
});
