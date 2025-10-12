
import Clutter from 'gi://Clutter';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import { toJewishDate } from './_lib/JewishDate.js';

// START gematriya.js
const letters = {}, numbers = {
    '': 0,
    א: 1,
    ב: 2,
    ג: 3,
    ד: 4,
    ה: 5,
    ו: 6,
    ז: 7,
    ח: 8,
    ט: 9,
    י: 10,
    כ: 20,
    ל: 30,
    מ: 40,
    נ: 50,
    ס: 60,
    ע: 70,
    פ: 80,
    צ: 90,
    ק: 100,
    ר: 200,
    ש: 300,
    ת: 400,
    תק: 500,
    תר: 600,
    תש: 700,
    תת: 800,
    תתק: 900,
    תתר: 1000
};
for (let i in numbers) {
    letters[numbers[i]] = i;
}

function gematriya(num, options) {
    if (options === undefined) {
        options = {limit: false, punctuate: true, order: false, geresh: true};
    }

    if (typeof num !== 'number' && typeof num !== 'string') {
        throw new TypeError('non-number or string given to gematriya()');
    }

    if (typeof options !== 'object' || options === null){
        throw new TypeError('An object was not given as second argument')
    }

    const limit = options.limit;
    const order = options.order;
    const punctuate = typeof options.punctuate === 'undefined' ? true : options.punctuate;
    const geresh = typeof options.geresh === 'undefined' && punctuate ? true : options.geresh;

    const str = typeof num === 'string';

    if (str) {
        num = num.replace(/('|")/g,'');
    }
    num = num.toString().split('').reverse();
    if (!str && limit) {
        num = num.slice(0, limit);
    }

    num = num.map(function g(n,i){
        if (str) {
            return order && numbers[n] < numbers[num[i - 1]] && numbers[n] < 100 ? numbers[n] * 1000 : numbers[n];
        } else {
            if (parseInt(n, 10) * Math.pow(10, i) > 1000) {
                return g(n, i-3);
            }
            return letters[parseInt(n, 10) * Math.pow(10, i)];
        }
    });

    if (str) {
        return num.reduce(function(o,t){
            return o + t;
        }, 0);
    } else {
        num = num.reverse().join('').replace(/יה/g,'טו').replace(/יו/g,'טז').split('');

        if (punctuate || geresh)	{
            if (num.length === 1) {
                num.push(geresh ? '׳' : "'");
            } else if (num.length > 1) {
                num.splice(-1, 0, geresh ? '״' : '"');
            }
        }

        return num.join('');
    }
}
// END gematriya.js

const JewishMonth = {
    None: "None",
    Tishri: "Tishri",
    Cheshvan: "Cheshvan",
    Kislev: "Kislev",
    Tevet: "Tevet",
    Shevat: "Shevat",
    Adar: "Adar",
    Nisan: "Nisan",
    Iyyar: "Iyyar",
    Sivan: "Sivan",
    Tammuz: "Tammuz",
    Av: "Av",
    Elul: "Elul",
    AdarI: "AdarI",
    AdarII: "AdarII"
};

const getJewishMonthInHebrew = (jewishMonth) => {
    const jewishMonthsHebrewNamesDic = {
      [JewishMonth.None]: "ללא",
      [JewishMonth.Tishri]: "תשרי",
      [JewishMonth.Cheshvan]: "חשון",
      [JewishMonth.Kislev]: "כסלו",
      [JewishMonth.Tevet]: "טבת",
      [JewishMonth.Shevat]: "שבט",
      [JewishMonth.Adar]: "אדר",
      [JewishMonth.AdarI]: "אדר א",
      [JewishMonth.AdarII]: "אדר ב",
      [JewishMonth.Nisan]: "ניסן",
      [JewishMonth.Iyyar]: "אייר",
      [JewishMonth.Sivan]: "סיון",
      [JewishMonth.Tammuz]: "תמוז",
      [JewishMonth.Av]: "אב",
      [JewishMonth.Elul]: "אלול",
    };
    return jewishMonthsHebrewNamesDic[jewishMonth];
};

const convertNumberToHebrew = (num, addGeresh = true, addPunctuate = true) => {
    return gematriya(num, { geresh: addGeresh, punctuate: addPunctuate });
};

const toHebrewJewishDate = (jewishDate) => {
    return {
        day: convertNumberToHebrew(jewishDate.day),
        monthName: getJewishMonthInHebrew(jewishDate.monthName),
        year: convertNumberToHebrew(jewishDate.year % 1000),
    };
};

const formatJewishDateInHebrew = (jewishDate, includeYear = true) => {
    const jewishDateInHebrew = toHebrewJewishDate(jewishDate);
    let formattedDate = `${jewishDateInHebrew.day} ${jewishDateInHebrew.monthName}`;
    if (includeYear) {
        formattedDate += ` ${jewishDateInHebrew.year}`;
    }
    return formattedDate;
};

export default class HebrewDateDisplayExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._dateMenu = Main.panel.statusArea.dateMenu;
        this._clockDisplay = this._dateMenu._clockDisplay;
    }

    _updateHebrewDate() {
        const today = new Date();
        const jewishDate = toJewishDate(today);
        const hebrewDateWithYear = formatJewishDateInHebrew(jewishDate, true);
        const hebrewDateWithoutYear = formatJewishDateInHebrew(jewishDate, false);
        this._hebrewDateLabel.set_text(hebrewDateWithYear);
        this._topPanelLabel.set_text(hebrewDateWithoutYear);
    }

    enable() {
        // Create top panel label
        this._topPanelLabel = new St.Label({
            style_class: 'panel-date-label',
            text: '',
            y_align: Clutter.ActorAlign.CENTER,
        });

        // Add the top panel label
        const children = this._dateMenu._clockDisplay.get_parent().get_children();
        this._dateMenu._clockDisplay.get_parent().insert_child_at_index(this._topPanelLabel, children.length -1);

        // Find the original date label's container
        const originalDateLabel = this._dateMenu._date;
        const dateBox = originalDateLabel.get_parent();

        // Create new label for hebrew date
        this._hebrewDateLabel = new St.Label({
            style_class: 'datemenu-date-label hebrew-date-label',
            text: '',
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
            y_expand: true,
        });
        const dateBoxChildren = dateBox.get_children();
        const originalDateLabelIndex = dateBoxChildren.indexOf(originalDateLabel);
        dateBox.insert_child_at_index(this._hebrewDateLabel, originalDateLabelIndex + 1);


        // Update the calendar when the menu is opened
        this._menuOpenedSignal = this._dateMenu.menu.connect('open-state-changed', (menu, isOpen) => {
            if (isOpen) {
                this._updateHebrewDate();
            }
        });

        this._updateHebrewDate();
    }

    disable() {
        if (this._menuOpenedSignal) {
            this._dateMenu.menu.disconnect(this._menuOpenedSignal);
            this._menuOpenedSignal = null;
        }

        // Remove hebrew date label
        if (this._hebrewDateLabel) {
            this._hebrewDateLabel.destroy();
            this._hebrewDateLabel = null;
        }

        if (this._topPanelLabel) {
            this._topPanelLabel.destroy();
            this._topPanelLabel = null;
        }
    }
}
