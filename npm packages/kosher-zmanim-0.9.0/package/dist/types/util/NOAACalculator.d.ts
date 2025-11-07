import { DateTime } from 'luxon';
import { GeoLocation } from './GeoLocation';
import { AstronomicalCalculator } from './AstronomicalCalculator';
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
export declare class NOAACalculator extends AstronomicalCalculator {
    /**
     * The <a href="https://en.wikipedia.org/wiki/Julian_day">Julian day</a> of January 1, 2000, known as
     * <a href="https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     */
    private static readonly JULIAN_DAY_JAN_1_2000;
    /**
     * Julian days per century
     */
    private static readonly JULIAN_DAYS_PER_CENTURY;
    /**
     * An <code>enum</code> to indicate what type of solar event ({@link #SUNRISE SUNRISE}, {@link #SUNSET SUNSET},
     * {@link #NOON NOON} or {@link #MIDNIGHT MIDNIGHT}) is being calculated.
     */
    protected static readonly SolarEvent: {
        /** SUNRISE A solar event related to sunrise */
        readonly SUNRISE: 0;
        /** SUNSET A solar event related to sunset */
        readonly SUNSET: 1;
        /** NOON A solar event related to noon */
        readonly NOON: 2;
        /** MIDNIGHT A solar event related to midnight */
        readonly MIDNIGHT: 3;
    };
    /**
     * Default constructor of the NOAACalculator.
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
     * Return the <a href="https://en.wikipedia.org/wiki/Julian_day">Julian day</a> from a Java Calendar.
     *
     * @param calendar
     *            The Java Calendar
     * @return the Julian day corresponding to the date Note: Number is returned for start of day. Fractional days
     *         should be added later.
     */
    private static getJulianDay;
    /**
     * Convert <a href="https://en.wikipedia.org/wiki/Julian_day">Julian day</a> to centuries since <a href=
     * "https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     *
     * @param julianDay
     *            the Julian Day to convert
     * @return the centuries since 2000 Julian corresponding to the Julian Day
     */
    private static getJulianCenturiesFromJulianDay;
    /**
     * Returns the Geometric <a href="https://en.wikipedia.org/wiki/Mean_longitude">Mean Longitude</a> of the Sun.
     *
     * @param julianCenturies
     *            the number of Julian centuries since <a href=
     *            "https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     * @return the Geometric Mean Longitude of the Sun in degrees
     */
    private static getSunGeometricMeanLongitude;
    /**
     * Returns the Geometric <a href="https://en.wikipedia.org/wiki/Mean_anomaly">Mean Anomaly</a> of the Sun.
     *
     * @param julianCenturies
     *            the number of Julian centuries since <a href=
     *            "https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     * @return the Geometric Mean Anomaly of the Sun in degrees
     */
    private static getSunGeometricMeanAnomaly;
    /**
     * Return the unitless <a href="https://en.wikipedia.org/wiki/Eccentricity_%28orbit%29">eccentricity of earth's orbit</a>.
     *
     * @param julianCenturies
     *            the number of Julian centuries since <a href=
     *            "https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     * @return the unitless eccentricity
     */
    private static getEarthOrbitEccentricity;
    /**
     * Returns the <a href="https://en.wikipedia.org/wiki/Equation_of_the_center">equation of center</a> for the sun in degrees.
     *
     * @param julianCenturies
     *            the number of Julian centuries since <a href=
     *            "https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     * @return the equation of center for the sun in degrees
     */
    private static getSunEquationOfCenter;
    /**
     * Return the <a href="https://en.wikipedia.org/wiki/True_longitude">true longitude</a> of the sun.
     *
     * @param julianCenturies
     *            the number of Julian centuries since <a href=
     *            "https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     * @return the sun's true longitude in degrees
     */
    private static getSunTrueLongitude;
    /**
     * Return the <a href="https://en.wikipedia.org/wiki/Apparent_longitude">apparent longitude</a> of the sun.
     *
     * @param julianCenturies
     *            the number of Julian centuries since <a href=
     *            "https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     * @return sun's apparent longitude in degrees
     */
    private static getSunApparentLongitude;
    /**
     * Returns the mean <a href="https://en.wikipedia.org/wiki/Axial_tilt">obliquity of the ecliptic</a> (Axial tilt).
     *
     * @param julianCenturies
     *            the number of Julian centuries since <a href=
     *            "https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     * @return the mean obliquity in degrees
     */
    private static getMeanObliquityOfEcliptic;
    /**
     * Returns the corrected <a href="https://en.wikipedia.org/wiki/Axial_tilt">obliquity of the ecliptic</a> (Axial
     * tilt).
     *
     * @param julianCenturies
     *            the number of Julian centuries since <a href=
     *            "https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     * @return the corrected obliquity in degrees
     */
    private static getObliquityCorrection;
    /**
     * Return the <a href="https://en.wikipedia.org/wiki/Declination">declination</a> of the sun.
     *
     * @param julianCenturies
     *            the number of Julian centuries since <a href=
     *            "https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     * @return
     *            the sun's declination in degrees
     */
    private static getSunDeclination;
    /**
     * Return the <a href="https://en.wikipedia.org/wiki/Equation_of_time">Equation of Time</a> - the difference between
     * true solar time and mean solar time
     *
     * @param julianCenturies
     *            the number of Julian centuries since <a href=
     *            "https://en.wikipedia.org/wiki/Epoch_(astronomy)#J2000">J2000.0</a>.
     * @return equation of time in minutes of time
     */
    private static getEquationOfTime;
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
    private static getSunHourAngle;
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
    static getSolarElevation(date: DateTime, latitude: number, longitude: number): number;
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
    static getSolarAzimuth(date: DateTime, latitude: number, longitude: number): number;
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
    getUTCNoon(date: DateTime, geoLocation: GeoLocation): number;
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
    getUTCMidnight(date: DateTime, geoLocation: GeoLocation): number;
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
    private static getSolarNoonMidnightUTC;
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
    private static getSunRiseSetUTC;
}
