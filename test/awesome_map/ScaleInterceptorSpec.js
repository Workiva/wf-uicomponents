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
    var ScaleInterceptor = require('wf-js-uicomponents/awesome_map/ScaleInterceptor');
    var TransformState = require('wf-js-uicomponents/awesome_map/TransformState');

    function createEvent(type, gestureLike) {
        var gesture = new Gesture(gestureLike);
        var center = gesture.center || { pageX: 0, pageY: 0 };

        spyOn(gesture, 'getPosition').andReturn({
            x: center.pageX,
            y: center.pageY
        });

        return new InteractionEvent(type, gesture, gesture);
    }

    describe('ScaleInterceptor', function() {

        it('should be mixed with InterceptorMixin', function() {
            var interceptor = new ScaleInterceptor();

            expect(interceptor.dispose).toBeDefined();
            expect(interceptor.register).toBeDefined();
        });

        it('should apply only to transform, transform started and release events', function() {
            var interceptor = new ScaleInterceptor({ mode: 'stop', maximum: 1 });
            var type;
            var evt;
            var targetState;

            for (type in EventTypes) {
                if (EventTypes.hasOwnProperty(type)) {
                    evt = createEvent(type);
                    targetState = new TransformState({ scale: 42 });

                    interceptor.handleTransformStarted(null, {
                        event: evt,
                        targetState: targetState
                    });

                    switch (type) {
                    case EventTypes.RELEASE:
                    case EventTypes.TRANSFORM:
                    case EventTypes.TRANSFORM_START:
                        expect(targetState.scale).toBe(1);
                        break;

                    default:
                        expect(targetState.scale).toBe(42);
                        break;
                    }
                }
            }
        });

        it('should use the given easing function for animations', function() {
            var easing = function() {};
            var interceptor = new ScaleInterceptor({ maximum: 1, easing: easing });
            var releaseEvent = createEvent(EventTypes.RELEASE);
            var targetState = new TransformState({ scale: 2 });

            interceptor.handleTransformStarted(null, {
                event: releaseEvent,
                targetState: targetState
            });

            expect(targetState.easing).toBe(easing);
        });

        it('should use the given animation duration for animations', function() {
            var duration = 2000;
            var interceptor = new ScaleInterceptor({ maximum: 1, animationDuration: duration });
            var releaseEvent = createEvent(EventTypes.RELEASE);
            var targetState = new TransformState({ scale: 2 });

            interceptor.handleTransformStarted(null, {
                event: releaseEvent,
                targetState: targetState
            });

            expect(targetState.duration).toBe(duration);
        });

        it('should allow setting the minimum scale after instantiation', function() {
            var interceptor = new ScaleInterceptor({ mimumum: 1 });
            interceptor.setMinimumScale(0.5);

            expect(interceptor.getSettings().minimum).toBe(0.5);
        });

        it('should allow setting the maximum scale after instantiation', function() {
            var interceptor = new ScaleInterceptor({ maximum: 1 });
            interceptor.setMaximumScale(2);

            expect(interceptor.getSettings().maximum).toBe(2);
        });

        describe('behavior', function() {

            function testTransformEvent(eventType) {

                it('should stop scaling at minimum', function() {
                    var interceptor = new ScaleInterceptor({ mode: 'stop', minimum: 0.5 });
                    var transformEvent = createEvent(eventType);
                    var targetState = new TransformState({ scale: 0.2 });

                    interceptor.handleTransformStarted(null, {
                        event: transformEvent,
                        targetState: targetState
                    });

                    expect(targetState.scale).toBe(0.5);
                });

                it('should stop scaling at maximum', function() {
                    var interceptor = new ScaleInterceptor({ mode: 'stop', maximum: 3 });
                    var transformEvent = createEvent(eventType);
                    var targetState = new TransformState({ scale: 5 });

                    interceptor.handleTransformStarted(null, {
                        event: transformEvent,
                        targetState: targetState
                    });

                    expect(targetState.scale).toBe(3);
                });

                it('should not stop scaling if scale is within limits', function() {
                    var interceptor = new ScaleInterceptor({ mode: 'stop', minimum: 1, maximum: 2 });
                    var transformEvent = createEvent(eventType);
                    var targetState = new TransformState({ scale: 1.5 });

                    interceptor.handleTransformStarted(null, {
                        event: transformEvent,
                        targetState: targetState
                    });

                    expect(targetState.scale).toBe(1.5);
                });

                it('should slow scaling beyond minimum', function() {
                    var interceptor = new ScaleInterceptor({ mode: 'slow', minimum: 0.5 });
                    var transformEvent = createEvent(eventType, { scale: 0.2 });
                    var targetState = new TransformState({ scale: 0.2 });

                    interceptor.handleTransformStarted(null, {
                        event: transformEvent,
                        targetState: targetState
                    });

                    expect(targetState.scale).toBeLessThan(0.5);
                    expect(targetState.scale).toBeGreaterThan(0.2);
                });

                it('should slow scaling beyond maximum', function() {
                    var interceptor = new ScaleInterceptor({ mode: 'slow', maximum: 3 });
                    var transformEvent = createEvent(eventType, { scale: 5 });
                    var targetState = new TransformState({ scale: 5 });

                    interceptor.handleTransformStarted(null, {
                        event: transformEvent,
                        targetState: targetState
                    });

                    expect(targetState.scale).toBeGreaterThan(3);
                    expect(targetState.scale).toBeLessThan(5);
                });

                it('should not slow scaling if scale is within limits', function() {
                    var interceptor = new ScaleInterceptor({ mode: 'slow', minimum: 1, maximum: 2 });
                    var transformEvent = createEvent(eventType);
                    var targetState = new TransformState({ scale: 1.5 });

                    interceptor.handleTransformStarted(null, {
                        event: transformEvent,
                        targetState: targetState
                    });

                    expect(targetState.scale).toBe(1.5);
                });
            }

            describe('during transform', function() {
                testTransformEvent(EventTypes.TRANSFORM);
            });

            describe('during transform start', function() {
                testTransformEvent(EventTypes.TRANSFORM_START);
            });

            describe('during release', function() {

                it('should snap to minimum scale', function() {
                    var interceptor = new ScaleInterceptor({ minimum: 1 });
                    var releaseEvent = createEvent(EventTypes.RELEASE);
                    var targetState = new TransformState({ scale: 0.8 });

                    interceptor.handleTransformStarted(null, {
                        event: releaseEvent,
                        targetState: targetState
                    });

                    expect(targetState.scale).toBe(1);
                    expect(targetState.duration).toBe(interceptor.getSettings().animationDuration);
                });

                it('should snap to maximum scale', function() {
                    var interceptor = new ScaleInterceptor({ maximum: 3 });
                    var releaseEvent = createEvent(EventTypes.RELEASE);
                    var targetState = new TransformState({ scale: 4 });

                    interceptor.handleTransformStarted(null, {
                        event: releaseEvent,
                        targetState: targetState
                    });

                    expect(targetState.scale).toBe(3);
                    expect(targetState.duration).toBe(interceptor.getSettings().animationDuration);
                });
            });
        });
    });
});