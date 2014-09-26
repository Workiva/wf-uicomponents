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
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');
    var Gesture = require('wf-js-uicomponents/awesome_map/Gesture');
    var InteractionEvent = require('wf-js-uicomponents/awesome_map/InteractionEvent');
    var RenderingHooksInterceptor = require('wf-js-uicomponents/scroll_list/RenderingHooksInterceptor');
    var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');
    var ScrollModes = require('wf-js-uicomponents/scroll_list/ScrollModes');
    var TransformState = require('wf-js-uicomponents/awesome_map/TransformState');
    var VerticalLayout = require('wf-js-uicomponents/layouts/VerticalLayout');
    var requestAnimFrame = require('wf-js-common/requestAnimationFrame');

    function createEvent(type, gesture) {
        gesture = gesture || new Gesture();
        return new InteractionEvent(type, gesture, gesture);
    }

    describe('RenderingHooksInterceptor', function() {

        var scrollList;
        var layout;
        var interceptor;
        var map;

        beforeEach(function () {
            layout = _.extend({}, VerticalLayout.prototype);
            spyOn(layout, 'render');
            spyOn(layout, 'loadContent');
            scrollList = _.extend({}, ScrollList.prototype);
            spyOn(scrollList, 'getLayout').andReturn(layout);
            spyOn(scrollList, 'getOptions').andReturn({ mode: ScrollModes.FLOW });
            spyOn(scrollList, 'render');
            interceptor = new RenderingHooksInterceptor(scrollList);
            map = _.extend({}, AwesomeMap.prototype);
        });

        describe('handleTransformStarted', function() {

            describe('mouse wheel', function() {
                function test(newTransformState, shouldInvokeRender) {
                    spyOn(map, 'getTranslation').andReturn({ x: 0, y: 0 });
                    var targetState = new TransformState(newTransformState);
                    interceptor.handleTransformStarted(map, {
                        event: createEvent(EventTypes.MOUSE_WHEEL),
                        targetState: targetState
                    });
                    if (!!shouldInvokeRender) {
                        expect(layout.render).toHaveBeenCalledWith({
                            preserveStaleItems: true
                        });
                    }
                    else {
                        expect(layout.render).not.toHaveBeenCalled();
                    }
                }
                it('should render the layout when scrolling vertically', function() {
                    test({ translateY: -10 }, true);
                });
                it('should render the layout when scrolling horizontally', function() {
                    test({ translateX: -10 }, true);
                });
                it('should not render if position does not change', function () {
                    test({ translateX: 0, translateY: 0 }, false);
                });
            });

            describe('swipe', function() {
                var fakeTargetState;
                beforeEach(function() {
                    var nextFrameHappened = false;
                    var swipeEvent = createEvent(EventTypes.SWIPE);
                    fakeTargetState = {
                        translateX: -1,
                        translateY: -1
                    };
                    runs(function() {
                        interceptor.handleTransformStarted(map, {
                            event: swipeEvent,
                            targetState: fakeTargetState
                        });
                        requestAnimFrame(function(){
                            nextFrameHappened = true;
                        });
                    });
                    waitsFor(function(){
                        return nextFrameHappened;
                    });
                });
                it('should render the layout immediately', function() {
                    runs(function() {
                        expect(layout.render).toHaveBeenCalled();
                        var firstCall = layout.render.calls[0];
                        expect(firstCall.args[0]).toEqual({
                            preserveStaleItems: true
                        });
                    });
                });
                it('should render the layout to the target scroll position in a new frame', function() {
                    runs(function() {
                        expect(layout.render.calls.length).toEqual(2);
                        var secondCall = layout.render.calls[1];
                        var expectedPosition = {
                            left: -fakeTargetState.translateX,
                            top: -fakeTargetState.translateY
                        };
                        expect(secondCall.args[0]).toEqual({
                            targetScrollPosition: expectedPosition
                        });
                    });
                });
            });
        });

        describe('handleTransformFinished', function() {

            describe('mouse wheel', function() {
                function test(endTransformState, ready) {
                    // any values different from start x and y should work
                    spyOn(map, 'getTranslation').andReturn({ x: 0, y: 0 });
                    var targetState = endTransformState || new TransformState();

                    var evt = createEvent(EventTypes.MOUSE_WHEEL);
                    interceptor.handleTransformStarted(map, {
                        event: evt,
                        targetState: targetState
                    });

                    interceptor.handleTransformFinished(map, {
                        event: evt
                    });

                    waits(100); // 100 is debounce interval
                    runs(ready);
                }
                it('should render the scroll list when position has changed', function() {
                    var endTransformState = new TransformState({
                        translateX: 1,
                        translateY: 1
                    });
                    test(endTransformState, function() {
                        expect(scrollList.render).toHaveBeenCalled();
                    });
                });
                it('should not load content when position has not changed', function() {
                    var initialTransformState = new TransformState();
                    test(initialTransformState, function() {
                        expect(scrollList.render).not.toHaveBeenCalled();
                    });
                });
            });
            describe('swipe/release', function() {
                it('should render the layout if still transforming', function() {
                    spyOn(map, 'isTransforming').andReturn(true);

                    var releaseEvent = createEvent(EventTypes.RELEASE);
                    interceptor.handleTransformFinished(map, { event: releaseEvent });
                    expect(layout.render).toHaveBeenCalled();
                });
                it('should render the list if the sender is done transforming', function() {
                    spyOn(map, 'isTransforming').andReturn(false);

                    var releaseEvent = createEvent(EventTypes.RELEASE);
                    interceptor.handleTransformFinished(map, { event: releaseEvent });
                    expect(scrollList.render).toHaveBeenCalled();
                });
            });
        });
    });
});
