# ZmanBar - Hebrew Date for GNOME

![ZmanBar](https://github.com/Dev-in-the-BM/ZmanBar/blob/main/screenshot.png?raw=true)



## ✨ Features

* Displays the Hebrew date (day and month) in the top panel.
* Shows the full Hebrew date (including year) in the calendar menu.
* Lightweight and native, with minimal resource usage.

---

![get it on gnome extensions](https://github.com/Dev-in-the-BM/ZmanBar/blob/main/get_it_on_gnome_extensions.png?raw=true)

## ⚠️ Beta Limitation

This extension does not yet account for the Hebrew day changing at shkiah. **From shkiah until midnight, the displayed date will be a day behind.**
A fix is planned for a future release.


<details>
  <summary>Click to view instructions for installing from source</summary>

```sh
# 1. Clone the repository
git clone https://github.com/Dev-in-the-BM/ZmanBar.git

# 2. Copy the extension files
cp -r ZmanBar/ ~/.local/share/gnome-shell/extensions/ZmanBar@dev-in-the-bm.github.io/
```

3. Restart GNOME Shell (`Alt`+`F2`, `r`, `Enter` on X11, or log out/in on Wayland).
4. Enable "ZmanBar" in the Extensions app.

</details>

## 🛠️ Development

ZmanBar is a GNOME Shell extension written in modern JavaScript (ESM) for the GJS environment. It integrates with core GNOME components by modifying the existing clock and calendar menu labels (`St.Label`) to include the Hebrew date. Date calculations are handled by an adapted version of the `jewish-date` library.

Contributions are welcome! Feel free to open an issue or submit a pull request.

## ❤️ Support This Project

If you find this extension useful, please consider supporting its development.

<a href="https://www.buymeacoffee.com/devinthebm" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## 📜 License

This project is licensed under the GPL-3.0-or-later.

