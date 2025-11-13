
import Clutter from 'gi://Clutter';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';

import { formatJewishDateInHebrew } from './JewishDate.js';
import { log, logError, close } from './logger.js';

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
log('KosherZmanim library loaded successfully.');

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
        this._timeoutId = null;
        log('HebrewDateDisplayExtension constructor finished.');
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
            log(`Using saved location: Lat ${latitude}, Lon ${longitude}`);
        }
    }

    _onLocationSettingChanged() {
        log('Manual location setting changed. Re-evaluating location.');
        this._location = null;
        this._useSavedLocation();
        this._updateHebrewDate();
    }







    _updateHebrewDate() {
        log('Updating Hebrew date display.');
        const now = new Date();
        let dateForHebrewCalc = now;

        if (this._location) {
            const { latitude, longitude, timezone } = this._location;
            const geoLocation = new KosherZmanim.GeoLocation(null, latitude, longitude, 0, timezone);
            const zmanimCalendar = new KosherZmanim.ComplexZmanimCalendar(geoLocation);
            const shkiah = zmanimCalendar.getSunset().toJSDate();

            if (now > shkiah) {
                log(`Current time is after shkiah (${shkiah.toLocaleTimeString()}). Using tomorrow's date for display.`);
                const tomorrow = new Date(now.getTime() + 86400000);
                dateForHebrewCalc = tomorrow;
            }
        }

        const hebrewDateWithoutYear = formatJewishDateInHebrew(dateForHebrewCalc, false);
        log(`Formatted Hebrew date: ${hebrewDateWithoutYear}`);
        const originalClockText = this._dateMenu._clock.clock;
        this._clockDisplay.set_text(`${originalClockText}  ${hebrewDateWithoutYear}`);
    }

    _onMenuOpened() {
        log('Executing _onMenuOpened to update notification center date.');
        const todayButton = findActorByClassName(Main.panel.statusArea.dateMenu.menu.box, 'datemenu-today-button');
        if (!todayButton) {
            logError(new Error('Could not find todayButton actor in notification center.'));
            return;
        }
        log('Found todayButton actor.');

        const dateLabel = findActorByClassName(todayButton, 'date-label');
        if (!dateLabel) {
            logError(new Error('Could not find dateLabel actor in notification center.'));
            return;
        }
        log('Found dateLabel actor.');

        this._dateLabel = dateLabel;
        this._originalDateText = this._dateLabel.get_text();
        log(`Original date text in notification center: "${this._originalDateText}"`);

        const now = new Date();
        let dateForHebrewCalc = now;

        if (this._location) {
            const { latitude, longitude, timezone } = this._location;
            const geoLocation = new KosherZmanim.GeoLocation(null, latitude, longitude, 0, timezone);
            const zmanimCalendar = new KosherZmanim.ComplexZmanimCalendar(geoLocation);
            const shkiah = zmanimCalendar.getSunset().toJSDate();

            if (now > shkiah) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                dateForHebrewCalc = tomorrow;
                log('After shkiah, using tomorrow for Hebrew date calculation.');
            }
        }

        const hebrewDateWithYear = formatJewishDateInHebrew(dateForHebrewCalc, true);
        const newText = `${this._originalDateText}\n${hebrewDateWithYear}`;
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

    enable() {
        log('Enabling ZmanBar extension.');
        this._originalClockText = this._clockDisplay.get_text();
        
        this._settings = this.getSettings();
        this._settingsChangedIdLat = this._settings.connect('changed::latitude', this._onLocationSettingChanged.bind(this));
        this._settingsChangedIdLon = this._settings.connect('changed::longitude', this._onLocationSettingChanged.bind(this));
        this._settingsChangedIdName = this._settings.connect('changed::location-name', this._onLocationSettingChanged.bind(this));

        this._clockUpdateSignal = this._dateMenu._clock.connect('notify::clock', this._updateHebrewDate.bind(this));
        this._menuStateSignal = this._dateMenu.menu.connect('open-state-changed', this._onMenuStateChanged.bind(this));

        this._useSavedLocation();
        this._updateHebrewDate();
        log('ZmanBar extension enabled successfully.');
    }

    disable() {
        log('Disabling ZmanBar extension.');
        if (this._clockUpdateSignal) this._dateMenu._clock.disconnect(this._clockUpdateSignal);
        if (this._settingsChangedIdLat) this._settings.disconnect(this._settingsChangedIdLat);
        if (this._settingsChangedIdLon) this._settings.disconnect(this._settingsChangedIdLon);
        if (this._settingsChangedIdName) this._settings.disconnect(this._settingsChangedIdName);
        if (this._menuStateSignal) this._dateMenu.menu.disconnect(this._menuStateSignal);
        if (this._timeoutId) GLib.Source.remove(this._timeoutId);
        if (this._fallbackTimer) GLib.Source.remove(this._fallbackTimer);

        this._onMenuClosed();
        this._clockDisplay.set_text(this._originalClockText);

        this._settings = null;
        this._location = null;
        this._timeoutId = null;
        
        close();
        log('ZmanBar extension disabled.');
    }
}
