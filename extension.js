
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
        this._dateLabel = this._dateMenu._date;
        this._originalDateText = null;
    }

    _updateHebrewDate() {
        const today = new Date();
        const hebrewDateWithoutYear = formatJewishDateInHebrew(today, false);
        this._topPanelLabel.set_text(hebrewDateWithoutYear);
    }

    _onMenuOpened() {
        this._originalDateText = this._dateLabel.get_text();
        const today = new Date();
        const hebrewDateWithYear = formatJewishDateInHebrew(today, true);
        this._dateLabel.set_text(`${this._originalDateText}\n${hebrewDateWithYear}`);
    }

    _onMenuClosed() {
        if (this._originalDateText) {
            this._dateLabel.set_text(this._originalDateText);
        }
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

        // Connect to the menu's open/close signals
        this._menuOpenedSignal = this._dateMenu.menu.connect('opened', this._onMenuOpened.bind(this));
        this._menuClosedSignal = this._dateMenu.menu.connect('closed', this._onMenuClosed.bind(this));
        
        // This signal will update the top panel label every minute
        this._clockUpdateSignal = this._clockDisplay.connect(
             'notify::clock',
             this._updateHebrewDate.bind(this)
        );

        this._updateHebrewDate();
    }

    disable() {
        // Restore the original date text if the extension is disabled while the menu is open
        this._onMenuClosed();

        // Disconnect all signals
        if (this._menuOpenedSignal) {
            this._dateMenu.menu.disconnect(this._menuOpenedSignal);
            this._menuOpenedSignal = null;
        }
        if (this._menuClosedSignal) {
            this._dateMenu.menu.disconnect(this._menuClosedSignal);
            this._menuClosedSignal = null;
        }
        if(this._clockUpdateSignal) {
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
