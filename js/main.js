const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/requests'
  : '/requests';

const requestForm = document.getElementById('requestForm') || document.getElementById('reportForm');
const responseDiv = document.getElementById('response');

function getFormFields(form) {
  if (!form) return null;
  return {
    citizen_name: form.querySelector('[name="citizen_name"]')?.value.trim() || '',
    contact_info: form.querySelector('[name="contact_info"]')?.value.trim() || '',
    issue_type: form.querySelector('[name="issue_type"]')?.value.trim() || '',
    location: form.querySelector('[name="location"]')?.value.trim() || '',
    description: form.querySelector('[name="description"]')?.value.trim() || '',
  };
}

async function submitRequest(event) {
  event.preventDefault();
  const data = getFormFields(requestForm);
  if (!data || !data.citizen_name || !data.contact_info || !data.issue_type || !data.description) {
    if (responseDiv) responseDiv.textContent = 'Please fill out all required fields.';
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Submission failed');
    if (responseDiv) responseDiv.textContent = result.message || 'Request submitted successfully';
    requestForm.reset();
    await loadRequests();
  } catch (err) {
    console.error(err);
    if (responseDiv) responseDiv.textContent = err.message || 'Error submitting request';
  }
}

async function loadRequests() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    const requests = Array.isArray(data) ? data : data.requests || [];
    const container = document.getElementById('requestsList');
    if (!container) return;
    container.innerHTML = requests.map(r => `
      <div>
        <strong>${r.citizen_name || r.name || 'Anonymous'} (${r.contact_info || r.contact || 'N/A'})</strong><br>
        Issue: ${r.issue_type || 'Unknown'}<br>
        Location: ${r.location || 'Not specified'}<br>
        Status: ${r.status || 'open'}<br>
        <p>${r.description || ''}</p>
      </div><hr>`).join('');
  } catch (err) {
    console.error('Failed to load requests', err);
  }
}

if (requestForm) {
  requestForm.addEventListener('submit', submitRequest);
}

loadRequests();
