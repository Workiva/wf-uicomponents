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
    var AwesomeMapFactory = require('wf-js-uicomponents/scroll_list/AwesomeMapFactory');
    var FitModes = require('wf-js-uicomponents/layouts/FitModes');
    var Gesture = require('wf-js-uicomponents/awesome_map/Gesture');
    var HorizontalAlignments = require('wf-js-uicomponents/layouts/HorizontalAlignments');
    var InteractionEvent = require('wf-js-uicomponents/awesome_map/InteractionEvent');
    var ItemSizeCollection = require('wf-js-uicomponents/layouts/ItemSizeCollection');
    var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');
    var VerticalAlignments = require('wf-js-uicomponents/layouts/VerticalAlignments');

    var $host = $('<div>').css({ position: 'absolute', top: -10000, width: 400, height: 400 });

    function createInteractionEvent(configuration) {
        configuration = configuration || {};
        var type = configuration.type || 'fake';
        var cumulativeGesture = configuration.cumulativeGesture || new Gesture();
        var iterativeGesture = configuration.iterativeGesture || new Gesture();
        return new InteractionEvent(type, cumulativeGesture, iterativeGesture);
    }

    function createScrollList(configuration) {
        var host = configuration.host || $host[0];
        var items = configuration.items || [{ width: 400, height: 400 }];
        var itemSizeCollection = new ItemSizeCollection({
            maxWidth: items.map(function(item) { return item.width; }).sort().pop(),
            maxHeight: items.map(function(item) { return item.height; }).sort().pop(),
            items: items
        });
        var options = _.defaults(configuration.options || {}, {
            scrollMode: 'flow'
        });
        var scrollList = new ScrollList(host, itemSizeCollection, options);
        return scrollList;
    }

    describe('AwesomeMapFactory', function() {
        beforeEach(function() {
            $host.appendTo('body');
        });
        afterEach(function() {
            $host.empty().remove();
        });
        describe('item maps', function() {
            var $itemMapHost = $host.clone();
            var scrollList;
            var map;
            beforeEach(function() {
                $host.append($itemMapHost);
                scrollList = createScrollList({
                    options: { scrollMode: '!flow' }
                });
                spyOn(scrollList.onInteractionStarted, 'dispatch');
                map = AwesomeMapFactory.createItemMap(scrollList, $itemMapHost[0]);
                spyOn(scrollList, 'getCurrentItemMap').andReturn(map);
            });
            describe('when an interaction starts on the map for the current list item', function() {
                it('should dispatch scroll list "onInteractionStarted"', function() {
                    map.onInteractionStarted.dispatch([map]);
                    expect(scrollList.onInteractionStarted.dispatch)
                        .toHaveBeenCalledWith([scrollList]);
                });
            });
            describe('when an interaction occurs on the map for the current list item', function() {
                var fakeHitTestResult;
                var fakeEvent;
                beforeEach(function() {
                    fakeHitTestResult = {
                        index: 1,
                        position: {}
                    };
                    spyOn(scrollList, 'hitTest').andReturn(fakeHitTestResult);
                    spyOn(scrollList.onInteraction, 'dispatch');
                    fakeEvent = createInteractionEvent();
                    fakeEvent.position = {};
                    map.onInteractionStarted.dispatch([map]);
                    map.onInteraction.dispatch([map, {
                        event: fakeEvent
                    }]);
                });
                it('should perform a hit test with the event position', function() {
                    expect(scrollList.hitTest).toHaveBeenCalledWith(fakeEvent.position);
                });
                it('should dispatch scroll list "onInteraction"', function() {
                    var expectedDispatchArgs = {
                        event: fakeEvent,
                        itemIndex: fakeHitTestResult.index,
                        itemPosition: fakeHitTestResult.position
                    };
                    expect(scrollList.onInteraction.dispatch)
                        .toHaveBeenCalledWith([scrollList, expectedDispatchArgs]);
                });
            });
            describe('when an interaction ends on the map for the current list item', function() {
                it('should dispatch scroll list "onInteractionFinished"', function() {
                    spyOn(scrollList.onInteractionFinished, 'dispatch');
                    map.onInteractionStarted.dispatch([map]);
                    map.onInteractionFinished.dispatch([map]);
                    expect(scrollList.onInteractionFinished.dispatch)
                        .toHaveBeenCalledWith([scrollList]);
                });
            });
            describe('when scale will change', function() {
                it('should dispatch scroll list "onScaleChanging"', function() {
                    spyOn(scrollList.onScaleChanging, 'dispatch');
                    var mapEventArgs = {
                        event: {},
                        currentScale: 1,
                        nextScale: 2
                    };
                    map.onScaleChanging.dispatch([scrollList, mapEventArgs]);
                    expect(scrollList.onScaleChanging.dispatch)
                        .toHaveBeenCalledWith([scrollList, {
                            event: mapEventArgs.event,
                            currentScale: mapEventArgs.currentScale,
                            nextScale: mapEventArgs.nextScale
                        }]);
                });
            });
            describe('when the translation of the item map changes', function() {
                it('dispatch scroll list "onItemScrollPositionCHanged"', function() {
                    spyOn(scrollList.onItemScrollPositionChanged, 'dispatch');
                    var mapEventArgs = {
                        event: {},
                        x: -100,
                        y: -100
                    };
                    map.onTranslationChanged.dispatch([map, mapEventArgs]);
                    expect(scrollList.onItemScrollPositionChanged.dispatch)
                        .toHaveBeenCalledWith([scrollList, {
                            event: mapEventArgs.event,
                            x: -mapEventArgs.x,
                            y: -mapEventArgs.y
                        }]);
                });
            });
            describe('when translation will change', function() {
                it('should dispatch scroll list "onItemScrollPositionChanging"', function() {
                    spyOn(scrollList.onItemScrollPositionChanging, 'dispatch');
                    var mapEventArgs = {
                        event: {},
                        currentTranslation: {
                            x: -100,
                            y: -100
                        },
                        nextTranslation: {
                            x: -200,
                            y: -200
                        }
                    };
                    map.onTranslationChanging.dispatch([map, mapEventArgs]);
                    expect(scrollList.onItemScrollPositionChanging.dispatch)
                        .toHaveBeenCalledWith([scrollList, {
                            event: mapEventArgs.event,
                            currentPosition: {
                                x: -mapEventArgs.currentTranslation.x,
                                y: -mapEventArgs.currentTranslation.y
                            },
                            nextPosition: {
                                x: -mapEventArgs.nextTranslation.x,
                                y: -mapEventArgs.nextTranslation.y
                            }
                        }]);
                });
            });
        });
        describe('list maps', function() {
            var scrollList;
            var map;
            beforeEach(function() {
                scrollList = createScrollList({
                    options: { scrollMode: 'flow' }
                });
                map = AwesomeMapFactory.createListMap(scrollList);
            });
            describe('when an interaction starts in flow mode', function() {
                it('should dispatch scroll list "onInteractionStarted"', function() {
                    spyOn(scrollList.onInteractionStarted, 'dispatch');
                    map.onInteractionStarted.dispatch();
                    expect(scrollList.onInteractionStarted.dispatch)
                        .toHaveBeenCalledWith([scrollList]);
                });
            });
            describe('when an interaction occurs in flow mode', function() {
                var fakeHitTestResult;
                var fakeEvent;
                beforeEach(function() {
                    fakeHitTestResult = {
                        index: 1,
                        position: {}
                    };
                    spyOn(scrollList, 'hitTest').andReturn(fakeHitTestResult);
                    spyOn(scrollList.onInteraction, 'dispatch');
                    fakeEvent = createInteractionEvent();
                    fakeEvent.position = {};
                    map.onInteraction.dispatch([null, {
                        event: fakeEvent
                    }]);
                });
                it('should perform a hit test with the event position', function() {
                    expect(scrollList.hitTest).toHaveBeenCalledWith(fakeEvent.position);
                });
                it('should dispatch scroll list "onInteraction"', function() {
                    var expectedDispatchArgs = {
                        event: fakeEvent,
                        itemIndex: fakeHitTestResult.index,
                        itemPosition: fakeHitTestResult.position
                    };
                    expect(scrollList.onInteraction.dispatch)
                        .toHaveBeenCalledWith([scrollList, expectedDispatchArgs]);
                });
            });
            describe('when an interaction ends in flow mode', function() {
                it('should dispatch scroll list "onInteractionFinished"', function() {
                    spyOn(scrollList.onInteractionFinished, 'dispatch');
                    map.onInteractionFinished.dispatch();
                    expect(scrollList.onInteractionFinished.dispatch)
                        .toHaveBeenCalledWith([scrollList]);
                });
            });
            describe('when scale will change in flow mode', function() {
                it('should dispatch scroll list "onScaleChanging"', function() {
                    spyOn(scrollList.onScaleChanging, 'dispatch');
                    var mapEventArgs = {
                        event: {},
                        currentScale: 1,
                        nextScale: 2
                    };
                    map.onScaleChanging.dispatch([scrollList, mapEventArgs]);
                    expect(scrollList.onScaleChanging.dispatch)
                        .toHaveBeenCalledWith([scrollList, {
                            event: mapEventArgs.event,
                            currentScale: mapEventArgs.currentScale,
                            nextScale: mapEventArgs.nextScale
                        }]);
                });
            });
            describe('when translation changes', function() {
                it('should dispatch scroll list "onScrollPositionChanged"', function() {
                    spyOn(scrollList.onScrollPositionChanged, 'dispatch');
                    var mapEventArgs = {
                        event: {},
                        x: -100,
                        y: -100
                    };
                    map.onTranslationChanged.dispatch([map, mapEventArgs]);
                    expect(scrollList.onScrollPositionChanged.dispatch)
                        .toHaveBeenCalledWith([scrollList, {
                            event: mapEventArgs.event,
                            x: -mapEventArgs.x,
                            y: -mapEventArgs.y
                        }]);
                });
            });
            describe('when translation will change', function() {
                it('should dispatch scroll list "onScrollPositionChanging"', function() {
                    spyOn(scrollList.onScrollPositionChanging, 'dispatch');
                    var mapEventArgs = {
                        event: {},
                        currentTranslation: {
                            x: -100,
                            y: -100
                        },
                        nextTranslation: {
                            x: -200,
                            y: -200
                        }
                    };
                    map.onTranslationChanging.dispatch([map, mapEventArgs]);
                    expect(scrollList.onScrollPositionChanging.dispatch)
                        .toHaveBeenCalledWith([scrollList, {
                            event: mapEventArgs.event,
                            currentPosition: {
                                x: -mapEventArgs.currentTranslation.x,
                                y: -mapEventArgs.currentTranslation.y
                            },
                            nextPosition: {
                                x: -mapEventArgs.nextTranslation.x,
                                y: -mapEventArgs.nextTranslation.y
                            }
                        }]);
                });
            });
            describe('initial positioning', function() {
                var hostWidth;
                var hostHeight;
                beforeEach(function() {
                    hostWidth = $host.width();
                    hostHeight = $host.height();
                });
                function createMap(options) {
                    options = options || {};
                    var listWidth = options.listWidth || hostWidth;
                    var listHeight = options.listHeight || hostHeight;
                    var fitMode = options.fitMode || FitModes.WIDTH;
                    var horizontalAlign = options.horizontalAlign || HorizontalAlignments.CENTER;
                    var verticalAlign = options.verticalAlign || VerticalAlignments.AUTO;
                    var scrollList = createScrollList({
                        items: [{ width: listWidth, height: listHeight }],
                        options: {
                            fit: fitMode,
                            horizontalAlign: horizontalAlign,
                            verticalAlign: verticalAlign
                        }
                    });
                    var map = AwesomeMapFactory.createListMap(scrollList);
                    return map;
                }
                it('should center scrollList vertically in viewport when scrollList ' +
                    'height is less than viewport height', function() {
                    var listHeight = hostHeight / 2;
                    var map = createMap({ listHeight: listHeight });
                    var mapTopWhenCentered = (hostHeight - listHeight) / 2;
                    expect(map.getTranslation().y).toEqual(mapTopWhenCentered);
                });
                it('should position the scrollList at the top of the viewport when scrollList ' +
                    'height is less than viewport height and verticalAlign="top"', function() {
                    var listHeight = hostHeight / 2;
                    var map = createMap({
                        listHeight: listHeight,
                        verticalAlign: VerticalAlignments.TOP
                    });
                    expect(map.getTranslation().y).toEqual(0);
                });
                it('should center scrollList horizontally in viewport when scrollList ' +
                    'width is less than viewport width and horizontalAlign="center"', function() {
                    var listWidth = hostWidth / 2;
                    var map = createMap({ listWidth: listWidth });
                    var mapLeftWhenCentered = (hostWidth - listWidth) / 2;
                    expect(map.getTranslation().x).toEqual(mapLeftWhenCentered);
                });
                it('should position the scrollList at the left edge of the viewport when scrollList ' +
                    'width is less than viewport width and horizontalAlign="left"', function() {
                    var listWidth = hostWidth / 2;
                    var map = createMap({
                        listWidth: listWidth,
                        horizontalAlign: HorizontalAlignments.LEFT
                    });
                    expect(map.getTranslation().x).toEqual(0);
                });
                it('should position the scrollList at the top of the viewport when ' +
                    'scrollList height is greater than viewport height', function() {
                    var listHeight = hostHeight * 2;
                    var map = createMap({ listHeight: listHeight });
                    expect(map.getTranslation().y).toEqual(0);
                });
                it('should center scrollList horizontally in viewport when ' +
                    'scrollList width is greater than viewport width', function() {
                    var listWidth = hostWidth * 2;
                    var map = createMap({
                        fitMode: FitModes.NONE,
                        listWidth: listWidth
                    });
                    var mapLeftWhenCentered = (hostWidth - listWidth) / 2;
                    expect(map.getTranslation().x).toEqual(mapLeftWhenCentered);
                });
            });
        });
    });
});
