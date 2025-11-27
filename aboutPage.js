
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import { gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export const createAboutPage = (metadata) => {
    const aboutPage = new Adw.PreferencesPage({
        title: _('About'),
        iconName: 'info-symbolic',
    });

    const extensionGroup = new Adw.PreferencesGroup({
        title: _('About this Extension'),
    });
    aboutPage.add(extensionGroup);

    const versionRow = new Adw.ActionRow({
        title: _('Version'),
        subtitle: metadata['version-name'] ? metadata['version-name'].toString() : '',
    });
    extensionGroup.add(versionRow);

    const descriptionRow = new Adw.ActionRow({
        title: _('Description'),
        subtitle: metadata.description || 'No description available.',
    });
    extensionGroup.add(descriptionRow);

    const websiteRow = new Adw.ActionRow({
        title: _('Website'),
        subtitle: metadata.url || 'No website available.',
        activatable: true,
    });
    websiteRow.connect('activated', () => {
        if (metadata.url) {
            Gtk.show_uri(null, metadata.url, Gtk.get_current_time());
        }
    });
    extensionGroup.add(websiteRow);

    const developerGroup = new Adw.PreferencesGroup({
        title: _('About the Developer'),
    });
    aboutPage.add(developerGroup);

    const developerRow = new Adw.ActionRow({
        title: _('Developer'),
        subtitle: metadata.developer || 'Unknown',
    });
    developerGroup.add(developerRow);

    return aboutPage;
};
