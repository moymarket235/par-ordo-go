# PAR ORDO GO — CRM-gated login (no SMS OTP) + launcher logo

## Frontend behavior now
- Phone number is checked through `POST /api/go/lookup`.
- If `inBase: true`, the form switches to **Войти**.
- If the lookup succeeds and `inBase: false`, the form shows **Регистрация** but keeps it disabled and explains that staff must add the phone to the PAR ORDO PRO customer database first.
- A failed lookup is shown as a network/service error, not as “not found”.
- A session already stored on this device can enter only when its stored phone matches the checked CRM phone.
- No SMS code is sent or requested.
- A new device submits `POST /api/go/login` with `{ phone, deviceId }`. The UI expects a token + account on success. A 403 / `device_approval_required` means a staff member must approve the device in PAR ORDO PRO.

## Required Worker endpoint (not present in the public frontend repository)
Implement `POST /api/go/login` in the Cloudflare Worker:
1. Normalize the phone to E.164 and verify it exists in the PAR ORDO PRO customer base.
2. Verify the submitted `deviceId` is approved for that CRM customer by an employee. Never create a GO session from a phone-number-only request.
3. If not approved, return HTTP 403 with `{ "code": "device_approval_required" }`.
4. If approved, issue a normal GO bearer token and return `{ "token": "...", "account": { "id": "...", "phone": "...", "first": "...", "last": "...", "middle": "...", "verified": true } }`.
5. Keep `/api/go/me` restricted to that bearer token; it must return the same visits and bonus history linked to the CRM customer.

The Worker source was not present in the supplied public GitHub repositories, so this patch prepares the frontend contract but does not claim the new-device login is live until the Worker route and staff approval control are deployed.

## Launcher icon
- Android manifest uses the circular PAR ORDO sauna logo for legacy and adaptive launcher icons.
- Android version advanced to 1.0.1 / versionCode 2.
- APK download buttons are intentionally disabled and display **APK версия — СКОРО** in both the registration screen and the home screen. PWA installation remains available.
- Service Worker cache advanced to `po-go-v23` so the site refreshes the updated UI.

## Deployment
Commit the included `index.html`, `sw.js`, and this README to the `main` branch. GitHub Pages should deploy the updated web UI. APK downloads remain paused until the Android release is ready; the existing Android workflow is left in place for a future launch.
