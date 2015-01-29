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

    /**
     * Creates a new PositionTranslator.
     *
     * @classdesc
     *
     * PositionTranslator converts from viewport coordinates to coordinates
     * relative to the transformation plane. The positional information on an
     * ItemLayout object is with respect to the viewport. But the ItemLayout is
     * contained in a transformation plane to allow it to be panned and zoomed
     * around. This provides utilities to translate between the two coordinate
     * systems.
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
         * Computes the left position of an ItemLayout relative to the
         * transformation plane.
         *
         * @param  {Number} viewportLeft
         * @return {Number}
         */
        getLeftInTransformationPlane: function(viewportLeft) {
            var layoutWidth = this._layoutSize.width;
            var viewportWidth = this._viewportSize.width;
            var hAlign = this._hAlign;

            if (this._scrollMode === ScrollModes.FLOW) {
                if (hAlign === HorizontalAlignments.CENTER) {
                    return Math.round(viewportLeft - (viewportWidth - layoutWidth) / 2);
                }
            }
            return viewportLeft;
        },

        /**
         * Computes the position of the item within the containing transformation
         * plane.
         *
         * @param  {ItemLayout} itemLayout
         * @return {{ top: number, right: number, bottom: number, left: number }}
         */
        getBoundsInTransformationPlane: function(itemLayout) {
            if (this._scrollMode === ScrollModes.FLOW) {
                // The itemLayout coordinates are relative to the viewport. So
                // account for the offset between the viewport and the AwesomeMap
                // when the viewport is wider than the AwesomeMap.
                var layoutWidth = this._layoutSize.width;
                var viewportWidth = this._viewportSize.width;
                var hAlignCenter = this._hAlign === HorizontalAlignments.CENTER;
                var undoLeftBy = 0;
                if (hAlignCenter) {
                    undoLeftBy = Math.floor((viewportWidth - layoutWidth) / 2);
                }
                return {
                    top: itemLayout.top + itemLayout.paddingTop,
                    right: itemLayout.right - undoLeftBy - itemLayout.paddingRight,
                    bottom: itemLayout.bottom - itemLayout.paddingBottom,
                    left: itemLayout.left - undoLeftBy + itemLayout.paddingLeft
                };
            }
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
    };

    return PositionTranslator;
});
