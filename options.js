// Saves options to chrome.storage
const saveOptions = () => {
    const api_key = document.getElementById('api_key').value;
  
    chrome.storage.local.set(
      { api_key: api_key },
      () => {
        // Update status to let user know options were saved.
        const status = document.getElementById('status');
        status.textContent = 'Options saved.';

        chrome.runtime.sendMessage({ message: "optionsUpdated"});

        setTimeout(() => {
          status.textContent = '';
        }, 750);
      }
    );
  };
  
  // Restores select box and checkbox state using the preferences
  // stored in chrome.storage.
  const restoreOptions = () => {
    chrome.storage.local.get(
      { api_key: '' },
      (items) => {
        document.getElementById('api_key').value = items.api_key;
      }
    );
  };
  
  document.addEventListener('DOMContentLoaded', restoreOptions);
  document.getElementById('save').addEventListener('click', saveOptions);