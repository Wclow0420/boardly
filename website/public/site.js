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
    privacy: "Privacy",
    terms: "Terms",
    navCta: "Get the app",
    heroTitle: "Game night, anywhere.",
    heroBody: "Bluff your friends, back your team, betray them at the last second. All from your phone.",
    scrollHint: "Scroll to take a seat",
    dealKicker: "The games",
    dealTitle: "Six games. One table.",
    dealBody: "Hidden roles, bluffing, dice and the odd betrayal. Scroll to deal them out.",
    players: "{min}–{max} players",
    playersExact: "{min} players",
    gameAvalon: "Double Agent",
    gameAvalonTag: "Trust. Deceive. Expose.",
    gameCoup: "Hustle",
    gameCoupTag: "Bluff. Haggle. Win.",
    gameNightwatch: "Seal the Manor",
    gameNightwatchTag: "Light the seal before the ghosts break free.",
    gameLiarsdice: "Liar's Dice",
    gameLiarsdiceTag: "Bluff, call, drink.",
    gameManor: "Midnight Manor",
    gameManorTag: "Keep the old man alive until dawn.",
    gameTictactoe: "Tic-Tac-Toe",
    gameTictactoeTag: "Three in a row. Still tense.",
    howKicker: "How it works",
    step1Title: "Open a table",
    step1Body: "Pick a game and you've got a table. It takes one tap.",
    step2Title: "Share the code",
    step2Body: "Send the six-character code or the invite link to your group chat.",
    step3Title: "Everyone's in",
    step3Body: "Friends take their seats and the game deals itself. No board to set up, no pieces to lose.",
    rollKicker: "Go on",
    rollTitle: "Feeling lucky?",
    rollButton: "Roll the dice",
    rollQuips: ["Would your friends believe you?", "Call it, or bluff it?", "Somebody's lying."],
    marquee: "BLUFF · DEAL · BETRAY · LAUGH · REPEAT ·",
    ctaTitle: "Your table is waiting.",
    ctaBody: "Grab the app, grab your friends.",
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
    privacy: "Privasi",
    terms: "Terma",
    navCta: "Dapatkan aplikasi",
    heroTitle: "Malam permainan, di mana-mana.",
    heroBody: "Tipu rakan anda, sokong pasukan anda, khianati mereka pada saat akhir. Semuanya dari telefon anda.",
    scrollHint: "Tatal untuk ambil tempat",
    dealKicker: "Permainan",
    dealTitle: "Enam permainan. Satu meja.",
    dealBody: "Peranan rahsia, tipu helah, dadu dan sedikit pengkhianatan. Tatal untuk mengagihkan kad.",
    players: "{min}–{max} pemain",
    playersExact: "{min} pemain",
    gameAvalon: "Double Agent",
    gameAvalonTag: "Percaya. Perdaya. Dedah.",
    gameCoup: "Hustle",
    gameCoupTag: "Tipu. Cabar. Menang.",
    gameNightwatch: "Meterai Rumah Agam",
    gameNightwatchTag: "Nyalakan pelita meterai sebelum hantu terlepas.",
    gameLiarsdice: "Dadu Penipu",
    gameLiarsdiceTag: "Tipu, buka, minum.",
    gameManor: "Midnight Manor",
    gameManorTag: "Pastikan datuk tua hidup hingga subuh.",
    gameTictactoe: "Tic-Tac-Toe",
    gameTictactoeTag: "Tiga sebaris. Masih mendebarkan.",
    howKicker: "Cara ia berfungsi",
    step1Title: "Buka meja",
    step1Body: "Pilih permainan dan meja anda sedia. Hanya satu ketikan.",
    step2Title: "Kongsi kod",
    step2Body: "Hantar kod enam aksara atau pautan jemputan ke sembang kumpulan anda.",
    step3Title: "Semua sudah masuk",
    step3Body: "Rakan mengambil tempat dan permainan mengagih sendiri. Tiada papan untuk disusun, tiada buah yang hilang.",
    rollKicker: "Cubalah",
    rollTitle: "Rasa bertuah?",
    rollButton: "Baling dadu",
    rollQuips: ["Adakah rakan anda akan percaya?", "Buka, atau tipu?", "Ada yang menipu."],
    marquee: "TIPU · AGIH · KHIANAT · KETAWA · ULANG ·",
    ctaTitle: "Meja anda sedang menunggu.",
    ctaBody: "Dapatkan aplikasi, ajak rakan anda.",
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
    privacy: "隐私政策",
    terms: "服务条款",
    navCta: "获取应用",
    heroTitle: "随时随地，开一局。",
    heroBody: "骗过朋友，力挺队友，再在最后一刻背叛他们。全在手机上。",
    scrollHint: "向下滑动，入座",
    dealKicker: "游戏",
    dealTitle: "六款游戏，一张牌桌。",
    dealBody: "隐藏身份、吹牛、骰子，还有一点点背叛。向下滑动来发牌。",
    players: "{min}–{max} 人",
    playersExact: "{min} 人",
    gameAvalon: "双面间谍",
    gameAvalonTag: "信任 · 欺骗 · 揭穿",
    gameCoup: "夜市风云",
    gameCoupTag: "吹牛 · 质疑 · 称王",
    gameNightwatch: "守夜",
    gameNightwatchTag: "在鬼逃出来之前，点亮封印灯。",
    gameLiarsdice: "大话骰",
    gameLiarsdiceTag: "吹牛、开骰、喝！",
    gameManor: "午夜庄园",
    gameManorTag: "守护老爷爷，撑到天亮。",
    gameTictactoe: "井字棋",
    gameTictactoeTag: "三子连线，照样紧张。",
    howKicker: "怎么玩",
    step1Title: "开一张牌桌",
    step1Body: "选一款游戏，牌桌就开好了。只需点一下。",
    step2Title: "分享代码",
    step2Body: "把六位代码或邀请链接发到群聊里。",
    step3Title: "全员到齐",
    step3Body: "朋友入座，游戏自动发牌。不用摆棋盘，也不会丢棋子。",
    rollKicker: "来吧",
    rollTitle: "手气如何？",
    rollButton: "掷骰子",
    rollQuips: ["你的朋友会信吗？", "开，还是继续吹？", "有人在说谎。"],
    marquee: "吹牛 · 发牌 · 背叛 · 大笑 · 再来 ·",
    ctaTitle: "你的牌桌在等你。",
    ctaBody: "下载应用，叫上朋友。",
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
