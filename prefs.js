
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class ZmanBarPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({
            title: 'Location Settings',
            description: 'Set your location to get accurate Zmanim.',
        });
        page.add(group);

        const row = new Adw.ActionRow({
            title: 'Location',
            subtitle: 'e.g., "New York, NY" or "90210"',
        });
        group.add(row);

        const locationEntry = new Gtk.Entry({
            placeholder_text: 'Enter your location',
            hexpand: true,
        });

        row.add_suffix(locationEntry);
        row.activatable_widget = locationEntry;

        const settings = this.getSettings();
        settings.bind('location-string', locationEntry, 'text', Gio.SettingsBindFlags.DEFAULT);

        window.add(page);
    }
}
