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

    var DestroyUtil = require('wf-js-common/DestroyUtil');
    var ScaleInterceptor = require('wf-js-uicomponents/awesome_map/ScaleInterceptor');

    /**
     * Creates a new ScaleTranslator.
     *
     * @classdesc
     *
     * ScaleTranslator performs scale value translation between an AwesomeMap
     * and content resized from actual dimensions to fit the viewport.
     *
     * For example, if the actual size of content is 1000x1000 and the viewport
     * is 500x500, the content will be initially sized to 500x500 in order to
     * fit the viewport dimensions. However, the AwesomeMap's transformation plane
     * will be scaled to `1` at this point, since the content is not "zoomed".
     * In order to provide a sensible concept of scale to the end user, we need
     * to translate between the scale that is used by the AwesomeMap and the
     * initial size of the content relative to its actual size.
     *
     * @name ScaleInterceptor
     * @constructor
     *
     * @param {ScrollList} scrollList
     *        The ScrollList that owns this translator.
     *
     * @param {AwesomeMap} map
     *        The map needing scale translation.
     *
     * @param {number} itemIndex
     *        The index of the item this translator bases its scaling from.
     */
    var ScaleTranslator = function(scrollList, map, itemIndex) {

        //---------------------------------------------------------
        // Private properties
        //---------------------------------------------------------

        this._baseScale = 1;
        this._itemIndex = itemIndex;
        this._map = map;
        this._scrollList = scrollList;

        this._initialize();
    };

    ScaleTranslator.prototype = {

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Attach this instance to a new map, for a new item index.
         *
         * @method ScaleTranslator#attach
         * @param  {AwesomeMap} map The map needing scale translation.
         * @param  {number} itemIndex The index of the item used to set the base scale.
         */
        attach: function(map, itemIndex) {
            this._map = map;
            this._itemIndex = itemIndex;
            this._initialize();
        },

        /**
         * Dispose this instance.
         *
         * @method  ScaleTranslator#dispose
         */
        dispose: function() {
            DestroyUtil.destroy(this);
        },

        /**
         * Translates the current scale of the map to the scale of the content
         * relative to it's actual size.
         *
         * @method ScaleTranslator#fromMapScale
         * @return {number}
         */
        fromMapScale: function() {
            var mapScale = this._map.getScale();
            if (this._isDisabled()) {
                return mapScale;
            }
            return mapScale * this._baseScale;
        },

        /**
         * Translates the given scale to a transformation scale to use in the map.
         * Pass the optional `force` to translate even if scale translation is
         * disabled for the associated ScrollList.
         *
         * @method ScaleTranslator#toMapScale
         * @param {number} scale
         * @param {boolean} [force=false]
         * @return {number}
         */
        toMapScale: function(scale, force) {
            if (this._isDisabled() && !force) {
                return scale;
            }
            return scale / this._baseScale;
        },

        //---------------------------------------------------------
        // Private methods
        //---------------------------------------------------------

        _initialize: function() {
            var scrollList = this._scrollList;
            var layout = scrollList.getLayout();
            var itemLayout = layout.getItemLayout(this._itemIndex);

            var baseScale = itemLayout ? itemLayout.scaleToFit : this._baseScale;
            this._baseScale = baseScale;

            // If scale is being intercepted, change the limits via the translator
            // so that the limits are not relative to the base scale, but are
            // relative to the actual size of the content.
            var scaleInterceptor = this._map.getInterceptor(ScaleInterceptor);
            if (scaleInterceptor) {
                var limits = scrollList.getOptions().scaleLimits;

                var minimumScale = this.toMapScale(Math.min(baseScale, limits.minimum));
                scaleInterceptor.setMinimumScale(minimumScale);

                var maximumScale = this.toMapScale(Math.max(baseScale, limits.maximum));
                scaleInterceptor.setMaximumScale(maximumScale);
            }
        },

        _isDisabled: function() {
            return this._scrollList.getOptions().disableScaleTranslation;
        }
    };

    return ScaleTranslator;
});
