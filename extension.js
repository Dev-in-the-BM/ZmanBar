
import Clutter from 'gi://Clutter';
import St from 'gi://St';
import Soup from 'gi://Soup?version=3.0';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Geoclue from 'gi://Geoclue?version=2.0';

import { formatJewishDateInHebrew } from './JewishDate.js';
import { log, close } from './logger.js';

function importUMD(path) {
    const file = Gio.File.new_for_path(path);
    const [, contents] = file.load_contents(null);
    const module = { exports: {} };

    // The UMD wrapper expects `module` and `exports`.
    // We can create a function that has those in its scope.
    const umdLoader = new Function('module', 'exports', 'globalThis', new TextDecoder().decode(contents));

    // Execute the UMD bundle, which will populate `module.exports`.
    // We pass `globalThis` so the UMD wrapper can attach to it if needed.
    umdLoader(module, module.exports, globalThis);

    return module.exports;
}

// Get the path of the current module, remove the 'file://' prefix,
// and then construct the path to the UMD module.
const kosherZmanimPath = import.meta.url.substring(7).replace('extension.js', 'kosher-zmanim.js');
const KosherZmanim = importUMD(kosherZmanimPath);
log('KosherZmanim object loaded successfully.');

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
        this._fallbackTimer = null;

        this._httpSession = new Soup.Session();
    }

    _initLocationService() {
        log('JDate extension: Initializing location service...');
        try {
            this._clueSimple = new Geoclue.Simple({
                desktop_id: 'org.gnome.Shell',
                accuracy_level: Geoclue.AccuracyLevel.CITY,
            });
            log(`JDate extension: Geoclue.Simple created with desktop_id: org.gnome.Shell`);

            const processLocation = (location) => {
                if (this._location) return; // Already have a location

                if (!location) {
                    log('JDate extension: processLocation called with null location.');
                    return;
                }

                try {
                    const latitude = location.get_latitude();
                    const longitude = location.get_longitude();
                    const timezone = location.get_timezone_id();

                    this._location = { latitude, longitude, timezone };

                    log(`JDate extension: Location found: ${latitude}, ${longitude}`);
                    if (this._fallbackTimer) {
                        GLib.Source.remove(this._fallbackTimer);
                        this._fallbackTimer = null;
                    }
                    this._scheduleNextUpdate();
                } catch (e) {
                    log(`JDate extension: Error processing location: ${e.message}. Trying manual location.`);
                    this._fetchLocationManually();
                }
            };

            this._clueSimple.connect('notify::location', () => {
                const location = this._clueSimple.get_location();
                if (location) {
                    let props = {};
                    for (const prop in Geoclue.Location.props) {
                        if (prop !== 'bounding-box') { // This one can be spammy
                            try {
                                props[prop] = location[prop];
                            } catch (e) {
                                // Ignore properties that might not be available
                            }
                        }
                    }
                    log(`JDate extension: Received location update: ${JSON.stringify(props, null, 2)}`);
                } else {
                    log('JDate extension: Received null location update from notify::location signal.');
                }
                processLocation(location);
            });

            // Process initial location if available
            const initialLocation = this._clueSimple.get_location();
            if (initialLocation) {
                log('JDate extension: Initial location available on startup.');
                processLocation(initialLocation);
            } else {
                log('JDate extension: No initial location available. Waiting for update...');
                // If no location after a bit, fall back.
                this._fallbackTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 20000, () => {
                    if (!this._location) {
                        log('JDate extension: No location received after 20s. Trying manual location.');
                        this._fetchLocationManually();
                    }
                    this._fallbackTimer = null;
                    return GLib.SOURCE_REMOVE;
                });
            }
        } catch (e) {
            log(`JDate extension: Failed to initialize Geoclue. Error: ${e.message}. Trying manual location.`);
            this._fetchLocationManually();
        }
    }

    _fetchLocationManually() {
        const settings = this.getSettings();
        const locationString = settings.get_string('location-string');

        if (!locationString || locationString.trim() === '') {
            log('JDate extension: Manual location not set. Falling back to midnight updates.');
            this._scheduleMidnightUpdate();
            return;
        }

        log(`JDate extension: Fetching coordinates for manual location: "${locationString}"`);

        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationString)}`;
        const message = new Soup.Message({
            method: 'GET',
            uri: GLib.Uri.parse(url, GLib.UriFlags.NONE)
        });

        // Set a custom User-Agent as required by Nominatim's usage policy
        message.request_headers.append('User-Agent', `GNOME Shell Extension ZmanBar/${this.metadata.version}`);

        this._httpSession.send_async(message, GLib.PRIORITY_DEFAULT, null, (session, result) => {
            try {
                const bytes = session.send_finish(result);
                const response = new TextDecoder().decode(bytes.get_data());
                const data = JSON.parse(response);

                if (data && data.length > 0) {
                    const firstResult = data[0];
                    const latitude = parseFloat(firstResult.lat);
                    const longitude = parseFloat(firstResult.lon);

                    // We don't get a timezone from Nominatim, so we use the system's default.
                    const timezone = GLib.TimeZone.new_local().get_identifier();

                    this._location = { latitude, longitude, timezone };
                    log(`JDate extension: Manual location coordinates found: ${latitude}, ${longitude}`);
                    this._scheduleNextUpdate();
                } else {
                    log(`JDate extension: No results found for "${locationString}". Falling back to midnight updates.`);
                    this._scheduleMidnightUpdate();
                }
            } catch (e) {
                log(`JDate extension: Error fetching manual location: ${e.message}. Falling back to midnight updates.`);
                this._scheduleMidnightUpdate();
            }
        });
    }

    _onLocationSettingChanged() {
        log('JDate extension: Manual location setting changed. Re-initializing location service.');
        // Clear existing location and timers to force a re-fetch
        if (this._timeoutId) {
            GLib.Source.remove(this._timeoutId);
            this._timeoutId = null;
        }
        this._location = null;
        this._shkiah = null;
        this._initLocationService();
    }

    _scheduleMidnightUpdate() {
        // If a timeout is already scheduled, remove it.
        if (this._timeoutId) {
            GLib.Source.remove(this._timeoutId);
            this._timeoutId = null;
        }

        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const diff = tomorrow.getTime() - now.getTime();

        log(`JDate extension: Scheduling next update at midnight in ${diff / 1000} seconds.`);

        // Schedule the next update to happen at midnight
        this._timeoutId = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            diff,
            () => {
                this._updateDateAndReschedule();
                return GLib.SOURCE_REMOVE; // Run only once
            });
    }

    _scheduleNextUpdate() {
        // If a timeout is already scheduled, remove it before scheduling a new one.
        if (this._timeoutId) {
            GLib.Source.remove(this._timeoutId);
            this._timeoutId = null;
        }

        if (!this._location) {
            log('JDate extension: Waiting for location data to schedule update...');
            return;
        }

        const now = new Date();
        const { latitude, longitude, timezone } = this._location;

        const geoLocation = new KosherZmanim.GeoLocation(null, latitude, longitude, 0, timezone);
        const zmanimCalendar = new KosherZmanim.ComplexZmanimCalendar(geoLocation);

        let shkiahDateTime = zmanimCalendar.getSunset();

        // If shkiah for today has already passed, calculate for tomorrow
        if (now > shkiahDateTime.toJSDate()) {
            const tomorrow = new Date(now.getTime());
            tomorrow.setDate(now.getDate() + 1);
            zmanimCalendar.setDate(tomorrow);
            shkiahDateTime = zmanimCalendar.getSunset();
        }

        this._shkiah = shkiahDateTime.toJSDate();
        const diff = this._shkiah.getTime() - now.getTime();

        log(`JDate extension: Next shkiah at ${this._shkiah}. Scheduling update in ${diff / 1000} seconds.`);

        // Schedule the next update to happen at shkiah
        this._timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, diff, () => {
            this._updateDateAndReschedule();
            return GLib.SOURCE_REMOVE; // Run only once
        });
    }

    _updateDateAndReschedule() {
        log('JDate extension: Shkiah reached. Updating date and rescheduling.');
        this._updateHebrewDate();
        if (this._location) {
            this._scheduleNextUpdate();
        } else {
            this._scheduleMidnightUpdate();
        }
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
            log('JDate extension: Could not find todayButton');
            return;
        }

        const dateLabel = findActorByClassName(todayButton, 'date-label');
        if (!dateLabel) {
            log('JDate extension: Could not find dateLabel');
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
        
        this._settings = this.getSettings();
        this._settingsChangedSignal = this._settings.connect(
            'changed::location-string',
            this._onLocationSettingChanged.bind(this)
        );

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
        if (this._settingsChangedSignal) {
            this._settings.disconnect(this._settingsChangedSignal);
            this._settingsChangedSignal = null;
            this._settings = null;
        }
        if (this._menuStateSignal) {
            this._dateMenu.menu.disconnect(this._menuStateSignal);
            this._menuStateSignal = null;
        }
        if (this._timeoutId) {
            GLib.Source.remove(this._timeoutId);
            this._timeoutId = null;
        }
        if (this._fallbackTimer) {
            GLib.Source.remove(this._fallbackTimer);
            this._fallbackTimer = null;
        }
        if (this._clueSimple) {
            this._clueSimple = null;
        }

        this._onMenuClosed();
        this._clockDisplay.set_text(this._originalClockText);

        this._location = null;
        this._shkiah = null;
        
        close();
    }
}
