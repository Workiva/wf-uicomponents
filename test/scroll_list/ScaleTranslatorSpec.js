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

    var AwesomeMap = require('wf-js-uicomponents/awesome_map/AwesomeMap');
    var DestroyUtil = require('wf-js-common/DestroyUtil');
    var ScaleInterceptor = require('wf-js-uicomponents/awesome_map/ScaleInterceptor');
    var ScaleTranslator = require('wf-js-uicomponents/scroll_list/ScaleTranslator');
    var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');
    var VerticalLayout = require('wf-js-uicomponents/layouts/VerticalLayout');

    describe('ScaleTranslator', function() {

        var map = AwesomeMap.prototype;
        var scrollList = ScrollList.prototype;
        var layout = VerticalLayout.prototype;
        var itemLayout;

        beforeEach(function() {
            itemLayout = { scaleToFit: 1 };
            spyOn(map, 'getInterceptor');
            spyOn(layout, 'getItemLayout').andReturn(itemLayout);
            spyOn(scrollList, 'getLayout').andReturn(layout);
        });

        it('should not throw during initialization if scroll list layout has no items', function() {
            // Spy in another way since spy is already setup for this method in beforeEach.
            layout.getItemLayout = jasmine.createSpy('getItemLayout');
            layout.getItemLayout.andReturn(undefined);
            return new ScaleTranslator(scrollList, map, 0);
        });

        it('should reinitialize after attaching to another map', function() {
            var otherMap = {};
            var translator = new ScaleTranslator(scrollList, map, 0);
            spyOn(translator, '_initialize');
            translator.attach(otherMap, 1);
            expect(translator._map).toBe(otherMap);
            expect(translator._itemIndex).toBe(1);
            expect(translator._initialize).toHaveBeenCalled();
        });

        it('should destroy on dispose', function() {
            spyOn(DestroyUtil, 'destroy');
            var translator = new ScaleTranslator(scrollList, map, 0);
            translator.dispose();
            expect(DestroyUtil.destroy).toHaveBeenCalled();
        });

        it('should update the scale interception limits to reflect translation', function() {
            var scaleInterceptor = new ScaleInterceptor({
                minimum: 1,
                maximum: 3
            });
            spyOn(scaleInterceptor, 'setMinimumScale');
            spyOn(scaleInterceptor, 'setMaximumScale');
            // Spy in another way since we've already spied in beforeEach.
            map.getInterceptor = jasmine.createSpy('getInterceptor');
            map.getInterceptor.andReturn(scaleInterceptor);
            spyOn(scrollList, 'getOptions').andReturn({
                scaleLimits: {
                    minimum: 1,
                    maximum: 3
                }
            });
            itemLayout.scaleToFit = 2;
            var translator = new ScaleTranslator(scrollList, map, 0);
            translator = null; // avoid new side-effect/unused var
            expect(scaleInterceptor.setMinimumScale).toHaveBeenCalledWith(0.5);
            expect(scaleInterceptor.setMaximumScale).toHaveBeenCalledWith(1.5);
        });

        describe('translation', function() {
            var translator;
            var scrollListOptions = {};

            beforeEach(function() {
                spyOn(scrollList, 'getOptions').andReturn(scrollListOptions);
                itemLayout.scaleToFit = 0.5;
                translator = new ScaleTranslator(scrollList, map, 0);
            });

            it('should translate from base content scale to map scale', function() {
                var mapScale = translator.toMapScale(0.5);
                expect(mapScale).toBe(1);

                mapScale = translator.toMapScale(1);
                expect(mapScale).toBe(2);

                mapScale = translator.toMapScale(0.25);
                expect(mapScale).toBe(0.5);
            });

            it('should translate from current map scale to base content scale', function() {
                spyOn(map, 'getScale').andReturn(2);
                var scale = translator.fromMapScale();

                expect(map.getScale).toHaveBeenCalled();
                expect(scale).toBe(1);
            });

            it('should not translate when disabled via scroll list options', function() {
                scrollListOptions.disableScaleTranslation = true;
                spyOn(map, 'getScale').andReturn(1);
                expect(translator.fromMapScale()).toBe(1);
                expect(translator.toMapScale(1)).toBe(1);
            });
        });
    });
});
