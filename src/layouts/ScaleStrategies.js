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
     * Utility to offset a scale to accommodate content margins.
     *
     * @param {number} dimension - The value of the dimension to offset.
     * @param {number} marginA - The margin on one side of the item.
     * @param {number} marginB - The margin on the opposite side of the item.
     * @return {number}
     */
    function marginScaleOffset(dimension, marginA, marginB) {
        if (dimension === 0) {
            return 0;
        } else {
            return (dimension - (marginA + marginB)) / dimension;
        }
    }

    /**
     * @classdesc
     *
     * ScaleStrategies calculate the scale required to fit items within a viewport.
     *
     * @exports ScaleStrategies
     */
    var ScaleStrategies = {

        /**
         * Calculates the scale required to fit items inside the viewport.
         *
         * @method
         * @param {{width: number, height: number}} viewportSize
         *        The size of the viewport.
         * @param {Array.<{width: number, height: number}>|{width: number, height: number}} itemSizeOrSizes
         *        The size of the item or items to fit.
         * @param {number|{left: number, right: number, top: number, bottom: number}} margin
         *        The margin around the item.
         * @returns {number}
         */
        auto: function(viewportSize, itemSizeOrSizes, margin) {
            var widthScale = ScaleStrategies.width(viewportSize, itemSizeOrSizes, margin);
            var heightScale = ScaleStrategies.height(viewportSize, itemSizeOrSizes, margin);

            return Math.min(widthScale, heightScale);
        },

        /**
         * Gets the scale required to fit the height of the viewport.
         *
         * @method
         * @param {{height: number}} viewportSize
         *        The size of the viewport.
         * @param {Array.<{height: number}>|{height: number}} itemSizeOrSizes
         *        The size of the item or items to fit.
         * @param {number|{left: number, right: number, top: number, bottom: number}} margin
         *        The margin around the item.
         * @returns {number}
         */
        height: function(viewportSize, itemSizeOrSizes, margin) {
            var viewportHeight = viewportSize.height;
            var maxPageHeight = 0;
            var sizes = Array.isArray(itemSizeOrSizes) ? itemSizeOrSizes : [itemSizeOrSizes];

            // Get the maximum page height.
            for (var i = 0, n = sizes.length; i < n; i++) {
                var size = sizes[i];
                if (size.height > maxPageHeight) {
                    maxPageHeight = size.height;
                }
            }

            // Avoid division by zero below
            if (maxPageHeight === 0) {
                return 0;
            }

            var marginTop;
            var marginBottom;
            if (typeof margin === 'object') {
                marginTop = margin.top;
                marginBottom = margin.bottom;
            } else {
                marginTop = marginBottom = margin;
            }

            // Return the scale to fit height, accounting for page margins.
            return viewportHeight / maxPageHeight *
                marginScaleOffset(viewportHeight, marginTop, marginBottom);
        },

        /**
         * Returns 1.0 to prevents scaling of the content displayed in the viewport
         *
         * @return {number}
         */
        none: function() {
            return 1.0;
        },

        /**
         * Gets the scale required to fit the width of the viewport.
         *
         * @method
         * @param {{width: number}} viewportSize
         *        The size of the viewport.
         * @param {Array.<{width: number}>|{width: number}} itemSizeOrSizes
         *        The size of the item or items to fit.
         * @param {number|{left: number, right: number, top: number, bottom: number}} margin
         *        The margin around the item.
         * @returns {number}
         */
        width: function(viewportSize, itemSizeOrSizes, margin) {
            var viewportWidth = viewportSize.width;
            var sizes = Array.isArray(itemSizeOrSizes) ? itemSizeOrSizes : [itemSizeOrSizes];
            var maxPageWidth = 0;

            // Get the maximum page width.
            for (var i = 0, n = sizes.length; i < n; i++) {
                var size = sizes[i];
                if (size.width > maxPageWidth) {
                    maxPageWidth = size.width;
                }
            }

            var marginLeft;
            var marginRight;
            if (typeof margin === 'object') {
                marginLeft = margin.left;
                marginRight = margin.right;
            } else {
                marginLeft = marginRight = margin;
            }

            // Return the scale to fit width, accounting for page margins.
            return viewportWidth / maxPageWidth *
                marginScaleOffset(viewportWidth, marginLeft, marginRight);
        }
    };

    return ScaleStrategies;
});
