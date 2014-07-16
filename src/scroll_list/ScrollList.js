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
    var FitModes = require('wf-js-uicomponents/scroll_list/FitModes');
    var Observable = require('wf-js-common/Observable');
    var PlaceholderRenderer = require('wf-js-uicomponents/scroll_list/PlaceholderRenderer');
    var ScaleTranslator = require('wf-js-uicomponents/scroll_list/ScaleTranslator');
    var ScrollModes = require('wf-js-uicomponents/scroll_list/ScrollModes');
    var Utils = require('wf-js-common/Utils');
    var VerticalLayout = require('wf-js-uicomponents/layouts/VerticalLayout');

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
     *        Metadata about the item sizes.
     *
     * @param {Object} [options]
     *
     * @param {boolean} [options.disableScaleTranslation]
     *        Disable the scale translation that makes scale values relative to
     *        the given size of the items. If disabled, scale values are relative
     *        to the size of the items after they are fit to the viewport.
     *
     * @param {string} [options.fit]
     *        The strategy used to resize content to fit the viewport.
     *        Can be 'auto', 'width' or 'height'.
     *
     * @param {number} [options.fitUpscaleLimit=1]
     *        When fitting items to the viewport, allow scaling up to this limit.
     *
     * @param {number} [options.gap=0]
     *        The gap between items, in pixels.
     *
     * @param {number} [options.minNumberOfVirtualItems=3]
     *        The minimum number of virtual items to render at one time.
     *
     * @param {number} [options.mode='flow']
     *        The interaction mode for the list.
     *        Can be 'flow', 'peek' or 'single'.
     *
     * @param {number} [options.padding=0]
     *        The padding around the list, in pixels.
     *
     * @param {false|Object} [options.scaleLimits]
     *        Configuration options for the default {@link ScaleInterceptor}:
     *        set to false to remove the default interceptor or
     *        pass an object with custom options for the interceptor.
     *
     * @param {boolean} [options.touchScrollingEnabled=true]
     *        When touch scrolling is enabled, dragging and swiping will scroll
     *        the list and pan items. When disabled, the mouse wheel and
     *        scrollbar are the only default means of scrolling.
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
         * Observable for subscribing to changes in scale.
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
         * Observable for subscribing to the insertion of new items.
         *
         * @method ScrollList#onItemsInserted
         * @param {Function} callback
         *        Invoked with (sender, {
         *            count: {number}
         *        })
         */
        this.onItemsInserted = Observable.newObservable();

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
            disableScaleTranslation: false,
            fit: FitModes.WIDTH,
            fitUpscaleLimit: 1,
            gap: 0,
            minNumberOfVirtualItems: 3,
            mode: ScrollModes.FLOW,
            padding: 0,
            scaleLimits: { minimum: 1, maximum: 3 },
            touchScrollingEnabled: true
        }, options);

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
         * Scroll to the specified item in the list.
         * @method ScrollList#scrollTo
         * @param {Object} options
         //TOMTODO maybe call index itemIndex
         * @param {number} options.index - The index of the content to jump to.
         //TOMTODO Myabe call offset translation?
         * @param {{ x: number, y: number, type: string }} [options.offset] - An item-relative offset to position the viewport.  Type can be 'top' [default], center', or 'bottom').
         * @param {Function} [options.done] - Callback invoked when the jump is complete.
         */
        scrollToItem: function(options) {
            if (options.index === undefined) {
                throw new Error('ScrollList#scrollToItem: index is required.');
            }

            var panToOptions = {
                x: 0,
                y: 0,
                duration: Utils.valueOr(options.duration, 0),
                done: options.done
            };

            var self = this;
            var layout = this._layout;

            // Zoom item maps to default scale when scroll completes unless the
            // scroll is paused mid-stream, which can happen in peek mode.
            if (this._options.mode !== ScrollModes.FLOW) {
                panToOptions.done = function() {
                    var endState = self._listMap.getCurrentTransformState();
                    if (endState.translateX === panToOptions.x &&
                        endState.translateY === panToOptions.y) {

                        var currentItemIndex = layout.getCurrentItemIndex();
                        var itemRange = layout.getRenderedItemRange();
                        for (var i = itemRange.startIndex; i <= itemRange.endIndex; i++) {
                            if (i !== currentItemIndex) {
                                self.getItemMap(i).zoomTo({ scale: 1 });
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
            var targetIndex = Math.max(0, Math.min(options.index || 0, this._itemSizesCollection.getLength() - 1));
            var itemLayout = layout.getItemLayout(targetIndex);
            var listState = this._listMap.getCurrentTransformState();

            panToOptions.x = listState.translateX;
            panToOptions.y = -itemLayout.top * listState.scale;

            // If given a content offset within the item, place it at the center of the viewport.
            if (options.offset)
            {
                this._applyItemOffset(panToOptions, options.offset, itemLayout.scaleToFit);
            }



            this.onCurrentItemChanging.dispatch([this, {
                fromIndex: currentIndex,
                toIndex: targetIndex
            }]);

            // Render placeholders at the jump target if target is not rendered.
            var itemRange = layout.getRenderedItemRange();
            if (!itemRange || targetIndex < itemRange.startIndex || targetIndex > itemRange.endIndex) {
                layout.setScrollPosition({ top: panToOptions.y, left: panToOptions.x });
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
            (this.getCurrentItemMap() || this._listMap).zoomTo({
                scale: this._scaleTranslator.toMapScale(options.scale),
                duration: options.duration,
                done: options.done
            });
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
            this._scaleTranslator = new ScaleTranslator(this, this._listMap, 0);
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
                minNumberOfVirtualItems: options.minNumberOfVirtualItems,
                eagerRenderingFactor: isFlow ? 2 : 1,
                fit: options.fit,
                fitUpscaleLimit: options.fitUpscaleLimit,
                flow: isFlow,
                gap: options.gap,
                padding: options.padding,
            });

            this._layout.onCurrentItemIndexChanged(function(/*layout, args*/) {
                var currentItem = self.getCurrentItem();
                var itemIndex = currentItem.index;
                var placeholder = currentItem.placeholder;
                if (!isFlow) {
                    var itemMap = self._renderer.get(itemIndex).map;
                    self._scaleTranslator.attach(itemMap, itemIndex);
                }
                self.onCurrentItemChanged.dispatch([self, {
                    itemIndex: itemIndex,
                    placeholder: placeholder
                }]);
            });
        },

        /**
         * Companion method to `scrollToItem` responsible for positioning the viewport the item
         * position in the viewport as part of the scroll operation.
         */
        _applyItemOffset: function(panToOptions, offset, itemScaleToFit) {
            var viewportSize = this._layout.getViewportSize();
            //Top and bottom are absolutes, but center can change depending on the size of the viewport and scale. --tconnell 2014-07-03 15:34:39
            var getTranslation = function(scale) {
                if (offset.type === 'top') {
                    return {
                        x: panToOptions.x,
                        y: -offset.y
                    };
                }
                else if (offset.type === 'center') {
                    return {
                        x: (viewportSize.width / 2) - (itemScaleToFit * offset.x * scale),
                        y: (viewportSize.height / 2) - (itemScaleToFit * offset.y * scale),
                    };
                }
                else if (offset.type === 'bottom') {
                    return {
                        x: panToOptions.x,
                        y: viewportSize.height - offset.y
                    };
                }
            };

            var translation = {x: 0, y: 0};

            if (offset.type === 'top') {

                translation.y = -offset.y; //This may seem obscure.  When positioning from the top, we're actually moving the viewport off the screen by this much, so flip the sign.  --tconnell 2014-07-03 15:46:53
            }

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
        }
    };

    return ScrollList;
});
