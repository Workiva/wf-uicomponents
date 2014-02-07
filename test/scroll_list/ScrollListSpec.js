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
    var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');

    describe('ScrollList', function() {

        var defaultOptions;
        var $host = $('<div>').css({ position: 'absolute', top: -10000, width: 400, height: 400 });
        var items = (function() {
            var result = [];
            for (var i = 0; i < 20; i++) {
                result.push({ width: 200, height: 200 });
            }
            return result;
        }());

        function testScrollList(options, callback) {
            var scrollList;

            // options is an optional first parameter.
            if (!callback) {
                callback = options;
                options = {};
            }

            options = _.extend(defaultOptions, options);

            scrollList = new ScrollList($host[0], items, options);
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
                    return new ScrollList(null, items);
                }).toThrow({
                    message: 'ScrollList configuration: host is required.'
                });
            });

            it('should require specifying item metadata in the constructor', function() {
                expect(function() {
                    return new ScrollList($host[0], null);
                }).toThrow({
                    message: 'ScrollList configuration: items is required.'
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

            it('should get the configured item metadata', function() {
                testScrollList(function(scrollList) {
                    expect(scrollList.getItemMetadata()).toBe(items);
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

        describe('when scrolling', function() {

            it('should require an index', function() {
                testScrollList(function(scrollList) {
                    expect(function() {
                        scrollList.scrollTo({});
                    }).toThrow('ScrollList.scrollTo: index is required.');
                });
            });

            it('should guard against index less than zero', function() {
                testScrollList(function(scrollList) {
                    spyOn(scrollList._layout, 'getItemLayout').andReturn({ top: 0 });
                    scrollList.scrollTo({ index: -1 });

                    expect(scrollList._layout.getItemLayout).toHaveBeenCalledWith(0);
                });
            });

            it('should guard against index greater than the number of items', function() {
                testScrollList(function(scrollList) {
                    var numberOfItems = scrollList.getItemMetadata().length;

                    spyOn(scrollList._layout, 'getItemLayout').andReturn({ top: 0 });
                    scrollList.scrollTo({ index: numberOfItems });

                    expect(scrollList._layout.getItemLayout).toHaveBeenCalledWith(numberOfItems - 1);
                });
            });

            it('should dispatch "onCurrentItemChanging"', function() {
                testScrollList(function(scrollList) {
                    spyOn(scrollList.onCurrentItemChanging, 'dispatch');
                    spyOn(scrollList._layout, 'getCurrentItemIndex').andReturn(1);
                    scrollList.scrollTo({ index: 2 });

                    expect(scrollList.onCurrentItemChanging.dispatch).toHaveBeenCalledWith([
                        scrollList,
                        { fromIndex: 1, toIndex: 2 }
                    ]);
                });
            });

            it('should render placeholders at the jump target if absent', function() {
                testScrollList(function(scrollList) {
                    var map = scrollList.getListMap();
                    var currentState = { translateX: 10, scale: 2 };
                    var itemLayout = { top: 100 };
                    var layout = scrollList.getLayout();

                    spyOn(map, 'panTo');
                    spyOn(map, 'getCurrentTransformState').andReturn(currentState);
                    spyOn(layout, 'getItemLayout').andReturn(itemLayout);
                    spyOn(layout, 'getRenderedItemRange').andReturn({ startIndex: 0, endIndex: 5 });
                    spyOn(layout, 'setScrollPosition');
                    spyOn(layout, 'render');

                    scrollList.scrollTo({ index: 10 });

                    expect(layout.setScrollPosition).toHaveBeenCalledWith({
                        top: -itemLayout.top * currentState.scale,
                        left: currentState.translateX
                    });
                    expect(layout.render).toHaveBeenCalled();
                });
            });

            it('should pan the list map to the top of the target item layout', function() {
                testScrollList(function(scrollList) {
                    var done = function() {};
                    var map = scrollList.getListMap();
                    var currentState = { translateX: 10, scale: 2 };
                    var itemLayout = { top: 100 };

                    spyOn(map, 'panTo');
                    spyOn(map, 'getCurrentTransformState').andReturn(currentState);
                    spyOn(scrollList._layout, 'getItemLayout').andReturn(itemLayout);

                    scrollList.scrollTo({
                        index: 2,
                        done: done
                    });

                    expect(map.panTo).toHaveBeenCalledWith({
                        x: currentState.translateX,
                        y: -itemLayout.top * currentState.scale,
                        duration: 0,
                        done: done
                    });
                });
            });

            describe('when scrolling in other than "flow" mode', function() {
                it('should reset the zoom level of all out of view item maps when the scroll completes', function() {
                    testScrollList({ mode: '!flow' }, function(scrollList) {
                        var listMap = scrollList._listMap;

                        // Expect that we panned the list map.
                        spyOn(listMap, 'panTo');
                        scrollList.scrollTo({ index: 2 });
                        expect(listMap.panTo).toHaveBeenCalled();

                        // Mock state during invocation of done and invoke.
                        var itemRange = { startIndex: 0, endIndex: 4 };
                        var itemMaps = [];
                        (function() {
                            for (var i = itemRange.startIndex; i <= itemRange.endIndex; i++) {
                                var map = _.extend({}, AwesomeMap.prototype);
                                spyOn(map, 'zoomTo');
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

                        // Now asset.
                        for (var i = itemRange.startIndex; i <= itemRange.endIndex; i++) {
                            var itemMap = itemMaps[i];
                            expect(itemMap).toBeDefined();
                            if (i === currentIndexAfterScroll) {
                                expect(itemMap.zoomTo).not.toHaveBeenCalled();
                            }
                            else {
                                expect(itemMap.zoomTo).toHaveBeenCalledWith({ scale: 1 });
                            }
                        }
                    });
                });
            });

            describe('when scrolling item position to center', function() {

                it('should center list map in flow mode', function() {
                    testScrollList({ mode: 'flow' }, function(scrollList) {
                        var map = scrollList.getListMap();
                        var currentState = { translateX: 0, scale: 2 };
                        var itemLayout = { top: 1000, scaleToFit: 1 };
                        var viewportSize = { width: 200, height: 400 };

                        spyOn(map, 'panTo');
                        spyOn(map, 'getCurrentTransformState').andReturn(currentState);
                        spyOn(scrollList._layout, 'getItemLayout').andReturn(itemLayout);
                        spyOn(scrollList._layout, 'getViewportSize').andReturn(viewportSize);

                        scrollList.scrollTo({
                            index: 2,
                            duration: 0,
                            center: { x: 100, y: 200 }
                        });

                        expect(map.panTo).toHaveBeenCalledWith({
                            x: -100,
                            y: -2200,
                            duration: 0,
                            done: undefined
                        });
                    });
                });

                it('should center item map in other modes', function() {
                    testScrollList({ mode: 'peek' }, function(scrollList) {
                        var listMap = scrollList.getListMap();
                        var listState = { translateX: 0, scale: 1 };
                        var itemMap = scrollList.getCurrentItemMap();
                        var itemState = { scale: 2 };
                        var itemLayout = { top: 1000, scaleToFit: 1 };
                        var viewportSize = { width: 200, height: 400 };

                        spyOn(listMap, 'panTo').andCallFake(function(options) {
                            options.done();
                        });
                        spyOn(listMap, 'getCurrentTransformState').andReturn(listState);

                        spyOn(itemMap, 'panTo');
                        spyOn(itemMap, 'getCurrentTransformState').andReturn(itemState);

                        spyOn(scrollList._layout, 'getItemLayout').andReturn(itemLayout);
                        spyOn(scrollList._layout, 'getViewportSize').andReturn(viewportSize);
                        spyOn(scrollList._layout, 'render');

                        scrollList.scrollTo({
                            index: 2,
                            duration: 0,
                            center: { x: 100, y: 200 }
                        });

                        expect(listMap.panTo).toHaveBeenCalledWith({
                            x: 0,
                            y: -1000,
                            duration: 0,
                            done: jasmine.any(Function)
                        });

                        expect(itemMap.panTo).toHaveBeenCalledWith({
                            x: -100,
                            y: -200,
                            duration: 0,
                            done: jasmine.any(Function)
                        });
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

                scrollList.zoomTo(scale, duration, done);

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
    });
});
