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

    /**
     * Describes the items in a layout.
     *
     * @name ItemMetadata
     * @constructor
     *
     * @param {Object} configuration
     * @param {number} configuration.maxWidth
     * @param {number} configuration.maxHeight
     * @param {Array.<{width: number, height: number}>} configuration.maxHeight
     */
    var ItemMetadata = function(configuration) {
        if (!configuration.maxWidth) {
            throw 'ItemMetadata configuration: maxWidth is required.';
        }
        if (!configuration.maxHeight) {
            throw 'ItemMetadata configuration: maxHeight is required.';
        }
        this.maxWidth = configuration.maxWidth;
        this.maxHeight = configuration.maxHeight;
        this.itemSizes = configuration.itemSizes || [];
        this.count = this.itemSizes.length;
    };

    ItemMetadata.prototype = {

        /**
         * Insert new item sizes at the given index.
         *
         * @param {number} index
         * @param {Array.<{width: number, height: number}>} itemSizes
         */
        insert: function(index, itemSizes) {
            var args = [index, 0].concat(itemSizes);
            [].splice.apply(this.itemSizes, args);
            this.count = this.itemSizes.length;
        }
    }

    return ItemMetadata;
});
