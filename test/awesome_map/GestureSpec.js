/*
 * Copyright 2015 Workiva, Inc.
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
    var Gesture = require('wf-js-uicomponents/awesome_map/Gesture');

    describe('Gesture', function() {

        describe('construction', function() {

            it('should throw if the template is hammer-like', function() {
                var g;
                var hammerLike = { srcEvent: null };
                expect(function() { g = new Gesture(hammerLike); }).toThrow();

                hammerLike = { deltaTime: null };
                expect(function() { g = new Gesture(hammerLike); }).toThrow();
            });
        });

        describe('cloning', function() {

            it('should return a new gesture with cloned properties', function() {
                var clone;
                var original = new Gesture({
                    angle: 1,
                    center: { pageX: 100, pageY: 101 },
                    deltaX: 2,
                    deltaY: 3,
                    direction: 'sideways',
                    duration: 4,
                    scale: 5,
                    source: 'fakeEvent',
                    target: document.createElement('div'),
                    touches: [{ pageX: 200, pageY: 201 }],
                    velocityX: 6,
                    velocityY: 7
                });

                clone = original.clone();

                expect(clone).toEqual(original);
            });
        });

        describe('creating iterative gestures', function() {

            it('should calculate the deltaX change', function() {
                var gesture1 = new Gesture({ deltaX: 5 });
                var gesture2 = new Gesture({ deltaX: 7 });

                var iterative = gesture2.createIterativeGesture(gesture1);

                expect(iterative.deltaX).toBe(2);
            });

            it('should calculate the deltaY change', function() {
                var gesture1 = new Gesture({ deltaY: 5 });
                var gesture2 = new Gesture({ deltaY: 7 });

                var iterative = gesture2.createIterativeGesture(gesture1);

                expect(iterative.deltaY).toBe(2);
            });

            it('should return the scale delta if touch distance is valid', function() {
                var touches = [{ pageX: 10, pageY: 10 }, { pageX: 12, pageY: 12 }];
                var gesture1 = new Gesture({ scale: 2, touches: touches });
                var gesture2 = new Gesture({ scale: 3 });

                var iterative = gesture2.createIterativeGesture(gesture1);

                expect(iterative.scale).toBeCloseTo(1.5);
            });

            it('should return scale of 1 if touch distance is invalid', function() {
                var gesture1 = new Gesture({ scale: 2 });
                var gesture2 = new Gesture({ scale: 3 });

                var iterative = gesture2.createIterativeGesture(gesture1);

                expect(iterative.scale).toBe(1);
            });
        });

        describe('getting gesture position', function() {

            it('should return (x, y) of the gesture relative to the target', function() {
                var $target = $('<div>').css({
                    position: 'absolute',
                    top: 10000,
                    left: 20000
                }).appendTo('body');

                var gesture = new Gesture({
                    target: $target[0],
                    center: { pageX: 20001, pageY: 10002 }
                });

                var position = gesture.getPosition();

                expect(position.x).toBe(1);
                expect(position.y).toBe(2);

                $target.remove();
            });

            it('should return null if target is absent', function() {
                var gesture = new Gesture({ target: 'something' });
                var position = gesture.getPosition();

                expect(position).toBeNull();
            });

            it('should return null if center is absent', function() {
                var gesture = new Gesture({ center: [] });
                var position = gesture.getPosition();

                expect(position).toBeNull();
            });
        });

        describe('creating from a hammer gesture', function() {

            it('should map hammer gesture properties to Gesture properties', function() {
                var target = document.createElement('div');
                var hammerGesture = {
                    angle: 1,
                    center: { pageX: 100, pageY: 101 },
                    deltaX: 2,
                    deltaY: 3,
                    direction: 'up',
                    scale: 4,
                    srcEvent: 'foo',
                    target: target,
                    touches: [{ pageX: 33, pageY: 34 }],
                    velocityX: 5,
                    velocityY: 6
                };

                var gesture = Gesture.fromHammerGesture(hammerGesture);

                expect(gesture.angle).toBe(hammerGesture.angle);
                expect(gesture.center).toBe(hammerGesture.center);
                expect(gesture.deltaX).toBe(hammerGesture.deltaX);
                expect(gesture.deltaY).toBe(hammerGesture.deltaY);
                expect(gesture.direction).toBe(hammerGesture.direction);
                expect(gesture.duration).toBe(0);
                expect(gesture.scale).toBe(hammerGesture.scale);
                expect(gesture.source).toBe(hammerGesture.srcEvent);
                expect(gesture.target).toBe(hammerGesture.target);
                expect(gesture.touches).toBe(hammerGesture.touches);
                expect(gesture.velocityX).toBe(hammerGesture.velocityX);
                expect(gesture.velocityY).toBe(hammerGesture.velocityY);
            });
        });
    });
});