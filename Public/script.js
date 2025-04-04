let token = null;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value;
        const password = document.getElementById('regPassword').value;
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();
        document.getElementById('authMessage').textContent = response.ok ? 'Registered! Now log in.' : result.error;
    });

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();
        if (response.ok) {
            token = result.token;
            document.getElementById('auth-section').style.display = 'none';
            document.getElementById('todo-section').style.display = 'block';
            fetchItems();
        } else {
            document.getElementById('authMessage').textContent = result.error;
        }
    });

    document.getElementById('addForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('itemName').value;
        await addItem(name);
        document.getElementById('itemName').value = '';
        fetchItems();
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        token = null;
        document.getElementById('todo-section').style.display = 'none';
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('authMessage').textContent = '';
    });
});

async function fetchItems() {
    const response = await fetch('/api/items', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const items = await response.json();
    const itemList = document.getElementById('itemList');
    itemList.innerHTML = '';
    items.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item.name}</span>
            <div>
                <input type="text" value="${item.name}" id="edit-${item._id}" style="display:none;">
                <button onclick="editItem('${item._id}')">Edit</button>
                <button onclick="saveItem('${item._id}')" style="display:none;">Save</button>
                <button onclick="deleteItem('${item._id}')">Delete</button>
            </div>
        `;
        itemList.appendChild(li);
    });
}

async function addItem(name) {
    await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name })
    });
}

function editItem(id) {
    const span = document.querySelector(`#itemList li span`);
    const editInput = document.getElementById(`edit-${id}`);
    const editBtn = document.querySelector(`#itemList li button:nth-child(1)`);
    const saveBtn = document.querySelector(`#itemList li button:nth-child(2)`);
    span.style.display = 'none';
    editInput.style.display = 'inline';
    editBtn.style.display = 'none';
    saveBtn.style.display = 'inline';
}

async function saveItem(id) {
    const editInput = document.getElementById(`edit-${id}`);
    const newName = editInput.value;
    await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newName })
    });
    fetchItems();
}

async function deleteItem(id) {
    await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchItems();
}