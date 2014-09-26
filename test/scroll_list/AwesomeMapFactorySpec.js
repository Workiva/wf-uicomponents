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

    var $ = require('jquery');
    var AwesomeMapFactory = require('wf-js-uicomponents/scroll_list/AwesomeMapFactory');
    var ItemSizeCollection = require('wf-js-uicomponents/layouts/ItemSizeCollection');
    var ScrollList = require('wf-js-uicomponents/scroll_list/ScrollList');

    describe('AwesomeMapFactory', function() {
        var $host = $('<div>').css({ position: 'absolute', top: -10000, width: 400, height: 400 });
        beforeEach(function() {
            $host.appendTo('body');
        });
        afterEach(function() {
            $host.empty().remove();
        });
        describe('list maps', function() {
            describe('when translation changes', function() {
                it('should dispatch scroll list "onScrollPositionChanged"', function() {
                    // Setup scroll list
                    var itemSizeCollection = new ItemSizeCollection({
                        maxWidth: 100,
                        maxHeight: 100,
                        items: [{ width: 100, height: 100 }]
                    });
                    var scrollList = new ScrollList($host[0], itemSizeCollection);
                    spyOn(scrollList.onScrollPositionChanged, 'dispatch');

                    // Setup list map.
                    var map = AwesomeMapFactory.createListMap(scrollList);

                    // Dispatch the translation change event from the map.
                    var args = {
                        event: {},
                        x: -100,
                        y: -100
                    };
                    map.onTranslationChanged.dispatch([map, args]);

                    // Expect the translation change to trigger a scroll position change.
                    expect(scrollList.onScrollPositionChanged.dispatch)
                        .toHaveBeenCalledWith([scrollList, {
                            event: args.event,
                            x: -args.x,
                            y: -args.y
                        }]);
                });
            });

            describe('initial positioning', function() {
                function createMap(listWidth, listHeight) {
                    var itemSizeCollection = new ItemSizeCollection({
                        maxWidth: listWidth,
                        maxHeight: listHeight,
                        items: [{ width: listWidth, height: listHeight }]
                    });

                    // setup scroll list
                    var scrollList = new ScrollList($host[0], itemSizeCollection);

                    // Setup list map.
                    return AwesomeMapFactory.createListMap(scrollList);
                }

                it('should center scrollList vertically in viewport when scrollList ' +
                    'height is less than viewport height', function() {
                    // Setup list map
                    var map = createMap(75, 100);

                    // Expect the map to be centered vertically in the viewport when created
                    var mapTopWhenCentered = (400 - 100) / 2;
                    expect(map.getTranslation().y).toEqual(mapTopWhenCentered);
                });
                it('should center scrollList horizontally in viewport when scrollList ' +
                    'width is less than viewport width', function() {
                    // Setup list map
                    var map = createMap(100, 75);

                    // Expect the map to be centered horizontally in the viewport when created
                    var mapLeftWhenCentered = (400 - 100) / 2;
                    expect(map.getTranslation().x).toEqual(mapLeftWhenCentered);
                });
                it('should position the scrollList at the top of the viewport when ' +
                    'scrollList height is greater than viewport height', function() {
                    var map = createMap(75, 500);

                    // Expect the map to be positioned at the top of the viewport
                    expect(map.getTranslation().y).toEqual(0);
                });
                it('should position the scrollList at the left edge of the viewport when ' +
                    'scrollList width is greater than viewport width', function() {
                    // Setup list map
                    var map = createMap(500, 75);

                    // Expect the map to be positioned at the left of the viewport
                    expect(map.getTranslation().x).toEqual(0);
                });
            });
        });
    });
});
