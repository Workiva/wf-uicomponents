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

    var $ = require('jquery');
    var _ = require('lodash');
    var AwesomeMap = require('wf-js-uicomponents/awesome_map/AwesomeMap');
    var DestroyUtil = require('wf-js-common/DestroyUtil');
    var ItemSizeCollection = require('wf-js-uicomponents/layouts/ItemSizeCollection');
    var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');

    describe('ScrollList', function() {

        var defaultOptions;
        var $host = $('<div>').css({ position: 'absolute', top: -10000, width: 400, height: 400 });

        function createItemSizeCollection() {
            var itemSizes = [];
            for (var i = 0; i < 20; i++) {
                itemSizes.push({ width: 200, height: 200 });
            }
            var collection = new ItemSizeCollection({
                maxWidth: 200,
                maxHeight: 200,
                items: itemSizes
            });
            return collection;
        }

        function testScrollList(options, callback) {
            var scrollList;

            // options is an optional first parameter.
            if (!callback) {
                callback = options;
                options = {};
            }

            options = _.extend(defaultOptions, options);
            var itemSizeCollection = createItemSizeCollection();

            scrollList = new ScrollList($host[0], itemSizeCollection, options);
            scrollList.render();

            callback(scrollList);
        }

        beforeEach(function() {
            $host.empty().appendTo('body');

            defaultOptions = {
                eagerLoadFactor: 0
            };
        });

        afterEach(function() {
            $host.remove();
        });

        describe('configuration', function() {

            it('should require a host in the constructor', function() {
                expect(function() {
                    return new ScrollList(null, new ItemSizeCollection({ maxWidth: 1, maxHeight: 1 }));
                }).toThrow({
                    message: 'ScrollList configuration: host is required.'
                });
            });

            it('should require specifying item metadata in the constructor', function() {
                expect(function() {
                    return new ScrollList($host[0], null);
                }).toThrow({
                    message: 'ScrollList configuration: itemSizeCollection is required.'
                });
            });
        });

        describe('properties', function() {

            it('should get the current scale', function() {
                testScrollList(function(scrollList) {
                    var result;

                    spyOn(scrollList._scaleTranslator, 'fromMapScale').andReturn(5);
                    result = scrollList.getScale();

                    expect(scrollList._scaleTranslator.fromMapScale).toHaveBeenCalled();
                    expect(result).toBe(5);
                });
            });

            it('should get the current item map', function() {
                testScrollList(function(scrollList) {
                    var currentIndex = 99;
                    var map = {};
                    spyOn(scrollList._layout, 'getCurrentItemIndex').andReturn(currentIndex);
                    spyOn(scrollList, 'getItemMap').andReturn(map);

                    var itemMap = scrollList.getCurrentItemMap();

                    expect(scrollList.getItemMap).toHaveBeenCalledWith(currentIndex);
                    expect(itemMap).toBe(map);
                });
            });

            it('should get an item map', function() {
                testScrollList(function(scrollList) {
                    var renderer = scrollList._renderer;
                    var placeholder = { map: 'foo' };
                    var index = 1;

                    spyOn(renderer, 'get').andReturn(placeholder);

                    var itemMap = scrollList.getItemMap(index);

                    expect(renderer.get).toHaveBeenCalledWith(index);
                    expect(itemMap).toBe(placeholder.map);
                });
            });

            it('should get the list map', function() {
                testScrollList(function(scrollList) {
                    expect(scrollList.getListMap()).toBe(scrollList._listMap);
                });
            });

            it('should get whether the scroll list is disabled', function() {
                testScrollList(function(scrollList) {
                    expect(scrollList.isDisabled()).toBe(false);

                    scrollList.disable();
                    expect(scrollList.isDisabled()).toBe(true);

                    scrollList.enable();
                    expect(scrollList.isDisabled()).toBe(false);
                });
            });
        });

        describe('when disabling', function() {

            it('should disable the list map', function() {
                testScrollList(function(scrollList) {
                    var map = scrollList.getListMap();

                    spyOn(map, 'disable');
                    scrollList.disable();

                    expect(map.disable).toHaveBeenCalled();
                });
            });

            it('should disable the item map when in "peek" mode', function() {
                testScrollList({ mode: 'peek' }, function(scrollList) {
                    var map = scrollList.getCurrentItemMap();

                    spyOn(map, 'disable');
                    scrollList.disable();

                    expect(map.disable).toHaveBeenCalled();
                });
            });

            it('should disable the item map when in "single" mode', function() {
                testScrollList({ mode: 'single' }, function(scrollList) {
                    var map = scrollList.getCurrentItemMap();

                    spyOn(map, 'disable');
                    scrollList.disable();

                    expect(map.disable).toHaveBeenCalled();
                });
            });
        });

        describe('when disposing', function() {

            it('should dispose the renderer', function() {
                testScrollList(function(scrollList) {
                    var renderer = scrollList._renderer;

                    spyOn(renderer, 'dispose');
                    scrollList.dispose();

                    expect(renderer.dispose).toHaveBeenCalled();
                });
            });

            it('should dispose the layout', function() {
                testScrollList(function(scrollList) {
                    var layout = scrollList._layout;

                    spyOn(layout, 'dispose');
                    scrollList.dispose();

                    expect(layout.dispose).toHaveBeenCalled();
                });
            });

            it('should dispose the list map', function() {
                testScrollList(function(scrollList) {
                    var map = scrollList.getListMap();

                    spyOn(map, 'dispose');
                    scrollList.dispose();

                    expect(map.dispose).toHaveBeenCalled();
                });
            });

            it('should dispose all observables', function() {
                testScrollList(function(scrollList) {
                    var observables = [
                        scrollList.onContentRequested,
                        scrollList.onContentRemoved,
                        scrollList.onCurrentItemChanged,
                        scrollList.onCurrentItemChanging,
                        scrollList.onInteraction,
                        scrollList.onInteractionFinished,
                        scrollList.onInteractionStarted,
                        scrollList.onPlaceholderRendered,
                        scrollList.onScaleChanged
                    ];
                    var i, length = observables.length;

                    for (i = 0; i < length; i++) {
                        spyOn(observables[i], 'dispose');
                    }

                    scrollList.dispose();

                    for (i = 0; i < length; i++) {
                        expect(observables[i].dispose).toHaveBeenCalled();
                    }
                });
            });

            it('should destroy the instance', function() {
                testScrollList(function(scrollList) {
                    spyOn(DestroyUtil, 'destroy');

                    scrollList.dispose();

                    expect(DestroyUtil.destroy).toHaveBeenCalledWith(scrollList);
                });
            });
        });

        describe('when enabling', function() {

            it('should enable the list map', function() {
                testScrollList(function(scrollList) {
                    var map = scrollList.getListMap();

                    spyOn(map, 'enable');
                    scrollList.enable();

                    expect(map.enable).toHaveBeenCalled();
                });
            });

            it('should enable the item map when in "peek" mode', function() {
                testScrollList({ mode: 'peek' }, function(scrollList) {
                    var map = scrollList.getCurrentItemMap();

                    spyOn(map, 'enable');
                    scrollList.enable();

                    expect(map.enable).toHaveBeenCalled();
                });
            });

            it('should enable the item map when in "single" mode', function() {
                testScrollList({ mode: 'single' }, function(scrollList) {
                    var map = scrollList.getCurrentItemMap();

                    spyOn(map, 'enable');
                    scrollList.enable();

                    expect(map.enable).toHaveBeenCalled();
                });
            });
        });

        describe('getting visible item position data', function() {
            // NOTE: These are functional tests of other units.
            var VIEWPORT_WIDTH = 200;
            var VIEWPORT_HEIGHT = 300;
            var $host;

            beforeEach(function() {
                $host = $('<div>').css({
                    position: 'absolute',
                    left: -1000,
                    width: VIEWPORT_WIDTH,
                    height: VIEWPORT_HEIGHT
                }).appendTo('body');
            });

            afterEach(function() {
                $host.remove();
            });

            function setupTest(options) {
                var itemSizes = [];
                for (var i = 0, n = options.itemCount || 1; i < n; i++) {
                    itemSizes.push({ width: options.itemWidth, height: options.itemHeight });
                }

                var itemSizeCollection = new ItemSizeCollection({
                    maxWidth: options.itemWidth,
                    maxHeight: options.itemHeight,
                    items: itemSizes
                });

                var scrollList = new ScrollList($host[0], itemSizeCollection, {
                    padding: options.padding,
                    gap: options.gap
                });

                scrollList.zoomTo({ scale: options.zoomToScale });
                scrollList.scrollToPosition({ x: options.scrollToX, y: options.scrollToY });

                return scrollList;
            }

            it('should return viewport-relative item position data for all the items in the viewport', function() {
                var padding = 10;
                var gap = 10;
                // Ensure that the items fill the viewport, and the first item
                // with padding and gap fills the viewport completely.
                var itemWidth = VIEWPORT_WIDTH - padding * 2;
                var itemHeight = VIEWPORT_HEIGHT - padding * 2;
                // Zoom and scroll such that there is padding/gap from the first
                // item visible.
                var zoomToScale = 2;
                var scrollToX = 100;
                var scrollToY = 200;

                var scrollList = setupTest({
                    itemCount: 2,
                    padding: padding,
                    gap: gap,
                    itemWidth: itemWidth,
                    itemHeight: itemHeight,
                    zoomToScale: zoomToScale,
                    scrollToX: scrollToX,
                    scrollToY: scrollToY
                });

                var itemsInViewport = scrollList.getVisibleItemPositionData();
                expect(itemsInViewport.length).toBe(2);

                var firstItem = itemsInViewport[0];
                var expectedTop = (-scrollToY + padding) * zoomToScale;
                var expectedBottom = expectedTop + itemHeight * zoomToScale;
                var expectedLeft = (-scrollToX + padding) * zoomToScale;
                var expectedRight = expectedLeft + itemWidth * zoomToScale;
                expect(firstItem.top).toBe(expectedTop);
                expect(firstItem.bottom).toBe(expectedBottom);
                expect(firstItem.left).toBe(expectedLeft);
                expect(firstItem.right).toBe(expectedRight);
                expect(firstItem.scale).toBe(zoomToScale);
                expect(firstItem.itemIndex).toBe(0);

                var secondItem = itemsInViewport[1];
                expectedTop = expectedBottom + gap * zoomToScale;
                expectedBottom = expectedTop + itemHeight * zoomToScale;
                expect(secondItem.top).toBe(expectedTop);
                expect(secondItem.bottom).toBe(expectedBottom);
                expect(firstItem.left).toBe(expectedLeft);
                expect(firstItem.right).toBe(expectedRight);
                expect(secondItem.scale).toBe(zoomToScale);
                expect(secondItem.itemIndex).toBe(1);
            });

            it('should filter out items that are not in the viewport once accounting for padding', function() {
                var options = {
                    itemCount: 2,
                    padding: 10,
                    gap: 10
                };
                // Ensure that the items fill the viewport, and the first item
                // with padding and gap fills the viewport completely.
                options.itemWidth = VIEWPORT_WIDTH - options.padding * 2;
                options.itemHeight = VIEWPORT_HEIGHT - options.padding * 2;
                // Zoom and scroll such that there is padding/gap from the first
                // item visible.
                options.zoomToScale = 2;
                options.scrollToX = undefined;
                options.scrollToY = VIEWPORT_HEIGHT - options.gap / 2;

                var scrollList = setupTest(options);
                var itemsInViewport = scrollList.getVisibleItemPositionData();
                expect(itemsInViewport.length).toBe(1);
            });
        });

        describe('hit testing', function() {
            it('should get visible item positions and hit test against them', function() {
                testScrollList(function(scrollList) {
                    var item0Position = {
                        itemIndex: 0,
                        top: 10,
                        bottom: 100,
                        left: 20,
                        right: 200,
                        scale: 2
                    };
                    var item1Position = {
                        itemIndex: 1,
                        top: 110,
                        bottom: 200,
                        left: 20,
                        right: 200,
                        scale: 2
                    };
                    spyOn(scrollList, 'getVisibleItemPositionData').andReturn([
                        item0Position, item1Position
                    ]);

                    // Expect false when nothing is hit
                    var hitResult = scrollList.hitTest({ x: 0, y: 0 });
                    expect(hitResult).toBe(false);

                    // Expect position relative to actual item size for each item in view.
                    var point = { x: 100, y: 50 };
                    hitResult = scrollList.hitTest(point);
                    expect(hitResult).toEqual({
                        index: 0,
                        position: {
                            x: (point.x - item0Position.left) / item0Position.scale,
                            y: (point.y - item0Position.top) / item0Position.scale
                        }
                    });

                    point = { x: 50, y: 120 };
                    hitResult = scrollList.hitTest(point);
                    expect(hitResult).toEqual({
                        index: 1,
                        position: {
                            x: (point.x - item1Position.left) / item1Position.scale,
                            y: (point.y - item1Position.top) / item1Position.scale
                        }
                    });
                });
            });
        });

        describe('when inserting items', function() {
            it('should insert items into the layout', function() {
                testScrollList(function(scrollList) {
                    var layout = scrollList.getLayout();
                    spyOn(layout, 'insertItems');
                    var itemSizes = [{}];
                    scrollList.insertItems(0, itemSizes);
                    expect(layout.insertItems).toHaveBeenCalledWith(0, itemSizes);
                });
            });
            it('should update the rendered items', function() {
                testScrollList(function(scrollList) {
                    var renderer = scrollList.getRenderer();
                    spyOn(renderer, 'update');
                    var itemSizes = [{}];
                    scrollList.insertItems(0, itemSizes);
                    expect(renderer.update).toHaveBeenCalledWith(0, itemSizes.length);
                });
            });
            it('should set the content dimensions of the list map', function() {
                testScrollList(function(scrollList) {
                    var listMap = scrollList.getListMap();
                    spyOn(listMap, 'setContentDimensions');
                    var layout = scrollList.getLayout();
                    var layoutSize = {};
                    spyOn(layout, 'getSize').andReturn(layoutSize);
                    scrollList.insertItems(0, [{}]);
                    expect(listMap.setContentDimensions).toHaveBeenCalledWith(layoutSize);
                });
            });
            it('should transform the list map to keep the current items stationary', function() {
                testScrollList(function(scrollList) {
                    // Setup the layout to return a change in position for the current item.
                    var layout = scrollList.getLayout();
                    spyOn(layout, 'getCurrentItemIndex').andReturn(0);
                    var originalLayout = { top: 100, left: 10 };
                    var adjustedLayout = { top: 200, left: 20 };
                    spyOn(layout, 'getItemLayout').andCallFake(function(index) {
                        return (index === 0) ? originalLayout : adjustedLayout;
                    });
                    // Setup list map to return current transformation state
                    var listMap = scrollList.getListMap();
                    spyOn(listMap, 'transform');
                    var scale = 2;
                    spyOn(listMap, 'getScale').andReturn(scale);
                    var translation = { x: 10, y: 20 };
                    spyOn(listMap, 'getTranslation').andReturn(translation);
                    // Act and assert
                    scrollList.insertItems(0, [{}]);
                    expect(listMap.transform).toHaveBeenCalledWith({
                        x: translation.x + (originalLayout.left - adjustedLayout.left) * scale,
                        y: translation.y + (originalLayout.top - adjustedLayout.top) * scale,
                        scale: scale
                    });
                });
            });
            it('should dispatch "onItemsInserted"', function() {
                testScrollList(function(scrollList) {
                    spyOn(scrollList.onItemsInserted, 'dispatch');
                    scrollList.insertItems(0, [{}]);
                    expect(scrollList.onItemsInserted.dispatch).toHaveBeenCalledWith([scrollList, { count: 1 }]);
                });
            });
            it('should render the list', function() {
                testScrollList(function(scrollList) {
                    spyOn(scrollList, 'render');
                    scrollList.insertItems(0, [{}]);
                    expect(scrollList.render).toHaveBeenCalled();
                });
            });
        });

        describe('when getting the current item', function() {

            it('should return index and placeholder', function() {
                testScrollList(function(scrollList) {
                    var currentIndex = 1;
                    spyOn(scrollList._layout, 'getCurrentItemIndex').andReturn(currentIndex);

                    var item = scrollList.getCurrentItem();
                    expect(item.index).toBe(1);
                    expect(item.placeholder).toBeDefined();
                });
            });

            it('should return an undefined placholder when the item is not rendered', function() {
                testScrollList(function(scrollList) {
                    var currentIndex = 1;
                    spyOn(scrollList._layout, 'getCurrentItemIndex').andReturn(currentIndex);
                    spyOn(scrollList._renderer, 'get').andReturn(undefined);

                    var item = scrollList.getCurrentItem();
                    expect(item.index).toBe(1);
                    expect(item.placeholder).toBeUndefined();
                });
            });
        });

        describe('when refreshing', function() {

            it('should clear the layout', function() {
                testScrollList(function(scrollList) {
                    spyOn(scrollList._layout, 'clear');
                    scrollList.refresh();

                    expect(scrollList._layout.clear).toHaveBeenCalled();
                });
            });

            it('should measure the layout', function() {
                testScrollList(function(scrollList) {
                    spyOn(scrollList._layout, 'measure');
                    scrollList.refresh();

                    expect(scrollList._layout.measure).toHaveBeenCalled();
                });
            });

            it('should refresh the renderer', function() {
                testScrollList(function(scrollList) {
                    var renderer = scrollList.getRenderer();
                    spyOn(renderer, 'refresh');
                    scrollList.refresh();

                    expect(renderer.refresh).toHaveBeenCalled();
                });
            });

            it('should clear the list map content', function() {
                testScrollList(function(scrollList) {
                    var map = scrollList.getListMap();

                    spyOn(map, 'clearContent');
                    scrollList.refresh();

                    expect(map.clearContent).toHaveBeenCalled();
                });
            });

            it('should invalidate the list map viewport dimensions', function() {
                testScrollList(function(scrollList) {
                    var map = scrollList.getListMap();

                    spyOn(map, 'invalidateViewportDimensions');
                    scrollList.refresh();

                    expect(map.invalidateViewportDimensions).toHaveBeenCalled();
                });
            });

            it('should set the list map content dimensions to the size of the layout', function() {
                testScrollList(function(scrollList) {
                    var map = scrollList.getListMap();
                    var size = { width: 100, height: 200 };

                    spyOn(scrollList._layout, 'getSize').andReturn(size);
                    spyOn(map, 'setContentDimensions');
                    scrollList.refresh();

                    expect(map.setContentDimensions).toHaveBeenCalledWith(size);
                });
            });

            it('should reattach the scale translator', function() {
                testScrollList(function(scrollList) {
                    var scaleTranslator = scrollList.getScaleTranslator();
                    spyOn(scaleTranslator, 'attach');
                    scrollList.refresh();
                    var listMap = scrollList.getListMap();
                    expect(scaleTranslator.attach).toHaveBeenCalledWith(listMap, 0);
                });
            });

            it('should pan the list map to the previous top position', function() {
                testScrollList(function(scrollList) {
                    var map = scrollList.getListMap();
                    var listState = {
                        translateX: -100,
                        translateY: -200,
                        scale: 2
                    };
                    var contentDimensionsCallCount = 0;
                    var contentDimensionsCallResults = [
                        { height: 1000 },
                        { height: 2000 }
                    ];

                    spyOn(map, 'panTo');
                    spyOn(map, 'getCurrentTransformState').andReturn(listState);
                    spyOn(map, 'setContentDimensions');
                    spyOn(map, 'getContentDimensions').andCallFake(function() {
                        return contentDimensionsCallResults[contentDimensionsCallCount++];
                    });

                    scrollList.refresh();

                    expect(map.panTo).toHaveBeenCalledWith({
                        x: listState.translateX,
                        y: -400,
                        duration: 0
                    });
                });
            });
        });

        describe('when rendering', function() {

            it('should have the layout render itself', function() {
                testScrollList(function(scrollList) {
                    var layout = scrollList._layout;

                    spyOn(layout, 'render');
                    scrollList.render();

                    expect(layout.render).toHaveBeenCalled();
                });
            });

            it('should have the layout load content', function() {
                testScrollList(function(scrollList) {
                    var layout = scrollList._layout;

                    spyOn(layout, 'loadContent');
                    scrollList.render();

                    expect(layout.loadContent).toHaveBeenCalled();
                });
            });
        });

        describe('when scrolling to index', function() {

            it('should require an index', function() {
                testScrollList(function(scrollList) {
                    expect(function() {
                        scrollList.scrollToItem({});
                    }).toThrow('ScrollList#scrollToItem: index is required.');
                });
            });

            it('should guard against index less than zero', function() {
                testScrollList(function(scrollList) {
                    spyOn(scrollList._layout, 'getItemLayout').andReturn({ top: 0 });
                    scrollList.scrollToItem({ index: -1 });

                    expect(scrollList._layout.getItemLayout).toHaveBeenCalledWith(0);
                });
            });

            it('should guard against index greater than the number of items', function() {
                testScrollList(function(scrollList) {
                    var numberOfItems = scrollList.getItemSizeCollection().getLength();

                    spyOn(scrollList._layout, 'getItemLayout').andReturn({ top: 0 });
                    scrollList.scrollToItem({ index: numberOfItems });

                    expect(scrollList._layout.getItemLayout).toHaveBeenCalledWith(numberOfItems - 1);
                });
            });

            it('should dispatch "onCurrentItemChanging"', function() {
                testScrollList(function(scrollList) {
                    spyOn(scrollList.onCurrentItemChanging, 'dispatch');
                    spyOn(scrollList._layout, 'getCurrentItemIndex').andReturn(1);
                    scrollList.scrollToItem({ index: 2 });

                    expect(scrollList.onCurrentItemChanging.dispatch).toHaveBeenCalledWith([
                        scrollList,
                        { fromIndex: 1, toIndex: 2 }
                    ]);
                });
            });

            it('should render placeholders at the scroll target if absent', function() {
                testScrollList(function(scrollList) {
                    var map = scrollList.getListMap();
                    var currentState = { translateX: 10, scale: 2 };
                    var itemLayout = { top: 100, scaleToFit: 1 };
                    var layout = scrollList.getLayout();

                    spyOn(map, 'panTo');
                    spyOn(map, 'getCurrentTransformState').andReturn(currentState);
                    spyOn(layout, 'getItemLayout').andReturn(itemLayout);
                    spyOn(layout, 'getRenderedItemRange').andReturn({ startIndex: 0, endIndex: 5 });
                    spyOn(layout, 'setScrollPosition');
                    spyOn(layout, 'render');

                    scrollList.scrollToItem({ index: 10 });

                    expect(layout.setScrollPosition).toHaveBeenCalledWith({
                        top: -(-itemLayout.top * currentState.scale),
                        left: -currentState.translateX
                    });
                    expect(layout.render).toHaveBeenCalled();
                });
            });

            it('should pan the list map to the top of the target item layout', function() {
                testScrollList(function(scrollList) {
                    var done = function() {};
                    var map = scrollList.getListMap();
                    var currentState = { translateX: 10, scale: 2 };
                    var itemLayout = { top: 100, scaleToFit: 1 };

                    spyOn(map, 'panTo');
                    spyOn(map, 'getCurrentTransformState').andReturn(currentState);
                    spyOn(scrollList._layout, 'getItemLayout').andReturn(itemLayout);

                    scrollList.scrollToItem({
                        index: 2,
                        done: done
                    });

                    expect(map.panTo).toHaveBeenCalledWith({
                        x: currentState.translateX,
                        currentX: currentState.translateX,
                        y: -itemLayout.top * currentState.scale,
                        duration: 0,
                        done: jasmine.any(Function)
                    });
                });
            });

            it('should pan to 0,0 for first page', function() {
                testScrollList(function(scrollList) {
                    var done = function() {};
                    var map = scrollList.getListMap();
                    var currentState = { translateX: 0, scale: 2 };
                    var itemLayout = {
                        bottom: 419,
                        height: 398,
                        itemIndex: 0,
                        left: 300,
                        offsetLeft: 5,
                        offsetTop: 5,
                        outerHeight: 419,
                        outerWidth: 687,
                        paddingBottom: 5,
                        paddingLeft: 16,
                        paddingRight: 16,
                        paddingTop: 16,
                        right: 687,
                        scaleToFit: 0.6498015873015873,
                        top: 0,
                        width: 655
                    };

                    spyOn(map, 'panTo');
                    spyOn(map, 'getCurrentTransformState').andReturn(currentState);
                    spyOn(scrollList._layout, 'getItemLayout').andReturn(itemLayout);

                    scrollList.scrollToItem({
                        index: 1,
                        done: done
                    });

                    expect(map.panTo).toHaveBeenCalledWith({
                        x: 0,
                        currentX: 0,
                        y: 0,
                        duration: 0,
                        done: jasmine.any(Function)
                    });
                });
            });

            describe('when scrolling in other than "flow" mode', function() {
                it('should reset the zoom and position of all out of view item maps when the scroll completes', function() {
                    // Make sure the viewport is shorter than the items so that
                    // they overflow vertically.
                    $host.css({ height: 100 });
                    testScrollList({ mode: '!flow', fit: 'width' }, function(scrollList) {
                        var listMap = scrollList._listMap;

                        // Expect that we panned the list map.
                        spyOn(listMap, 'panTo');
                        scrollList.scrollToItem({ index: 2 });
                        expect(listMap.panTo).toHaveBeenCalled();

                        // Mock state during invocation of done and invoke.
                        var itemRange = { startIndex: 0, endIndex: 4 };
                        var itemMaps = [];
                        (function() {
                            for (var i = itemRange.startIndex; i <= itemRange.endIndex; i++) {
                                var map = _.extend({}, AwesomeMap.prototype);
                                spyOn(map, 'zoomTo');
                                spyOn(map, 'panTo');
                                itemMaps.push(map);
                            }
                        }());
                        var layout = scrollList.getLayout();
                        var currentIndexAfterScroll = 2;
                        var panToOptions = listMap.panTo.calls[0].args[0];

                        spyOn(listMap, 'getCurrentTransformState').andReturn({
                            translateX: panToOptions.x,
                            translateY: panToOptions.y
                        });
                        spyOn(layout, 'getCurrentItemIndex').andReturn(currentIndexAfterScroll);
                        spyOn(layout, 'getRenderedItemRange').andReturn(itemRange);
                        spyOn(scrollList, 'getItemMap').andCallFake(function(index) {
                            return itemMaps[index];
                        });

                        expect(panToOptions.done).toBeDefined();
                        panToOptions.done();

                        // Now assert.
                        for (var i = itemRange.startIndex; i <= itemRange.endIndex; i++) {
                            var itemMap = itemMaps[i];
                            expect(itemMap).toBeDefined();
                            if (i === currentIndexAfterScroll) {
                                expect(itemMap.zoomTo).not.toHaveBeenCalled();
                            }
                            else {
                                expect(itemMap.zoomTo).toHaveBeenCalledWith({ scale: 1 });
                                if (i < currentIndexAfterScroll) {
                                    expect(itemMap.panTo).toHaveBeenCalledWith({ y: -100 });
                                }
                                else {
                                    expect(itemMap.panTo).toHaveBeenCalledWith({ y: 0 });
                                }
                            }
                        }
                    });
                });
            });

            describe('with offset', function() {
                var pageSize = 500;  // This value could be variable per-page in real life.
                var scale = 2;
                // This math is complicated enough, I am keeping scaleToFit at 1
                // for now, but it could easily be something else in practice.
                var scaleToFit = 1;
                var itemIndex = 2;
                var itemLayout = { top: pageSize * itemIndex, scaleToFit: scaleToFit };
                var viewportSize = { width: 200, height: 400 };
                var offset = { x: 100, y: 200 };
                var createScrollList = function(options) {
                    var scrollList;
                    testScrollList(options, function(newScrollList) {
                        scrollList = newScrollList;
                        spyOn(scrollList._layout, 'getItemLayout').andReturn(itemLayout);
                        spyOn(scrollList._layout, 'getViewportSize').andReturn(viewportSize);
                    });
                    return scrollList;
                };

                describe('viewportAnchorLocation is center', function() {
                    it('should pass centering coords to listmap.panTo in flow mode', function() {
                        var scrollList = createScrollList({ mode: 'flow' });
                        var map = scrollList.getListMap();
                        var currentState = { translateX: 0, scale: scale };

                        spyOn(map, 'panTo');
                        spyOn(map, 'getCurrentTransformState').andReturn(currentState);

                        scrollList.scrollToItem({
                            index: itemIndex,
                            duration: 0,
                            viewportAnchorLocation: 'center',
                            offset: { x: offset.x, y: offset.y }
                        });

                        expect(map.panTo).toHaveBeenCalledWith({
                            x: -(offset.x * scale * scaleToFit) + (viewportSize.width / 2),
                            currentX: 0,
                            y: -(itemIndex * pageSize * scale * scaleToFit) -
                               (offset.y * scale * scaleToFit) + (viewportSize.height / 2),
                            duration: 0,
                            done: jasmine.any(Function)
                        });
                    });

                    it('should pass centering coords to listmap.panTo in other modes', function() {
                        var scrollList = createScrollList({ mode: 'peek' });
                        var listMap = scrollList.getListMap();
                        var listState = { translateX: 0, scale: scale };
                        var itemMap = scrollList.getCurrentItemMap();
                        var itemState = { scale: scale };

                        spyOn(listMap, 'panTo').andCallFake(function(options) {
                            options.done();
                        });
                        spyOn(listMap, 'getCurrentTransformState').andReturn(listState);

                        spyOn(itemMap, 'panTo');
                        spyOn(itemMap, 'getCurrentTransformState').andReturn(itemState);

                        spyOn(scrollList._layout, 'render');

                        scrollList.scrollToItem({
                            index: itemIndex,
                            duration: 0,
                            viewportAnchorLocation: 'center',
                            offset: { x: offset.x, y: offset.y }
                        });

                        expect(listMap.panTo).toHaveBeenCalledWith({
                            x: 0,
                            currentX: 0,
                            y: -(itemIndex * pageSize * scale * scaleToFit),
                            duration: 0,
                            done: jasmine.any(Function)
                        });

                        expect(itemMap.panTo).toHaveBeenCalledWith({
                            x: -(offset.x * scale * scaleToFit) + (viewportSize.width / 2),
                            y: -(offset.y * scale * scaleToFit) + (viewportSize.height / 2),
                            duration: 0,
                            done: jasmine.any(Function)
                        });
                    });
                });

                describe('viewportAnchorLocation is top', function() {
                    it('should pass coords to listmap.panTo that will place the offset ' +
                       'within the item at the top of the viewport in flow mode', function() {
                        var scrollList = createScrollList({ mode: 'flow' });
                        var map = scrollList.getListMap();
                        var currentState = { translateX: 0, scale: scale };

                        spyOn(map, 'panTo');
                        spyOn(map, 'getCurrentTransformState').andReturn(currentState);

                        scrollList.scrollToItem({
                            index: itemIndex,
                            duration: 0,
                            viewportAnchorLocation: 'top',
                            offset: { x: offset.x, y: offset.y } // x should have no effect.
                        });

                        expect(map.panTo).toHaveBeenCalledWith({
                            x: 0,
                            currentX: 0,
                            y: -(itemIndex * pageSize * scale * scaleToFit) -
                               (offset.y * scale * scaleToFit),
                            duration: 0,
                            done: jasmine.any(Function)
                        });
                    });
                    it('should pass coords to listmap.panTo that will place the offset ' +
                       'within the item at the top of the viewport in other modes', function() {
                        var scrollList = createScrollList({ mode: 'peek' });
                        var listMap = scrollList.getListMap();
                        var listState = { translateX: 0, scale: scale };
                        var itemMap = scrollList.getCurrentItemMap();
                        var itemState = { scale: scale };

                        spyOn(listMap, 'panTo').andCallFake(function(options) {
                            options.done();
                        });
                        spyOn(listMap, 'getCurrentTransformState').andReturn(listState);

                        spyOn(itemMap, 'panTo');
                        spyOn(itemMap, 'getCurrentTransformState').andReturn(itemState);

                        spyOn(scrollList._layout, 'render');

                        scrollList.scrollToItem({
                            index: itemIndex,
                            duration: 0,
                            viewportAnchorLocation: 'top',
                            offset: { x: offset.x, y: offset.y }
                        });

                        expect(listMap.panTo).toHaveBeenCalledWith({
                            x: 0,
                            currentX: 0,
                            y: -(itemIndex * pageSize * scale * scaleToFit),
                            duration: 0,
                            done: jasmine.any(Function)
                        });

                        expect(itemMap.panTo).toHaveBeenCalledWith({
                            x: 0,
                            y: -(offset.y * scale * scaleToFit) ,
                            duration: 0,
                            done: jasmine.any(Function)
                        });
                    });
                });

                describe('viewportAnchorLocation is bottom', function() {
                    it('should call listmap.panTo with coordinates that place the offset ' +
                       'within the item at the bottom of the viewport in flow mode', function() {
                        var scrollList = createScrollList({ mode: 'flow' });
                        var map = scrollList.getListMap();
                        var currentState = { translateX: 0, scale: scale };

                        spyOn(map, 'panTo');
                        spyOn(map, 'getCurrentTransformState').andReturn(currentState);

                        scrollList.scrollToItem({
                            index: itemIndex,
                            duration: 0,
                            viewportAnchorLocation: 'bottom',
                            offset: { x: offset.x, y: offset.y } // x should have no effect.
                        });

                        expect(map.panTo).toHaveBeenCalledWith({
                            x: 0,
                            currentX: 0,
                            y: -(itemIndex * pageSize * scale * scaleToFit) -
                              (offset.y * scale * scaleToFit) + viewportSize.height,
                            duration: 0,
                            done: jasmine.any(Function)
                        });
                    });
                    it('should call listmap.panTo with coordinates that place the offset ' +
                       'within the item at the bottom of the viewport in other modes', function() {
                        var scrollList = createScrollList({ mode: 'peek' });
                        var listMap = scrollList.getListMap();
                        var listState = { translateX: 0, scale: scale };
                        var itemMap = scrollList.getCurrentItemMap();
                        var itemState = { scale: scale };

                        spyOn(listMap, 'panTo').andCallFake(function(options) {
                            options.done();
                        });
                        spyOn(listMap, 'getCurrentTransformState').andReturn(listState);

                        spyOn(itemMap, 'panTo');
                        spyOn(itemMap, 'getCurrentTransformState').andReturn(itemState);

                        spyOn(scrollList._layout, 'render');

                        scrollList.scrollToItem({
                            index: itemIndex,
                            duration: 0,
                            viewportAnchorLocation: 'bottom',
                            offset: { x: offset.x, y: offset.y }
                        });

                        expect(listMap.panTo).toHaveBeenCalledWith({
                            x: 0,
                            currentX: 0,
                            y: -(itemIndex * pageSize * scale * scaleToFit),
                            duration: 0,
                            done: jasmine.any(Function)
                        });

                        expect(itemMap.panTo).toHaveBeenCalledWith({
                            x: 0,
                            y: -(offset.y * scale * scaleToFit) + viewportSize.height,
                            duration: 0,
                            done: jasmine.any(Function)
                        });
                    });
                });
            });
        });

        describe('when scrolling to position', function() {
            var listMap;
            var listState;
            var layout;
            var listSize;
            var viewportSize;
            function setup(scrollList) {
                // Setup spy to return some value for current translateX.
                listMap = scrollList.getListMap();
                listState = { translateX: -100, translateY: -100, scale: 2 };
                spyOn(listMap, 'getCurrentTransformState').andReturn(listState);
                // Setup spies to return sizes used to calculate boundary positions.
                layout = scrollList.getLayout();
                listSize = { width: 1000, height: 1000 };
                viewportSize = { width: 100, height: 100 };
                spyOn(layout, 'getSize').andReturn(listSize);
                spyOn(layout, 'getViewportSize').andReturn(viewportSize);
                // Spy on the listMap.panTo; it's the target of the method.
                spyOn(listMap, 'panTo');
            }
            it('should throw if not in "flow" mode', function() {
                testScrollList({ mode: '!flow' }, function(scrollList) {
                    expect(function() {
                        scrollList.scrollToPosition();
                    }).toThrow('ScrollList#scrollToPosition is only available in "flow" mode.');
                });
            });
            it('should require either an x or y option', function() {
                testScrollList({ mode: 'flow' }, function(scrollList) {
                    expect(function() {
                        scrollList.scrollToPosition({ x: 0, y: 0 });
                    }).not.toThrow();
                    expect(function() {
                        scrollList.scrollToPosition({ x: 0 });
                    }).not.toThrow();
                    expect(function() {
                        scrollList.scrollToPosition({ y: 0 });
                    }).not.toThrow();
                    expect(function() {
                        scrollList.scrollToPosition();
                    }).toThrow('ScrollList#scrollToPosition: x or y is required.');
                });
            });
            it('should use to the current x if x is not specified', function() {
                testScrollList({ mode: 'flow' }, function(scrollList) {
                    setup(scrollList);
                    scrollList.scrollToPosition({ y: 100 });
                    expect(listMap.panTo.mostRecentCall.args[0].x).toBe(listState.translateX);
                });
            });
            it('should use to the current y if y is not specified', function() {
                testScrollList({ mode: 'flow' }, function(scrollList) {
                    setup(scrollList);
                    scrollList.scrollToPosition({ x: 100 });
                    expect(listMap.panTo.mostRecentCall.args[0].y).toBe(listState.translateY);
                });
            });
            it('should constrain x to valid values', function() {
                testScrollList({ mode: 'flow' }, function(scrollList) {
                    setup(scrollList);

                    scrollList.scrollToPosition({ x: 2000 });
                    expect(listMap.panTo.mostRecentCall.args[0].x)
                        .toBe(viewportSize.width - listSize.width * listState.scale);

                    scrollList.scrollToPosition({ x: -100 });
                    expect(listMap.panTo.mostRecentCall.args[0].x).toBe(0);
                });
            });
            it('should constrain y to valid values', function() {
                testScrollList({ mode: 'flow' }, function(scrollList) {
                    setup(scrollList);

                    scrollList.scrollToPosition({ y: 1000 });
                    expect(listMap.panTo.mostRecentCall.args[0].y)
                        .toBe(viewportSize.height - listSize.height * listState.scale);

                    scrollList.scrollToPosition({ y: -100 });
                    expect(listMap.panTo.mostRecentCall.args[0].y).toBe(0);
                });
            });
            it('should render placeholders at target position if not rendered', function() {
                testScrollList({ mode: 'flow' }, function(scrollList) {
                    setup(scrollList);

                    // Need to spy on the layout since it will do the predictive rendering.
                    var positionToRender = { top: 0, bottom: 100, left: 0, right: 100 };
                    spyOn(layout, 'getPositionToRender').andReturn(positionToRender);
                    spyOn(layout, 'setScrollPosition');
                    spyOn(layout, 'render');

                    // Vertical support:
                    scrollList.scrollToPosition({ y: 200 });
                    expect(layout.setScrollPosition.mostRecentCall.args[0].top).toBe(400);
                    expect(layout.render.calls.length).toBe(1);

                    // Horizontal support:
                    scrollList.scrollToPosition({ x: 300 });
                    expect(layout.setScrollPosition.mostRecentCall.args[0].left).toBe(600);
                    expect(layout.render.calls.length).toBe(2);
                });
            });
            it('should pan the list map', function() {
                testScrollList({ mode: 'flow' }, function(scrollList) {
                    setup(scrollList);
                    var options = { x: 100, y: 100, done: function() {} };
                    scrollList.scrollToPosition(options);
                    expect(listMap.panTo).toHaveBeenCalledWith({
                        x: -options.x * listState.scale,
                        y: -options.y * listState.scale,
                        done: options.done
                    });
                });
            });
        });

        describe('when zooming', function() {

            function testZoomTo(scrollList, targetMap) {
                var translator = scrollList._scaleTranslator;
                var scale = 2;
                var translatedScale = 99;
                var duration = 1000;
                var done = function() {};

                spyOn(translator, 'toMapScale').andReturn(translatedScale);
                spyOn(targetMap, 'zoomTo');

                scrollList.zoomTo({ scale: scale, duration: duration, done: done});

                expect(translator.toMapScale).toHaveBeenCalledWith(scale);
                expect(targetMap.zoomTo).toHaveBeenCalledWith({
                    scale: translatedScale,
                    duration: duration,
                    done: done
                });
            }

            it('should zoom the list map to translated scale when in flow mode', function() {
                testScrollList({ mode: 'flow' }, function(scrollList) {
                    testZoomTo(scrollList, scrollList.getListMap());
                });
            });

            it('should zoom the item map to translated scale when in peek mode', function() {
                testScrollList({ mode: 'peek' }, function(scrollList) {
                    testZoomTo(scrollList, scrollList.getCurrentItemMap());
                });
            });

            it('should zoom the item map to translated scale when in single mode', function() {
                testScrollList({ mode: 'single' }, function(scrollList) {
                    testZoomTo(scrollList, scrollList.getCurrentItemMap());
                });
            });
        });

        describe('when snapping a position to a particular list item', function() {
            var expectedBuffer = 1; // bump 1 pixel inside the container edge
            var mockListItemElementRect;
            function setup(scrollList) {
                mockListItemElementRect = {
                    left: 100,
                    right: 950,
                    top: 250,
                    bottom: 1350
                };
                var mockContentContainer = {
                    getBoundingClientRect: function() {
                        return mockListItemElementRect;
                    }
                };
                var mockPlaceholder = {
                    contentContainer: mockContentContainer
                };
                var mockPlaceholderRenderer = {
                    get: function() {
                        return mockPlaceholder;
                    }
                };
                spyOn(scrollList, 'getRenderer').andReturn(mockPlaceholderRenderer);
            }
            it('should return the original position if it is already over the item', function() {
                testScrollList(function(scrollList) {
                    setup(scrollList);
                    var positionOnItem = { x: 500, y: 300 };
                    var position = scrollList.restrictPositionToItemContainer(0, positionOnItem);
                    expect(position.x).toEqual(positionOnItem.x);
                    expect(position.y).toEqual(positionOnItem.y);
                });
            });
            it('should return a postion inside the left edge of the item container when left of it', function() {
                testScrollList(function(scrollList){
                    setup(scrollList);
                    var positionLeftOfItem = { x: 0, y: 300 };
                    var position = scrollList.restrictPositionToItemContainer(0, positionLeftOfItem);
                    expect(position.x).toEqual(mockListItemElementRect.left + expectedBuffer);
                    expect(position.y).toEqual(positionLeftOfItem.y);
                });
            });
            it('should return a postion inside the right edge of the item container when right of it', function() {
                testScrollList(function(scrollList){
                    setup(scrollList);
                    var positionRightOfItem = { x: 1000, y: 300 };
                    var position = scrollList.restrictPositionToItemContainer(0, positionRightOfItem);
                    expect(position.x).toEqual(mockListItemElementRect.right - expectedBuffer);
                    expect(position.y).toEqual(positionRightOfItem.y);
                });
            });
            it('should return a postion inside the top edge of the item container when above it', function() {
                testScrollList(function(scrollList){
                    setup(scrollList);
                    var positionAboveItem = { x: 500, y: 0 };
                    var position = scrollList.restrictPositionToItemContainer(0, positionAboveItem);
                    expect(position.x).toEqual(positionAboveItem.x);
                    expect(position.y).toEqual(mockListItemElementRect.top + expectedBuffer);
                });
            });
            it('should return a postion inside the bottom edge of the item container when below it', function() {
                testScrollList(function(scrollList){
                    setup(scrollList);
                    var positionBelowItem = { x: 500, y: 1500 };
                    var position = scrollList.restrictPositionToItemContainer(0, positionBelowItem);
                    expect(position.x).toEqual(positionBelowItem.x);
                    expect(position.y).toEqual(mockListItemElementRect.bottom - expectedBuffer);
                });
            });
        });

        describe('when snapping a postion to the nearest item container', function() {
            describe('when in single or peek mode', function() {
                var mockPostionOverItem;
                var currentItemIndex = 5;
                function setup(scrollList) {
                    mockPostionOverItem = { x: 100, y: 100 };
                    spyOn(scrollList, 'restrictPositionToItemContainer').andReturn(mockPostionOverItem);
                    var mockVerticalLayout = {
                        getCurrentItemIndex: function() {
                            return currentItemIndex;
                        }
                    };
                    spyOn(scrollList, 'getLayout').andReturn(mockVerticalLayout);
                }
                it('should compute a the nearest position on the current item container', function() {
                    testScrollList({ mode: 'peek' }, function(scrollList) {
                        setup(scrollList);
                        var position = { x: 0, y: 0 };
                        var positionOnItem = scrollList.restrictPositionToNearestItem(position);
                        expect(scrollList.restrictPositionToItemContainer).toHaveBeenCalledWith(
                            currentItemIndex, position
                        );
                        expect(positionOnItem).toBe(mockPostionOverItem);
                    });
                });
            });

            describe('when in flow mode', function() {
                var mockPlaceholders;
                var mockPositions = [
                    { position: 'on item container one' },
                    { position: 'on item container two' },
                    { position: 'on item container three' }
                ];
                function createPlaceholder(left, right, top, bottom) {
                    var mockListItemElementRect = {
                        left: left,
                        right: right,
                        top: top,
                        bottom: bottom
                    };
                    var mockContentContainer = {
                        getBoundingClientRect: function() {}
                    };
                    spyOn(mockContentContainer, 'getBoundingClientRect').andReturn(
                        mockListItemElementRect
                    );
                    var mockPlaceholder = {
                        contentContainer: mockContentContainer
                    };
                    return mockPlaceholder;
                }
                function setup(scrollList) {
                    var itemOnePlaceholder = createPlaceholder(10, 60, 10, 90);
                    var itemTwoPlaceholder = createPlaceholder(10, 60, 110, 190);
                    var itemThreePlaceholder = createPlaceholder(10, 60, 210, 290);
                    mockPlaceholders = [
                        itemOnePlaceholder, itemTwoPlaceholder, itemThreePlaceholder
                    ];
                    var mockPlaceholderRenderer = {
                        get: function(/*itemIndex*/) {}
                    };
                    spyOn(mockPlaceholderRenderer, 'get').andCallFake(function(itemIndex) {
                        return mockPlaceholders[itemIndex];
                    });
                    var mockVerticalLayout = {
                        getRenderedItemRange: function() {
                            return {
                                startIndex: 0,
                                endIndex: 2
                            };
                        }
                    };
                    spyOn(scrollList, 'getLayout').andReturn(mockVerticalLayout);
                    spyOn(scrollList, 'getRenderer').andReturn(mockPlaceholderRenderer);
                    spyOn(scrollList, 'restrictPositionToItemContainer').andCallFake(
                        function(itemIndex) {
                            return mockPositions[itemIndex];
                        }
                    );
                }
                it('should return the original position when event is over an item', function() {
                    testScrollList({ mode: 'flow' }, function(scrollList){
                        setup(scrollList);
                        var position = { x: 30, y: 150 };
                        var updatedPosition = scrollList.restrictPositionToNearestItem(position);
                        expect(updatedPosition).toBe(position);
                    });
                });
                it('should return a position on the first item container when event is above it', function() {
                    testScrollList({ mode: 'flow' }, function(scrollList){
                        setup(scrollList);
                        var position = { x: 30, y: -5 };
                        var updatedPosition = scrollList.restrictPositionToNearestItem(position);
                        expect(updatedPosition).toBe(mockPositions[0]);
                    });
                });
                it('should return a position on the final item container when event is below it', function() {
                    testScrollList({ mode: 'flow' }, function(scrollList){
                        setup(scrollList);
                        var position = { x: 30, y: 500 };
                        var updatedPosition = scrollList.restrictPositionToNearestItem(position);
                        expect(updatedPosition).toBe(mockPositions[2]);
                    });
                });
                it('should return a position on the item container to the left of the event', function() {
                    testScrollList({ mode: 'flow' }, function(scrollList){
                        setup(scrollList);
                        var position = { x: 500, y: 150 };
                        var updatedPosition = scrollList.restrictPositionToNearestItem(position);
                        expect(updatedPosition).toBe(mockPositions[1]);
                    });
                });
                it('should return a position on the item container to the right of the event', function() {
                    testScrollList({ mode: 'flow' }, function(scrollList){
                        setup(scrollList);
                        var position = { x: -50, y: 50 };
                        var updatedPosition = scrollList.restrictPositionToNearestItem(position);
                        expect(updatedPosition).toBe(mockPositions[0]);
                    });
                });
                it('should return a position on the nearer container below the event', function() {
                    testScrollList({ mode: 'flow' }, function(scrollList){
                        setup(scrollList);
                        var position = { x: 30, y: 201 };
                        var updatedPosition = scrollList.restrictPositionToNearestItem(position);
                        expect(updatedPosition).toBe(mockPositions[2]);
                    });
                });
                it('should return a position on the nearer container above the event', function() {
                    testScrollList({ mode: 'flow' }, function(scrollList){
                        setup(scrollList);
                        var position = { x: 30, y: 199 };
                        var updatedPosition = scrollList.restrictPositionToNearestItem(position);
                        expect(updatedPosition).toBe(mockPositions[1]);
                    });
                });
            });
        });
    });
});
