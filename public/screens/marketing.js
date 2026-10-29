// =============================================
// Marketing screens disabled — redirects to auth-login
// =============================================
(function () {
  if (typeof window.Screens === 'undefined') {
    window.Screens = {};
  }

  ['landing', 'product', 'solutions', 'pricing', 'company'].forEach((screen) => {
    window.Screens[screen] = function () {
      setTimeout(() => {
        if (window.Router) {
          window.Router.go('auth-login');
        }
      }, 0);
      return '';
    };
  });
})();
