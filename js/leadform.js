(function () {
  var ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbymv-iXwL4MyUd3M30NZAcl6gq2DqrfTrGqu1Tm6MM4iaAwTO8jd4PC5jwptW39ObSb/exec';
  var MESSENGER_URL = 'https://m.me/61593608711410';

  document.querySelectorAll('form.lead-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalBtnText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      var formData = new FormData(form);
      formData.append('formType', form.dataset.formType || '');

      // mode:'no-cors' means the response is opaque (can't read result.success),
      // but the promise still resolves once the request is sent successfully —
      // that's enough to know it reached the sheet. A genuine network failure
      // (offline, DNS, etc.) is what actually lands in .catch().
      fetch(ENDPOINT_URL, { method: 'POST', mode: 'no-cors', body: formData })
        .then(function () { showSuccess(form); })
        .catch(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
          }
          alert("Something went wrong sending your info. Please try again in a moment.");
        });
    });
  });

  function showSuccess(form) {
    var wrapper = document.createElement('div');
    wrapper.className = 'form-success';
    wrapper.innerHTML = '<h3>You’re in!</h3><p>Taking you to our Messenger chat in a few seconds, that’s where we’ll follow up if we can’t reach you by call.</p>';
    form.replaceWith(wrapper);
    // Brief pause so the message actually registers before the tab leaves,
    // instead of the page vanishing the instant they hit submit.
    setTimeout(function () {
      window.location.href = MESSENGER_URL;
    }, 1800);
  }
})();
