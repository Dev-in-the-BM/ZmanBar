
import Clutter from 'gi://Clutter';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import { toJewishDate, formatJewishDateInHebrew } from './JewishDate.js';

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
    }

    _updateHebrewDate() {
        const today = new Date();
        const hebrewDateWithoutYear = formatJewishDateInHebrew(today, false);
        // The internal `_clock` property holds the time string without any other indicators.
        const originalClockText = this._dateMenu._clock.clock;
        // Combine the original clock time with our Hebrew date.
        this._clockDisplay.set_text(`${originalClockText}  ${hebrewDateWithoutYear}`);
    }

    _onMenuOpened() {
        // Use the robust recursive search to find the label
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

        const today = new Date();
        const hebrewDateWithYear = formatJewishDateInHebrew(today, true);
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
        // Store the original text so we can restore it perfectly on disable.
        this._originalClockText = this._clockDisplay.get_text();
        
        // Listen for the same signal the dateMenu uses to update the clock.
        this._clockUpdateSignal = this._dateMenu._clock.connect(
            'notify::clock',
            this._updateHebrewDate.bind(this)
        );

        // Connect to menu opening/closing to show the full date.
        this._menuStateSignal = this._dateMenu.menu.connect('open-state-changed', this._onMenuStateChanged.bind(this));

        // Trigger an immediate update to show the date right away.
        this._updateHebrewDate();
    }

    disable() {
        // Disconnect all signals.
        if (this._clockUpdateSignal) {
            this._dateMenu._clock.disconnect(this._clockUpdateSignal);
            this._clockUpdateSignal = null;
        }
        if (this._menuStateSignal) {
            this._dateMenu.menu.disconnect(this._menuStateSignal);
            this._menuStateSignal = null;
        }

        // Restore UI to its original state.
        this._onMenuClosed(); // Revert date label in the menu if it's open.
        this._clockDisplay.set_text(this._originalClockText); // Restore original clock text immediately.
    }
}
