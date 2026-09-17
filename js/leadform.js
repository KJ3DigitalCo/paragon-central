(function () {
  var ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbymv-iXwL4MyUd3M30NZAcl6gq2DqrfTrGqu1Tm6MM4iaAwTO8jd4PC5jwptW39ObSb/exec';
  var MESSENGER_URL = 'https://m.me/61593608711410';
  var MAX_CV_BYTES = 5 * 1024 * 1024; // 5MB — keeps the base64 POST small enough for Apps Script to handle reliably

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

  // Simulated progress, not real upload.progress: XMLHttpRequest to Apps Script's
  // /exec endpoint fails at the network level (its redirect response trips up
  // XHR's stricter CORS handling), even though the request actually gets through.
  // fetch(...,{mode:'no-cors'}) is the only mechanism that reliably delivers to
  // Apps Script cross-origin, but it gives no real progress events, so we ease the
  // bar toward 90% over an estimated duration and snap to 100% on actual completion.
  function fakeProgress(fileSize, onProgress) {
    var ASSUMED_BYTES_PER_MS = 400; // ~400KB/s, a conservative mobile-data estimate
    var estimatedMs = fileSize / ASSUMED_BYTES_PER_MS;
    var start = Date.now();
    var interval = setInterval(function () {
      var elapsed = Date.now() - start;
      var fraction = Math.min(0.9, elapsed / estimatedMs * 0.9);
      onProgress(fraction);
    }, 150);
    return function stop() { clearInterval(interval); };
  }

  document.querySelectorAll('form.lead-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalBtnText = submitBtn ? submitBtn.textContent : '';
      var cvInput = form.querySelector('input[type="file"][name="cv"]');
      var cvFile = cvInput && cvInput.files[0];

      if (cvFile && cvFile.size > MAX_CV_BYTES) {
        alert('That CV file is too big (max 5MB). Please pick a smaller file, or leave it blank.');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = cvFile ? 'Uploading CV...' : 'Sending...';
      }

      var progressFill = null;
      var stopProgress = null;
      if (cvFile && submitBtn) {
        var bar = document.createElement('div');
        bar.className = 'upload-progress';
        bar.innerHTML = '<div class="upload-progress-fill"></div>';
        submitBtn.insertAdjacentElement('afterend', bar);
        progressFill = bar.querySelector('.upload-progress-fill');
        stopProgress = fakeProgress(cvFile.size, function (fraction) {
          progressFill.style.width = Math.round(fraction * 100) + '%';
        });
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
          // (offline, DNS, etc.) is what actually lands in .catch(). Do NOT switch
          // this to XMLHttpRequest — Apps Script's /exec redirect response trips up
          // XHR's CORS handling and silently drops the submission (see fakeProgress
          // comment above for how we found this).
          return fetch(ENDPOINT_URL, { method: 'POST', mode: 'no-cors', body: formData });
        })
        .then(function () {
          if (stopProgress) stopProgress();
          if (progressFill) progressFill.style.width = '100%';
          showSuccess(form);
        })
        .catch(function () {
          if (stopProgress) stopProgress();
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
          }
          if (progressFill) progressFill.parentElement.remove();
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
