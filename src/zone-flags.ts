// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ZoneGlobalConfigurations = any;

/* eslint-disable no-underscore-dangle */
(window as ZoneGlobalConfigurations).__Zone_disable_customElements = true;
(window as ZoneGlobalConfigurations).__Zone_disable_canvas = true;
(window as ZoneGlobalConfigurations).__Zone_disable_geolocation = true;
(window as ZoneGlobalConfigurations).__Zone_disable_blocking = true;
(window as ZoneGlobalConfigurations).__Zone_disable_MutationObserver = true;
(window as ZoneGlobalConfigurations).__Zone_disable_FileReader = true;

type AllEventMap = (
  keyof HTMLElementEventMap |
  keyof WindowEventHandlersEventMap |
  keyof WebSocketEventMap |
  keyof XMLHttpRequestEventTargetEventMap
);

const disabledEvents: Array<AllEventMap> = [
  // Scroll
  'scroll',
  'wheel',

  // Mouse
  'dblclick',
  'mousedown',
  'mouseenter',
  'mouseleave',
  'mousemove',
  'mouseout',
  'mouseover',
  'mouseup',

  // Touch
  'touchstart',
  'touchend',
  'touchmove',
  'touchcancel',

  // Pointer
  'pointerover',
  'pointerenter',
  'pointerdown',
  'pointermove',
  'pointerup',
  'pointercancel',
  'pointerout',
  'pointerleave',
  'gotpointercapture',
  'lostpointercapture',

  // Drag
  'drag',
  'dragend',
  'dragenter',
  'dragleave',
  'dragover',
  'dragstart',
  'drop',

  // Animation
  'animationcancel',
  'animationend',
  'animationiteration',
  'animationstart',

  // Window
  'beforeunload',
  'unload',

  // Other
  'resize',
  'contextmenu',
];
const passiveEvents = disabledEvents.filter((event) => event !== 'pointerdown');

(window as ZoneGlobalConfigurations).__zone_symbol__PASSIVE_EVENTS = passiveEvents;
(window as ZoneGlobalConfigurations).__zone_symbol__UNPATCHED_EVENTS = disabledEvents;
