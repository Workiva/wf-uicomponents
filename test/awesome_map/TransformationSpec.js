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

    var Transformation = require('wf-js-uicomponents/awesome_map/Transformation');
    var TransformState = require('wf-js-uicomponents/awesome_map/TransformState');
    var TransformUtil = require('wf-js-uicomponents/awesome_map/TransformUtil');

    describe('Transformation', function() {

        var target;
        var targetState;
        var currentState = new TransformState();

        beforeEach(function() {
            target = document.createElement('div');
            targetState = new TransformState({ translateX: 100, translateY: 100, scale: 2 });
        });

        describe('executing transforms', function() {

            it('should only execute once', function() {
                var transformation = new Transformation(target, targetState, currentState);

                spyOn(TransformUtil, 'applyTransform');

                // Should execute the first time.
                transformation.execute();
                expect(TransformUtil.applyTransform).toHaveBeenCalled();

                // But not the second time.
                transformation.execute();
                expect(TransformUtil.applyTransform.calls.length).toBe(1);
            });

            it('should not execute if there is no change', function() {
                var noChangeState = currentState.clone();
                var transformation = new Transformation(target, noChangeState, currentState);

                spyOn(TransformUtil, 'applyTransform');
                transformation.execute();

                expect(TransformUtil.applyTransform).not.toHaveBeenCalled();
            });

            it('should apply immediate transforms directly', function() {
                var transformation = new Transformation(target, targetState, currentState);

                spyOn(TransformUtil, 'applyTransform');
                transformation.execute();

                expect(TransformUtil.applyTransform).toHaveBeenCalledWith(target, targetState);
            });

            it('should invoke callback when immediate transforms finish', function() {
                var transformation = new Transformation(target, targetState, currentState);
                var done = jasmine.createSpy('done');

                transformation.execute(done);

                expect(done).toHaveBeenCalled();
            });

            it('should animate transforms with a duration', function() {
                var transformation = new Transformation(target, targetState, currentState);
                var done = function() {};

                targetState.duration = 100;
                spyOn(TransformUtil, 'animate');

                transformation.execute(done);

                expect(TransformUtil.animate).toHaveBeenCalledWith(target, targetState, currentState, done);
            });

            it('should invoke callback when animated transforms finish', function() {
                var transformation = new Transformation(target, targetState, currentState);
                var done = jasmine.createSpy('done');
                var duration = targetState.duration = 100;

                runs(function() {
                    transformation.execute(done);

                    expect(done).not.toHaveBeenCalled();
                });

                waits(duration * 2);

                runs(function() {
                    expect(done).toHaveBeenCalled();
                });
            });
        });

        describe('cancelling transforms', function() {

            it('should stop the current animation', function() {
                var transformation = new Transformation(target, targetState, currentState);
                var animation = jasmine.createSpyObj('animation', ['stop']);
                var duration = targetState.duration = 100;

                spyOn(TransformUtil, 'animate').andReturn(animation);
                spyOn(window, 'getComputedStyle').andReturn('matrix(1, 0, 0, 1, 0, 0)');

                runs(function() {
                    transformation.execute();
                });

                waits(duration / 2);

                runs(function() {
                    transformation.cancel();

                    expect(animation.stop).toHaveBeenCalled();
                });
            });

            it('should not fail when no animation is running', function() {
                var transformation = new Transformation(target, targetState, currentState);

                transformation.cancel();
            });
        });
    });
});
