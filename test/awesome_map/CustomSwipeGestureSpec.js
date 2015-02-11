define(function(require) {
    /* jshint camelcase:false */
    'use strict';

    var _ = require('lodash');
    var CustomSwipeGesture = require('wf-js-uicomponents/awesome_map/CustomSwipeGesture');
    var Hammer = require('hammerjs');

    describe('CustomSwipeGesture', function() {

        function createFakeEvent(props) {
            return _.defaults(props || {}, {
                eventType: null,
                touches: [],
                deltaX: 0,
                deltaY: 0,
                direction: null,
                timeStamp: Date.now()
            });
        }
        function createHammerInstance(options) {
            var element = document.createElement('div');
            var hammerInstance = new Hammer(element, options);
            spyOn(hammerInstance, 'trigger');
            return hammerInstance;
        }
        function simulateSwipeGestureMoves(hammerInstance, move1Props, move2Props) {
            var startEvent = createFakeEvent({
                eventType: Hammer.EVENT_START
            });
            var moveEvent1 = createFakeEvent(_.defaults(move1Props, {
                eventType: Hammer.EVENT_MOVE,
                timeStamp: 1
            }));
            var moveEvent2 = createFakeEvent(_.defaults(move2Props, {
                eventType: Hammer.EVENT_MOVE,
                timeStamp: 2
            }));
            CustomSwipeGesture.handler(startEvent, hammerInstance);
            CustomSwipeGesture.handler(moveEvent1, hammerInstance);
            CustomSwipeGesture.handler(moveEvent2, hammerInstance);
        }
        var endEvent;
        beforeEach(function() {
            endEvent = createFakeEvent({ eventType: Hammer.EVENT_END });
        });
        describe('when velocityX is greater than configured threshold', function() {
            var hammerInstance;
            beforeEach(function() {
                hammerInstance = createHammerInstance({ swipe_velocity: 1 });
                simulateSwipeGestureMoves(hammerInstance, { deltaX: 0 }, { deltaX: 2 });
                CustomSwipeGesture.handler(endEvent, hammerInstance);
            });
            it('should trigger a swipe event', function() {
                expect(hammerInstance.trigger).toHaveBeenCalledWith(CustomSwipeGesture.name, endEvent);
            });
            it('should trigger a directional swipe event', function() {
                expect(hammerInstance.trigger).toHaveBeenCalledWith(CustomSwipeGesture.name + endEvent.direction, endEvent);
            });
        });
        describe('when velocityY is greater than configured threshold', function() {
            var hammerInstance;
            beforeEach(function() {
                hammerInstance = createHammerInstance({ swipe_velocity: 1 });
                simulateSwipeGestureMoves(hammerInstance, { deltaY: 0 }, { deltaY: 2 });
                CustomSwipeGesture.handler(endEvent, hammerInstance);
            });
            it('should trigger a swipe event', function() {
                expect(hammerInstance.trigger).toHaveBeenCalledWith(CustomSwipeGesture.name, endEvent);
            });
            it('should trigger a directional swipe event', function() {
                expect(hammerInstance.trigger).toHaveBeenCalledWith(CustomSwipeGesture.name + endEvent.direction, endEvent);
            });
        });
        describe('setting event velocity', function() {
            var hammerInstance;
            var FRICTION = 2;
            beforeEach(function() {
                hammerInstance = createHammerInstance({ swipe_velocity: 1 });
            });
            it('should apply friction to velocityX', function() {
                simulateSwipeGestureMoves(hammerInstance, { deltaX: 0 }, { deltaX: 2 });
                CustomSwipeGesture.handler(endEvent, hammerInstance);
                expect(endEvent.velocityX).toBe(2 / FRICTION);
            });
            it('should apply friction to velocityY', function() {
                simulateSwipeGestureMoves(hammerInstance, { deltaY: 0 }, { deltaY: 2 });
                CustomSwipeGesture.handler(endEvent, hammerInstance);
                expect(endEvent.velocityY).toBe(2 / FRICTION);
            });
        });
        describe('setting event direction', function() {
            var hammerInstance;
            beforeEach(function() {
                hammerInstance = createHammerInstance({ swipe_velocity: 0 });
            });
            it('should set direction to "left" when swiping left', function() {
                simulateSwipeGestureMoves(hammerInstance, { deltaX: 0 }, { deltaX: -2 });
                CustomSwipeGesture.handler(endEvent, hammerInstance);
                expect(endEvent.direction).toBe(Hammer.DIRECTION_LEFT);
            });
            it('should set direction to "right" when swiping right', function() {
                simulateSwipeGestureMoves(hammerInstance, { deltaX: 0 }, { deltaX: 2 });
                CustomSwipeGesture.handler(endEvent, hammerInstance);
                expect(endEvent.direction).toBe(Hammer.DIRECTION_RIGHT);
            });
            it('should set direction to "up" when swiping up', function() {
                simulateSwipeGestureMoves(hammerInstance, { deltaY: 0 }, { deltaY: -2 });
                CustomSwipeGesture.handler(endEvent, hammerInstance);
                expect(endEvent.direction).toBe(Hammer.DIRECTION_UP);
            });
            it('should set direction to "down" when swiping down', function() {
                simulateSwipeGestureMoves(hammerInstance, { deltaY: 0 }, { deltaY: 2 });
                CustomSwipeGesture.handler(endEvent, hammerInstance);
                expect(endEvent.direction).toBe(Hammer.DIRECTION_DOWN);
            });
            it('should use the dimension with the larger delta when determining direction', function() {
                simulateSwipeGestureMoves(hammerInstance,
                    { deltaX: 0, deltaY: 0 },
                    { deltaX: 2, deltaY: 4 }
                );
                CustomSwipeGesture.handler(endEvent, hammerInstance);
                expect(endEvent.direction).toBe(Hammer.DIRECTION_DOWN);
            });
        });
        it('should not trigger swipe if max touches constraint fails', function() {
            var hammerInstance = createHammerInstance({
                swipe_max_touches: 1,
                swipe_velocity: 0
            });
            // Simulate a transform
            var transformEvent = createFakeEvent({
                eventType: Hammer.EVENT_MOVE,
                touches: ['faketouch', 'faketouch']
            });
            var endEvent = createFakeEvent({
                eventType: Hammer.EVENT_END,
                touches: ['faketouch']
            });
            simulateSwipeGestureMoves(hammerInstance, { deltaX: 0 }, { deltaX: 2 });
            CustomSwipeGesture.handler(transformEvent, hammerInstance);
            CustomSwipeGesture.handler(endEvent, hammerInstance);
            expect(hammerInstance.trigger).not.toHaveBeenCalled();
        });
        it('should not trigger swipe if velocityX and velocityY are below threshold', function() {
            var hammerInstance = createHammerInstance({
                swipe_velocity: 1
            });
            simulateSwipeGestureMoves(hammerInstance,
                { deltaX: 0, deltaY: 0, timeStamp: 0 },
                { deltaX: 2, deltaY: 3, timeStamp: 4 }
            );
            CustomSwipeGesture.handler(endEvent, hammerInstance);
            expect(hammerInstance.trigger).not.toHaveBeenCalled();
        });

        describe('installing', function() {
            function getCurrentSwipeGesture() {
                var gestures = Hammer.detection.gestures;
                var currentSwipeGesture;
                for (var i = 0, n = gestures.length; i < n; i++) {
                    if (gestures[i].name === CustomSwipeGesture.name) {
                        // Ensure we don't have two swipe gestures registered.
                        expect(currentSwipeGesture).toBeUndefined();
                        currentSwipeGesture = gestures[i];
                    }
                }
                return currentSwipeGesture;
            }
            it('should replace the default Hammer swipe gesture', function() {
                expect(getCurrentSwipeGesture()).not.toBe(CustomSwipeGesture);
                CustomSwipeGesture.register();
                expect(getCurrentSwipeGesture()).toBe(CustomSwipeGesture);
            });
        });
    });
});
