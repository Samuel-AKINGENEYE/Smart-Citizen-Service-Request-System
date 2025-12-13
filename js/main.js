<<<<<<< HEAD
const API_URL = 'http://localhost:3000/requests';
=======
const form = document.getElementById('requestForm');
const responseDiv = document.getElementById('response');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        const res = await fetch('http://localhost:3000/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        responseDiv.textContent = result.message || JSON.stringify(result);
        form.reset();
    } catch (err) {
        console.error(err);
        responseDiv.textContent = 'Error submitting request';
    }
});
>>>>>>> 1a6eb81 (Full working progress: backend + frontend integration, database connected, request submission working)

document.getElementById('reportForm').addEventListener('submit', e => {
    e.preventDefault();
    const data = {
        citizen_name: document.getElementById('name').value,
        contact_info: document.getElementById('contact').value,
        issue_type: document.getElementById('issueType').value,
        location: document.getElementById('location').value,
        description: document.getElementById('description').value
    };

    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(() => {
        alert('Request submitted!');
        document.getElementById('reportForm').reset();
        loadRequests();
    });
});

// Load all requests
function loadRequests() {
    fetch(API_URL)
    .then(res => res.json())
    .then(requests => {
        const container = document.getElementById('requestsList');
        container.innerHTML = '';
        requests.forEach(r => {
            container.innerHTML += `
                <div>
                    <strong>${r.citizen_name} (${r.contact_info})</strong><br>
                    Issue: ${r.issue_type}<br>
                    Location: ${r.location}<br>
                    Status: ${r.status}<br>
                    <p>${r.description}</p>
                </div><hr>`;
        });
    });
}

loadRequests();
