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
     * @name ItemSizeCollection
     * @constructor
     *
     * @param {Object} configuration
     * @param {number} configuration.maxWidth
     * @param {number} configuration.maxHeight
     * @param {Array.<{ width: number, height: number }>} configuration.items
     */
    var ItemSizeCollection = function(configuration) {
        if (!configuration.maxWidth) {
            throw 'ItemSizeCollection configuration: maxWidth is required.';
        }
        if (!configuration.maxHeight) {
            throw 'ItemSizeCollection configuration: maxHeight is required.';
        }

        /**
         * The maximum item width.
         * This is a constant value derived from the given configuration.
         *
         * @type {number}
         */
        this.maxWidth = configuration.maxWidth;

        /**
         * The maximum item height.
         * This is a constant value derived from the given configuration.
         *
         * @type {number}
         */
        this.maxHeight = configuration.maxHeight;

        /**
         * The sizes of the items.
         *
         * @type {Array.<{ width: number, height: number }>}
         */
        this.items = configuration.items || [];

        /**
         * The number of items.
         *
         * @type {number}
         */
        this.length = this.items.length;
    };

    ItemSizeCollection.prototype = {

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Constrain item sizes to the maximum width and/or height.
         *
         * @param  {{ width: number, height: number }} items]
         */
        constrain: function(items) {
            for (var i = 0, n = items.length; i < n; i++) {
                var itemSize = items[i];
                var factor = 1;
                if (itemSize.width > itemSize.height && itemSize.width > this.maxWidth) {
                    factor = this.maxWidth / itemSize.width;
                }
                else if (itemSize.height > this.maxHeight) {
                    factor = this.maxHeight / itemSize.height;
                }
                if (factor < 1) {
                    itemSize.width *= factor;
                    itemSize.height *= factor;
                }
            }
        },

        /**
         * Insert new item sizes at the given index.
         *
         * @method ItemSizeCollection#insert
         * @param {number} index
         * @param {Array.<{width: number, height: number}>} items
         */
        insert: function(index, items) {
            var args = [index, 0].concat(items);
            [].splice.apply(this.items, args);
            this.length = this.items.length;
        }
    };

    return ItemSizeCollection;
});
