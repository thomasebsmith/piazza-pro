(function(global) {
  // Whether the add-on functionality should be applied.
  let enabled = true;

  const noHistory = "no_history";

  const clone = (value) => {
    return cloneInto(value, window, { cloneFunctions: true });
  };

  const modify = (result) => {
    // Remove the no_history tag, if it exists.
    if (Array.isArray(result.tags)) {
      const index = result.tags.indexOf(noHistory);
      if (index !== -1) {
        result.tags.splice(index, 1);
      }
    }
  };

  // Inject code for modifying Piazza posts.
  const PA = global.PA;
  const origCall = PA.call_pj;
  PA.call_pj = clone((method, params, blockObject, callback, error, scope) => {
    return origCall.call(PA, method, params, blockObject, clone(
      (result, aid) => {
        if (enabled) {
          modify(result);
        }
        callback.call(scope, result, aid);
      }
    ), error, scope);
  });

  const addAction = (text, action) => {
    const actionsDropdown =
      document.getElementById("question_note_actions_dropdown");
    if (actionsDropdown) {
      const el = document.createElement("li");
      el.addEventListener("click", action);

      const link = document.createElement("a");
      link.textContent = text;
      link.setAttribute("href", "#");
      el.appendChild(link);

      actionsDropdown.appendChild(el);
    }
  };

  const addUsernameHooks = () => {
    const elements = document.getElementsByClassName("user_name");
    for (const element of elements) {
      if (element.dataset.usernameHooksAdded !== "true") {
        element.dataset.usernameHooksAdded = "true";
        let usernameClass = null;
        for (const cls of element.classList.values()) {
          if (cls.startsWith("user_name_")) {
            usernameClass = cls;
            break;
          }
        }
        if (usernameClass !== null) {
          const title = usernameClass.substring("user_name_".length);
          if (element.hasAttribute("title")) {
            title = element.getAttribute("title") + "|" + title;
          }
          element.setAttribute("title", title);
        }
      }
    }
  };
  addUsernameHooks();

  // Called whenever the post content is changed.
  global.PEM.addListener("content", clone(() => {
    addUsernameHooks();

    // Add action for viewing raw post data.
    addAction("Print Raw", () => {
      const content = global.P.feed.content;
      console.log(content);
    });
  }));
})(window.wrappedJSObject);
