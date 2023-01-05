// ⚡️ Import Styles
import './style.scss';
import feather from 'feather-icons';
import { showNotification } from './modules/showNotification.js';
import { uid } from './modules/uid.js';

// ⚡️ Render Skeleton
document.querySelector('#app').innerHTML = `
<div class='app-container'>
  <div class='notes'>
    <h2 class='title'>Notes</h2>
    <div class='main' data-notes=''>
      <div class='item item--add'>
        <button data-create=''>${feather.icons.plus.toSvg()}</button>
        <p>Add new note</p>
      </div>
    </div>

    <div class='overlay' data-overlay=''>
      <div class='modal'>
        <h2 class='h4' data-heading=''>Add new note</h2>
        <button class='close' data-close=''>${feather.icons.x.toSvg()}</button>
        <form data-form=''>
          <input type='text' class='visually-hidden' name='date'>
          <input type='text' class='visually-hidden' name='noteid'>
          <label>
            <span>Title</span>
            <input type='text' name='title'>
          </label>
          <label>
            <span>Description</span>
            <textarea name='description'></textarea>
          </label>
          <button type='submit'>Add Note</button>
        </form>
      </div>
    </div>
  </div>

  <a class='app-author' href='https://github.com/nagoev-alim' target='_blank'>${feather.icons.github.toSvg()}</a>
</div>
`;

// ⚡️Create Class
class App {
  constructor() {
    this.DOM = {
      notes: {
        self: document.querySelector('[data-notes]'),
        btnCreate: document.querySelector('[data-create]'),
      },
      modal: {
        self: document.querySelector('[data-overlay]'),
        heading: document.querySelector('[data-heading]'),
        btnClose: document.querySelector('[data-close]'),
        form: document.querySelector('[data-form]'),
      },
    };

    this.PROPS = {
      notes: this.storageGet(),
    };

    this.storageDisplay();

    this.DOM.notes.btnCreate.addEventListener('click', this.toggleModal);
    this.DOM.modal.self.addEventListener('click', this.toggleModal);
    document.addEventListener('keydown', this.toggleModal);

    this.DOM.modal.form.addEventListener('submit', this.onSubmit);
    this.DOM.notes.self.addEventListener('click', this.onClickNotes);
  }

  /**
   * @function storageGet - Get data from local storage
   * @returns {any|*[]}
   */
  storageGet = () => {
    return localStorage.getItem('notes') ? JSON.parse(localStorage.getItem('notes')) : [];
  };

  /**
   * @function storageAdd - Add data to local storage
   */
  storageAdd = (data) => {
    return localStorage.setItem('notes', JSON.stringify(data));
  };

  /**
   * @function storageDisplay - Get and display from local storage
   */
  storageDisplay = () => {
    const notes = this.storageGet();
    this.renderHTML(notes);
  };

  /**
   * @function toggleModal - Show/Hide Modal
   * @param target
   * @param key
   */
  toggleModal = ({ target, key }) => {
    if (key === 'Escape' || target.matches('[data-close]') || target.matches('[data-overlay]')) {
      this.DOM.modal.self.classList.add('hidden');
      setTimeout(() => this.DOM.modal.self.classList.remove('hidden', 'open'), 800);
    } else if (target.matches('[data-create]')) {
      this.DOM.modal.self.classList.add('open');
      this.DOM.modal.form.removeEventListener('submit', this.onUpdate);
      this.DOM.modal.form.addEventListener('submit', this.onSubmit);
    }
  };

  /**
   * @function onSubmit - Form submit handler
   * @param event
   */
  onSubmit = (event) => {
    event.preventDefault();
    const form = event.target;
    const { title, description } = Object.fromEntries(new FormData(form).entries());
    // Validate
    if (title.trim().length === 0 || description.trim().length === 0) {
      showNotification('warning', 'Please fill the fields.');
      return;
    }
    // Create new note
    const note = {
      title,
      description,
      date: new Date().toLocaleDateString('en-EN', { year: 'numeric', month: 'long', day: '2-digit' }),
      id: uid(),
    };
    // Add new note
    this.PROPS.notes = [...this.PROPS.notes, note];
    // Rerender UI
    this.renderHTML(this.PROPS.notes);
    this.storageAdd(this.PROPS.notes);
    // Show notification
    showNotification('success', 'The note has been successfully created.');
    // Reset form
    form.reset();
    // Hide modal
    this.DOM.modal.self.classList.add('hidden');
    setTimeout(() => this.DOM.modal.self.classList.remove('hidden', 'open'), 800);
  };

  /**
   * @function renderHTML - Render data HTML
   * @param data
   */
  renderHTML = (data) => {
    document.querySelectorAll('.item:not(.item--add)').forEach(note => note.remove());

    for (const { title, description, date, id } of data) {
      const html = `
        <div class='item'>
          <h4>${title}</h4>
          <p>${description}</p>
          <div class='footer'>
            <p class='date'>${date}</p>
            <div class='action'>
              <button data-more=''>${feather.icons['more-horizontal'].toSvg()}</button>
              <div class='buttons'>
                <button data-edit='${id}'>${feather.icons.edit.toSvg()}Edit</button>
                <button data-trash='${id}'>${feather.icons.trash.toSvg()}Delete</button>
              </div>
            </div>
          </div>
        </div>`;

      this.DOM.notes.self.querySelector('.item--add').insertAdjacentHTML('afterend', html);
    }
  };

  /**
   * @function onClickNotes - Notes click event handler
   * @param target
   */
  onClickNotes = ({ target }) => {
    // Show actions
    if (target.matches('[data-more=""]')) {
      target.nextElementSibling.classList.toggle('show');
    }

    // Delete note
    if (target.matches('[data-trash]')) {
      const id = target.dataset.trash;
      this.PROPS.notes = this.PROPS.notes.filter(note => note.id !== id);
      this.renderHTML(this.PROPS.notes);
      this.storageAdd(this.PROPS.notes);
      showNotification('success', 'The note has been successfully deleted.');
    }

    // Edit note
    if (target.matches('[data-edit]')) {
      const id = target.dataset.edit;
      const note = this.PROPS.notes.find(note => note.id === id);
      target.parentElement.classList.toggle('show');
      this.onEdit(note);
    }
  };

  /**
   * @function onEdit - Edit note event handler
   * @param note
   */
  onEdit = (note) => {
    // Show modal
    this.DOM.modal.self.classList.add('open');
    // Update modal fields
    this.DOM.modal.form.title.value = note.title;
    this.DOM.modal.form.description.value = note.description;
    this.DOM.modal.form.date.value = note.date;
    this.DOM.modal.form.noteid.value = note.id;
    this.DOM.modal.form.querySelector('button').textContent = 'Update note';
    this.DOM.modal.heading.textContent = 'Update note';
    // Add new event listener
    this.DOM.modal.form.removeEventListener('submit', this.onSubmit);
    this.DOM.modal.form.addEventListener('submit', this.onUpdate);
  };

  /**
   * @function onUpdate - Update note
   * @param event
   */
  onUpdate = (event) => {
    event.preventDefault();
    const form = event.target;
    const { title, description, noteid, date } = Object.fromEntries(new FormData(form).entries());
    // Validate
    if (title.trim().length === 0 || description.trim().length === 0) {
      showNotification('warning', 'Please fill the fields.');
      return;
    }
    // Filter notes
    this.PROPS.notes = this.PROPS.notes.map(note => note.id === noteid ? {
      title,
      description,
      id: noteid,
      date,
    } : note);
    // Rerender UI
    this.renderHTML(this.PROPS.notes);
    this.storageAdd(this.PROPS.notes);
    // Reset form
    form.reset();
    // Show notification
    showNotification('success', 'The note has been successfully updated.');
    // Hide modal
    this.DOM.modal.self.classList.add('hidden');
    setTimeout(() => this.DOM.modal.self.classList.remove('hidden', 'open'), 800);
    // Revert text
    this.DOM.modal.form.querySelector('button').textContent = 'Add new note';
    this.DOM.modal.heading.textContent = 'Add note';
  };

}

// ⚡️Class instance
new App();
