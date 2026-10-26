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
import { artHome, artIndex, artDetail } from "./art.mjs";
const artworks = JSON.parse(await readFile(join(root, "_portfolio/artworks.json"), "utf8"));
const origin = "https://qinjianxyz.github.io";
const esc = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const t = (l, zh, en) => (l === "zh" ? zh : en);
const local = (l, path = "") => `${l === "zh" ? "/zh/" : "/"}${path}`;
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
    ["art.html", "art", t(l, "诗与画", "Art")],
    ["writing.html", "writing", t(l, "文章", "Writing")],
    ["work.html", "work", t(l, "工程与实践", "Work")],
    ["about.html", "about", t(l, "关于我", "About")],
  ];
  return `<a class="skip-link" href="#main">${t(l, "跳到正文", "Skip to content")}</a><header class="site-header"><div class="wrap header-inner"><a class="wordmark" href="${local(l)}" aria-label="${t(l, "Ray Qin · 首页", "Ray Qin · Home")}">Ray Qin<span lang="zh-CN">秦剑</span></a><nav class="desktop-nav" aria-label="${t(l, "主导航", "Main navigation")}">${nav.map(([href, id, label]) => `<a href="${local(l, href)}"${page === id ? ' aria-current="page"' : ""}>${label}</a>`).join("")}<a href="${local(l, "#contact")}">${t(l, "联系", "Contact")} ${arrow}</a></nav><div class="header-controls"><a class="language-link" href="${local(l === "zh" ? "en" : "zh", path)}" lang="${l === "zh" ? "en" : "zh-CN"}" aria-label="${l === "zh" ? "Read this page in English" : "用中文阅读此页"}">${l === "zh" ? "EN" : "中文"}</a><details class="mobile-menu"><summary>${t(l, "菜单", "Menu")}<span class="menu-lines" aria-hidden="true"></span></summary><nav aria-label="${t(l, "手机导航", "Mobile navigation")}">${nav.map(([href, id, label]) => `<a href="${local(l, href)}"${page === id ? ' aria-current="page"' : ""}>${label}</a>`).join("")}<a href="${local(l, "#contact")}">${t(l, "联系", "Contact")} ${arrow}</a></nav></details></div></div></header>`;
}
function footer(l) {
  return `<footer class="site-footer wrap"><div class="footer-line"><a class="wordmark" href="${local(l)}">Ray Qin<span lang="zh-CN">秦剑</span></a><p>${t(l, "保持好奇，也保留改变主意的自由。", "Stay curious. Leave room to change your mind.")}</p><a href="#top" class="back-top">${t(l, "回到顶部", "Back to top")} ↑</a></div><div class="footer-meta"><span>© 2026 Ray Qin</span><div><a href="/resume.html">${t(l, "简历", "Résumé")}</a><a href="https://github.com/qinjianxyz">GitHub ${arrow}</a><a href="https://x.com/rayq_ai">X ${arrow}</a><a href="/pulse/privacy.html">Pulse ${t(l, "隐私政策", "privacy policy")}</a><a href="/life-garden/privacy.html">Life Garden ${t(l, "隐私政策", "privacy policy")}</a></div></div></footer>`;
}
function contact(l) {
  return `<section class="contact-section wrap" id="contact"><div><p class="eyebrow">${t(l, "工程合作与研究交流", "Engineering & research")}</p><h2>${t(l, "有交集，就聊聊。", "Something in common? Let’s talk.")}</h2></div><div class="contact-copy"><p>${t(l, "一个想做的产品、一个还没想明白的问题，或者一种不同的看法。工程合作、研究交流，或只是聊聊，都可以。", "A product you want to build, a question you’re working through, or a different point of view. I’m open to engineering collaborations, research conversations, and a good exchange of ideas.")}</p><a class="email-link" href="mailto:qinjianxyz@gmail.com">qinjianxyz@gmail.com ${arrow}</a><div class="social-links"><a href="https://x.com/rayq_ai">X / @rayq_ai ${arrow}</a><a href="https://t.me/rayq_ai">Telegram ${arrow}</a><a href="https://github.com/qinjianxyz">GitHub ${arrow}</a></div></div></section>`;
}
function shell(l, path, page, title, description, body, article, artwork) {
  const url = origin + local(l, path);
  const structured = artwork ? {"@context":"https://schema.org", "@type":"VisualArtwork", name:artwork.title[l], image:origin+artwork.image.src, url, creator:{"@type":"Person",name:"Jian Qin",alternateName:"秦剑"}, inLanguage:l === "zh" ? "zh-CN" : "en", description:artwork.summary[l]} : article
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: l === "zh" ? article.translations?.zh?.title || article.title : article.title,
        datePublished: article.publishedAt,
        author: {
          "@type": "Person",
          name: "Ray Qin",
          url: origin + "/about.html",
        },
        inLanguage: l === "zh" && article.translations?.zh ? "zh-CN" : "en",
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
  return `<!doctype html>\n<html lang="${l === "zh" ? "zh-CN" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} · Ray Qin</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#f7f5ef"><link rel="icon" href="/favicon.ico"><link rel="canonical" href="${url}"><link rel="alternate" hreflang="zh-CN" href="${origin + local("zh", path)}"><link rel="alternate" hreflang="en" href="${origin + local("en", path)}"><link rel="alternate" hreflang="x-default" href="${origin + local("en", path)}"><meta property="og:type" content="${article ? "article" : "website"}"><meta property="og:title" content="${esc(title)} · Ray Qin"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${origin}${artwork ? artwork.image.src : "/media/education/ray-outdoors.jpg"}"><meta property="og:image:alt" content="${esc(artwork ? artwork.alt[l] : t(l, "Ray 在旅途中", "Ray outdoors on a trip"))}"><meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="/assets/ray.css">${page === "art" || page === "home" ? '<link rel="stylesheet" href="/assets/art.css">' : ""}<script src="/assets/ray.js" defer></script><script type="application/ld+json">${JSON.stringify(structured).replaceAll("<", "\\u003c")}</script></head><body id="top" class="page-${page}">${header(l, page, path)}<main id="main">${body}</main>${footer(l)}<dialog class="image-dialog" aria-label="${t(l, "照片与作品大图", "Image viewer")}"><button class="dialog-close" aria-label="${t(l, "关闭大图", "Close image")}">${t(l, "关闭", "Close")} ×</button><img alt=""><p></p><div class="dialog-navigation"><button class="image-previous" aria-label="${t(l,"上一张图片","Previous image")}">← ${t(l,"上一张","Previous")}</button><span class="image-count" role="status" aria-live="polite"></span><button class="image-next" aria-label="${t(l,"下一张图片","Next image")}">${t(l,"下一张","Next")} →</button></div></dialog></body></html>\n`;
}
function board(l) {
  return `<div class="memory-board" aria-label="${t(l, "我的工作与生活照片", "A few moments from my work and life")}"><span class="board-label">${t(l, "工作，也生活。", "Work. And a life beyond it.")}</span>${photos.map(([id, cls, zh, en, alt], i) => `<button class="memory memory-${cls}" data-image="/media/education/${id}.jpg" data-caption="${esc(t(l, zh, en))}" aria-label="${t(l, "放大照片：", "Enlarge photo: ") + esc(t(l, zh, en))}"><img src="/media/education/${id}-640.jpg" alt="${esc(t(l, zh, alt))}" width="640" height="640" ${i === 0 ? 'fetchpriority="high"' : 'loading="eager"'}><span class="memory-caption"><span>0${i + 1}</span>${t(l, zh, en)}${arrow}</span></button>`).join("")}<p class="board-note" lang="zh-CN">琴心剑胆<br>静能生慧</p></div>`;
}
function articleLink(l, a, i, feature = false) {
  const title = l === "zh" ? a.translations?.zh?.title || a.title : a.title;
  const topics = a.slug === "ai-bitcoin-and-the-right-to-choose" ? t(l,"AI · BITCOIN · 选择","AI · BITCOIN · CHOICE") : a.slug === "rules-without-rulers" ? t(l,"密码学 · 规则","CRYPTOGRAPHY · RULES") : t(l,"制度 · 判断 · 不确定性","INSTITUTIONS · JUDGMENT · UNCERTAINTY");
  return `<a class="writing-row${feature ? " writing-feature" : ""}" href="${local(l, `writing/${a.slug}.html`)}"><span class="writing-index">${String(i+1).padStart(2,"0")}</span><div><div class="article-kicker">${topics}</div><h3 lang="${l === "zh" && a.translations?.zh ? "zh-CN" : "en"}">${esc(title)}</h3>${l === "zh" && a.translations?.zh ? `<p class="article-original-title" lang="en">${esc(a.title)}</p>` : ""}${feature ? `<blockquote lang="${l==='zh'?'zh-CN':'en'}">${t(l,'“人的价值，从来不等同于他的工业价值。”','“Human value was never identical to industrial value.”')}</blockquote>` : ""}<p>${esc(a.summary[l])}</p><span class="article-date"><time datetime="${a.publishedAt}">${a.publishedAt.slice(0, 10).replaceAll("-", " / ")}</time><span>${a.readMinutes} ${t(l, "分钟 · 附英文原文", "min read · English original")}</span></span></div><span class="article-arrow" aria-hidden="true">↗</span></a>`;
}
function interests(l) {
  const items = [
    {name:'Digital Clone', label:t(l,'个人 AI','PERSONAL AI'), state:t(l,'研究中','Research'), text:t(l,'用自己的文章、记忆与选择，探索个人智能。','Exploring personal intelligence through my writing, memories, and choices.'), href:'about.html#personal-ai'},
    {name:'Enterprise OS', label:t(l,'AI 开发工具','AI DEVELOPMENT'), state:t(l,'内部工具','Internal tool'), text:t(l,'让长期的 AI 开发项目能接着上次的进度继续做。','Picking up where I left off in long-term work with AI.'), href:'work.html#enterprise-os'},
    {name:'Anvil Sim', label:t(l,'仿真与工程','SIMULATION'), state:t(l,'研发原型','Research prototype'), text:t(l,'把机械工程、原生软件与模拟放在一起。','Bringing mechanical engineering, native software, and simulation together.'), href:'work.html#anvil-sim'},
    {name:'Life Garden', label:t(l,'生活记录','LIFE RECORDS'), state:t(l,'开发原型','Prototype'), text:t(l,'日记、习惯与时间，能不能长成一座花园？','Could a journal, habits, and time spent focusing grow into a garden?'), href:'work.html#life-garden'},
    {name:'Pulse', label:t(l,'贸易与制造','TRADE & MAKING'), state:t(l,'内部测试','Internal testing'), text:t(l,'探索贸易、制造与日常物品之间的联系。','Exploring the connections between trade, manufacturing, and everyday objects.'), href:'work.html#pulse'},
    {name:t(l,'机器人与控制','Robotics & control'), label:t(l,'软件走进现实','SOFTWARE MEETS HARDWARE'), state:t(l,'过往实践','Past project'), text:t(l,'从自动驾驶小车开始，理解感知如何变成动作。','From an autonomous model car to the question of how perception becomes action.'), href:'work.html#autonomous-vehicle'},
    {name:t(l,'桌游与博弈','Games & strategy'), label:t(l,'规则与涌现','RULES & EMERGENCE'), state:t(l,'早期探索','Early exploration'), text:t(l,'怎样用简单的规则，让交易、竞争和策略始终有趣？','How can simple rules make trade and competition interesting, game after game?'), href:'about.html#games'},
    {name:t(l,'能源、自动化与农场','Energy, automation & farming'), label:t(l,'想怎样生活','WAYS TO LIVE'), state:t(l,'长期兴趣','Long-term interest'), text:t(l,'探索能源与自动化技术能怎样用于农场生活。','Exploring how energy and automation could support life on a farm.'), href:'about.html#life-aspiration'}
  ];
  return `<section class="interests-section wrap" id="selected-work"><div class="section-heading"><div><p class="eyebrow">03 / ${t(l,'项目与兴趣','PROJECTS & INTERESTS')}</p><h2>${t(l,'最近在琢磨什么。','Things I’m exploring.')}</h2></div><p>${t(l,'有些已有原型，有些还在探索。','Some are working prototypes. Others are ideas I’m still exploring.')}</p></div><div class="interest-grid">${items.map(x=>`<a class="interest-item" href="${local(l,x.href)}"><div class="interest-meta"><span>${esc(x.label)}</span><span>${esc(x.state)}</span></div><h3>${esc(x.name)} ${arrow}</h3><p>${esc(x.text)}</p></a>`).join('')}</div><a class="text-link interests-more" href="${local(l,'work.html')}">${t(l,'查看项目详情','Explore the projects')} →</a></section>`;
}
function home(l) {
  return `<section class="hero wrap"><div class="hero-copy"><p class="eyebrow">${t(l, "工程师 · 教育者 · 农民", "Engineer · Educator · Farmer")}</p><h1>${t(l, "把技术，<br>做进<span>真实的生活。</span>", "Technology,<br>put to work in<br><span>the real world.</span>")}</h1><div class="hero-actions"><a class="button" href="${local(l, "art.html")}">${t(l, "诗与画", "Explore the art")} ${arrow}</a></div></div>${board(l)}</section>
${artHome(l, artworks)}
<section class="writing-section"><div class="wrap"><div class="section-heading"><div><p class="eyebrow">02 / ${t(l, "把想法写下来", "Thinking out loud")}</p><h2>${t(l, "AI、Bitcoin 与选择。", "AI, Bitcoin, and the choices we make.")}</h2></div><p>${t(l, "关于能力、所有权与选择。<br>也给自己的判断，留下被反驳的空间。", "On capability, ownership, and choice.<br>Ideas worth writing down—and questioning.")}</p></div>${articles.map((a, i) => articleLink(l, a, i, i === 0)).join("")}<a class="text-link writing-all" href="${local(l, "writing.html")}">${t(l, "文章与思考", "Writing & ideas")} →</a></div></section>
${interests(l)}
<section class="life-section wrap"><div class="life-heading"><p class="eyebrow">04 / ${t(l, "生活，是目的", "The life behind the work")}</p><h2>${t(l, "能创造，<br>也有时间生活。", "Room to build.<br>Time to live.")}</h2><a class="text-link" href="${local(l, "about.html")}">${t(l, "认识我", "A little more about me")} →</a></div><div class="life-copy"><blockquote lang="en">“Wisdom, to me, is not about defeating everyone else. It is about whether you actually obtained what you wanted from your limited time in this world.”</blockquote><a class="quote-source" href="${local(l, `writing/${articles[0].slug}.html#p3`)}">Ray Qin · ${t(l, "摘自", "From")} <cite>AI, Bitcoin, and the Right to Choose</cite> ${arrow}</a><p>${t(l, "运动、学习、家人、朋友，以及能够决定自己怎样度过一天的自由，都是我在意的事。", "Exercise, learning, family, friends, and the freedom to choose how I spend my days all matter to me.")}</p></div></section>${contact(l)}`;
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
  return `<section class="page-intro wrap"><p class="eyebrow">${t(l, "工程与实践", "Engineering & projects")}</p><h1>${t(l, "项目与实验", "Projects & experiments")}</h1><div class="intro-split"><p class="lede">${t(l, "机械工程与数学–计算机科学的背景，让我习惯在软件、硬件和现实约束之间来回思考。", "My background in mechanical engineering and mathematics–computer science keeps me moving between software, hardware, and the constraints of the real world.")}</p><p>${t(l, "我曾在 ZipRecruiter 担任高级软件工程师。这里收录了我的独立产品、研发原型和过往项目，包括具体工作、设计取舍与目前的进展。", "I previously worked as a Senior Software Engineer at ZipRecruiter. Here are my independent products, research prototypes, and past engineering projects, with notes on the work, design decisions, and current status.")}</p></div><a class="text-link" href="/resume.html">${t(l, "查看完整简历", "Read my résumé")} ${arrow}</a></section><section class="professional-work wrap"><div class="professional-heading"><p class="eyebrow">${t(l, "职业经历 / ZipRecruiter", "Professional work / ZipRecruiter")}</p><h2>${t(l, "在 ZipRecruiter 的工程工作", "Engineering at ZipRecruiter")}</h2></div><div class="professional-columns"><article><h3>${t(l, "认证系统", "Authentication systems")}</h3><p>${t(l, "参与注册与认证系统的重构，开发共享的 React/Next.js 与 Go/gRPC 服务，支持验证码和自动登录，并推动多个产品团队采用。", "Worked on rebuilding registration and authentication with shared React/Next.js and Go/gRPC services for one-time codes and automatic login across product teams.")}</p></article><article><h3>${t(l, "推荐与检索", "Recommendations & retrieval")}</h3><p>${t(l, "为职位与候选人推荐构建基于嵌入向量的检索流程，把相似度搜索、混合检索和过滤接入具体产品功能。", "Built embedding-based retrieval for job and candidate recommendations, bringing similarity search, hybrid retrieval, and filtering into product features.")}</p></article></div></section><nav class="project-nav wrap" aria-label="${t(l, "跳到项目", "Jump to project")}">${projects.map((p) => `<a href="#${p.id}">${p.name}</a>`).join("")}</nav><div class="work-cases wrap">${projects.map((p, i) => `<article class="work-case${p.image ? "" : " text-case"}" id="${p.id}"><div class="case-top"><p class="case-number">0${i + 1} / ${esc(p.eyebrow[l])}</p><span class="status">${esc(p.status[l])}</span></div><div class="case-grid"><div class="case-heading"><h2>${esc(p.name)}</h2><h3>${esc(p.title[l])}</h3><p class="case-summary">${esc(p.summary[l])}</p></div>${imageButton(l, p)}<div class="case-content"><div class="case-detail"><h4>${t(l, "我的工作", "The work")}</h4><p>${esc(p.contribution[l])}</p><h4>${t(l, "设计取舍", "Design decision")}</h4><p>${esc(p.decision[l])}</p></div><p class="case-boundary"><span>${t(l, "目前进展与限制", "Status & scope")}</span>${esc(p.boundary[l])}</p><ul class="skill-list" aria-label="${t(l, "相关技术", "Related technologies")}">${p.skills.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div></div></article>`).join("")}</div><section class="work-note wrap"><p class="eyebrow">${t(l, "合作，从问题本身开始", "Collaboration starts with the problem")}</p><h2>${t(l, "把复杂的事，做得可理解、可验证。", "Make complex things understandable—and testable.")}</h2><p>${t(l, "如果你的项目需要把工程想法变成可运行的原型，或者把已有产品的交互与可靠性往前推进，欢迎带着具体的问题来聊。", "If your project needs a working prototype, or a clearer and more reliable product experience, I’d be glad to talk through the problem.")}</p><a class="button" href="mailto:qinjianxyz@gmail.com">${t(l, "写信给我", "Get in touch")} ${arrow}</a></section>`;
}
function writing(l) {
  return `<section class="page-intro writing-intro wrap"><p class="eyebrow">${t(l, "文章与思考", "Writing & ideas")}</p><h1>${t(l, "精选文章", "Selected essays")}</h1><p class="lede">${t(l, "我写技术、Bitcoin 和制度，也关心它们怎样影响一个人的生活与选择。写作帮我理清思路，公开讨论让我检验自己的判断。", "I write about technology, Bitcoin, and institutions, and how they shape our lives and choices. Writing helps me clarify an idea; discussing it in public helps me test it.")}</p><div class="writing-topics"><span>${t(l,"技术","Technology")}</span><span>Bitcoin</span><span>${t(l, "制度与自主性", "Institutions & autonomy")}</span><span>${t(l, "真实生活", "Everyday life")}</span></div></section><section class="writing-list wrap" aria-label="${t(l, "精选文章", "Selected essays")}">${articles.map((a, i) => articleLink(l, a, i, i === 0)).join("")}</section><section class="writing-footnote wrap"><p>${t(l, "这里是精选文章。日常想法、讨论和还没想明白的问题，我会继续发在 X 上。", "These are selected essays. I share shorter observations, conversations, and open questions on X.")}</p><a class="text-link" href="https://x.com/rayq_ai">@rayq_ai ${arrow}</a></section>${contact(l)}`;
}
function articlePage(l, a) {
  const translated = l === "zh" && a.translations?.zh;
  const title = translated ? translated.title : a.title;
  const lang = translated ? "zh-CN" : "en";
  const prefix = translated ? "t" : "p";
  const fallback = a.slug === "ai-bitcoin-and-the-right-to-choose" ?
    t(l,["技术与选择","钱储存着选择","怎样度过一生","所有权与丰裕","跨越国界的规则","我们构建的制度"],["Technology & choice","Money as stored choice","A life worth living","Ownership & abundance","Rules across borders","The systems we build"]) :
    t(l,["重新理解无政府","规则与统治者","共同的规则","验证的力量","历史中的问题","没有统治者，仍然有规则"],["Rethinking anarchy","Rules and rulers","Shared rules","The power to verify","A historical question","Rulerless, not ruleless"]);
  const toc = (a.toc?.[l] || fallback).map((x,i) => typeof x === "string" ? {paragraphIndex:i,title:x} : x);
  const headingIndices = new Set((a.toc?.en || []).filter(h => typeof h === "object").map(h=>h.paragraphIndex));
  const paragraphs = translated ? translated.paragraphs : a.paragraphs;
  const render = (values, idPrefix, useHeadings = true) => values.map((p,i) => `<p id="${idPrefix}${i+1}"${useHeadings && headingIndices.has(i) ? ' class="essay-section-title" role="heading" aria-level="2"' : ''}>${esc(p)}</p>`).join("");
  const body = `${translated ? `<p class="translation-label">${esc(translated.label)}</p>` : ""}<div class="${translated?'essay-translation':'essay-original'}" lang="${lang}">${render(paragraphs,prefix)}</div>${translated ? `<details class="essay-source-disclosure"><summary>${t(l,"阅读英文原文","Read the English original")}</summary><div class="essay-original" lang="en">${render(a.paragraphs,"p")}</div></details>` : ""}`;
  return `<div class="reading-progress" aria-hidden="true"></div><article class="essay"><header class="essay-header wrap"><a class="text-link back-link" href="${local(l,"writing.html")}">← ${t(l,"全部文章","All writing")}</a><p class="eyebrow">${t(l,"文章 / Ray Qin","ESSAY / RAY QIN")}</p><h1 lang="${lang}">${esc(title)}</h1>${translated?`<p class="essay-original-title" lang="en">${esc(a.title)}</p>`:''}<p class="essay-deck">${esc(a.summary[l])}</p><div class="essay-meta"><span>Ray Qin</span><time datetime="${a.publishedAt}">${a.publishedAt.slice(0,10)} <abbr title="Coordinated Universal Time">UTC</abbr></time><span>${a.readMinutes} ${t(l,"分钟 · 英文原作","min read · English original")}</span><a href="${a.sourceUrl}">${t(l,"X 原文","Original on X")} ${arrow}</a></div></header><div class="essay-layout wrap"><aside class="essay-aside"><p class="eyebrow">${t(l,"本篇脉络","In this essay")}</p><ol>${toc.map((x,i)=>`<li><a href="#${prefix}${x.paragraphIndex+1}"><span>${String(i+1).padStart(2,'0')}</span>${esc(x.title)}</a></li>`).join('')}</ol><button class="copy-link" data-copy-link>${t(l,"复制文章链接","Copy article link")} ${arrow}</button><p class="copy-status" role="status" aria-live="polite"></p></aside><div class="essay-body" lang="${lang}">${body}<div class="essay-end" aria-label="${t(l,"文章结束","End of essay")}">Ray Qin <span>—</span> ${a.publishedAt.slice(0,10)}</div></div></div></article><section class="related-writing wrap"><p class="eyebrow">${t(l,"继续阅读","Keep reading")}</p>${articles.filter(x=>x!==a).map((x,i)=>articleLink(l,x,i)).join('')}<div class="essay-conversation"><p>${t(l,"有不同的看法？我也想听听。","See it differently? I’d like to hear your perspective.")}</p><a class="text-link" href="${a.sourceUrl}">${t(l,"去 X 参与讨论","Join the conversation on X")} ${arrow}</a></div></section>`;
}
function gaming(l) {
  const en = [
    "I grew up playing The Legend of Cao Cao (曹操传) and The Legend of Yue Fei (岳飞传), planning where to place each unit, which character to develop, and which equipment was worth investing in.",
    "That interest now stretches from Civilization VII and Clash of Clans to Dota-style games, Catan, and Power Grid. I’m drawn to the point where a small decision starts changing the whole system: an upgrade opens a strategy, a trade shifts incentives, or a teammate’s specialization changes what everyone else can do.",
    "My favorite kind of progression happens within a match. You begin with little, build something powerful, then start again. The numbers reset; what you learned stays with you.",
    "I’m exploring how that experience might work around a table, through boards, cards, and tokens. Chess sets a high bar: simple rules, decisions you can spend a lifetime studying. I’d like to explore economic systems and tactical competition with that kind of restraint.",
    "My research list includes Brass: Birmingham, Eclipse: Second Dawn, Through the Ages, Root, Dune: Imperium, and Guards of Atlantis II. I’m early in this exploration, and would love to meet players and designers in the Bay Area and Beijing who enjoy pulling a game apart to understand why it works."
  ];
  const zh = [
    "小时候玩《曹操传》和《岳飞传》，我会琢磨每个兵该站在哪里、先培养谁，以及一件装备值不值得投入资源。",
    "后来喜欢的游戏，从《文明 VII》《部落冲突》到 Dota 类游戏、卡坦岛和《电力公司》。我特别在意一个小决定怎样改变整个局面：一次升级打开新的打法，一笔交易改变各方的利益，一个队友的分工让整支队伍有了新的可能。",
    "我最喜欢的成长发生在一局之内。从很少的资源开始，逐渐建立强大的能力，然后重新开局。数值归零，学到的东西留下。",
    "我正在探索，怎样用棋盘、卡牌和标记，把这种体验带到桌面上。国际象棋是我的一个参照：规则能够理解，决策却值得研究一生。我想试试，用同样克制的规则容纳经济系统与战术竞争。",
    "Brass: Birmingham、Eclipse: Second Dawn、Through the Ages、Root、Dune: Imperium 和 Guards of Atlantis II 都在我的研究清单上。这项探索还在早期；我很想认识湾区和北京的玩家与设计者，一起拆解：一款游戏为什么值得反复玩？"
  ];
  return `<section class="gaming-section wrap" id="games"><div><p class="eyebrow">${t(l,"策略游戏与桌游设计","STRATEGY & GAME DESIGN")}</p><h2>${t(l,"重新开局，<br>经验留下。","Building Up,<br>Starting Over")}</h2></div><div class="gaming-copy">${(l==='zh'?zh:en).map(p=>`<p>${esc(p)}</p>`).join('')}</div></section>`;
}
function about(l) {
  return `<section class="about-hero wrap"><div><p class="eyebrow">${t(l, "关于我", "About me")}</p><h1>${t(l, "秦剑", "Ray Qin")}</h1><p class="lede">${t(l, "工程师 · 教育者 · 农民", "Engineer · Educator · Farmer")}</p><p>${t(l, "我在北京长大，后来在美国求学、工作。我做软件、开发自己的产品，也带学员动手做项目。中美两地的生活，影响着我对教育、技术和机会的看法。", "I grew up in Beijing, then studied and worked in the US. I build software, develop my own products, and teach through hands-on projects. Living in both countries has shaped how I think about education, technology, and opportunity.")}</p></div><figure><img src="/media/education/ray-outdoors.jpg" alt="${t(l, "Ray 在旅途中", "Ray outdoors on a trip")}" width="900" height="1200"><figcaption>${t(l, "旅途中。", "On a trip.")}</figcaption></figure></section><section class="about-story wrap"><div><p class="eyebrow">${t(l, "一路走来", "A little background")}</p><h2>${t(l, "教育与职业经历", "Education & experience")}</h2></div><div class="timeline"><article><h3>ZipRecruiter</h3><p class="timeline-role">Senior Software Engineer</p><p>${t(l, "曾从事全栈开发与 AI 项目。职业经历之外，也持续做自己的软件与硬件实验。", "I worked on full-stack development and AI projects, alongside software and hardware experiments of my own.")}</p></article><article><h3>UC San Diego</h3><p class="timeline-role">Dual B.S. · Cum Laude</p><p>${t(l, "机械工程与数学–计算机科学双学位。从物理系统，到计算与软件。", "Dual bachelor’s degrees in Mechanical Engineering and Mathematics–Computer Science. From physical systems to computation and software.")}</p></article><article><h3>San Domenico School</h3><p class="timeline-role">Veritas Award</p><p>${t(l, "学校授予毕业生的最高荣誉。", "The school’s highest honor for a graduating senior.")}</p></article><a class="text-link" href="/resume.html">${t(l, "完整简历", "Full résumé")} ${arrow}</a></div></section><section class="aspiration wrap"><p class="eyebrow">${t(l, "我想持续投入的事", "What I want to keep working on")}</p><div class="aspiration-grid"><article id="personal-ai"><span>01</span><h2>${t(l, "个人 AI", "Personal AI")}</h2><p>${t(l, "个人 AI 吸引我的地方，是它有可能理解一个人长期的表达、选择与改变。Digital Clone 是我正在研究的方向。", "Personal AI interests me because it might make sense of a person’s writing, choices, and changes over time. Digital Clone is a direction I’m exploring.")}</p></article><article><span>02</span><h2>${t(l, "Bitcoin 与自主性", "Bitcoin & autonomy")}</h2><p>${t(l, "作为 Bitcoiner，我在意的远不止价格。所有权、共同规则和拒绝的权利，是我愿意持续思考的问题。", "As a Bitcoiner, I care about more than price. Ownership, shared rules, and the right to say no are questions I want to keep thinking about.")}</p><a class="text-link" href="${local(l, `writing/${articles[0].slug}.html`)}">${t(l, "读我的思考", "Read the essay")} →</a></article><article id="life-aspiration"><span>03</span><h2>${t(l, "能源、自动化与农场", "Energy, automation & farming")}</h2><p>${t(l, "我想留出时间学习、运动，陪伴家人与朋友。我也对能源、自动化和农场感兴趣，想探索它们怎样让我更自主地生活。", "I want time to learn, exercise, and be with family and friends. I’m also interested in energy, automation, and farming—and how they might give me more freedom in everyday life.")}</p></article></div></section>${gaming(l)}${contact(l)}`;
}
async function save(l, path, page, title, description, body, article, artwork) {
  const target = join(root, l === "zh" ? "zh" : "", path || "index.html");
  await mkdir(dirname(target), { recursive: true });
  await writeFile(
    target,
    shell(l, path, page, title, description, body, article, artwork),
  );
  routes.push(local(l, path));
}
for (const l of ["en", "zh"]) {
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
    t(l, "工程与实践", "Engineering & projects"),
    t(
      l,
      "Anvil Sim、自动驾驶、Life Garden、Enterprise OS 与 Pulse：具体工作、工程取舍和目前进展与限制。",
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
      "工程师、教育者、农民。秦剑的经历、兴趣与项目。",
      "Engineer, educator, farmer. Ray Qin’s background, interests, and projects.",
    ),
    about(l),
  );
  await save(l, "art.html", "art", t(l,"诗与画","Poetry & art"), t(l,"秦剑的五件诗词与视觉艺术作品：四首古诗的当代演绎，以及原创《袖中星》。","Five works by Jian Qin: Chinese poetry in contemporary visual art, including the original poem and painting A Star Within the Sleeve."), artIndex(l, artworks));
  for (const [i, a] of artworks.entries()) await save(l, `art/${a.slug}.html`, "art", a.title[l], a.summary[l], artDetail(l,a,i,artworks), undefined, a);
  for (const a of articles)
    await save(
      l,
      `writing/${a.slug}.html`,
      "writing",
      l === "zh" ? a.translations?.zh?.title || a.title : a.title,
      a.summary[l],
      articlePage(l, a),
      a,
    );
}
// Keep previously shared English URLs working after moving English to the root.
const aliases = routes.filter(path => !path.startsWith('/zh/'));
for (const dest of aliases) {
  const target = join(root, 'en', dest === '/' ? 'index.html' : dest.slice(1));
  await mkdir(dirname(target), { recursive: true });
  await writeFile(
    target,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ray Qin</title><meta name="robots" content="noindex"><link rel="canonical" href="${origin + dest}"><script>location.replace(${JSON.stringify(dest)} + location.search + location.hash);</script><noscript><meta http-equiv="refresh" content="0;url=${dest}"></noscript></head><body><p><a href="${dest}">Continue to Ray Qin’s website</a></p></body></html>\n`,
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
  `Built ${routes.length} pages, ${aliases.length} legacy English aliases, and sitemap. No dependencies or network access.`,
);
