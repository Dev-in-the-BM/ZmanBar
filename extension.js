
import Clutter from 'gi://Clutter';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Geoclue from 'gi://Geoclue?version=2.0';

import { toJewishDate, formatJewishDateInHebrew } from './JewishDate.js';
import * as KosherZmanim from './kosher-zmanim.js';


// Recursive function to find a widget by its style class
function findActorByClassName(actor, className) {
    if (!actor) {
        return null;
    }
    if (actor.get_style_class_name) {
        const styleClassName = actor.get_style_class_name();
        if (styleClassName && styleClassName.includes(className)) {
            return actor;
        }
    }
    if (actor.get_children) {
        for (const child of actor.get_children()) {
            const found = findActorByClassName(child, className);
            if (found) {
                return found;
            }
        }
    }
    return null;
}

export default class HebrewDateDisplayExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._dateMenu = Main.panel.statusArea.dateMenu;
        this._clockDisplay = this._dateMenu._clockDisplay;

        this._location = null;
        this._clueSimple = null;
        this._shkiah = null;
        this._timeoutId = null;
    }

    _initLocationService() {
        try {
            this._clueSimple = new Geoclue.Simple({
                desktop_id: this.uuid,
                distance_threshold: 1000, // 1km
                time_threshold: 600, // 10 minutes
            });
            this._clueSimple.connect('notify::location', this._onLocationUpdate.bind(this));
            this._clueSimple.start();
        } catch (e) {
            console.log(`JDate extension: Geoclue service not available. Falling back to default location. Error: ${e}`);
            // Default to Tel Aviv if GClue is not available
            this._location = {
                latitude: 32.0853,
                longitude: 34.7818,
                timezone: 'Asia/Jerusalem',
            };
            this._scheduleNextUpdate();
        }
    }

    _onLocationUpdate() {
        if (!this._clueSimple) return;

        const location = this._clueSimple.get_location();
        if (!location) return;

        this._location = {
            latitude: location.get_latitude(),
            longitude: location.get_longitude(),
            timezone: location.get_timezone_id(),
        };

        console.log(`JDate extension: Location updated to ${this._location.latitude}, ${this._location.longitude}`);

        // Once we have a location, start the update cycle
        this._scheduleNextUpdate();
    }


    _scheduleNextUpdate() {
        // If a timeout is already scheduled, remove it before scheduling a new one.
        if (this._timeoutId) {
            GLib.Source.remove(this._timeoutId);
            this._timeoutId = null;
        }

        if (!this._location) {
            console.log('JDate extension: Waiting for location data to schedule update...');
            return;
        }

        const now = new Date();
        const { latitude, longitude, timezone } = this._location;

        const geoLocation = new KosherZmanim.GeoLocation(null, latitude, longitude, 0, timezone);
        const zmanimCalendar = new KosherZmanim.ComplexZmanimCalendar(geoLocation);

        let shkiah = zmanimCalendar.getSunset();

        // If shkiah for today has already passed, calculate for tomorrow
        if (now > shkiah) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            zmanimCalendar.setDate(tomorrow);
            shkiah = zmanimCalendar.getSunset();
        }

        this._shkiah = shkiah;
        const diff = this._shkiah.getTime() - now.getTime();

        console.log(`JDate extension: Next shkiah at ${this._shkiah}. Scheduling update in ${diff / 1000} seconds.`);

        // Schedule the next update to happen at shkiah
        this._timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, diff, () => {
            this._updateDateAndReschedule();
            return GLib.SOURCE_REMOVE; // Run only once
        });
    }

    _updateDateAndReschedule() {
        console.log('JDate extension: Shkiah reached. Updating date and rescheduling.');
        this._updateHebrewDate();
        this._scheduleNextUpdate();
    }

    _updateHebrewDate() {
        const now = new Date();
        let dateForHebrewCalc = now;

        // If it's after shkiah, the Hebrew date is for the next Gregorian day
        if (this._shkiah && now > this._shkiah) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateForHebrewCalc = tomorrow;
        }

        const hebrewDateWithoutYear = formatJewishDateInHebrew(dateForHebrewCalc, false);
        const originalClockText = this._dateMenu._clock.clock;
        this._clockDisplay.set_text(`${originalClockText}  ${hebrewDateWithoutYear}`);
    }

    _onMenuOpened() {
        const todayButton = findActorByClassName(Main.panel.statusArea.dateMenu.menu.box, 'datemenu-today-button');
        if (!todayButton) {
            console.log('JDate extension: Could not find todayButton');
            return;
        }

        const dateLabel = findActorByClassName(todayButton, 'date-label');
        if (!dateLabel) {
            console.log('JDate extension: Could not find dateLabel');
            return;
        }

        this._dateLabel = dateLabel;
        this._originalDateText = this._dateLabel.get_text();

        const now = new Date();
        let dateForHebrewCalc = now;
        if (this._shkiah && now > this._shkiah) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateForHebrewCalc = tomorrow;
        }

        const hebrewDateWithYear = formatJewishDateInHebrew(dateForHebrewCalc, true);
        const newText = `${this._originalDateText}\n${hebrewDateWithYear}`;
        this._dateLabel.set_text(newText);
    }

    _onMenuClosed() {
        if (this._dateLabel && this._originalDateText) {
            this._dateLabel.set_text(this._originalDateText);
        }
        this._dateLabel = null;
    }

    _onMenuStateChanged(menu, isOpen) {
        if (isOpen) {
            this._onMenuOpened();
        } else {
            this._onMenuClosed();
        }
    }

    enable() {
        this._originalClockText = this._clockDisplay.get_text();
        
        // This signal updates the time portion of the clock display
        this._clockUpdateSignal = this._dateMenu._clock.connect(
            'notify::clock',
            this._updateHebrewDate.bind(this)
        );

        this._menuStateSignal = this._dateMenu.menu.connect('open-state-changed', this._onMenuStateChanged.bind(this));

        // Start the location service and the update cycle
        this._initLocationService();

        // Run an initial update
        this._updateHebrewDate();
    }

    disable() {
        if (this._clockUpdateSignal) {
            this._dateMenu._clock.disconnect(this._clockUpdateSignal);
            this._clockUpdateSignal = null;
        }
        if (this._menuStateSignal) {
            this._dateMenu.menu.disconnect(this._menuStateSignal);
            this._menuStateSignal = null;
        }
        if (this._timeoutId) {
            GLib.Source.remove(this._timeoutId);
            this._timeoutId = null;
        }
        if (this._clueSimple) {
            this._clueSimple.stop();
            this._clueSimple = null;
        }

        this._onMenuClosed();
        this._clockDisplay.set_text(this._originalClockText);

        this._location = null;
        this._shkiah = null;
    }
}
