(function () {
  var ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbymv-iXwL4MyUd3M30NZAcl6gq2DqrfTrGqu1Tm6MM4iaAwTO8jd4PC5jwptW39ObSb/exec';
  var MESSENGER_URL = 'https://m.me/61593608711410';
  var MAX_CV_BYTES = 2 * 1024 * 1024; // 2MB — plenty for a resume PDF, keeps mobile-data upload time reasonable

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        // reader.result is "data:<mime>;base64,<data>" — Apps Script only wants the data part
        resolve(String(reader.result).split(',')[1] || '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  document.querySelectorAll('form.lead-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalBtnText = submitBtn ? submitBtn.textContent : '';
      var cvInput = form.querySelector('input[type="file"][name="cv"]');
      var cvFile = cvInput && cvInput.files[0];

      if (cvFile && cvFile.size > MAX_CV_BYTES) {
        alert('That CV file is too big (max 2MB). Please pick a smaller file, or leave it blank.');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = cvFile ? 'Uploading CV...' : 'Sending...';
      }

      var formData = new FormData(form);
      formData.delete('cv'); // the raw File object can't be read server-side via no-cors; base64 fields below replace it
      formData.append('formType', form.dataset.formType || '');

      var ready = cvFile
        ? fileToBase64(cvFile).then(function (base64) {
            formData.append('cvData', base64);
            formData.append('cvFileName', cvFile.name);
            formData.append('cvMimeType', cvFile.type || 'application/octet-stream');
          })
        : Promise.resolve();

      ready
        .then(function () {
          // mode:'no-cors' means the response is opaque (can't read result.success),
          // but the promise still resolves once the request is sent successfully —
          // that's enough to know it reached the sheet. A genuine network failure
          // (offline, DNS, etc.) is what actually lands in .catch().
          return fetch(ENDPOINT_URL, { method: 'POST', mode: 'no-cors', body: formData });
        })
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
