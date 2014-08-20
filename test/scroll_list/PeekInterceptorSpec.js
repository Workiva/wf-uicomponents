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
    var AwesomeMap = require('wf-js-uicomponents/awesome_map/AwesomeMap');
    var PeekInterceptor = require('wf-js-uicomponents/scroll_list/PeekInterceptor');
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');
    var Gesture = require('wf-js-uicomponents/awesome_map/Gesture');
    var InteractionEvent = require('wf-js-uicomponents/awesome_map/InteractionEvent');
    var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');
    var TransformState = require('wf-js-uicomponents/awesome_map/TransformState');
    var VerticalLayout = require('wf-js-uicomponents/layouts/VerticalLayout');

    function createEvent(type, gesture) {
        return new InteractionEvent(type, new Gesture(gesture), new Gesture(gesture));
    }

    describe('PeekInterceptor', function() {

        var scrollList = _.extend({}, ScrollList.prototype);
        var listMap = _.extend({}, AwesomeMap.prototype);
        var itemMap = _.extend({}, AwesomeMap.prototype);
        var layout = _.extend({}, VerticalLayout.prototype);

        var viewportDimensions;
        var listDimensions;
        var itemDimensions;

        var listMapPlane;
        var interceptor;

        beforeEach(function() {
            listMapPlane = document.createElement('div');

            itemMap.onInteraction = function() {};

            listDimensions = { height: 1000 };
            viewportDimensions = { height: 200 };
            itemDimensions = { height: 200 };

            spyOn(scrollList, 'getListMap').andReturn(listMap);
            spyOn(scrollList, 'getCurrentItemMap').andReturn(itemMap);
            spyOn(scrollList, 'getLayout').andReturn(layout);
            spyOn(listMap, 'getTransformationPlane').andReturn(listMapPlane);
            spyOn(listMap, 'getContentDimensions').andReturn(listDimensions);
            spyOn(itemMap, 'getViewportDimensions').andReturn(viewportDimensions);
            spyOn(itemMap, 'getContentDimensions').andReturn(itemDimensions);

            interceptor = new PeekInterceptor(scrollList);
            interceptor.register(itemMap);
        });

        it('should be mixed with InterceptorMixin', function() {
            var interceptor = new PeekInterceptor();

            expect(interceptor.dispose).toBeDefined();
            expect(interceptor.register).toBeDefined();
        });

        it('should not handle simulated events', function() {
            var interceptor = new PeekInterceptor(scrollList);
            var evt = createEvent(EventTypes.DRAG);
            var result;

            spyOn(scrollList, 'scrollToItem');
            spyOn(listMap, 'transform');

            evt.simulated = true;
            result = interceptor.handleInteraction(null, { event: evt });

            expect(result).toBeUndefined();
            expect(scrollList.scrollToItem).not.toHaveBeenCalled();
            expect(listMap.transform).not.toHaveBeenCalled();
        });

        it('should not handle events when the scroll list is disabled', function() {
            var interceptor = new PeekInterceptor(scrollList);
            var evt = createEvent(EventTypes.DRAG);
            var result;

            spyOn(scrollList, 'isDisabled').andReturn(true);
            spyOn(scrollList, 'scrollToItem');
            spyOn(listMap, 'transform');

            result = interceptor.handleInteraction(null, { event: evt });

            expect(result).toBeUndefined();
            expect(scrollList.scrollToItem).not.toHaveBeenCalled();
            expect(listMap.transform).not.toHaveBeenCalled();
        });

        describe('setting peek delta by current position', function() {

            it('should set the peek state if peeking', function() {
                spyOn(listMap, 'getCurrentTransformState').andReturn({
                    translateY: -200,
                    scale: 2
                });
                spyOn(layout, 'getCurrentItemIndex').andReturn(0);
                spyOn(layout, 'getItemLayout').andReturn({ top: 0 });

                interceptor._setPeekDeltaByCurrentPosition();

                expect(interceptor._peeking).toBe(true);
                expect(interceptor._peekDelta).toBe(-100);
            });

            it('should not set the peek state if not peeking', function() {
                spyOn(listMap, 'getCurrentTransformState').andReturn({
                    translateY: 0,
                    scale: 1
                });
                spyOn(layout, 'getCurrentItemIndex').andReturn(0);
                spyOn(layout, 'getItemLayout').andReturn({ top: 0 });

                interceptor._setPeekDeltaByCurrentPosition();

                expect(interceptor._peeking).toBe(false);
                expect(interceptor._peekDelta).toBe(0);
            });
        });

        describe('when intercepting', function() {

            var listState;
            var itemState;

            beforeEach(function() {
                listState = new TransformState();
                itemState = new TransformState();

                spyOn(scrollList, 'isDisabled').andReturn(false);
                spyOn(listMap, 'transform').andCallFake(function(options) {
                    listState.translateY = options.y;
                });
                spyOn(listMap, 'getCurrentTransformState').andReturn(listState);
                spyOn(itemMap, 'getCurrentTransformState').andReturn(itemState);

                spyOn(interceptor, '_setPeekDeltaByCurrentPosition');
            });

            function expectMostRecentTransformCallCalledWith(y) {
                var args;

                expect(listMap.transform).toHaveBeenCalled();
                args = listMap.transform.mostRecentCall.args[0];

                expect(args.x).toBe(listState.translateX);
                expect(args.y).toBe(y);
                expect(args.scale).toBe(listState.scale);
            }

            describe('touch', function() {

                beforeEach(function() {
                    spyOn(layout, 'getCurrentItemIndex').andReturn(0);
                });

                it('should initialize peek state by current position', function() {
                    var evt = createEvent(EventTypes.TOUCH);
                    interceptor.handleInteraction(null, { event: evt });
                    expect(interceptor._setPeekDeltaByCurrentPosition).toHaveBeenCalled();
                });

                it('should return undefined', function() {
                    var evt = createEvent(EventTypes.TOUCH);
                    var result = interceptor.handleInteraction(null, { event: evt });
                    expect(result).toBe(undefined);
                });
            });

            function testDrag() {
                it('should set peek delta by current position', function() {
                    var evt = createEvent(EventTypes.DRAG);

                    interceptor.handleInteraction(null, { event: evt });

                    expect(interceptor._setPeekDeltaByCurrentPosition).toHaveBeenCalled();
                });
            }

            function testDragDown(eventType) {

                testDrag();

                it('should ignore if list top is visible', function() {
                    // Setup so that this drag will result at list top.
                    var evt = createEvent(eventType, { deltaY: 10 });
                    var result;

                    listState.translateY = -5;

                    result = interceptor.handleInteraction(null, { event: evt });

                    expect(result).toBe(true);
                    expectMostRecentTransformCallCalledWith(0);
                });

                it('should ignore if item is taller than viewport and within boundaries', function() {
                    var evt = createEvent(eventType, { deltaY: 10 });
                    var result;

                    listState.translateY = -100;
                    itemState.translateY = -50;

                    result = interceptor.handleInteraction(null, { event: evt });

                    expect(result).toBe(true);
                    expect(listMap.transform).not.toHaveBeenCalled();
                });

                it('should peek if item top is visible', function() {
                    var evt = createEvent(eventType, { deltaY: 10 });
                    var result;

                    listState.translateY = -100;

                    result = interceptor.handleInteraction(null, { event: evt });

                    expect(result).toBe(false);
                    expectMostRecentTransformCallCalledWith(-90);
                });

                it('should undo peek if item is taller than viewport and item peek is active', function() {
                    var peekEvt = createEvent(eventType, { deltaY: 20 });
                    var undoPeekEvt = createEvent(eventType, { deltaY: -10 });
                    var result;

                    listState.translateY = -100;
                    itemDimensions.height = viewportDimensions.height + 100;

                    interceptor.handleInteraction(null, { event: peekEvt });
                    result = interceptor.handleInteraction(null, { event: undoPeekEvt });

                    expect(result).toBe(false);
                    expectMostRecentTransformCallCalledWith(-90);
                });

                it('should stop peeking if item is taller than viewport and at top of viewport', function() {
                    // Setup so that undo peek will bring item to top of viewport.
                    var peekEvt = createEvent(eventType, { deltaY: 10 });
                    var undoPeekEvt = createEvent(eventType, { deltaY: -20 });
                    var result;

                    listState.translateY = -100;
                    itemDimensions.height = viewportDimensions.height + 100;

                    interceptor.handleInteraction(null, { event: peekEvt });
                    result = interceptor.handleInteraction(null, { event: undoPeekEvt });

                    expect(result).toBe(true);
                    expectMostRecentTransformCallCalledWith(-100);
                });

                it('should modify event delta to prevent content from shifting out of bounds', function() {
                    var evt = createEvent(eventType, { deltaY: 20 });
                    var result;

                    listState.translateY = -200;
                    itemState.translateY = -10;

                    result = interceptor.handleInteraction(null, { event: evt });

                    expect(result).toBe(true);
                    expect(evt.iterativeGesture.deltaY).toBe(10);
                });
            }

            describe('drag down', function() {
                testDragDown(EventTypes.DRAG);
            });

            describe('drag end down', function() {
                testDragDown(EventTypes.DRAG_END);
            });

            describe('drag start down', function() {
                testDragDown(EventTypes.DRAG_START);
            });

            function testDragUp(eventType) {

                testDrag();

                it('should ignore if list bottom is visible', function() {
                    // Setup so that this drag will result at list bottom.
                    var evt = createEvent(eventType, { deltaY: -10 });
                    var result;

                    listState.translateY = -795;

                    result = interceptor.handleInteraction(null, { event: evt });

                    expect(result).toBe(true);
                    expectMostRecentTransformCallCalledWith(-800);
                });

                it('should ignore if item is taller than viewport and within boundaries', function() {
                    var evt = createEvent(eventType, { deltaY: -10 });
                    var result;

                    listState.translateY = -100;
                    itemState.translateY = -50;
                    itemDimensions.height = viewportDimensions.height + 100;

                    result = interceptor.handleInteraction(null, { event: evt });

                    expect(result).toBe(true);
                    expect(listMap.transform).not.toHaveBeenCalled();
                });

                it('should peek if item bottom is visible', function() {
                    var evt = createEvent(eventType, { deltaY: -10 });
                    var result;

                    listState.translateY = -100;

                    result = interceptor.handleInteraction(null, { event: evt });

                    expect(result).toBe(false);
                    expectMostRecentTransformCallCalledWith(-110);
                });

                it('should undo peek if item is taller than viewport and item peek is active', function() {
                    var peekEvt = createEvent(eventType, { deltaY: -20 });
                    var undoPeekEvt = createEvent(eventType, { deltaY: 10 });
                    var result;

                    listState.translateY = -100;
                    itemState.translateY = -100;
                    itemDimensions.height = viewportDimensions.height + 100;

                    interceptor.handleInteraction(null, { event: peekEvt });
                    result = interceptor.handleInteraction(null, { event: undoPeekEvt });

                    expect(result).toBe(false);
                    expectMostRecentTransformCallCalledWith(-110);
                });

                it('should stop peeking if item is taller than viewport and at bottom of viewport', function() {
                    // Setup so that undo peek will bring item to bottom of viewport.
                    var peekEvt = createEvent(eventType, { deltaY: -10 });
                    var undoPeekEvt = createEvent(eventType, { deltaY: 20 });
                    var result;

                    listState.translateY = -100;
                    itemState.translateY = -100;
                    itemDimensions.height = viewportDimensions.height + 100;

                    interceptor.handleInteraction(null, { event: peekEvt });
                    result = interceptor.handleInteraction(null, { event: undoPeekEvt });

                    expect(result).toBe(true);
                    expectMostRecentTransformCallCalledWith(-100);
                });

                it('should modify event delta to prevent content from shifting out of bounds', function() {
                    var evt = createEvent(eventType, { deltaY: -20 });
                    var result;

                    listState.translateY = -200;
                    itemState.translateY = 10;

                    result = interceptor.handleInteraction(null, { event: evt });

                    expect(result).toBe(true);
                    expect(evt.iterativeGesture.deltaY).toBe(-10);
                });
            }

            describe('drag up', function() {
                testDragUp(EventTypes.DRAG);
            });

            describe('drag end up', function() {
                testDragUp(EventTypes.DRAG_END);
            });

            describe('drag start up', function() {
                testDragUp(EventTypes.DRAG_START);
            });

            describe('swipes', function() {

                var itemLayout;
                var itemRange;
                var duration = 250;

                beforeEach(function() {
                    listState.translateY = -500;
                    itemLayout = { top: -500 };
                    itemRange = {
                        startIndex: 0,
                        endIndex: 8
                    };

                    spyOn(scrollList, 'scrollToItem');
                    spyOn(layout, 'getViewportSize').andReturn(viewportDimensions);
                    spyOn(layout, 'getCurrentItemIndex').andReturn(1);
                    spyOn(layout, 'getItemLayout').andReturn(itemLayout);
                    spyOn(layout, 'getRenderedItemRange').andReturn(itemRange);
                });

                describe('up', function() {

                    it('should scroll to next item on release if peeking at next item', function() {
                        var drag = createEvent(EventTypes.DRAG, { deltaY: -50 });
                        var swipe = createEvent(EventTypes.SWIPE, { direction: 'up' });
                        var release = createEvent(EventTypes.RELEASE);

                        // Start peeking, then swipe, then release
                        expect(interceptor.handleInteraction(null, { event: drag })).toBe(false);
                        expect(interceptor.handleInteraction(null, { event: swipe })).toBe(false);
                        runs(function() {
                            expect(interceptor.handleInteraction(null, { event: release })).toBe(true);
                        });
                        waits(1);
                        runs(function() {
                            expect(scrollList.scrollToItem).toHaveBeenCalledWith({ index: 2, duration: duration });
                        });
                    });

                    it('should scroll to current item on release if peeking at previous item', function() {
                        var drag = createEvent(EventTypes.DRAG, { deltaY: -150 });
                        var swipe = createEvent(EventTypes.SWIPE, { direction: 'up' });
                        var release = createEvent(EventTypes.RELEASE);

                        // Start peeking, then swipe, then release
                        expect(interceptor.handleInteraction(null, { event: drag })).toBe(false);
                        expect(interceptor.handleInteraction(null, { event: swipe })).toBe(false);
                        runs(function() {
                            expect(interceptor.handleInteraction(null, { event: release })).toBe(true);
                        });
                        waits(1);
                        runs(function() {
                            expect(scrollList.scrollToItem).toHaveBeenCalledWith({ index: 2, duration: duration });
                        });
                    });
                });

                describe('down', function() {

                    it('should scroll to previous item on release if peeking at previous item', function() {
                        var drag = createEvent(EventTypes.DRAG, { deltaY: 50 });
                        var swipe = createEvent(EventTypes.SWIPE, { direction: 'down' });
                        var release = createEvent(EventTypes.RELEASE);

                        // Start peeking, then swipe, then release
                        expect(interceptor.handleInteraction(null, { event: drag })).toBe(false);
                        expect(interceptor.handleInteraction(null, { event: swipe })).toBe(false);
                        runs(function() {
                            expect(interceptor.handleInteraction(null, { event: release })).toBe(true);
                        });
                        waits(1);
                        runs(function() {
                            expect(scrollList.scrollToItem).toHaveBeenCalledWith({ index: 0, duration: duration });
                        });
                    });

                    it('should scroll to current item on release if peeking at next item', function() {
                        var drag = createEvent(EventTypes.DRAG, { deltaY: 150 });
                        var swipe = createEvent(EventTypes.SWIPE, { direction: 'down' });
                        var release = createEvent(EventTypes.RELEASE);

                        // Start peeking, then swipe, then release
                        expect(interceptor.handleInteraction(null, { event: drag })).toBe(false);
                        expect(interceptor.handleInteraction(null, { event: swipe })).toBe(false);
                        runs(function() {
                            expect(interceptor.handleInteraction(null, { event: release })).toBe(true);
                        });
                        waits(1);
                        runs(function() {
                            expect(scrollList.scrollToItem).toHaveBeenCalledWith({ index: 0, duration: duration });
                        });
                    });
                });

                it('should not schedule a item jump on release if not peeking', function() {
                    var swipe = createEvent(EventTypes.SWIPE);
                    var release = createEvent(EventTypes.RELEASE);

                    // Don't peek, swipe, then release
                    expect(interceptor.handleInteraction(null, { event: swipe })).toBe(true);
                    expect(interceptor.handleInteraction(null, { event: release })).toBe(true);

                    expect(scrollList.scrollToItem).not.toHaveBeenCalled();
                });
            });

            describe('swipes beyond edges of current itemRange', function() {
                var itemLayout;
                var itemRange;
                var duration = 250;

                beforeEach(function() {
                    listState.translateY = -500;
                    itemLayout = { top: -500 };
                    itemRange = {
                        startIndex: 3,
                        endIndex: 5
                    };

                    spyOn(scrollList, 'scrollToItem');
                    spyOn(layout, 'getViewportSize').andReturn(viewportDimensions);
                    spyOn(layout, 'getItemLayout').andReturn(itemLayout);
                    spyOn(layout, 'getRenderedItemRange').andReturn(itemRange);
                });

                it('should not scroll to the next item if after the range', function() {
                    spyOn(layout, 'getCurrentItemIndex').andReturn(5);
                    var drag = createEvent(EventTypes.DRAG, { deltaY: -150 });
                    var swipe = createEvent(EventTypes.SWIPE, { direction: 'up' });
                    var release = createEvent(EventTypes.RELEASE);

                    interceptor.handleInteraction(null, { event: drag });
                    interceptor.handleInteraction(null, { event: swipe });
                    runs(function() {
                        interceptor.handleInteraction(null, { event: release });
                    });
                    waits(1);
                    runs(function() {
                        expect(scrollList.scrollToItem).toHaveBeenCalledWith({ index: itemRange.endIndex, duration: duration });
                    });
                });
                it('should not scroll to the previous item if before the range', function() {
                    spyOn(layout, 'getCurrentItemIndex').andReturn(3);
                    var drag = createEvent(EventTypes.DRAG, { deltaY: 150 });
                    var swipe = createEvent(EventTypes.SWIPE, { direction: 'down' });
                    var release = createEvent(EventTypes.RELEASE);

                    // Start peeking, then swipe, then release
                    expect(interceptor.handleInteraction(null, { event: drag })).toBe(false);
                    expect(interceptor.handleInteraction(null, { event: swipe })).toBe(false);
                    runs(function() {
                        expect(interceptor.handleInteraction(null, { event: release })).toBe(true);
                    });
                    waits(1);
                    runs(function() {
                        expect(scrollList.scrollToItem).toHaveBeenCalledWith({ index: 3, duration: duration });
                    });
                });

            });

            describe('releases', function() {

                var currentItemIndex = 4;
                var threshold;
                var itemRange;

                beforeEach(function() {
                    threshold = viewportDimensions.height / 3;
                    listState.translateY = -500;
                    itemRange = {
                        startIndex: 0,
                        endIndex: 8
                    };

                    spyOn(scrollList, 'scrollToItem');
                    spyOn(layout, 'getViewportSize').andReturn(viewportDimensions);
                    spyOn(layout, 'getCurrentItemIndex').andReturn(currentItemIndex);
                    spyOn(layout, 'getRenderedItemRange').andReturn(itemRange);
                });

                function shouldJumpToIndex(deltaY, index) {
                    var gesture = { deltaY: deltaY };
                    var touch = createEvent(EventTypes.TOUCH, gesture);
                    var drag = createEvent(EventTypes.DRAG, gesture);
                    var release = createEvent(EventTypes.RELEASE, gesture);

                    // Start peeking and then release
                    interceptor.handleInteraction(null, { event: touch });
                    interceptor.handleInteraction(null, { event: drag });
                    runs(function() {
                        interceptor.handleInteraction(null, { event: release });
                    });
                    waits(1);
                    runs(function() {
                        expect(scrollList.scrollToItem).toHaveBeenCalledWith({
                            index: index,
                            duration: 250
                        });
                    });
                }

                it('should ignore if not peeking', function() {
                    var release = createEvent(EventTypes.RELEASE);

                    interceptor.handleInteraction(null, { event: release });

                    expect(scrollList.scrollToItem).not.toHaveBeenCalled();
                });

                it('should jump to previous item when peeking beyond 1/3rd of viewport', function() {
                    shouldJumpToIndex(threshold + 1, 3);
                });

                it('should jump to next item when peeking beyond 1/3rd of viewport', function() {
                    shouldJumpToIndex(-(threshold + 1), 5);
                });

                it('should jump to current item when peek does not exceed 1/3rd of viewport', function() {
                    shouldJumpToIndex(threshold - 1, 4);
                });
            });
        });
    });
});
