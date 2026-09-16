# KFC Bangladesh 20 Years — Interactive Camera Experience

This is a mobile-first, browser-based camera experience. A customer scans a QR code, taps **Open camera**, and can rotate the anniversary mnemonic 360° with one finger. Two fingers resize it, and a double-tap resets it.

## What this version is

This version places the mnemonic over the live rear-camera view and works without installing an app. It is designed for broad compatibility on modern iPhone and Android browsers.

It is not yet a surface-tracked world object. A future version can add floor/table placement after an approved 3D `.glb` model is available. The current version gives the requested QR → camera → interactive 360° experience with fewer compatibility problems.

## Approved mnemonic artwork

The approved transparent artwork is already installed as `assets/mnemonic.png`. It is used unchanged on both sides of the rotating object.

To update it later, export the replacement as a transparent PNG, name it `mnemonic.png`, and replace the existing file. Keep the same filename so no code changes are needed. For fast loading on mobile data, keep the file below roughly 1 MB.

## Publish on GitHub Pages — touch by touch

### A. Create the repository

1. Sign in to GitHub.
2. Tap the **+** button at the top-right.
3. Tap **New repository**.
4. In **Repository name**, type `kfc-20-years-ar`.
5. Select **Public**. GitHub Pages can then be viewed by customers.
6. Do not add a README, `.gitignore`, or license because this package already contains the files.
7. Tap **Create repository**.

### B. Upload this project

1. On the empty repository page, tap **uploading an existing file**.
2. Unzip the downloaded project package on your computer first.
3. Drag all the unzipped files and the `assets` folder into GitHub’s upload area. `index.html` must be at the top level, not inside another folder.
4. Wait until every file appears in the upload list.
5. In the commit message, type `Add KFC 20 Years AR experience`.
6. Tap **Commit changes**.

### C. Turn on GitHub Pages

1. Inside the repository, tap **Settings**.
2. In the left menu, tap **Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Under **Branch**, select `main` and select `/(root)`.
5. Tap **Save**.
6. Wait 2–5 minutes, then refresh the Pages settings screen.
7. GitHub will show a link similar to `https://YOUR-USERNAME.github.io/kfc-20-years-ar/`.
8. Open that link on your phone. GitHub Pages provides HTTPS, which is required for camera permission.

### D. Create and download the QR code

1. Add `qr.html` to the end of the published address, for example: `https://YOUR-USERNAME.github.io/kfc-20-years-ar/qr.html`.
2. Open that page.
3. Confirm the experience link shown in the box.
4. Tap **Generate QR**.
5. Tap **Download PNG**.
6. Place the downloaded QR code on your print or digital communication.

### E. Test before public use

1. Do not test by scanning the QR on the same phone that displays it. Show the QR on another screen or print it.
2. Scan with an iPhone and an Android phone.
3. Tap **Open camera** and allow camera access.
4. Drag left/right and up/down.
5. Pinch with two fingers.
6. Double-tap to reset.
7. Test on both Wi-Fi and mobile data.
8. Check the QR at the real printed size and from the expected scanning distance.

## Update the artwork later

1. Open the GitHub repository.
2. Open the `assets` folder.
3. Use **Add file → Upload files**.
4. Upload the replacement file with the exact name `mnemonic.png`.
5. Confirm the replacement and tap **Commit changes**.

GitHub Pages normally updates within a few minutes. The QR code does not need to change because the page URL stays the same.

## Important camera note

Camera access works only on HTTPS or localhost. It will not work if `index.html` is opened directly from a phone’s Files app. Test the published GitHub Pages URL.

## Future surface-tracked AR

The approved PNG is suitable for the current camera-overlay experience. True floor or table placement would additionally require an optimized `.glb` model for Android/WebXR and a `.usdz` model for iPhone Quick Look.
