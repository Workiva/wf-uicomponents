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

    var EasingFunctions = require('wf-js-uicomponents/awesome_map/EasingFunctions');

    describe('EasingFunctions', function() {

        var startValue = 0;
        var delta = 1;
        var duration = 100;

        function expectStartValueWhenNoTimeElapses(fn) {
            var value = fn(startValue, delta, duration, 0);

            expect(value).toBe(startValue);
        }

        function expectEndValueWhenDurationElapses(fn) {
            var value = fn(startValue, delta, duration, 100);

            expect(value).toBe(startValue + delta);
        }

        describe('easeOutCubic', function() {

            describe('css', function() {
                it('should be the ease out cubic CSS string', function() {
                    expect(EasingFunctions.easeOutCubic.css)
                        .toBe('cubic-bezier(0.215, 0.61, 0.355, 1)');
                });
            });

            describe('js', function() {
                it('should return start value when no time elapses', function() {
                    expectStartValueWhenNoTimeElapses(EasingFunctions.easeOutCubic.js);
                });

                it('should return target value when duration elapses', function() {
                    expectEndValueWhenDurationElapses(EasingFunctions.easeOutCubic.js);
                });
            });
        });

        describe('easeOutQuart', function() {

            describe('css', function() {
                it('should be the ease out cubic CSS string', function() {
                    expect(EasingFunctions.easeOutQuart.css)
                        .toBe('cubic-bezier(0.165, 0.84, 0.44, 1)');
                });
            });

            describe('js', function() {
                it('should return start value when no time elapses', function() {
                    expectStartValueWhenNoTimeElapses(EasingFunctions.easeOutQuart.js);
                });

                it('should return target value when duration elapses', function() {
                    expectEndValueWhenDurationElapses(EasingFunctions.easeOutQuart.js);
                });
            });
        });
    });
});