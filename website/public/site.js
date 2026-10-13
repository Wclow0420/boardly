// Shared by every page: store links and the three languages the app
// speaks (English, Malay, Chinese).

// Fill these in once the app is live on each store. While one is empty
// its button reads "Coming soon".
const APP_STORE_URL = "";
const PLAY_STORE_URL = "";

// The app's own link scheme, for the "Open in Boardly" button. Browsers
// inside chat apps often skip the automatic hand-off to the app, so the
// page offers it by hand too.
const APP_SCHEME = "boardly";

const STRINGS = {
  en: {
    tagline: "Game night, anywhere.",
    homeBody: "Board and party games to play with your friends, on your phone.",
    inviteTitle: "You're invited to a table",
    inviteBody: "Open Boardly to take your seat.",
    codeLabel: "Table code",
    copy: "Copy code",
    copied: "Copied",
    open: "Open in Boardly",
    getApp: "Don't have Boardly yet?",
    step1: "Get the app and create an account.",
    step2: "Tap “Join with a code” and enter the table code.",
    appStore: "Download on the App Store",
    playStore: "Get it on Google Play",
    appStoreSoon: "Coming soon to the App Store",
    playStoreSoon: "Coming soon to Google Play",
    badLink: "This invite link doesn't look right",
    badLinkBody: "Ask your friend to send the table code again.",
  },
  ms: {
    tagline: "Malam permainan, di mana-mana.",
    homeBody: "Permainan papan dan parti untuk dimainkan bersama rakan, di telefon anda.",
    inviteTitle: "Anda dijemput ke sebuah meja",
    inviteBody: "Buka Boardly untuk mengambil tempat anda.",
    codeLabel: "Kod meja",
    copy: "Salin kod",
    copied: "Disalin",
    open: "Buka dalam Boardly",
    getApp: "Belum ada Boardly?",
    step1: "Dapatkan aplikasi dan cipta akaun.",
    step2: "Ketik “Sertai dengan kod” dan masukkan kod meja.",
    appStore: "Muat turun di App Store",
    playStore: "Dapatkan di Google Play",
    appStoreSoon: "Akan datang di App Store",
    playStoreSoon: "Akan datang di Google Play",
    badLink: "Pautan jemputan ini tidak betul",
    badLinkBody: "Minta rakan anda hantar kod meja sekali lagi.",
  },
  zh: {
    tagline: "随时随地，开一局。",
    homeBody: "在手机上和朋友一起玩桌游和派对游戏。",
    inviteTitle: "有人邀请你加入牌桌",
    inviteBody: "打开 Boardly 入座。",
    codeLabel: "牌桌代码",
    copy: "复制代码",
    copied: "已复制",
    open: "在 Boardly 中打开",
    getApp: "还没有 Boardly？",
    step1: "下载应用并创建账号。",
    step2: "点击“输入代码加入”，填入牌桌代码。",
    appStore: "在 App Store 下载",
    playStore: "在 Google Play 获取",
    appStoreSoon: "即将登陆 App Store",
    playStoreSoon: "即将登陆 Google Play",
    badLink: "这个邀请链接有问题",
    badLinkBody: "请让朋友重新发送牌桌代码。",
  },
};

const language = (navigator.language || "en").slice(0, 2).toLowerCase();
const strings = STRINGS[language] || STRINGS.en;
document.documentElement.lang = STRINGS[language] ? language : "en";

function t(key) {
  return strings[key] || STRINGS.en[key] || key;
}

// Any element with data-t="key" gets that string.
for (const el of document.querySelectorAll("[data-t]")) {
  el.textContent = t(el.dataset.t);
}

// Store buttons: a real link once its address is filled in above.
function setUpStore(id, url, liveKey, soonKey) {
  const el = document.getElementById(id);
  if (!el) return;
  if (url) {
    el.href = url;
    el.textContent = t(liveKey);
  } else {
    el.removeAttribute("href");
    el.classList.add("store-soon");
    el.textContent = t(soonKey);
  }
}
setUpStore("app-store", APP_STORE_URL, "appStore", "appStoreSoon");
setUpStore("play-store", PLAY_STORE_URL, "playStore", "playStoreSoon");
