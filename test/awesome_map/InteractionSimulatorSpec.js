/*
 * Copyright 2015 Workiva Inc.
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
    var DestroyUtil = require('wf-js-common/DestroyUtil');
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');
    var InteractionSimulator = require('wf-js-uicomponents/awesome_map/InteractionSimulator');

    describe('InteractionSimulator', function() {

        var targetCSS = { position: 'absolute', top: -10000, left: 10000, width: 200, height: 400 };
        var $target = $('<div>').css(targetCSS);
        var dispatch;

        function getDispatchedArgs(callIndex) {
            return dispatch.calls[callIndex].args[0][1];
        }

        function getDispatchedEvent(callIndex) {
            return getDispatchedArgs(callIndex).event;
        }

        beforeEach(function() {
            $target.appendTo('body');
        });

        afterEach(function() {
            $target.remove();
        });

        describe('construction', function() {

            it('should throw if configuration is not provided', function() {
                var constructor = function() {
                    return new InteractionSimulator();
                };

                expect(constructor).toThrow({
                    message: 'InteractionSimulator configuration is required.'
                });
            });

            it('should throw if target is not provided', function() {
                var constructor = function() {
                    return new InteractionSimulator({});
                };

                expect(constructor).toThrow({
                    message: 'InteractionSimulator configuration: target is required.'
                });
            });
        });

        describe('disposal', function() {

            var simulator;

            beforeEach(function() {
                simulator = new InteractionSimulator({ target: $target[0] });
            });

            it('should dispose the onEventSimulated observable', function() {
                var onEventSimulated = simulator.onEventSimulated;

                spyOn(onEventSimulated, 'dispose');
                simulator.dispose();

                expect(onEventSimulated.dispose).toHaveBeenCalled();
            });

            it('should destroy the instance', function() {
                spyOn(DestroyUtil, 'destroy');

                simulator.dispose();

                expect(DestroyUtil.destroy).toHaveBeenCalledWith(simulator);
            });
        });

        describe('simulating pans', function() {

            var simulator;
            var configuration;

            beforeEach(function() {
                configuration = { target: $target[0], animationDuration: 1000 };
                simulator = new InteractionSimulator(configuration);

                spyOn(simulator.onEventSimulated, 'dispatch');
                dispatch = simulator.onEventSimulated.dispatch;
            });

            it('should dispatch a touch event first', function() {
                runs(function() {
                    simulator.simulatePan({ type: 'by' });
                });

                waitsFor(function() { return dispatch.calls.length === 3; }, 100);

                runs(function() {
                    var evt = getDispatchedEvent(0);
                    expect(evt.type).toBe(EventTypes.TOUCH);
                });
            });

            it('should dispatch a release event with the done callback last', function() {
                var done = function() {};

                runs(function() {
                    simulator.simulatePan({ type: 'to', done: done });
                });

                waitsFor(function() { return dispatch.calls.length === 3; }, 100);

                runs(function() {
                    var args = getDispatchedArgs(2);
                    expect(args.event.type).toBe(EventTypes.RELEASE);
                    expect(args.done).toBe(done);
                });
            });

            it('should dispatch a drag event with the deltas and duration when type is "by"', function() {
                runs(function() {
                    simulator.simulatePan({ type: 'by', x: 1, y: 2, duration: 3 });
                });

                waitsFor(function() { return dispatch.calls.length === 3; }, 100);

                runs(function() {
                    var evt = getDispatchedEvent(1);
                    expect(evt.type).toBe(EventTypes.DRAG);
                    expect(evt.cumulativeGesture.deltaX).toBe(0);
                    expect(evt.cumulativeGesture.deltaY).toBe(0);
                    expect(evt.iterativeGesture.deltaX).toBe(1);
                    expect(evt.iterativeGesture.deltaY).toBe(2);
                    expect(evt.iterativeGesture.duration).toBe(3);
                });
            });

            it('should dispatch a drag event with deferred deltas and duration when type is "to"', function() {
                runs(function() {
                    simulator.simulatePan({ type: 'to', x: 1, y: 2, duration: 3 });
                });

                waitsFor(function() { return dispatch.calls.length === 3; }, 100);

                runs(function() {
                    var evt = getDispatchedEvent(1);
                    expect(evt.type).toBe(EventTypes.DRAG);
                    expect(evt.targetState.translateX).toBe(1);
                    expect(evt.targetState.translateY).toBe(2);
                    expect(evt.cumulativeGesture.deltaX).toBe(0);
                    expect(evt.cumulativeGesture.deltaY).toBe(0);
                    expect(evt.iterativeGesture.deltaX).toBe(0);
                    expect(evt.iterativeGesture.deltaY).toBe(0);
                    expect(evt.iterativeGesture.duration).toBe(3);
                });
            });

            it('should dispatch a drag event with default animation duration when none specified', function() {
                runs(function() {
                    simulator.simulatePan({ type: 'to', x: 1, y: 2 });
                });

                waitsFor(function() { return dispatch.calls.length === 3; }, 100);

                runs(function() {
                    var evt = getDispatchedEvent(1);
                    expect(evt.type).toBe(EventTypes.DRAG);
                    expect(evt.iterativeGesture.duration).toBe(configuration.animationDuration);
                });
            });
        });

        describe('simulating swipes', function() {

            var simulator;
            var configuration;

            beforeEach(function() {
                configuration = { target: $target[0], animationDuration: 1000 };
                simulator = new InteractionSimulator(configuration);

                spyOn(simulator.onEventSimulated, 'dispatch');
                dispatch = simulator.onEventSimulated.dispatch;
            });

            it('should require a direction', function() {
                var call = function() {
                    simulator.simulateSwipe({});
                };

                expect(call).toThrow('InteractionSimulator.simulateSwipe: direction is required');
            });

            it('should dispatch a touch event first', function() {
                runs(function() {
                    simulator.simulateSwipe({ direction: 'up' });
                });

                waitsFor(function() { return dispatch.calls.length === 3; }, 100);

                runs(function() {
                    var evt = getDispatchedEvent(0);
                    expect(evt.type).toBe(EventTypes.TOUCH);
                });
            });

            it('should dispatch a release event with the done callback', function() {
                var done = function() {};

                runs(function() {
                    simulator.simulateSwipe({ direction: 'up', done: done });
                });

                waitsFor(function() { return dispatch.calls.length === 3; }, 100);

                runs(function() {
                    var args = getDispatchedArgs(2);
                    expect(args.event.type).toBe(EventTypes.RELEASE);
                    expect(args.done).toBe(done);
                });
            });

            it('should dispatch a swipe event with the direction, velocity and duration', function() {
                runs(function() {
                    simulator.simulateSwipe({ direction: 'up', velocity: 1, duration: 2 });
                });

                waitsFor(function() { return dispatch.calls.length === 3; }, 100);

                runs(function() {
                    var evt = getDispatchedEvent(1);
                    expect(evt.type).toBe(EventTypes.SWIPE);
                    expect(evt.iterativeGesture.direction).toBe('up');
                    expect(evt.iterativeGesture.duration).toBe(2);
                    expect(evt.iterativeGesture.velocityX).toBe(0);
                    expect(evt.iterativeGesture.velocityY).toBe(1);
                });
            });

            it('should dispatch a swipe event with velocityY when direction is "up"', function() {
                runs(function() {
                    simulator.simulateSwipe({ direction: 'up', velocity: 1 });
                });

                waitsFor(function() { return dispatch.calls.length === 3; }, 100);

                runs(function() {
                    var evt = getDispatchedEvent(1);
                    expect(evt.type).toBe(EventTypes.SWIPE);
                    expect(evt.iterativeGesture.direction).toBe('up');
                    expect(evt.iterativeGesture.velocityX).toBe(0);
                    expect(evt.iterativeGesture.velocityY).toBe(1);
                });
            });

            it('should dispatch a swipe event with velocityY when direction is "down"', function() {
                runs(function() {
                    simulator.simulateSwipe({ direction: 'down', velocity: 1 });
                });

                waitsFor(function() { return dispatch.calls.length === 3; }, 100);

                runs(function() {
                    var evt = getDispatchedEvent(1);
                    expect(evt.type).toBe(EventTypes.SWIPE);
                    expect(evt.iterativeGesture.direction).toBe('down');
                    expect(evt.iterativeGesture.velocityX).toBe(0);
                    expect(evt.iterativeGesture.velocityY).toBe(1);
                });
            });

            it('should dispatch a swipe event with velocityX when direction is "left"', function() {
                runs(function() {
                    simulator.simulateSwipe({ direction: 'left', velocity: 1 });
                });

                waitsFor(function() { return dispatch.calls.length === 3; }, 100);

                runs(function() {
                    var evt = getDispatchedEvent(1);
                    expect(evt.type).toBe(EventTypes.SWIPE);
                    expect(evt.iterativeGesture.direction).toBe('left');
                    expect(evt.iterativeGesture.velocityX).toBe(1);
                    expect(evt.iterativeGesture.velocityY).toBe(0);
                });
            });

            it('should dispatch a swipe event with velocityX when direction is "right"', function() {
                runs(function() {
                    simulator.simulateSwipe({ direction: 'right', velocity: 1 });
                });

                waitsFor(function() { return dispatch.calls.length === 3; }, 100);

                runs(function() {
                    var evt = getDispatchedEvent(1);
                    expect(evt.type).toBe(EventTypes.SWIPE);
                    expect(evt.iterativeGesture.direction).toBe('right');
                    expect(evt.iterativeGesture.velocityX).toBe(1);
                    expect(evt.iterativeGesture.velocityY).toBe(0);
                });
            });

            it('should dispatch a swipe event with the default animation duration when none specified', function() {
                runs(function() {
                    simulator.simulateSwipe({ direction: 'up', velocity: 1 });
                });

                waitsFor(function() { return dispatch.calls.length === 3; }, 100);

                runs(function() {
                    var evt = getDispatchedEvent(1);
                    expect(evt.type).toBe(EventTypes.SWIPE);
                    expect(evt.iterativeGesture.duration).toBe(configuration.animationDuration);
                });
            });
        });

        describe('simulating zooms', function() {

            var simulator;
            var configuration;

            beforeEach(function() {
                configuration = { target: $target[0], animationDuration: 1000 };
                simulator = new InteractionSimulator(configuration);

                spyOn(simulator.onEventSimulated, 'dispatch');
                dispatch = simulator.onEventSimulated.dispatch;
            });

            it('should dispatch a touch event first', function() {
                runs(function() {
                    simulator.simulateZoom({ type: 'by' });
                });

                waitsFor(function() { return dispatch.calls.length === 3; }, 100);

                runs(function() {
                    var evt = getDispatchedEvent(0);
                    expect(evt.type).toBe(EventTypes.TOUCH);
                });
            });

            it('should dispatch a release event with the done callback last', function() {
                var done = function() {};

                runs(function() {
                    simulator.simulateZoom({ type: 'to', done: done });
                });

                waitsFor(function() { return dispatch.calls.length === 3; }, 100);

                runs(function() {
                    var dispatchArgs = getDispatchedArgs(2);
                    expect(dispatchArgs.event.type).toBe(EventTypes.RELEASE);
                    expect(dispatchArgs.event.position).not.toBeFalsy();
                    expect(dispatchArgs.done).toBe(done);
                });
            });

            it('should dispatch a transform event with the scale delta and duration when type is "by"', function() {
                runs(function() {
                    simulator.simulateZoom({ type: 'by', scale: 2, duration: 100 });
                });

                waitsFor(function() { return dispatch.calls.length === 3; }, 200);

                runs(function() {
                    var evt = getDispatchedEvent(1);
                    expect(evt.type).toBe(EventTypes.TRANSFORM);
                    expect(evt.iterativeGesture.scale).toBe(2);
                    expect(evt.iterativeGesture.duration).toBe(100);
                });
            });

            it('should dispatch a transform event with deferred scale delta and duration when type is "to"', function() {
                runs(function() {
                    simulator.simulateZoom({ type: 'to', scale: 2, duration: 100 });
                });

                waitsFor(function() { return dispatch.calls.length === 3; }, 200);

                runs(function() {
                    var evt = getDispatchedEvent(1);
                    expect(evt.type).toBe(EventTypes.TRANSFORM);
                    expect(evt.targetState.scale).toBe(2);
                    expect(evt.iterativeGesture.scale).toBe(1);
                    expect(evt.iterativeGesture.duration).toBe(100);
                });
            });

            it('should dispatch a transform event with supplied zoom origin', function() {
                runs(function() {
                    simulator.simulateZoom({ scale: 2, originX: 100, originY: 50 });
                });

                waitsFor(function() { return dispatch.calls.length === 3; }, 100);

                runs(function() {
                    var evt = getDispatchedEvent(1);
                    expect(evt.type).toBe(EventTypes.TRANSFORM);
                    expect(evt.position.x).toBe(100);
                    expect(evt.position.y).toBe(50);
                });
            });

            it('should dispatch a transform event with zoom origin from center when none is specified', function() {
                runs(function() {
                    simulator.simulateZoom({ scale: 2 });
                });

                waitsFor(function() { return dispatch.calls.length === 3; }, 100);

                runs(function() {
                    var evt = getDispatchedEvent(1);
                    expect(evt.type).toBe(EventTypes.TRANSFORM);
                    expect(evt.position.x).toBe(targetCSS.width / 2);
                    expect(evt.position.y).toBe(targetCSS.height / 2);
                });
            });

            it('should dispatch a transform event with default animation duration when none specified', function() {
                runs(function() {
                    simulator.simulateZoom({ type: 'to', scale: 1 });
                });

                waitsFor(function() { return dispatch.calls.length === 3; }, 100);

                runs(function() {
                    var evt = getDispatchedEvent(1);
                    expect(evt.type).toBe(EventTypes.TRANSFORM);
                    expect(evt.iterativeGesture.duration).toBe(configuration.animationDuration);
                });
            });
        });
    });
});