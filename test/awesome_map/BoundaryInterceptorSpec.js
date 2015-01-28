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

    var BoundaryInterceptor = require('wf-js-uicomponents/awesome_map/BoundaryInterceptor');
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');
    var Gesture = require('wf-js-uicomponents/awesome_map/Gesture');
    var InteractionEvent = require('wf-js-uicomponents/awesome_map/InteractionEvent');
    var TransformState = require('wf-js-uicomponents/awesome_map/TransformState');

    function createEvent(type, gestureLike) {
        var gesture = new Gesture(gestureLike);

        return new InteractionEvent(type, gesture, gesture);
    }

    describe('BoundaryInterceptor', function() {

        var viewportDimensions = { width: 100, height: 200 };
        var contentDimensions = { width: 50, height: 100 };
        var map = {
            isDisposed: function() { return false; },
            getContentDimensions: function() { return contentDimensions; },
            getCurrentTransformState: function() {},
            getViewportDimensions: function() { return viewportDimensions; },
            onTransformStarted: function() {}
        };

        it('should be mixed with InterceptorMixin', function() {
            var interceptor = new BoundaryInterceptor();

            expect(interceptor.dispose).toBeDefined();
            expect(interceptor.register).toBeDefined();
        });

        it('should use the given easing function for animations', function() {
            var easing = function() {};
            var interceptor = new BoundaryInterceptor({ easing: easing });
            var evt = createEvent(EventTypes.RELEASE);
            var targetState = new TransformState({ translateX: -100 });

            interceptor.register(map);
            interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

            expect(targetState.easing).toBe(easing);
        });

        it('should use the given animation duration for animations', function() {
            var duration = 5000;
            var interceptor = new BoundaryInterceptor({ animationDuration: duration });
            var evt = createEvent(EventTypes.RELEASE);
            var targetState = new TransformState({ translateX: -100 });

            interceptor.register(map);
            interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

            expect(targetState.duration).toBe(duration);
        });

        it('should allow setting different modes on each axis', function() {
            var interceptor = new BoundaryInterceptor({ mode: { x: 'stop', y: 'slow' }});
            var evt = createEvent(EventTypes.DRAG, { deltaX: -100, deltaY: -100 });
            var targetState = new TransformState({ translateX: -100, translateY: -100 });

            interceptor.register(map);
            interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

            expect(targetState.translateX).toBe(0);
            expect(targetState.translateY).toBeLessThan(0);
            expect(targetState.translateY).toBeGreaterThan(-100);
        });

        it('should allow offsetting boundaries to keep content centered', function() {
            var interceptor = new BoundaryInterceptor({
                centerContentX: true,
                centerContentY: true
            });
            var evt = createEvent(EventTypes.RELEASE);
            var targetState = new TransformState({ translateX: 0, translateY: 0 });

            interceptor.register(map);
            interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

            expect(targetState.translateX).toBeCloseTo((viewportDimensions.width - contentDimensions.width) / 2);
            expect(targetState.translateY).toBeCloseTo((viewportDimensions.height - contentDimensions.height) / 2);
        });

        it('should allow pinning content to the left and top edges of the viewport', function() {
            var interceptor = new BoundaryInterceptor({
                centerContentX: false,
                centerContentY: false,
                pinToLeft: true,
                pinToTop: true
            });
            var evt = createEvent(EventTypes.RELEASE);
            var targetState = new TransformState({ translateX: 25, translateY: 25 });

            interceptor.register(map);
            interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

            expect(targetState.translateX).toEqual(0);
            expect(targetState.translateY).toEqual(0);
        });

        describe('accelerating swipe animations at boundaries', function() {

            it('should accelerate swipes "up"', function() {
                var interceptor = new BoundaryInterceptor();
                var evt = createEvent(EventTypes.SWIPE, { direction: 'up', velocityY: 1 });
                var targetState = new TransformState({ translateY: -100, duration: 1000 });

                spyOn(map, 'getCurrentTransformState').andReturn({ translateY: 100 });
                interceptor.register(map);
                interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

                expect(targetState.translateY).toBe(0);
                expect(targetState.duration).toBe(500);
            });

            it('should accelerate swipes "down"', function() {
                var interceptor = new BoundaryInterceptor();
                var evt = createEvent(EventTypes.SWIPE, { direction: 'down', velocityY: 1 });
                var targetState = new TransformState({ translateY: 200, duration: 1000 });

                spyOn(map, 'getCurrentTransformState').andReturn({ translateY: 0 });
                interceptor.register(map);
                interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

                expect(targetState.translateY).toBe(100);
                expect(targetState.duration).toBe(500);
            });

            it('should accelerate swipes "left"', function() {
                var interceptor = new BoundaryInterceptor();
                var evt = createEvent(EventTypes.SWIPE, { direction: 'left', velocityX: 1 });
                var targetState = new TransformState({ translateX: -50, duration: 1000 });

                spyOn(map, 'getCurrentTransformState').andReturn({ translateX: 50 });
                interceptor.register(map);
                interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

                expect(targetState.translateX).toBe(0);
                expect(targetState.duration).toBe(500);
            });

            it('should accelerate swipes "right"', function() {
                var interceptor = new BoundaryInterceptor();
                var evt = createEvent(EventTypes.SWIPE, { direction: 'right', velocityX: 1 });
                var targetState = new TransformState({ translateX: 100, duration: 1000 });

                spyOn(map, 'getCurrentTransformState').andReturn({ translateX: 0 });
                interceptor.register(map);
                interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

                expect(targetState.translateX).toBe(50);
                expect(targetState.duration).toBe(500);
            });
        });

        describe('handling simulated transforms', function() {
            it('should stop at boundaries', function() {
                var interceptor = new BoundaryInterceptor();
                var evt = createEvent(EventTypes.TRANSFORM);
                var targetState = new TransformState();

                evt.simulated = true;
                spyOn(interceptor, '_stopAtBoundaries');

                interceptor.register(map);
                interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

                expect(interceptor._stopAtBoundaries).toHaveBeenCalledWith(evt, targetState);
            });
        });

        describe('behavior when content fits viewport dimension', function() {

            var contentDimensions = { width: 50, height: 100 };

            function expectBounceAtViewportTopAndLeft(eventType) {
                var interceptor = new BoundaryInterceptor({ mode: 'slow' });
                var evt = createEvent(eventType);
                var targetState = new TransformState({
                    translateX: viewportDimensions.width,
                    translateY: viewportDimensions.height
                });

                interceptor.register(map);
                interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

                expect(targetState.translateX).toBe(viewportDimensions.width - contentDimensions.width + viewportDimensions.width * 0.1);
                expect(targetState.translateY).toBe(viewportDimensions.height - contentDimensions.height + viewportDimensions.height * 0.1);
            }

            function expectBounceAtViewportBottomAndRight(eventType) {
                var interceptor = new BoundaryInterceptor({ mode: 'slow' });
                var evt = createEvent(eventType);
                var targetState = new TransformState({
                    translateX: -viewportDimensions.width * 2,
                    translateY: -viewportDimensions.height * 2
                });

                interceptor.register(map);
                interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

                expect(targetState.translateX).toBe(-viewportDimensions.width * 0.1);
                expect(targetState.translateY).toBe(-viewportDimensions.height * 0.1);
            }

            function expectStopAtViewportTopAndLeft(eventType) {
                var interceptor = new BoundaryInterceptor({ mode: 'stop' });
                var evt = createEvent(eventType);
                var targetState = new TransformState({
                    translateX: -1,
                    translateY: -1
                });

                interceptor.register(map);
                interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

                expect(targetState.translateX).toBe(0);
                expect(targetState.translateY).toBe(0);
            }

            function expectStopAtViewportBottomAndRight(eventType) {
                var interceptor = new BoundaryInterceptor({ mode: 'stop' });
                var evt = createEvent(eventType);
                var targetState = new TransformState({
                    translateX: viewportDimensions.width,
                    translateY: viewportDimensions.height
                });

                interceptor.register(map);
                interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

                expect(targetState.translateX).toBe(viewportDimensions.width - contentDimensions.width);
                expect(targetState.translateY).toBe(viewportDimensions.height - contentDimensions.height);
            }

            function expectSlowBeyondViewportTopAndLeft(eventType) {
                var interceptor = new BoundaryInterceptor({ mode: 'slow' });
                var evt = createEvent(eventType, { deltaX: -10, deltaY: -10 });
                var targetState = new TransformState({ translateX: -10, translateY: -10 });

                interceptor.register(map);
                interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

                expect(targetState.translateX).toBeLessThan(0);
                expect(targetState.translateX).toBeGreaterThan(-10);
                expect(targetState.translateY).toBeLessThan(0);
                expect(targetState.translateY).toBeGreaterThan(-10);
            }

            function expectSlowBeyondViewportBottomAndRight(eventType) {
                var interceptor = new BoundaryInterceptor({ mode: 'slow' });
                var evt = createEvent(eventType, {
                    deltaX: viewportDimensions.width,
                    deltaY: viewportDimensions.height
                });
                var targetState = new TransformState({
                    translateX: viewportDimensions.width,
                    translateY: viewportDimensions.height
                });

                interceptor.register(map);
                interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

                expect(targetState.translateX).toBeGreaterThan(viewportDimensions.width - contentDimensions.width);
                expect(targetState.translateX).toBeLessThan(viewportDimensions.width);
                expect(targetState.translateY).toBeGreaterThan(viewportDimensions.height - contentDimensions.height);
                expect(targetState.translateY).toBeLessThan(viewportDimensions.height);
            }

            function expectSnapToViewportTopAndLeft(eventType, expectAnimation) {
                var interceptor = new BoundaryInterceptor();
                var evt = createEvent(eventType);
                var targetState = new TransformState({
                    translateX: -1,
                    translateY: -1
                });

                interceptor.register(map);
                interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

                expect(targetState.translateX).toBe(0);
                expect(targetState.translateY).toBe(0);
                if (expectAnimation) {
                    expect(targetState.duration).toBe(interceptor.getSettings().animationDuration);
                }
            }

            function expectSnapToViewportBottomAndRight(eventType, expectAnimation) {
                var interceptor = new BoundaryInterceptor();
                var evt = createEvent(eventType);
                var targetState = new TransformState({
                    translateX: viewportDimensions.width,
                    translateY: viewportDimensions.height
                });

                interceptor.register(map);
                interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

                expect(targetState.translateX).toBe(viewportDimensions.width - contentDimensions.width);
                expect(targetState.translateY).toBe(viewportDimensions.height - contentDimensions.height);
                if (expectAnimation) {
                    expect(targetState.duration).toBe(interceptor.getSettings().animationDuration);
                }
            }

            function testDragEvent(eventType) {
                it('should stop at viewport top and left', function() {
                    expectStopAtViewportTopAndLeft(eventType);
                });

                it('should stop at viewport bottom and right', function() {
                    expectStopAtViewportBottomAndRight(eventType);
                });

                it('should slow beyond viewport top and left', function() {
                    expectSlowBeyondViewportTopAndLeft(eventType);
                });

                it('should slow beyond viewport bottom and right', function() {
                    expectSlowBeyondViewportBottomAndRight(eventType);
                });

                it('should allow free movement within boundaries', function() {
                    var interceptor = new BoundaryInterceptor({ mode: 'slow' });
                    var evt = createEvent(eventType);
                    var originalTranslateX = (viewportDimensions.width - contentDimensions.width) / 2;
                    var originalTranslateY = (viewportDimensions.height - contentDimensions.height) / 2;
                    var targetState = new TransformState({
                        translateX: originalTranslateX,
                        translateY: originalTranslateY,
                    });

                    interceptor.register(map);
                    interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

                    expect(targetState.translateX).toBe(originalTranslateX);
                    expect(targetState.translateY).toBe(originalTranslateY);
                    expect(targetState.duration).toBe(0);
                });
            }

            beforeEach(function() {
                spyOn(map, 'getViewportDimensions').andReturn(viewportDimensions);
                spyOn(map, 'getContentDimensions').andReturn(contentDimensions);
            });

            describe('during drag', function() {
                testDragEvent(EventTypes.DRAG);
            });

            describe('during drag end', function() {
                testDragEvent(EventTypes.DRAG_END);
            });

            describe('during drag start', function() {
                testDragEvent(EventTypes.DRAG_START);
            });

            describe('during mouse wheel', function() {

                it('should stop at viewport top and left', function() {
                    expectStopAtViewportTopAndLeft(EventTypes.MOUSE_WHEEL);
                });

                it('should stop at viewport bottom and right', function() {
                    expectStopAtViewportBottomAndRight(EventTypes.MOUSE_WHEEL);
                });
            });

            describe('during swipe', function() {

                it('should bounce at viewport top and left', function() {
                    expectBounceAtViewportTopAndLeft(EventTypes.SWIPE);
                });

                it('should bounce at viewport bottom and right', function() {
                    expectBounceAtViewportBottomAndRight(EventTypes.SWIPE);
                });
            });

            describe('during release', function() {

                it('should snap to viewport top and left', function() {
                    expectSnapToViewportTopAndLeft(EventTypes.RELEASE, true);
                });

                it('should snap to viewport bottom and right', function() {
                    expectSnapToViewportBottomAndRight(EventTypes.RELEASE, true);
                });
            });

            describe('during resize', function() {

                it('should snap to viewport top and left', function() {
                    expectSnapToViewportTopAndLeft(EventTypes.RESIZE);
                });

                it('should snap to viewport bottom and right', function() {
                    expectSnapToViewportBottomAndRight(EventTypes.RESIZE);
                });
            });
        });

        describe('behavior when content overflows viewport dimension', function() {

            var contentDimensions = { width: 200, height: 400 };

            function expectBounceAtViewportTopAndLeft(eventType) {
                var interceptor = new BoundaryInterceptor({ mode: 'slow' });
                var evt = createEvent(eventType);
                var targetState = new TransformState({
                    translateX: viewportDimensions.width * 2,
                    translateY: viewportDimensions.height * 2
                });

                interceptor.register(map);
                interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

                expect(targetState.translateX).toBe(viewportDimensions.width * 0.1);
                expect(targetState.translateY).toBe(viewportDimensions.height * 0.1);
            }

            function expectBounceAtViewportBottomAndRight(eventType) {
                var interceptor = new BoundaryInterceptor({ mode: 'slow' });
                var evt = createEvent(eventType);
                var targetState = new TransformState({
                    translateX: -viewportDimensions.width * 2,
                    translateY: -viewportDimensions.height * 2
                });

                interceptor.register(map);
                interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

                expect(targetState.translateX).toBe(viewportDimensions.width - contentDimensions.width - viewportDimensions.width * 0.1);
                expect(targetState.translateY).toBe(viewportDimensions.height - contentDimensions.height - viewportDimensions.height * 0.1);
            }

            function expectStopAtViewportTopAndLeft(eventType) {
                var interceptor = new BoundaryInterceptor({ mode: 'stop' });
                var evt = createEvent(eventType);
                var targetState = new TransformState({
                    translateX: 10,
                    translateY: 10
                });

                interceptor.register(map);
                interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

                expect(targetState.translateX).toBe(0);
                expect(targetState.translateY).toBe(0);
            }

            function expectStopAtViewportBottomAndRight(eventType) {
                var interceptor = new BoundaryInterceptor({ mode: 'stop' });
                var evt = createEvent(eventType);
                var targetState = new TransformState({
                    translateX: -contentDimensions.width,
                    translateY: -contentDimensions.height
                });

                interceptor.register(map);
                interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

                expect(targetState.translateX).toBe(viewportDimensions.width - contentDimensions.width);
                expect(targetState.translateY).toBe(viewportDimensions.height - contentDimensions.height);
            }

            function expectSlowBeyondViewportTopAndLeft(eventType) {
                var interceptor = new BoundaryInterceptor({ mode: 'slow' });
                var evt = createEvent(eventType, { deltaX: 10, deltaY: 10 });
                var targetState = new TransformState({ translateX: 10, translateY: 10 });

                interceptor.register(map);
                interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

                expect(targetState.translateX).toBeGreaterThan(0);
                expect(targetState.translateX).toBeLessThan(10);
                expect(targetState.translateY).toBeGreaterThan(0);
                expect(targetState.translateY).toBeLessThan(10);
            }

            function expectSlowBeyondViewportBottomAndRight(eventType) {
                var interceptor = new BoundaryInterceptor({ mode: 'slow' });
                var evt = createEvent(eventType, {
                    deltaX: -contentDimensions.width,
                    deltaY: -contentDimensions.height
                });
                var targetState = new TransformState({
                    translateX: -contentDimensions.width,
                    translateY: -contentDimensions.height
                });

                interceptor.register(map);
                interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

                expect(targetState.translateX).toBeLessThan(viewportDimensions.width - contentDimensions.width);
                expect(targetState.translateX).toBeGreaterThan(-contentDimensions.width);
                expect(targetState.translateY).toBeLessThan(viewportDimensions.height - contentDimensions.height);
                expect(targetState.translateY).toBeGreaterThan(-contentDimensions.height);
            }

            function expectSnapToViewportTopAndLeft(eventType, expectAnimation) {
                var interceptor = new BoundaryInterceptor();
                var evt = createEvent(eventType);
                var targetState = new TransformState({
                    translateX: 10,
                    translateY: 10
                });

                interceptor.register(map);
                interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

                expect(targetState.translateX).toBe(0);
                expect(targetState.translateY).toBe(0);
                if (expectAnimation) {
                    expect(targetState.duration).toBe(interceptor.getSettings().animationDuration);
                }
            }

            function expectSnapToViewportBottomAndRight(eventType, expectAnimation) {
                var interceptor = new BoundaryInterceptor();
                var evt = createEvent(eventType);
                var targetState = new TransformState({
                    translateX: -contentDimensions.width,
                    translateY: -contentDimensions.height
                });

                interceptor.register(map);
                interceptor.handleTransformStarted(null, { event: evt, targetState: targetState });

                expect(targetState.translateX).toBe(viewportDimensions.width - contentDimensions.width);
                expect(targetState.translateY).toBe(viewportDimensions.height - contentDimensions.height);
                if (expectAnimation) {
                    expect(targetState.duration).toBe(interceptor.getSettings().animationDuration);
                }
            }

            function testDragEvent(eventType) {
                it('should stop at viewport top and left', function() {
                    expectStopAtViewportTopAndLeft(eventType);
                });

                it('should stop at viewport bottom and right', function() {
                    expectStopAtViewportBottomAndRight(eventType);
                });

                it('should slow beyond viewport top and left', function() {
                    expectSlowBeyondViewportTopAndLeft(eventType);
                });

                it('should slow beyond viewport bottom and right', function() {
                    expectSlowBeyondViewportBottomAndRight(eventType);
                });
            }

            beforeEach(function() {
                spyOn(map, 'getViewportDimensions').andReturn(viewportDimensions);
                spyOn(map, 'getContentDimensions').andReturn(contentDimensions);
            });

            describe('during drag', function() {
                testDragEvent(EventTypes.DRAG);
            });

            describe('during drag end', function() {
                testDragEvent(EventTypes.DRAG_END);
            });

            describe('during drag start', function() {
                testDragEvent(EventTypes.DRAG_START);
            });

            describe('during mouse wheel', function() {

                it('should stop at viewport top and left', function() {
                    expectStopAtViewportTopAndLeft(EventTypes.MOUSE_WHEEL);
                });

                it('should stop at viewport bottom and right', function() {
                    expectStopAtViewportBottomAndRight(EventTypes.MOUSE_WHEEL);
                });
            });

            describe('during swipe', function() {

                it('should stop at viewport top and left', function() {
                    expectBounceAtViewportTopAndLeft(EventTypes.SWIPE);
                });

                it('should stop at viewport bottom and right', function() {
                    expectBounceAtViewportBottomAndRight(EventTypes.SWIPE);
                });
            });

            describe('during release', function() {

                it('should snap to viewport top and left', function() {
                    expectSnapToViewportTopAndLeft(EventTypes.RELEASE, true);
                });

                it('should snap to viewport bottom and right', function() {
                    expectSnapToViewportBottomAndRight(EventTypes.RELEASE, true);
                });
            });

            describe('during resize', function() {

                it('should snap to viewport top and left', function() {
                    expectSnapToViewportTopAndLeft(EventTypes.RESIZE);
                });

                it('should snap to viewport bottom and right', function() {
                    expectSnapToViewportBottomAndRight(EventTypes.RESIZE);
                });
            });
        });
    });
});
