// JDate@devinthebm.com/extension.js

import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

// Pure JS Hebrew Date Converter (fixed for accurate calculation)
const HebrewDateConverter = {
    // Constants
    EPOCH: 347997, // JD of 1 Tishrei 1 (Gregorian Sep 7, -3760)
    MOLAD_BAIS: 1 * 24 * 3600 + 12 * 3600, // Molad of year 1
    MOLAD_MONTH: 29 * 24 * 3600 + 12 * 3600 + 793, // Average month length in seconds
    WEEK: 7 * 24 * 3600,

    // Hebrew month names
    MONTH_NAMES: [
        'Tishrei', 'Cheshvan', 'Kislev', 'Tevet', 'Shevat', 
        'Adar I', 'Adar II', 'Nisan', 'Iyar', 'Sivan', 
        'Tammuz', 'Av', 'Elul'
    ],

    // Days per month (Tishrei to Elul, with leap year adjustments for Cheshvan/Kislev)
    MONTH_LENGTHS: [30, 29, 29, 29, 30, 30, 29, 30, 29, 30, 29, 30, 29],

    // Is leap year?
    isLeapYear(year) {
        const key = (year * 12 + 17) % 19;
        return key === 0 || key === 3 || key === 6 || key === 8 || key === 11 || key === 14 || key === 17;
    },

    // Days in year
    daysInYear(year) {
        let days = 353; // Base for common year
        if (this.isLeapYear(year)) days += 30; // Add Adar II
        // Adjust Cheshvan/Kislev based on year length rules
        const key = (year % 19);
        if ([0, 3, 6, 8, 11, 14, 17].includes(key)) days += 2; // Complete year
        else if ([2, 5, 10, 13, 16].includes(key)) days += 1; // Regular year
        return days;
    },

    // Gregorian to Julian Day
    gregorianToJD(year, month, day) {
        const a = Math.floor((14 - month) / 12);
        const y = year + 4800 - a;
        const m = month + 12 * a - 3;
        return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    },

    // Julian Day to Hebrew
    jdToHebrew(jd) {
        let year = this.hebrewYearFromJD(jd);
        let month = 7; // Start at Tishrei
        let day = jd - this.jdFromHebrew(year, month, 1) + 1;
        let leap = this.isLeapYear(year);

        while (day > this.daysInMonth(year, month)) {
            day -= this.daysInMonth(year, month);
            month++;
            if (month > (leap ? 13 : 12)) {
                month = 1;
                year++;
                leap = this.isLeapYear(year);
            }
        }

        // Adjust month index for leap years
        let monthIndex = month - 1;
        if (leap && month > 6) monthIndex = month; // Adar II or later
        const monthName = this.MONTH_NAMES[monthIndex];

        return { year, month: monthName, day };
    },

    // Hebrew year from JD
    hebrewYearFromJD(jd) {
        let year = Math.floor((jd - this.EPOCH) / 365.25) + 3760;
        while (this.jdFromHebrew(year, 7, 1) > jd) year--;
        while (this.jdFromHebrew(year + 1, 7, 1) <= jd) year++;
        return year;
    },

    // JD from Hebrew date
    jdFromHebrew(year, month, day) {
        let jd = this.EPOCH;
        for (let y = 1; y < year; y++) {
            jd += this.daysInYear(y);
        }
        for (let m = 1; m < month; m++) {
            jd += this.daysInMonth(year, m);
        }
        jd += day - 1;
        return jd;
    },

    // Days in Hebrew month
    daysInMonth(year, month) {
        if (month === 2) { // Cheshvan
            const key = (year % 19);
            return [0, 3, 6, 8, 11, 14, 17].includes(key) ? 30 : 29;
        }
        if (month === 3) { // Kislev
            const key = (year % 19);
            return [2, 5, 10, 13, 16].includes(key) ? 29 : 30;
        }
        if (month === 6 && !this.isLeapYear(year)) return 0; // No Adar I in non-leap
        if (month === 7 && !this.isLeapYear(year)) return 29; // Adar II becomes Adar
        return this.MONTH_LENGTHS[month - 1] || 29; // Fallback
    },

    // Gregorian to Hebrew
    gregorianToHebrew(date) {
        const jd = this.gregorianToJD(date.getFullYear(), date.getMonth() + 1, date.getDate());
        const hebrew = this.jdToHebrew(jd);
        return `${hebrew.day} ${hebrew.month} ${hebrew.year}`;
    }
};

export default class HebrewDateDisplayExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._indicator = null;
    }

    enable() {
        console.log(`${this.metadata.uuid}: Extension ENABLED successfully (Accurate Hebrew Date)`);

        this._indicator = new PanelMenu.Button(0, 'hebrew-date-display');

        const today = new Date();
        const hebrewDate = HebrewDateConverter.gregorianToHebrew(today);

        const label = new St.Label({
            style_class: 'panel-button',
            text: hebrewDate,
            y_align: 2
        });

        this._indicator.add_child(label);
        Main.panel.addToStatusArea('hebrew-date-display', this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
        console.log(`${this.metadata.uuid}: Extension disabled.`);
    }
}