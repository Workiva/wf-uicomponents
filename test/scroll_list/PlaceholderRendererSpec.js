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

    var _ = require('lodash');
    var AwesomeMap = require('wf-js-uicomponents/awesome_map/AwesomeMap');
    var AwesomeMapFactory = require('wf-js-uicomponents/scroll_list/AwesomeMapFactory');
    var BrowserInfo = require('wf-js-common/BrowserInfo');
    var DestroyUtil = require('wf-js-common/DestroyUtil');
    var HorizontalAlignments = require('wf-js-uicomponents/layouts/HorizontalAlignments');
    var ItemLayout = require('wf-js-uicomponents/layouts/ItemLayout');
    var PlaceholderRenderer = require('wf-js-uicomponents/scroll_list/PlaceholderRenderer');
    var PositionTranslator = require('wf-js-uicomponents/scroll_list/PositionTranslator');
    var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');
    var ScrollModes = require('wf-js-uicomponents/scroll_list/ScrollModes');
    var VerticalAlignments = require('wf-js-uicomponents/layouts/VerticalAlignments');
    var VerticalLayout = require('wf-js-uicomponents/layouts/VerticalLayout');

    describe('PlaceholderRenderer', function() {

        var listMap = _.extend({}, AwesomeMap.prototype);
        var layout = _.extend({}, VerticalLayout.prototype);
        var scrollList = _.extend({}, ScrollList.prototype);

        var viewportSize;
        var layoutSize;
        var scrollListOptions;

        var renderer;

        beforeEach(function() {
            viewportSize = { width: 500, height: 500 };
            layoutSize = { width: 500, height: 500 };
            scrollListOptions = {
                horizontalAlign: HorizontalAlignments.CENTER,
                verticalAlign: VerticalAlignments.AUTO
            };

            var transformationPlane = document.createElement('div');

            spyOn(listMap, 'appendContent');
            spyOn(listMap, 'removeContent');
            spyOn(listMap, 'getTransformationPlane').andReturn(transformationPlane);
            spyOn(layout, 'getViewportSize').andReturn(viewportSize);
            spyOn(layout, 'getSize').andReturn(layoutSize);
            spyOn(scrollList, 'getLayout').andReturn(layout);
            spyOn(scrollList, 'getListMap').andReturn(listMap);
            spyOn(scrollList, 'getOptions').andReturn(scrollListOptions);
            spyOn(scrollList, 'getPositionTranslator').andReturn(new PositionTranslator(scrollList));

            renderer = new PlaceholderRenderer(scrollList);
        });

        describe('when appending placeholder to scroll list', function() {

            describe('in flow mode', function() {
                var itemLayout;
                var placeholder;

                beforeEach(function() {
                    scrollListOptions.mode = ScrollModes.FLOW;
                    placeholder = {
                        element: document.createElement('div')
                    };
                });

                it('should adjust the left position of the placeholder if layout ' +
                    'is narrower than viewport and horizontalAlign="center"', function() {
                    viewportSize.width = 500;
                    layoutSize.width = 400;
                    itemLayout = { left: 75 };
                    placeholder.element.style.left = '75px';

                    renderer.appendPlaceholderToScrollList(itemLayout, placeholder);

                    expect(placeholder.element.style.left).toBe('25px');
                });

                it('should adjust the left position of the placeholder if layout ' +
                    'is wider than viewport and horizontalAlign="center"', function() {
                    viewportSize.width = 400;
                    layoutSize.width = 500;
                    itemLayout = { left: 75 };
                    placeholder.element.style.left = '75px';

                    renderer.appendPlaceholderToScrollList(itemLayout, placeholder);

                    expect(placeholder.element.style.left).toBe('125px');
                });

                it('should not adjust the left position of the placeholder if '+
                    'horizontalAlign="left"', function() {
                    scrollListOptions.horizontalAlign = HorizontalAlignments.LEFT;
                    viewportSize.width = 400;
                    layoutSize.width = 500;
                    itemLayout = { left: 0 }; // we expect items to be left-aligned
                    placeholder.element.style.left = '0px';

                    renderer.appendPlaceholderToScrollList(itemLayout, placeholder);

                    expect(placeholder.element.style.left).toBe('0px');
                });
            });

            describe('not in flow mode', function() {
                var itemMap = _.extend({}, AwesomeMap.prototype);
                var itemLayout;
                var placeholder;

                beforeEach(function() {
                    spyOn(layout, 'getCurrentItemIndex').andReturn(1);
                    spyOn(itemMap, 'setContentDimensions');
                    spyOn(itemMap, 'transform');
                    spyOn(itemMap, 'appendContent');

                    scrollListOptions.mode = ScrollModes.SINGLE;
                    itemLayout = {
                        itemIndex: 1
                    };
                    placeholder = {
                        element: document.createElement('div'),
                        contentContainer: document.createElement('div'),
                        map: itemMap
                    };
                });

                it('should set the content dimensions of the item map', function() {
                    itemLayout.outerWidth = 300;
                    itemLayout.outerHeight = 400;

                    renderer.appendPlaceholderToScrollList(itemLayout, placeholder);

                    expect(itemMap.setContentDimensions).toHaveBeenCalledWith({
                        width: itemLayout.outerWidth,
                        height: itemLayout.outerHeight
                    });
                });

                it('should use offsetLeft and offsetTop to position the transformation ' +
                    'plane containing the itemLayout', function() {
                    itemLayout.offsetLeft = 50;
                    itemLayout.offsetTop = 60;

                    renderer.appendPlaceholderToScrollList(itemLayout, placeholder);

                    expect(itemMap.transform).toHaveBeenCalledWith({
                        x: itemLayout.offsetLeft,
                        y: itemLayout.offsetTop,
                        scale: 1
                    });
                });

                it('should pan the content to its bottom if placeholder precedes the current item', function() {
                    viewportSize.height = 500;
                    itemLayout.itemIndex = 0;
                    itemLayout.outerHeight = 600;
                    itemLayout.offsetLeft = 0;

                    renderer.appendPlaceholderToScrollList(itemLayout, placeholder);

                    expect(itemMap.transform)
                        .toHaveBeenCalledWith({ x: 0, y: -100, scale: 1 });
                });

                it('should remove positional styles from the content container', function() {
                    placeholder.contentContainer.style.top = '1000px';
                    placeholder.contentContainer.style.left = '1000px';

                    renderer.appendPlaceholderToScrollList(itemLayout, placeholder);

                    expect(placeholder.contentContainer.style.top).toBe('0px');
                    expect(placeholder.contentContainer.style.left).toBe('0px');
                });

                it('should append the content container to the item map', function() {
                    renderer.appendPlaceholderToScrollList(itemLayout, placeholder);

                    expect(itemMap.appendContent).toHaveBeenCalledWith(placeholder.contentContainer);
                });

                describe('when item map does not exist', function() {
                    beforeEach(function() {
                        placeholder.map = null;
                        spyOn(AwesomeMapFactory, 'createItemMap').andReturn(itemMap);
                        spyOn(placeholder.element, 'removeChild');
                    });

                    it('should remove the content container from the element', function() {
                        renderer.appendPlaceholderToScrollList(itemLayout, placeholder);

                        expect(placeholder.element.removeChild)
                            .toHaveBeenCalledWith(placeholder.contentContainer);
                    });

                    it('should append the element to the list map', function() {
                        var placeholderContainer = renderer.getPlaceholderContainer();
                        spyOn(placeholderContainer, 'appendChild');
                        renderer.appendPlaceholderToScrollList(itemLayout, placeholder);

                        expect(listMap.appendContent)
                            .toHaveBeenCalledWith(placeholderContainer);
                        expect(placeholderContainer.appendChild)
                            .toHaveBeenCalledWith(placeholder.element);
                    });

                    it('should create a item map for the placeholder', function() {
                        renderer.appendPlaceholderToScrollList(itemLayout, placeholder);

                        expect(AwesomeMapFactory.createItemMap)
                            .toHaveBeenCalledWith(scrollList, placeholder.element);
                    });
                });

                describe('when item map exists', function() {

                    it('should append the element to the list map', function() {
                        var placeholderContainer = renderer.getPlaceholderContainer();
                        spyOn(placeholderContainer, 'appendChild');
                        renderer.appendPlaceholderToScrollList(itemLayout, placeholder);

                        expect(listMap.appendContent)
                            .toHaveBeenCalledWith(placeholderContainer);
                        expect(placeholderContainer.appendChild)
                            .toHaveBeenCalledWith(placeholder.element);

                    });
                });
            });
        });

        describe('when disposing', function() {

            it('should remove all placeholders', function() {
                spyOn(renderer, 'appendPlaceholderToScrollList');
                spyOn(renderer, 'remove');

                renderer.render(new ItemLayout({ itemIndex: 0 }));
                renderer.render(new ItemLayout({ itemIndex: 1 }));
                renderer.render(new ItemLayout({ itemIndex: 2 }));
                var remove = renderer.remove;

                renderer.dispose();

                expect(remove).toHaveBeenCalledWith(0);
                expect(remove).toHaveBeenCalledWith(1);
                expect(remove).toHaveBeenCalledWith(2);
            });

            it('should dispose maps hosted inside a placeholder', function() {
                spyOn(renderer, 'appendPlaceholderToScrollList');
                renderer.render(new ItemLayout({ itemIndex: 0 }));
                var placeholder = renderer.get(0);
                placeholder.map = jasmine.createSpyObj('placeholder.map', ['dispose']);
                var dispose = placeholder.map.dispose;

                renderer.dispose();

                expect(dispose).toHaveBeenCalled();
            });

            it('should dispose all observables', function() {
                var observables = [
                    renderer.onLoading,
                    renderer.onRendered,
                    renderer.onRemoved,
                    renderer.onUnloaded
                ];
                var i;

                for (i = 0; i < observables.length; i++) {
                    spyOn(observables[i], 'dispose');
                }

                renderer.dispose();

                for (i = 0; i < observables.length; i++) {
                    expect(observables[i].dispose).toHaveBeenCalled();
                }
            });

            it('should destroy the instance', function() {
                spyOn(DestroyUtil, 'destroy');

                renderer.dispose();

                expect(DestroyUtil.destroy).toHaveBeenCalledWith(renderer);
            });
        });

        describe('when loading content into a placeholder', function() {

            var itemLayout;

            beforeEach(function() {
                spyOn(renderer, 'appendPlaceholderToScrollList');
                itemLayout = new ItemLayout({ itemIndex: 0 });
            });

            it('should return false if the placeholder does not exist', function() {
                var result = renderer.load(new ItemLayout());

                expect(result).toBe(false);
            });

            it('should return false if the placeholder already has content', function() {
                var result;

                renderer.render(itemLayout);

                // Will load content the first time.
                result = renderer.load(itemLayout);
                expect(result).toBe(true);

                // Will not load content the second time.
                result = renderer.load(itemLayout);
                expect(result).toBe(false);
            });

            it('should dispatch "onLoading"', function() {
                spyOn(renderer.onLoading, 'dispatch');

                renderer.render(itemLayout);
                renderer.load(itemLayout);

                expect(renderer.onLoading.dispatch).toHaveBeenCalledWith([renderer, {
                    itemIndex: itemLayout.itemIndex,
                    placeholder: renderer.get(0),
                    scaleToFit: itemLayout.scaleToFit,
                    width: itemLayout.width,
                    height: itemLayout.height
                }]);
            });

            it('should mark the placeholder as having content', function() {
                var placeholder;

                renderer.render(itemLayout);
                placeholder = renderer.get(itemLayout.itemIndex);
                expect(placeholder.hasContent).toBe(false);

                renderer.load(itemLayout);
                expect(placeholder.hasContent).toBe(true);
            });

            it('should return true if content is loaded', function() {
                renderer.render(itemLayout);

                expect(renderer.load(itemLayout)).toBe(true);
            });
        });

        describe('when refreshing', function() {

            var itemMap = _.extend({}, AwesomeMap.prototype);

            beforeEach(function() {
                spyOn(renderer, 'appendPlaceholderToScrollList');
                renderer.render(new ItemLayout({ itemIndex: 0 }));

                spyOn(itemMap, 'clearContent');
                spyOn(itemMap, 'invalidateViewportDimensions');
            });

            describe('active item maps', function() {
                beforeEach(function() {
                    // Attach the fake map to the placheolder.
                    renderer.get(0).map = itemMap;

                    renderer.refresh();
                });
                it('should clear the content from the map', function() {
                    expect(itemMap.clearContent).toHaveBeenCalled();
                });
                it('should invalidate the viewport dimensions for the map', function() {
                    expect(itemMap.clearContent).toHaveBeenCalled();
                });
            });

            describe('pooled item maps', function() {
                beforeEach(function() {
                    // Put the placeholder in the pool, then attach the fake map.
                    var placeholder = renderer.get(0);
                    renderer.remove(0);
                    placeholder.map = itemMap;

                    renderer.refresh();
                });
                it('should clear the content from the map', function() {
                    expect(itemMap.clearContent).toHaveBeenCalled();
                });
                it('should invalidate the viewport dimensions for the map', function() {
                    expect(itemMap.clearContent).toHaveBeenCalled();
                });
            });
        });

        describe('when removing a placeholder', function() {

            var itemLayout;
            var placeholderContainer;

            beforeEach(function() {
                spyOn(renderer, 'appendPlaceholderToScrollList');
                itemLayout = new ItemLayout({ itemIndex: 0 });
                placeholderContainer = renderer.getPlaceholderContainer();
            });

            it('should return false if the placeholder does not exist', function() {
                expect(renderer.remove(10)).toBe(false);
            });

            it('should unload the placeholder', function() {
                renderer.render(itemLayout);
                spyOn(renderer, 'unload');

                renderer.remove(0);

                expect(renderer.unload).toHaveBeenCalledWith(0);
            });

            it('should remove the element from the list map', function() {
                renderer.render(itemLayout);
                var placeholder = renderer.get(0);
                spyOn(placeholderContainer, 'contains').andReturn(true);
                spyOn(placeholderContainer, 'removeChild');

                renderer.remove(0);

                expect(placeholderContainer.removeChild).toHaveBeenCalledWith(placeholder.element);
            });

            it('should clear the item map', function() {
                renderer.render(itemLayout);
                var itemMap = Object.create(AwesomeMap.prototype);
                spyOn(itemMap, 'clearContent');
                var placeholder = renderer.get(0);
                placeholder.map = itemMap;

                renderer.remove(0);

                expect(itemMap.clearContent).toHaveBeenCalled();
            });

            it('should dispatch "onRemoved"', function() {
                spyOn(renderer.onRemoved, 'dispatch');

                renderer.render(itemLayout);
                var placeholder = renderer.get(0);

                renderer.remove(0);

                expect(renderer.onRemoved.dispatch).toHaveBeenCalledWith([renderer, {
                    itemIndex: 0,
                    placeholder: placeholder
                }]);
            });

            it('should delete the placeholder', function() {
                renderer.render(itemLayout);
                expect(renderer.get(0)).toBeDefined();

                renderer.remove(0);
                expect(renderer.get(0)).toBeUndefined();
            });

            it('should add the placeholder to the pool', function() {
                var placeholder;

                renderer.render(itemLayout);
                placeholder = renderer.get(0);

                expect(placeholder).toBeDefined();

                renderer.remove(0);

                expect(renderer._pool.length).toBe(1);
                expect(renderer._pool[0]).toBe(placeholder);
            });

            it('should return true if the placeholder is removed', function() {
                renderer.render(itemLayout);

                expect(renderer.remove(0)).toBe(true);
            });
        });

        describe('when rendering a placeholder', function() {

            var itemLayout;
            var originalHasCssTransforms3d;

            beforeEach(function() {
                spyOn(renderer, 'appendPlaceholderToScrollList');
                itemLayout = new ItemLayout({
                    itemIndex: 0,
                    top: 10,
                    bottom: 20,
                    left: 20,
                    right: 40,
                    width: 100,
                    height: 200,
                    paddingTop: 10,
                    paddingBottom: 20,
                    paddingLeft: 30,
                    paddingRight: 40
                });
                originalHasCssTransforms3d = BrowserInfo.hasCssTransforms3d;
            });

            afterEach(function() {
                BrowserInfo.hasCssTransforms3d = originalHasCssTransforms3d;
            });

            it('should return false if the placeholder is already rendered', function() {
                renderer.render(itemLayout);

                expect(renderer.render(itemLayout)).toBe(false);
            });

            it('should build a placeholder', function() {
                var placeholder;
                var style;

                renderer.render(itemLayout);

                placeholder = renderer.get(0);
                expect(placeholder).toBeDefined();
                expect(placeholder.element instanceof HTMLElement).toBe(true);

                style = placeholder.element.style;
                expect(style.position).toBe('absolute');
                expect(style.width).toBe(itemLayout.right - itemLayout.left + 'px');
                expect(style.height).toBe(itemLayout.bottom - itemLayout.top + 'px');
                expect(style.top).toBe(itemLayout.top + 'px');
                expect(style.left).toBe(itemLayout.left + 'px');
            });

            it('should recycle a placeholder from the pool if one is available', function() {
                var placeholder;

                renderer.render(itemLayout);
                placeholder = renderer.get(0);

                renderer.remove(0);
                renderer.render(itemLayout);

                expect(renderer.get(0)).toBe(placeholder);
            });

            it('should build an inner content container', function() {
                renderer.render(itemLayout);

                var placeholder = renderer.get(0);
                expect(placeholder).toBeDefined();

                var contentContainer = placeholder.contentContainer;
                expect(contentContainer instanceof HTMLElement).toBe(true);

                var style = contentContainer.style;
                expect(style.position).toBe('absolute');
                expect(style.overflow).toBe('hidden');
                expect(style.boxSizing).toBe('content-box');
                expect(style.top).toBe(itemLayout.offsetTop + 'px');
                expect(style.left).toBe(itemLayout.offsetLeft + 'px');
                expect(style.width).toBe(itemLayout.width + 'px');
                expect(style.height).toBe(itemLayout.height + 'px');
                expect(style.marginTop).toBe(itemLayout.paddingTop + 'px');
                expect(style.marginRight).toBe(itemLayout.paddingRight + 'px');
                expect(style.marginBottom).toBe(itemLayout.paddingBottom + 'px');
                expect(style.marginLeft).toBe(itemLayout.paddingLeft + 'px');

                expect(placeholder.element).toBeDefined();
                expect(placeholder.element.children[0]).toBe(contentContainer);
            });

            it('should dispatch "onRendered"', function() {
                spyOn(renderer.onRendered, 'dispatch');

                renderer.render(itemLayout);
                var placeholder = renderer.get(0);

                expect(renderer.onRendered.dispatch).toHaveBeenCalledWith([renderer, {
                    itemIndex: 0,
                    placeholder: placeholder
                }]);
            });

            it('should attach the rendered placeholder to the scroll list', function() {
                renderer.render(itemLayout);
                var placeholder = renderer.get(itemLayout.itemIndex);

                expect(renderer.appendPlaceholderToScrollList)
                    .toHaveBeenCalledWith(itemLayout, placeholder);
            });

            it('should return true if the placeholder is created', function() {
                expect(renderer.render(itemLayout)).toBe(true);
            });
        });

        describe('when unloading content from a placeholder', function() {

            var itemLayout;

            beforeEach(function() {
                spyOn(renderer, 'appendPlaceholderToScrollList');
                itemLayout = new ItemLayout({ itemIndex: 0 });
            });

            it('should return false if the placeholder does not exist', function() {
                expect(renderer.unload(0)).toBe(false);
            });

            it('should return false if the content is already loaded', function() {
                renderer.render(itemLayout);

                expect(renderer.unload(0)).toBe(false);
            });

            it('should dispatch "onUnloaded" after content is cleared', function() {
                renderer.render(itemLayout);
                renderer.load(itemLayout);
                var placeholder = renderer.get(0);
                placeholder.contentContainer.appendChild(document.createElement('div'));

                var contentCountOnDispatch = -1;
                var dispatchedSender;
                var dispatchedArgs;
                renderer.onUnloaded(function(sender, args) {
                    contentCountOnDispatch = placeholder.contentContainer.childNodes.length;
                    dispatchedSender = sender;
                    dispatchedArgs = args;
                });

                renderer.unload(0);

                expect(contentCountOnDispatch).toBe(0);
                expect(dispatchedSender).toBe(renderer);
                expect(dispatchedArgs).toEqual({ itemIndex: 0, placeholder: placeholder });
            });

            it('should clear all children from the placeholder', function() {
                renderer.render(itemLayout);
                renderer.load(itemLayout);
                var placeholder = renderer.get(0);
                placeholder.contentContainer.appendChild(document.createElement('div'));
                placeholder.contentContainer.appendChild(document.createElement('div'));

                renderer.unload(0);

                expect(placeholder.contentContainer.children.length).toBe(0);
            });

            it('should mark the placeholder as having no content', function() {
                renderer.render(itemLayout);
                renderer.load(itemLayout);
                var placeholder = renderer.get(0);
                expect(placeholder.hasContent).toBe(true);

                renderer.unload(0);
                expect(placeholder.hasContent).toBe(false);
            });
        });

        describe('when updating', function() {
            describe('placeholders before the start index', function() {
                it('should not update the key associated with the placeholder', function() {
                    spyOn(renderer, 'appendPlaceholderToScrollList');
                    renderer.render(new ItemLayout({ itemIndex: 0 }));
                    var placeholder = renderer.get(0);
                    renderer.update(1, 1);
                    expect(renderer.get(0)).toBe(placeholder);
                });
            });
            describe('placeholders after the start index', function() {
                var itemLayouts;
                beforeEach(function() {
                    itemLayouts = [
                        new ItemLayout({ itemIndex: 0, top: 0, left: 1 }),
                        new ItemLayout({ itemIndex: 1, top: 10, left: 11 }),
                        new ItemLayout({ itemIndex: 2, top: 20, left: 21 })
                    ];
                    spyOn(layout, 'getItemLayout').andCallFake(function(index) {
                        return itemLayouts[index];
                    });
                    spyOn(renderer, 'appendPlaceholderToScrollList');
                    renderer.render(itemLayouts[0]);
                    renderer.render(itemLayouts[1]);
                });
                it('should update the key associated with the placeholder', function() {
                    var originalPlaceholders = [
                        renderer.get(0),
                        renderer.get(1)
                    ];
                    renderer.update(0, 1);
                    expect(renderer.get(1)).toBe(originalPlaceholders[0]);
                    expect(renderer.get(2)).toBe(originalPlaceholders[1]);
                });
                it('should update the top position of the placeholder', function() {
                    renderer.update(0, 1);
                    expect(renderer.get(1).element.style.top).toBe(itemLayouts[1].top + 'px');
                    expect(renderer.get(2).element.style.top).toBe(itemLayouts[2].top + 'px');
                });
                it('should update the left position of the placeholder', function() {
                    renderer.update(0, 1);
                    expect(renderer.get(1).element.style.left).toBe(itemLayouts[1].left + 'px');
                    expect(renderer.get(2).element.style.left).toBe(itemLayouts[2].left + 'px');
                });
                it('should append the placeholder to the scroll list', function() {
                    renderer.update(0, 1);
                    expect(renderer.appendPlaceholderToScrollList).toHaveBeenCalledWith(itemLayouts[1], renderer.get(1), true);
                    expect(renderer.appendPlaceholderToScrollList).toHaveBeenCalledWith(itemLayouts[2], renderer.get(2), true);
                });
            });
        });
    });
});
