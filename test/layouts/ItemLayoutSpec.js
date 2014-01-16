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

    var ItemLayout = require('wf-js-uicomponents/layouts/ItemLayout');

    describe('ItemLayout', function() {

        describe('defaults', function() {
            var layout;

            beforeEach(function() {
                layout = new ItemLayout();
            });

            it('should have item index of -1', function() {
                expect(layout.itemIndex).toBe(-1);
            });

            it('should have top of 0', function() {
                expect(layout.top).toBe(0);
            });

            it('should have bottom of 0', function() {
                expect(layout.bottom).toBe(0);
            });

            it('should have left of 0', function() {
                expect(layout.left).toBe(0);
            });

            it('should have scale to fit of 1', function() {
                expect(layout.scaleToFit).toBe(1);
            });

            it('should have padding top of 0', function() {
                expect(layout.paddingTop).toBe(0);
            });

            it('should have padding bottom of 0', function() {
                expect(layout.paddingBottom).toBe(0);
            });

            it('should have padding left of 0', function() {
                expect(layout.paddingLeft).toBe(0);
            });

            it('should have padding right of 0', function() {
                expect(layout.paddingRight).toBe(0);
            });

            it('should have width of 0', function() {
                expect(layout.width).toBe(0);
            });

            it('should have height of 0', function() {
                expect(layout.height).toBe(0);
            });

            it('should have outerWidth of 0', function() {
                expect(layout.outerWidth).toBe(0);
            });

            it('should have outerHeight of 0', function() {
                expect(layout.outerHeight).toBe(0);
            });
        });
    });
});