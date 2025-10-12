
import Clutter from 'gi://Clutter';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import { toJewishDate, formatJewishDateInHebrew } from './JewishDate.js';
export default class HebrewDateDisplayExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._dateMenu = Main.panel.statusArea.dateMenu;
        this._clockDisplay = this._dateMenu._clockDisplay;
        this._originalDateLabel = this._dateMenu._date;
    }

    _updateHebrewDate() {
        const today = new Date();
        const hebrewDateWithYear = formatJewishDateInHebrew(today, true);
        const hebrewDateWithoutYear = formatJewishDateInHebrew(today, false);
        this._topPanelLabel.set_text(hebrewDateWithoutYear);

        const originalDateText = this._originalDateLabel.get_text();
        this._originalDateLabel.set_text(`${originalDateText}\n${hebrewDateWithYear}`);

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

        // Update the calendar when the menu is opened
        this._menuOpenedSignal = this._dateMenu.menu.connect('open-state-changed', (menu, isOpen) => {
            if (isOpen) {
                this._updateHebrewDate();
            } else {
                // Restore the original date text when the menu is closed
                this._originalDateLabel.set_text(this._originalDateLabel.get_text().split('\n')[0])
            }
        });

        this._updateHebrewDate();
    }

    disable() {
        // Restore the original date text when the menu is closed
        this._originalDateLabel.set_text(this._originalDateLabel.get_text().split('\n')[0])

        if (this._menuOpenedSignal) {
            this._dateMenu.menu.disconnect(this._menuOpenedSignal);
            this._menuOpenedSignal = null;
        }

        if (this._topPanelLabel) {
            this._topPanelLabel.destroy();
            this._topPanelLabel = null;
        }
    }
}
