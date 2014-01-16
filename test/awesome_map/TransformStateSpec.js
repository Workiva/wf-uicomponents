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

    describe('TransformState', function() {
        describe('creating from', function() {
            var currentState;

            function getTargetState(type, gesture) {
                var event = createEvent(type, gesture);
                return TransformState.fromEvent(event, currentState);
            }

            beforeEach(function() {
                currentState = new TransformState();
            });

            describe('double tap events', function() {
                it('should return the current transform state', function() {
                    var gesture = {
                        deltaX: 10,
                        deltaY: 10
                    };
                    var targetState = getTargetState(EventTypes.DOUBLE_TAP, gesture);

                    expect(targetState.equals(currentState)).toBe(true);
                });
            });

            describe('drag events', function() {
                it('should return a translation set to the sum of the current translation and event delta', function() {
                    var gesture = {
                        deltaX: 50,
                        deltaY: -50
                    };
                    var targetState = getTargetState(EventTypes.DRAG, gesture);

                    expect(targetState.translateX).toBe(50);
                    expect(targetState.translateY).toBe(-50);
                });
            });

            describe('drag end events', function() {
                it('should return a translation set to the sum of the current translation and event delta', function() {
                    var gesture = {
                        deltaX: 50,
                        deltaY: -50
                    };
                    var targetState = getTargetState(EventTypes.DRAG_END, gesture);

                    expect(targetState.translateX).toBe(50);
                    expect(targetState.translateY).toBe(-50);
                });
            });

            describe('drag start events', function() {
                it('should return a translation set to the sum of the current translation and event delta', function() {
                    var gesture = {
                        deltaX: 150,
                        deltaY: -150
                    };
                    var targetState = getTargetState(EventTypes.DRAG_START, gesture);

                    expect(targetState.translateX).toBe(150);
                    expect(targetState.translateY).toBe(-150);
                });
            });

            describe('hold events', function() {
                it('should return the current transform state', function() {
                    var gesture = {
                        deltaX: 10,
                        deltaY: 10
                    };
                    var targetState = getTargetState(EventTypes.HOLD, gesture);

                    expect(targetState.equals(currentState)).toBe(true);
                });
            });

            describe('mouse wheel events', function() {
                it('should return a translation set to the sum of the current translation and event delta', function() {
                    var gesture = {
                        deltaX: 42,
                        deltaY: 666
                    };
                    var targetState = getTargetState(EventTypes.DRAG_START, gesture);

                    expect(targetState.translateX).toBe(42);
                    expect(targetState.translateY).toBe(666);
                });
            });

            describe('release events', function() {
                it('should return the current transform state', function() {
                    var gesture = {
                        deltaX: 10,
                        deltaY: 10
                    };
                    var targetState = getTargetState(EventTypes.RELEASE, gesture);

                    expect(targetState.equals(currentState)).toBe(true);
                });
            });

            describe('swipe events', function() {
                it('should return the current transform state', function() {
                    var gesture = {
                        deltaX: 50,
                        deltaY: -50
                    };
                    var targetState = getTargetState(EventTypes.SWIPE, gesture);

                    expect(targetState.equals(currentState)).toBe(true);
                });
            });

            describe('tap events', function() {
                it('should return the current transform state', function() {
                    var gesture = {
                        deltaX: 10,
                        deltaY: 10
                    };
                    var targetState = getTargetState(EventTypes.TAP, gesture);

                    expect(targetState.equals(currentState)).toBe(true);
                });
            });

            describe('touch events', function() {
                it('should return the current transform state', function() {
                    var gesture = {
                        deltaX: 10,
                        deltaY: 10
                    };
                    var targetState = getTargetState(EventTypes.TOUCH, gesture);

                    expect(targetState.equals(currentState)).toBe(true);
                });
            });

            describe('transform events', function() {
                var gesture = {
                    deltaX: 10,
                    deltaY: 20,
                    scale: 3.4
                };
                var targetState;

                beforeEach(function() {
                    currentState = new TransformState();
                    targetState = getTargetState(EventTypes.TRANSFORM, gesture);
                });

                it('should return a scale set to the difference between the current scale and event scale', function() {
                    expect(targetState.scale).toBe(3.4);
                });

                it('should return a translation set to the sum of the current translation and event delta', function() {
                    expect(targetState.translateX).toBe(10);
                    expect(targetState.translateY).toBe(20);
                });
            });

            describe('transform end events', function() {
                var gesture = {
                    center: {
                        pageX: 50,
                        pageY: 100
                    },
                    deltaX: 100,
                    deltaY: 200,
                    scale: 0.5
                };
                var targetState;

                beforeEach(function() {
                    currentState = new TransformState({
                        scale: 2,
                        translateX: 10,
                        translateY: 20
                    });
                    targetState = getTargetState(EventTypes.TRANSFORM_END, gesture);
                });

                it('should return a scale set to the difference between the current scale and event scale', function() {
                    expect(targetState.scale).toBe(1);
                });

                it('should not modify the current translation', function() {
                    expect(targetState.translateX).toBe(30);
                    expect(targetState.translateY).toBe(60);
                });
            });

            describe('transform start events', function() {
                var gesture = {
                    center: {
                        pageX: 50,
                        pageY: 100
                    },
                    deltaX: 100,
                    deltaY: 200,
                    scale: 0.5
                };
                var targetState;

                beforeEach(function() {
                    currentState = new TransformState({
                        scale: 2,
                        translateX: 10,
                        translateY: 20
                    });
                    targetState = getTargetState(EventTypes.TRANSFORM_START, gesture);
                });

                it('should return a scale set to the difference between the current scale and event scale', function() {
                    expect(targetState.scale).toBe(1);
                });

                it('should not modify the current translation', function() {
                    expect(targetState.translateX).toBe(30);
                    expect(targetState.translateY).toBe(60);
                });
            });
        });
    });
});