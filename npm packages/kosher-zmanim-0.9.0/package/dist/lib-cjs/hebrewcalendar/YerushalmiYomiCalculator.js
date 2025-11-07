"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YerushalmiYomiCalculator = void 0;
const luxon_1 = require("luxon");
const Utils_1 = require("../polyfills/Utils");
const Daf_1 = require("./Daf");
const JewishCalendar_1 = require("./JewishCalendar");
const errors_1 = require("../polyfills/errors");
/**
 * This class calculates the <a href="https://en.wikipedia.org/wiki/Jerusalem_Talmud">Talmud Yerusalmi</a> <a href=
 * "https://en.wikipedia.org/wiki/Daf_Yomi">Daf Yomi</a> page ({@link Daf}) for the given date.
 *
 * @author &copy; elihaidv
 * @author &copy; Eliyahu Hershfeld 2017 - 2019
 */
class YerushalmiYomiCalculator {
    /**
     * Default constructor.
     */
    /*
      public YerushalmiYomiCalculator() {
        // nothing here
      }
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
    static getDafYomiYerushalmi(jewishCalendar) {
        let nextCycle = YerushalmiYomiCalculator.DAF_YOMI_START_DAY;
        let prevCycle = YerushalmiYomiCalculator.DAF_YOMI_START_DAY;
        const requested = jewishCalendar.getDate();
        let masechta = 0;
        let dafYomi;
        // There is no Daf Yomi on Yom Kippur or Tisha B'Av.
        if (jewishCalendar.getYomTovIndex() === JewishCalendar_1.JewishCalendar.YOM_KIPPUR || jewishCalendar.getYomTovIndex() === JewishCalendar_1.JewishCalendar.TISHA_BEAV) {
            return null;
        }
        if (requested < YerushalmiYomiCalculator.DAF_YOMI_START_DAY) {
            throw new errors_1.IllegalArgumentException(`${requested} is prior to organized Daf Yomi Yerushalmi cycles that started on ${YerushalmiYomiCalculator.DAF_YOMI_START_DAY}`);
        }
        // Start to calculate current cycle. Initialize the start day
        // nextCycle = YerushalmiYomiCalculator.DAF_YOMI_START_DAY;
        // Go cycle by cycle, until we get the next cycle
        while (requested > nextCycle) {
            prevCycle = nextCycle;
            // Adds the number of whole shas dafs, and then the number of days that not have daf.
            nextCycle = nextCycle.plus({ days: YerushalmiYomiCalculator.WHOLE_SHAS_DAFS });
            // This needs to be a separate step
            nextCycle = nextCycle.plus({ days: YerushalmiYomiCalculator.getNumOfSpecialDays(prevCycle, nextCycle) });
        }
        // Get the number of days from cycle start until request.
        const dafNo = requested.diff(prevCycle, ['days']).days;
        // Get the number of special days to subtract
        const specialDays = YerushalmiYomiCalculator.getNumOfSpecialDays(prevCycle, requested);
        let total = dafNo - specialDays;
        // Finally find the daf.
        // TODO:
        // eslint-disable-next-line no-restricted-syntax
        for (const blattInMasechta of YerushalmiYomiCalculator.BLATT_PER_MASECHTA) {
            if (total <= blattInMasechta) {
                dafYomi = new Daf_1.Daf(masechta, total + 1);
                break;
            }
            total -= blattInMasechta;
            masechta++;
        }
        return dafYomi;
    }
    /**
     * Return the number of special days (Yom Kippur and Tisha Beav, where there are no dafim), between the start date
     * (as a <code>Calendar</code>) and end date (also as a <code>Calendar</code>).
     * @param start - start date to calculate from
     * @param end - end date to calculate at
     * @return the number of special days between the start and end dates
     */
    static getNumOfSpecialDays(start, end) {
        // Find the start and end Jewish years
        const jewishStartYear = new JewishCalendar_1.JewishCalendar(start).getJewishYear();
        const jewishEndYear = new JewishCalendar_1.JewishCalendar(end).getJewishYear();
        // Value to return
        let specialDays = 0;
        // Instant of special dates
        const yomKippur = new JewishCalendar_1.JewishCalendar(jewishStartYear, 7, 10);
        const tishaBeav = new JewishCalendar_1.JewishCalendar(jewishStartYear, 5, 9);
        // Go over the years and find special dates
        for (let i = jewishStartYear; i <= jewishEndYear; i++) {
            yomKippur.setJewishYear(i);
            tishaBeav.setJewishYear(i);
            const interval = luxon_1.Interval.fromDateTimes(start, end);
            if (interval.contains(yomKippur.getDate()))
                specialDays++;
            if (interval.contains(tishaBeav.getDate()))
                specialDays++;
        }
        return specialDays;
    }
}
exports.YerushalmiYomiCalculator = YerushalmiYomiCalculator;
/**
 * The start date of the first Daf Yomi Yerushalmi cycle of February 2, 1980 / 15 Shevat, 5740.
 */
YerushalmiYomiCalculator.DAF_YOMI_START_DAY = luxon_1.DateTime.fromObject({
    year: 1980,
    month: Utils_1.Calendar.FEBRUARY + 1,
    day: 2,
});
/** The number of pages in the Talmud Yerushalmi. */
YerushalmiYomiCalculator.WHOLE_SHAS_DAFS = 1554;
/** The number of pages per <em>masechta</em> (tractate). */
YerushalmiYomiCalculator.BLATT_PER_MASECHTA = [68, 37, 34, 44, 31, 59, 26, 33, 28, 20, 13, 92, 65, 71, 22,
    22, 42, 26, 26, 33, 34, 22, 19, 85, 72, 47, 40, 47, 54, 48, 44, 37, 34, 44, 9, 57, 37, 19, 13];
//# sourceMappingURL=YerushalmiYomiCalculator.js.map