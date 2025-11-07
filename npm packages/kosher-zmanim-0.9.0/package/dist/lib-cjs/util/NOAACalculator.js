"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOAACalculator = void 0;
const AstronomicalCalculator_1 = require("./AstronomicalCalculator");
const Utils_1 = require("../polyfills/Utils");
/**
 * Implementation of sunrise and sunset methods to calculate astronomical times based on the <a
 * href="https://noaa.gov">NOAA</a> algorithm. This calculator uses the Java algorithm based on the implementation by <a
 * href="https://noaa.gov">NOAA - National Oceanic and Atmospheric Administration</a>'s <a href =
 * "https://www.srrb.noaa.gov/highlights/sunrise/sunrise.html">Surface Radiation Research Branch</a>. NOAA's <a
 * href="https://www.srrb.noaa.gov/highlights/sunrise/solareqns.PDF">implementation</a> is based on equations from <a
 * href="https://www.willbell.com/math/mc1.htm">Astronomical Algorithms</a> by <a
 * href="https://en.wikipedia.org/wiki/Jean_Meeus">Jean Meeus</a>. Added to the algorithm is an adjustment of the zenith
 * to account for elevation. The algorithm can be found in the <a
 * href="https://en.wikipedia.org/wiki/Sunrise_equation">Wikipedia Sunrise Equation</a> article.
 *
 * @author &copy; Eliyahu Hershfeld 2011 - 2019
 */
class NOAACalculator extends AstronomicalCalculator_1.AstronomicalCalculator {
    /**
     * Default constructor of the NOAACalculator.
     */
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor() {
        super();
    }
    /**
     * @see AstronomicalCalculator#getCalculatorName()
     */
    // eslint-disable-next-line class-methods-use-this
    getCalculatorName() {
        return 'US National Oceanic and Atmospheric Administration Algorithm'; // Implementation of the Jean Meeus algorithm
    }
    /**
     * @see AstronomicalCalculator#getUTCSunrise(Calendar, GeoLocation, double, boolean)
     */
    getUTCSunrise(date, geoLocation, zenith, adjustForElevation) {
        const elevation = adjustForElevation ? geoLocation.getElevation() : 0;
        const adjustedZenith = this.adjustZenith(zenith, elevation);
        let sunrise = NOAACalculator.getSunRiseSetUTC(date, geoLocation.getLatitude(), -geoLocation.getLongitude(), adjustedZenith, NOAACalculator.SolarEvent.SUNRISE);
        sunrise = sunrise / 60;
        return sunrise > 0 ? sunrise % 24 : (sunrise % 24) + 24; // ensure that the time is >= 0 and < 24
    }
    /**
     * @see AstronomicalCalculator#getUTCSunset(Calendar, GeoLocation, double, boolean)
     */
    getUTCSunset(date, geoLocation, zenith, adjustForElevation) {
        const elevation = adjustForElevation ? geoLocation.getElevation() : 0;
        const adjustedZenith = this.adjustZenith(zenith, elevation);
        let sunset = NOAACalculator.getSunRiseSetUTC(date, geoLocation.getLatitude(), -geoLocation.getLongitude(), adjustedZenith, NOAACalculator.SolarEvent.SUNSET);
        sunset = sunset / 60;
        return sunset > 0 ? sunset % 24 : (sunset % 24) + 24; // ensure that the time is >= 0 and < 24
    }
    /**
     * Return the <a href="https://en.wikipedia.org/wiki/Julian_day">Julian day</a> from a Java Calendar.
     *
     * @param calendar
     *            The Java Calendar
     * @return the Julian day corresponding to the date Note: Number is returned for start of day. Fractional days
     *         should be added later.
     */
    static getJulianDay(date) {
        let { year, month } = date;
        const { day } = date;
        if (month <= 2) {
            year -= 1;
            month += 12;
        }
        const a = Math.trunc(year / 100);
        const b = Math.trunc(2 - a + a / 4);
        return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
    }
    /**
     * Convert <a href="https://en.wikipedia.org/wiki/Julian_day">Julian day</a> to centuries since <a href=
     * "https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     *
     * @param julianDay
     *            the Julian Day to convert
     * @return the centuries since 2000 Julian corresponding to the Julian Day
     */
    static getJulianCenturiesFromJulianDay(julianDay) {
        return (julianDay - NOAACalculator.JULIAN_DAY_JAN_1_2000) / NOAACalculator.JULIAN_DAYS_PER_CENTURY;
    }
    /**
     * Returns the Geometric <a href="https://en.wikipedia.org/wiki/Mean_longitude">Mean Longitude</a> of the Sun.
     *
     * @param julianCenturies
     *            the number of Julian centuries since <a href=
     *            "https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     * @return the Geometric Mean Longitude of the Sun in degrees
     */
    static getSunGeometricMeanLongitude(julianCenturies) {
        const longitude = 280.46646 + julianCenturies * (36000.76983 + 0.0003032 * julianCenturies);
        return longitude > 0 ? longitude % 360 : (longitude % 360) + 360; // ensure that the longitude is >= 0 and < 360
    }
    /**
     * Returns the Geometric <a href="https://en.wikipedia.org/wiki/Mean_anomaly">Mean Anomaly</a> of the Sun.
     *
     * @param julianCenturies
     *            the number of Julian centuries since <a href=
     *            "https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     * @return the Geometric Mean Anomaly of the Sun in degrees
     */
    static getSunGeometricMeanAnomaly(julianCenturies) {
        return 357.52911 + julianCenturies * (35999.05029 - 0.0001537 * julianCenturies);
    }
    /**
     * Return the unitless <a href="https://en.wikipedia.org/wiki/Eccentricity_%28orbit%29">eccentricity of earth's orbit</a>.
     *
     * @param julianCenturies
     *            the number of Julian centuries since <a href=
     *            "https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     * @return the unitless eccentricity
     */
    static getEarthOrbitEccentricity(julianCenturies) {
        return 0.016708634 - julianCenturies * (0.000042037 + 0.0000001267 * julianCenturies);
    }
    /**
     * Returns the <a href="https://en.wikipedia.org/wiki/Equation_of_the_center">equation of center</a> for the sun in degrees.
     *
     * @param julianCenturies
     *            the number of Julian centuries since <a href=
     *            "https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     * @return the equation of center for the sun in degrees
     */
    static getSunEquationOfCenter(julianCenturies) {
        const m = NOAACalculator.getSunGeometricMeanAnomaly(julianCenturies);
        const mrad = Utils_1.MathUtils.degreesToRadians(m);
        const sinm = Math.sin(mrad);
        const sin2m = Math.sin(mrad + mrad);
        const sin3m = Math.sin(mrad + mrad + mrad);
        return sinm * (1.914602 - julianCenturies * (0.004817 + 0.000014 * julianCenturies)) + sin2m
            * (0.019993 - 0.000101 * julianCenturies) + sin3m * 0.000289;
    }
    /**
     * Return the <a href="https://en.wikipedia.org/wiki/True_longitude">true longitude</a> of the sun.
     *
     * @param julianCenturies
     *            the number of Julian centuries since <a href=
     *            "https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     * @return the sun's true longitude in degrees
     */
    static getSunTrueLongitude(julianCenturies) {
        const sunLongitude = NOAACalculator.getSunGeometricMeanLongitude(julianCenturies);
        const center = NOAACalculator.getSunEquationOfCenter(julianCenturies);
        return sunLongitude + center;
    }
    // /**
    // * Returns the <a href="https://en.wikipedia.org/wiki/True_anomaly">true anamoly</a> of the sun.
    // *
    // * @param julianCenturies
    // * the number of Julian centuries since J2000.0
    // * @return the sun's true anamoly in degrees
    // */
    // private static double getSunTrueAnomaly(double julianCenturies) {
    // double meanAnomaly = getSunGeometricMeanAnomaly(julianCenturies);
    // double equationOfCenter = getSunEquationOfCenter(julianCenturies);
    //
    // return meanAnomaly + equationOfCenter;
    // }
    /**
     * Return the <a href="https://en.wikipedia.org/wiki/Apparent_longitude">apparent longitude</a> of the sun.
     *
     * @param julianCenturies
     *            the number of Julian centuries since <a href=
     *            "https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     * @return sun's apparent longitude in degrees
     */
    static getSunApparentLongitude(julianCenturies) {
        const sunTrueLongitude = NOAACalculator.getSunTrueLongitude(julianCenturies);
        const omega = 125.04 - 1934.136 * julianCenturies;
        const lambda = sunTrueLongitude - 0.00569 - 0.00478 * Math.sin(Utils_1.MathUtils.degreesToRadians(omega));
        return lambda;
    }
    /**
     * Returns the mean <a href="https://en.wikipedia.org/wiki/Axial_tilt">obliquity of the ecliptic</a> (Axial tilt).
     *
     * @param julianCenturies
     *            the number of Julian centuries since <a href=
     *            "https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     * @return the mean obliquity in degrees
     */
    static getMeanObliquityOfEcliptic(julianCenturies) {
        const seconds = 21.448 - julianCenturies
            * (46.8150 + julianCenturies * (0.00059 - julianCenturies * (0.001813)));
        return 23 + (26 + (seconds / 60)) / 60;
    }
    /**
     * Returns the corrected <a href="https://en.wikipedia.org/wiki/Axial_tilt">obliquity of the ecliptic</a> (Axial
     * tilt).
     *
     * @param julianCenturies
     *            the number of Julian centuries since <a href=
     *            "https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     * @return the corrected obliquity in degrees
     */
    static getObliquityCorrection(julianCenturies) {
        const obliquityOfEcliptic = NOAACalculator.getMeanObliquityOfEcliptic(julianCenturies);
        const omega = 125.04 - 1934.136 * julianCenturies;
        return obliquityOfEcliptic + 0.00256 * Math.cos(Utils_1.MathUtils.degreesToRadians(omega));
    }
    /**
     * Return the <a href="https://en.wikipedia.org/wiki/Declination">declination</a> of the sun.
     *
     * @param julianCenturies
     *            the number of Julian centuries since <a href=
     *            "https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     * @return
     *            the sun's declination in degrees
     */
    static getSunDeclination(julianCenturies) {
        const obliquityCorrection = NOAACalculator.getObliquityCorrection(julianCenturies);
        const lambda = NOAACalculator.getSunApparentLongitude(julianCenturies);
        const sint = Math.sin(Utils_1.MathUtils.degreesToRadians(obliquityCorrection)) * Math.sin(Utils_1.MathUtils.degreesToRadians(lambda));
        const theta = Utils_1.MathUtils.radiansToDegrees(Math.asin(sint));
        return theta;
    }
    /**
     * Return the <a href="https://en.wikipedia.org/wiki/Equation_of_time">Equation of Time</a> - the difference between
     * true solar time and mean solar time
     *
     * @param julianCenturies
     *            the number of Julian centuries since <a href=
     *            "https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     * @return equation of time in minutes of time
     */
    static getEquationOfTime(julianCenturies) {
        const epsilon = NOAACalculator.getObliquityCorrection(julianCenturies);
        const geomMeanLongSun = NOAACalculator.getSunGeometricMeanLongitude(julianCenturies);
        const eccentricityEarthOrbit = NOAACalculator.getEarthOrbitEccentricity(julianCenturies);
        const geomMeanAnomalySun = NOAACalculator.getSunGeometricMeanAnomaly(julianCenturies);
        let y = Math.tan(Utils_1.MathUtils.degreesToRadians(epsilon) / 2);
        y *= y;
        const sin2l0 = Math.sin(2 * Utils_1.MathUtils.degreesToRadians(geomMeanLongSun));
        const sinm = Math.sin(Utils_1.MathUtils.degreesToRadians(geomMeanAnomalySun));
        const cos2l0 = Math.cos(2 * Utils_1.MathUtils.degreesToRadians(geomMeanLongSun));
        const sin4l0 = Math.sin(4 * Utils_1.MathUtils.degreesToRadians(geomMeanLongSun));
        const sin2m = Math.sin(2 * Utils_1.MathUtils.degreesToRadians(geomMeanAnomalySun));
        const equationOfTime = y * sin2l0 - 2 * eccentricityEarthOrbit * sinm + 4 * eccentricityEarthOrbit * y
            * sinm * cos2l0 - 0.5 * y * y * sin4l0 - 1.25 * eccentricityEarthOrbit * eccentricityEarthOrbit * sin2m;
        return Utils_1.MathUtils.radiansToDegrees(equationOfTime) * 4;
    }
    /**
     * Return the <a href="https://en.wikipedia.org/wiki/Hour_angle">hour angle</a> of the sun in
     * <a href="https://en.wikipedia.org/wiki/Radian">radians</a> at sunrise for the latitude.
     *
     * @param latitude
     *            the latitude of observer in degrees
     * @param solarDeclination
     *            the declination angle of sun in degrees
     * @param zenith
     *            the zenith
     * @param solarEvent
     *             If the hour angle is for {@link SolarEvent#SUNRISE SUNRISE} or {@link SolarEvent#SUNSET SUNSET}
     * @return hour angle of sunrise in <a href="https://en.wikipedia.org/wiki/Radian">radians</a>
     */
    static getSunHourAngle(latitude, solarDeclination, zenith, solarEvent) {
        const latRad = Utils_1.MathUtils.degreesToRadians(latitude);
        const sdRad = Utils_1.MathUtils.degreesToRadians(solarDeclination);
        let hourAngle = (Math.acos(Math.cos(Utils_1.MathUtils.degreesToRadians(zenith)) / (Math.cos(latRad) * Math.cos(sdRad))
            - Math.tan(latRad) * Math.tan(sdRad)));
        if (solarEvent === NOAACalculator.SolarEvent.SUNSET) {
            hourAngle = -hourAngle;
        }
        return hourAngle;
    }
    /**
     * Return the <a href="https://en.wikipedia.org/wiki/Celestial_coordinate_system">Solar Elevation</a> for the
     * horizontal coordinate system at the given location at the given time. Can be negative if the sun is below the
     * horizon. Not corrected for altitude.
     *
     * @param calendar
     *            time of calculation
     * @param latitude
     *            latitude of location for calculation
     * @param longitude
     *            longitude of location for calculation
     * @return solar elevation in degrees - horizon is 0 degrees, civil twilight is -6 degrees
     */
    static getSolarElevation(date, latitude, longitude) {
        const julianDay = NOAACalculator.getJulianDay(date);
        const julianCenturies = NOAACalculator.getJulianCenturiesFromJulianDay(julianDay);
        const eot = NOAACalculator.getEquationOfTime(julianCenturies);
        let adjustedLongitude = (date.hour + 12) + (date.minute + eot + date.second / 60) / 60;
        adjustedLongitude = -((adjustedLongitude * 360.0) / 24.0) % 360.0;
        const hourAngleRad = Utils_1.MathUtils.degreesToRadians(longitude - adjustedLongitude);
        const declination = NOAACalculator.getSunDeclination(julianCenturies);
        const decRad = Utils_1.MathUtils.degreesToRadians(declination);
        const latRad = Utils_1.MathUtils.degreesToRadians(latitude);
        return Utils_1.MathUtils.radiansToDegrees(Math.asin((Math.sin(latRad) * Math.sin(decRad))
            + (Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourAngleRad))));
    }
    /**
     * Return the <a href="https://en.wikipedia.org/wiki/Celestial_coordinate_system">Solar Azimuth</a> for the
     * horizontal coordinate system at the given location at the given time. Not corrected for altitude. True south is 0
     * degrees.
     *
     * @param cal
     *            time of calculation
     * @param latitude
     *            latitude of location for calculation
     * @param longitude
     *            longitude of location for calculation
     * @return FIXME
     */
    static getSolarAzimuth(date, latitude, longitude) {
        const julianDay = NOAACalculator.getJulianDay(date);
        const julianCenturies = NOAACalculator.getJulianCenturiesFromJulianDay(julianDay);
        const eot = NOAACalculator.getEquationOfTime(julianCenturies);
        let adjustedLongitude = (date.hour + 12) + (date.minute + eot + date.second / 60) / 60;
        adjustedLongitude = -((adjustedLongitude * 360.0) / 24.0) % 360.0;
        const hourAngleRad = Utils_1.MathUtils.degreesToRadians(longitude - adjustedLongitude);
        const declination = NOAACalculator.getSunDeclination(julianCenturies);
        const decRad = Utils_1.MathUtils.degreesToRadians(declination);
        const latRad = Utils_1.MathUtils.degreesToRadians(latitude);
        return Utils_1.MathUtils.radiansToDegrees(Math.atan(Math.sin(hourAngleRad)
            / ((Math.cos(hourAngleRad) * Math.sin(latRad)) - (Math.tan(decRad) * Math.cos(latRad))))) + 180;
    }
    /**
     * Return the <a href="https://en.wikipedia.org/wiki/Universal_Coordinated_Time">Universal Coordinated Time</a> (UTC)
     * of <a href="https://en.wikipedia.org/wiki/Noon#Solar_noon">solar noon</a> for the given day at the given location
     * on earth. This implementation returns true solar noon as opposed to the time halfway between sunrise and sunset.
     * Other calculators may return a more simplified calculation of halfway between sunrise and sunset. See <a href=
     * "https://kosherjava.com/2020/07/02/definition-of-chatzos/">The Definition of <em>Chatzos</em></a> for details on
     * solar noon calculations.
     * @see com.kosherjava.zmanim.util.AstronomicalCalculator#getUTCNoon(Calendar, GeoLocation)
     * @see #getSolarNoonMidnightUTC(double, double, SolarEvent)
     *
     * @param date
     *            The Calendar representing the date to calculate solar noon for
     * @param geoLocation
     *            The location information used for astronomical calculating sun times. This class uses only requires
     *            the longitude for calculating noon since it is the same time anywhere along the longitude line.
     * @return the time in minutes from zero UTC
     */
    getUTCNoon(date, geoLocation) {
        let noon = NOAACalculator.getSolarNoonMidnightUTC(NOAACalculator.getJulianDay(date), -geoLocation.getLongitude(), NOAACalculator.SolarEvent.NOON);
        noon = noon / 60;
        return noon > 0 ? noon % 24 : (noon % 24) + 24; // ensure that the time is >= 0 and < 24
    }
    /**
     * Return the <a href="https://en.wikipedia.org/wiki/Universal_Coordinated_Time">Universal Coordinated Time</a>
     * (UTC) of the <a href="https://en.wikipedia.org/wiki/Midnight">solar midnight</a> for the end of the given civil
     * day at the given location on earth (about 12 hours after solar noon). This implementation returns true solar
     * midnight as opposed to the time halfway between sunrise and sunset. Other calculators may return a more
     * simplified calculation of halfway between sunrise and sunset. See <a href=
     * "https://kosherjava.com/2020/07/02/definition-of-chatzos/">The Definition of <em>Chatzos</em></a> for details on
     * solar noon / midnight calculations.
     * @see com.kosherjava.zmanim.util.AstronomicalCalculator#getUTCNoon(Calendar, GeoLocation)
     * @see #getSolarNoonMidnightUTC(double, double, SolarEvent)
     *
     * @param calendar
     *            The Calendar representing the date to calculate solar noon for
     * @param geoLocation
     *            The location information used for astronomical calculating sun times. This class uses only requires
     *            the longitude for calculating noon since it is the same time anywhere along the longitude line.
     * @return the time in minutes from zero UTC
     */
    getUTCMidnight(date, geoLocation) {
        let midnight = NOAACalculator.getSolarNoonMidnightUTC(NOAACalculator.getJulianDay(date), -geoLocation.getLongitude(), NOAACalculator.SolarEvent.MIDNIGHT);
        midnight = midnight / 60;
        return midnight > 0 ? midnight % 24 : (midnight % 24) + 24; // ensure that the time is >= 0 and < 24
    }
    /**
     * Return the <a href="https://en.wikipedia.org/wiki/Universal_Coordinated_Time">Universal Coordinated Time</a> (UTC)
     * midnight (about 12 hours after solar noon) of the given day at the given location on earth.
     *
     * @param julianDay
     *            The Julian day since <a href=
     *            "https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     * @param longitude
     *            the longitude of observer in degrees
     * @param solarEvent
     *            If the calculation is for {@link SolarEvent#NOON NOON} or {@link SolarEvent#MIDNIGHT MIDNIGHT}
     *
     * @return the time in minutes from zero UTC
     *
     * @see com.kosherjava.zmanim.util.AstronomicalCalculator#getUTCNoon(Calendar, GeoLocation)
     * @see #getUTCNoon(Calendar, GeoLocation)
     */
    static getSolarNoonMidnightUTC(julianDay, longitude, solarEvent) {
        // eslint-disable-next-line no-param-reassign
        julianDay = (solarEvent === NOAACalculator.SolarEvent.NOON) ? julianDay : julianDay + 0.5;
        // First pass for approximate solar noon to calculate equation of time
        const tnoon = NOAACalculator.getJulianCenturiesFromJulianDay(julianDay + longitude / 360);
        let equationOfTime = NOAACalculator.getEquationOfTime(tnoon);
        const solNoonUTC = (longitude * 4) - equationOfTime; // minutes
        // second pass
        const newt = NOAACalculator.getJulianCenturiesFromJulianDay(julianDay + solNoonUTC / 1440);
        equationOfTime = NOAACalculator.getEquationOfTime(newt);
        return (solarEvent === NOAACalculator.SolarEvent.NOON ? 720 : 1440) + (longitude * 4) - equationOfTime;
    }
    /**
     * Return the <a href="https://en.wikipedia.org/wiki/Universal_Coordinated_Time">Universal Coordinated Time</a> (UTC)
     * of sunrise or sunset for the given day at the given location on earth.
     * @todo Possibly increase the number of passes for improved accuracy, especially in the Arctic areas.
     *
     * @param calendar
     *            The calendar
     * @param latitude
     *            The latitude of observer in degrees
     * @param longitude
     *            Longitude of observer in degrees
     * @param zenith
     *            Zenith
     * @param solarEvent
     *             If the calculation is for {@link SolarEvent#SUNRISE SUNRISE} or {@link SolarEvent#SUNSET SUNSET}
     * @return the time in minutes from zero Universal Coordinated Time (UTC)
     */
    static getSunRiseSetUTC(date, latitude, longitude, zenith, solarEvent) {
        const julianDay = this.getJulianDay(date);
        // Find the time of solar noon at the location, and use that declination.
        // This is better than start of the Julian day
        // TODO really not needed since the Julian day starts from local fixed noon. Changing this would be more
        // efficient but would likely cause a very minor discrepancy in the calculated times (likely not reducing
        // accuracy, just slightly different, thus potentially breaking test cases). Regardless, it would be within
        // milliseconds.
        const noonmin = NOAACalculator.getSolarNoonMidnightUTC(julianDay, longitude, NOAACalculator.SolarEvent.NOON);
        const tnoon = NOAACalculator.getJulianCenturiesFromJulianDay(julianDay + noonmin / 1440);
        // First calculates sunrise and approximate length of day
        let equationOfTime = NOAACalculator.getEquationOfTime(tnoon);
        let solarDeclination = NOAACalculator.getSunDeclination(tnoon);
        let hourAngle = NOAACalculator.getSunHourAngle(latitude, solarDeclination, zenith, solarEvent);
        let delta = longitude - Utils_1.MathUtils.radiansToDegrees(hourAngle);
        let timeDiff = 4 * delta;
        let timeUTC = 720 + timeDiff - equationOfTime;
        // Second pass includes fractional Julian Day in gamma calc
        const newt = NOAACalculator.getJulianCenturiesFromJulianDay(julianDay + timeUTC / 1440);
        equationOfTime = NOAACalculator.getEquationOfTime(newt);
        solarDeclination = NOAACalculator.getSunDeclination(newt);
        hourAngle = NOAACalculator.getSunHourAngle(latitude, solarDeclination, zenith, solarEvent);
        delta = longitude - Utils_1.MathUtils.radiansToDegrees(hourAngle);
        timeDiff = 4 * delta;
        timeUTC = 720 + timeDiff - equationOfTime;
        return timeUTC;
    }
}
exports.NOAACalculator = NOAACalculator;
/**
 * The <a href="https://en.wikipedia.org/wiki/Julian_day">Julian day</a> of January 1, 2000, known as
 * <a href="https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
 */
NOAACalculator.JULIAN_DAY_JAN_1_2000 = 2451545;
/**
 * Julian days per century
 */
NOAACalculator.JULIAN_DAYS_PER_CENTURY = 36525;
/**
 * An <code>enum</code> to indicate what type of solar event ({@link #SUNRISE SUNRISE}, {@link #SUNSET SUNSET},
 * {@link #NOON NOON} or {@link #MIDNIGHT MIDNIGHT}) is being calculated.
 */
NOAACalculator.SolarEvent = {
    /** SUNRISE A solar event related to sunrise */
    SUNRISE: 0,
    /** SUNSET A solar event related to sunset */
    SUNSET: 1,
    /** NOON A solar event related to noon */
    NOON: 2,
    /** MIDNIGHT A solar event related to midnight */
    MIDNIGHT: 3,
};
//# sourceMappingURL=NOAACalculator.js.map