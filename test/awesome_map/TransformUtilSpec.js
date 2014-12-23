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

    var BrowserInfo = require('wf-js-common/BrowserInfo');
    var TransformState = require('wf-js-uicomponents/awesome_map/TransformState');
    var TransformUtil = require('wf-js-uicomponents/awesome_map/TransformUtil');

    describe('TransformUtil', function() {

        var target;
        var targetState;

        var originProp = BrowserInfo.cssTransformOriginProperty;
        var transformProp = BrowserInfo.cssTransformProperty;
        var transitionProp = BrowserInfo.cssTransitionProperty;

        beforeEach(function() {
            target = document.createElement('div');
            targetState = new TransformState({ translateX: 100, translateY: 100, scale: 2, duration: 100 });
        });

        describe('animations with CSS', function() {

            var currentState = new TransformState();

            if (BrowserInfo.cssTransitionProperty) {

                it('should apply both a transition and transform to the target', function() {
                    spyOn(TransformUtil, 'applyTransition');
                    spyOn(TransformUtil, 'applyTransform');

                    TransformUtil.animate(target, targetState, currentState, function() {});

                    expect(TransformUtil.applyTransition).toHaveBeenCalledWith(target, targetState);
                    expect(TransformUtil.applyTransform).toHaveBeenCalledWith(target, targetState);
                });

                it('should add a transition end event listener to the target', function() {
                    spyOn(target, 'addEventListener');

                    TransformUtil.animate(target, targetState, currentState, function() {});

                    expect(target.addEventListener)
                        .toHaveBeenCalledWith(BrowserInfo.Events.TRANSITION_END, jasmine.any(Function));
                });

                it('should remove the transition end event handler from the target when done', function() {
                    var done = false;

                    spyOn(target, 'addEventListener').andCallThrough();
                    spyOn(target, 'removeEventListener');

                    runs(function() {
                        TransformUtil.animate(target, targetState, currentState, function() {
                            done = true;
                        });
                    });

                    waitsFor(function() { return done; });

                    runs(function() {
                        expect(target.removeEventListener)
                            .toHaveBeenCalledWith(
                                BrowserInfo.Events.TRANSITION_END,
                                target.addEventListener.calls[0].args[1]);
                    });
                });

                it('should remove the transition from the target when done', function() {
                    var done = false;

                    spyOn(TransformUtil, 'removeTransition');

                    runs(function() {
                        TransformUtil.animate(target, targetState, currentState, function() {
                            done = true;
                        });
                    });

                    waitsFor(function() { return done; });

                    runs(function() {
                        expect(TransformUtil.removeTransition).toHaveBeenCalledWith(target);
                    });
                });

                it('should invoke the transition end handler if the browser fails to', function() {
                    // This test will fail in phantom if it should fail at all.
                    // Frankly, so should other tests. But this test exists as a reminder.
                    var done = false;

                    runs(function() {
                        TransformUtil.animate(target, targetState, currentState, function() {
                            done = true;
                        });
                    });

                    waitsFor(function() { return done; }, 500);
                });

                it('should cancel transform when stopped and return cancelled state', function() {
                    var animation;
                    var endState;
                    var computedStyle = {};
                    var parsedTransform = {
                        scaleX: 2,
                        translateX: 3,
                        translateY: 4
                    };

                    targetState.duration = 200;
                    computedStyle[BrowserInfo.cssTransformProperty] = 'matrix(0, 0, 0, 0, 0, 0)';

                    spyOn(window, 'getComputedStyle').andReturn(computedStyle);
                    spyOn(TransformUtil, 'parseTransformFromMatrix').andReturn(parsedTransform);
                    spyOn(TransformUtil, 'applyTransform');

                    runs(function() {
                        animation = TransformUtil.animate(target, targetState, currentState, function(state) {
                            endState = state;
                        });
                    });

                    waits(100);

                    var cancelledState;
                    runs(function() {
                        cancelledState = animation.stop();
                    });

                    waitsFor(function() { return !!endState; }, targetState.duration);

                    runs(function() {
                        expect(TransformUtil.parseTransformFromMatrix)
                            .toHaveBeenCalledWith(computedStyle[BrowserInfo.cssTransformProperty]);

                        expect(TransformUtil.applyTransform)
                            .toHaveBeenCalledWith(target, endState);

                        expect(endState).toBeDefined();
                        expect(endState.scale).toBe(parsedTransform.scaleX);
                        expect(endState.translateX).toBe(parsedTransform.translateX);
                        expect(endState.translateY).toBe(parsedTransform.translateY);

                        expect(endState).toBe(cancelledState);
                    });
                });

                it('should do nothing when stopped and return undefined', function() {
                    var animation;
                    var endState;

                    targetState.duration = 200;

                    spyOn(window, 'getComputedStyle').andReturn({});
                    spyOn(TransformUtil, 'parseTransformFromMatrix').andReturn(undefined);
                    spyOn(TransformUtil, 'applyTransform');

                    runs(function() {
                        animation = TransformUtil.animate(target, targetState, currentState, function(state) {
                            endState = state;
                        });
                    });

                    waits(100);

                    var cancelledState;
                    runs(function() {
                        cancelledState = animation.stop();
                    });

                    waitsFor(function() { return !!endState; }, targetState.duration);

                    runs(function() {
                        // Ensure there isn't a second call which should happen during cancellation.
                        expect(TransformUtil.applyTransform.calls.length).toBe(1);
                        expect(cancelledState).not.toBeDefined();
                    });
                });
            }

            it('should call animateJS if CSS transitions are not supported in the browser', function() {
                var done = function() {};
                var cssTransitionProperty = BrowserInfo.cssTransitionProperty;

                spyOn(TransformUtil, 'animateJS');

                BrowserInfo.cssTransitionProperty = false;
                TransformUtil.animate(target, targetState, currentState, done);
                BrowserInfo.cssTransitionProperty = cssTransitionProperty;

                expect(TransformUtil.animateJS)
                    .toHaveBeenCalledWith(target, targetState, currentState, done);
            });
        });

        describe('animations with JavaScript', function() {

            var currentState = new TransformState();

            it('should transform target to the target state', function() {
                var endState;

                runs(function() {
                    TransformUtil.animateJS(target, targetState, currentState, function(state) {
                        endState = state;
                    });
                });

                waitsFor(function() { return !!endState; }, 250);

                runs(function() {
                    expect(endState.translateX).toEqual(targetState.translateX);
                    expect(endState.translateY).toEqual(targetState.translateY);
                    expect(endState.scale).toEqual(targetState.scale);
                });
            });

            it('should cancel transform when stopped and return cancelled state', function() {
                var animation;
                var endState;

                targetState.duration = 1000;

                runs(function() {
                    animation = TransformUtil.animateJS(target, targetState, currentState, function(state) {
                        endState = state;
                    });
                });

                waits(50);

                var cancelledState;
                runs(function() {
                    cancelledState = animation.stop();
                });

                waitsFor(function() { return !!endState; }, targetState.duration);

                runs(function() {
                    expect(endState.translateX).toBeGreaterThan(currentState.translateX);
                    expect(endState.translateY).toBeGreaterThan(currentState.translateY);
                    expect(endState.scale).toBeGreaterThan(currentState.scale);

                    expect(endState.translateX).toBeLessThan(targetState.translateX);
                    expect(endState.translateY).toBeLessThan(targetState.translateY);
                    expect(endState.scale).toBeLessThan(targetState.scale);

                    expect(endState).toEqual(cancelledState);
                });
            });
        });

        describe('applying transforms', function() {

            it('should use a 3d transform if available', function() {
                if (BrowserInfo.hasCssTransforms3d) {
                    TransformUtil.applyTransform(target, targetState);

                    expect(target.style[transformProp])
                        .toBe('translate3d(100px, 100px, 0px) scale(2)');
                }
            });

            it('should use a 2d transform if 3d is not available', function() {
                if (!BrowserInfo.hasCssTransforms3d) {
                    TransformUtil.applyTransform(target, targetState);

                    expect(target.style[transformProp])
                        .toBe('translate(100px, 100px) scale(2)');
                }
            });

            it('should use a 2d transform if 2d is requested', function() {
                TransformUtil.applyTransform(target, targetState, true /* use2d */);

                expect(target.style[transformProp])
                    .toBe('translate(100px, 100px) scale(2)');
            });

            it('should set willChange to transform if using 3d transforms', function() {
                if (BrowserInfo.hasCssTransforms3d) {
                    TransformUtil.applyTransform(target, targetState);
                    expect(target.style.willChange).toBe('transform');
                }
            });

            it('should set willChange to empty after doing a 2d transform', function() {
                if (BrowserInfo.hasCssTransforms3d) {
                    TransformUtil.applyTransform(target, targetState);
                    expect(target.style.willChange).toBe('transform');
                    TransformUtil.applyTransform(target, targetState, true /* use2d */);
                    expect(target.style.willChange).toBe('');
                }
            });

            it('should throw if scale is NaN', function() {
                targetState.scale = NaN;
                expect(function() {
                    TransformUtil.applyTransform(target, targetState);
                }).toThrow();
            });

            it('should throw if translateX is NaN', function() {
                targetState.translateX = NaN;
                expect(function() {
                    TransformUtil.applyTransform(target, targetState);
                }).toThrow();
            });

            it('should throw if translateY is NaN', function() {
                targetState.translateY = NaN;
                expect(function() {
                    TransformUtil.applyTransform(target, targetState);
                }).toThrow();
            });
        });

        describe('applying transitions', function() {

            it('should apply the duration and easing to the target', function() {
                var transition;

                TransformUtil.applyTransition(target, targetState);
                transition = target.style[transitionProp];

                // Not the best test, but to run cross browser (and version)
                // we cannot simply compare a string. So look for value a la:
                // 'all 100ms cubic-bezier(...) 0s'.
                expect(transition).toMatch(/(all )?\d+ms cubic-bezier\(.*\)( 0s)?/);
                expect(transition).toContain(targetState.duration + 'ms');
                expect(transition).toContain(targetState.easing.css);
            });
        });

        describe('clearing transform origins', function() {

            it('should use 3 values if 3d transform if available', function() {
                if (BrowserInfo.hasCssTransforms3d) {
                    TransformUtil.clearTransformationOrigin(target);

                    expect(target.style[originProp]).toBe('0px 0px 0px');
                }
            });

            it('should use 2 values if 3d transform is not available', function() {
                if (!BrowserInfo.hasCssTransforms3d) {
                    TransformUtil.clearTransformationOrigin(target);

                    expect(target.style[originProp]).toBe('0px 0px');
                }
            });
        });

        describe('parsing transform values from matrices', function() {

            it('should parse values from matrix', function() {
                var values = TransformUtil.parseTransformFromMatrix(
                    'matrix(1.1, 0, 0, 2.2, 3.3, -4.4)'
                );

                expect(values.scaleX).toBe(1.1);
                expect(values.scaleY).toBe(2.2);
                expect(values.translateX).toBe(3.3);
                expect(values.translateY).toBe(-4.4);
            });

            it('should return undefined when parse matrix fails', function() {
                var values = TransformUtil.parseTransformFromMatrix(
                    'matrix(foo, bar, baz)'
                );
                expect(values).not.toBeDefined();
            });

            it('should parse values from matrix3d', function() {
                var values = TransformUtil.parseTransformFromMatrix(
                    'matrix3d(1.1, 0, 0, 0, 0, 2.2, 0, 0, 0, 0, 3.3, 0, 4.4, -5.5, 6.6, 0)'
                );

                expect(values.scaleX).toBe(1.1);
                expect(values.scaleY).toBe(2.2);
                expect(values.scaleZ).toBe(3.3);
                expect(values.translateX).toBe(4.4);
                expect(values.translateY).toBe(-5.5);
                expect(values.translateZ).toBe(6.6);
            });

            it('should return undefined when parse matrix3d fails', function() {
                var values = TransformUtil.parseTransformFromMatrix(
                    'matrix3d(foo, bar, baz)'
                );
                expect(values).not.toBeDefined();
            });
        });

        describe('removing transforms', function() {

            beforeEach(function() {
                TransformUtil.removeTransform(target);
            });

            it('should remove the transform origin', function() {
                expect(target.style[originProp]).toBe('');
            });

            it('should remove the transform', function() {
                expect(target.style[transformProp]).toBe('');
            });

            it('should remove the willChange', function() {
                expect(target.style.willChange).toBe('');
            });
        });

        describe('removing transitions', function() {

            it('should remove the CSS transition from the target', function() {
                TransformUtil.removeTransition(target);
                expect(target.style[transitionProp]).toBe('');
            });
        });
    });
});
