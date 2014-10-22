define(function(require) {
    'use strict';

    CustomSwipeGesture = {
        name: 'swipe',
        index: 40,
        defaults: {
            // set 0 for unlimited, but this can conflict with transform
            swipe_max_touches  : 1,
            swipe_velocity     : 0.7
        },
        handler: function swipeGesture(ev, inst) {

            if(ev.eventType == Hammer.EVENT_END) {
                // max touches
                if(inst.options.swipe_max_touches > 0 &&
                    ev.touches.length > inst.options.swipe_max_touches) {
                    return;
                }

                // when the distance we moved is too small we skip this gesture
                // or we can be already in dragging
                if(ev.velocityX > inst.options.swipe_velocity ||
                    ev.velocityY > inst.options.swipe_velocity) {
                    // trigger swipe events
                    inst.trigger(this.name, ev);
                    inst.trigger(this.name + ev.direction, ev);
                }
            }
        }
    };

    return CustomSwipeGesture;
});
