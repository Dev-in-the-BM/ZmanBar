"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateTime = exports.Luxon = exports.getZmanimJson = void 0;
const _Luxon = require("luxon");
const GeoLocation_1 = require("./util/GeoLocation");
const ZmanimCalendar_1 = require("./ZmanimCalendar");
const ComplexZmanimCalendar_1 = require("./ComplexZmanimCalendar");
const ZmanimFormatter_1 = require("./util/ZmanimFormatter");
function getZmanimJson(options) {
    const geoLocation = new GeoLocation_1.GeoLocation(options.locationName || null, options.latitude, options.longitude, options.elevation || 0, options.timeZoneId);
    const zmanimCalendar = options.complexZmanim
        ? new ComplexZmanimCalendar_1.ComplexZmanimCalendar(geoLocation)
        : new ZmanimCalendar_1.ZmanimCalendar(geoLocation);
    zmanimCalendar.setDate(options.date || _Luxon.DateTime.local());
    return ZmanimFormatter_1.ZmanimFormatter.toJSON(zmanimCalendar);
}
exports.getZmanimJson = getZmanimJson;
__exportStar(require("./util/Time"), exports);
__exportStar(require("./util/GeoLocation"), exports);
__exportStar(require("./util/GeoLocationUtils"), exports);
__exportStar(require("./util/Zman"), exports);
__exportStar(require("./polyfills/Utils"), exports);
__exportStar(require("./util/NOAACalculator"), exports);
__exportStar(require("./util/SunTimesCalculator"), exports);
__exportStar(require("./AstronomicalCalendar"), exports);
__exportStar(require("./ZmanimCalendar"), exports);
__exportStar(require("./ComplexZmanimCalendar"), exports);
__exportStar(require("./hebrewcalendar/JewishDate"), exports);
__exportStar(require("./hebrewcalendar/JewishCalendar"), exports);
__exportStar(require("./hebrewcalendar/Daf"), exports);
__exportStar(require("./hebrewcalendar/YomiCalculator"), exports);
__exportStar(require("./hebrewcalendar/YerushalmiYomiCalculator"), exports);
__exportStar(require("./hebrewcalendar/HebrewDateFormatter"), exports);
__exportStar(require("./util/ZmanimFormatter"), exports);
exports.Luxon = _Luxon;
// Exported explicitly as a convenience.
exports.DateTime = _Luxon.DateTime;
//# sourceMappingURL=kosher-zmanim.js.map