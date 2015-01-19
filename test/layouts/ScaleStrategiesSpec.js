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

    var ScaleStrategies = require('wf-js-uicomponents/layouts/ScaleStrategies');

    describe('ScaleStrategies', function() {
        var viewportDimensions = { height: 300, width: 400 };
        var content = { height: 600, width: 600 };
        var contents = [
            { height: 500, width: 200 },
            { height: 600, width: 600 },
            { height: 300, width: 1200 }
        ];
        var contentMargin = 0;

        describe('when auto-fitting to the viewport', function() {
            it('should return the scale required to fit a single item', function() {
                var scale = ScaleStrategies.auto(viewportDimensions, content, contentMargin);

                expect(scale).toBeCloseTo(0.5);
            });

            it('should return the minimum scale required to fit the largest of multiple items', function() {
                var scale = ScaleStrategies.auto(viewportDimensions, contents, contentMargin);

                expect(scale).toBeCloseTo(0.33, 2);
            });
        });

        describe('when fitting to viewport height', function() {
            it('should return the scale required to fit a single item', function() {
                var scale = ScaleStrategies.height(viewportDimensions, content, contentMargin);

                expect(scale).toBeCloseTo(0.5);
            });

            it('should return the scale required to fit the tallest of multiple items', function() {
                var scale = ScaleStrategies.height(viewportDimensions, contents, contentMargin);

                expect(scale).toBeCloseTo(0.5);
            });
        });

        describe('when fitting to viewport width', function() {
            it('should return the scale required to fit a single item', function() {
                var scale = ScaleStrategies.width(viewportDimensions, content, contentMargin);

                expect(scale).toBeCloseTo(0.67, 2);
            });

            it('should return the scale required to fit the widest of multiple items', function() {
                var scale = ScaleStrategies.width(viewportDimensions, contents, contentMargin);

                expect(scale).toBeCloseTo(0.33, 2);
            });
        });

        describe('when not fitting', function() {
            it('should not scale the content', function() {
                var scale = ScaleStrategies.none(viewportDimensions, content, contentMargin);

                expect(scale).toEqual(1.0);
            });
        });
    });
});
