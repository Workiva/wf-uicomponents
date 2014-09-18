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
    var requestAnimFrame = require('wf-js-common/requestAnimationFrame');

    var numberPattern = '-?[\\d\\.]+';

    /**
     * @classdesc
     *
     * TransformUtil contains utilities for working with transforms.
     *
     * @exports TransformUtil
     */
    var TransformUtil = {

        /**
         * RegExp for parsing transformation properties from a matrix:
         *
         * matrix(
         *     scaleX, n, n,
         *     scaleY, translateX, translateY
         * )
         *
         * @type {string}
         */
        cssMatrixRegExp: new RegExp(
            'matrix\\((%d), %d, %d, (%d), (%d), (%d)\\)'
                .replace(/%d/g, numberPattern)
        ),

        /**
         * RegExp for parsing transformation properties from a matrix:
         *
         * matrix3d(
         *     scaleX, n, n, n,
         *     n, scaleY, n, n,
         *     n, n, scaleZ, n,
         *     translateX, translateY, translateZ, n
         * )
         *
         * @type {string}
         */
        cssMatrix3dRegExp: new RegExp(
            'matrix3d\\((%d), %d, %d, %d, %d, (%d), %d, %d, %d, %d, (%d), %d, (%d), (%d), (%d), %d\\)'
                .replace(/%d/g, numberPattern)
        ),

        /**
         * Transition an element to the given target state using CSS transitions.
         * If CSS transitions are not supported, use a JavaScript fallback instead.
         * @method
         * @param {HTMLElement} target
         * @param {TransformState} targetState
         * @param {TransformState} currentState
         * @param {Function} done - Callback invoked when the transition finishes.
         * @return {{ stop: Function }}
         */
        animate: function(target, targetState, currentState, done) {
            // If this browser doesn't support transitions,
            // use the JavaScript animation function instead.
            if (!BrowserInfo.cssTransitionProperty) {
                return TransformUtil.animateJS(target, targetState, currentState, done);
            }

            var transitionEndEvent = BrowserInfo.Events.TRANSITION_END;
            var transitionEnded = false;
            var transitionEndEmulatorId;
            var cancelledState;

            var transitionEndHandler = function() {
                clearTimeout(transitionEndEmulatorId);
                transitionEnded = true;

                target.removeEventListener(transitionEndEvent, transitionEndHandler);

                TransformUtil.removeTransition(target);

                if (cancelledState) {
                    TransformUtil.applyTransform(target, cancelledState);
                    requestAnimFrame(function() {
                        done(cancelledState);
                    });
                }
                else {
                    done(targetState);
                }

            };

            // Register the the transitionEnd event handler.
            // Emulate the transition end to cover cases where the browser
            // doesn't fire the transitionEnd event. This can happen if
            // properties don't change or a repaint is not triggered.
            target.addEventListener(transitionEndEvent, transitionEndHandler);
            transitionEndEmulatorId = setTimeout(transitionEndHandler, targetState.duration + 50);

            TransformUtil.applyTransition(target, targetState);
            TransformUtil.applyTransform(target, targetState);

            return {
                stop: function() {
                    var style = window.getComputedStyle(target);
                    var currentTransformMatrix = style[BrowserInfo.cssTransformProperty];
                    var transform = TransformUtil.parseTransformFromMatrix(currentTransformMatrix);

                    // Guard against parsing failures.
                    if (!transform) {
                        return;
                    }

                    cancelledState = targetState.clone();
                    cancelledState.scale = transform.scaleX; // Note: always scaling XY together.
                    cancelledState.translateX = transform.translateX;
                    cancelledState.translateY = transform.translateY;

                    transitionEndHandler();
                    return cancelledState;
                }
            };
        },

        /**
         * Animates a transformation using JavaScript.
         * @method
         * @param {HTMLElement} target - The element to transform.
         * @param {TransformState} targetState - The transformation target state.
         * @param {TransformState} currentState - The current transform state of the target.
         * @param {Function} done - Callback invoked when the animation finishes.
         * @returns {{ stop: Function }}
         */
        animateJS: function(target, targetState, currentState, done) {
            // Prepare state
            var stepState = currentState.clone();

            // Determine the deltas to animate over.
            var startX = currentState.translateX;
            var startY = currentState.translateY;
            var startScale = currentState.scale;
            var deltaX = targetState.translateX - startX;
            var deltaY = targetState.translateY - startY;
            var deltaScale = targetState.scale - startScale;

            // Prepare the timing data.
            var cancelled = false;
            var duration = targetState.duration;
            var elapsed = 0;
            var startTime;

            // Setup easing function.
            var easingFn = targetState.easing.js;

            function step(timestamp) {

                // If the transformation has been cancelled,
                // resolve the promise with the state of the last step; ...
                if (cancelled) {
                    stepState.translateX = stepState.translateX;
                    stepState.translateY = stepState.translateY;
                    TransformUtil.applyTransform(target, stepState);
                    return done(stepState);
                }

                // Otherwise, continue with the animation.

                // Find the elapsed time so we can ease. Use the timestamp
                // provided by browser impl of requestAnimationFrame if
                // available, otherwise use Date obj to compare.
                if (!startTime) {
                    startTime = timestamp || Date.now();
                }
                elapsed = (timestamp || Date.now()) - startTime;

                if (elapsed < duration) {
                    stepState.translateX = easingFn(startX, deltaX, duration, elapsed);
                    stepState.translateY = easingFn(startY, deltaY, duration, elapsed);
                    stepState.scale = easingFn(startScale, deltaScale, duration, elapsed);

                    TransformUtil.applyTransform(target, stepState);

                    requestAnimFrame(step);
                }
                else {
                    TransformUtil.applyTransform(target, targetState);

                    done(targetState);
                }
            }

            requestAnimFrame(step);

            return {
                stop: function() {
                    cancelled = true;
                    return stepState;
                }
            };
        },

        /**
         * Applies a CSS 2D transform to the target element.
         * @method
         * @param {HTMLElement} target - The element to transform.
         * @param {TransformState} targetState - The transformation target state.
         */
        applyTransform: function(target, targetState) {
            // Having NaNs can lead to lots of roundabout debugging, so throw
            if (isNaN(targetState.scale) ||
                isNaN(targetState.translateX) ||
                isNaN(targetState.translateY)
            ) {
                throw new Error('Invalid targetState');
            }

            var translate;

            if (BrowserInfo.hasCssTransforms3d) {
                translate = 'translate3d(' +
                    targetState.translateX + 'px, ' +
                    targetState.translateY + 'px, ' +
                    '0px' +
                ')';
            }
            else {
                translate = 'translate(' +
                    targetState.translateX + 'px, ' +
                    targetState.translateY + 'px' +
                ')';
            }

            target.style[BrowserInfo.cssTransformProperty] =
                translate +
                'scale(' + targetState.scale + ')';
        },

        /**
         * Applies a CSS transition to the target element.
         * @param {HTMLElement} target
         * @param {TransformState} targetState
         */
        applyTransition: function(target, targetState) {
            target.style[BrowserInfo.cssTransitionProperty] =
                'all ' +
                targetState.duration + 'ms ' +
                targetState.easing.css;
        },

        /**
         * Clear the transform origin of the target element.
         * @method
         */
        clearTransformationOrigin: function(target) {
            if (BrowserInfo.hasCssTransforms3d) {
                target.style[BrowserInfo.cssTransformOriginProperty] = '0px 0px 0px';
            }
            else {
                target.style[BrowserInfo.cssTransformOriginProperty] = '0px 0px';
            }
        },

        /**
         * Parse CSS transform values from a CSS matrix specification. This will
         * work for both 2d and 3d matrices.
         *
         * @method
         * @param {string} matrix The matrix value to parse
         * @returns {{
         *     scaleX: number,
         *     scaleY: number,
         *     scaleZ: number,
         *     translateX: number,
         *     translateY: number,
         *     translateZ: number
         * }}
         */
        parseTransformFromMatrix: function(matrix) {
            // Very Helpful: http://dev.opera.com/articles/view/understanding-the-css-transforms-matrix/

            var match;
            var result;

            if (~matrix.indexOf('matrix3d')) {
                match = this.cssMatrix3dRegExp.exec(matrix);
                if (match) {
                    result = {
                        scaleX: parseFloat(match[1], 10),
                        scaleY: parseFloat(match[2], 10),
                        scaleZ: parseFloat(match[3], 10),
                        translateX: parseFloat(match[4], 10),
                        translateY: parseFloat(match[5], 10),
                        translateZ: parseFloat(match[6], 10)
                    };
                }
            }
            else {
                match = this.cssMatrixRegExp.exec(matrix);
                if (match) {
                    result = {
                        scaleX: parseFloat(match[1], 10),
                        scaleY: parseFloat(match[2], 10),
                        translateX: parseFloat(match[3], 10),
                        translateY: parseFloat(match[4], 10)
                    };
                }
            }

            return result;
        },

        /**
         * Removes relevant CSS 2D transform properties from the target.
         * @method
         * @param {HTMLElement} target - The element to transform.
         */
        removeTransform: function(target) {
            target.style[BrowserInfo.cssTransformOriginProperty] = '';
            target.style[BrowserInfo.cssTransformProperty] = '';
        },

        /**
         * Removes relevant CSS transition properties from the target.
         * @method
         * @param {HTMLElement} target
         */
        removeTransition: function(target) {
            target.style[BrowserInfo.cssTransitionProperty] = '';
        }
    };

    return TransformUtil;
});
