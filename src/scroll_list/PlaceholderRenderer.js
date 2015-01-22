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

    var AwesomeMapFactory = require('wf-js-uicomponents/scroll_list/AwesomeMapFactory');
    var DestroyUtil = require('wf-js-common/DestroyUtil');
    var Observable = require('wf-js-common/Observable');
    var PositionTranslator = require('wf-js-uicomponents/scroll_list/PositionTranslator');
    var ScrollModes = require('wf-js-uicomponents/scroll_list/ScrollModes');

    /**
     * Creates a new PlaceholderRenderer.
     *
     * @classdesc
     *
     * A PlaceholderRenderer renders and removes placeholders and
     * loads and unloads content into a target {@link AwesomeMap}.
     *
     * @name PlaceholderRenderer
     * @constructor
     */
    var PlaceholderRenderer = function(scrollList) {

        //---------------------------------------------------------
        // Observables
        //---------------------------------------------------------

        /**
         * Observable dispatched when content needs to be loaded.
         * Subscribers are expected to provide content to the container
         * argument when handling this event.
         *
         * @method PlaceholderRenderer#onLoading
         * @param {Function} callback
         *        Invoked with (sender, {
         *            itemIndex: number,
         *            placeholder: Object,
         *            scaleToFit: number,
         *            width: number,
         *            height: number
         *        })
         */
        this.onLoading = Observable.newObservable();

        /**
         * Observable dispatched after a placeholder is rendered.
         *
         * @method PlaceholderRenderer#onRendered
         * @param {Function} callback
         *        Invoked with (sender, {
         *            itemIndex: number,
         *            placeholder: Object
         *        })
         */
        this.onRendered = Observable.newObservable();

        /**
         * Observable dispatched after a placeholder is removed.
         *
         * @method PlaceholderRenderer#onRemoved
         * @param {Function} callback
         *        Invoked with (sender, {
         *            itemIndex: number,
         *            placeholder: Object
         *        })
         */
        this.onRemoved = Observable.newObservable();

        /**
         * Observable dispatched after placeholder content is unloaded.
         *
         * @method PlaceholderRenderer#onUnloaded
         * @param {Function} callback
         *        Invoked with (sender, {
         *            itemIndex: number,
         *            placeholder: Object
         *        })
         */
        this.onUnloaded = Observable.newObservable();

        //---------------------------------------------------------
        // Private properties
        //---------------------------------------------------------

        /**
         * Associative array of currently active placeholders.
         *
         * @type {{
         *     element: HTMLElement,
         *     contentContainer: HTMLElement,
         *     hasContent: boolean,
         *     map: AwesomeMap
         * }}
         */
        this._placeholders = {};

        /**
         * Pooled placeholders ready to be reused when needed.
         *
         * @type {Array}
         */
        this._pool = [];

        /**
         * The ScrollList instance this renderer applies to.
         *
         * @type {ScrollList}
         */
        this._scrollList = scrollList;
    };

    PlaceholderRenderer.prototype = {

        //---------------------------------------------------------
        // Public properties
        //---------------------------------------------------------

        /**
         * Gets placeholder metadata for the item with the given index.
         *
         * @method PlaceholderRenderer#get
         * @param {number} itemIndex
         * @return {{
         *     element: HTMLElement,
         *     contentContainer: HTMLElement,
         *     hasContent: boolean
         * }}
         */
        get: function(itemIndex) {
            return this._placeholders[itemIndex];
        },

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Append and position placeholders in the scroll list.
         *
         * @method PlaceholderRenderer#appendPlaceholderToScrollList
         * @param {ItemLayout} itemLayout
         * @param {Object} placeholder
         * @param {boolean} update
         */
        appendPlaceholderToScrollList: function(itemLayout, placeholder, update) {
            var scrollList = this._scrollList;
            var listMap = scrollList.getListMap();
            var layout = scrollList.getLayout();
            var viewportSize = layout.getViewportSize();
            var viewportHeight = viewportSize.height;

            if (scrollList.getOptions().mode === ScrollModes.FLOW) {
                var element = placeholder.element;
                // Adjust the element's left style to account for the fact that
                // the list map is responsible for positioning content in the viewport.
                var positionTranslator = new PositionTranslator(scrollList);
                var adjustedLeft = positionTranslator.getLeftInTransformationPlane(itemLayout.left);
                element.style.left = adjustedLeft + 'px';
                if (!update) {
                    listMap.appendContent(element);
                }
            }
            // Only need to handle peek/single modes if not updating an item
            // that is currently rendered. As items in these modes are hosted inside
            // of item maps that fill the viewport, and more or less are rendered
            // independently of each other, there's no need to modify the placeholder.
            else if (!update) {
                // As we are appending content in other modes to a separate map,
                // need to negate the default positional styles and let the map
                // apply position by transforming its content.
                var transformY = itemLayout.offsetTop;
                var transformX = itemLayout.offsetLeft;
                // If this item is before the current item and taller than the viewport,
                // then pan it to the bottom.
                var itemWidth = itemLayout.outerWidth;
                var itemHeight = itemLayout.outerHeight;
                if (layout.getCurrentItemIndex() > itemLayout.itemIndex && itemHeight > viewportHeight) {
                    transformY = viewportHeight - itemHeight;
                }
                var itemMap = placeholder.map;
                if (!itemMap) {
                    placeholder.element.removeChild(placeholder.contentContainer);
                    listMap.appendContent(placeholder.element);
                    itemMap = AwesomeMapFactory.createItemMap(scrollList, placeholder.element);
                    placeholder.map = itemMap;
                }
                else {
                    listMap.appendContent(placeholder.element);
                }
                // Set the static content dimensions and transform to center.
                itemMap.setContentDimensions({ width: itemWidth, height: itemHeight });
                itemMap.transform({ x: transformX, y: transformY, scale: 1 });
                // Remove positional styles from the content container and append to map.
                var contentContainer = placeholder.contentContainer;
                contentContainer.style.top = '0px';
                contentContainer.style.left = '0px';
                itemMap.appendContent(contentContainer);
            }
        },

        /**
         * Disposes the instance.
         *
         * @method PlaceholderRenderer#dispose
         */
        dispose: function() {
            var self = this;
            var placeholders = this._placeholders;
            Object.keys(placeholders).forEach(function(itemIndex) {
                var placeholder = placeholders[itemIndex];
                if (placeholder.map) {
                    placeholder.map.dispose();
                    placeholder.map = null;
                }
                self.remove(+itemIndex);
            });

            this.onLoading.dispose();
            this.onRendered.dispose();
            this.onRemoved.dispose();
            this.onUnloaded.dispose();

            DestroyUtil.destroy(this);
        },

        /**
         * Loads content into the placeholder for the item
         * represented by the given layout.
         *
         * @method PlaceholderRenderer#load
         * @param {ItemLayout} itemLayout
         * @return {boolean} Whether item content was loaded.
         */
        load: function(itemLayout) {
            var itemIndex = itemLayout.itemIndex;
            var placeholder = this._placeholders[itemIndex];

            if (!placeholder || placeholder.hasContent) {
                return false;
            }

            this.onLoading.dispatch([this, {
                itemIndex: itemIndex,
                placeholder: placeholder,
                scaleToFit: itemLayout.scaleToFit,
                width: itemLayout.width,
                height: itemLayout.height
            }]);

            // Mark the placeholder as having content so we don't load twice.
            placeholder.hasContent = true;

            return true;
        },

        /**
         * Re-initializes the placeholder item maps after a viewport resize.
         *
         * @method PlaceholderRenderer#refresh
         */
        refresh: function() {
            var allPlaceholders = this._pool.slice();
            var activePlaceholders = this._placeholders;

            // Add active placeholders to the placeholders in the pool.
            Object.keys(activePlaceholders).forEach(function(itemIndex) {
                allPlaceholders.push(activePlaceholders[itemIndex]);
            });

            // Reinitialize each item map.
            allPlaceholders.forEach(function(placeholder) {
                if (placeholder.map) {
                    placeholder.map.clearContent();
                    placeholder.map.invalidateViewportDimensions();
                }
            });
        },

        /**
         * Removes the placeholder for the given item index.
         *
         * @method PlaceholderRenderer#remove
         * @param {number} itemIndex
         * @return {boolean} Whether an item was removed.
         */
        remove: function(itemIndex) {
            var placeholder = this._placeholders[itemIndex];
            if (!placeholder) {
                return false;
            }

            this.unload(itemIndex);

            this._scrollList.getListMap().removeContent(placeholder.element);
            if (placeholder.map) {
                placeholder.map.clearContent();
            }

            this.onRemoved.dispatch([this, {
                itemIndex: itemIndex,
                placeholder: placeholder
            }]);

            delete this._placeholders[itemIndex];
            this._pool.push(placeholder);

            return true;
        },

        /**
         * Renders a placeholder for the item represented by the given layout.
         *
         * @method PlaceholderRenderer#render
         * @param {ItemLayout} itemLayout
         * @return {boolean} Whether an item was rendered.
         */
        render: function(itemLayout) {
            var itemIndex = itemLayout.itemIndex;
            if (this._placeholders[itemIndex]) {
                return false;
            }

            var contentContainer;
            var element;

            // Use a placeholder from the pool, if available.
            var placeholder = this._pool.pop();
            if (placeholder) {
                element = placeholder.element;
                contentContainer = placeholder.contentContainer;
            }
            // Otherwise, new one up.
            else {
                contentContainer = document.createElement('div');
                contentContainer.style.position = 'absolute';
                contentContainer.style.overflow = 'hidden';
                contentContainer.style.boxSizing = 'content-box';

                element = document.createElement('div');
                element.appendChild(contentContainer);
                element.style.position = 'absolute';
                element.style.overflow = 'hidden';

                placeholder = {
                    element: element,
                    contentContainer: contentContainer,
                    hasContent: false
                };
            }

            contentContainer.className = 'scrollList-contentContainer';
            contentContainer.style.top = itemLayout.offsetTop + 'px';
            contentContainer.style.left = itemLayout.offsetLeft + 'px';
            contentContainer.style.width = itemLayout.width + 'px';
            contentContainer.style.height = itemLayout.height + 'px';
            contentContainer.style.marginTop = itemLayout.paddingTop + 'px';
            contentContainer.style.marginBottom = itemLayout.paddingBottom + 'px';
            contentContainer.style.marginRight = itemLayout.paddingRight + 'px';
            contentContainer.style.marginLeft = itemLayout.paddingLeft + 'px';

            element.className = 'scrollList-placeholder';
            element.style.top = itemLayout.top + 'px';
            element.style.left = itemLayout.left + 'px';
            element.style.width = itemLayout.right - itemLayout.left + 'px';
            element.style.height = itemLayout.bottom - itemLayout.top + 'px';

            this._placeholders[itemIndex] = placeholder;

            this.appendPlaceholderToScrollList(itemLayout, placeholder);

            this.onRendered.dispatch([this, {
                itemIndex: itemIndex,
                placeholder: placeholder
            }]);

            return true;
        },

        /**
         * Unloads content from the placeholder for the item with the given index.
         *
         * @method PlaceholderRenderer#unload
         * @param {number} itemIndex
         * @return {boolean} Whether item content was unloaded.
         */
        unload: function(itemIndex) {
            var placeholder = this._placeholders[itemIndex];

            if (!placeholder || !placeholder.hasContent) {
                return false;
            }

            this._clearChildren(placeholder.contentContainer);

            this.onUnloaded.dispatch([this, {
                itemIndex: itemIndex,
                placeholder: placeholder
            }]);

            // Mark the placeholder as having no content.
            placeholder.hasContent = false;

            return true;
        },

        /**
         * Update the position of currently rendered items to account for changes
         * to items in a layout.
         *
         * @param {number} startIndex
         * @param {number} newIndexOffset
         */
        update: function(startIndex, newIndexOffset) {
            var layout = this._scrollList.getLayout();
            var placeholders = this._placeholders;
            var newRenderedItems = {};
            for (var itemIndex in placeholders) {
                if (placeholders.hasOwnProperty(itemIndex)) {
                    var placeholder = placeholders[itemIndex];
                    if (+itemIndex < startIndex) {
                        newRenderedItems[+itemIndex] = placeholder;
                    }
                    else {
                        var newItemIndex = +itemIndex + newIndexOffset;
                        newRenderedItems[newItemIndex] = placeholder;
                        var newItemLayout = layout.getItemLayout(newItemIndex);
                        placeholder.element.style.top = newItemLayout.top + 'px';
                        placeholder.element.style.left = newItemLayout.left + 'px';
                        this.appendPlaceholderToScrollList(newItemLayout, placeholder, true);
                    }
                }
            }
            this._placeholders = newRenderedItems;
        },

        //---------------------------------------------------------
        // Private methods
        //---------------------------------------------------------

        /**
         * Clear child elements from the given placeholder element when
         * the placeholder content is unloaded from the DOM.
         */
        _clearChildren: function(element) {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        }
    };

    return PlaceholderRenderer;
});
