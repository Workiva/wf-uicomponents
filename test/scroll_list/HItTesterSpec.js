define(function(require) {
    'use strict';

    var Gesture = require('wf-js-uicomponents/awesome_map/Gesture');
    var HitTester = require('wf-js-uicomponents/scroll_list/HitTester');
    var InteractionEvent = require('wf-js-uicomponents/awesome_map/InteractionEvent');
    var ItemLayout = require('wf-js-uicomponents/layouts/ItemLayout');
    var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');
    var TransformState = require('wf-js-uicomponents/awesome_map/TransformState');
    var VerticalLayout = require('wf-js-uicomponents/layouts/VerticalLayout');

    describe('HitTester', function() {
        describe('testing item maps', function() {
            var scrollList;
            var itemLayout;
            var event;
            beforeEach(function() {
                itemLayout = new ItemLayout({ itemIndex: 0 });

                var layout = Object.create(VerticalLayout.prototype);
                spyOn(layout, 'getCurrentItemIndex').andReturn(itemLayout.itemIndex);
                spyOn(layout, 'getItemLayout').andReturn(itemLayout);

                scrollList = Object.create(ScrollList.prototype);
                spyOn(scrollList, 'getLayout').andReturn(layout);

                var gesture = new Gesture();
                event = new InteractionEvent('faketype', gesture, gesture);
            });
            it('should return hit data if the event position is inside the item', function() {
                itemLayout.outerWidth = 100;
                itemLayout.outerHeight = 100;
                event.position = { x: 50, y: 50 };
                var state = new TransformState({ translateX: 0, translateY: 0, scale: 1 });
                var result = HitTester.testItemMap(scrollList, event, state);

                expect(result).toEqual({
                    index: itemLayout.itemIndex,
                    position: { x: 50, y: 50 }
                });
            });
            describe('when event is at boundaries', function() {
                // NOTE: The item map translates the content to center it in the viewport.
                // We need only accommodate the outer width and height + any padding
                it('should test correctly at top edge', function() {
                    itemLayout.outerHeight = 110;
                    itemLayout.paddingTop = 10;
                    event.position = { x: 0, y: 110 };
                    var state = new TransformState({ translateY: 100 });
                    var result = HitTester.testItemMap(scrollList, event, state);
                    expect(result).toBeTruthy();
                    // Now bump one px outside.
                    state.translateY = 101;
                    result = HitTester.testItemMap(scrollList, event, state);
                    expect(result).toBe(false);
                });
                it('should test correctly at bottom edge', function() {
                    itemLayout.outerHeight = 110;
                    itemLayout.paddingBottom = 10;
                    event.position = { x: 0, y: 200 };
                    var state = new TransformState({ translateY: 100 });
                    var result = HitTester.testItemMap(scrollList, event, state);
                    expect(result).toBeTruthy();
                    // Now bump one px outside.
                    state.translateY = 99;
                    result = HitTester.testItemMap(scrollList, event, state);
                    expect(result).toBe(false);
                });
                it('should test correctly at left edge', function() {
                    itemLayout.outerWidth = 110;
                    itemLayout.paddingLeft = 10;
                    event.position = { x: 110, y: 0 };
                    var state = new TransformState({ translateX: 100 });
                    var result = HitTester.testItemMap(scrollList, event, state);
                    expect(result).toBeTruthy();
                    // Now bump one px outside.
                    state.translateX = 101;
                    result = HitTester.testItemMap(scrollList, event, state);
                    expect(result).toBe(false);
                });
                it('should test correctly at right edge', function() {
                    itemLayout.outerWidth = 110;
                    itemLayout.paddingRight = 10;
                    event.position = { x: 200, y: 0 };
                    var state = new TransformState({ translateX: 100 });
                    var result = HitTester.testItemMap(scrollList, event, state);
                    expect(result).toBeTruthy();
                    // Now bump one px outside.
                    state.translateX = 99;
                    result = HitTester.testItemMap(scrollList, event, state);
                    expect(result).toBe(false);
                });
            });
            it('should translate successful hit positions to be relative to original item size', function() {
                itemLayout.outerWidth = 100;
                itemLayout.outerHeight = 100;
                itemLayout.scaleToFit = 0.5;
                event.position = { x: 300, y: 300 };
                var state = new TransformState({ translateX: 100, translateY: 100, scale: 2 });
                var result = HitTester.testItemMap(scrollList, event, state);

                expect(result).toEqual({
                    index: itemLayout.itemIndex,
                    position: { x: 200, y: 200 }
                });
            });
        });
        describe('testing list maps', function() {
            var scrollList;
            var itemLayout;
            var event;
            beforeEach(function() {
                itemLayout = new ItemLayout({ itemIndex: 0 });

                var layout = Object.create(VerticalLayout.prototype);
                spyOn(layout, 'getViewportSize').andReturn({ width: 500, height: 500 });
                spyOn(layout, 'getSize').andReturn({ width: 500, height: 500 });
                spyOn(layout, 'getVisibleItemRange').andReturn({ startIndex: 0, endIndex: 0 });
                spyOn(layout, 'getItemLayout').andReturn(itemLayout);

                scrollList = Object.create(ScrollList.prototype);
                spyOn(scrollList, 'getLayout').andReturn(layout);

                var gesture = new Gesture();
                event = new InteractionEvent('faketype', gesture, gesture);
            });
            it('should return hit data if the event position is inside the item', function() {
                itemLayout.top = 100;
                itemLayout.right = 200;
                itemLayout.bottom = 200;
                itemLayout.left = 100;
                event.position = { x: 50, y: 50 };
                var state = new TransformState({ translateX: -100, translateY: -100 });
                var result = HitTester.testListMap(scrollList, event, state);

                expect(result).toEqual({
                    index: itemLayout.itemIndex,
                    position: { x: 50, y: 50 }
                });
            });
            describe('when event is at boundaries', function() {
                // NOTE: The item map translates the content to center it in the viewport.
                // We need only accommodate the outer width and height + any padding
                it('should test correctly at top edge', function() {
                    itemLayout.top = 100;
                    itemLayout.bottom = 200;
                    itemLayout.paddingTop = 10;
                    event.position = { x: 0, y: 110 };
                    var state = new TransformState({ translateY: 0 });
                    var result = HitTester.testListMap(scrollList, event, state);
                    expect(result).toBeTruthy();
                    // Now bump one px outside.
                    state.translateY = 1;
                    result = HitTester.testListMap(scrollList, event, state);
                    expect(result).toBe(false);
                });
                it('should test correctly at bottom edge', function() {
                    itemLayout.top = 100;
                    itemLayout.bottom = 200;
                    itemLayout.paddingBottom = 10;
                    event.position = { x: 0, y: 190 };
                    var state = new TransformState({ translateY: 0 });
                    var result = HitTester.testListMap(scrollList, event, state);
                    expect(result).toBeTruthy();
                    // Now bump one px outside.
                    state.translateY = -1;
                    result = HitTester.testListMap(scrollList, event, state);
                    expect(result).toBe(false);
                });
                it('should test correctly at left edge', function() {
                    itemLayout.left = 100;
                    itemLayout.right = 200;
                    itemLayout.paddingLeft = 10;
                    event.position = { x: 110, y: 0 };
                    var state = new TransformState({ translateX: 0 });
                    var result = HitTester.testListMap(scrollList, event, state);
                    expect(result).toBeTruthy();
                    // Now bump one px outside.
                    state.translateX = 1;
                    result = HitTester.testListMap(scrollList, event, state);
                    expect(result).toBe(false);
                });
                it('should test correctly at right edge', function() {
                    itemLayout.left = 100;
                    itemLayout.right = 200;
                    itemLayout.paddingRight = 10;
                    event.position = { x: 190, y: 0 };
                    var state = new TransformState({ translateX: 0 });
                    var result = HitTester.testListMap(scrollList, event, state);
                    expect(result).toBeTruthy();
                    // Now bump one px outside.
                    state.translateX = -1;
                    result = HitTester.testListMap(scrollList, event, state);
                    expect(result).toBe(false);
                });
            });
            it('should translate successful hit positions to be relative to original item size', function() {
                itemLayout.top = 0;
                itemLayout.right = 100;
                itemLayout.bottom = 100;
                itemLayout.left = 0;
                itemLayout.scaleToFit = 0.5;
                event.position = { x: 300, y: 300 };
                var state = new TransformState({ translateX: 100, translateY: 100, scale: 2 });
                var result = HitTester.testListMap(scrollList, event, state);

                expect(result).toEqual({
                    index: itemLayout.itemIndex,
                    position: { x: 200, y: 200 }
                });
            });
        });
    });
});