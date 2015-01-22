define(function(require) {
    'use strict';

    var HorizontalAlignments = require('wf-js-uicomponents/layouts/HorizontalAlignments');
    var PositionTranslator = require('wf-js-uicomponents/scroll_list/PositionTranslator');
    var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');
    var ScrollModes = require('wf-js-uicomponents/scroll_list/ScrollModes');
    var VerticalLayout = require('wf-js-uicomponents/layouts/VerticalLayout');

    describe('PositionTranslator', function() {
        function createTranslator(options) {
            options = options || {};
            var viewportSize = options.viewportSize || {};
            var layoutSize = options.layoutSize || {};
            var scrollListOptions = options.scrollListOptions || {
                mode: ScrollModes.FLOW,
                horizontalAlign: HorizontalAlignments.AUTO
            };

            var layout = Object.create(VerticalLayout.prototype);
            spyOn(layout, 'getViewportSize').andReturn(viewportSize);
            spyOn(layout, 'getSize').andReturn(layoutSize);

            var scrollList = Object.create(ScrollList.prototype);
            spyOn(scrollList, 'getLayout').andReturn(layout);
            spyOn(scrollList, 'getOptions').andReturn(scrollListOptions);

            return new PositionTranslator(scrollList);
        }
        describe('getLeftInTransformationPlane', function() {
            it('should account for the offset between the viewport and the map when the content ' +
                'is narrower than the viewport', function() {
                var viewportSize = { width: 500 };
                var layoutSize = { width: 300};
                var positionTranslator = createTranslator({
                    viewportSize: viewportSize,
                    layoutSize: layoutSize
                });
                var leftOffset = (viewportSize.width - layoutSize.width) / 2;
                var viewportLeft = 150;
                var result = positionTranslator.getLeftInTransformationPlane(viewportLeft);
                expect(result).toEqual(viewportLeft - leftOffset);
            });
            it('should left align the map to the viewport when the content ' +
                'is wider than the viewport', function() {
                var viewportSize = { width: 500 };
                var layoutSize = { width: 600};
                var positionTranslator = createTranslator({
                    viewportSize: viewportSize,
                    layoutSize: layoutSize
                });
                var viewportLeft = 150;
                var result = positionTranslator.getLeftInTransformationPlane(viewportLeft);
                expect(result).toEqual(viewportLeft);
            });
            it('should left aligne the map to the viewport when horizontalAlign ' +
                'is "left"', function() {
                var positionTranslator = createTranslator({
                    scrollListOptions: {
                        mode: ScrollModes.FLOW,
                        horizontalAlign: HorizontalAlignments.LEFT
                    }
                });
                var viewportLeft = 100;
                var result = positionTranslator.getLeftInTransformationPlane(viewportLeft);
                expect(result).toEqual(viewportLeft);
            });
            it('should return the value unchanged when not in "flow" mode', function() {
                var positionTranslator = createTranslator({ scrollListOptions: { mode: '!flow' } });
                var viewportLeft = 100;
                var result = positionTranslator.getLeftInTransformationPlane(viewportLeft);
                expect(result).toEqual(viewportLeft);
            });
        });
        describe('getBoundsInTransformationPlane', function() {
            function checkPositionInFlow(positionTranslator, itemLayout, expectedOffset) {
                var result = positionTranslator.getBoundsInTransformationPlane(itemLayout);
                expect(result.left).toEqual(itemLayout.left - expectedOffset + itemLayout.paddingLeft);
                expect(result.top).toEqual(itemLayout.top + itemLayout.paddingTop);
                expect(result.right).toEqual(itemLayout.right - expectedOffset - itemLayout.paddingRight);
                expect(result.bottom).toEqual(itemLayout.bottom - itemLayout.paddingBottom);
            }
            it('should account for the centering of the map when the layout is ' +
                'narrower than the viewport and horizontal alignment is "auto"', function() {
                var viewportSize = { width: 500 };
                var layoutSize = { width: 300 };
                var positionTranslator = createTranslator({
                    viewportSize: viewportSize,
                    layoutSize: layoutSize
                });
                var itemLayout = {
                    paddingLeft: 10,
                    paddingRight: 10,
                    paddingTop: 10,
                    paddingBottom: 10,
                    top: 50,
                    right: 400,
                    left: 100,
                    bottom: 450
                };
                var leftOffset = (viewportSize.width - layoutSize.width) / 2;
                checkPositionInFlow(positionTranslator, itemLayout, leftOffset);
            });
            it('should just remove the padding when the layout is wider than the viewport ' +
                'and horizontal alignment is "auto"', function() {
                var viewportSize = { width: 300 };
                var layoutSize = { width: 500 };
                var positionTranslator = createTranslator({
                    viewportSize: viewportSize,
                    layoutSize: layoutSize
                });
                var itemLayout = {
                    paddingLeft: 10,
                    paddingRight: 10,
                    paddingTop: 10,
                    paddingBottom: 10,
                    top: 50,
                    right: 400,
                    left: 100,
                    bottom: 450
                };
                checkPositionInFlow(positionTranslator, itemLayout, 0);
            });
            it('should just remove the padding when the horizontal alignment is "left"', function() {
                var viewportSize = { width: 500 };
                var layoutSize = { width: 300 };
                var positionTranslator = createTranslator({
                    viewportSize: viewportSize,
                    layoutSize: layoutSize,
                    scrollListOptions: {
                        mode: ScrollModes.FLOW,
                        horizontalAlign: HorizontalAlignments.LEFT
                    }
                });
                var itemLayout = {
                    paddingLeft: 10,
                    paddingRight: 10,
                    paddingTop: 10,
                    paddingBottom: 10,
                    top: 50,
                    right: 400,
                    left: 100,
                    bottom: 450
                };
                checkPositionInFlow(positionTranslator, itemLayout, 0);
            });
            it('should just remove the padding when not in "flow" mode', function() {
                var positionTranslator = createTranslator({
                    scrollListOptions: {
                        mode: '!flow'
                    }
                });
                var itemLayout = {
                    paddingLeft: 50,
                    paddingRight: 50,
                    paddingTop: 30,
                    paddingBottom: 30,
                    outerWidth: 300,
                    outerHeight: 200
                };
                var result = positionTranslator.getBoundsInTransformationPlane(itemLayout);
                expect(result.left).toEqual(itemLayout.paddingLeft);
                expect(result.top).toEqual(itemLayout.paddingTop);
                expect(result.right).toEqual(itemLayout.outerWidth - itemLayout.paddingRight);
                expect(result.bottom).toEqual(itemLayout.outerHeight - itemLayout.paddingBottom);
            });
        });
    });
});
