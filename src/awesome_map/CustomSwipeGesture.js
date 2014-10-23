define(function(require) {
    'use strict';

    var Hammer = require('hammerjs');

    var STACK_EVALUATION_DEPTH = 2;
    var FRICTION = 2;
    var moveStack = [];

    function getDirection() {
        var end = moveStack[0];
        var start = moveStack[moveStack.length - 1];
        var deltaX = Math.abs(end.deltaX - start.deltaX);
        var deltaY = Math.abs(end.deltaY - start.deltaY);
        if (deltaX >= deltaY) {
            return start.deltaX > end.deltaX ? Hammer.DIRECTION_LEFT : Hammer.DIRECTION_RIGHT;
        }
        return start.deltaY > end.deltaY ? Hammer.DIRECTION_UP : Hammer.DIRECTION_DOWN;
    }

    function getVelocity(axis) {
        var deltaProp = axis === 'x' ? 'deltaX' : 'deltaY';
        var end = moveStack[0];
        var start = moveStack[moveStack.length - 1];
        var deltaDistance = end[deltaProp] - start[deltaProp];
        var deltaTime = end.timeStamp - start.timeStamp;
        return Math.abs(deltaDistance / deltaTime / FRICTION);
    }

    // Default hammerjs Swipe gesture is here:
    // https://github.com/hammerjs/hammer.js/blob/1.1.x/src/gestures/swipe.js
    var CustomSwipeGesture = {
        name: 'swipe',
        index: 40,
        defaults: {
            // set 0 for unlimited, but this can conflict with transform
            swipe_max_touches  : 1,
            swipe_velocity     : 0.7
        },
        handler: function swipeGesture(ev, inst) {
            if (ev.eventType === Hammer.EVENT_START) {
                moveStack = [ev, ev];
            }
            else if (ev.eventType === Hammer.EVENT_MOVE) {
                moveStack.unshift(ev);
            }
            else if (ev.eventType === Hammer.EVENT_END) {
                // max touches
                if (inst.options.swipe_max_touches > 0 &&
                    ev.touches.length > inst.options.swipe_max_touches) {
                    return;
                }

                // Calculate the velocity and direction using the last N moves
                // in an attempt to provide for a more "instantaneous" velocity.
                // By default, hammer calcs velocity and direction over the
                // entire interaction, from start to end.
                moveStack.splice(STACK_EVALUATION_DEPTH);
                ev.velocityX = getVelocity('x');
                ev.velocityY = getVelocity('y');
                ev.direction = getDirection();

                // when the distance we moved is too small we skip this gesture
                // or we can be already in dragging
                if (ev.velocityX > inst.options.swipe_velocity ||
                    ev.velocityY > inst.options.swipe_velocity
                ) {
                    // trigger swipe events
                    inst.trigger(this.name, ev);
                    inst.trigger(this.name + ev.direction, ev);
                }
            }
        }
    };

    return CustomSwipeGesture;
});
