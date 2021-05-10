import { Pin } from "./pin";
import { PinType } from "./pin-type";

export const Pins: Record<PinType, Pin> = {
  [PinType.ViaFerrata]: {
    icon: 'via-ferrata',
    color: 'costa-del-sol',
    fillColor: '#556b2f',
    strokeColor: '#fff',
    textColor: '#fff',
    fontSize: '20px',
  },
  [PinType.ZipLine]: {
    icon: 'zip-line',
    color: 'red',
    fillColor: '#f00',
    strokeColor: '#fff',
    textColor: '#fff',
    fontSize: '20px',
  },
  [PinType.Beach]: {
    icon: 'beach',
    color: 'amber',
    fillColor: '#ffc400',
    strokeColor: '#fff',
    textColor: '#fff',
    fontSize: '26px',
  },
  [PinType.CampSite]: {
    icon: 'tent',
    color: 'atlantis',
    fillColor: '#9acd32',
    strokeColor: '#000',
    textColor: '#000',
    fontSize: '21px',
  },
  [PinType.ClimbingSite]: {
    icon: 'climbing',
    color: 'gray',
    fillColor: '#808080',
    strokeColor: '#fff',
    textColor: '#fff',
    fontSize: '20px',
  },
  [PinType.StargazingSite]: {
    icon: 'telescope',
    color: 'navy-blue',
    fillColor: '#000080',
    strokeColor: '#fff',
    textColor: '#fff',
    fontSize: '20px',
  },
  [PinType.SkiStation]: {
    icon: 'skiing',
    color: 'white',
    fillColor: '#fff',
    strokeColor: '#333',
    textColor: '#333',
    fontSize: '19px',
  },
  [PinType.HikingTrail]: {
    icon: 'hiking',
    color: 'copper-canyon',
    fillColor: '#8b4513',
    strokeColor: '#fff',
    textColor: '#fff',
    fontSize: '20px',
  },
  [PinType.Waterfall]: {
    icon: 'waterfall',
    color: 'cerulean',
    fillColor: '#00bfff',
    strokeColor: '#fff',
    textColor: '#fff',
    fontSize: '18px',
  },
  [PinType.Bridge]: {
    icon: 'bridge',
    color: 'web-orange',
    fillColor: '#ffa500',
    strokeColor: '#fff',
    textColor: '#fff',
    fontSize: '20px',
  },
  [PinType.Pond]: {
    icon: 'reeds',
    color: 'norway',
    fillColor: '#8fbc8f',
    strokeColor: '#fff',
    textColor: '#fff',
    fontSize: '20px',
  },
  [PinType.OrientationSite]: {
    icon: 'signs',
    color: 'persian-rose',
    fillColor: '#ff1493',
    strokeColor: '#fff',
    textColor: '#fff',
    fontSize: '22px',
  },
  [PinType.Mountain]: {
    icon: 'mountains',
    color: 'blaze-orange',
    fillColor: '#ff6600',
    strokeColor: '#fff',
    textColor: '#fff',
    fontSize: '19px',
  },
  [PinType.Museum]: {
    icon: 'museum',
    color: 'purple-heart',
    fillColor: '#8a2be2',
    strokeColor: '#fff',
    textColor: '#fff',
    fontSize: '20px',
  },
  [PinType.ScenicViewpoint]: {
    icon: 'viewing',
    color: 'hibiscus',
    fillColor: '#b03060',
    strokeColor: '#fff',
    textColor: '#fff',
    fontSize: '19px',
  },
  [PinType.Cave]: {
    icon: 'cave',
    color: 'black',
    fillColor: '#000',
    strokeColor: '#fff',
    textColor: '#fff',
    fontSize: '18px',
  },
  [PinType.Lake]: {
    icon: 'lake',
    color: 'blue',
    fillColor: '#0000ff',
    strokeColor: '#fff',
    textColor: '#fff',
    fontSize: '18px',
  },
  [PinType.Canyon]: {
    icon: 'canyon',
    color: 'whiskey',
    fillColor: '#cfa569',
    strokeColor: '#fff',
    textColor: '#fff',
    fontSize: '18px',
  },
  [PinType.RollerCoaster]: {
    icon: 'roller-coaster',
    color: 'crimson',
    fillColor: '#dc143c',
    strokeColor: '#fff',
    textColor: '#fff',
    fontSize: '20px',
  },
  [PinType.Park]: {
    icon: 'park',
    color: 'japanese-laurel',
    fillColor: '#009900',
    strokeColor: '#fff',
    textColor: '#fff',
    fontSize: '19px',
  },
  [PinType.Bowling]: {
    icon: 'bowling',
    color: 'khaki',
    fillColor: '#f0e68c',
    strokeColor: '#000',
    textColor: '#000',
    fontSize: '20px',
  },
  [PinType.Casino]: {
    icon: 'casino',
    color: 'lavender-magenta',
    fillColor: '#ee82ee',
    strokeColor: '#fff',
    textColor: '#fff',
    fontSize: '19px',
  },
  [PinType.ParaglidingTakeOff]: {
    icon: 'hang-gliding',
    color: 'yellow-sunshine',
    fillColor: '#ffee00',
    strokeColor: '#000',
    textColor: '#000',
    fontSize: '22px',
  },
  [PinType.Rink]: {
    icon: 'ice-skating',
    color: 'aquamarine',
    fillColor: '#55eeff',
    strokeColor: '#000',
    textColor: '#000',
    fontSize: '20px',
  },
  [PinType.BikePark]: {
    icon: 'bicycling',
    color: 'hot-toddy',
    fillColor: '#a67808',
    strokeColor: '#fff',
    textColor: '#fff',
    fontSize: '21px',
  },
  [PinType.Ferry]: {
    icon: 'ferry',
    color: 'bittersweet',
    fillColor: '#fa8072',
    strokeColor: '#fff',
    textColor: '#fff',
    fontSize: '20px',
  },
  [PinType.CrossCountrySkiTrail]: {
    icon: 'cross-country-skiing',
    color: 'alto',
    fillColor: '#d5d5d5',
    strokeColor: '#000',
    textColor: '#000',
    fontSize: '20px',
  },
  [PinType.NauticBase]: {
    icon: 'wind-surfing',
    color: 'oyster-bay',
    fillColor: '#d4fbff',
    strokeColor: '#000',
    textColor: '#000',
    fontSize: '20px',
  },
  [PinType.Cinema]: {
    icon: 'movie-theater',
    color: 'crusoe',
    fillColor: '#024700',
    strokeColor: '#fff',
    textColor: '#fff',
    fontSize: '17px',
  },
  [PinType.SwimmingPool]: {
    icon: 'swimming',
    color: 'teal',
    fillColor: '#008b8b',
    strokeColor: '#fff',
    textColor: '#fff',
    fontSize: '20px',
  },
  [PinType.Karting]: {
    icon: 'karting',
    color: 'cosmos',
    fillColor: '#ffdbdb',
    strokeColor: '#000',
    textColor: '#000',
    fontSize: '22px',
  },
};
