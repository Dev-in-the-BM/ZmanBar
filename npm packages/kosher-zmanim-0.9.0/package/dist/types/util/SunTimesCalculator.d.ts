import { DateTime } from 'luxon';
import { GeoLocation } from './GeoLocation';
import { AstronomicalCalculator } from './AstronomicalCalculator';
/**
 * Implementation of sunrise and sunset methods to calculate astronomical times. This calculator uses the Java algorithm
 * written by <a href="https://web.archive.org/web/20090531215353/http://www.kevinboone.com/suntimes.html">Kevin
 * Boone</a> that is based on the <a href = "https://aa.usno.navy.mil/">US Naval Observatory's</a><a
 * href="https://aa.usno.navy.mil/publications/asa">Astronomical Almanac</a> and used with his permission. Added to Kevin's
 * code is adjustment of the zenith to account for elevation. This algorithm returns the same time every year and does not
 * account for leap years. It is not as accurate as the Jean Meeus based {@link NOAACalculator} that is the default calculator
 * use by the KosherJava <em>zmanim</em> library.
 *
 * @author &copy; Eliyahu Hershfeld 2004 - 2023
 * @author &copy; Kevin Boone 2000
 */
export declare class SunTimesCalculator extends AstronomicalCalculator {
    /**
     * Default constructor of the SunTimesCalculator.
     */
    constructor();
    /**
     * @see AstronomicalCalculator#getCalculatorName()
     */
    getCalculatorName(): string;
    /**
     * @see AstronomicalCalculator#getUTCSunrise(Calendar, GeoLocation, double, boolean)
     */
    getUTCSunrise(date: DateTime, geoLocation: GeoLocation, zenith: number, adjustForElevation: boolean): number;
    /**
     * @see AstronomicalCalculator#getUTCSunset(Calendar, GeoLocation, double, boolean)
     */
    getUTCSunset(date: DateTime, geoLocation: GeoLocation, zenith: number, adjustForElevation: boolean): number;
    /**
     * The number of degrees of longitude that corresponds to one hour of time difference.
     */
    private static readonly DEG_PER_HOUR;
    /**
     * The sine in degrees.
     * @param deg the degrees
     * @return sin of the angle in degrees
     */
    private static sinDeg;
    /**
     * Return the arc cosine in degrees.
     * @param x angle
     * @return acos of the angle in degrees
     */
    private static acosDeg;
    /**
     * Return the arc sine in degrees.
     * @param x angle
     * @return asin of the angle in degrees
     */
    private static asinDeg;
    /**
     * Return the tangent in degrees.
     * @param deg degrees
     * @return tan of the angle in degrees
     */
    private static tanDeg;
    /**
     * Calculate cosine of the angle in degrees
     *
     * @param deg degrees
     * @return cosine of the angle in degrees
     */
    private static cosDeg;
    /**
     * Get time difference between location's longitude and the Meridian, in hours.
     *
     * @param longitude the longitude
     * @return time difference between the location's longitude and the Meridian, in hours. West of Meridian has a negative time difference
     */
    private static getHoursFromMeridian;
    /**
     * Calculate the approximate time of sunset or sunrise in days since midnight Jan 1st, assuming 6am and 6pm events. We
     * need this figure to derive the Sun's mean anomaly.
     *
     * @param dayOfYear the day of year
     * @param hoursFromMeridian hours from the meridian
     * @param isSunrise true for sunrise and false for sunset
     *
     * @return the approximate time of sunset or sunrise in days since midnight Jan 1st, assuming 6am and 6pm events. We
     * need this figure to derive the Sun's mean anomaly.
     */
    private static getApproxTimeDays;
    /**
     * Calculate the Sun's mean anomaly in degrees, at sunrise or sunset, given the longitude in degrees
     *
     * @param dayOfYear the day of the year
     * @param longitude longitude
     * @param isSunrise true for sunrise and false for sunset
     * @return the Sun's mean anomaly in degrees
     */
    private static getMeanAnomaly;
    /**
     * Returns the Sun's true longitude in degrees.
     * @param sunMeanAnomaly the Sun's mean anomaly in degrees
     * @return the Sun's true longitude in degrees. The result is an angle &gt;= 0 and &lt;= 360.
     */
    private static getSunTrueLongitude;
    /**
     * Calculates the Sun's right ascension in hours.
     * @param sunTrueLongitude the Sun's true longitude in degrees &gt; 0 and &lt; 360.
     * @return the Sun's right ascension in hours in angles &gt; 0 and &lt; 360.
     */
    private static getSunRightAscensionHours;
    /**
     * Calculate the cosine of the Sun's local hour angle
     *
     * @param sunTrueLongitude the sun's true longitude
     * @param latitude the latitude
     * @param zenith the zenith
     * @return the cosine of the Sun's local hour angle
     */
    private static getCosLocalHourAngle;
    /**
     * Calculate local mean time of rising or setting. By `local' is meant the exact time at the location, assuming that
     * there were no time zone. That is, the time difference between the location and the Meridian depended entirely on
     * the longitude. We can't do anything with this time directly; we must convert it to UTC and then to a local time.
     * The result is expressed as a fractional number of hours since midnight
     *
     * @param localHour the local hour
     * @param sunRightAscensionHours the sun's right ascension in hours
     * @param approxTimeDays approximate time days
     *
     * @return the fractional number of hours since midnight as a double
     */
    private static getLocalMeanTime;
    /**
     * Get sunrise or sunset time in UTC, according to flag. This time is returned as
     * a double and is not adjusted for time-zone.
     *
     * @param calendar
     *            the Calendar object to extract the day of year for calculation
     * @param geoLocation
     *            the GeoLocation object that contains the latitude and longitude
     * @param zenith
     *            Sun's zenith, in degrees
     * @param isSunrise
     *            True for sunrise and false for sunset.
     * @return the time as a double. If an error was encountered in the calculation
     *         (expected behavior for some locations such as near the poles,
     *         {@link Double#NaN} will be returned.
     */
    private static getTimeUTC;
    /**
     * Return the <a href="https://en.wikipedia.org/wiki/Universal_Coordinated_Time">Universal Coordinated Time</a> (UTC)
     * of <a href="https://en.wikipedia.org/wiki/Noon#Solar_noon">solar noon</a> for the given day at the given location
     * on earth. This implementation returns solar noon as the time halfway between sunrise and sunset.
     * {@link NOAACalculator}, the default calculator, returns true solar noon. See <a href=
     * "https://kosherjava.com/2020/07/02/definition-of-chatzos/">The Definition of Chatzos</a> for details on solar
     * noon calculations.
     * @see com.kosherjava.zmanim.util.AstronomicalCalculator#getUTCNoon(Calendar, GeoLocation)
     * @see NOAACalculator
     *
     * @param date
     *            The Calendar representing the date to calculate solar noon for
     * @param geoLocation
     *            The location information used for astronomical calculating sun times.
     * @return the time in minutes from zero UTC. If an error was encountered in the calculation (expected behavior for
     *         some locations such as near the poles, {@link Double#NaN} will be returned.
     */
    getUTCNoon(date: DateTime, geoLocation: GeoLocation): number;
    /**
     * Return the <a href="https://en.wikipedia.org/wiki/Universal_Coordinated_Time">Universal Coordinated Time</a> (UTC)
     * of midnight for the given day at the given location on earth. This implementation returns solar midnight as 12 hours
     * after utc noon that is  halfway between sunrise and sunset.
     * {@link NOAACalculator}, the default calculator, returns true solar noon. See <a href=
     * "https://kosherjava.com/2020/07/02/definition-of-chatzos/">The Definition of Chatzos</a> for details on solar
     * noon calculations.
     * @see com.kosherjava.zmanim.util.AstronomicalCalculator#getUTCNoon(Calendar, GeoLocation)
     * @see NOAACalculator
     *
     * @param calendar
     *            The Calendar representing the date to calculate solar noon for
     * @param geoLocation
     *            The location information used for astronomical calculating sun times.
     * @return the time in minutes from zero UTC. If an error was encountered in the calculation (expected behavior for
     *         some locations such as near the poles, {@link Double#NaN} will be returned.
     */
    getUTCMidnight(date: DateTime, geoLocation: GeoLocation): number;
}
