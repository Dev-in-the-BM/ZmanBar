// JDate@devinthebm.com/extension.js

import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

export default class HebrewDateDisplayExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._indicator = null;
    }

    enable() {
        console.log(`${this.metadata.uuid}: Extension ENABLED successfully (PanelMenu Test)`);

        // Create a PanelMenu.Button with a priority of 0
        this._indicator = new PanelMenu.Button(0, 'hebrew-date-display');

        // Create a label to display the text
        const label = new St.Label({
            style_class: 'panel-button',
            text: 'JDATE OK',
            y_align: 2 // Center vertically
        });

        // Add the label to the button
        this._indicator.add_child(label);

        // Add the button to the status area
        Main.panel.addToStatusArea('hebrew-date-display', this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
        console.log(`${this.metadata.uuid}: Extension disabled.`);
    }
}
