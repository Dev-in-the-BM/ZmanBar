import * as _Luxon from 'luxon';
import { JsonOutput } from './util/ZmanimFormatter';
export declare function getZmanimJson(options: Options): JsonOutput;
export interface Options {
    /**
     * @default The current local date. The time is ignored.
     */
    date?: Date | string | number | _Luxon.DateTime;
    /**
     * IANA timezone ID
     */
    timeZoneId: string;
    locationName?: string;
    latitude: number;
    longitude: number;
    /**
     * @default 0
     */
    elevation?: number;
    /**
     * Whether to use `ComplexZmanimCalendar` instead of `ZmanimCalendar`
     * @default false
     */
    complexZmanim?: boolean;
}
export * from './util/Time';
export * from './util/GeoLocation';
export * from './util/GeoLocationUtils';
export * from './util/Zman';
export * from './polyfills/Utils';
export * from './util/NOAACalculator';
export * from './util/SunTimesCalculator';
export * from './AstronomicalCalendar';
export * from './ZmanimCalendar';
export * from './ComplexZmanimCalendar';
export * from './hebrewcalendar/JewishDate';
export * from './hebrewcalendar/JewishCalendar';
export * from './hebrewcalendar/Daf';
export * from './hebrewcalendar/YomiCalculator';
export * from './hebrewcalendar/YerushalmiYomiCalculator';
export * from './hebrewcalendar/HebrewDateFormatter';
export * from './util/ZmanimFormatter';
export declare const Luxon: typeof _Luxon;
export declare const DateTime: typeof _Luxon.DateTime;
