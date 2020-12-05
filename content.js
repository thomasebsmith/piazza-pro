(function(global) {
  // Whether the add-on functionality should be applied.
  let enabled = true;

  // Constants
  const noHistory = "no_history";
  const mainDropdownID = "question_note_actions_dropdown";
  const usernameClass = "user_name";
  const usernameClassPrefix = "user_name_";

  // Clones the given value into the webpage's context. Clones function(s)
  //  if they are given.
  const clone = (value) => {
    return cloneInto(value, window, { cloneFunctions: true });
  };

  // Performs custom modifications to post/note data.
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

  // Adds a title attribute with value `title` to `element`, or appends to
  // `element`'s title attribute if it already exists.
  const addTitle = (element, title) => {
    if (title === undefined) {
      return;
    }
    if (element.hasAttribute("title")) {
      title = element.getAttribute("title") + "|" + title;
    }
    element.setAttribute("title", title);
  };

  // Adds an action to the main dropdown for a question or note.
  const addAction = (text, action) => {
    const actionsDropdown =
      document.getElementById(mainDropdownID);
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

  // Adds the user ID tooltip when hovering over a username.
  const addUsernameHooks = () => {
    const elements = document.getElementsByClassName(usernameClass);
    for (const element of elements) {
      if (element.dataset.usernameHooksAdded !== "true") {
        element.dataset.usernameHooksAdded = "true";
        let usernameClass = null;
        for (const cls of element.classList.values()) {
          if (cls.startsWith(usernameClassPrefix)) {
            usernameClass = cls;
            break;
          }
        }
        if (usernameClass !== null) {
          const title = usernameClass.substring(usernameClassPrefix.length);
          addTitle(element, title);
        }
      }
    }
  };
  addUsernameHooks();

  // Helper function for addEndorseHooks.
  const addEndorseHooksChildren = (data) => {
    for (const child of data.children) {
      let users = null;
      let element = null;
      switch (child.type) {
        case "s_answer":
          users = child.tag_endorse;
          element = document.querySelector(
            "#s_answer > .post_region_actions > " +
            ".post_actions_number.good_answer"
          );
          break;
        case "i_answer":
          users = child.tag_endorse;
          element = document.querySelector(
            "#i_answer > .post_region_actions > " +
            ".post_actions_number.good_answer"
          );
          break;
        default:
          users = child.tag_good;
          element = document.getElementById(child.id).querySelector(
            ".followup_actions > .number"
          );
      }
      if (users !== null && element !== null) {
        const title = users.map(clone(user => user.name)).join(", ");
        addTitle(element, title);
      }
      addEndorseHooksChildren(child);
    }
  };

  // Adds the usernames tooltip when hovering over the number of people
  // who have reacted to a message (thanks, helpful, good note, etc.).
  const addEndorseHooks = () => {
    const data = global.P.feed.content;
    if (data === null) {
      return;
    }

    const goodNoteEl = document.querySelector(".post_actions_number.good_note");

    if (goodNoteEl !== null) {
      const title = data.tag_good.map(clone(user => user.name)).join(", ");
      addTitle(goodNoteEl, title);
    }
    addEndorseHooksChildren(data);
  };

  // Called whenever the post content is changed.
  global.PEM.addListener("content", clone(() => {
    addUsernameHooks();
    addEndorseHooks();

    // Add an action for viewing raw post data to the main question/note.
    addAction("Print Raw", () => {
      const content = global.P.feed.content;
      console.log(content);
    });
  }));
})(window.wrappedJSObject);
