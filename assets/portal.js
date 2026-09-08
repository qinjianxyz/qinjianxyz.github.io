(() => {
  const $ = (s) => document.querySelector(s),
    tr = (en, zh) => zh + " / " + en;
  let mode = "login",
    me = null,
    catalog = null,
    current = null,
    lessons = null;
  const params = new URLSearchParams(location.search),
    preferred = params.get("program");
  const reset = location.hash.startsWith("#reset=")
    ? location.hash.slice(7)
    : null;
  const e = (tag, text, cls) => {
    const node = document.createElement(tag);
    if (typeof text === "string" && text.includes(" / ")) {
      const [zh, ...rest] = text.split(" / ");
      const z = document.createElement("span"),
        en = document.createElement("span");
      z.className = "copy-zh";
      z.lang = "zh-CN";
      z.textContent = zh;
      en.className = "copy-en";
      en.lang = "en";
      en.textContent = rest.join(" / ");
      node.append(z, en);
    } else node.textContent = text;
    if (cls) node.className = cls;
    return node;
  };
  function message(text, error = false) {
    const n = $("#portal-message");
    n.textContent = text;
    n.hidden = false;
    n.classList.toggle("error", error);
  }
  async function api(path, body) {
    let response;
    try {
      response = await fetch("/api/" + path, {
        method: body ? "POST" : "GET",
        credentials: "same-origin",
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new Error(
        tr(
          "Unable to connect. Check your connection and try again.",
          "连接失败，请检查网络后重试。",
        ),
      );
    }
    const type = response.headers.get("content-type") || "";
    if (!type.includes("application/json"))
      throw new Error(
        tr(
          "This GitHub Pages preview does not include the account server. Contact Ray for your portal link. No account or payment has been submitted.",
          "此 GitHub Pages 预览尚未连接账号服务器。请联系 Ray 获取学员空间链接。没有提交账号或付款。",
        ),
      );
    const data = await response.json();
    if (!response.ok) {
      const translations = {
        "Please sign in first.": "请先登录。",
        "Email or password is incorrect.": "邮箱或密码不正确。",
        "Enter your email and password.": "请输入邮箱和密码。",
        "Enter your activation code.": "请输入激活码。",
        "This code is invalid, expired, already used, or assigned to a different email.":
          "激活码无效、已过期、已使用，或属于另一个邮箱。",
        "You already have this course. Save the code or contact Ray.":
          "你已经开通本课程，请保留激活码或联系 Ray。",
        "A parent or guardian account must activate a student program.":
          "青少年课程需要家长或监护人账号激活。",
        "Unable to create this account. Try signing in or contact Ray for help.":
          "无法创建账号，请尝试登录或联系 Ray。",
        "The reset link has expired or has already been used.":
          "重设密码链接已过期或已使用。",
        "Too many attempts. Please wait 15 minutes.":
          "尝试次数过多，请等待 15 分钟。",
        "You already have access to this program.": "你已经开通本课程。",
        "Enrollment opens once dates are confirmed. Contact Ray to join the interest list; no payment is being taken.":
          "确认日期后开放报名。可联系 Ray 登记意向，目前不会收款。",
      };
      const error = new Error(
        (translations[data.error] ||
          "操作未完成，请检查信息，或联系 Ray 获取帮助。") +
          "\n" +
          (data.error || "Request failed"),
      );
      error.status = response.status;
      throw error;
    }
    return data;
  }
  async function busy(form, fn) {
    const buttons = [...form.querySelectorAll("button")];
    buttons.forEach((b) => (b.disabled = true));
    try {
      await fn();
    } catch (err) {
      message(err.message, true);
    } finally {
      buttons.forEach((b) => (b.disabled = false));
    }
  }
  function setMode(next) {
    mode = next;
    $("#registration-fields").hidden = mode !== "register";
    $("#consent-field").hidden = mode !== "register";
    $("#auth-form").elements.name.required = mode === "register";
    $("#auth-form").elements.signature.required = mode === "register";
    $("#auth-form").elements.consent.required = mode === "register";
    $("#auth-form").elements.password.minLength = mode === "register" ? 12 : 1;
    $("#auth-form").elements.password.autocomplete =
      mode === "register" ? "new-password" : "current-password";
    $("#auth-submit").textContent =
      mode === "register"
        ? tr("Create my account", "创建我的账号")
        : tr("Sign in", "登录");
    $("#login-tab").classList.toggle("active", mode === "login");
    $("#register-tab").classList.toggle("active", mode === "register");
  }
  $("#login-tab").onclick = () => setMode("login");
  $("#register-tab").onclick = () => setMode("register");
  $("#auth-form").onsubmit = (event) => {
    event.preventDefault();
    busy(event.currentTarget, async () => {
      const data = new FormData(event.currentTarget);
      await api("auth/" + mode, {
        email: data.get("email"),
        password: data.get("password"),
        name: data.get("name"),
        role: data.get("role"),
        consent: data.get("consent") === "on",
        signature: data.get("signature"),
        language: "bilingual",
      });
      event.target.reset();
      await refresh();
      message(
        tr(
          "You’re signed in. Choose a program or activate your access.",
          "登录成功。请选择课程，或使用激活码开通权限。",
        ),
      );
    });
  };
  $("#logout").onclick = () =>
    busy($("#dashboard-header") || $("#dashboard"), async () => {
      await api("auth/logout", {});
      me = null;
      current = null;
      lessons = null;
      $("#lesson-content").replaceChildren();
      document.querySelector("#guidance-workspace")?.remove();
      $("#course-buttons").replaceChildren();
      $("#auth-panel").hidden = false;
      $("#dashboard").hidden = true;
      message(tr("You have signed out.", "你已退出登录。"));
    });
  $("#redeem-form").onsubmit = (event) => {
    event.preventDefault();
    busy(event.currentTarget, async () => {
      const { product } = await api("redeem", {
        code: new FormData(event.currentTarget).get("code"),
      });
      current = product;
      event.target.reset();
      await refresh();
      message(
        tr(
          "Your course is now unlocked. Welcome!",
          "课程已成功开通，欢迎开始学习！",
        ),
      );
    });
  };
  if (reset) {
    history.replaceState(null, "", location.pathname + location.search);
    $("#auth-form").hidden = true;
    $(".auth-tabs").hidden = true;
    $("#reset-form").hidden = false;
    $("#reset-form").onsubmit = (event) => {
      event.preventDefault();
      busy(event.currentTarget, async () => {
        await api("auth/reset", {
          token: reset,
          password: new FormData(event.currentTarget).get("password"),
        });
        $("#reset-form").hidden = true;
        $("#auth-form").hidden = false;
        $(".auth-tabs").hidden = false;
        message(
          tr(
            "Password updated. Sign in with your new password.",
            "密码已更新，请使用新密码登录。",
          ),
        );
      });
    };
  }
  function productName(p) {
    return tr(p.name, p.zh);
  }
  function renderOptions() {
    const container = $("#enrollment-options");
    container.replaceChildren();
    if (!catalog) return;
    if (me.products.length) {
      const until = me.guidance?.until
        ? new Date(me.guidance.until).toLocaleDateString()
        : "";
      const text = me.guidance?.active
        ? tr(
            "Shared guidance available through " +
              until +
              ". Project materials remain available afterward.",
            "共享指导有效至 " + until + "。到期后仍可查看项目教材。",
          )
        : tr(
            "Your project materials remain available. Renew guidance when you want to return to office hours.",
            "你的项目教材仍可查看。需要继续参加答疑时，可以续指导。",
          );
      container.append(e("p", text, "guidance-status"));
    }
    const available = catalog.products.filter(
      (p) =>
        !me.products.includes(p.id) &&
        (p.kind !== "renewal" || me.products.length > 0),
    );
    if (!available.length) return;
    if (!me.products.length) {
      container.append(
        e("h2", tr("Choose your starting point", "选择你的起点")),
      );
      container.append(
        e(
          "p",
          tr(
            "No active course yet. Use an activation code or choose a program below.",
            "还没有已开通课程。可使用激活码，或选择下面的课程。",
          ),
        ),
      );
    }
    available
      .sort((a, b) => (a.id === preferred ? -1 : b.id === preferred ? 1 : 0))
      .forEach((p) => {
        const card = e("article", "", "enrollment-card");
        card.append(
          e("h3", productName(p)),
          e(
            "p",
            new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(p.price / 100) +
              (p.kind === "renewal"
                ? tr(
                    " · one calendar month · no automatic renewal",
                    " · 一个自然月 · 不自动续费",
                  )
                : tr(
                    " · project materials + 8 weeks of guidance",
                    " · 项目教材 + 8 周指导",
                  )),
          ),
        );
        if (catalog.checkoutEnabled) {
          card.append(e("p", catalog.schedule));
          const button = e(
            "button",
            tr("Continue to secure checkout ↗", "前往安全结账 ↗"),
            "button",
          );
          button.onclick = () =>
            busy(card, async () => {
              const { url } = await api("checkout", { product: p.id });
              const target = new URL(url);
              if (
                target.protocol !== "https:" ||
                target.hostname !== "checkout.stripe.com"
              )
                throw new Error("Invalid checkout destination.");
              location.assign(url);
            });
          card.append(button);
        } else {
          card.append(
            e(
              "p",
              tr(
                "Proposed price. Enrollment opens after the offer and office hours are confirmed.",
                "拟定价格。项目方案及答疑安排确认后开放付费。",
              ),
            ),
          );
          const link = e(
            "a",
            tr("Ask Ray about this program ↗", "向 Ray 咨询本课程 ↗"),
            "button outline",
          );
          link.href =
            "mailto:qinjianxyz@gmail.com?subject=" +
            encodeURIComponent("Bootcamp interest: " + p.name);
          card.append(link);
        }
        container.append(card);
      });
  }
  async function choose(id) {
    try {
      current = id;
      lessons = await api(
        "lessons/" + id + "?path=" + encodeURIComponent(currentPath),
      );
      renderCourses();
      renderLessons();
      await renderGuidance();
    } catch (err) {
      message(err.message, true);
    }
  }
  function renderCourses() {
    const holder = $("#course-buttons");
    holder.replaceChildren();
    if (!me?.products.length)
      holder.append(
        e("p", tr("No active programs yet.", "尚无已开通课程。"), "fineprint"),
      );
    me?.products.forEach((id) => {
      const product = catalog.products.find((p) => p.id === id);
      if (!product) return;
      const b = e(
        "button",
        productName(product),
        "course-button" + (id === current ? " active" : ""),
      );
      b.onclick = () => choose(id);
      holder.append(b);
    });
  }
  let currentPath = "product";
  function renderLessons() {
    const holder = $("#lesson-content");
    holder.replaceChildren();
    if (!lessons) return;
    const p = catalog.products.find((p) => p.id === current),
      intro = e("div", "", "lesson-intro");
    intro.append(e("h2", productName(p)), e("p", lessons.schedule));
    const pathLabel = e("label", tr("Choose a project path", "选择项目路径")),
      pathSelect = document.createElement("select");
    pathSelect.id = "project-path";
    lessons.paths.forEach((path) => {
      const option = document.createElement("option");
      option.value = path.id;
      option.textContent = tr(path.name, path.zh);
      pathSelect.append(option);
    });
    pathSelect.value = lessons.path;
    pathSelect.onchange = () => {
      currentPath = pathSelect.value;
      choose(current);
    };
    pathLabel.append(pathSelect);
    intro.append(pathLabel);
    const deck = e(
      "a",
      tr(
        "Download editable project slides (PPTX)",
        "下载可编辑项目教材（PPTX）",
      ),
      "button outline",
    );
    deck.href = lessons.deck;
    intro.append(deck);
    const pdf = e("a", tr("PDF workbook", "PDF 讲义"), "quiet-link");
    pdf.href = lessons.deck.replace(/pptx$/, "pdf");
    intro.append(pdf);
    const classroom = e(
      "a",
      tr("Shared learner repository", "学员共享 GitHub 仓库"),
      "quiet-link",
    );
    classroom.href = "https://github.com/qinjianxyz/ray-qin-studio-classroom";
    classroom.target = "_blank";
    classroom.rel = "noopener noreferrer";
    intro.append(classroom);
    intro.append(
      e(
        "p",
        tr(
          "Repository access is invited separately by Ray. Your downloaded materials remain yours to use after guidance ends.",
          "仓库访问由 Ray 另行邀请。指导到期后，你仍可使用已下载的教材。",
        ),
        "fineprint",
      ),
    );
    const progress = e("div", "", "progress-bar"),
      meter = document.createElement("progress");
    meter.max = 6;
    meter.value = lessons.done.length;
    meter.setAttribute(
      "aria-label",
      tr("Completed milestones", "已完成里程碑"),
    );
    progress.append(meter);
    intro.append(
      progress,
      e(
        "p",
        tr(
          lessons.done.length + " of 6 milestones complete",
          lessons.done.length + " / 6 个里程碑完成",
        ),
      ),
    );
    holder.append(intro);
    lessons.lessons.forEach((l) => {
      const card = document.createElement("details");
      card.className = "lesson";
      card.open =
        !lessons.done.includes(l.week) && l.week === lessons.done.length + 1;
      const summary = e(
        "summary",
        String(l.week).padStart(2, "0") + " · " + tr(l.title, l.zh),
      );
      const body = e("div", "", "lesson-body");
      body.append(e("p", tr(l.outcome, l.outcomeZh)));
      const ul = document.createElement("ul");
      l.tasks.forEach((task, i) => ul.append(e("li", tr(task, l.tasksZh[i]))));
      body.append(ul, e("p", tr(l.check, l.checkZh), "checkpoint"));
      const label = e("label", "", "checkbox-label"),
        check = document.createElement("input");
      check.type = "checkbox";
      check.checked = lessons.done.includes(l.week);
      label.append(
        check,
        e(
          "span",
          tr(
            "I completed and can explain this milestone.",
            "我已完成，并能解释这个里程碑。",
          ),
        ),
      );
      check.onchange = async () => {
        const done = check.checked;
        check.disabled = true;
        try {
          await api("progress", {
            product: current,
            path: lessons.path,
            week: l.week,
            done,
          });
          lessons.done = done
            ? [...new Set([...lessons.done, l.week])]
            : lessons.done.filter((x) => x !== l.week);
          meter.value = lessons.done.length;
          intro.lastChild.replaceWith(
            e(
              "p",
              tr(
                lessons.done.length + " of 6 milestones complete",
                lessons.done.length + " / 6 个里程碑完成",
              ),
            ),
          );
        } catch (err) {
          check.checked = !done;
          message(err.message, true);
        } finally {
          check.disabled = false;
        }
      };
      body.append(label);
      card.append(summary, body);
      holder.append(card);
    });
    const note = e(
      "p",
      tr(
        "Collect project questions with a link, what you tried, and what is stuck; bring them to the next group office hour. Administrative questions are reviewed on weekdays, with a planned reply within two business days (Pacific Time).",
        "项目问题请附上链接、已尝试的方法和卡住的地方，带到下一次集中答疑。事务性问题在工作日处理，计划两个工作日内回复（太平洋时间）。",
      ),
      "fineprint",
    );
    holder.append(note);
  }
  async function renderGuidance() {
    document.querySelector("#guidance-workspace")?.remove();
    if (!me?.products.length) return;
    const box = e("section", "", "guidance-workspace");
    box.id = "guidance-workspace";
    $("#lesson-content").after(box);
    box.append(
      e("h2", tr("Bring a question to office hours", "把问题带来答疑")),
    );
    if (me.guidance?.active) {
      try {
        const hours = await api("office-hours");
        box.append(
          e(
            "p",
            hours.schedule ||
              tr(
                "Meeting details will be confirmed before live guidance begins.",
                "真人指导开始前会确认会议安排。",
              ),
          ),
        );
        for (const [url, label] of [
          [hours.meetingUrl, tr("Join office hours", "进入共享答疑")],
          [hours.communityUrl, tr("Private community", "私密学习群")],
        ])
          if (url) {
            const link = e("a", label, "button outline");
            link.href = url;
            link.rel = "noreferrer";
            box.append(link);
          }
      } catch (err) {
        box.append(e("p", err.message));
      }
      const form = document.createElement("form");
      for (const [key, label] of [
        ["goal", tr("What are you trying to do?", "你想完成什么？")],
        ["tried", tr("What have you tried?", "已经试过什么？")],
        [
          "actual",
          tr(
            "What happened, and what did you expect?",
            "实际发生了什么，与你预期有什么不同？",
          ),
        ],
      ]) {
        const row = e("label", label),
          input = document.createElement("textarea");
        input.name = key;
        input.required = true;
        input.maxLength = 2000;
        input.rows = 3;
        row.append(input);
        form.append(row);
      }
      form.append(
        e(
          "p",
          tr(
            "Share the problem without keys, private mail, or personal student information.",
            "描述问题即可，不要粘贴密钥、私人邮件或学生个人资料。",
          ),
          "fineprint",
        ),
      );
      const submit = e("button", tr("Save my question", "保存问题"), "button");
      submit.type = "submit";
      form.append(submit);
      form.onsubmit = async (event) => {
        event.preventDefault();
        submit.disabled = true;
        try {
          await api("questions", Object.fromEntries(new FormData(form)));
          await renderGuidance();
        } catch (err) {
          message(err.message, true);
        } finally {
          submit.disabled = false;
        }
      };
      box.append(form);
    } else
      box.append(
        e(
          "p",
          tr(
            "Your materials and previous questions remain here. Renew guidance to submit a new question or join office hours.",
            "教材和之前的问题仍在这里。续指导后可以提交新问题并继续参加答疑。",
          ),
        ),
      );
    try {
      const { questions } = await api("questions");
      for (const q of questions) {
        const item = e("details", "", "lesson");
        item.append(e("summary", q.goal));
        item.append(
          e("p", q.tried),
          e("p", q.actual),
          e(
            "p",
            q.status === "open"
              ? tr("Ready for discussion", "待答疑")
              : tr("Reviewed", "已处理"),
          ),
        );
        box.append(item);
      }
    } catch (err) {
      box.append(e("p", err.message));
    }
  }
  async function refresh() {
    try {
      catalog = await api("catalog");
      me = await api("me");
      $("#auth-panel").hidden = true;
      $("#dashboard").hidden = false;
      $("#welcome-name").textContent = me.user.name;
      renderCourses();
      renderOptions();
      if (me.products.length)
        await choose(me.products.includes(current) ? current : me.products[0]);
    } catch (err) {
      if (err.status !== 401) message(err.message, true);
    }
  }
  document.addEventListener("languagechange", () => {
    setMode(mode);
    if (me) {
      renderCourses();
      renderOptions();
      renderLessons();
    }
  });
  // A Pages deployment can point to the separately hosted portal without sending credentials across origins.
  fetch("/assets/deployment.json")
    .then((r) => (r.ok ? r.json() : {}))
    .then((config) => {
      if (
        config.portalUrl &&
        new URL(config.portalUrl).origin !== location.origin
      ) {
        const url = new URL(config.portalUrl);
        if (url.protocol !== "https:")
          throw new Error("Portal URL must use HTTPS.");
        url.pathname = "/portal.html";
        url.search = location.search;
        const link = e(
          "a",
          tr("Open the secure student portal ↗", "打开安全学员空间 ↗"),
          "button",
        );
        link.href = url.href;
        $("#auth-panel").replaceChildren(
          e(
            "p",
            tr(
              "Your account and learning records live in the secure portal.",
              "账号与学习记录保存在独立的安全学员空间。",
            ),
          ),
          link,
        );
      } else if (!reset) refresh();
    })
    .catch(() => {
      if (!reset) refresh();
    });
})();
