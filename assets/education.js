(() => {
  const projects = {
    job: {
      en: [
        "Good work.\nCloser to home.",
        "Build a place where people can find opportunities, post a listing, and send an application. Add an AI helper that makes a long description easier to understand.",
        ["Accounts", "Search & filters", "AI summaries"],
        "nearby.",
        "Find your next little adventure.",
        "Search opportunities…",
        [
          ["S", "Weekend studio helper", "Local studio · Part time"],
          ["G", "Community garden assistant", "North Park · Weekends"],
        ],
      ],
      zh: [
        "好机会，\n就在身边。",
        "做一个可以寻找机会、发布职位、提交申请的平台。再加入一个 AI 小助手，把冗长的职位描述讲清楚。",
        ["用户账号", "搜索筛选", "AI 总结"],
        "nearby.",
        "找到身边的新机会。",
        "搜索感兴趣的机会…",
        [
          ["S", "周末工作室助理", "社区工作室 · 兼职"],
          ["G", "社区花园助手", "North Park · 周末"],
        ],
      ],
    },
    delivery: {
      en: [
        "A little local.\nA lot of possibility.",
        "Create a neighborhood delivery prototype: browse a menu, place a test order, and follow its status. An AI helper turns a long menu into useful suggestions.",
        ["Menu & cart", "Test orders", "Order status"],
        "little local.",
        "Something good, around the corner.",
        "Search neighborhood favorites…",
        [
          ["B", "Bakery breakfast box", "Local bakery · Sample menu"],
          ["F", "Fresh garden bowl", "Neighborhood kitchen · Sample menu"],
        ],
      ],
      zh: [
        "邻里之间，\n多一点便利。",
        "做一个邻里配送原型：浏览菜单、提交测试订单、查看订单状态。再让 AI 帮助用户从菜单里找到合适的选择。",
        ["菜单和购物车", "测试订单", "订单进度"],
        "little local.",
        "转角就有，小小的美好。",
        "搜索附近的好味道…",
        [
          ["B", "面包店早餐盒", "社区烘焙店 · 示例菜单"],
          ["F", "新鲜田园沙拉", "邻里厨房 · 示例菜单"],
        ],
      ],
    },
    club: {
      en: [
        "Your people.\nYour little corner.",
        "Build a home for a running club, school group, or shared interest. Members can discover events and RSVP. An AI helper answers questions from your club guide.",
        ["Member accounts", "Events & RSVPs", "Club AI guide"],
        "our corner.",
        "Find your people. Make a plan.",
        "Explore upcoming activities…",
        [
          ["R", "Saturday trail run", "Community park · Sample event"],
          ["M", "Make something meetup", "Creative studio · Sample event"],
        ],
      ],
      zh: [
        "共同的热爱，\n自己的天地。",
        "为跑团、学校社团或兴趣小组做一个线上空间。成员可以查看活动并报名，再让 AI 根据社团指南回答常见问题。",
        ["成员账号", "活动报名", "AI 社团指南"],
        "our corner.",
        "找到同好，一起出发。",
        "浏览下一次活动…",
        [
          ["R", "周六越野跑", "社区公园 · 示例活动"],
          ["M", "一起动手创作", "创意工作室 · 示例活动"],
        ],
      ],
    },
  };

  let selected = "job";
  const el = (tag, text, cls) => {
    const node = document.createElement(tag);
    node.textContent = text;
    if (cls) node.className = cls;
    return node;
  };
  const pair = (tag, en, zh, cls) => {
    const node = el(tag, "", cls);
    const z = el("span", zh, "copy-zh"),
      e = el("span", en, "copy-en");
    z.lang = "zh-CN";
    e.lang = "en";
    node.append(z, e);
    return node;
  };
  function renderProject() {
    const holder = document.querySelector("#demo-content");
    if (!holder) return;
    const en = projects[selected].en,
      zh = projects[selected].zh;
    document
      .querySelector("#project-title")
      .replaceChildren(
        ...pair("div", en[0].replaceAll("\n", " "), zh[0].replaceAll("\n", " "))
          .childNodes,
      );
    document
      .querySelector("#project-description")
      .replaceChildren(...pair("p", en[1], zh[1]).childNodes);
    document
      .querySelector("#project-features")
      .replaceChildren(...en[2].map((x, i) => pair("span", x, zh[2][i])));
    const nav = el("div", "", "demo-nav");
    nav.append(
      el("span", en[3], "demo-brand"),
      pair("span", "My space", "我的空间", "demo-label"),
    );
    const search = pair("div", en[5], zh[5], "demo-search");
    search.append(el("span", "⌕"));
    holder.replaceChildren(
      nav,
      pair("h4", en[4], zh[4]),
      search,
      ...en[6].map(([icon, name, desc], i) => {
        const row = el("div", "", "demo-row"),
          copy = el("div", "");
        copy.append(
          pair("strong", name, zh[6][i][1]),
          pair("small", desc, zh[6][i][2]),
        );
        row.append(el("span", icon, "demo-icon"), copy, el("span", "↗"));
        return row;
      }),
    );
    document
      .querySelector("#project-preview")
      .setAttribute("aria-labelledby", "tab-" + selected);
  }
  window.rayLanguage = () => "bilingual";
  window.rayPair = pair;
  const tabs = [...document.querySelectorAll("[data-project]")];
  tabs.forEach((button, i) => {
    button.addEventListener("click", () => {
      selected = button.dataset.project;
      tabs.forEach((x) => {
        x.setAttribute("aria-selected", String(x === button));
        x.tabIndex = x === button ? 0 : -1;
      });
      renderProject();
    });
    button.addEventListener("keydown", (event) => {
      let n;
      if (event.key === "ArrowRight") n = (i + 1) % tabs.length;
      if (event.key === "ArrowLeft") n = (i + tabs.length - 1) % tabs.length;
      if (event.key === "Home") n = 0;
      if (event.key === "End") n = tabs.length - 1;
      if (n !== undefined) {
        event.preventDefault();
        tabs[n].focus();
        tabs[n].click();
      }
    });
  });
  document
    .querySelector("#print-poster")
    ?.addEventListener("click", () => window.print());
  renderProject();
})();
