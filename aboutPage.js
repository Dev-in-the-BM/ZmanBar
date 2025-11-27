
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import { gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const parseReadme = (readmeContent) => {
    const lines = readmeContent.split('\n');
    const features = [];
    let website = '';

    let inFeatures = false;
    for (const line of lines) {
        if (line.startsWith('## ✨ Features')) {
            inFeatures = true;
        } else if (line.startsWith('* ')) {
            if (inFeatures) {
                features.push(line.substring(2).trim());
            }
        } else if (line.startsWith('http')) {
            website = line.trim();
            inFeatures = false;
        }
    }

    return { features, website };
};

export const createAboutPage = (metadata) => {
    const aboutPage = new Adw.PreferencesPage({
        title: _('About'),
        iconName: 'info-symbolic',
    });

    const group = new Adw.PreferencesGroup();
    aboutPage.add(group);

    const clamp = new Adw.Clamp({
        maximum_size: 450,
        margin_top: 24,
        margin_bottom: 24,
    });
    group.add(clamp);

    const box = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 12,
    });
    clamp.set_child(box);

    // --- Extension Icon and Name ---
    if (metadata.icon) {
        const icon = new Gtk.Image({
            icon_name: metadata.icon,
            pixel_size: 64,
            margin_bottom: 12,
        });
        box.append(icon);
    }
    const nameLabel = new Gtk.Label({
        use_markup: true,
        label: `<span size="xx-large" weight="bold">${metadata.name}</span>`,
        justify: Gtk.Justification.CENTER,
    });
    box.append(nameLabel);
    box.append(new Gtk.Separator({ margin_top: 12, margin_bottom: 12 }));


    let readmeData = { features: [], website: metadata.url };
    try {
        const file = Gio.File.new_for_path(metadata.path + '/zmanbarreadme.md');
        const [success, contents] = file.load_contents(null);
        if (success) {
            const contentString = new TextDecoder().decode(contents);
            readmeData = parseReadme(contentString);
        }
    } catch (e) {
        logError(e, 'Error reading or parsing zmanbarreadme.md');
    }

    // --- Features ---
    if (readmeData.features.length > 0) {
        const featuresGroup = new Adw.PreferencesGroup({
            title: _('Features'),
        });
        box.append(featuresGroup);
        readmeData.features.forEach(feature => {
            featuresGroup.add(new Adw.ActionRow({ title: feature }));
        });
    }


    // --- General Info ---
    const infoGroup = new Adw.PreferencesGroup();
    box.append(infoGroup);

    const versionRow = new Adw.ActionRow({
        title: _('Version'),
        subtitle: `${metadata['version-name'] || metadata.version}`,
        icon_name: 'info-symbolic'
    });
    infoGroup.add(versionRow);


    if (readmeData.website) {
        const websiteRow = new Adw.ActionRow({
            title: _('Website'),
            subtitle: readmeData.website,
            icon_name: 'web-browser-symbolic',
            activatable: true,
        });
        websiteRow.connect('activated', () => {
            Gtk.show_uri(null, readmeData.website, Gtk.get_current_time());
        });
        infoGroup.add(websiteRow);
    }

    const developerRow = new Adw.ActionRow({
        title: _('Developer'),
        subtitle: metadata.developer || 'Unknown',
        icon_name: 'user-symbolic'
    });
    infoGroup.add(developerRow);


    return aboutPage;
};
