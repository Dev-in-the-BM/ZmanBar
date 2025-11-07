/**
 * A class that represents a numeric time. Times that represent a time of day are stored as {@link java.util.Date}s in
 * this API. The time class is used to represent numeric time such as the time in hours, minutes, seconds and
 * milliseconds of a {@link AstronomicalCalendar#getTemporalHour() temporal hour}.
 *
 * @author &copy; Eliyahu Hershfeld 2004 - 2011
 * @version 0.9.0
 */
export declare class Time {
    /** milliseconds in a second. */
    private static readonly SECOND_MILLIS;
    /** milliseconds in a minute. */
    private static readonly MINUTE_MILLIS;
    /** milliseconds in an hour. */
    private static readonly HOUR_MILLIS;
    /**
     * The hour.
     * @see #getHours()
     */
    private hours;
    /**
     * The minutes.
     * @see #getMinutes()
     */
    private minutes;
    /**
     * The seconds.
     * @see #getSeconds()
     */
    private seconds;
    /**
     * The milliseconds.
     * @see #getMilliseconds()
     */
    private milliseconds;
    /**
     * Is the time negative
     * @see #isNegative()
     * @see #setIsNegative(boolean)
     */
    private negative;
    /**
     * Constructor with parameters for the hours, minutes, seconds and milliseconds.
     *
     * @param hours the hours to set
     * @param minutes the minutes to set
     * @param seconds the seconds to set
     * @param milliseconds the milliseconds to set
     */
    constructor(hours: number, minutes: number, seconds: number, milliseconds: number);
    /**
     * A constructor that sets the time from milliseconds. The milliseconds are converted to hours, minutes,
     * seconds and milliseconds. If the milliseconds are negative it will call {@link #setIsNegative(boolean)}.
     * @param millis the milliseconds to set.
     */
    constructor(millis: number);
    /**
     * Does the time represent a negative time 9such as using this to subtract time from another Time.
     * @return if the time is negative.
     */
    isNegative(): boolean;
    /**
     * Does the time represent a negative time, such as using this to subtract time from another Time.
     * @param isNegative that the Time represents negative time
     */
    setIsNegative(isNegative: boolean): void;
    /**
     * Get the hour.
     * @return Returns the hour.
     */
    getHours(): number;
    /**
     * Set the hour.
     * @param hours
     *            The hours to set.
     */
    setHours(hours: number): void;
    /**
     * Get the minutes.
     * @return Returns the minutes.
     */
    getMinutes(): number;
    /**
     * Set the minutes.
     * @param minutes
     *            The minutes to set.
     */
    setMinutes(minutes: number): void;
    /**
     * Get the seconds.
     * @return Returns the seconds.
     */
    getSeconds(): number;
    /**
     * Set the seconds.
     * @param seconds
     *            The seconds to set.
     */
    setSeconds(seconds: number): void;
    /**
     * Get the milliseconds.
     * @return Returns the milliseconds.
     */
    getMilliseconds(): number;
    /**
     * Set the milliseconds.
     * @param milliseconds
     *            The milliseconds to set.
     */
    setMilliseconds(milliseconds: number): void;
    /**
     * Returns the time in milliseconds by converting hours, minutes and seconds into milliseconds.
     * @return the time in milliseconds
     */
    getTime(): number;
    /**
     * @deprecated This depends on a circular dependency. Use <pre>new ZmanimFormatter(TimeZone.getTimeZone("UTC")).format(time)</pre> instead.
     */
    toString(): string;
}
