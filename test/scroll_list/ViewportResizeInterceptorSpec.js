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
    var AsyncSpec = require('wf-js-uicomponents/AsyncSpec');
    var AwesomeMap = require('wf-js-uicomponents/awesome_map/AwesomeMap');
    var EventTypes = require('wf-js-uicomponents/awesome_map/EventTypes');
    var Gesture = require('wf-js-uicomponents/awesome_map/Gesture');
    var InteractionEvent = require('wf-js-uicomponents/awesome_map/InteractionEvent');
    var ViewportResizeInterceptor = require('wf-js-uicomponents/scroll_list/ViewportResizeInterceptor');

    describe('ViewportResizeInterceptor', function() {
        var async = new AsyncSpec(this);
        var $host = $('<div>').css({ position: 'absolute', top: -10000, width: 400, height: 400 });
        var fakeScrollList = {
            refresh: function() {}
        };
        var awesomeMap;
        var interceptor;

        beforeEach(function() {
            interceptor = new ViewportResizeInterceptor(fakeScrollList);

            $host.empty().appendTo('body');

            awesomeMap = new AwesomeMap($host[0]);
            awesomeMap.addInterceptor(interceptor);
        });

        afterEach(function() {
            $host.remove();
            awesomeMap.dispose();
        });

        it('should return false to cancel the event and stop propagation to item maps', function() {
            var gesture = new Gesture();
            var resizeEvent = new InteractionEvent(EventTypes.RESIZE, gesture, gesture);

            var result = interceptor.handleInteraction(null, { event: resizeEvent });

            expect(result).toBe(false);
        });

        async.it('should refresh the scroll list 100ms after the last resize event', function(done) {
            var gesture = new Gesture();
            var event = new InteractionEvent(EventTypes.RESIZE, gesture, gesture);

            spyOn(fakeScrollList, 'refresh');
            awesomeMap.onInteraction.dispatch([null, { event: event }]);

            expect(fakeScrollList.refresh).not.toHaveBeenCalled();

            setTimeout(function() {
                expect(fakeScrollList.refresh).toHaveBeenCalled();
                done();
            }, 100);
        });
    });
});
