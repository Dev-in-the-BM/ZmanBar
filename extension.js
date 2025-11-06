
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
        const originalText = this._dateMenu._clock.clock; // Use the raw clock string
        this._clockDisplay.set_text(`${originalText}  ${hebrewDateWithoutYear}`);
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
        const font = dateLabel.get_theme_node().get_font();

        this._dateLabel = dateLabel;
        this._originalDateText = this._dateLabel.get_text();
        this._originalDateStyle = this._dateLabel.get_style();

        const today = new Date();
        const hebrewDateWithYear = formatJewishDateInHebrew(today, true);
        const newText = `${this._originalDateText}\n${hebrewDateWithYear}`;
        this._dateLabel.set_text(newText);
    }

    _onMenuClosed() {
        if (this._dateLabel && this._originalDateText) {
            this._dateLabel.set_text(this._originalDateText);
            this._dateLabel.set_style(this._originalDateStyle);
        }
        this._dateLabel = null;
        this._originalDateText = null;
        this._originalDateStyle = null;
    }

    _onMenuStateChanged(menu, isOpen) {
        if (isOpen) {
            this._onMenuOpened();
        } else {
            this._onMenuClosed();
        }
    }

    enable() {
        // Instead of patching, we listen for the same signal the dateMenu uses.
        this._clockUpdateSignal = this._dateMenu._clock.connect(
            'notify::clock',
            this._updateHebrewDate.bind(this)
        );

        this._menuStateSignal = this._dateMenu.menu.connect('open-state-changed', this._onMenuStateChanged.bind(this));

        // Trigger an immediate update
        this._updateHebrewDate();
    }

    disable() {
        // Disconnect our clock update signal
        this._dateMenu._clock.disconnect(this._clockUpdateSignal);
        this._onMenuClosed();

        if (this._menuStateSignal) {
            this._dateMenu.menu.disconnect(this._menuStateSignal);
            this._menuStateSignal = null;
        }

        // Restore the original clock text by forcing the clock to update itself.
        // This is the clean way to revert our changes without causing instability
        // by destroying the clock object.
        if (this._dateMenu._clock.update_clock) {
            this._dateMenu._clock.update_clock();
        }
    }
}
