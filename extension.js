
import Clutter from 'gi://Clutter';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import { toJewishDate, formatJewishDateInHebrew } from './JewishDate.js';

export default class HebrewDateDisplayExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._dateMenu = Main.panel.statusArea.dateMenu;
        this._clockDisplay = this._dateMenu._clockDisplay;
    }

    _updateHebrewDate() {
        if (this._topPanelLabel) {
            const today = new Date();
            const hebrewDateWithoutYear = formatJewishDateInHebrew(today, false);
            this._topPanelLabel.set_text(hebrewDateWithoutYear);
        }
    }

    _onMenuOpened() {
        // Find the date label within the menu
        const dateLabel = this._dateMenu.menu.box.get_children().find(c => c.style_class === 'datemenu-date-label');
        if (!dateLabel) {
            return;
        }

        // Store the original text and the label itself
        this._dateLabel = dateLabel;
        this._originalDateText = this._dateLabel.get_text();

        // Set the new text
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
        this._originalDateText = null;
    }

    enable() {
        // Create and add top panel label
        this._topPanelLabel = new St.Label({
            style_class: 'panel-date-label',
            text: '',
            y_align: Clutter.ActorAlign.CENTER,
        });
        const children = this._dateMenu._clockDisplay.get_parent().get_children();
        this._dateMenu._clockDisplay.get_parent().insert_child_at_index(this._topPanelLabel, children.length - 1);

        // Monkey-patch the menu's open and close methods
        this._originalOpen = this._dateMenu.menu.open;
        this._dateMenu.menu.open = (...args) => {
            this._originalOpen.apply(this._dateMenu.menu, args);
            this._onMenuOpened();
        };

        this._originalClose = this._dateMenu.menu.close;
        this._dateMenu.menu.close = (...args) => {
            this._originalClose.apply(this._dateMenu.menu, args);
            this._onMenuClosed();
        };
        
        // This signal will update the top panel label every minute
        this._clockUpdateSignal = this._clockDisplay.connect(
             'notify::clock',
             this._updateHebrewDate.bind(this)
        );

        this._updateHebrewDate();
    }

    disable() {
        // Restore original methods
        if (this._originalOpen) {
            this._dateMenu.menu.open = this._originalOpen;
            this._originalOpen = null;
        }
        if (this._originalClose) {
            this._dateMenu.menu.close = this._originalClose;
            this._originalClose = null;
        }

        // Clean up the label if the menu was open during disabling
        this._onMenuClosed();

        // Disconnect clock signal
        if (this._clockUpdateSignal) {
            this._clockDisplay.disconnect(this._clockUpdateSignal);
            this._clockUpdateSignal = null;
        }

        // Destroy the top panel label
        if (this._topPanelLabel) {
            this._topPanelLabel.destroy();
            this._topPanelLabel = null;
        }
    }
}
