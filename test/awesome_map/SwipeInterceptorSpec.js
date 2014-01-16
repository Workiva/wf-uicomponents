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

    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');
    var Gesture = require('wf-js-uicomponents/awesome_map/Gesture');
    var InteractionEvent = require('wf-js-uicomponents/awesome_map/InteractionEvent');
    var SwipeInterceptor = require('wf-js-uicomponents/awesome_map/SwipeInterceptor');
    var TransformState = require('wf-js-uicomponents/awesome_map/TransformState');

    function createEvent(type, gestureLike) {
        var gesture = new Gesture(gestureLike);
        return new InteractionEvent(type, gesture, gesture);
    }

    describe('SwipeInterceptor', function() {

        var viewportDimensions = { width: 100, height: 200 };
        var map = {
            isDisposed: function() { return false; },
            getViewportDimensions: function() { return viewportDimensions; },
            onTransformStarted: function() {}
        };

        it('should be mixed with InterceptorMixin', function() {
            var interceptor = new SwipeInterceptor();

            expect(interceptor.dispose).toBeDefined();
            expect(interceptor.register).toBeDefined();
        });

        it('should expose its settings', function() {
            var options = {
                animationDuration: 5000,
                constrainToAxes: true,
                easing: function() {},
                throttleVelocity: 10
            };
            var interceptor = new SwipeInterceptor(options);
            var settings = interceptor.getSettings();

            expect(settings.animationDuration).toBe(options.animationDuration);
            expect(settings.constrainToAxes).toBe(options.constrainToAxes);
            expect(settings.easing).toBe(options.easing);
            expect(settings.throttleVelocity).toBe(options.throttleVelocity);
        });

        it('should apply only to swipe events', function() {
            var interceptor = new SwipeInterceptor({ mode: 'stop', maximum: 1 });
            var type;
            var evt;
            var targetState;

            for (type in EventTypes) {
                if (EventTypes.hasOwnProperty(type)) {
                    evt = createEvent(type);
                    targetState = new TransformState({ angle: 45, velocityX: 1, velocityY: 1 });

                    interceptor.handleTransformStarted(null, {
                        event: evt,
                        targetState: targetState
                    });

                    if (type === EventTypes.SWIPE) {
                        expect(targetState.translateX).not.toBe(0);
                        expect(targetState.translateY).not.toBe(0);
                        expect(targetState.duration).not.toBe(0);
                    }
                    else {
                        expect(targetState.translateX).toBe(0);
                        expect(targetState.translateY).toBe(0);
                        expect(targetState.duration).toBe(0);
                    }
                }
            }
        });

        it('should allow swiping by angle', function() {
            var interceptor = new SwipeInterceptor({ constrainToAxes: false });
            var swipeEvent = createEvent(EventTypes.SWIPE, { angle: 45, velocityX: 1, velocityY: 1 });
            var targetState = new TransformState();
            var radians = 45 * Math.PI / 180;
            var expectedTranslateX = Math.cos(radians) * viewportDimensions.width;
            var expectedTranslateY = Math.sin(radians) * viewportDimensions.height;

            interceptor.register(map);
            interceptor.handleTransformStarted(null, {
                event: swipeEvent,
                targetState: targetState
            });

            expect(targetState.translateX).toBeCloseTo(expectedTranslateX);
            expect(targetState.translateY).toBeCloseTo(expectedTranslateY);
            expect(targetState.duration).toBe(interceptor.getSettings().animationDuration);
        });

        it('should allow swiping "up"', function() {
            var interceptor = new SwipeInterceptor({ constrainToAxes: true });
            var swipeEvent = createEvent(EventTypes.SWIPE, { direction: 'up', velocityX: 1, velocityY: 1 });
            var targetState = new TransformState();

            interceptor.register(map);
            interceptor.handleTransformStarted(null, {
                event: swipeEvent,
                targetState: targetState
            });

            expect(targetState.translateX).toBe(0);
            expect(targetState.translateY).toBe(-viewportDimensions.height);
            expect(targetState.duration).toBe(interceptor.getSettings().animationDuration);
        });

        it('should allow swiping "down"', function() {
            var interceptor = new SwipeInterceptor({ constrainToAxes: true });
            var swipeEvent = createEvent(EventTypes.SWIPE, { direction: 'down', velocityX: 1, velocityY: 1 });
            var targetState = new TransformState();

            interceptor.register(map);
            interceptor.handleTransformStarted(null, {
                event: swipeEvent,
                targetState: targetState
            });

            expect(targetState.translateX).toBe(0);
            expect(targetState.translateY).toBe(viewportDimensions.height);
            expect(targetState.duration).toBe(interceptor.getSettings().animationDuration);
        });

        it('should allow swiping "left"', function() {
            var interceptor = new SwipeInterceptor({ constrainToAxes: true });
            var swipeEvent = createEvent(EventTypes.SWIPE, { direction: 'left', velocityX: 1, velocityY: 1 });
            var targetState = new TransformState();

            interceptor.register(map);
            interceptor.handleTransformStarted(null, {
                event: swipeEvent,
                targetState: targetState
            });

            expect(targetState.translateX).toBe(-viewportDimensions.width);
            expect(targetState.translateY).toBe(0);
            expect(targetState.duration).toBe(interceptor.getSettings().animationDuration);
        });

        it('should allow swiping "right"', function() {
            var interceptor = new SwipeInterceptor({ constrainToAxes: true });
            var swipeEvent = createEvent(EventTypes.SWIPE, { direction: 'right', velocityX: 1, velocityY: 1 });
            var targetState = new TransformState();

            interceptor.register(map);
            interceptor.handleTransformStarted(null, {
                event: swipeEvent,
                targetState: targetState
            });

            expect(targetState.translateX).toBe(viewportDimensions.width);
            expect(targetState.translateY).toBe(0);
            expect(targetState.duration).toBe(interceptor.getSettings().animationDuration);
        });

        it('should not animate if the translation does not change', function() {
            var interceptor = new SwipeInterceptor({ constrainToAxes: true });
            var swipeEvent = createEvent(EventTypes.SWIPE, { direction: 'up' });
            var targetState = new TransformState();

            interceptor.register(map);
            interceptor.handleTransformStarted(null, {
                event: swipeEvent,
                targetState: targetState
            });

            expect(targetState.duration).toBe(0);
        });

        it('should use the given easing function for animations', function() {
            var easing = function() {};
            var interceptor = new SwipeInterceptor({ easing: easing });
            var swipeEvent = createEvent(EventTypes.SWIPE, { angle: 45, velocityX: 1 });
            var targetState = new TransformState();

            interceptor.register(map);
            interceptor.handleTransformStarted(null, {
                event: swipeEvent,
                targetState: targetState
            });

            expect(targetState.easing).toBe(easing);
        });

        it('should use the given animation duration for animations', function() {
            var duration = 5000;
            var interceptor = new SwipeInterceptor({ animationDuration: duration });
            var swipeEvent = createEvent(EventTypes.SWIPE, { angle: 45, velocityX: 1 });
            var targetState = new TransformState();

            interceptor.register(map);
            interceptor.handleTransformStarted(null, {
                event: swipeEvent,
                targetState: targetState
            });

            expect(targetState.duration).toBe(duration);
        });

        it('should allow disabling the velocity throttle', function() {
            var interceptor = new SwipeInterceptor({ throttleVelocity: 0 });
            var swipeEvent = createEvent(EventTypes.SWIPE, { angle: 45, velocityX: 100, velocityY: 100 });
            var targetState = new TransformState();
            var radians = 45 * Math.PI / 180;
            var expectedTranslateX = Math.cos(radians) * viewportDimensions.width * 100;
            var expectedTranslateY = Math.sin(radians) * viewportDimensions.height * 100;

            interceptor.register(map);
            interceptor.handleTransformStarted(null, {
                event: swipeEvent,
                targetState: targetState
            });

            expect(targetState.translateX).toBeCloseTo(expectedTranslateX);
            expect(targetState.translateY).toBeCloseTo(expectedTranslateY);
        });
    });
});
