// define(function(require) {
//     'use strict';

//     var AwesomeMap = require('wf-js-uicomponents/awesome_map/AwesomeMap');
//     var Gesture = require('wf-js-uicomponents/awesome_map/Gesture');
//     var HitTester = require('wf-js-uicomponents/scroll_list/HitTester');
//     var HorizontalAlignments = require('wf-js-uicomponents/layouts/HorizontalAlignments');
//     var InteractionEvent = require('wf-js-uicomponents/awesome_map/InteractionEvent');
//     var ItemLayout = require('wf-js-uicomponents/layouts/ItemLayout');
//     var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');
//     var ScrollModes = require('wf-js-uicomponents/scroll_list/ScrollModes');
//     var TransformState = require('wf-js-uicomponents/awesome_map/TransformState');
//     var VerticalLayout = require('wf-js-uicomponents/layouts/VerticalLayout');

//     describe('HitTester', function() {
//         describe('testing item maps', function() {
//             var scrollList;
//             var itemLayout;
//             var itemMapState;
//             beforeEach(function() {
//                 itemLayout = new ItemLayout({ itemIndex: 0 });

//                 var layout = Object.create(VerticalLayout.prototype);
//                 spyOn(layout, 'getCurrentItemIndex').andReturn(itemLayout.itemIndex);
//                 spyOn(layout, 'getItemLayout').andReturn(itemLayout);
//                 spyOn(layout, 'getViewportSize').andReturn({});
//                 spyOn(layout, 'getSize').andReturn({});

//                 itemMapState = new TransformState();

//                 var itemMap = Object.create(AwesomeMap.prototype);
//                 spyOn(itemMap, 'getCurrentTransformState').andReturn(itemMapState);

//                 scrollList = Object.create(ScrollList.prototype);
//                 spyOn(scrollList, 'getLayout').andReturn(layout);
//                 spyOn(scrollList, 'getCurrentItemMap').andReturn(itemMap);
//                 spyOn(scrollList, 'getOptions').andReturn({
//                     mode: ScrollModes.SINGLE,
//                     horizontalAlign: HorizontalAlignments.CENTER
//                 });
//             });
//             it('should return hit data if the event position is inside the item', function() {
//                 itemLayout.outerWidth = 100;
//                 itemLayout.outerHeight = 100;
//                 var point = { x: 50, y: 50 };

//                 var result = HitTester.testItemMap(scrollList, point);

//                 expect(result).toEqual({
//                     index: itemLayout.itemIndex,
//                     position: { x: 50, y: 50 }
//                 });
//             });
//             describe('when event is at boundaries', function() {
//                 // NOTE: The item map translates the content to center it in the viewport.
//                 // We need only accommodate the outer width and height + any padding
//                 it('should test correctly at top edge', function() {
//                     itemLayout.outerHeight = 110;
//                     itemLayout.paddingTop = 10;
//                     var point = { x: 0, y: 110 };
//                     itemMapState.translateY = 100;
//                     var result = HitTester.testItemMap(scrollList, point);
//                     expect(result).toBeTruthy();
//                     // Now bump one px outside.
//                     itemMapState.translateY = 101;
//                     result = HitTester.testItemMap(scrollList, point);
//                     expect(result).toBe(false);
//                 });
//                 it('should test correctly at bottom edge', function() {
//                     itemLayout.outerHeight = 110;
//                     itemLayout.paddingBottom = 10;
//                     var point = { x: 0, y: 200 };
//                     itemMapState.translateY = 100;
//                     var result = HitTester.testItemMap(scrollList, point);
//                     expect(result).toBeTruthy();
//                     // Now bump one px outside.
//                     itemMapState.translateY = 99;
//                     result = HitTester.testItemMap(scrollList, point);
//                     expect(result).toBe(false);
//                 });
//                 it('should test correctly at left edge', function() {
//                     itemLayout.outerWidth = 110;
//                     itemLayout.paddingLeft = 10;
//                     var point = { x: 110, y: 0 };
//                     itemMapState.translateX = 100;
//                     var result = HitTester.testItemMap(scrollList, point);
//                     expect(result).toBeTruthy();
//                     // Now bump one px outside.
//                     itemMapState.translateX = 101;
//                     result = HitTester.testItemMap(scrollList, point);
//                     expect(result).toBe(false);
//                 });
//                 it('should test correctly at right edge', function() {
//                     itemLayout.outerWidth = 110;
//                     itemLayout.paddingRight = 10;
//                     var point = { x: 200, y: 0 };
//                     itemMapState.translateX = 100;
//                     var result = HitTester.testItemMap(scrollList, point);
//                     expect(result).toBeTruthy();
//                     // Now bump one px outside.
//                     itemMapState.translateX = 99;
//                     result = HitTester.testItemMap(scrollList, point);
//                     expect(result).toBe(false);
//                 });
//             });
//             it('should translate successful hit positions to be relative to original item size', function() {
//                 itemLayout.outerWidth = 100;
//                 itemLayout.outerHeight = 100;
//                 itemLayout.scaleToFit = 0.5;
//                 var point = { x: 300, y: 300 };

//                 itemMapState.translateX = 100;
//                 itemMapState.translateY = 100;
//                 itemMapState.scale = 2;

//                 var result = HitTester.testItemMap(scrollList, point);

//                 expect(result).toEqual({
//                     index: itemLayout.itemIndex,
//                     position: { x: 200, y: 200 }
//                 });
//             });
//         });
//         describe('testing list maps', function() {
//             var scrollListOptions;
//             var scrollList;
//             var itemLayout;
//             var listMapState;
//             var viewportSize;
//             var layoutSize;
//             var event;
//             beforeEach(function() {
//                 itemLayout = new ItemLayout({ itemIndex: 0 });

//                 viewportSize = { width: 500, height: 500 };
//                 layoutSize = { width: 500, height: 500 };

//                 var layout = Object.create(VerticalLayout.prototype);
//                 spyOn(layout, 'getViewportSize').andReturn(viewportSize);
//                 spyOn(layout, 'getSize').andReturn(layoutSize);
//                 spyOn(layout, 'getVisibleItemRange').andReturn({ startIndex: 0, endIndex: 0 });
//                 spyOn(layout, 'getItemLayout').andReturn(itemLayout);

//                 listMapState = new TransformState();

//                 var listMap = Object.create(AwesomeMap.prototype);
//                 spyOn(listMap, 'getCurrentTransformState').andReturn(listMapState);

//                 scrollListOptions = {
//                     mode: ScrollModes.FLOW,
//                     horizontalAlign: HorizontalAlignments.CENTER
//                 };

//                 scrollList = Object.create(ScrollList.prototype);
//                 spyOn(scrollList, 'getLayout').andReturn(layout);
//                 spyOn(scrollList, 'getListMap').andReturn(listMap);
//                 spyOn(scrollList, 'getOptions').andReturn(scrollListOptions);

//                 var gesture = new Gesture();
//                 event = new InteractionEvent('faketype', gesture, gesture);
//             });
//             it('should return hit data if the event position is inside the item', function() {
//                 itemLayout.top = 100;
//                 itemLayout.right = 200;
//                 itemLayout.bottom = 200;
//                 itemLayout.left = 100;
//                 var point = { x: 50, y: 50 };
//                 listMapState.translateX = -100;
//                 listMapState.translateY = -100;
//                 var result = HitTester.testListMap(scrollList, point);

//                 expect(result).toEqual({
//                     index: itemLayout.itemIndex,
//                     position: { x: 50, y: 50 }
//                 });
//             });
//             describe('when event is at boundaries', function() {
//                 // NOTE: The item map translates the content to center it in the viewport.
//                 // We need only accommodate the outer width and height + any padding
//                 it('should test correctly at top edge', function() {
//                     itemLayout.top = 100;
//                     itemLayout.bottom = 200;
//                     itemLayout.paddingTop = 10;
//                     var point = { x: 0, y: 110 };
//                     listMapState.translateY = 0;
//                     var result = HitTester.testListMap(scrollList, point);
//                     expect(result).toBeTruthy();
//                     // Now bump one px outside.
//                     listMapState.translateY = 1;
//                     result = HitTester.testListMap(scrollList, point);
//                     expect(result).toBe(false);
//                 });
//                 it('should test correctly at bottom edge', function() {
//                     itemLayout.top = 100;
//                     itemLayout.bottom = 200;
//                     itemLayout.paddingBottom = 10;
//                     var point = { x: 0, y: 190 };
//                     listMapState.translateY = 0;
//                     var result = HitTester.testListMap(scrollList, point);
//                     expect(result).toBeTruthy();
//                     // Now bump one px outside.
//                     listMapState.translateY = -1;
//                     result = HitTester.testListMap(scrollList, point);
//                     expect(result).toBe(false);
//                 });
//                 it('should test correctly at left edge', function() {
//                     itemLayout.left = 100;
//                     itemLayout.right = 200;
//                     itemLayout.paddingLeft = 10;
//                     var point = { x: 110, y: 0 };
//                     listMapState.translateX = 0;
//                     var result = HitTester.testListMap(scrollList, point);
//                     expect(result).toBeTruthy();
//                     // Now bump one px outside.
//                     listMapState.translateX = 1;
//                     result = HitTester.testListMap(scrollList, point);
//                     expect(result).toBe(false);
//                 });
//                 it('should test correctly at right edge', function() {
//                     itemLayout.left = 100;
//                     itemLayout.right = 200;
//                     itemLayout.paddingRight = 10;
//                     var point = { x: 190, y: 0 };
//                     listMapState.translateX = 0;
//                     var result = HitTester.testListMap(scrollList, point);
//                     expect(result).toBeTruthy();
//                     // Now bump one px outside.
//                     listMapState.translateX = -1;
//                     result = HitTester.testListMap(scrollList, point);
//                     expect(result).toBe(false);
//                 });
//             });
//             describe('when horizontal alignment is "center"', function() {
//                 it('should calculate correct position when viewport is wider than layout', function() {
//                     layoutSize.width = 300;
//                     itemLayout.top = 100;
//                     itemLayout.right = 300;
//                     itemLayout.bottom = 200;
//                     itemLayout.left = 200;
//                     var point = { x: 50, y: 50 };
//                     listMapState.translateX = -100;
//                     listMapState.translateY = -100;
//                     var result = HitTester.testListMap(scrollList, point);

//                     expect(result).toEqual({
//                         index: itemLayout.itemIndex,
//                         position: { x: 50, y: 50 }
//                     });
//                 });
//                 it('should calculate correct position when viewport is narrower than layout', function() {
//                     viewportSize.width = 300;
//                     itemLayout.top = 100;
//                     itemLayout.right = 275;
//                     itemLayout.bottom = 200;
//                     itemLayout.left = 25;
//                     var point = { x: 50, y: 50 };
//                     listMapState.translateX = -100;
//                     listMapState.translateY = -100;
//                     var result = HitTester.testListMap(scrollList, point);

//                     expect(result).toEqual({
//                         index: itemLayout.itemIndex,
//                         position: { x: 25, y: 50 }
//                     });
//                 });
//             });
//             describe('when horizontal alignment is "left"', function() {
//                 beforeEach(function() {
//                     scrollListOptions.horizontalAlign = HorizontalAlignments.LEFT;
//                 });
//                 it('should calculate correct position when viewport is wider than layout', function() {
//                     // In this case the hit tester will assume the layout is
//                     // aligned to the left edge of the viewport initially
//                     layoutSize.width = 300; // make it narrower than the viewport
//                     itemLayout.top = 100;
//                     itemLayout.right = 100;
//                     itemLayout.bottom = 200;
//                     itemLayout.left = 0;
//                     var point = { x: 50, y: 50 };
//                     listMapState.translateX = -25;
//                     listMapState.translateY = -100;
//                     var result = HitTester.testListMap(scrollList, point);

//                     expect(result).toEqual({
//                         index: itemLayout.itemIndex,
//                         position: { x: 75, y: 50 }
//                     });
//                 });
//                 it('should calculate correct position when viewport is narrower than layout', function() {
//                     // In this case the hit tester will assume the layout is
//                     // aligned to the left edge of the viewport initially
//                     viewportSize.width = 300; // make it narrower than the layout
//                     itemLayout.top = 100;
//                     itemLayout.right = 100;
//                     itemLayout.bottom = 200;
//                     itemLayout.left = 0;
//                     var point = { x: 50, y: 50 };
//                     listMapState.translateX = -25;
//                     listMapState.translateY = -100;
//                     var result = HitTester.testListMap(scrollList, point);

//                     expect(result).toEqual({
//                         index: itemLayout.itemIndex,
//                         position: { x: 75, y: 50 }
//                     });
//                 });
//             });
//             it('should translate successful hit positions to be relative to original item size', function() {
//                 itemLayout.top = 0;
//                 itemLayout.right = 100;
//                 itemLayout.bottom = 100;
//                 itemLayout.left = 0;
//                 itemLayout.scaleToFit = 0.5;
//                 var point = { x: 300, y: 300 };
//                 listMapState.translateX = 100;
//                 listMapState.translateY = 100;
//                 listMapState.scale = 2;
//                 var result = HitTester.testListMap(scrollList, point);

//                 expect(result).toEqual({
//                     index: itemLayout.itemIndex,
//                     position: { x: 200, y: 200 }
//                 });
//             });
//         });
//     });
// });
