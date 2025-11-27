
import Clutter from 'gi://Clutter';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';

const log = (message) => console.log(`ZmanBar: ${message}`);
const logError = (error, message) => console.error(`ZmanBar Error: ${message}`, error);

function importUMD(path) {
    const file = Gio.File.new_for_path(path);
    const [, contents] = file.load_contents(null);
    const module = { exports: {} };
    const umdLoader = new Function('module', 'exports', 'globalThis', new TextDecoder().decode(contents));
    umdLoader(module, module.exports, globalThis);
    return module.exports;
}

const kosherZmanimPath = import.meta.url.substring(7).replace('extension.js', 'kosher-zmanim.js');
const KosherZmanim = importUMD(kosherZmanimPath);

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
        this._shkiah = null;
        this._hebrewDateString = '';
        this._hebrewDateStringWithYear = '';
        this._zmanimCalendar = new KosherZmanim.ComplexZmanimCalendar();
        this._hebrewDateFormatter = new KosherZmanim.HebrewDateFormatter();
        this._hebrewDateFormatter.setHebrewFormat(true);
        // Note: Can't log here until settings are loaded in enable()
    }

    _onLogSettingChanged() {
        // Now that the setting has changed, we will log a message.
        log('Log setting changed. Logging is now ' + (this._settings.get_boolean('enable-logging') ? 'enabled' : 'disabled'));
    }

    _useSavedLocation() {
        log('Attempting to use saved location from settings.');
        const settings = this.getSettings();
        const latitude = settings.get_double('latitude');
        const longitude = settings.get_double('longitude');

        if (latitude === 0.0 && longitude === 0.0) {
            log('No saved location found. The date will update at midnight.');
            this._location = null;
        } else {
            const timezone = GLib.TimeZone.new_local().get_identifier();
            this._location = { latitude, longitude, timezone, source: 'Saved Settings' };
            const geoLocation = new KosherZmanim.GeoLocation(settings.get_string('location-name'), latitude, longitude, 0, timezone);
            this._zmanimCalendar.setGeoLocation(geoLocation);
            log(`Using saved location: Lat ${latitude}, Lon ${longitude}`);
        }
    }

    _onLocationSettingChanged() {
        log('Manual location setting changed. Re-evaluating location.');
        this._useSavedLocation();
        this._updateAndDisplayDate();
    }

    _formatHebrewDate(jewishCalendar, withYear) {
        const day = this._hebrewDateFormatter.formatHebrewNumber(jewishCalendar.getJewishDayOfMonth());
        const month = this._hebrewDateFormatter.formatMonth(jewishCalendar);
        if (withYear) {
            const year = this._hebrewDateFormatter.formatHebrewNumber(jewishCalendar.getJewishYear());
            return `${day} ${month} ${year}`;
        }
        return `${day} ${month}`;
    }

    _updateAndCacheValues() {
        const now = new Date();
        log(`Recalculating shkiah and Hebrew date for ${now.toLocaleString()}`);

        if (this._zmanimCalendar) {
            this._zmanimCalendar.setDate(now);
            this._shkiah = this._zmanimCalendar.getSunset()?.toJSDate();
            if (!this._shkiah) {
                logError(new Error('Failed to calculate shkiah.'));
                this._shkiah = null; // Ensure it's null on failure
            }
        } else {
            this._shkiah = null;
        }

        let dateForHebrewCalc = now;
        if (this._shkiah && now >= this._shkiah) {
            log(`Current time is after shkiah (${this._shkiah.toLocaleTimeString()}). Using tomorrow's date for display.`);
            const tomorrow = new Date(now.getTime() + 86400000);
            dateForHebrewCalc = tomorrow;
        }

        const jewishDate = new KosherZmanim.JewishCalendar(dateForHebrewCalc);
        this._hebrewDateString = this._formatHebrewDate(jewishDate, false);
        this._hebrewDateStringWithYear = this._formatHebrewDate(jewishDate, true);

        log(`Cached new Hebrew date: ${this._hebrewDateString}`);
        this._scheduleUpdate();
    }

    _scheduleUpdate() {
        if (this._updateTimeout) {
            GLib.source_remove(this._updateTimeout);
            this._updateTimeout = null;
        }

        const now = new Date();
        let nextUpdate;

        if (this._shkiah && now < this._shkiah) {
            nextUpdate = this._shkiah;
            log(`Scheduling next update for shkiah at ${nextUpdate.toLocaleTimeString()}`);
        } else {
            nextUpdate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            log(`Scheduling next update for midnight at ${nextUpdate.toLocaleTimeString()}`);
        }

        const secondsToNextUpdate = Math.max(1, Math.floor((nextUpdate.getTime() - now.getTime()) / 1000));
        this._updateTimeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, secondsToNextUpdate, () => {
            this._updateAndCacheValues();
            this._updateClockDisplay(); // Update immediately after recalculation
            return GLib.SOURCE_REMOVE; // The timeout runs only once
        });
    }

    _updateClockDisplay() {
        const originalClockText = this._dateMenu._clock.clock;
        this._clockDisplay.set_text(`${originalClockText}  ${this._hebrewDateString}`);
    }

    _onMenuOpened() {
        log('Executing _onMenuOpened to update notification center date.');
        const dateLabel = findActorByClassName(this._dateMenu.menu.box, 'date-label');
        if (!dateLabel) {
            logError(new Error('Could not find dateLabel actor in notification center.'));
            return;
        }
        log('Found dateLabel actor.');

        this._dateLabel = dateLabel;
        this._originalDateText = this._dateLabel.get_text();
        log(`Original date text in notification center: "${this._originalDateText}"`);

        // Use the cached full date string
        const newText = `${this._originalDateText}\n${this._hebrewDateStringWithYear}`;
        log(`Setting new text for notification center: "${newText.replace('\n', '\\n')}"`);
        
        try {
            this._dateLabel.set_text(newText);
            log('Successfully set new date text in notification center.');
        } catch (e) {
            logError(e, 'Failed to set text on dateLabel.');
        }
    }

    _onMenuClosed() {
        log('Executing _onMenuClosed.');
        if (this._dateLabel && this._originalDateText) {
            log(`Restoring original date text: "${this._originalDateText}"`);
            this._dateLabel.set_text(this._originalDateText);
        } else {
            log('No original date text to restore.');
        }
        this._dateLabel = null;
    }

    _onMenuStateChanged(menu, isOpen) {
        log(`Date menu state changed. Is open: ${isOpen}`);
        if (isOpen) {
            this._onMenuOpened();
        } else {
            this._onMenuClosed();
        }
    }

    _updateAndDisplayDate() {
        this._updateAndCacheValues();
        this._updateClockDisplay();
    }

    enable() {
        this._settings = this.getSettings();
        log('Enabling ZmanBar extension.');
        log('KosherZmanim library loaded successfully.');
        this._originalClockText = this._clockDisplay.get_text();

        this._settingsChangedIdLat = this._settings.connect('changed::latitude', this._onLocationSettingChanged.bind(this));
        this._settingsChangedIdLon = this._settings.connect('changed::longitude', this._onLocationSettingChanged.bind(this));
        this._settingsChangedIdName = this._settings.connect('changed::location-name', this._onLocationSettingChanged.bind(this));
        this._settingsChangedIdLog = this._settings.connect('changed::enable-logging', this._onLogSettingChanged.bind(this));

        this._clockUpdateSignal = this._dateMenu._clock.connect('notify::clock', this._updateClockDisplay.bind(this));
        this._menuStateSignal = this._dateMenu.menu.connect('open-state-changed', this._onMenuStateChanged.bind(this));

        this._useSavedLocation();
        this._updateAndDisplayDate();

        log('ZmanBar extension enabled successfully.');
    }

    disable() {
        log('Disabling ZmanBar extension.');

        if (this._updateTimeout) GLib.source_remove(this._updateTimeout);
        if (this._clockUpdateSignal) this._dateMenu._clock.disconnect(this._clockUpdateSignal);
        if (this._settingsChangedIdLat) this._settings.disconnect(this._settingsChangedIdLat);
        if (this._settingsChangedIdLon) this._settings.disconnect(this._settingsChangedIdLon);
        if (this._settingsChangedIdName) this._settings.disconnect(this._settingsChangedIdName);
        if (this._settingsChangedIdLog) this._settings.disconnect(this._settingsChangedIdLog);
        if (this._menuStateSignal) this._dateMenu.menu.disconnect(this._menuStateSignal);

        this._onMenuClosed();
        this._clockDisplay.set_text(this._originalClockText);

        this._settings = null;
        this._location = null;
        this._shkiah = null;
        
        log('ZmanBar extension disabled.');
    }
}
