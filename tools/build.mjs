import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("..", import.meta.url));
const articles = JSON.parse(
  await readFile(join(root, "_portfolio/articles.json"), "utf8"),
);
const projects = JSON.parse(
  await readFile(join(root, "_portfolio/projects.json"), "utf8"),
);
const origin = "https://qinjianxyz.github.io";
const esc = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const t = (l, zh, en) => (l === "zh" ? zh : en);
const local = (l, path = "") => `${l === "en" ? "/en/" : "/"}${path}`;
const arrow = '<span aria-hidden="true">↗</span>';
const photos = [
  ["ray-speaking", "main", "演讲现场", "On stage", "Ray speaking at a podium"],
  [
    "autonomous-car",
    "car",
    "自动驾驶小车",
    "Autonomous car",
    "The autonomous car project, with a camera and onboard computer",
  ],
  [
    "trail-running",
    "run",
    "越野跑",
    "On the trail",
    "Ray running on a hillside trail",
  ],
  [
    "ray-outdoors",
    "outdoors",
    "旅途中",
    "Out exploring",
    "Ray outdoors on a trip",
  ],
  [
    "strength",
    "strength",
    "力量训练",
    "Strength training",
    "Ray strength training",
  ],
];
const routes = [];
function header(l, page, path) {
  const nav = [
    ["work.html", "work", t(l, "工程与实践", "Work")],
    ["writing.html", "writing", t(l, "文章", "Writing")],
    ["about.html", "about", t(l, "关于我", "About")],
  ];
  return `<a class="skip-link" href="#main">${t(l, "跳到正文", "Skip to content")}</a><header class="site-header"><div class="wrap header-inner"><a class="wordmark" href="${local(l)}" aria-label="${t(l, "Ray Qin · 首页", "Ray Qin · Home")}">Ray Qin<span lang="zh-CN">秦剑</span></a><nav class="desktop-nav" aria-label="${t(l, "主导航", "Main navigation")}">${nav.map(([href, id, label]) => `<a href="${local(l, href)}"${page === id ? ' aria-current="page"' : ""}>${label}</a>`).join("")}<a href="${local(l, "#contact")}">${t(l, "联系", "Contact")} ${arrow}</a></nav><div class="header-controls"><a class="language-link" href="${local(l === "zh" ? "en" : "zh", path)}" lang="${l === "zh" ? "en" : "zh-CN"}" aria-label="${l === "zh" ? "Read this page in English" : "用中文阅读此页"}">${l === "zh" ? "EN" : "中文"}</a><details class="mobile-menu"><summary>${t(l, "菜单", "Menu")}<span class="menu-lines" aria-hidden="true"></span></summary><nav aria-label="${t(l, "手机导航", "Mobile navigation")}">${nav.map(([href, id, label]) => `<a href="${local(l, href)}"${page === id ? ' aria-current="page"' : ""}>${label}</a>`).join("")}<a href="${local(l, "#contact")}">${t(l, "联系", "Contact")} ${arrow}</a></nav></details></div></div></header>`;
}
function footer(l) {
  return `<footer class="site-footer wrap"><div class="footer-line"><a class="wordmark" href="${local(l)}">Ray Qin<span lang="zh-CN">秦剑</span></a><p>${t(l, "保持好奇，也保留改变主意的自由。", "Stay curious. Leave room to change your mind.")}</p><a href="#top" class="back-top">${t(l, "回到顶部", "Back to top")} ↑</a></div><div class="footer-meta"><span>© 2026 Ray Qin</span><div><a href="/resume.html">${t(l, "简历", "Résumé")}</a><a href="https://github.com/qinjianxyz">GitHub ${arrow}</a><a href="https://x.com/rayq_ai">X ${arrow}</a><a href="/pulse/privacy.html">Pulse ${t(l, "隐私", "privacy")}</a><a href="/life-garden/privacy.html">Life Garden ${t(l, "隐私", "privacy")}</a></div></div></footer>`;
}
function contact(l) {
  return `<section class="contact-section wrap" id="contact"><div><p class="eyebrow">${t(l, "从一个具体问题开始", "Start with a real question")}</p><h2>${t(l, "有交集，就聊聊。", "Something in common? Let’s talk.")}</h2></div><div class="contact-copy"><p>${t(l, "一个想做的产品、一个还没想明白的问题，或者一种不同的看法。工程合作、研究交流，或只是聊聊，都可以。", "A product you want to build, a question you’re working through, or a different point of view. I’m open to engineering collaborations, research conversations, and a good exchange of ideas.")}</p><a class="email-link" href="mailto:qinjianxyz@gmail.com">qinjianxyz@gmail.com ${arrow}</a><div class="social-links"><a href="https://x.com/rayq_ai">X / @rayq_ai ${arrow}</a><a href="https://t.me/rayq_ai">Telegram ${arrow}</a><a href="https://github.com/qinjianxyz">GitHub ${arrow}</a></div></div></section>`;
}
function shell(l, path, page, title, description, body, article) {
  const url = origin + local(l, path);
  const structured = article
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: article.title,
        datePublished: article.publishedAt,
        author: {
          "@type": "Person",
          name: "Ray Qin",
          url: origin + "/about.html",
        },
        inLanguage: "en",
        mainEntityOfPage: url,
        isBasedOn: article.sourceUrl,
      }
    : {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: title,
        url,
        inLanguage: l === "zh" ? "zh-CN" : "en",
      };
  return `<!doctype html>\n<html lang="${l === "zh" ? "zh-CN" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} · Ray Qin</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#f7f5ef"><link rel="icon" href="/favicon.ico"><link rel="canonical" href="${url}"><link rel="alternate" hreflang="zh-CN" href="${origin + local("zh", path)}"><link rel="alternate" hreflang="en" href="${origin + local("en", path)}"><link rel="alternate" hreflang="x-default" href="${origin + local("zh", path)}"><meta property="og:type" content="${article ? "article" : "website"}"><meta property="og:title" content="${esc(title)} · Ray Qin"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${origin}/media/education/ray-outdoors.jpg"><meta property="og:image:alt" content="${t(l, "Ray 在旅途中", "Ray outdoors on a trip")}"><meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="/assets/ray.css"><script src="/assets/ray.js" defer></script><script type="application/ld+json">${JSON.stringify(structured).replaceAll("<", "\\u003c")}</script></head><body id="top" class="page-${page}">${header(l, page, path)}<main id="main">${body}</main>${footer(l)}<dialog class="image-dialog" aria-label="${t(l, "照片与作品大图", "Photo and project image viewer")}"><button class="dialog-close" aria-label="${t(l, "关闭大图", "Close image")}">${t(l, "关闭", "Close")} ×</button><img alt=""><p></p><div class="dialog-navigation"><button class="image-previous" aria-label="${t(l,"上一张图片","Previous image")}">← ${t(l,"上一张","Previous")}</button><span class="image-count" role="status" aria-live="polite"></span><button class="image-next" aria-label="${t(l,"下一张图片","Next image")}">${t(l,"下一张","Next")} →</button></div></dialog></body></html>\n`;
}
function board(l) {
  return `<div class="memory-board" aria-label="${t(l, "我的工作与生活照片", "A few moments from my work and life")}"><span class="board-label">${t(l, "工作，也生活。", "Work. And a life beyond it.")}</span>${photos.map(([id, cls, zh, en, alt], i) => `<button class="memory memory-${cls}" data-image="/media/education/${id}.jpg" data-caption="${esc(t(l, zh, en))}" aria-label="${t(l, "放大照片：", "Enlarge photo: ") + esc(t(l, zh, en))}"><img src="/media/education/${id}-640.jpg" alt="${esc(alt)}" width="640" height="640" ${i === 0 ? 'fetchpriority="high"' : 'loading="eager"'}><span class="memory-caption"><span>0${i + 1}</span>${t(l, zh, en)}${arrow}</span></button>`).join("")}<p class="board-note" lang="zh-CN">琴心剑胆<br>静能生慧</p></div>`;
}
function articleLink(l, a, i, feature = false) {
  return `<a class="writing-row${feature ? " writing-feature" : ""}" href="${local(l, `writing/${a.slug}.html`)}"><span class="writing-index">0${i + 1}</span><div><div class="article-kicker">${a === articles[0] ? "AI · BITCOIN · " + t(l, "选择", "CHOICE") : "CRYPTOGRAPHY · " + t(l, "规则", "RULES")}</div><h3 lang="en">${esc(a.title)}</h3>${feature ? '<blockquote lang="en">“Human value was never identical to industrial value.”</blockquote>' : ""}<p>${esc(a.summary[l])}</p><span class="article-date"><time datetime="${a.publishedAt}">${a.publishedAt.slice(0, 10).replaceAll("-", " / ")}</time><span>${a.readMinutes} ${t(l, "分钟 · 英文原文", "min read · English")}</span></span></div><span class="article-arrow" aria-hidden="true">↗</span></a>`;
}
function home(l) {
  return `<section class="hero wrap"><div class="hero-copy"><p class="eyebrow">${t(l, "秦剑 · 工程师，写作者，Bitcoiner", "Engineer. Writer. Bitcoiner.")}</p><h1>${t(l, "把技术，<br>做进<span>真实的生活。</span>", "Technology,<br>put to work in<br><span>the real world.</span>")}</h1><p class="hero-intro">${t(l, "我是 Ray。我构建软件，探索个人 AI，也写下对技术、Bitcoin 和现实生活的思考。", "I’m Ray. I build software, explore personal AI, and write about technology, Bitcoin, and everyday life.")}</p><p class="hero-question">${t(l, '我关心能做出什么，也关心这些能力，<br class="desktop-break">最终让人拥有怎样的选择。', "I care about what we can build—and the choices it makes possible.")}</p><div class="hero-actions"><a class="button" href="${local(l, "work.html")}">${t(l, "看我的工作", "Explore my work")} ${arrow}</a><a class="text-link" href="${local(l, "writing.html")}">${t(l, "读我的文章", "Read my writing")} →</a></div></div>${board(l)}</section>
<section class="background-line wrap" aria-label="${t(l, "背景", "Background")}"><p><span>${t(l, "曾任", "Previously")}</span> ZipRecruiter <small>Senior Software Engineer</small></p><p><span>${t(l, "毕业于", "Studied at")}</span> UC San Diego <small>${t(l, "机械工程 · 数学–计算机科学", "Mechanical Engineering · Mathematics–CS")}</small></p><a href="${local(l, "about.html")}">${t(l, "更多关于我", "More about me")} ${arrow}</a></section>
<section class="section wrap" id="selected-work"><div class="section-heading"><div><p class="eyebrow">01 / ${t(l, "把想法做出来", "Making ideas tangible")}</p><h2>${t(l, "工程与实践", "Selected work")}</h2></div><p>${t(l, "代码需要运行，硬件需要落地。<br>这些工作，是我理解世界的一种方式。", "Code has to run. Hardware has to work.<br>Building is one way I make sense of the world.")}</p></div><div class="home-projects"><article class="home-project car-project"><a class="project-visual hardware-visual" href="${local(l, "work.html#autonomous-vehicle")}"><img src="/media/education/autonomous-car.jpg" alt="${t(l, "真实的自动驾驶小车，装有摄像头和嵌入式计算机", "The autonomous car, with its camera and onboard computer")}" width="1200" height="900" loading="lazy"><span class="visual-link">${t(l, "看项目", "View project")} ${arrow}</span></a><div class="project-caption"><p class="eyebrow">ROBOTICS · ${t(l, "过往工程项目", "PAST PROJECT")}</p><h3><a href="${local(l, "work.html#autonomous-vehicle")}">${t(l, "从代码，到真实的小车。", "From code to a car that moves.")}</a></h3><p>${t(l, "把感知、车道跟随和控制接在一起。真实世界，是另一种测试环境。", "Connecting perception, lane following, and control. The real world is a different kind of test environment.")}</p><p class="project-proof">${t(l, "我的工作：Jetson Nano 车道跟随与视觉检测流程。", "My work: lane following on Jetson Nano and a vision pipeline.")}</p></div></article><article class="home-project garden-project"><a class="project-visual garden-visual" href="${local(l, "work.html#life-garden")}"><span class="visual-overline">Life Garden</span><img src="/media/work/life-garden.png" alt="${t(l, "Life Garden 开发版界面，使用虚构示例记录", "Life Garden development screen with fictional sample records")}" width="1206" height="2622" loading="lazy"><span class="visual-link">${t(l, "开发版 · 示例记录", "Development build · Sample records")} ${arrow}</span></a><div class="project-caption"><p class="eyebrow">LIFE GARDEN · ${t(l, "开发原型", "DEVELOPMENT PROTOTYPE")}</p><h3><a href="${local(l, "work.html#life-garden")}">${t(l, "给日常，留一点生长的空间。", "A little room for life to grow.")}</a></h3><p>${t(l, "让日记、习惯与专注记录，在一座花园里留下痕迹。", "A garden shaped by journal entries, habits, and time spent focusing.")}</p><p class="project-proof">${t(l, "已做：Today 界面原型；展示使用虚构记录。", "Built so far: a Today-screen prototype, shown with fictional records.")}</p></div></article></div><div class="project-continuation"><span>${t(l, "也在探索", "Also exploring")}</span><a href="${local(l, "work.html#anvil-sim")}">Anvil Sim ${arrow}</a><a href="${local(l, "work.html#enterprise-os")}">Enterprise OS ${arrow}</a><a href="${local(l, "work.html#pulse")}">Pulse ${arrow}</a><a class="all-work" href="${local(l, "work.html")}">${t(l, "全部工程与实践", "All work & practice")} →</a></div></section>
<section class="writing-section"><div class="wrap"><div class="section-heading"><div><p class="eyebrow">02 / ${t(l, "把想法写下来", "Thinking out loud")}</p><h2>${t(l, "技术、所有权与选择。", "Technology, ownership, and choice.")}</h2></div><p>${t(l, "关于能力、所有权与选择。<br>也给自己的判断，留下被反驳的空间。", "On capability, ownership, and choice.<br>Ideas worth writing down—and questioning.")}</p></div>${articles.map((a, i) => articleLink(l, a, i, i === 0)).join("")}<a class="text-link writing-all" href="${local(l, "writing.html")}">${t(l, "文章与思考", "Writing & ideas")} →</a></div></section>
<section class="life-section wrap"><div class="life-heading"><p class="eyebrow">03 / ${t(l, "生活，是目的", "The life behind the work")}</p><h2>${t(l, "能创造，<br>也有时间生活。", "Room to build.<br>Time to live.")}</h2><a class="text-link" href="${local(l, "about.html")}">${t(l, "认识我", "A little more about me")} →</a></div><div class="life-copy"><blockquote lang="en">“Wisdom, to me, is not about defeating everyone else. It is about whether you actually obtained what you wanted from your limited time in this world.”</blockquote><a class="quote-source" href="${local(l, `writing/${articles[0].slug}.html#p3`)}">Ray Qin · ${t(l, "摘自", "From")} <cite>AI, Bitcoin, and the Right to Choose</cite> ${arrow}</a><p>${t(l, "运动、学习、家人、朋友，以及能够决定自己怎样度过一天的自由，都是我在意的事。", "Movement, learning, family, friendship, and a say in how I spend my days all matter to me.")}</p></div></section>${contact(l)}`;
}
const imageDimensions = {
  "anvil-sim": [1000, 562],
  "autonomous-vehicle": [1400, 1050],
  "life-garden": [1206, 2622],
  pulse: [750, 1334],
};
function imageButton(l, p) {
  if (!p.image) return "";
  return `<figure class="case-image case-image-${p.id}"><button class="image-button" data-image="${p.image.src}" data-caption="${esc(p.image.caption[l])}" aria-label="${t(l, "放大", "Enlarge ") + p.name}"><img src="${p.image.src}" alt="${esc(p.image.alt[l])}" width="${imageDimensions[p.id][0]}" height="${imageDimensions[p.id][1]}" loading="lazy"><span class="enlarge-label">${t(l, "查看大图", "View full image")} ${arrow}</span></button><figcaption>${esc(p.image.caption[l])}</figcaption></figure>`;
}
function work(l) {
  return `<section class="page-intro wrap"><p class="eyebrow">${t(l, "工程与实践", "Work & practice")}</p><h1>${t(l, "从问题，<br>到能检查的作品。", "From a question<br>to something real.")}</h1><div class="intro-split"><p class="lede">${t(l, "机械工程与数学–计算机科学的背景，让我习惯在软件、硬件和现实约束之间来回思考。", "My background in mechanical engineering and mathematics–computer science keeps me moving between software, hardware, and the constraints of the real world.")}</p><p>${t(l, "曾任 ZipRecruiter Senior Software Engineer。这里记录一些独立产品、研发原型与过往工程项目：做了什么，为什么这样做，以及现在的边界。", "Previously a Senior Software Engineer at ZipRecruiter. Here are selected product experiments, research prototypes, and past engineering projects: what they do, the choices behind them, and their limits today.")}</p></div><a class="text-link" href="/resume.html">${t(l, "查看完整简历", "Read my résumé")} ${arrow}</a></section><section class="professional-work wrap"><div class="professional-heading"><p class="eyebrow">${t(l, "职业经历 / ZipRecruiter", "Professional work / ZipRecruiter")}</p><h2>${t(l, "做过真实产品的工程。", "Engineering in real products.")}</h2></div><div class="professional-columns"><article><h3>${t(l, "认证系统", "Authentication systems")}</h3><p>${t(l, "参与注册与认证系统的重构，开发共享的 React/Next.js 与 Go/gRPC 服务，支持验证码和自动登录，并推动多个产品团队采用。", "Worked on rebuilding registration and authentication with shared React/Next.js and Go/gRPC services for one-time codes and automatic login across product teams.")}</p></article><article><h3>${t(l, "推荐与检索", "Recommendations & retrieval")}</h3><p>${t(l, "为职位与候选人推荐构建基于嵌入向量的检索流程，把相似度搜索、混合检索和过滤接入具体产品功能。", "Built embedding-based retrieval for job and candidate recommendations, bringing similarity search, hybrid retrieval, and filtering into product features.")}</p></article></div></section><nav class="project-nav wrap" aria-label="${t(l, "跳到项目", "Jump to project")}">${projects.map((p) => `<a href="#${p.id}">${p.name}</a>`).join("")}</nav><div class="work-cases wrap">${projects.map((p, i) => `<article class="work-case${p.image ? "" : " text-case"}" id="${p.id}"><div class="case-top"><p class="case-number">0${i + 1} / ${esc(p.eyebrow[l])}</p><span class="status">${esc(p.status[l])}</span></div><div class="case-grid"><div class="case-heading"><h2>${esc(p.name)}</h2><h3>${esc(p.title[l])}</h3><p class="case-summary">${esc(p.summary[l])}</p></div>${imageButton(l, p)}<div class="case-content"><div class="case-detail"><h4>${t(l, "做的部分", "The work")}</h4><p>${esc(p.contribution[l])}</p><h4>${t(l, "一个重要选择", "A choice that matters")}</h4><p>${esc(p.decision[l])}</p></div><p class="case-boundary"><span>${t(l, "当前边界", "Current scope")}</span>${esc(p.boundary[l])}</p><ul class="skill-list" aria-label="${t(l, "相关技术", "Related technologies")}">${p.skills.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div></div></article>`).join("")}</div><section class="work-note wrap"><p class="eyebrow">${t(l, "合作，从问题本身开始", "Collaboration starts with the problem")}</p><h2>${t(l, "把复杂的事，做得可理解、可验证。", "Make complex things understandable—and testable.")}</h2><p>${t(l, "如果你的项目需要把工程想法变成可运行的原型，或者把已有产品的交互与可靠性往前推进，欢迎带着具体的问题来聊。", "If your project needs a working prototype, or a clearer and more reliable product experience, I’d be glad to talk through the problem.")}</p><a class="button" href="mailto:qinjianxyz@gmail.com">${t(l, "写信给我", "Get in touch")} ${arrow}</a></section>`;
}
function writing(l) {
  return `<section class="page-intro writing-intro wrap"><p class="eyebrow">${t(l, "文章与思考", "Writing & ideas")}</p><h1>${t(l, "想法，<br>值得认真对待。", "Ideas worth<br>thinking through.")}</h1><p class="lede">${t(l, "我写技术、Bitcoin、制度，也写一个人怎样拥有自己的生活。写下来，是为了说清楚，也为了继续想。", "I write about technology, Bitcoin, institutions, and having a say in your own life. Writing is a way to make an idea clearer—and keep thinking.")}</p><div class="writing-topics"><span>Technology</span><span>Bitcoin</span><span>${t(l, "制度与自主性", "Institutions & autonomy")}</span><span>${t(l, "真实生活", "Everyday life")}</span></div></section><section class="writing-list wrap" aria-label="${t(l, "精选文章", "Selected essays")}">${articles.map((a, i) => articleLink(l, a, i, i === 0)).join("")}</section><section class="writing-footnote wrap"><p>${t(l, "这里是精选文章。日常的表达、讨论与还没想明白的问题，继续留在 X。", "These are selected essays. Everyday observations, conversations, and unfinished thoughts continue on X.")}</p><a class="text-link" href="https://x.com/rayq_ai">@rayq_ai ${arrow}</a></section>${contact(l)}`;
}
function articlePage(l, a) {
  const labels =
    a === articles[0]
      ? [
          "Technology & choice",
          "Money as stored choice",
          "A life worth living",
          "Ownership & abundance",
          "Rules across borders",
          "The systems we build",
        ]
      : [
          "Rethinking anarchy",
          "Rules and rulers",
          "Shared rules",
          "The power to verify",
          "A historical question",
          "Rulerless, not ruleless",
        ];
  return `<div class="reading-progress" aria-hidden="true"></div><article class="essay"><header class="essay-header wrap"><a class="text-link back-link" href="${local(l, "writing.html")}">← ${t(l, "全部文章", "All writing")}</a><p class="eyebrow">${a === articles[0] ? "AI · BITCOIN · CHOICE" : "CRYPTOGRAPHY · RULES"}</p><h1 lang="en">${esc(a.title)}</h1><p class="essay-deck">${esc(a.summary[l])}</p><div class="essay-meta"><span>Ray Qin</span><time datetime="${a.publishedAt}">${a.publishedAt.slice(0, 10)} <abbr title="Coordinated Universal Time">UTC</abbr></time><span>${a.readMinutes} ${t(l, "分钟 · 英文原文", "min read · English original")}</span><a href="${a.sourceUrl}">${t(l, "X 原文", "Original on X")} ${arrow}</a></div></header><div class="essay-layout wrap"><aside class="essay-aside"><p class="eyebrow">${t(l, "本篇脉络", "In this essay")}</p><ol>${labels.map((s, i) => `<li><a href="#p${i + 1}"><span>0${i + 1}</span>${esc(s)}</a></li>`).join("")}</ol><button class="copy-link" data-copy-link>${t(l, "复制文章链接", "Copy article link")} ${arrow}</button><p class="copy-status" role="status" aria-live="polite"></p></aside><div class="essay-body" lang="en">${a.paragraphs.map((p, i) => `<p id="p${i + 1}">${esc(p)}</p>`).join("")}<div class="essay-end" aria-label="End of essay">Ray Qin <span>—</span> ${a.publishedAt.slice(0, 10)}</div></div></div></article><section class="related-writing wrap"><p class="eyebrow">${t(l, "继续阅读", "Keep reading")}</p>${articles
    .filter((x) => x !== a)
    .map((x, i) => articleLink(l, x, i))
    .join(
      "",
    )}<div class="essay-conversation"><p>${t(l, "有不同的看法？我也想听听。", "See it differently? I’d like to hear your perspective.")}</p><a class="text-link" href="${a.sourceUrl}">${t(l, "去 X 参与讨论", "Join the conversation on X")} ${arrow}</a></div></section>`;
}
function about(l) {
  return `<section class="about-hero wrap"><div><p class="eyebrow">${t(l, "关于我", "About me")}</p><h1>${t(l, "我是 Ray，<br>也是秦剑。", "I’m Ray.<br>Jian Qin, too.")}</h1><p class="lede">${t(l, "一个喜欢理解事物如何运转，也想亲手改进它们的人。", "I like understanding how things work—and getting my hands into them.")}</p><p>${t(l, "我做软件，关心 AI 和 Bitcoin，也喜欢跑山、训练和旅行。工程是我的底子；怎样把人生过好，是更长久的问题。", "I build software, think about AI and Bitcoin, and make time for trails, training, and travel. Engineering is my background. How to live well is a longer-running question.")}</p></div><figure><img src="/media/education/ray-outdoors.jpg" alt="Ray outdoors on a trip" width="900" height="1200"><figcaption>${t(l, "旅途中。工作之外，也有很大的世界。", "Out exploring. There’s a big world beyond the work.")}</figcaption></figure></section><section class="about-story wrap"><div><p class="eyebrow">${t(l, "一路走来", "A little background")}</p><h2>${t(l, "工程师的训练，<br>不只用来写代码。", "An engineering education,<br>beyond the code.")}</h2></div><div class="timeline"><article><h3>ZipRecruiter</h3><p class="timeline-role">Senior Software Engineer</p><p>${t(l, "曾从事全栈开发与 AI 项目。职业经历之外，也持续做自己的软件与硬件实验。", "I worked on full-stack development and AI projects, alongside software and hardware experiments of my own.")}</p></article><article><h3>UC San Diego</h3><p class="timeline-role">Dual B.S. · Cum Laude</p><p>${t(l, "机械工程与数学–计算机科学双学位。从物理系统，到计算与软件。", "Dual bachelor’s degrees in Mechanical Engineering and Mathematics–Computer Science. From physical systems to computation and software.")}</p></article><article><h3>San Domenico School</h3><p class="timeline-role">Veritas Award</p><p>${t(l, "学校授予毕业生的最高荣誉。", "The school’s highest honor for a graduating senior.")}</p></article><a class="text-link" href="/resume.html">${t(l, "完整简历", "Full résumé")} ${arrow}</a></div></section><section class="aspiration wrap"><p class="eyebrow">${t(l, "我想持续投入的事", "What I want to keep working on")}</p><div class="aspiration-grid"><article><span>01</span><h2>${t(l, "能力，属于个人。", "Capability, for individuals.")}</h2><p>${t(l, "个人 AI 吸引我的地方，是它有可能理解一个人长期的表达、选择与改变。Digital Clone 是我正在研究的方向。", "Personal AI interests me because it might make sense of a person’s writing, choices, and changes over time. Digital Clone is a direction I’m exploring.")}</p></article><article><span>02</span><h2>${t(l, "技术，也关乎规则。", "Technology is also about rules.")}</h2><p>${t(l, "作为 Bitcoiner，我在意的远不止价格。所有权、共同规则和拒绝的权利，是我愿意持续思考的问题。", "As a Bitcoiner, I care about more than price. Ownership, shared rules, and the right to say no are questions I want to keep thinking about.")}</p><a class="text-link" href="${local(l, `writing/${articles[0].slug}.html`)}">${t(l, "读我的思考", "Read the essay")} →</a></article><article><span>03</span><h2>${t(l, "创造，为了生活。", "Build for a life.")}</h2><p>${t(l, "我想给学习、运动、家人与朋友留出时间，也继续探索能源、自动化和农场。自主性，是日常生活里的具体选择。", "I want room for learning, movement, family, and friends, while continuing to explore energy, automation, and farming. Autonomy lives in everyday choices.")}</p></article></div></section>${contact(l)}`;
}
async function save(l, path, page, title, description, body, article) {
  const target = join(root, l === "en" ? "en" : "", path || "index.html");
  await mkdir(dirname(target), { recursive: true });
  await writeFile(
    target,
    shell(l, path, page, title, description, body, article),
  );
  routes.push(local(l, path));
}
for (const l of ["zh", "en"]) {
  await save(
    l,
    "",
    "home",
    t(l, "把技术，做进真实的生活", "Technology, put to work in the real world"),
    t(
      l,
      "Ray Qin 的工程实践、文章与生活。软件、个人 AI、Bitcoin，以及选择怎样生活的自由。",
      "Ray Qin’s engineering work, writing, and life. Software, personal AI, Bitcoin, and the freedom to choose.",
    ),
    home(l),
  );
  await save(
    l,
    "work.html",
    "work",
    t(l, "工程与实践", "Work & practice"),
    t(
      l,
      "Anvil Sim、自动驾驶、Life Garden、Enterprise OS 与 Pulse：具体工作、工程取舍和当前边界。",
      "Selected engineering work: Anvil Sim, autonomous driving, Life Garden, Enterprise OS, and Pulse.",
    ),
    work(l),
  );
  await save(
    l,
    "writing.html",
    "writing",
    t(l, "文章与思考", "Writing & ideas"),
    t(
      l,
      "Ray Qin 关于技术、Bitcoin、制度与自主性的精选文章。",
      "Selected essays by Ray Qin on technology, Bitcoin, institutions, and autonomy.",
    ),
    writing(l),
  );
  await save(
    l,
    "about.html",
    "about",
    t(l, "关于秦剑", "About Ray"),
    t(
      l,
      "工程师、写作者与 Bitcoiner。Ray Qin 的背景、兴趣与想持续投入的事情。",
      "Engineer, writer, and Bitcoiner. Ray Qin’s background, interests, and work ahead.",
    ),
    about(l),
  );
  for (const a of articles)
    await save(
      l,
      `writing/${a.slug}.html`,
      "writing",
      a.title,
      a.summary[l],
      articlePage(l, a),
      a,
    );
}
for (const path of ["index.html", "work.html", "about.html", "writing.html"]) {
  const dest = path === "index.html" ? "/" : "/" + path;
  await mkdir(join(root, "zh"), { recursive: true });
  await writeFile(
    join(root, "zh", path),
    `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>Ray Qin</title><meta http-equiv="refresh" content="0;url=${dest}"><link rel="canonical" href="${origin + dest}"><p><a href="${dest}">前往 Ray Qin 的网站</a></p></html>\n`,
  );
}
const extra = [
  "/resume.html",
  "/pulse/privacy.html",
  "/pulse/support.html",
  "/life-garden/privacy.html",
  "/life-garden/support.html",
];
await writeFile(
  join(root, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...routes, ...extra].map((p) => `  <url><loc>${origin + p}</loc></url>`).join("\n")}\n</urlset>\n`,
);
console.log(
  `Built ${routes.length} pages, 4 language aliases, and sitemap. No dependencies or network access.`,
);
