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
     * Utility to offset a scale to accomodate contentmargins.
     * @param {number} dimension - The value of the dimension to offset.
     * @param {number} margin - The margin around the dimensions.
     * @return {number}
     */
    function marginScaleOffset(dimension, margin) {
        return (dimension - margin * 2) / dimension;
    }

    /**
     * @classdesc
     *
     * ScaleStrategies calculate the scale required to fit content within a viewport.
     *
     * @exports ScaleStrategies
     */
    var ScaleStrategies = {

        /**
         * Calculates the scale required to fit content inside the viewport.
         * @method
         * @param {{width: number, height: number}} viewportDimensions
         *        The dimensions of the viewport.
         * @param {Array.<{width: number, height: number}>|{width: number, height: number}} contentOrContents
         *        The dimensions of the content or contents to fit.
         * @param {number} contentMargin
         *        The margin around the content.
         * @returns {number}
         */
        auto: function(viewportDimensions, contentOrContents, contentMargin) {
            var widthScale = ScaleStrategies.width(viewportDimensions, contentOrContents, contentMargin);
            var heightScale = ScaleStrategies.height(viewportDimensions, contentOrContents, contentMargin);

            return Math.min(widthScale, heightScale);
        },

        /**
         * Gets the scale required to fit the height of the viewport.
         * @method
         * @param {{height: number}} viewportDimensions
         *        The dimensions of the viewport.
         * @param {Array.<{height: number}>|{height: number}} contentOrContents
         *        The dimensions of the content or contents to fit.
         * @param {number} contentMargin
         *        The margin around the content.
         * @returns {number}
         */
        height: function(viewportDimensions, contentOrContents, contentMargin) {
            var viewportHeight = viewportDimensions.height;
            var maxPageHeight = 0;
            var items = Array.isArray(contentOrContents) ? contentOrContents : [contentOrContents];
            var numberOfItems = items.length;
            var i;
            var page;

            // Get the maximum page height.
            for (i = 0; i < numberOfItems; i++) {
                page = items[i];
                if (page.height > maxPageHeight) {
                    maxPageHeight = page.height;
                }
            }

            // Return the scale to fit height, accounting for page margins.
            return viewportHeight / maxPageHeight * marginScaleOffset(viewportHeight, contentMargin);
        },

        /**
         * Gets the scale required to fit the width of the viewport.
         * @method
         * @param {{width: number}} viewportDimensions
         *        The dimensions of the viewport.
         * @param {Array.<{width: number}>|{width: number}} contentOrContents
         *        The dimensions of the content or contents to fit.
         * @param {number} contentMargin
         *        The margin around the content.
         * @returns {number}
         */
        width: function(viewportDimensions, contentOrContents, contentMargin) {
            var viewportWidth = viewportDimensions.width;
            var items = Array.isArray(contentOrContents) ? contentOrContents : [contentOrContents];
            var numberOfItems = items.length;
            var maxPageWidth = 0;
            var i;
            var page;

            // Get the maximum page width.
            for (i = 0; i < numberOfItems; i++) {
                page = items[i];
                if (page.width > maxPageWidth) {
                    maxPageWidth = page.width;
                }
            }

            // Return the scale to fit width, accounting for page margins.
            return viewportWidth / maxPageWidth * marginScaleOffset(viewportWidth, contentMargin);
        }
    };

    return ScaleStrategies;
});