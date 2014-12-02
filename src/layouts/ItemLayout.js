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

    var Utils = require('wf-js-common/Utils');

    /**
     * Creates a new ItemLayout.
     *
     * @classdesc
     *
     * An ItemLayout describes the layout information for an item in a layout.
     *
     * @name ItemLayout
     * @constructor
     *
     * @param {Object} template
     *        Default values for the item layout.
     */
    var ItemLayout = function(template) {
        template = template || {};

        //---------------------------------------------------------
        // Public properties
        //---------------------------------------------------------

        /**
         * The bottom position of the item.
         *
         * @member ItemLayout#bottom
         * @type {number}
         */
        this.bottom = template.bottom || 0;

        /**
         * The inner height of the item.
         *
         * @member ItemLayout#height
         * @type {number}
         */
        this.height = template.height || 0;

        /**
         * The index of the item.
         *
         * @member ItemLayout#itemIndex
         * @type {number}
         */
        this.itemIndex = Utils.valueOr(template.itemIndex, -1);

        /**
         * The left position of the item.
         *
         * @member ItemLayout#left
         * @type {number}
         */
        this.left = template.left || 0;

        /**
         * The offset left position of the item, relative to the left position.
         *
         * @member ItemLayout#offsetLeft
         * @type {number}
         */
        this.offsetLeft = template.offsetTop || 0;

        /**
         * The offset top position of the item, relative to the top position.
         *
         * @member ItemLayout#offsetTop
         * @type {number}
         */
        this.offsetTop = template.offsetTop || 0;

        /**
         * The outer height of the item.
         *
         * @member ItemLayout#outerHeight
         * @type {number}
         */
        this.outerHeight = template.outerHeight || 0;

        /**
         * The outer width of the item.
         *
         * @member ItemLayout#outerWidth
         * @type {number}
         */
        this.outerWidth = template.outerWidth || 0;

        /**
         * The bottom padding of the item.
         *
         * @member ItemLayout#paddingBottom
         * @type {number}
         */
        this.paddingBottom = template.paddingBottom || 0;

        /**
         * The left padding of the item.
         *
         * @member ItemLayout#paddingLeft
         * @type {number}
         */
        this.paddingLeft = template.paddingLeft || 0;

        /**
         * The right padding of the item.
         *
         * @member ItemLayout#paddingRight
         * @type {number}
         */
        this.paddingRight = template.paddingRight || 0;

        /**
         * The top padding of the item.
         *
         * @member ItemLayout#paddingTop
         * @type {number}
         */
        this.paddingTop = template.paddingTop || 0;

        /**
         * The right position of the item.
         *
         * @member ItemLayout#right
         * @type {number}
         */
        this.right = template.right || 0;

        /**
         * The scales to fit the item to the viewport by width, height,
         * auto, or the default fit.
         *
         * @type {Object}
         */
        this.scales = template.scales || {
            default: 1,
            width: 1,
            height: 1,
            auto: 1
        };

        /**
         * The scale applied to fit this item to the viewport.
         *
         * @member ItemLayout#scaleToFit
         * @type {number}
         */
        this.scaleToFit = template.scaleToFit || 1;

        /**
         * Top top position of the item.
         *
         * @member ItemLayout#top
         * @type {number}
         */
        this.top = template.top || 0;

        /**
         * The inner width of the item.
         *
         * @member ItemLayout#width
         * @type {number}
         */
        this.width = template.width || 0;
    };

    return ItemLayout;
});
