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
    var AwesomeMapFactory = require('wf-js-uicomponents/scroll_list/AwesomeMapFactory');
    var DestroyUtil = require('wf-js-common/DestroyUtil');
    var FitModes = require('wf-js-uicomponents/layouts/FitModes');
    var HorizontalAlignments = require('wf-js-uicomponents/layouts/HorizontalAlignments');
    var Observable = require('wf-js-common/Observable');
    var PlaceholderRenderer = require('wf-js-uicomponents/scroll_list/PlaceholderRenderer');
    var PositionTranslator = require('wf-js-uicomponents/scroll_list/PositionTranslator');
    var Rectangle = require('wf-js-common/Rectangle');
    var ScaleTranslator = require('wf-js-uicomponents/scroll_list/ScaleTranslator');
    var ScrollModes = require('wf-js-uicomponents/scroll_list/ScrollModes');
    var Utils = require('wf-js-common/Utils');
    var VerticalAlignments = require('wf-js-uicomponents/layouts/VerticalAlignments');
    var VerticalLayout = require('wf-js-uicomponents/layouts/VerticalLayout');
    var ZoomPersistenceRegistrar = require('wf-js-uicomponents/scroll_list/ZoomPersistenceRegistrar');

    function constrain(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function between(value, min, max) {
        min = min || Number.MIN_VALUE;
        max = max || Number.MAX_VALUE;
        return value >= min && value <= max;
    }

    /**
     * Creates a new ScrollList from the given configuration.
     *
     * @classdesc
     *
     * A ScrollList renders a virtualized list of items in its host element.
     * The list can be scrolled and zoomed using both touch and mouse interactions.
     *
     * @name ScrollList
     * @constructor
     *
     * @param {HTMLElement} host
     *        The DOM element that hosts the scroll list.
     *
     * @param {ItemSizeCollection} itemSizeCollection
     *        Metadata about the item sizes and (optionally) fit modes.
     *
     * @param {Object} [options]
     *
     * @param {boolean} [options.disableScaleTranslation]
     *        Disable the scale translation that makes scale values relative to
     *        the given size of the items. If disabled, scale values are relative
     *        to the size of the items after they are fit to the viewport.
     *
     * @param {string} [options.fit='width']
     *        The strategy used to resize content to fit the viewport.
     *        Can be 'auto', 'width' or 'height'.
     *
     * @param {number} [options.fitUpscaleLimit=1]
     *        When fitting items to the viewport, allow scaling up to this limit.
     *
     * @param {number} [options.gap=0]
     *        The gap between items, in pixels.
     *
     * @param {string} [options.horizontalAlign='center']
     *        The alignment of the items along the x-axis. Can be 'center' or
     *        'left'.
     *
     * @param {number} [options.initialItemScale]
     *        Scale the default size of items by the given value. This setting
     *        is only relevant when options.fit='none', as other modes will
     *        size the content to fit the viewport.
     *
     * @param {number} [options.minNumberOfVirtualItems=3]
     *        The minimum number of virtual items to render at one time.
     *
     * @param {number} [options.mode='flow']
     *        The interaction mode for the list.
     *        Can be 'flow', 'peek' or 'single'.
     *
     * @param {number|{left: number, right: number, top: number, bottom: number}} [options.padding=0]
     *        The padding around the list, in pixels.
     *
     * @param {false|Object} [options.scaleLimits]
     *        Configuration options for the default {@link ScaleInterceptor}:
     *        set to false to remove the default interceptor or
     *        pass an object with custom options for the interceptor.
     *
     * @param {boolean} [options.mousePanningEnabled=true]
     *        When mouse panning is enabled, dragging will scroll
     *        the list and pan items. When disabled, touches, the mouse wheel, and
     *        scrollbar are the only means of scrolling.
     *
     * @param {boolean} [options.persistZoom=false]
     *        When persistZoom is enabled, when in peek mode the zoom level
     *        will persist when changing items. Defaults to false.
     *
     * @param {string} [options.verticalAlign='auto']
     *        The alignments of the items along the y-axis. Can be 'auto' or
     *        'top'.
     *
     * @example
     *
     * var host = document.getElementById('host');
     * var itemSizeCollection = new ItemSizeCollection({
     *     maxWidth: 600,
     *     maxHeight: 600,
     *     items: [
     *         { width: 400, height: 600 },
     *         { width: 600, height: 400 }
     *     ]
     * });
     *
     * var scrollList = new ScrollList(host, itemSizeCollection, {
     *     mode: 'flow',
     *     fit: 'auto',
     *     padding: 10,
     *     gap: 10,
     *     concurrentContentLimit: 3
     * });
     *
     * scrollList.onContentRequested(function(sender, args) {
     *     // Put content into args.placeholder.contentContainer....
     * });
     *
     * scrollList.onContentRemoved(function(sender, args) {
     *     // Do something when content is removed....
     * });
     *
     * scrollList.onCurrentItemChanged(function(sender, args) {
     *     // Do something when the content changes....
     * });
     *
     * scrollList.onInteraction(function(sender, args) {
     *     // Handle interactions....
     * });
     *
     * scrollList.onPlaceholderRendered(function(sender, args) {
     *     // Modify the rendered placeholder before content is loaded....
     * });
     *
     * scrollList.onScaleChanged(function(sender, args) {
     *     // Respond to changes in the scale of content....
     * });
     *
     * // Render when you're ready
     * scrollList.render();
     */
    var ScrollList = function(host, itemSizeCollection, options) {

        //---------------------------------------------------------
        // Observables
        //---------------------------------------------------------

        /**
         * Observable for subscribing to content requested events.
         * @method ScrollList#onContentRequested
         * @param {Function} callback
         *        Invoked with (sender, {
         *            itemIndex: number,
         *            contentContainer: HTMLElement,
         *            scaleToFit: number,
         *            width: number,
         *            height: number
         *        })
         */
        this.onContentRequested = Observable.newObservable();

        /**
         * Observable for subscribing to content removed events.
         * These events occur when a placeholder is removed from the DOM.
         * @method ScrollList#onContentRemoved
         * @param {Function} callback
         *        Invoked with (sender, {
         *            itemIndex: number,
         *            placeholder: Object
         *        })
         */
        this.onContentRemoved = Observable.newObservable();

        /**
         * Observable for subscribing to changes to the currently visible item.
         * @method ScrollList#onCurrentItemChanged
         * @param {Function} callback
         *        Invoked with (sender, {
         *            itemIndex: number,
         *            placeholder: Object
         *        })
         */
        this.onCurrentItemChanged = Observable.newObservable();

        /**
         * Observable for subscribing to changes to the currently visible item
         * just before the change is triggered.
         * @method ScrollList#onCurrentItemChanging
         * @param {Function} callback
         *        Invoked with (sender, {
         *            fromIndex: number,
         *            toIndex: number
         *        })
         */
        this.onCurrentItemChanging = Observable.newObservable();

        /**
         * Observable for subscribing to interaction events in the scroll list.
         * @method ScrollList#onInteraction
         * @param {Function} callback
         *        Invoked with (sender, {
         *            event: {@link InteractionEvent},
         *            itemIndex: number,
         *            itemPosition: { x: number, y: number }
         *        })
         */
        this.onInteraction = Observable.newObservable();

        /**
         * Observable for subscribing to the start of interactions.
         * @method ScrollList#onInteractionStarted
         * @param {Function} callback
         *        Invoked with (sender)
         */
        this.onInteractionStarted = Observable.newObservable();

        /**
         * Observable for subscribing to the end of interactions.
         * @method ScrollList#onInteractionFinished
         * @param {Function} callback
         *        Invoked with (sender)
         */
        this.onInteractionFinished = Observable.newObservable();

        /**
         * Observable for subscribing to changes in the scroll position of the
         * individual items when in 'peek' and 'single' modes.
         * @method ScrollList#onItemScrollPositionChanged
         * @param {Function} callback
         *        Invoked with (sender, {
         *            event: {@link InteractionEvent},
         *            x: number,
         *            y: number
         *        })
         */
        this.onItemScrollPositionChanged = Observable.newObservable();

        /**
         * Observable for subscribing to pending changes in the scroll position
         * of the individual items when in 'peek' and 'single' modes.
         *
         * @method ScrollList#onItemScrollPositionChanging
         * @param {Function} callback
         *        Invoked with (sender, {
         *            event: {@link InteractionEvent},
         *            currentPosition: {
         *                x: {number},
         *                y: {number}
         *            },
         *            nextPosition: {
         *                x: {number},
         *                y: {number}
         *            }
         *        })
         */
        this.onItemScrollPositionChanging = Observable.newObservable();

        /**
         * Observable for subscribing to the insertion of new items.
         *
         * @method ScrollList#onItemsInserted
         * @param {Function} callback
         *        Invoked with (sender, {
         *            count: {number}
         *        })
         */
        this.onItemsInserted = Observable.newObservable();

        /**
         * Observable for subscribing to placeholder rendered events.
         * @method ScrollList#onPlaceholderRendered
         * @param {Function} callback
         *        Invoked with (sender, {
         *            itemIndex: number,
         *            placeholder: Object
         *        })
         */
        this.onPlaceholderRendered = Observable.newObservable();

        /**
         * Observable for subscribing to scale changes.
         *
         * @method ScrollList#onScaleChanged
         * @param {Function} callback
         *        Invoked with (sender, {
         *            event: {@link InteractionEvent},
         *            scale: {number}
         *        })
         */
        this.onScaleChanged = Observable.newObservable();

        /**
         * Observable for subscribing to pending scale changes.
         *
         * @method ScrollList#onScaleChanging
         * @param {Function} callback
         *        Invoked with (sender, {
         *            event: {@link InteractionEvent},
         *            currentScale: {number},
         *            nextScale: {number}
         *        })
         */
        this.onScaleChanging = Observable.newObservable();

        /**
         * Observable for subscribing to changes in scroll position.
         *
         * @method ScrollList#onScrollPositionChanged
         * @param {Function} callback
         *        Invoked with (sender, {
         *            event: {@link InteractionEvent},
         *            x: {number}
         *            y: {number}
         *        })
         */
        this.onScrollPositionChanged = Observable.newObservable();

        /**
         * Observable for subscribing to changes in scroll position.
         *
         * @method ScrollList#onScrollPositionChanging
         * @param {Function} callback
         *        Invoked with (sender, {
         *            event: {@link InteractionEvent},
         *            currentPosition: {
         *                x: {number},
         *                y: {number}
         *            },
         *            nextPosition: {
         *                x: {number},
         *                y: {number}
         *            }
         *        })
         */
        this.onScrollPositionChanging = Observable.newObservable();

        /**
         * Observable for subscribing to scroll to events.
         * This event occurs when the peek interceptor decides
         * to snap to the top of a item.
         *
         * @method ScrollList#onScrollToItemFinished
         * @param {Function} callback
         *        Invoked with no parameters
         */

        this.onScrollToItemFinished = Observable.newObservable();

        /**
         * Observable for subscribing to scroll to events.
         * This event occurs when the resulting call to scrollToItem
         * finishes its animation.
         *
         * @method ScrollList#onScrollToItemStarted
         * @param {Function} callback
         *        Invoked with no parameters
         */
        this.onScrollToItemStarted = Observable.newObservable();

        //---------------------------------------------------------
        // Private properties
        //---------------------------------------------------------

        /**
         * The awesome map that hosts the list.
         * @type {AwesomeMap}
         */
        this._listMap = null;

        /**
         * The DOM element hosting the component.
         * @type {HTMLElement}
         */
        this._host = host;

        /**
         * Metadata about the content items.
         * @type {ItemSizeCollection}
         */
        this._itemSizesCollection = itemSizeCollection;

        /**
         * The layout.
         * @type {Object}
         */
        this._layout = null;

        /**
         * User-configurable options.
         * @type {Object}
         */
        this._options = _.extend({
            initialItemScale: 1,
            disableScaleTranslation: false,
            fit: FitModes.WIDTH,
            fitUpscaleLimit: 1,
            gap: 0,
            horizontalAlign: HorizontalAlignments.CENTER,
            minNumberOfVirtualItems: 3,
            mode: ScrollModes.FLOW,
            padding: 0,
            persistZoom: false,
            scaleLimits: { minimum: 1, maximum: 3 },
            mousePanningEnabled: true,
            verticalAlign: VerticalAlignments.AUTO
        }, options);

        /**
         * Provides translation between pure ItemLayouts and elements hosted and
         * positioned with the help of a transformation plane.
         * @type {PositionTranslator}
         */
        this._positionTranslator = null;

        /**
         * The renderer.
         * @type {Object}
         */
        this._renderer = null;

        /**
         * Provides translation between the rendered size of content and the maps.
         * @type {ScaleTranslator}
         */
        this._scaleTranslator = null;

        //---------------------------------------------------------
        // Initialization
        //---------------------------------------------------------

        this._initialize();
    };

    ScrollList.prototype = {

        //---------------------------------------------------------
        // Public properties
        //---------------------------------------------------------

        /**
         * Gets the currently visible item index and its placeholder.
         *
         * @method ScrollList#getCurrentItem
         * @returns {{index: number, placeholder: Object}}
         */
        getCurrentItem: function() {
            var index = this._layout.getCurrentItemIndex();
            var placeholder = this._renderer.get(index);

            return {
                index: index,
                placeholder: placeholder
            };
        },

        /**
         * Gets the item map for the current item.
         *
         * @method ScrollList#getCurrentItemMap
         * @return {AwesomeMap}
         */
        getCurrentItemMap: function() {
            var currentItemIndex = this._layout.getCurrentItemIndex();
            return this.getItemMap(currentItemIndex);
        },

        /**
         * Gets the item map for the item with the given index.
         * If the item is not rendered, will return undefined.
         *
         * @method ScrollList#getItemMap
         * @param {number} itemIndex
         * @return {AwesomeMap|undefined}
         */
        getItemMap: function(itemIndex) {
            var placeholder = this._renderer.get(itemIndex);
            return placeholder && placeholder.map;
        },

        /**
         * Gets the list map.
         *
         * @method ScrollList#getListMap
         * @returns {AwesomeMap}
         */
        getListMap: function() {
            return this._listMap;
        },

        /**
         * Gets the element that hosts this scroll list.
         *
         * @method ScrollList#getHost
         * @return {HTMLElement}
         */
        getHost: function() {
            return this._host;
        },

        /**
         * Gets the item metadata.
         *
         * @method ScrollList#getItemSizeCollection
         * @return {ItemSizeCollection}
         */
        getItemSizeCollection: function() {
            return this._itemSizesCollection;
        },

        /**
         * Gets the layout.
         *
         * @method ScrollList#getLayout
         * @return {Object}
         */
        getLayout: function() {
            return this._layout;
        },

        /**
         * Gets the current set of options.
         *
         * @method ScrollList#getOptions
         * @return {Object}
         */
        getOptions: function() {
            return this._options;
        },

        /**
         * Gets the position translator.
         *
         * @method ScrollList#getPositionTranslator
         * @return {PositionTranslator}
         */
        getPositionTranslator: function() {
            return this._positionTranslator;
        },

        /**
         * Gets the placeholder renderer.
         *
         * @return {PlaceholderRenderer}
         */
        getRenderer: function() {
            return this._renderer;
        },

        /**
         * Gets the current scale of the content.
         *
         * @method ScrollList#getScale
         * @return {number}
         */
        getScale: function() {
            return this._scaleTranslator.fromMapScale();
        },

        /**
         * Gets the scale translator.
         *
         * @method ScrollList#getScaleTranslator
         * @return {ScaleTranslator}
         */
        getScaleTranslator: function() {
            return this._scaleTranslator;
        },

        /**
         * Gets whether interactions are disabled.
         *
         * @method ScrollList#isDisabled
         * @return {boolean}
         */
        isDisabled: function() {
            return this._listMap.isDisabled();
        },

        //---------------------------------------------------------
        // Public methods
        //---------------------------------------------------------

        /**
         * Disables direct interaction with the scroll list.
         *
         * @method ScrollList#disable
         */
        disable: function() {
            this._listMap.disable();
            var itemMap = this.getCurrentItemMap();
            if (itemMap) {
                itemMap.disable();
            }
        },

        /**
         * Disposes the instance.
         *
         * @method ScrollList#dispose
         */
        dispose: function() {
            this._layout.dispose();
            this._renderer.dispose();
            this._listMap.dispose();
            this._scaleTranslator.dispose();

            this.onContentRequested.dispose();
            this.onContentRemoved.dispose();
            this.onCurrentItemChanged.dispose();
            this.onCurrentItemChanging.dispose();
            this.onInteraction.dispose();
            this.onInteractionFinished.dispose();
            this.onInteractionStarted.dispose();
            this.onPlaceholderRendered.dispose();
            this.onScaleChanged.dispose();

            DestroyUtil.destroy(this);
        },

        /**
         * Enables direct interaction with the scroll list.
         *
         * @method  ScrollList#enable
         */
        enable: function() {
            this._listMap.enable();
            var itemMap = this.getCurrentItemMap();
            if (itemMap) {
                itemMap.enable();
            }
        },

        /**
         * Given a screen position, finds the nearest position on the ScrollList
         * item.
         *
         * @param  {Number} itemIndex
         * @param  {{x: {Number}, y: {Number}}} position
         * @return {{x: {Number}, y: {Number}}}
         */
        restrictPositionToItemContainer: function(itemIndex, position) {
            var BUFFER = 1; // bump the event position 1 pixel inside the item container
            var placeholderRenderer = this.getRenderer();
            var placeholder = placeholderRenderer.get(itemIndex);
            var itemElement = placeholder.contentContainer;
            var rect = itemElement.getBoundingClientRect();
            var adjustedposition = {
                x: position.x,
                y: position.y
            };
            if (position.x >= rect.right - BUFFER) {
                adjustedposition.x = rect.right - BUFFER;
            }
            if (position.x <= rect.left + BUFFER) {
                adjustedposition.x = rect.left + BUFFER;
            }
            if (position.y <= rect.top + BUFFER) {
                adjustedposition.y = rect.top + BUFFER;
            }
            if (position.y >= rect.bottom + BUFFER) {
                adjustedposition.y = rect.bottom - BUFFER;
            }
            return adjustedposition;
        },

        /**
         * Given a screen position, computes the nearest item and the nearest
         * position on that item. If the scrollList is in Peek or Single mode it
         * finds the nearest position on the item being displayed. If the
         * scrollList is in Flow mode it determines which item the event position
         * is next to and calculates the nearest point on that item. If a valid
         * location cannot be found null is returned.
         *
         * @param  {{x: {Number}, y: {Number}}} position
         * @return {{x: {Number}, y: {Number}}|null}
         */
        restrictPositionToNearestItem: function(position) {
            var scrollMode = this.getOptions().mode;
            var layout = this.getLayout();
            var placeholderRenderer = this.getRenderer();
            var placeholder;

            if (scrollMode === ScrollModes.PEEK || scrollMode === ScrollModes.SINGLE) {
                var itemIndex = layout.getCurrentItemIndex();
                placeholder = placeholderRenderer.get(itemIndex);
                return this.restrictPositionToItemContainer(itemIndex, position);
            } else {
                var itemRange = layout.getRenderedItemRange();
                var minDistance;
                var nearestItemIndex;
                for (var i = itemRange.startIndex; i <= itemRange.endIndex; i++) {
                    placeholder = placeholderRenderer.get(i);
                    var el = placeholder.contentContainer;
                    var rect = el.getBoundingClientRect();
                    var yDistance = 0;
                    if (position.y < rect.top) {
                        yDistance = rect.top - position.y;
                    } else if (position.y > rect.bottom) {
                        yDistance = position.y - rect.bottom;
                    }
                    var xDistance = 0;
                    if (position.x < rect.left) {
                        xDistance = rect.left - position.x;
                    } else if (position.x > rect.right) {
                        xDistance = position.x - rect.right;
                    }
                    // Distance here is the square of the distance from the position
                    // to the item. We'll compare the squared distance so we don't
                    // have to take the square root here.
                    var distance = xDistance * xDistance + yDistance * yDistance;
                    if (i === itemRange.startIndex || distance < minDistance) {
                        minDistance = distance;
                        nearestItemIndex = i;
                    }
                }
                if (minDistance === 0) {
                    return position;
                } else {
                    return this.restrictPositionToItemContainer(nearestItemIndex, position);
                }
            }

            return null;
        },

        /**
         * Get the viewport-relative position data for all visible items.
         *
         * @return {Array.<{
         *     itemIndex: Number,
         *     scale: Number,
         *     top: Number,
         *     bottom: Number,
         *     left: Number,
         *     right: Number
         * }>} List of objects containing the position data
         */
        getVisibleItemPositionData: function() {
            var activeMap = this.getCurrentItemMap() || this._listMap;
            var transformState = activeMap.getCurrentTransformState();
            var scale = transformState.scale;

            var layout = this._layout;
            var viewportSize = layout.getViewportSize();
            var visibleItemRange = layout.getVisibleItemRange();
            var positionTranslator = this._positionTranslator;

            var visibleItems = [];
            for (var i = visibleItemRange.startIndex; i <= visibleItemRange.endIndex; i++) {
                var itemLayout = layout.getItemLayout(i);
                var itemBounds = positionTranslator.getBoundsInTransformationPlane(itemLayout);

                // Get the position of each item relative to the viewport
                var top = transformState.translateY + itemBounds.top * scale;
                var right = transformState.translateX + itemBounds.right * scale;
                var bottom = transformState.translateY + itemBounds.bottom * scale;
                var left = transformState.translateX + itemBounds.left * scale;

                // Remove items that do not intersect the viewport after
                // accounting for the offset due to padding.
                if (top >= viewportSize.height || bottom <= 0 ||
                    left >= viewportSize.width || right <= 0
                ) {
                    continue;
                }

                var visibleItem = {
                    itemIndex: i,
                    scale: scale * itemLayout.scaleToFit,
                    top: top,
                    bottom: bottom,
                    left: left,
                    right: right
                };
                visibleItems.push(visibleItem);
            }

            return visibleItems;
        },

        /**
         * Return the index of and position within the item at the given point.
         * If no item is under the given point, return false.
         *
         * @method ScrollList#hitTest
         * @param  {{ x: number, y: number }} point
         * @return {boolean|{ index: number, position: { x: number, y: number }}}
         */
        hitTest: function(point) {
            var visibleItemPositionData = this.getVisibleItemPositionData();
            for (var i = 0, n = visibleItemPositionData.length; i < n; i++) {
                var itemPosition = visibleItemPositionData[i];
                var itemRectangle = new Rectangle(itemPosition);
                if (itemRectangle.contains(point)) {
                    return {
                        index: itemPosition.itemIndex,
                        position: {
                            x: Math.floor((point.x - itemPosition.left) / itemPosition.scale),
                            y: Math.floor((point.y - itemPosition.top) / itemPosition.scale)
                        }
                    };
                }
            }
            return false;
        },

        /**
         * Insert items into the list and re-render immediately.
         *
         * @method ScrollList#insertItems
         * @param {number} index
         * @param {Array.<{ width: number, height: number }>} itemSizes
         */
        insertItems: function(index, itemSizes) {
            var listMap = this._listMap;
            var currentScale = listMap.getScale();
            var currentTranslation = listMap.getTranslation();

            // Guard against invalid startIndex value
            var layout = this._layout;
            var currentItemsCount = layout.getItemSizeCollection().getLength();
            index = Math.max(0, Math.min(currentItemsCount, index));

            // Track the current item's top position so we can keep it
            // in its current position after inserting new items.
            var currentItemIndex = layout.getCurrentItemIndex();
            var currentItemLayout = layout.getItemLayout(currentItemIndex);
            var currentItemTop = 0;
            var currentItemLeft = 0;
            if (currentItemLayout) {
                currentItemTop = currentItemLayout.top;
                currentItemLeft = currentItemLayout.left;
            }

            // Insert items into the layout and update the currently rendered items
            // to account for changes to item position.
            this._layout.insertItems(index, itemSizes);
            this._renderer.update(index, itemSizes.length);

            // Keep the currently rendered items in the same position.
            var adjustedItemIndex = currentItemIndex + (index <= currentItemIndex ? itemSizes.length : 0);
            var adjustedItemLayout = layout.getItemLayout(adjustedItemIndex);
            var adjustedItemTop = adjustedItemLayout.top;
            var adjustedItemLeft = adjustedItemLayout.left;
            listMap.setContentDimensions(layout.getSize());
            listMap.transform({
                x: currentTranslation.x + (currentItemLeft - adjustedItemLeft) * currentScale,
                y: currentTranslation.y + (currentItemTop - adjustedItemTop) * currentScale,
                scale: currentScale
            });

            // Notify consumers that items have been inserted.
            this.onItemsInserted.dispatch([this, {
                count: itemSizes.length
            }]);

            this.render();
        },

        /**
         * Re-initializes and re-renders the scroll list.
         * @method ScrollList#refresh
         */
        refresh: function() {
            // Bail if the list is empty.
            if (this._layout.getItemLayouts().length === 0) {
                return;
            }

            var listMap = this._listMap;
            var listState = listMap.getCurrentTransformState();
            var contentHeight = listMap.getContentDimensions().height;
            var listScale = listState.scale;
            var viewportTop = -listState.translateY / listScale;
            var viewportTopPercent = viewportTop / contentHeight;
            var newViewportTop;
            var newContentHeight;

            // Clear old content and reinitialize metrics.
            this._layout.clear();
            this._layout.measure();
            this._renderer.refresh();
            listMap.clearContent();
            listMap.invalidateViewportDimensions();
            listMap.setContentDimensions(this._layout.getSize());

            // Re-attach the scale translator
            this._scaleTranslator.attach(listMap, 0);

            // Calculate the new top position to keep
            // the list in the same position as before the resize.
            newContentHeight = listMap.getContentDimensions().height;
            newViewportTop = Math.round(newContentHeight * listScale * viewportTopPercent);

            // Pan to the new position.
            listMap.panTo({
                x: listState.translateX,
                y: -newViewportTop,
                duration: 0
            });
        },

        /**
         * Renders the scroll list.
         * @method ScrollList#render
         */
        render: function() {
            this._layout.render();
            this._layout.loadContent();
        },

        /**
         * Scroll to the specified offset within an item index.
         * @method ScrollList#scrollToItem
         * @param {Object} options
         * @param {number} options.index - The index of the item/content to jump to.
         * @param {string} [options.viewportAnchorLocation=top]
         *   Where you want the item offset to show in the viewport.
         *   Can be 'top', 'center', or 'bottom.'
         *   The anchor location is constrained by any viewing boundaries that exist
         *   in the document or viewing mode.
         * @param {{ x: number, y: number}} [options.offset={ x: 0, y: 0 }]
         *   An item-relative offset to position the viewport. Positive numbers
         *   move the viewport to the left and down for x and y, respectively.
         *   Negative numbers do the reverse.
         * @param {Function} [options.done] - Callback invoked when the jump is complete.
         * @example
         * // Scrolls the third item to the top of the viewport.
         * scrollList.scrollToItem({ 3, 'top'});
         *
         * // Scrolls to the third item, and places the point 200px down
         * // the item at the top of the viewport.  x is ignored.
         * scrollList.scrollToItem({ 3, 'top', { x: 100, y: 200 } });
         *
         * // Scrolls the top of the third item to the center of the viewport.
         * scrollList.scrollToItem({ 3, 'center'});
         *
         * // Scrolls to the third item, and places the point 100 in from
         * // the left and 200px down at the cetner of the viewport.
         * scrollList.scrollToItem({ 3, 'center', { x: 100, y: 200 } });
         *
         * // Scrolls the top of the third item to the bottom of the viewport.
         * // (Basically shows item 2.)
         * scrollList.scrollToItem({ 3, 'bottom'});
         *
         * // Scrolls to the third item, and places the point 200px down
         * // the item to the bottom of the viewport. x is ignored.
         * scrollList.scrollToItem({ 3, 'bottom', { x: 100, y: 200 } });
         *
         */
        scrollToItem: function(options) {
            if (options.index === undefined) {
                throw new Error('ScrollList#scrollToItem: index is required.');
            }

            this.onScrollToItemStarted.dispatch();
            var self = this;
            if (options.done) {
                var currentDone = options.done;
                options.done = function() {
                    currentDone();
                    self.onScrollToItemFinished.dispatch();
                };
            }
            else {
                options.done = function() {
                    self.onScrollToItemFinished.dispatch();
                };
            }

            var panToOptions = {
                x: 0,
                y: 0,
                duration: Utils.valueOr(options.duration, 0),
                done: options.done
            };

            var layout = this._layout;

            // Zoom item maps to default scale when scroll completes unless the
            // scroll is paused mid-stream, which can happen in peek mode.
            if (this._options.mode !== ScrollModes.FLOW && !this._options.persistZoom) {
                panToOptions.done = function() {
                    var endState = self._listMap.getCurrentTransformState();
                    if (endState.translateX === panToOptions.x &&
                        endState.translateY === panToOptions.y) {

                        var currentItemIndex = layout.getCurrentItemIndex();
                        var itemRange = layout.getRenderedItemRange();
                        var viewportHeight = layout.getViewportSize().height;

                        for (var i = itemRange.startIndex; i <= itemRange.endIndex; i++) {
                            var itemMap = self.getItemMap(i);
                            var itemHeight = layout.getItemLayout(i).outerHeight;
                            var transformY = null;
                            // For items before the current one, make sure they
                            // are panned to the bottom of the viewport if they
                            // overflow vertically.
                            if (i < currentItemIndex && itemHeight > viewportHeight) {
                                transformY = viewportHeight - itemHeight;
                            }
                            // For items after the current one, make sure they
                            // are panned to the top of the viewport.
                            else if (i > currentItemIndex && itemHeight > viewportHeight) {
                                transformY = 0;
                            }
                            if (i !== currentItemIndex) {
                                itemMap.zoomTo({ scale: 1 });
                                if (transformY !== null) {
                                    itemMap.panTo({ y: transformY });
                                }
                            }
                        }
                    }

                    if (options.done) {
                        options.done();
                    }
                };
            }

            // Calculate the left and top of the target content.
            var currentIndex = layout.getCurrentItemIndex();
            var targetIndex = Math.max(0,
                Math.min(options.index || 0, this._itemSizesCollection.getLength() - 1)
            );
            var itemLayout = layout.getItemLayout(targetIndex);
            // If the list is empty, there will be no itemLayout
            if (!itemLayout) {
                return;
            }
            var listState = this._listMap.getCurrentTransformState();
            panToOptions.x = listState.translateX;
            panToOptions.currentX = listState.translateX;
            panToOptions.y = -(itemLayout.top||0) * listState.scale;

            // If given a content offset within the item, adjust the panToOptions.
            if (options.offset) {
                var viewportAnchorLocation = options.viewportAnchorLocation || 'top';
                var offset = options.offset || { x: 0, y: 0 };
                offset.x = offset.x || 0;
                offset.y = offset.y || 0;

                this._applyItemOffset(
                    panToOptions,
                    offset,
                    itemLayout,
                    viewportAnchorLocation
                );
            }

            this.onCurrentItemChanging.dispatch([this, {
                fromIndex: currentIndex,
                toIndex: targetIndex
            }]);

            // Render placeholders at the jump target if target is not rendered.
            var itemRange = layout.getRenderedItemRange();
            if (!itemRange ||
                targetIndex < itemRange.startIndex ||
                targetIndex > itemRange.endIndex) {
                // panToOptions are translations; the distance to move the document
                // points are distance from the top of the document.  Flip the signs.
                layout.setScrollPosition({
                    top: -panToOptions.y,
                    left: -panToOptions.x
                });
                layout.render();
            }

            // Perform the scroll.
            this._listMap.panTo(panToOptions);
        },

        /**
         *
         * @method ScrollList#scrollToPosition
         * @param {Object} options
         * @param {number} [options.x] - The x-axis position; defaults to current x.
         * @param {number} [options.y] - The y-axis position; defaults to current y.
         * @param {Function} [options.done] - Callback invoked when scroll completes.
         */
        scrollToPosition: function(options) {
            // Validation:
            if (this._options.mode !== ScrollModes.FLOW) {
                throw 'ScrollList#scrollToPosition is only available in "flow" mode.';
            }
            options = options || {};
            if (options.x === undefined && options.y === undefined) {
                throw 'ScrollList#scrollToPosition: x or y is required.';
            }

            // Get the target x/y from the options or defaults.
            var listMap = this.getListMap();
            var currentState = listMap.getCurrentTransformState();
            var currentScale = currentState.scale;
            var x = options.x === undefined ? -currentState.translateX : options.x * currentScale;
            var y = options.y === undefined ? -currentState.translateY : options.y * currentScale;

            // Constrain position to within bounds.
            var layout = this.getLayout();
            var listSize = layout.getSize();
            var viewportSize = layout.getViewportSize();
            x = constrain(x, 0, listSize.width * currentScale - viewportSize.width);
            y = constrain(y, 0, listSize.height * currentScale - viewportSize.height);

            // Ensure placeholders exist at target position to prevent flash of
            // emptiness upon scrolling to target position.
            var renderedPosition = layout.getPositionToRender();
            if (!renderedPosition ||
                !between(x, renderedPosition.left, renderedPosition.right) ||
                !between(y, renderedPosition.top, renderedPosition.bottom)
            ) {
                layout.setScrollPosition({ top: y, left: x });
                layout.render();
            }

            // If in flow mode, go to the position:
            this._listMap.panTo({
                x: -x,
                y: -y,
                done: options.done
            });
        },

        /**
         * Zooms to the specified scale.
         * @method ScrollList#zoomTo
         * @param {Object} options
         * @param {number} options.scale - The target scale.
         * @param {number} [options.duration] - The animation duration, in ms.
         * @param {Function} [options.done] - Callback invoked when the zoom is complete.
         */
        zoomTo: function(options) {
            if (options.scale === undefined) {
                throw new Error('ScrollList#zoomToScale: scale is required.');
            }
            var scale = this._scaleTranslator.toMapScale(options.scale);
            this._zoomTo(scale, options);
        },

        /**
         * Zoom in/out such that the item is fit to the viewport width.
         *
         * @param {Object} options
         * @param {number} [options.duration] - The animation duration, in ms.
         * @param {Function} [options.done] - Callback invoked when the zoom is complete.
         * @return {number} - the scale that was applied
         */
        zoomToWidth: function(options) {
            var itemLayout = this._layout.getCurrentItemLayout();
            var scale = this._scaleTranslator.toMapScale(itemLayout.scales.width, true /*force*/);
            this._zoomTo(scale, options);
            return scale;
        },

        /**
         * Zoom in/out such that the item is fit to the viewport height.
         *
         * @param {Object} options
         * @param {number} [options.duration] - The animation duration, in ms.
         * @param {Function} [options.done] - Callback invoked when the zoom is complete.
         * @return {number} - the scale that was applied
         */
        zoomToHeight: function(options) {
            var itemLayout = this._layout.getCurrentItemLayout();
            var scale = this._scaleTranslator.toMapScale(itemLayout.scales.height, true /*force*/);
            this._zoomTo(scale, options);
            return scale;
        },

        /**
         * Zoom in/out such that the item will fit within the viewport.
         *
         * @param {Object} options
         * @param {number} [options.duration] - The animation duration, in ms.
         * @param {Function} [options.done] - Callback invoked when the zoom is complete.
         * @return {number} - the scale that was applied
         */
        zoomToWindow: function(options) {
            var itemLayout = this._layout.getCurrentItemLayout();
            var scale = this._scaleTranslator.toMapScale(itemLayout.scales.auto, true /*force*/);
            this._zoomTo(scale, options);
            return scale;
        },

        //---------------------------------------------------------
        // Private methods
        //---------------------------------------------------------

        /**
         * Initialize objects used by this instance.
         */
        _initialize: function() {
            this._validateConfiguration();

            this._initializeRenderer();
            this._initializeLayout();

            this._listMap = AwesomeMapFactory.createListMap(this);
            this._positionTranslator = new PositionTranslator(this);
            this._scaleTranslator = new ScaleTranslator(this, this._listMap, 0);

            if (this._options.persistZoom) {
                if (this._options.mode === ScrollModes.FLOW) {
                    throw new Error('ScrollList#_initialize: cannot persist zoom in flow mode');
                }
                ZoomPersistenceRegistrar.register(this);
            }
        },

        /**
         * Initialize the placeholder renderer.
         */
        _initializeRenderer: function() {
            var self = this;

            this._renderer = new PlaceholderRenderer(this);

            this._renderer.onRendered(function(renderer, args) {
                self.onPlaceholderRendered.dispatch([self, {
                    itemIndex: args.itemIndex,
                    placeholder: args.placeholder
                }]);
            });

            this._renderer.onLoading(function(renderer, args) {
                self.onContentRequested.dispatch([self, args]);
            });

            this._renderer.onUnloaded(function(renderer, args) {
                self.onContentRemoved.dispatch([self, args]);
            });
        },

        /**
         * Initialize a layout.
         */
        _initializeLayout: function() {
            var self = this;
            var options = this._options;
            var isFlow = options.mode === ScrollModes.FLOW;

            this._layout = new VerticalLayout(this._host, this._itemSizesCollection, this._renderer, {
                initialItemScale: options.initialItemScale,
                minNumberOfVirtualItems: options.minNumberOfVirtualItems,
                eagerRenderingFactor: isFlow ? 2 : 1,
                fit: options.fit,
                fitUpscaleLimit: options.fitUpscaleLimit,
                flow: isFlow,
                gap: options.gap,
                horizontalAlign: options.horizontalAlign,
                padding: options.padding,
                verticalAlign: options.verticalAlign
            });

            this._layout.onCurrentItemIndexChanged(function(layout, args) {
                if (args.index === -1) {
                    return;
                }
                var currentItem = self.getCurrentItem();
                var itemIndex = currentItem.index;
                var placeholder = currentItem.placeholder;
                if (!isFlow) {
                    var itemMap = self.getItemMap(itemIndex);
                    self._scaleTranslator.attach(itemMap, itemIndex);
                }
                self.onCurrentItemChanged.dispatch([self, {
                    itemIndex: itemIndex,
                    placeholder: placeholder
                }]);
            });
        },

        /**
         * Companion method to `scrollToItem` responsible for calculating and
         * applying the offset to the map panToOptions, depending on the viewportAnchorLocation
         */
        _applyItemOffset: function(panToOptions, offset, itemLayout, viewportAnchorLocation) {
            var viewportSize = this._layout.getViewportSize();

            // All of these translations adjust based on scale, so that when a user asks for
            // the item at 200 px, it always yields the same place, regardless of zoom.
            var getTranslation = function(scale) {
                var scaledOffsetX = itemLayout.scaleToFit * offset.x * scale;
                var scaledOffsetY = itemLayout.scaleToFit * offset.y * scale;
                var translation;
                if (viewportAnchorLocation === 'top') {
                    translation = {
                        x: panToOptions.currentX, // Top has no concept of x.  Keep existing.
                        y: -scaledOffsetY
                    };
                }
                else if (viewportAnchorLocation === 'center') {
                    translation = {
                        x: (viewportSize.width / 2) - scaledOffsetX + panToOptions.x,
                        y: (viewportSize.height / 2) - scaledOffsetY,
                    };
                }
                else if (viewportAnchorLocation === 'bottom') {
                    translation = {
                        x: panToOptions.currentX, // Bottom has no concept of x.  Keep existing.
                        y: viewportSize.height - scaledOffsetY
                    };
                }
                return translation;
            };

            var translation;

            // If we are using a item map, we need to pan that map separately.
            var itemMap = this.getCurrentItemMap();
            if (itemMap) {
                var itemMapScale = itemMap.getCurrentTransformState().scale;
                translation = getTranslation(itemMapScale);
                var originalDone = panToOptions.done;
                panToOptions.done = function() {
                    itemMap.panTo({
                        x: translation.x,
                        y: translation.y,
                        duration: 0,
                        done: originalDone
                    });
                };
            }
            // If not using a item map, we can pan to the position directly.
            else {
                var listState = this._listMap.getCurrentTransformState();
                var left; // Calculate the absolute left offset of the AwesomeMap
                if (this.getOptions().horizontalAlign === 'center') {
                    left = this._listMap.getViewportDimensions().width;
                    left = left - this._listMap.getContentDimensions().width;
                    left = (left / 2.0);
                    left = itemLayout.left - left;
                }
                else if (this.getOptions().horizontalAlignment === 'left') {
                    left = itemLayout.left;
                }

                panToOptions.x = -((left||0)+(itemLayout.paddingLeft||0)) * listState.scale;
                panToOptions.y += -((itemLayout.paddingTop||0) * listState.scale);
                var listMapScale = this._listMap.getCurrentTransformState().scale;
                translation = getTranslation(listMapScale);
                panToOptions.x = translation.x;
                panToOptions.y += translation.y;
            }
        },

        /**
         * Validate the configuration of the scroll list.
         */
        _validateConfiguration: function() {
            if (!this._host) {
                throw new Error('ScrollList configuration: host is required.');
            }
            if (!this._itemSizesCollection) {
                throw new Error('ScrollList configuration: itemSizeCollection is required.');
            }
        },

        _zoomTo: function(scale, options) {
            options = options || {};
            (this.getCurrentItemMap() || this._listMap).zoomTo({
                scale: scale,
                duration: options.duration,
                done: options.done
            });
        }
    };

    return ScrollList;
});
