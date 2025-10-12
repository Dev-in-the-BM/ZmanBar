
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
    }

    _updateHebrewDate() {
        const today = new Date();
        const hebrewDateWithYear = formatJewishDateInHebrew(today, true);
        const hebrewDateWithoutYear = formatJewishDateInHebrew(today, false);
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
            style_class: 'hebrew-date-label',
            text: '',
            x_align: Clutter.ActorAlign.START,
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
