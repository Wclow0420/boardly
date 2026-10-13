// The privacy policy and terms of service live on the website, so the
// wording can be corrected without shipping a new version of the app.

import * as WebBrowser from "expo-web-browser";

const LEGAL_PAGES = {
  privacy: "https://boardly.lol/privacy",
  terms: "https://boardly.lol/terms",
};

export type LegalPage = keyof typeof LEGAL_PAGES;

/** Opens one of the legal pages in a browser sheet over the app. */
export function openLegalPage(page: LegalPage) {
  WebBrowser.openBrowserAsync(LEGAL_PAGES[page]).catch(() => {
    // No browser to open it with; nothing useful to tell the player
  });
}
