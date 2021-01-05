import { once } from 'ramda';

// FROM Backbone.js 1.4.0

// Backbone.Events
// ---------------

// A module that can be mixed in to *any object* in order to provide it with
// custom events. You may bind with `on` or remove with `off` callback
// functions to an event; `trigger`-ing an event fires all callbacks in
// succession.
//
//     var object = {};
//     Object.assign(object, Events);
//     object.on('expand', function(){ alert('expanded'); });
//     object.trigger('expand');
//

// Regular expression used to split event strings.
const eventSplitter = /\s+/;

// Iterates over the standard `event, callback` (as well as the fancy multiple
// space-separated events `"change blur", callback` and jQuery-style event
// maps `{event: callback}`).
const eventsApi = function(iteratee, events, name, callback, opts) {
  let i = 0;
  let names;
  if (name && typeof name === 'object') {
    // Handle event maps.
    if (callback !== undefined && 'context' in opts && opts.context === undefined) opts.context = callback;
    for (names = Object.keys(name); i < names.length ; i++) {
      events = eventsApi(iteratee, events, names[i], name[names[i]], opts);
    }
  } else if (name && eventSplitter.test(name)) {
    // Handle space-separated event names by delegating them individually.
    for (names = name.split(eventSplitter); i < names.length; i++) {
      events = iteratee(events, names[i], callback, opts);
    }
  } else {
    // Finally, standard events.
    events = iteratee(events, name, callback, opts);
  }
  return events;
};

// The reducing API that adds a callback to the `events` object.
const onApi = function(events, name, callback, options) {
  if (callback) {
    const handlers = events[name] || (events[name] = []);
    const { context, ctx } = options;

    handlers.push({
      callback,
      context,
      ctx: context || ctx,
    });
  }
  return events;
};

// The reducing API that removes a callback from the `events` object.
const offApi = function(events, name, callback, options) {
  if (!events) return;

  const { context } = options;

  const names = name ? [name] : Object.keys(events);
  for (let i = 0; i < names.length; i++) {
    name = names[i];
    const handlers = events[name];

    // Bail out if there are no events stored.
    if (!handlers) break;

    // Find any remaining events.
    const remaining = [];
    for (let j = 0; j < handlers.length; j++) {
      const handler = handlers[j];
      /* eslint-disable no-mixed-operators */
      if (
        callback && callback !== handler.callback &&
        callback !== handler.callback._callback ||
        context && context !== handler.context
      ) {
        remaining.push(handler);
      }
      /* eslint-enable no-mixed-operators */
    }

    // Replace events if there are any remaining.  Otherwise, clean up.
    if (remaining.length) {
      events[name] = remaining;
    } else {
      delete events[name];
    }
  }

  return events;
};

// Reduces the event callbacks into a map of `{event: onceWrapper}`.
// `offer` unbinds the `onceWrapper` after it has been called.
const onceMap = function(map, name, callback, offer) {
  if (callback) {
    const fn = map[name] = once(function() {
      offer(name, fn);
      callback.apply(this, arguments);
    });
    fn._callback = callback;
  }
  return map;
};

// A difficult-to-believe, but optimized internal dispatch function for
// triggering events. Tries to keep the usual cases speedy (most internal
// Backbone events have 3 arguments).
const triggerEvents = function(events, args) {
  let ev;
  let i = -1;
  const l = events.length;
  const a1 = args[0];
  const a2 = args[1];
  const a3 = args[2];
  switch (args.length) {
    case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
    case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
    case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
    case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
    default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args); return;
  }
};

// Handles triggering the appropriate event callbacks.
const triggerApi = function(objEvents, name, callback, args) {
  if (objEvents) {
    const events = objEvents[name];
    let allEvents = objEvents.all;
    if (events && allEvents) allEvents = allEvents.slice();
    if (events) triggerEvents(events, args);
    if (allEvents) triggerEvents(allEvents, [name].concat(args));
  }
  return objEvents;
};

export class EventEmitter {
  _events;

  // Bind an event to a `callback` function. Passing `"all"` will bind
  // the callback to all events fired.
  on(name, callback, context) {
    this._events = eventsApi(onApi, this._events || {}, name, callback, {
      context,
      ctx: this,
    });
    return this;
  }

  // Bind an event to only be triggered a single time. After the first time
  // the callback is invoked, its listener will be removed. If multiple events
  // are passed in using the space-separated syntax, the handler will fire
  // once for each event, not once for a combination of all events.
  once(name, callback, context) {
    // Map the event into a `{event: once}` object.
    const events = eventsApi(onceMap, {}, name, callback, this.off.bind(this));
    if (typeof name === 'string' && context == null) {
      callback = undefined;
    }
    return this.on(events, callback, context);
  }

  // Remove one or many callbacks. If `context` is null, removes all
  // callbacks with that function. If `callback` is null, removes all
  // callbacks for the event. If `name` is null, removes all bound
  // callbacks for all events.
  off(name, callback, context) {
    if (!this._events) return this;
    this._events = eventsApi(offApi, this._events, name, callback, {
      context,
    });

    return this;
  }

  // Trigger one or many events, firing all bound callbacks. Callbacks are
  // passed the same arguments as `trigger` is, apart from the event name
  // (unless you're listening on `"all"`, which will cause your callback to
  // receive the true name of the event as the first argument).
  trigger(name) {
    if (!this._events) return this;

    const length = Math.max(0, arguments.length - 1);
    const args = Array(length);
    for (let i = 0; i < length; i++) {
      args[i] = arguments[i + 1];
    }

    eventsApi(triggerApi, this._events, name, undefined, args);
    return this;
  }
}
