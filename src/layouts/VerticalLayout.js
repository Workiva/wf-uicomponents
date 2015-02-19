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

    var _ = require('lodash');
    var DestroyUtil = require('wf-js-common/DestroyUtil');
    var DOMUtil = require('wf-js-common/DOMUtil');
    var HorizontalAlignments = require('wf-js-uicomponents/layouts/HorizontalAlignments');
    var FitModes = require('wf-js-uicomponents/layouts/FitModes');
    var ItemLayout = require('wf-js-uicomponents/layouts/ItemLayout');
    var Observable = require('wf-js-common/Observable');
    var Orientations = require('wf-js-uicomponents/layouts/Orientations');
    var ScaleStrategies = require('wf-js-uicomponents/layouts/ScaleStrategies');
    var VerticalAlignments = require('wf-js-uicomponents/layouts/VerticalAlignments');

    function getDistanceToViewportCenter(itemLayout, visibleCenter) {
        var distance = 0;
        if (itemLayout.bottom < visibleCenter) {
            distance = visibleCenter - itemLayout.bottom;
        }
        else if (itemLayout.top > visibleCenter) {
            distance = itemLayout.top - visibleCenter;
        }
        return distance;
    }

    /**
     * Creates a new VerticalLayout.
     *
     * @classdesc
     *
     * A VerticalLayout positions and renders a list of items in a vertical orientation.
     *
     * @name VerticalLayout
     * @constructor
     *
     * @param {HTMLElement} viewport
     *        The viewport that acts as a container for the layout.
     *
     * @param {ItemSizeCollection} itemSizeCollection
     *        Metadata describing the number and size of the items in this layout.
     *
     * @param {PlaceholderRenderer} renderer
     *        The renderer used to render placeholders and load content for the layout.
     *
     * @param {Object} [options]
     *        Configuration options for this layout.
     *
     * @param {number} [options.directionalRenderingWeight=0.8]
     *        Number from 0 to 1 that affects the balance of additional items
     *        added in the current scroll direction. For example, 0.5 will spread
     *        additional items required to meet options.minNumberOfVirtualItems
     *        evenly in both directions; 1.0 will add all additional items to the
     *        current direction of travel.
     *
     * @param {number} [options.eagerRenderingFactor=1]
     *        The number of viewport heights in either direction to render
     *        in addition to the visible range of the layout.
     *
     * @param {string} [options.fit='width']
     *        The fit mode for the content. One of: 'width', 'height' or 'auto'.
     *
     * @param {number} [options.fitUpscaleLimit=1]
     *        When fitting items to the viewport, allow scaling up to this limit.
     *
     * @param {boolean} [options.flow=true]
     *        Whether to flow the items in a continuous fashion.
     *        When items are not flowed, they are laid out so that one item is
     *        visible at a time.
     *
     * @param {number} [options.gap=0]
     *        The gap between items, in pixels.
     *
     * @param {string} [options.horizontalAlign='center']
     *        The alignment of the items along the x-axis. Can be 'center' or 'left'.
     *
     * @param {number} [options.initialItemScale]
     *        Scale the default size of items by the given value. This setting
     *        is only relevant when options.fit='none', as other modes will
     *        size the content to fit the viewport.
     *
     * @param {number} [options.minNumberOfVirtualItems=3]
     *        The minimum number of virtual items that the layout will render.
     *
     * @param {number|{left: number, right: number, top: number, bottom: number}} [options.padding=0]
     *        The padding between the rendered layout and the viewport, in pixels.
     *
     * @param {string} [options.verticalAlign='auto']
     *        The alignment of the items along the y-axis. Can be 'auto' or 'top'.
     */
    var VerticalLayout = function(viewport, itemSizeCollection, renderer, options) {

        //---------------------------------------------------------
        // Observables
        //---------------------------------------------------------

        /**
         * Observable dispatched when the current item index changes after
         * rendering the layout.
         *
         * @method VerticalLayout#onCurrentItemIndexChanged
         * @param {Function} callback
         *        Invoked with (sender, {
         *            index: number
         *        })
         */
        this.onCurrentItemIndexChanged = Observable.newObservable();

        //---------------------------------------------------------
        // Private properties
        //---------------------------------------------------------

        /**
         * Cache containing the results of expensive operations.
         *
         * @type {Object}
         */
        this._cache = {
            currentItemIndex: null,
            itemLayouts: [],
            itemRangeToRender: null,
            lastItemIndex: null,
            lastRenderedItemRange: null,
            lastRenderedPosition: null,
            positionToRender: null,
            size: null,
            viewportSize: null,
            visiblePosition: null
        };

        /**
         * The item metadata used to construct this layout.
         *
         * @type {ItemMetadata}
         */
        this._itemSizeCollection = itemSizeCollection;

        /**
         * The layout options.
         *
         * @type {Object}
         */
        this._options = _.extend({
            initialItemScale: 1,
            directionalRenderingWeight: 0.8,
            eagerRenderingFactor: 1,
            fit: 'width',
            fitUpscaleLimit: 1,
            flow: true,
            gap: 0,
            horizontalAlign: HorizontalAlignments.CENTER,
            minNumberOfVirtualItems: 3,
            padding: 0,
            verticalAlign: VerticalAlignments.AUTO
        }, options);

        /**
         * The renderer responsible for creating elements.
         *
         * @type {PlaceholderRenderer}
         */
        this._renderer = renderer;

        /**
         * The current scale of the layout, relative to the item metadata sizes.
         *
         * @type {number}
         */
        this._scale = 1;

        /**
         * The direction of the last scroll, updated when the scroll position changes:
         * No change is 0, scroll down is 1, scroll up is -1.
         *
         * @type {number}
         */
        this._scrollDirection = 1;

        /**
         * The current scroll position of the list.
         *
         * @type {{ top: number, left: number }}
         */
        this._scrollPosition = { top: 0, left: 0 };

        /**
         * The viewport for the layout.
         *
         * @type {HTMLElement}
         */
        this._viewport = viewport;

        //---------------------------------------------------------
        // Initialization
        //---------------------------------------------------------

        this._initialize();
    };

    VerticalLayout.prototype = {

        //---------------------------------------------------------
        // Public properties
        //---------------------------------------------------------

        /**
         * Gets the layout of the current item in view
         *
         * @return {ItemLayout}
         */
        getCurrentItemLayout: function() {
            var itemIndex = this.getCurrentItemIndex();
            return this.getItemLayout(itemIndex);
        },

        /**
         * Gets the layout information for the item with the given index.
         *
         * @method VerticalLayout#getItemLayout
         * @param {number} index
         * @return {ItemLayout}
         */
        getItemLayout: function(index) {
            return this._cache.itemLayouts[index];
        },

        /**
         * Gets the item layouts.
         *
         * @method VerticalLayout#getItemLayouts
         * @return {Array.<ItemLayout>}
         */
        getItemLayouts: function() {
            return this._cache.itemLayouts;
        },

        /**
         * Gets the item metadata for the layout.
         *
         * @method VerticalLayout#getItemSizeCollection
         * @return {ItemMetadata}
         */
        getItemSizeCollection: function() {
            return this._itemSizeCollection;
        },

        /**
         * Gets the options for the layout.
         *
         * @method VerticalLayout#getOptions
         * @return {Object}
         */
        getOptions: function() {
            return _.extend({}, this._options);
        },

        /**
         * Gets the last rendered item range.
         *
         * @method VerticalLayout#getRenderedItemRange
         * @return {{ startIndex: number, endIndex: number }}
         */
        getRenderedItemRange: function() {
            return this._cache.lastRenderedItemRange;
        },

        /**
         * Gets the layout dimensions.
         *
         * @method VerticalLayout#getSize
         * @return {{ width: number, height: number}}
         */
        getSize: function() {
            return this._cache.size;
        },

        /**
         * Gets the size of the viewport.
         *
         * @method VerticalLayout#getViewportSize
         * @return {{ width: number, height: number }}
         */
        getViewportSize: function() {
            return this._cache.viewportSize;
        },

        /**
         * Sets the current scale of the layout.
         *
         * @method VerticalLayout#setScale
         * @param {number} scale
         */
        setScale: function(scale) {
            if (scale !== this._scale) {
                this._invalidatePosition();
            }

            this._scale = scale;
        },

        /**
         * Sets the current scroll position of the layout.
         *
         * @method VerticalLayout#setScrollPosition
         * @param {{ top: number, left: number }} scrollPosition
         */
        setScrollPosition: function(scrollPosition) {
            var newTop = scrollPosition.top;
            var oldTop = this._scrollPosition.top;

            if (newTop !== oldTop) {
                this._scrollDirection = newTop > oldTop ? 1 : -1;
                this._invalidatePosition();
            }

            var newLeft = scrollPosition.left;
            var oldLeft = this._scrollPosition.left;

            if (newLeft !== oldLeft) {
                this._invalidatePosition();
            }

            this._scrollPosition = scrollPosition;
        },

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Clears all the items rendered by the layout.
         *
         * @method VerticalLayout#clear
         */
        clear: function() {
            var itemRange = this._cache.lastRenderedItemRange;
            var i;

            for (i = itemRange.startIndex; i <= itemRange.endIndex; i++) {
                this._renderer.remove(i);
            }

            // There is not a current item after clearing; need to render to reset.
            this._cache.lastItemIndex = null;
        },

        /**
         * Disposes the instance.
         *
         * @method  VerticalLayout#dispose
         */
        dispose: function() {
            this.onCurrentItemIndexChanged.dispose();

            DestroyUtil.destroy(this);
        },

        /**
         * Ensure that the item range contains at least the number of concurrent
         * items to load. Add these items along the current scroll direction.
         *
         * @param {{ startIndex: number, endIndex: number }} range
         * @method VerticalLayout#ensureMinNumberOfVirtualItems
         */
        ensureMinNumberOfVirtualItems: function(range) {
            var numberOfItemsToRender = range.endIndex - range.startIndex + 1;
            var minNumberOfVirtualItems = this._options.minNumberOfVirtualItems;

            if (numberOfItemsToRender >= minNumberOfVirtualItems) {
                return;
            }

            var numberOfItems = this._itemSizeCollection.getLength();
            var itemsToAdd = minNumberOfVirtualItems - numberOfItemsToRender;

            // First need to determine how to weigh the distribution of extra items.
            var scrollDirection = this._scrollDirection;
            var weight = this._options.directionalRenderingWeight;
            var startIndexWeight = scrollDirection > 0 ? 1 - weight : weight;
            var endIndexWeight = scrollDirection > 0 ? weight: 1 - weight;
            var startIndex = range.startIndex - Math.ceil(itemsToAdd * startIndexWeight);
            var endIndex = range.endIndex + Math.ceil(itemsToAdd * endIndexWeight);

            // Guard against boundary overflow.
            if (startIndex < 0) {
                startIndex = 0;
                endIndex = minNumberOfVirtualItems - 1;
            }
            else if (endIndex > numberOfItems - 1) {
                endIndex = numberOfItems - 1;
                startIndex = endIndex - minNumberOfVirtualItems + 1;
            }

            range.startIndex = startIndex;
            range.endIndex = endIndex;
        },

        /**
         * Gets the current item index, which is
         * the index of the item in the center of the viewport.
         *
         * @method VerticalLayout#getCurrentItemIndex
         * @return {number}
         */
        getCurrentItemIndex: function() {
            if (this._cache.currentItemIndex !== null) {
                return this._cache.currentItemIndex;
            }

            // Need to know the visible center position.
            var visibleCenter = this.getVisiblePosition().center;

            // Need to iterate over the item range to render and find the
            // item whose layout intersects the visible center.
            var itemRange = this.getItemRangeToRender();
            var startIndex = itemRange.startIndex;
            var endIndex = itemRange.endIndex;
            var itemLayout;
            var i;
            var result = -1;
            var distanceToVisibleCenter;
            var minimumDistance = Number.MAX_VALUE;

            for (i = startIndex; i <= endIndex; i++) {
                itemLayout = this.getItemLayout(i);

                // If the layout intersects the visible center, we have our item.
                if (itemLayout.top <= visibleCenter && itemLayout.bottom >= visibleCenter) {
                    result = i;
                    break;
                }
                // Track the item nearest the viewport center, in case none intersect.
                else {
                    distanceToVisibleCenter = getDistanceToViewportCenter(itemLayout, visibleCenter);
                    if (distanceToVisibleCenter < minimumDistance) {
                        minimumDistance = distanceToVisibleCenter;
                        result = i;
                    }
                }
            }

            // Cache and return the current item index.
            this._cache.currentItemIndex = result;
            return result;
        },

        /**
         * Gets the start and end index of the items to render, based on current
         * scroll position. If given a target scroll position, the range will
         * cover the distance between the current and target positions. This
         * range will contain at least the configured number of concurrent items.
         *
         * @method VerticalLayout#getItemRangeToRender
         * @param {{ top: number, left: number }} [targetScrollPosition]
         * @return {{ startIndex: number, endIndex: number }}
         */
        getItemRangeToRender: function(targetScrollPosition) {
            if (!targetScrollPosition && this._cache.itemRangeToRender) {
                return this._cache.itemRangeToRender;
            }

            var result = {
                startIndex: 0,
                endIndex: 0
            };

            var numberOfItems = this._itemSizeCollection.getLength();
            if (numberOfItems <= this._options.minNumberOfVirtualItems) {
                result.endIndex = numberOfItems - 1;
            }
            else {
                // Find the item range based on position to render.
                var position = this.getPositionToRender(targetScrollPosition);
                var i = 0;
                while (i < numberOfItems && this.getItemLayout(i).bottom <= position.top) {
                    i++;
                }
                result.startIndex = i;
                while (i < numberOfItems && this.getItemLayout(i).top < position.bottom) {
                    i++;
                }
                result.endIndex = i - 1;

                // Ensure we render the minimum number of virtual items.
                this.ensureMinNumberOfVirtualItems(result);
            }

            // Cache and return the item index range.
            this._cache.itemRangeToRender = result;
            return result;
        },

        /**
         * Gets the indexes of the last item range rendered,
         * ordered by distance from the visible center position.
         *
         * @method VerticalLayout#getOrderedRenderedItemIndexes
         * @return {Array.<number>}
         */
        getOrderedRenderedItemIndexes: function() {
            // Need to know some things about the current state of the layout.
            var visibleCenter = this.getVisiblePosition().center;
            var renderedRange = this._cache.lastRenderedItemRange;

            // Going to load items in order from the visible center out.
            var itemDistancesFromCenter = [];
            var itemLayout;
            var distance;
            var i;

            if (!renderedRange) {
                throw new Error('VerticalLayout: the layout has not been rendered.');
            }

            // Calculate distances from the visible center.
            for (i = renderedRange.startIndex; i <= renderedRange.endIndex; i++) {
                itemLayout = this.getItemLayout(i);
                distance = getDistanceToViewportCenter(itemLayout, visibleCenter);
                itemDistancesFromCenter.push({ index: i, distance: distance });
            }

            // Sort by the distance from center.
            itemDistancesFromCenter.sort(function(a, b) {
                if (a.distance < b.distance) {
                    return -1;
                }
                if (a.distance > b.distance) {
                    return 1;
                }
                return 0;
            });

            // Return the item indexes.
            return itemDistancesFromCenter.map(function(item) { return item.index; });
        },

        /**
         * Gets the top and bottom position of the range to render, based on
         * current scroll position and scale. If given a target scroll position,
         * the range will span between the distance the current and target positions.
         *
         * @method VerticalLayout#getPositionToRender
         * @param {{ top: number, left: number }} [targetScrollPosition]
         * @return {{ top: number, bottom: number }}
         */
        getPositionToRender: function(targetScrollPosition) {
            if (!targetScrollPosition && this._cache.positionToRender) {
                return this._cache.positionToRender;
            }

            var result;

            // Work with the current and target top positions.
            var currentScrollPosition = this._scrollPosition;
            var currentScrollTop = currentScrollPosition.top;
            var targetScrollTop = targetScrollPosition ? targetScrollPosition.top : null;

            // Going to constrain the position.
            var layoutHeight = this.getSize().height;

            // Setup the initial top and bottom positions for the layout area.
            var visibleHeight = this.getViewportSize().height / this._scale;
            var top = this._unscale(currentScrollTop);
            var bottom = this._unscale(currentScrollTop) + visibleHeight;

            // Must offset the layout range to prevent possible gaps in item flow.
            var offsetHeight = visibleHeight * this._options.eagerRenderingFactor;
            var offsetTop = offsetHeight;
            var offsetBottom = offsetHeight;

            // If given a target scroll position, then modify the metrics to
            // account for the range between the current and target positions.
            // Also discard the items that beings scrolled away from.
            if (targetScrollTop !== null) {

                // The content is being shifted up.
                if (targetScrollTop > currentScrollTop) {
                    offsetTop = 0;
                    offsetBottom += this._unscale(targetScrollTop - currentScrollTop);
                }
                // The content is being shifted down.
                else if (targetScrollTop < currentScrollTop) {
                    offsetTop += this._unscale(currentScrollTop - targetScrollTop);
                    offsetBottom = 0;
                }
            }

            top -= offsetTop;
            bottom += offsetBottom;

            // Constrain the positions to layout dimensions.
            result = {
                top: Math.max(0, top),
                bottom: Math.min(layoutHeight, bottom)
            };

            // Cache and return the position.
            this._cache.positionToRender = result;
            return result;
        },

        /**
         * Gets the start and end index of the currently visible items.
         *
         * @method VerticalLayout#getVisibleItemRange
         * @return {{ startIndex: number, endIndex: number }}
         */
        getVisibleItemRange: function() {
            var visiblePosition = this.getVisiblePosition();
            var itemRange = this.getItemRangeToRender();
            var itemLayout;
            var i;

            var startIndex = -1;
            var endIndex = Number.NEGATIVE_INFINITY;
            var result;

            for (i = itemRange.startIndex; i <= itemRange.endIndex; i++) {
                itemLayout = this.getItemLayout(i);

                if (itemLayout.bottom <= visiblePosition.top) {
                    continue;
                }
                if (itemLayout.top >= visiblePosition.bottom) {
                    break;
                }

                if (startIndex === -1) {
                    startIndex = i;
                }
                endIndex = i;
            }

            // Cache and return the result.
            result = {
                startIndex: startIndex,
                endIndex: endIndex
            };
            this._cache.visibleItemRange = result;
            return result;
        },

        /**
         * Gets the top, bottom and center of the visible range of the list, as
         * well as the left and right, based on the current scroll position. We
         * provide left and right to allow horizontal scrolling.
         *
         * @method VerticalLayout#getVisiblePosition
         * @return {{ top: number, bottom: number, center: number, left: number, right: number }}
         */
        getVisiblePosition: function() {
            if (this._cache.visiblePosition) {
                return this._cache.visiblePosition;
            }

            var result;
            var scrollTop = this._scrollPosition.top;
            var scrollLeft = this._scrollPosition.left;
            var viewportHeight = this.getViewportSize().height;
            var viewportWidth = this.getViewportSize().width;

            // Cache and return the visible position.
            result = {
                top: this._unscale(scrollTop),
                bottom: this._unscale(scrollTop + viewportHeight),
                center: this._unscale(scrollTop + viewportHeight / 2),
                left: this._unscale(scrollLeft),
                right: this._unscale(scrollLeft + viewportWidth)
            };
            this._cache.visiblePosition = result;
            return result;
        },

        /**
         * Insert new items into the layout at the given index.
         *
         * @param {number} index
         * @param {Array.<{ width: number, height: number }>} itemSizes
         */
        insertItems: function(index, itemSizes) {
            this._itemSizeCollection.constrain(itemSizes);
            this._itemSizeCollection.insert(index, itemSizes);
            this.measure();
        },

        /**
         * Loads content into rendered placeholders.
         *
         * @method VerticalLayout#loadContent
         */
        loadContent: function() {
            var renderer = this._renderer;
            var minNumberOfVirtualItems = this._options.minNumberOfVirtualItems;

            var itemIndexes = this.getOrderedRenderedItemIndexes();
            var numberOfItems = itemIndexes.length;
            var itemIndex;
            var i;

            // Unload stale content.
            for (i = numberOfItems - 1; i >= minNumberOfVirtualItems; i--) {
                renderer.unload(itemIndexes[i]);
            }

            // Load fresh content.
            for (i = 0; i < numberOfItems; i++) {
                if (i === minNumberOfVirtualItems) {
                    break;
                }
                itemIndex = itemIndexes[i];
                renderer.load(this.getItemLayout(itemIndex));
            }
        },

        /**
         * Measure the size of the layout and viewport.
         *
         * @method VerticalLayout#measure
         */
        measure: function() {
            this._measureViewport();
            this._measureLayout();
            this._invalidatePosition();
        },

        /**
         * Renders layout placeholders based upon its current position.
         * If given a target scroll position, render placeholders to fill
         * the range between the current and target scroll positions.
         *
         * @method VerticalLayout#render
         * @param {{ top: number, left: number }} [options.targetScrollPosition]
         * @param {boolean} [options.preserveStaleItems=false]
         */
        render: function(options) {
            options = options || {};
            var targetScrollPosition = options.targetScrollPosition;
            var preserveStaleItems = !!options.preserveStaleItems;

            var renderer = this._renderer;

            var range = this.getItemRangeToRender(targetScrollPosition);
            var lastRange = this._cache.lastRenderedItemRange;

            var numberOfItems = this.getItemSizeCollection().getLength();
            var i;

            // We check if the current item has changed and dispatch if true.
            var testCurrentItemIndex = !targetScrollPosition;
            var currentItemIndex = this.getCurrentItemIndex();

            // Remove stale placeholders.
            if (lastRange && !preserveStaleItems) {

                // Remove placeholders that precede the new range.
                i = Math.min(range.startIndex - 1, lastRange.endIndex);
                while (i > -1 && renderer.remove(i--)) {}

                // Remove placeholders that follow the new range.
                i = Math.max(range.endIndex + 1, lastRange.startIndex);
                while (i < numberOfItems && renderer.remove(i++)) {}
            }

            // Append placeholders for the new range.
            for (i = range.startIndex; i <= range.endIndex; i++) {
                renderer.render(this.getItemLayout(i));
            }

            // If the current item index has changed, dispatch.
            if (testCurrentItemIndex && currentItemIndex !== this._cache.lastItemIndex) {
                this.onCurrentItemIndexChanged.dispatch([this, { index: currentItemIndex }]);
            }

            // Store the new render state for next time.
            this._cache.lastRenderedPosition = this.getPositionToRender(targetScrollPosition);
            this._cache.lastRenderedItemRange = range;
            this._cache.lastItemIndex = currentItemIndex;
        },

        //---------------------------------------------------------
        // Private methods
        //---------------------------------------------------------

        /**
         * Initialize the layout.
         */
        _initialize: function() {
            this._validateConfiguration();
            this.measure();
        },

        /**
         * Invalidate the cached positional state of the layout so that
         * expensive calculations are evaluated the next time they are executed.
         */
        _invalidatePosition: function() {
            this._cache.currentItemIndex = null;
            this._cache.itemRangeToRender = null;
            this._cache.positionToRender = null;
            this._cache.visibleItemRange = null;
            this._cache.visiblePosition = null;
        },

        /**
         * Measure the items in the layout and the total layout size.
         */
        _measureLayout: function() {
            var viewportSize = this.getViewportSize();
            var viewportWidth = viewportSize.width;
            var viewportHeight = viewportSize.height;
            var viewportOrientation = (
                viewportWidth > viewportHeight ?
                Orientations.LANDSCAPE : Orientations.PORTRAIT
            );

            // Using some layout options below.
            var options = this.getOptions();
            var flow = options.flow;
            var horizontalAlign = options.horizontalAlign;
            var verticalAlign = options.verticalAlign;
            var gapTop = Math.floor(options.gap / 2);
            var gapBottom = Math.ceil(options.gap / 2);
            var padding = options.padding;

            // Padding may be specified as a single number to be applied to
            // all sides, or each side can be set independently.
            var paddingTop, paddingBottom, paddingLeft, paddingRight;
            if (typeof padding === 'object') {
                paddingTop = padding.top;
                paddingBottom = padding.bottom;
                paddingLeft = padding.left;
                paddingRight = padding.right;
            } else {
                paddingTop = paddingBottom = paddingLeft = paddingRight = padding;
            }

            // Loop through the items.
            var itemSizeCollection = this._itemSizeCollection;
            var numberOfItems = itemSizeCollection.getLength();
            var i;

            // Build layouts.
            var layouts = new Array(numberOfItems);
            var layout;
            var size;
            var cachedScales = null;
            var scales = null;
            var scaleToFit;
            var maxWidth = 0;
            var totalHeight = 0;

            function getScales(item) {
                function fit(sample) {
                    var fitMode = sample.fit || options.fit;
                    // Fit mode of ORIENTATION does not apply when scroll mode is flow.
                    // When it does apply, it simply auto fits content when the
                    // orientation of the viewport and content matches, otherwise
                    // it will default to fit to width.
                    if (fitMode === FitModes.ORIENTATION) {
                        if (flow) {
                            fitMode = FitModes.WIDTH;
                        }
                        else {
                            var sampleOrientation = (
                                sample.width > sample.height ?
                                Orientations.LANDSCAPE : Orientations.PORTRAIT
                            );
                            if (viewportOrientation === sampleOrientation) {
                                fitMode = FitModes.AUTO;
                            }
                            else {
                                fitMode = FitModes.WIDTH;
                            }
                        }
                    }
                    var scalesToFit = {
                        width: ScaleStrategies.width(viewportSize, sample, padding),
                        height: ScaleStrategies.height(viewportSize, sample, padding),
                        auto: ScaleStrategies.auto(viewportSize, sample, padding),
                        none: ScaleStrategies.none() * options.initialItemScale
                    };
                    scalesToFit.default = Math.min(scalesToFit[fitMode], options.fitUpscaleLimit);
                    return scalesToFit;
                }
                // If flowing, scale all the items at once.
                if (flow) {
                    return cachedScales || (cachedScales = fit({
                        width: itemSizeCollection.maxWidth,
                        height: itemSizeCollection.maxHeight
                    }));
                }
                return fit(item);
            }

            function getHorizontalPosition(outerWidth) {
                if (horizontalAlign === HorizontalAlignments.LEFT) {
                    return 0;
                }
                else {
                    // Pull to the left if less than a pixel.
                    return Math.floor((viewportWidth - outerWidth) / 2);
                }
            }

            function getVerticalPosition(outerHeight) {
                if (verticalAlign === VerticalAlignments.TOP ||
                    (verticalAlign === VerticalAlignments.AUTO &&
                        outerHeight > viewportHeight)
                ) {
                    return 0;
                }
                else {
                    // Pull to the left if less than a pixel.
                    return Math.floor((viewportHeight - outerHeight) / 2);
                }
            }

            for (i = 0; i < numberOfItems; i++) {
                size = itemSizeCollection.getItem(i);
                scales = getScales(size);
                scaleToFit = scales.default;

                layout = new ItemLayout({
                    itemIndex: i,
                    top: totalHeight,
                    scales: scales,
                    scaleToFit: scaleToFit,
                    width: Math.round(size.width * scaleToFit),
                    height: Math.round(size.height * scaleToFit),
                    paddingLeft: paddingLeft,
                    paddingRight: paddingRight
                });

                if (flow) {
                    layout.paddingTop = (i === 0) ? paddingTop : gapTop;
                    layout.paddingBottom = (i === numberOfItems - 1) ? paddingBottom : gapBottom;
                }
                else { // !flow
                    layout.paddingTop = paddingTop;
                    layout.paddingBottom = paddingBottom;
                }

                layout.outerWidth = layout.width + layout.paddingLeft + layout.paddingRight;
                layout.outerHeight = layout.height + layout.paddingTop + layout.paddingBottom;

                if (flow) {
                    layout.bottom = layout.top + layout.outerHeight;
                    layout.offsetTop = 0;

                    layout.left = getHorizontalPosition(layout.outerWidth);
                    layout.right = layout.left + layout.outerWidth;
                    layout.offsetLeft = 0;
                }
                else { // !flow
                    layout.bottom = layout.top + viewportHeight;
                    layout.offsetTop = getVerticalPosition(layout.outerHeight);

                    layout.left = 0;
                    layout.right = viewportWidth;
                    layout.offsetLeft = getHorizontalPosition(layout.outerWidth);
                }

                layouts[i] = layout;

                if (layout.right - layout.left > maxWidth) {
                    maxWidth = layout.right - layout.left;
                }
                totalHeight = layout.bottom;
            }

            // Ensure when in flow mode, where items are scaled together, that
            // the layout size accommodates the maximum possible item width.
            // If this is not done, then positioning will change and shift if
            // newer, wider items are added dynamically. At the same time, do
            // not scale the padding as it is expected to be independent of the
            // scale applied to the document.
            if (flow && numberOfItems > 0) {
                maxWidth = Math.round(
                    itemSizeCollection.maxWidth * cachedScales.default + paddingLeft + paddingRight
                );
            }

            // Cache the item layouts and total layout size.
            this._cache.itemLayouts = layouts;
            this._cache.size = { width: maxWidth, height: totalHeight };
        },

        /**
         * Measure the viewport size.
         */
        _measureViewport: function() {
            var width = DOMUtil.width(this._viewport);
            var height = DOMUtil.height(this._viewport);

            // Cache the viewport size.
            this._cache.viewportSize = {
                width: width,
                height: height
            };
        },

        /**
         * Return an unscaled position value for use with item layouts.
         */
        _unscale: function(value) {
            return Math.ceil(value / this._scale);
        },

        /**
         * Validate the configuration of the layout.
         */
        _validateConfiguration: function() {
            if (!this._viewport) {
                throw new Error('VerticalLayout configuration: viewport is required.');
            }
            if (!this._itemSizeCollection) {
                throw new Error('VerticalLayout configuration: itemSizeCollection is required.');
            }
            if (!this._renderer) {
                throw new Error('VerticalLayout configuration: renderer is required.');
            }
        }
    };

    return VerticalLayout;
});
