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

part of wUIComponents;

/// A TransformState encapsulates the information needed to apply a
/// [Transformation] to an HTML element.
class TransformState {
    /// The animation duration, in ms.
    num duration;

    /// The easing function to use during animations.
    EasingFunction easing;

    /// The scale.
    num scale;

    /// The translation along the x-axis.
    num translateX;

    /// The translation along the y-axis.
    num translateY;

    TransformState({
        duration: 0,
        easing: null,
        scale: 1,
        translateX: 0,
        translateY: 0
    }) {
        if (easing == null) {
            easing = new EaseOutQuart();
        }
    }

    /// Gets the target TransformState for the event.
    /// Returns a target state if the event has a default handler;
    /// otherwise it returns the current transform state.
    TransformState.fromEvent(InteractionEvent event, TransformState currentState) {
        TransformState(
            duration: gesture.duration,
            easing: currentState.easing,
            scale: currentState.scale,
            translateX: currentState.translateX,
            translateY: currentState.translateY
        );
        Point<num> position = event.position == null
            ? new Point<num>(0, 0)
            : event.position;
        Gesture gesture = event.iterativeGesture;

        // Handle events that need to defer the calculation of deltas.
        if (event.simulated && event.targetState != null) {
            TransformState targetState = event.targetState;
            if (targetState.translateX != null) {
                gesture.deltaX = targetState.translateX - translateX;
            }
            if (targetState.translateY != null) {
                gesture.deltaY = targetState.translateY - translateY;
            }
            if (targetState.scale != null) {
                gesture.scale = targetState.scale / scale;
            }
        }

        switch (event.type) {
            case EventTypes.drag:
            case EventTypes.dragEnd:
            case EventTypes.dragStart:
            case EventTypes.mouseWheel:
                panBy(gesture.deltaX, gesture.deltaY);
                break;
            case EventTypes.transform:
                zoomBy(gesture.scale, gesture.deltaX, gesture.deltaY, position.x, position.y);
                break;
            case EventTypes.transformEnd:
            case EventTypes.transformStart:
                // No translation on start or end because the gesture deltas can be huge
                // due to the addition and release of fingers.
                // For example: 1 finger at (100, 100) then a 2nd finger at (200, 200)
                // will yield a delta of (50, 50) representing the change from the position
                // of the first finger to the center point between two fingers.
                zoomBy(gesture.scale, 0, 0, position.x, position.y);
                break;
            default:
                break;
        }
    }

    /// Creates a copy of the transformation state
    TransformState clone() {
        return new TransformState(duration: duration, easing: easing,
            scale: scale, translateX: translateX, translateY: translateY);
    }

    /// Checks whether this state is equal to the other state.
    /// NOTE: This used to be called `equals` before the dart port.
    bool stateEquals(TransformState other) {
        return other.scale == scale &&
            other.translateX == translateX &&
            other.translateY == translateY;
    }

    /// Modify the state by simulating a pan.
    void panBy(num deltaX, num deltaY) {
        translateX = (translateX + deltaX).round();
        translateY = (translateY + deltaY).round();
    }

    /// Modify the state by simulating a zoom.
    /// [scale] - The relative scale to zoom by.
    /// [deltaX] - The position change along the x-axis.
    /// [deltaY] - The position change along the y-axis.
    /// [positionX] - The x-axis position of the interaction.
    /// [positionY] - The y-axis position of the interaction.
    void zoomBy(num scale, num deltaX, num deltaY, Point<num> position) {
        num currentScale = this.scale;
        num newScale;

        // Simulate an origin in order to calculate the final translation.
        num translateX = this.translateX;
        num translateY = this.translateY;
        num originX = (position.x - translateX) / currentScale;
        num originY = (position.y - translateY) / currentScale;

        // Offset the current translation by the simulated origin.
        translateX += originX * (currentScale - 1);
        translateY += originY * (currentScale - 1);

        // Update the scale and translation from the gesture.
        newScale = currentScale * scale;
        translateX += deltaX;
        translateY += deltaY;

        // Adjust translation before removing simulated origin.
        translateX -= originX * (newScale - 1);
        translateY -= originY * (newScale - 1);

        // Assign the new values.
        this.scale = newScale;
        this.translateX = translateX.round();
        this.translateY = translateY.round();
    }
}
