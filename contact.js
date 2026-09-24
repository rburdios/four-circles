document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const success = document.getElementById('contactSuccess');
  const chips = document.querySelectorAll('.chip');
  const selectedServices = new Set();

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const value = chip.dataset.value;
      if (selectedServices.has(value)) {
        selectedServices.delete(value);
        chip.classList.remove('is-selected');
      } else {
        selectedServices.add(value);
        chip.classList.add('is-selected');
      }
      clearError('serviceChips');
    });
  });

  document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('input', () => {
      clearError(input.id);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const name = document.getElementById('name');
    if (!name.value.trim()) {
      showError('name', 'nameError');
      valid = false;
    }

    const email = document.getElementById('email');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value.trim() || !emailPattern.test(email.value.trim())) {
      showError('email', 'emailError');
      valid = false;
    }

    if (selectedServices.size === 0) {
      showError('serviceChips', 'serviceError');
      valid = false;
    }

    const project = document.getElementById('project');
    if (!project.value.trim()) {
      showError('project', 'projectError');
      valid = false;
    }

    if (!valid) return;

    document.getElementById('servicesInput').value = Array.from(selectedServices).join(', ');

    const btn = document.getElementById('submitBtn');
    const btnLabel = btn.querySelector('span');
    const submitError = document.getElementById('submitError');
    submitError.classList.remove('is-visible');
    btn.disabled = true;
    btnLabel.textContent = 'Sending...';

    const body = new URLSearchParams(new FormData(form)).toString();

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })
      .then((response) => {
        if (!response.ok) throw new Error('Form submission failed');
        form.style.display = 'none';
        success.classList.add('is-visible');
      })
      .catch(() => {
        submitError.classList.add('is-visible');
        btn.disabled = false;
        btnLabel.textContent = 'Start a project';
      });
  });

  function showError(inputId, errorId) {
    const group = document.getElementById(inputId).closest('.form-group');
    group.classList.add('has-error');
    const input = document.getElementById(inputId);
    if (input.classList) input.classList.add('has-error');
  }

  function clearError(inputId) {
    const el = document.getElementById(inputId);
    if (!el) return;
    const group = el.closest('.form-group');
    if (group) group.classList.remove('has-error');
    el.classList.remove('has-error');
  }
});
