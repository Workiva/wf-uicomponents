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

    var HorizontalAlignments = require('wf-js-uicomponents/layouts/HorizontalAlignments');
    var ScrollModes = require('wf-js-uicomponents/scroll_list/ScrollModes');
    var VerticalAlignments = require('wf-js-uicomponents/layouts/VerticalAlignments');

    /**
     * Creates a new PositionTranslator.
     *
     * @classdesc
     *
     * PositionTranslator converts between viewport and AwesomeMap
     * transformation plane coordinates for ScrollList items. This encapsulates
     * assumptions about where the map will be positioned in the viewport
     * initially as well as where the items will be positioned in that map. As
     * a result, it is currently highly dependent on how the VerticalLayout
     * positions items and how the AwesomeMapFactory initially aligns the
     * AwesomeMap.
     *
     * For example, when the ScrollList is in "flow" mode and the horizontal
     * alignment is set to "auto", if the maximum width of the content is 1000
     * and the viewport width is 500, the AwesomeMap's transformation plane
     * initially will be positioned with its left edge at the left edge of the
     * viewport. Any items that are narrower than the viewport will be centered
     * in the viewport. Any items that are wider than the viewport will be
     * left-justified in the viewport and the AwesomeMap.
     *
     * When the ScrollList is in "flow" mode and the horizontal alignment is
     * set to "auto", if the content is narrower than the viewport the
     * AwesomeMap's transformation plane initially will be centered in the
     * viewport and the items will be centered within the AwesomeMap.
     *
     * When the ScrollList is in "flow" mode and the horizontal alignment is
     * set to "left", the AwesomeMap's transformation plane initially will be
     * positioned at the left edge of the viewport and the items within it will
     * be at the left edge of the AwesomeMap.
     *
     * When the ScrollList is not in "flow" mode each item is assumed to fill
     * its containing AwesomeMap. Methods are provided to determine the expected
     * position of an item relative to the viewport.
     *
     * @name PositionTranslator
     * @constructor
     *
     * @param {ScrollList} scrollList
     *        The ScrollList that contains the items whose positions are to
     *        be translated.
     */
    var PositionTranslator = function(scrollList) {
        this._scrollList = scrollList;

        this._hAlign = scrollList.getOptions().horizontalAlign;
        this._vAlign = scrollList.getOptions().verticalAlign;
        this._scrollMode = scrollList.getOptions().mode;

        var layout = scrollList.getLayout();
        this._layoutSize = layout.getSize();
        this._viewportSize = layout.getViewportSize();
    };

    PositionTranslator.prototype = {

        /**
         * Adjusts the left position of an item relative to account for the
         * offset between the viewport and the containing AwesomeMap. This
         * adjusts the value if the map is narrower than the viewport and the
         * ScrollList is in a mode that will result in the map being centered
         * in the viewport. Otherwise the value itself is returned.
         *
         * @param  {Number} value
         * @return {Number}
         */
        viewportLeftToMapLeft: function(value) {
            var layoutWidth = this._layoutSize.width;
            var viewportWidth = this._viewportSize.width;
            var hAlign = this._hAlign;

            if (this._scrollMode === ScrollModes.FLOW) {
                if (hAlign === HorizontalAlignments.AUTO &&
                    (layoutWidth < viewportWidth)
                ) {
                    return Math.round(value - (viewportWidth - layoutWidth) / 2);
                }
            }
            return value;
        },

        /**
         * Determines the left position of an item relative to the viewport.
         *
         * @param  {ItemLayout} itemLayout
         * @return {Number}
         */
        viewportLeftOfItem: function(itemLayout) {
            if (this._scrollMode === ScrollModes.FLOW) {
                return itemLayout.left;
            } else {
                var viewportWidth = this._viewportSize.width;
                var itemWidth = itemLayout.outerWidth;
                var hAlign = this._hAlign;
                if (hAlign === HorizontalAlignments.AUTO && (itemWidth < viewportWidth)) {
                    return Math.round((viewportWidth - itemWidth) / 2);
                }
                return 0;
            }
        },

        /**
         * Determine the top position of an item relative to the viewport.
         *
         * @param  {ItemLayout} itemLayout
         * @return {Number}
         */
        viewportTopOfItem: function(itemLayout) {
            if (this._scrollMode === ScrollModes.FLOW) {
                return itemLayout.top;
            } else {
                var viewportHeight = this._viewportSize.height;
                var itemHeight = itemLayout.outerHeight;
                var vAlign = this._vAlign;
                if (vAlign === VerticalAlignments.AUTO && (itemHeight < viewportHeight)) {
                    return Math.round((viewportHeight - itemHeight) / 2);
                }
                return 0;
            }
        },

        /**
         * Computes the position of the item within the containing AwesomeMap.
         * When the ScrollList is in flow mode, and the layout is narrower than
         * the viewport, this will account for the offset between the left edge
         * of the viewport and the left edge of the AwesomeMap.
         *
         * @param  {ItemLayout} itemLayout
         * @return {{ top: number, right: number, bottom: number, left: number }}
         */
        viewportToMapBounds: function(itemLayout) {
            if (this._scrollMode === ScrollModes.FLOW) {
                // The itemLayout coordinates are relative to the viewport. So
                // account for the offset between the viewport and the AwesomeMap
                // when the viewport is wider than the AwesomeMap.
                var layoutWidth = this._layoutSize.width;
                var viewportWidth = this._viewportSize.width;
                var hAlignAuto = this._hAlign === HorizontalAlignments.AUTO;
                var undoLeftBy = 0;
                if (hAlignAuto && (layoutWidth < viewportWidth)) {
                    undoLeftBy = Math.round((viewportWidth - layoutWidth) / 2);
                }
                return {
                    top: itemLayout.top + itemLayout.paddingTop,
                    right: itemLayout.right - undoLeftBy - itemLayout.paddingRight,
                    bottom: itemLayout.bottom - itemLayout.paddingBottom,
                    left: itemLayout.left - undoLeftBy + itemLayout.paddingLeft
                };
            } else {
                // The ScrollList is not in "flow" mode so the coordinates of
                // the itemLayout are already relative to the map. Just take
                // into account the padding between the map and the item.
                return {
                    top: itemLayout.paddingTop,
                    right: itemLayout.outerWidth - itemLayout.paddingRight,
                    bottom: itemLayout.outerHeight - itemLayout.paddingBottom,
                    left: itemLayout.paddingLeft
                };
            }
        }
    };

    return PositionTranslator;
});
