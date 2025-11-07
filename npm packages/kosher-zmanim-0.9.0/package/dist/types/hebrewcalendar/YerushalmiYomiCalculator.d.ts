import { Daf } from './Daf';
import { JewishCalendar } from './JewishCalendar';
/**
 * This class calculates the <a href="https://en.wikipedia.org/wiki/Jerusalem_Talmud">Talmud Yerusalmi</a> <a href=
 * "https://en.wikipedia.org/wiki/Daf_Yomi">Daf Yomi</a> page ({@link Daf}) for the given date.
 *
 * @author &copy; elihaidv
 * @author &copy; Eliyahu Hershfeld 2017 - 2019
 */
export declare class YerushalmiYomiCalculator {
    /**
     * The start date of the first Daf Yomi Yerushalmi cycle of February 2, 1980 / 15 Shevat, 5740.
     */
    private static readonly DAF_YOMI_START_DAY;
    /** The number of pages in the Talmud Yerushalmi. */
    private static readonly WHOLE_SHAS_DAFS;
    /** The number of pages per <em>masechta</em> (tractate). */
    private static readonly BLATT_PER_MASECHTA;
    /**
     * Default constructor.
     */
    /**
     * Returns the <a href="https://en.wikipedia.org/wiki/Daf_Yomi">Daf Yomi</a>
     * <a href="https://en.wikipedia.org/wiki/Jerusalem_Talmud">Yerusalmi</a> page ({@link Daf}) for the given date.
     * The first Daf Yomi cycle started on 15 Shevat (Tu Bishvat), 5740 (February, 2, 1980) and calculations
     * prior to this date will result in an IllegalArgumentException thrown. A null will be returned on Tisha B'Av or
     * Yom Kippur.
     *
     * @param jewishCalendar
     *            the calendar date for calculation
     * @return the {@link Daf} or null if the date is on Tisha B'Av or Yom Kippur.
     *
     * @throws IllegalArgumentException
     *             if the date is prior to the February 2, 1980, the start of the first Daf Yomi Yerushalmi cycle
     */
    static getDafYomiYerushalmi(jewishCalendar: JewishCalendar): Daf | null;
    /**
     * Return the number of special days (Yom Kippur and Tisha Beav, where there are no dafim), between the start date
     * (as a <code>Calendar</code>) and end date (also as a <code>Calendar</code>).
     * @param start - start date to calculate from
     * @param end - end date to calculate at
     * @return the number of special days between the start and end dates
     */
    private static getNumOfSpecialDays;
}
