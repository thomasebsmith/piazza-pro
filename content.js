(function(global) {
  let enabled = true;

  const noHistory = "no_history";

  const clone = (value) => {
    return cloneInto(value, window, { cloneFunctions: true });
  };
  const modify = (result) => {
    if (Array.isArray(result.tags)) {
      const index = result.tags.indexOf(noHistory);
      if (index != -1) {
        result.tags.splice(index, 1);
      }
    }
  };

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
})(window.wrappedJSObject);
