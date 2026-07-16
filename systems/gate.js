/*
 * gate.js — optional session guard for Design Language Kit pages.
 *
 * The kit ships ungated so it works offline. On the live site, any page that
 * includes this script will bounce locked visitors to the /systems/ gate.
 * The gate sets the session flag on a correct passphrase, so unlocking once
 * covers every guarded page for the rest of the tab session.
 *
 * Usage - add one line before </body> on any kit page you want guarded:
 *   <script src="/design-language-kit/gate.js"></script>
 *
 * Notes:
 *  - Does nothing when opened from disk (file://), preserving offline use.
 *  - sessionStorage is per-tab; a new tab shows the gate again. Same behavior
 *    as the original /systems gate.
 */
(function () {
  if (location.protocol === 'file:') return; // offline kit stays open
  var KEY = 'dunl_systems_unlocked';
  if (sessionStorage.getItem(KEY) !== '1') {
    location.replace('/systems/');
  }
})();
