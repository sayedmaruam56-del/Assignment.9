const STORAGE_KEY = 'contactHubContacts';

let contacts = loadContacts();
let editingId = null;

const modalElement = document.getElementById('contactModal');
const contactModal = new bootstrap.Modal(modalElement);
const form = document.getElementById('contactForm');
const modalTitle = document.getElementById('modalTitle');
const saveBtn = document.getElementById('saveBtn');
const nameInput = document.getElementById('contactName');
const phoneInput = document.getElementById('contactPhone');
const emailInput = document.getElementById('contactEmail');
const addressInput = document.getElementById('contactAddress');
const groupInput = document.getElementById('contactGroup');
const notesInput = document.getElementById('contactNotes');
const favoriteInput = document.getElementById('contactFavorite');
const emergencyInput = document.getElementById('contactEmergency');
const photoInput = document.getElementById('contactPhoto');
const photoPlaceholder = document.querySelector('.contact-photo-placeholder');
let selectedPhoto = '';

form.addEventListener('submit', (event) => {
    event.preventDefault();
    saveContact();
});

displayContacts(contacts);

function loadContacts() {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem('contacts') || '[]');
        return Array.isArray(stored) ? stored.map(contact => ({
            id: contact.id || createId(),
            name: contact.name || '',
            phone: contact.phone || '',
            email: contact.email || '',
            address: contact.address || '',
            group: contact.group || '',
            notes: contact.notes || '',
            photo: contact.photo || '',
            isFavorite: Boolean(contact.isFavorite),
            isEmergency: Boolean(contact.isEmergency)
        })) : [];
    } catch {
        return [];
    }
}

function openAddModal() {
    editingId = null;
    modalTitle.textContent = 'Add New Contact';
    saveBtn.textContent = 'Save Contact';
    clearForm();
    hideErrors();
    contactModal.show();
}

function openUpdateModal(id) {
    const contact = contacts.find(item => item.id === id);
    if (!contact) return;

    editingId = id;
    modalTitle.textContent = 'Update Contact';
    saveBtn.textContent = 'Update Changes';
    nameInput.value = contact.name;
    phoneInput.value = contact.phone;
    emailInput.value = contact.email;
    addressInput.value = contact.address;
    groupInput.value = contact.group;
    notesInput.value = contact.notes;
    favoriteInput.checked = contact.isFavorite;
    emergencyInput.checked = contact.isEmergency;
    setPhoto(contact.photo || '');
    hideErrors();
    contactModal.show();
}

function validateInputs() {
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const email = emailInput.value.trim();
    const nameIsValid = /^[a-zA-Z\u0600-\u06FF\s]{2,50}$/.test(name);
    const phoneIsValid = /^01[0125][0-9]{8}$/.test(phone);
    const emailIsValid = email === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

    setError('nameError', !nameIsValid);
    setError('phoneError', !phoneIsValid);
    setError('emailError', !emailIsValid);
    return nameIsValid && phoneIsValid && emailIsValid;
}

function setError(id, show) {
    document.getElementById(id).classList.toggle('d-none', !show);
}

function saveContact() {
    if (!validateInputs()) return;

    const existing = contacts.find(contact => contact.id === editingId);
    const contact = {
        id: editingId || createId(),
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        email: emailInput.value.trim(),
        address: addressInput.value.trim(),
        group: groupInput.value,
        notes: notesInput.value.trim(),
        photo: selectedPhoto,
        isFavorite: favoriteInput.checked,
        isEmergency: emergencyInput.checked
    };

    if (editingId) {
        contacts = contacts.map(item => item.id === editingId ? contact : item);
        showSuccess('Updated!', 'Contact updated successfully.');
    } else {
        contacts.push(contact);
        showSuccess('Added!', 'Contact added successfully.');
    }

    persistContacts();
    displayContacts(getSearchResults());
    contactModal.hide();
}

function displayContacts(list) {
    const emptyState = document.getElementById('emptyState');
    const tableContainer = document.getElementById('tableContainer');
    const hasSearch = document.getElementById('searchInput').value.trim() !== '';
    document.getElementById('totalCount').textContent = list.length;

    emptyState.classList.toggle('d-none', list.length !== 0);
    tableContainer.classList.toggle('d-none', list.length === 0);
    if (list.length === 0 && hasSearch) {
        emptyState.querySelector('h5').textContent = 'No contacts found';
        emptyState.querySelector('p').textContent = 'Try searching by another name, phone, or email';
    } else {
        emptyState.querySelector('h5').textContent = 'No contacts found';
        emptyState.querySelector('p').textContent = 'Click "Add Contact" to get started';
    }

    document.getElementById('contactsBody').innerHTML = list.map(contact => `
        <article class="contact-card">
            <div class="contact-card-main">
                <div class="contact-card-heading">
                    ${contact.photo ? `<img src="${contact.photo}" alt="${escapeHtml(contact.name)}" class="contact-card-avatar">` : `<div class="contact-card-avatar initials">${getInitials(contact.name)}</div>`}
                    <div class="contact-card-title">
                        <h3>${escapeHtml(contact.name)}</h3>
                        <a class="contact-detail phone-detail" href="tel:${encodeURIComponent(contact.phone)}"><span class="detail-icon phone-icon"><i class="fa-solid fa-phone"></i></span>${escapeHtml(contact.phone)}</a>
                    </div>
                    <button class="icon-button favorite-button card-favorite ${contact.isFavorite ? 'active' : ''}" onclick="toggleFavorite('${contact.id}')" aria-label="${contact.isFavorite ? 'Remove from favorites' : 'Add to favorites'}"><i class="fa-solid fa-star"></i></button>
                </div>
                <div class="contact-details">
                    ${contact.email ? `<a class="contact-detail" href="mailto:${encodeURIComponent(contact.email)}"><span class="detail-icon email-icon"><i class="fa-solid fa-envelope"></i></span>${escapeHtml(contact.email)}</a>` : ''}
                    ${contact.address ? `<div class="contact-detail"><span class="detail-icon address-icon"><i class="fa-solid fa-location-dot"></i></span>${escapeHtml(contact.address)}</div>` : ''}
                </div>
                <div class="contact-tags">
                    ${contact.group ? `<span class="contact-tag group-tag">${escapeHtml(contact.group)}</span>` : ''}
                    ${contact.isEmergency ? '<span class="contact-tag emergency-tag"><i class="fa-solid fa-heart-pulse"></i> Emergency</span>' : ''}
                </div>
            </div>
            <div class="contact-card-actions">
                <a href="tel:${encodeURIComponent(contact.phone)}" class="card-action call-action" title="Call"><i class="fa-solid fa-phone"></i></a>
                ${contact.email ? `<a href="mailto:${encodeURIComponent(contact.email)}" class="card-action email-action" title="Email"><i class="fa-solid fa-envelope"></i></a>` : ''}
                <span class="action-spacer"></span>
                <button class="card-action favorite-action ${contact.isFavorite ? 'active' : ''}" onclick="toggleFavorite('${contact.id}')" title="Favorite"><i class="fa-solid fa-star"></i></button>
                <button class="card-action emergency-action ${contact.isEmergency ? 'active' : ''}" onclick="toggleEmergency('${contact.id}')" title="Emergency"><i class="fa-solid fa-heart-pulse"></i></button>
                <button class="card-action edit-action" onclick="openUpdateModal('${contact.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="card-action delete-action" onclick="deleteContact('${contact.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </div>
        </article>
    `).join('');

    updateWidgets();
}

function updateWidgets() {
    const favorites = contacts.filter(contact => contact.isFavorite);
    const emergencies = contacts.filter(contact => contact.isEmergency);
    document.getElementById('totalStat').textContent = contacts.length;
    document.getElementById('favoriteStat').textContent = favorites.length;
    document.getElementById('emergencyStat').textContent = emergencies.length;
    const container = document.getElementById('favoritesList');
    const emergencyWidget = document.querySelector('.widget-emergency > div:last-child');
    emergencyWidget.innerHTML = emergencies.length
        ? emergencies.map(contact => `<div class="small-fav-item"><span class="widget-avatar initials">${getInitials(contact.name)}</span><div class="widget-contact-copy"><strong>${escapeHtml(contact.name)}</strong><span>${escapeHtml(contact.phone)}</span></div><a href="tel:${encodeURIComponent(contact.phone)}" class="widget-emergency-call" title="Call"><i class="fa-solid fa-phone"></i></a></div>`).join('')
        : 'No emergency contacts';
    emergencyWidget.className = emergencies.length ? 'emergency-items' : 'text-center text-muted small py-3';

    if (!favorites.length) {
        container.className = 'text-center text-muted small py-3';
        container.textContent = 'No favorites yet';
        return;
    }

    container.className = 'favorites-items';
    container.innerHTML = favorites.map(contact => `
        <div class="small-fav-item">
            ${contact.photo ? `<img src="${contact.photo}" alt="" class="widget-avatar">` : `<span class="widget-avatar initials">${getInitials(contact.name)}</span>`}
            <div class="widget-contact-copy"><strong>${escapeHtml(contact.name)}</strong><span>${escapeHtml(contact.phone)}</span></div>
            <a href="tel:${encodeURIComponent(contact.phone)}" class="widget-call" title="Call"><i class="fa-solid fa-phone"></i></a>
        </div>
    `).join('');
}

function toggleFavorite(id) {
    contacts = contacts.map(contact => contact.id === id
        ? { ...contact, isFavorite: !contact.isFavorite }
        : contact);
    persistContacts();
    displayContacts(getSearchResults());
}

function toggleEmergency(id) {
    contacts = contacts.map(contact => contact.id === id
        ? { ...contact, isEmergency: !contact.isEmergency }
        : contact);
    persistContacts();
    displayContacts(getSearchResults());
}

function deleteContact(id) {
    const contact = contacts.find(item => item.id === id);
    if (!contact) return;

    Swal.fire({
        title: 'Are you sure?',
        text: `Delete ${contact.name}? This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    }).then(result => {
        if (!result.isConfirmed) return;
        contacts = contacts.filter(item => item.id !== id);
        persistContacts();
        displayContacts(getSearchResults());
        Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Contact has been deleted.', timer: 1500, showConfirmButton: false });
    });
}

function searchContacts() {
    displayContacts(getSearchResults());
}

function getSearchResults() {
    const term = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!term) return contacts;
    return contacts.filter(contact => [contact.name, contact.phone, contact.email]
        .some(value => value.toLowerCase().includes(term)));
}

function persistContacts() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    localStorage.setItem('contacts', JSON.stringify(contacts));
}

function clearForm() {
    form.reset();
    setPhoto('');
}

function hideErrors() {
    ['nameError', 'phoneError', 'emailError'].forEach(id => setError(id, false));
}

function showSuccess(title, text) {
    Swal.fire({ icon: 'success', title, text, timer: 1500, showConfirmButton: false });
}

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
    }[character]));
}

function createId() {
    return window.crypto && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => setPhoto(event.target.result);
    reader.readAsDataURL(file);
});

function setPhoto(photo) {
    selectedPhoto = photo;
    photoPlaceholder.innerHTML = photo ? `<img src="${photo}" alt="Contact photo">` : '<i class="fa-solid fa-user"></i>';
}

function getInitials(name) {
    return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}