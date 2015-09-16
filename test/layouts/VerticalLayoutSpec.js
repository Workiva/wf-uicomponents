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
    var DestroyUtil = require('wf-js-common/DestroyUtil');
    var HorizontalAlignments = require('wf-js-uicomponents/layouts/HorizontalAlignments');
    var ItemSizeCollection = require('wf-js-uicomponents/layouts/ItemSizeCollection');
    var Renderer = require('wf-js-uicomponents/scroll_list/PlaceholderRenderer');
    var ScaleStrategies = require('wf-js-uicomponents/layouts/ScaleStrategies');
    var VerticalAlignments = require('wf-js-uicomponents/layouts/VerticalAlignments');
    var VerticalLayout = require('wf-js-uicomponents/layouts/VerticalLayout');

    describe('VerticalLayout', function() {

        var viewportSize;
        var $viewport = $('<div>').css({ position: 'absolute', top: -10000 });
        var itemMetadata = [];

        var renderer = Renderer.prototype;
        var layout;

        function createItemSizeCollection(items) {
            var maxWidth = Number.MIN_VALUE;
            var maxHeight = Number.MIN_VALUE;
            items.forEach(function(item) {
                maxWidth = Math.max(maxWidth, item.width);
                maxHeight = Math.max(maxHeight, item.height);
            });
            return new ItemSizeCollection({
                maxWidth: maxWidth,
                maxHeight: maxHeight,
                items: items
            });
        }

        function createVerticalLayout(options) {
            var itemSizeCollection = createItemSizeCollection(itemMetadata);
            return new VerticalLayout($viewport[0], itemSizeCollection, renderer, options);
        }


        beforeEach(function() {
            viewportSize = { width: 200, height: 500 };
            $viewport.empty().appendTo('body').css(viewportSize);

            itemMetadata = [
                { width: 100, height: 200 },
                { width: 100, height: 200 },
                { width: 100, height: 200 },
                { width: 100, height: 200 },
                { width: 100, height: 200 }
            ];
        });

        afterEach(function() {
            $viewport.remove().css({ width: 0, height: 0 });
        });

        describe('construction', function() {

            it('should require a viewport', function() {
                var ctor = function() {
                    return new VerticalLayout(null, createItemSizeCollection(itemMetadata), renderer);
                };
                expect(ctor).toThrow('VerticalLayout configuration: viewport is required.');
            });

            it('should require item metadata', function() {
                var ctor = function() {
                    return new VerticalLayout($viewport[0], null, renderer);
                };
                expect(ctor).toThrow('VerticalLayout configuration: itemSizeCollection is required.');
            });

            it('should require a renderer', function() {
                var ctor = function() {
                    return new VerticalLayout($viewport[0], createItemSizeCollection(itemMetadata), null);
                };
                expect(ctor).toThrow('VerticalLayout configuration: renderer is required.');
            });
        });

        describe('default options', function() {

            var options;

            beforeEach(function() {
                layout = createVerticalLayout();
                options = layout.getOptions();
            });

            it('should have mimumum nuber of virtual items of 3', function() {
                expect(options.minNumberOfVirtualItems).toBe(3);
            });

            it('should have eager rendering factor of 1', function() {
                expect(options.eagerRenderingFactor).toBe(1);
            });

            it('should have fit "width"', function() {
                expect(options.fit).toBe('width');
            });

            it('should have flow of true', function() {
                expect(options.flow).toBe(true);
            });

            it('should have gap of 0', function() {
                expect(options.gap).toBe(0);
            });

            it('should have horizontal align of "center"', function() {
                expect(options.horizontalAlign).toBe(HorizontalAlignments.CENTER);
            });

            it('should have padding of 0', function() {
                expect(options.padding).toBe(0);
            });
        });

        describe('when disposing', function() {

            beforeEach(function() {
                layout = createVerticalLayout();
            });

            it('should dispose all the observables', function() {
                var observables = [
                    layout.onCurrentItemIndexChanged
                ];
                var i;

                for (i = 0; i < observables.length; i++) {
                    spyOn(observables[i], 'dispose');
                }

                layout.dispose();

                for (i = 0; i < observables.length; i++) {
                    expect(observables[i].dispose).toHaveBeenCalled();
                }
            });

            it('should destroy the instance', function() {
                spyOn(DestroyUtil, 'destroy');

                layout.dispose();

                expect(DestroyUtil.destroy).toHaveBeenCalledWith(layout);
            });
        });

        describe('when clearing the layout', function() {

            it('should remove all placeholders for the current item range', function() {
                spyOn(renderer, 'render');
                spyOn(renderer, 'remove');

                layout = createVerticalLayout({ eagerRenderingFactor: 0 });
                layout.render();
                layout.clear();

                expect(renderer.remove.calls.length).toBe(3);
            });
        });

        describe('when ensuring the minimum number of virtual items', function() {

            beforeEach(function() {
                itemMetadata = (function() {
                    var arr = [];
                    for (var i = 0; i < 20; i++) {
                        arr.push({ width: 100, height: 200 });
                    }
                    return arr;
                }());
            });

            it('should spread items evenly when weight is 0.5', function() {
                layout = createVerticalLayout({
                    directionalRenderingWeight: 0.5,
                    eagerRenderingFactor: 0,
                    minNumberOfVirtualItems: 10
                });
                var range = { startIndex: 8, endIndex: 11 };

                layout.setScrollPosition({ top: 1750, left: 0 });
                layout.ensureMinNumberOfVirtualItems(range);

                expect(range.startIndex).toBe(5);
                expect(range.endIndex).toBe(14);
            });

            it('should extend the end index when weight is 1.0 and scroll direction is up', function() {
                layout = createVerticalLayout({
                    directionalRenderingWeight: 1,
                    eagerRenderingFactor: 0,
                    minNumberOfVirtualItems: 10
                });
                var range = { startIndex: 8, endIndex: 11 };

                layout.setScrollPosition({ top: 1750, left: 0 });
                layout.ensureMinNumberOfVirtualItems(range);

                expect(range.startIndex).toBe(8);
                expect(range.endIndex).toBe(17);
            });

            it('should extend the start index when weight is 1.0 and scroll direction is down', function() {
                layout = createVerticalLayout({
                    directionalRenderingWeight: 1,
                    eagerRenderingFactor: 0,
                    minNumberOfVirtualItems: 10
                });
                var range = { startIndex: 8, endIndex: 11 };

                layout.setScrollPosition({ top: 3500, left: 0 });
                layout.setScrollPosition({ top: 1750, left: 0 });
                layout.ensureMinNumberOfVirtualItems(range);

                expect(range.startIndex).toBe(2);
                expect(range.endIndex).toBe(11);
            });

            it('should guard against overflowing absolute start idnex', function() {
                layout = createVerticalLayout({
                    directionalRenderingWeight: 0.5,
                    eagerRenderingFactor: 0,
                    minNumberOfVirtualItems: 10
                });
                var range = { startIndex: 0, endIndex: 2 };

                layout.setScrollPosition({ top: 3500, left: 0 });
                layout.setScrollPosition({ top: 0, left: 0 });
                layout.ensureMinNumberOfVirtualItems(range);

                expect(range.startIndex).toBe(0);
                expect(range.endIndex).toBe(9);
            });

            it('should guard against overflowing absolute end index', function() {
                layout = createVerticalLayout({
                    directionalRenderingWeight: 0.5,
                    eagerRenderingFactor: 0,
                    minNumberOfVirtualItems: 10
                });
                var range = { startIndex: 17, endIndex: 19 };

                layout.setScrollPosition({ top: 3500, left: 0 });
                layout.ensureMinNumberOfVirtualItems(range);

                expect(range.startIndex).toBe(10);
                expect(range.endIndex).toBe(19);
            });
        });

        describe('when getting the current item index', function() {

            it('should return the index of the item intersecting the visible center', function() {
                layout = createVerticalLayout();

                expect(layout.getCurrentItemIndex()).toBe(1);
            });

            it('should return the item nearest the viewport center if none intersects', function() {
                itemMetadata = [{
                    width: viewportSize.width,
                    height: viewportSize.height / 4
                }];
                layout = createVerticalLayout({ flow: true });

                expect(layout.getCurrentItemIndex()).toBe(0);
            });
        });

        describe('when getting the item range to render', function() {
            beforeEach(function() {
                layout = createVerticalLayout({
                    directionalRenderingWeight: 0.5,
                    eagerRenderingFactor: 0
                });
            });

            it('should call ensureMinNumberOfVirtualItems with the range', function() {
                spyOn(layout, 'ensureMinNumberOfVirtualItems');
                var range = layout.getItemRangeToRender();
                expect(layout.ensureMinNumberOfVirtualItems).toHaveBeenCalledWith(range);
            });

            it('should cover the range to the target scroll position', function() {
                var targetScrollPosition = { top: 500, left: 0 };
                var range = layout.getItemRangeToRender(targetScrollPosition);

                expect(range.startIndex).toBe(0);
                expect(range.endIndex).toBe(4);
            });

            it('should cover the entire range when the minimum number of virtual items covers all the items', function() {
                var targetScrollPosition = { top: 500, left: 0 };
                layout = createVerticalLayout({
                    eagerRenderingFactor: 0,
                    minNumberOfVirtualItems: 5,
                });
                var range = layout.getItemRangeToRender(targetScrollPosition);

                expect(range.startIndex).toBe(0);
                expect(range.endIndex).toBe(4);
            });

            it('should return correct values when scrolled to top of layout', function() {
                layout.setScrollPosition({ top: 0, left: 0 });
                var range = layout.getItemRangeToRender();

                expect(range.startIndex).toBe(0);
                expect(range.endIndex).toBe(2);
            });

            it('should return correct values when scrolled to middle of layout', function() {
                layout.setScrollPosition({ top: 250, left: 0 });
                var range = layout.getItemRangeToRender();

                expect(range.startIndex).toBe(1);
                expect(range.endIndex).toBe(3);
            });

            it('should return correct values when scrolled to bottom of layout', function() {
                layout.setScrollPosition({ top: 500, left: 0 });
                var range = layout.getItemRangeToRender();

                expect(range.startIndex).toBe(2);
                expect(range.endIndex).toBe(4);
            });
        });

        describe('when getting the position to render', function() {

            beforeEach(function() {
                layout = createVerticalLayout({ eagerRenderingFactor: 0 });
            });

            it('should cover the range between current and target scroll positions', function() {
                var position;

                // When scrolling items up.
                position = layout.getPositionToRender({ top: 100 });

                expect(position.top).toBe(0);
                expect(position.bottom).toBe(600);

                // When scrolling items down.
                layout.setScrollPosition({ top: 500 });
                position = layout.getPositionToRender({ top: 400 });

                expect(position.top).toBe(400);
                expect(position.bottom).toBe(1000);
            });

            it('should eagerly render additional items when configured', function() {
                var position;

                layout = createVerticalLayout({ eagerRenderingFactor: 3 });
                position = layout.getPositionToRender();

                expect(position.top).toBe(0);
                expect(position.bottom).toBe(1000);
            });

            it('should return correct values when scrolled to top of layout', function() {
                var position = layout.getPositionToRender();

                expect(position.top).toBe(0);
                expect(position.bottom).toBe(500);
            });

            it('should return correct values when scrolled to bottom of layout', function() {
                var position;

                layout.setScrollPosition({ top: 500, left: 0});
                position = layout.getPositionToRender();

                expect(position.top).toBe(500);
                expect(position.bottom).toBe(1000);
            });

            it('should return correct values when scrolled to middle of layout', function() {
                var position;

                layout.setScrollPosition({ top: 250, left: 0});
                position = layout.getPositionToRender();

                expect(position.top).toBe(250);
                expect(position.bottom).toBe(750);
            });

            it('should constrain the position to the layout dimensions', function() {
                var position;

                // Scrolled down beyond top of item.
                layout.setScrollPosition({ top: -100, left: 0});
                position = layout.getPositionToRender();

                expect(position.top).toBe(0);
                expect(position.bottom).toBe(400);

                // Scrolled up beyond bottom of item.
                layout.setScrollPosition({ top: 600, left: 0});
                position = layout.getPositionToRender();

                expect(position.top).toBe(600);
                expect(position.bottom).toBe(1000);
            });

            it('should return correct values when zoomed out', function() {
                var position;

                layout.setScrollPosition({ top: 0, left: 0 });
                layout.setScale(0.5);
                position = layout.getPositionToRender();
                expect(position.top).toBe(0);
                expect(position.bottom).toBe(1000);
            });

            it('should return correct values when zoomed in', function() {
                var position;

                layout.setScrollPosition({ top: 500, left: 0 });
                layout.setScale(2);
                position = layout.getPositionToRender();
                expect(position.top).toBe(250);
                expect(position.bottom).toBe(500);
            });
        });

        describe('when getting rendered item indexes ordered by distance from visible center', function() {

            beforeEach(function() {
                layout = createVerticalLayout({ eagerRenderingFactor: 0 });

                spyOn(renderer, 'render');
                spyOn(renderer, 'remove');
            });

            it('should throw if the layout has not been rendered', function() {
                var call = function() {
                    layout.getOrderedRenderedItemIndexes();
                };
                expect(call).toThrow('VerticalLayout: the layout has not been rendered.');
            });

            it('should return indexes in the correct order when scrolled to top of layout', function() {
                var indexes;

                layout.setScrollPosition({ top: 0, left: 0 });
                layout.render();
                indexes = layout.getOrderedRenderedItemIndexes();

                expect(indexes.length).toBe(3);
                expect(indexes[0]).toBe(1);
                expect(indexes[1]).toBe(0);
                expect(indexes[2]).toBe(2);
            });

            it('should return indexes in the correct order when scrolled to middle of layout', function() {
                var indexes;

                layout.setScrollPosition({ top: 250, left: 0 });
                layout.render();
                indexes = layout.getOrderedRenderedItemIndexes();

                expect(indexes.length).toBe(3);
                expect(indexes[0]).toBe(2);
                expect(indexes[1]).toBe(1);
                expect(indexes[2]).toBe(3);
            });

            it('should return indexes in the correct order when scrolled to bottom of layout', function() {
                var indexes;

                layout.setScrollPosition({ top: 500, left: 0 });
                layout.render();
                indexes = layout.getOrderedRenderedItemIndexes();

                expect(indexes.length).toBe(3);
                expect(indexes[0]).toBe(3);
                expect(indexes[1]).toBe(4);
                expect(indexes[2]).toBe(2);
            });
        });

        describe('when getting the visible item range', function() {
            beforeEach(function() {
                layout = createVerticalLayout();
            });

            it('should return the correct range when scrolled to the top of the layout', function() {
                var range;

                layout.setScrollPosition({ top: 0, left: 0 });
                range = layout.getVisibleItemRange();

                expect(range.startIndex).toBe(0);
                expect(range.endIndex).toBe(2);
            });

            it('should return the correct range when scrolled to the middle of the layout', function() {
                var range;

                layout.setScrollPosition({ top: 250, left: 0 });
                range = layout.getVisibleItemRange();

                expect(range.startIndex).toBe(1);
                expect(range.endIndex).toBe(3);
            });

            it('should return the correct range when scrolled to the bottom of the layout', function() {
                var range;

                layout.setScrollPosition({ top: 500, left: 0 });
                range = layout.getVisibleItemRange();

                expect(range.startIndex).toBe(2);
                expect(range.endIndex).toBe(4);
            });
        });

        describe('when getting the visible position', function() {

            beforeEach(function() {
                layout = createVerticalLayout({ eagerRenderingFactor: 0 });
            });

            it('should return correct values when scrolled to top of layout', function() {
                var position = layout.getVisiblePosition();

                expect(position.top).toBe(0);
                expect(position.bottom).toBe(500);
                expect(position.center).toBe(250);
            });

            it('should return correct values when scrolled to bottom of layout', function() {
                var position;

                layout.setScrollPosition({ top: 500, left: 0});
                position = layout.getVisiblePosition();

                expect(position.top).toBe(500);
                expect(position.bottom).toBe(1000);
                expect(position.center).toBe(750);
            });

            it('should return correct values when scrolled to middle of layout', function() {
                var position;

                layout.setScrollPosition({ top: 250, left: 0});
                position = layout.getVisiblePosition();

                expect(position.top).toBe(250);
                expect(position.bottom).toBe(750);
                expect(position.center).toBe(500);
            });

            it('should return unscaled values', function() {
                var position;

                layout.setScale(0.5);
                layout.setScrollPosition({ top: 1000, left: 0});
                position = layout.getVisiblePosition();

                expect(position.top).toBe(2000);
                expect(position.bottom).toBe(3000);
                expect(position.center).toBe(2500);
            });
        });

        describe('inserting items', function() {
            var itemSizeCollection;
            beforeEach(function() {
                layout = createVerticalLayout();
                itemSizeCollection = layout.getItemSizeCollection();
            });
            it('should constrain the given sizes to the maximums defined by the ItemSizeCollection', function() {
                spyOn(itemSizeCollection, 'constrain');
                var items = [{}];
                layout.insertItems(0, items);
                expect(itemSizeCollection.constrain).toHaveBeenCalledWith(items);
            });
            it('should insert the given sizes into the ItemSizeCollection', function() {
                spyOn(itemSizeCollection, 'insert');
                var items = [{}];
                layout.insertItems(0, items);
                expect(itemSizeCollection.insert).toHaveBeenCalledWith(0, items);
            });
            it('should measure the layout', function() {
                spyOn(layout, 'measure');
                layout.insertItems(0, [{}]);
                expect(layout.measure).toHaveBeenCalled();
            });
        });

        describe('when loading content', function() {

            beforeEach(function() {
                layout = createVerticalLayout({
                    minNumberOfVirtualItems: 3,
                    eagerRenderingFactor: 1
                });

                spyOn(renderer, 'render');
                spyOn(renderer, 'remove');
                spyOn(renderer, 'load');
                spyOn(renderer, 'unload');
            });

            it('should unload stale content', function() {
                layout.render();
                layout.setScrollPosition({ top: 500, left: 0 });
                layout.render();
                layout.loadContent();

                expect(renderer.unload.calls.length).toBe(2);
                expect(renderer.unload).toHaveBeenCalledWith(0);
                expect(renderer.unload).toHaveBeenCalledWith(1);
            });

            it('should load fresh content', function() {
                layout.render();
                layout.loadContent();

                expect(renderer.load.calls.length).toBe(3);
                expect(renderer.load).toHaveBeenCalledWith(layout.getItemLayout(0));
                expect(renderer.load).toHaveBeenCalledWith(layout.getItemLayout(1));
                expect(renderer.load).toHaveBeenCalledWith(layout.getItemLayout(2));
            });
        });

        describe('when measuring', function() {

            beforeEach(function() {
                layout = createVerticalLayout({ gap: 10, padding: 20 });
                layout.measure();
            });

            it('should measure the maximum layout width', function() {
                var size = layout.getSize();

                expect(size.width).toBe(140);
            });

            it('should measure the total layout height', function() {
                var size = layout.getSize();

                expect(size.height).toBe(1080);
            });

            it('should measure the viewport width', function() {
                var size = layout.getViewportSize();

                expect(size.width).toBe(200);
            });

            it('should measure the viewport height', function() {
                var size = layout.getViewportSize();

                expect(size.height).toBe(500);
            });

            describe('item layouts', function() {

                it('should use the scale strategy corresponding to layout fit mode', function() {
                    spyOn(ScaleStrategies, 'auto').andReturn(1);
                    spyOn(ScaleStrategies, 'height').andReturn(1);
                    spyOn(ScaleStrategies, 'width').andReturn(1);
                    spyOn(ScaleStrategies, 'none').andReturn(1);

                    createVerticalLayout({ fit: 'auto' });
                    expect(ScaleStrategies.auto).toHaveBeenCalled();

                    createVerticalLayout({ fit: 'height' });
                    expect(ScaleStrategies.height).toHaveBeenCalled();

                    createVerticalLayout({ fit: 'width' });
                    expect(ScaleStrategies.width).toHaveBeenCalled();

                    createVerticalLayout({ fit: 'none' });
                    expect(ScaleStrategies.none).toHaveBeenCalled();
                });

                it('should use the item-specific scale strategy if given', function() {
                    var autoScale = 0.1;
                    var heightScale = 0.2;
                    var widthScale = 0.3;
                    var noneScale = 0.4;

                    spyOn(ScaleStrategies, 'auto').andReturn(autoScale);
                    spyOn(ScaleStrategies, 'height').andReturn(heightScale);
                    spyOn(ScaleStrategies, 'width').andReturn(widthScale);
                    spyOn(ScaleStrategies, 'none').andReturn(noneScale);

                    var mixedFitItemMetadata = [
                        { width: 100, height: 200, fit: 'auto' },
                        { width: 100, height: 200, fit: 'height' },
                        { width: 100, height: 200, fit: 'width' },
                        { width: 100, height: 200, fit: 'none' },
                        { width: 100, height: 200 },
                    ];
                    var itemSizeCollection = createItemSizeCollection(mixedFitItemMetadata);
                    var options = { flow: false, fit: 'auto' };
                    layout = new VerticalLayout($viewport[0], itemSizeCollection, renderer, options);

                    expect(layout.getItemLayout(0).scaleToFit).toEqual(autoScale);
                    expect(layout.getItemLayout(1).scaleToFit).toEqual(heightScale);
                    expect(layout.getItemLayout(2).scaleToFit).toEqual(widthScale);
                    expect(layout.getItemLayout(3).scaleToFit).toEqual(noneScale);
                    expect(layout.getItemLayout(4).scaleToFit).toEqual(autoScale);
                });

                it('should apply the initial item scale when not fitting to the viewport', function() {
                    spyOn(ScaleStrategies, 'auto').andReturn(1);
                    spyOn(ScaleStrategies, 'height').andReturn(1);
                    spyOn(ScaleStrategies, 'width').andReturn(1);
                    spyOn(ScaleStrategies, 'none').andReturn(1);

                    var itemMetadata = [
                        { width: 100, height: 200 }
                    ];
                    var itemSizeCollection = createItemSizeCollection(itemMetadata);
                    var options = { flow: false, fit: 'none', initialItemScale: 2, fitUpscaleLimit: 100 };
                    layout = new VerticalLayout($viewport[0], itemSizeCollection, renderer, options);

                    expect(layout.getItemLayout(0).scaleToFit).toEqual(options.initialItemScale);
                });

                describe('when fit mode is ORIENTATION', function() {
                    it('should revert to fit mode of width when in flow mode', function() {
                        var widthScale = 0.3;
                        spyOn(ScaleStrategies, 'width').andReturn(widthScale);

                        var itemMetadata = [
                            { width: 100, height: 200 }
                        ];
                        var itemSizeCollection = createItemSizeCollection(itemMetadata);
                        var options = { flow: true, fit: 'orientation' };
                        layout = new VerticalLayout($viewport[0], itemSizeCollection, renderer, options);

                        expect(layout.getItemLayout(0).scaleToFit).toEqual(widthScale);
                    });
                    it('should use auto fit mode if item and viewport are in same orientation', function() {
                        var autoScale = 0.3;
                        spyOn(ScaleStrategies, 'auto').andReturn(autoScale);

                        viewportSize = { width: 100, height: 200 };
                        var itemMetadata = [
                            { width: 100, height: 200 }
                        ];
                        var itemSizeCollection = createItemSizeCollection(itemMetadata);
                        var options = { flow: false, fit: 'orientation' };
                        layout = new VerticalLayout($viewport[0], itemSizeCollection, renderer, options);

                        expect(layout.getItemLayout(0).scaleToFit).toEqual(autoScale);
                    });
                    it('should use width fit mode if item and viewport are in different orientation', function() {
                        var widthScale = 0.3;
                        spyOn(ScaleStrategies, 'auto').andReturn(widthScale);

                        viewportSize = { width: 200, height: 100 };
                        var itemMetadata = [
                            { width: 100, height: 200 }
                        ];
                        var itemSizeCollection = createItemSizeCollection(itemMetadata);
                        var options = { flow: false, fit: 'orientation' };
                        layout = new VerticalLayout($viewport[0], itemSizeCollection, renderer, options);

                        expect(layout.getItemLayout(0).scaleToFit).toEqual(widthScale);
                    });
                });

                it('should apply padding to the left and right of all items', function() {
                    var padding = 20;

                    layout = createVerticalLayout({ padding: padding });

                    layout.getItemLayouts().forEach(function(item) {
                        expect(item.paddingLeft).toBe(padding);
                        expect(item.paddingRight).toBe(padding);
                    });
                });

                it('should apply padding to the left and right of all items independently', function() {
                    var padding = { left: 10, right: 30 };

                    layout = createVerticalLayout({ padding: padding });

                    layout.getItemLayouts().forEach(function(item) {
                        expect(item.paddingLeft).toBe(padding.left);
                        expect(item.paddingRight).toBe(padding.right);
                    });
                });

                describe('flow: true', function() {

                    it('should fit the maximum size of items to the viewport', function() {
                        var viewportSize;
                        var padding;
                        var mockScale = 0.5;

                        spyOn(ScaleStrategies, 'auto').andReturn(mockScale);

                        layout = createVerticalLayout({ flow: true, fit: 'auto' });
                        viewportSize = layout.getViewportSize();
                        padding = layout.getOptions().padding;

                        var scaleArgs = ScaleStrategies.auto.calls[0].args;
                        var itemSizeCollection = layout.getItemSizeCollection();
                        expect(scaleArgs[0]).toBe(viewportSize);
                        expect(scaleArgs[1]).toEqual({
                            width: itemSizeCollection.maxWidth,
                            height: itemSizeCollection.maxHeight
                        });
                        expect(scaleArgs[2]).toBe(padding);

                        layout.getItemLayouts().forEach(function(item, index) {
                            expect(item.scaleToFit).toBe(mockScale);
                            expect(item.width).toBe(itemMetadata[index].width / 2);
                            expect(item.height).toBe(itemMetadata[index].height / 2);
                        });
                    });

                    it('should correctly account for left and right padding', function() {
                        var padding = 20;
                        var mockScale = 0.5;

                        spyOn(ScaleStrategies, 'auto').andReturn(mockScale);

                        layout = createVerticalLayout({ flow: true, fit: 'auto', padding: padding });
                        var layoutSize = layout.getSize();

                        // 90 = max page width * scale + 2 * padding
                        expect(layoutSize.width).toEqual(90);
                    });

                    it('should correctly account for independent left and right padding', function() {
                        var padding = { left: 10, right: 30, top: 0, bottom: 0 };
                        var mockScale = 0.5;

                        spyOn(ScaleStrategies, 'auto').andReturn(mockScale);

                        layout = createVerticalLayout({ flow: true, fit: 'auto', padding: padding });
                        var layoutSize = layout.getSize();

                        // 90 = max page width * scale + padding.left + padding.right
                        expect(layoutSize.width).toEqual(90);
                    });

                    it('should set top to the cumulative outer height', function() {
                        var expectedTop = 0;

                        layout = createVerticalLayout({ flow: true });
                        layout.getItemLayouts().forEach(function(item) {
                            expect(item.top).toBe(expectedTop);
                            expectedTop += item.outerHeight;
                        });
                    });

                    it('should set bottom to the top plus the outer height', function() {
                        layout = createVerticalLayout({ flow: true });
                        layout.getItemLayouts().forEach(function(item) {
                            expect(item.bottom).toBe(item.top + item.outerHeight);
                        });
                    });

                    it('should set offset top to zero', function() {
                        layout = createVerticalLayout({ flow: true });
                        layout.getItemLayouts().forEach(function(item) {
                            expect(item.offsetTop).toBe(0);
                        });
                    });

                    it('should center the item in the viewport', function() {
                        var viewportWidth;

                        layout = createVerticalLayout({ flow: true });
                        viewportWidth = layout.getViewportSize().width;

                        layout.getItemLayouts().forEach(function(item) {
                            if (item.outerWidth < viewportWidth) {
                                expect(item.left).toBe((viewportWidth - item.outerWidth) / 2);
                            }
                        });
                    });

                    it('should align items to the viewport left when horizontalAlign = "left"', function() {
                        var viewportWidth;

                        layout = createVerticalLayout({
                            flow: true,
                            horizontalAlign: HorizontalAlignments.LEFT
                        });
                        viewportWidth = layout.getViewportSize().width;

                        layout.getItemLayouts().forEach(function(item) {
                            expect(item.outerWidth).toBeLessThan(viewportWidth);
                            expect(item.left).toBe(0);
                        });
                    });

                    it('should apply padding to the top of the first item only', function() {
                        var padding = 20;

                        layout = createVerticalLayout({ flow: true, padding: padding });

                        layout.getItemLayouts().forEach(function(item, index) {
                            if (index === 0) {
                                expect(item.paddingTop).toBe(padding);
                            }
                            else {
                                expect(item.paddingTop).not.toBe(padding);
                            }
                        });
                    });

                    it('should apply an independent padding to the top of the first item only', function() {
                        var padding = { top: 20, bottom: 0, left: 0, right: 0 };

                        layout = createVerticalLayout({ flow: true, padding: padding });

                        layout.getItemLayouts().forEach(function(item, index) {
                            if (index === 0) {
                                expect(item.paddingTop).toBe(padding.top);
                            }
                            else {
                                expect(item.paddingTop).not.toBe(padding.top);
                            }
                        });
                    });

                    it('should apply padding to the bottom of the last item only', function() {
                        var padding = 20;

                        layout = createVerticalLayout({ flow: true, padding: padding });

                        layout.getItemLayouts().forEach(function(item, index) {
                            if (index === itemMetadata.length - 1) {
                                expect(item.paddingBottom).toBe(padding);
                            }
                            else {
                                expect(item.paddingBottom).not.toBe(padding);
                            }
                        });
                    });

                    it('should apply an independent padding to the bottom of the last item only', function() {
                        var padding = { bottom: 20, top: 0, left: 0, right: 0 };

                        layout = createVerticalLayout({ flow: true, padding: padding });

                        layout.getItemLayouts().forEach(function(item, index) {
                            if (index === itemMetadata.length - 1) {
                                expect(item.paddingBottom).toBe(padding.bottom);
                            }
                            else {
                                expect(item.paddingBottom).not.toBe(padding.bottom);
                            }
                        });
                    });

                    it('should apply half the gap to the top of all but the first item', function() {
                        var gap = 20;
                        var halfGap = gap / 2;

                        layout = createVerticalLayout({ flow: true, gap: gap });

                        layout.getItemLayouts().forEach(function(item, index) {
                            if (index === 0) {
                                expect(item.paddingTop).toBe(0);
                            }
                            else {
                                expect(item.paddingTop).toBe(halfGap);
                            }
                        });
                    });

                    it('should apply half the gap to the bottom of all but the last item', function() {
                        var gap = 20;
                        var halfGap = gap / 2;

                        layout = createVerticalLayout({ flow: true, gap: gap });

                        layout.getItemLayouts().forEach(function(item, index) {
                            if (index === itemMetadata.length - 1) {
                                expect(item.paddingBottom).toBe(0);
                            }
                            else {
                                expect(item.paddingBottom).toBe(halfGap);
                            }
                        });
                    });
                });

                describe('flow: false', function() {

                    it('should fit each item to the viewport', function() {
                        var viewportSize;
                        var padding;

                        spyOn(ScaleStrategies, 'auto').andReturn(0.5);

                        layout = createVerticalLayout({ flow: false, fit: 'auto' });
                        viewportSize = layout.getViewportSize();
                        padding = layout.getOptions().padding;

                        itemMetadata.forEach(function(item) {
                            expect(ScaleStrategies.auto).toHaveBeenCalledWith(viewportSize, item, padding);
                        });

                        layout.getItemLayouts().forEach(function(item, index) {
                            expect(item.scaleToFit).toBe(0.5);
                            expect(item.width).toBe(itemMetadata[index].width / 2);
                            expect(item.height).toBe(itemMetadata[index].height / 2);
                        });
                    });

                    it('should set top to the item index times the viewport height', function() {
                        var viewportHeight;

                        layout = createVerticalLayout({ flow: false });
                        viewportHeight = layout.getViewportSize().height;

                        layout.getItemLayouts().forEach(function(item, index) {
                            expect(item.top).toBe(index * viewportHeight);
                        });
                    });

                    it('should set bottom to the top plus the viewport height', function() {
                        var viewportHeight;

                        layout = createVerticalLayout({ flow: false });
                        viewportHeight = layout.getViewportSize().height;

                        layout.getItemLayouts().forEach(function(item) {
                            expect(item.bottom).toBe(item.top + viewportHeight);
                        });
                    });

                    it('should set offset top to center the item if item is shorter than viewport', function() {
                        var viewportHeight;

                        layout = createVerticalLayout({ flow: false });
                        viewportHeight = layout.getViewportSize().height;

                        layout.getItemLayouts().forEach(function(item) {
                            expect(item.offsetTop).toBe((viewportHeight - item.outerHeight) / 2);
                        });
                    });

                    it('should set offset top to zero if item is taller than viewport', function() {
                        $viewport.css({ height: 200 });
                        layout = createVerticalLayout({ flow: false });

                        layout.getItemLayouts().forEach(function(item) {
                            expect(item.offsetTop).toBe(0);
                        });
                    });

                    it('should set offset top to zero if vertical alignment is "top"', function() {
                        layout = createVerticalLayout({
                            flow: false,
                            verticalAlign: VerticalAlignments.TOP
                        });

                        layout.getItemLayouts().forEach(function(item) {
                            expect(item.offsetTop).toBe(0);
                        });
                    });

                    it('should center the item in the viewport', function() {
                        var viewportWidth;

                        layout = createVerticalLayout({ flow: false });
                        viewportWidth = layout.getViewportSize().width;

                        layout.getItemLayouts().forEach(function(item) {
                            if (item.outerWidth < viewportWidth) {
                                expect(item.offsetLeft).toBe((viewportWidth - item.outerWidth) / 2);
                            }
                        });
                    });

                    it('should align items to the viewport left when horizontalAlign = "left"', function() {
                        var viewportWidth;

                        layout = createVerticalLayout({
                            flow: false,
                            horizontalAlign: HorizontalAlignments.LEFT
                        });
                        viewportWidth = layout.getViewportSize().width;

                        layout.getItemLayouts().forEach(function(item) {
                            expect(item.outerWidth).toBeLessThan(viewportWidth);
                            expect(item.left).toBe(0);
                        });
                    });

                    it('should apply padding to the top and bottom of every item', function() {
                        var padding = 20;

                        layout = createVerticalLayout({ flow: false, padding: padding });

                        layout.getItemLayouts().forEach(function(item) {
                            expect(item.paddingTop).toBe(padding);
                            expect(item.paddingBottom).toBe(padding);
                        });
                    });

                    it('should apply independent padding to the top and bottom of every item', function() {
                        var padding = { top: 10, bottom: 30, left: 0, right: 0 };

                        layout = createVerticalLayout({ flow: false, padding: padding });

                        layout.getItemLayouts().forEach(function(item) {
                            expect(item.paddingTop).toBe(padding.top);
                            expect(item.paddingBottom).toBe(padding.bottom);
                        });
                    });
                });
            });
        });

        describe('when rendering', function() {

            beforeEach(function() {
                layout = createVerticalLayout({ eagerRenderingFactor: 0 });
            });

            it('should render the range between the current and target scroll position', function() {
                var targetScrollPosition = { top: 500, left: 0 };

                spyOn(renderer, 'render');

                layout.render({ targetScrollPosition: targetScrollPosition });

                expect(renderer.render.calls.length).toBe(5);
                expect(renderer.render).toHaveBeenCalledWith(layout.getItemLayout(0));
                expect(renderer.render).toHaveBeenCalledWith(layout.getItemLayout(1));
                expect(renderer.render).toHaveBeenCalledWith(layout.getItemLayout(2));
                expect(renderer.render).toHaveBeenCalledWith(layout.getItemLayout(3));
                expect(renderer.render).toHaveBeenCalledWith(layout.getItemLayout(4));
            });

            it('should remove stale placeholders after scrolling down', function() {
                spyOn(renderer, 'render');
                spyOn(renderer, 'remove').andReturn(true);

                layout.render();
                layout.setScrollPosition({ top: 500, left: 0 });
                layout.render();

                expect(renderer.remove.calls.length).toBe(2);
                expect(renderer.remove).toHaveBeenCalledWith(0);
                expect(renderer.remove).toHaveBeenCalledWith(1);
            });

            it('should remove stale placeholders after scrolling up', function() {
                spyOn(renderer, 'render');
                spyOn(renderer, 'remove').andReturn(true);

                layout.setScrollPosition({ top: 500, left: 0 });
                layout.render();
                layout.setScrollPosition({ top: 0, left: 0 });
                layout.render();

                expect(renderer.remove.calls.length).toBe(2);
                expect(renderer.remove).toHaveBeenCalledWith(3);
                expect(renderer.remove).toHaveBeenCalledWith(4);
            });

            it('should stop removing stale placeholders when the renderer fails to remove an item', function() {
                spyOn(renderer, 'render');
                spyOn(renderer, 'remove').andReturn(false);

                layout.render();
                layout.setScrollPosition({ top: 250, left: 0 });
                layout.render();

                expect(renderer.remove.calls.length).toBe(2);
                expect(renderer.remove).toHaveBeenCalledWith(0);
                expect(renderer.remove).toHaveBeenCalledWith(4);
            });

            it('should render placeholders for the current range to render', function() {
                spyOn(renderer, 'render');

                layout.render();

                expect(renderer.render.calls.length).toBe(3);
                expect(renderer.render).toHaveBeenCalledWith(layout.getItemLayout(0));
                expect(renderer.render).toHaveBeenCalledWith(layout.getItemLayout(1));
                expect(renderer.render).toHaveBeenCalledWith(layout.getItemLayout(2));
            });

            it('should dispatch "onCurrentItemIndexChanged" when the current item changes', function() {
                spyOn(renderer, 'render');
                spyOn(renderer, 'remove');

                layout.render();
                layout.setScrollPosition({ top: 500, left: 0 });

                spyOn(layout.onCurrentItemIndexChanged, 'dispatch');
                layout.render();

                expect(layout.onCurrentItemIndexChanged.dispatch)
                    .toHaveBeenCalledWith([layout, { index: 3 }]);
            });

            it('should not dispatch "onCurrentItemIndexChanged" when rendering range to target scroll position', function() {
                spyOn(renderer, 'render');
                spyOn(renderer, 'remove');
                spyOn(layout.onCurrentItemIndexChanged, 'dispatch');

                layout.render({
                    targetScrollPosition: { top: 0, left: 0 }
                });

                expect(layout.onCurrentItemIndexChanged.dispatch).not.toHaveBeenCalled();
            });
        });
    });
});
