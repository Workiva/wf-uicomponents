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
    var Gesture = require('wf-js-uicomponents/awesome_map/Gesture');
    var HitTester = require('wf-js-uicomponents/scroll_list/HitTester');
    var InteractionEvent = require('wf-js-uicomponents/awesome_map/InteractionEvent');
    var ItemSizeCollection = require('wf-js-uicomponents/layouts/ItemSizeCollection');
    var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');

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
                    spyOn(HitTester, 'testItemMap').andReturn(fakeHitTestResult);
                    spyOn(scrollList.onInteraction, 'dispatch');
                    fakeEvent = createInteractionEvent();
                    fakeEvent.position = {};
                    map.onInteractionStarted.dispatch([map]);
                    map.onInteraction.dispatch([map, {
                        event: fakeEvent
                    }]);
                });
                it('should perform a hit test with the event position', function() {
                    expect(HitTester.testItemMap)
                        .toHaveBeenCalledWith(scrollList, fakeEvent.position);
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
                    spyOn(HitTester, 'testListMap').andReturn(fakeHitTestResult);
                    spyOn(scrollList.onInteraction, 'dispatch');
                    fakeEvent = createInteractionEvent();
                    fakeEvent.position = {};
                    map.onInteraction.dispatch([null, {
                        event: fakeEvent
                    }]);
                });
                it('should perform a hit test with the event position', function() {
                    expect(HitTester.testListMap)
                        .toHaveBeenCalledWith(scrollList, fakeEvent.position);
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
                    var scrollList = createScrollList({
                        items: [{ width: listWidth, height: listHeight }]
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
                it('should center scrollList horizontally in viewport when scrollList ' +
                    'width is less than viewport width', function() {
                    var listWidth = hostWidth / 2;
                    var map = createMap({ listWidth: listWidth });
                    var mapLeftWhenCentered = (hostWidth - listWidth) / 2;
                    expect(map.getTranslation().x).toEqual(mapLeftWhenCentered);
                });
                it('should position the scrollList at the top of the viewport when ' +
                    'scrollList height is greater than viewport height', function() {
                    var listHeight = hostHeight * 2;
                    var map = createMap({ listHeight: listHeight });
                    expect(map.getTranslation().y).toEqual(0);
                });
                it('should position the scrollList at the left edge of the viewport when ' +
                    'scrollList width is greater than viewport width', function() {
                    var listWidth = hostWidth * 2;
                    var map = createMap({ listWidth: listWidth });
                    expect(map.getTranslation().x).toEqual(0);
                });
            });
        });
    });
});
