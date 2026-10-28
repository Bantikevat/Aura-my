# AURA FormPilot (Chrome extension)

Fills job application forms from your AURA career vault. It never clicks Submit, never solves CAPTCHA/OTP, and
leaves questions it can't answer (e.g. work authorisation) highlighted in red for you.

## Install (once)
1. Chrome → `chrome://extensions` → turn on **Developer mode**.
2. **Load unpacked** → select this `extension` folder.
3. Start AURA (`npm run frontend`), open **Career World**, fill the profile and **Save profile**.
   The extension syncs it automatically while that tab is open (once is enough; it is then stored in the extension).
4. Click the extension icon → **Add resume** (PDF) once.

## Daily use
Open a job form → press **Alt+Shift+F** (or click the extension → *Fill this form*).
Gold outline = filled by AURA. Red outline = your answer needed. Review, then submit yourself.

## Limits
- Matches fields by label/placeholder/name. Unusual custom widgets (some Workday/Taleo dropdowns) may need a manual click.
- Yes/No screening questions are never guessed.
- Resume attach works on standard file inputs; a few sites block programmatic uploads.
