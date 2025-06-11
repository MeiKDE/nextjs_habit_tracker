// Utility to make event listeners passive by default
// This fixes the Chrome warning about non-passive wheel event listeners

if (typeof window !== "undefined") {
  // Store original addEventListener
  const originalAddEventListener = EventTarget.prototype.addEventListener;

  // Override addEventListener to make scroll-blocking events passive by default
  EventTarget.prototype.addEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) {
    // List of events that should be passive by default
    const passiveEvents = ["wheel", "mousewheel", "touchstart", "touchmove"];

    if (passiveEvents.includes(type)) {
      if (typeof options === "boolean") {
        options = { passive: true, capture: options };
      } else if (typeof options === "object") {
        options = { passive: true, ...options };
      } else {
        options = { passive: true };
      }
    }

    return originalAddEventListener.call(this, type, listener, options);
  };
}
