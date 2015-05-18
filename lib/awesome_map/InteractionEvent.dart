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


/// Creates an InteractionEvent from the given type and gestures.
///
/// An InteractionEvent represents the events synthesized by an
/// [EventSynthesizer] or simulated by an [InteractionSimulator].
///
/// For example:
///
///     // Create an InteractionEvent from a captured gesture.
///     Gesture cumulativeGesture = new Gesture(...);
///     Gesture iterativeGesture = lastGesture.createIterativeGesture(
///         cumulativeGesture);
///
///     Gesture interactionEvent = new InteractionEvent(
///         EventTypes.drag, cumulativeGesture, iterativeGesture);
class InteractionEvent {

    /// Whether the event has been cancelled by an observer.
    bool cancelled = false;

    /// The cumulative state of the interaction when the event was triggered.
    /// This should reflect the change in state from the initial touch gesture.
    Gesture cumulativeGesture;

    /// The incremental state of the gesture that triggered this event.
    /// This should reflect the change in state from the previous gesture.
    Gesture iterativeGesture;

    /// The center point of the gesture relative to the target element.
    Point<num> position;

    /// Flag to mark simulated events and distinguish from gesture-based events.
    bool simulated = false;

    /// The Event that serves as the source of this instance.
    /// TODO: I'm not sure what type of object this is yet.
    dynamic source;

    /// The target element of the event.
    HtmlElement target;

    /// The target transform state for this event. This is used when simulated
    /// events need to finish at a specific state and therefore must wait to
    /// calculate gesture deltas until the moment when the event is processed.
    /// If this is not done, deltas might be calculated from a current
    /// transform state that is modified by the time this event is processed.
    TransformState targetState = null;

    /// The event type.
    EventTypes type;

    InteractionEvent(this.type, this.cumulativeGesture, this.iterativeGesture) {
        position = iterativeGesture.getPosition();
        source = cumulativeGesture.source;
        target = cumulativeGesture.target;
    }

}
