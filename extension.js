
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
        if (this._topPanelLabel) {
            const today = new Date();
            const hebrewDateWithoutYear = formatJewishDateInHebrew(today, false);
            this._topPanelLabel.set_text(hebrewDateWithoutYear);
        }
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
        log(`JDate extension: dateLabel font: ${font.to_string()}`);

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

    enable() {
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
        
        this._clockUpdateSignal = this._clockDisplay.connect(
             'notify::clock',
             this._updateHebrewDate.bind(this)
        );

        this._updateHebrewDate();
    }

    disable() {
        if (this._originalOpen) {
            this._dateMenu.menu.open = this._originalOpen;
            this._originalOpen = null;
        }
        if (this._originalClose) {
            this._dateMenu.menu.close = this._originalClose;
            this._originalClose = null;
        }

        this._onMenuClosed();

        if (this._clockUpdateSignal) {
            this._clockDisplay.disconnect(this._clockUpdateSignal);
            this._clockUpdateSignal = null;
        }

        if (this._topPanelLabel) {
            this._topPanelLabel.destroy();
            this._topPanelLabel = null;
        }
    }
}
