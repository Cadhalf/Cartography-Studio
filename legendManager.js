export class LegendManager {
  constructor(mapManager) {
    this.mapManager = mapManager;
    this.map = mapManager.map;
    this.legend = null;
    this.isEditing = false;
    this.legendItems = [];
  }

  toggleLegendEditor() {
    if (!this.legend) {
      this.createLegend();
    }
    
    this.isEditing = !this.isEditing;
    const button = document.getElementById('add-legend');
    
    if (this.isEditing) {
      button.classList.add('active');
      this.showLegendEditor();
    } else {
      button.classList.remove('active');
      this.hideLegendEditor();
    }
  }

  createLegend() {
    const legendControl = L.control({ position: 'bottomright' });
    
    legendControl.onAdd = (map) => {
      const div = L.DomUtil.create('div', 'info legend');
      div.innerHTML = '<h4>Legend</h4><div class="legend-content"></div>';
      this.legend = div;
      return div;
    };
    
    legendControl.addTo(this.map);
  }

  showLegendEditor() {
    const editor = document.createElement('div');
    editor.className = 'legend-editor';
    editor.innerHTML = `
      <h3>Legend Editor</h3>
      <div class="legend-items"></div>
      <div class="legend-controls">
        <button class="add-item">Add Item</button>
        <button class="import-image">Import Image</button>
        <button class="save-legend">Save Legend</button>
      </div>
      <input type="file" id="legend-image-input" accept="image/*" style="display: none">
    `;
    
    document.body.appendChild(editor);
    
    this.bindEditorEvents(editor);
    this.populateExistingItems();
  }

  bindEditorEvents(editor) {
    editor.querySelector('.add-item').addEventListener('click', () => {
      this.addLegendItem();
    });
    
    editor.querySelector('.import-image').addEventListener('click', () => {
      document.getElementById('legend-image-input').click();
    });
    
    editor.querySelector('#legend-image-input').addEventListener('change', (e) => {
      this.handleImageImport(e);
    });
    
    editor.querySelector('.save-legend').addEventListener('click', () => {
      this.saveLegend();
    });
  }

  addLegendItem(imageUrl = '') {
    const itemsContainer = document.querySelector('.legend-items');
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
      <div class="legend-item-preview">
        ${imageUrl ? 
          `<img src="${imageUrl}" alt="Legend icon" class="legend-icon">` :
          '<div class="color-preview"></div>'
        }
      </div>
      <input type="text" class="legend-label" placeholder="Enter label">
      <input type="color" class="legend-color" value="#ff0000" ${imageUrl ? 'style="display: none;"' : ''}>
      <button class="remove-item">×</button>
    `;
    
    itemsContainer.appendChild(item);
    
    item.querySelector('.remove-item').addEventListener('click', () => {
      item.remove();
    });

    item.querySelector('.legend-color')?.addEventListener('change', (e) => {
      item.querySelector('.color-preview').style.backgroundColor = e.target.value;
    });
  }

  async handleImageImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const imageUrl = await this.readFileAsDataURL(file);
      this.addLegendItem(imageUrl);
    } catch (error) {
      console.error('Error importing image:', error);
      alert('Failed to import image. Please try again.');
    }
  }

  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  saveLegend() {
    const items = document.querySelectorAll('.legend-item');
    let content = '';
    
    items.forEach(item => {
      const label = item.querySelector('.legend-label').value;
      const preview = item.querySelector('.legend-item-preview');
      const img = preview.querySelector('img');
      
      if (label) {
        content += '<div class="legend-row">';
        if (img) {
          content += `<img src="${img.src}" class="legend-icon" alt="Legend icon">`;
        } else {
          const color = item.querySelector('.legend-color').value;
          content += `<i style="background: ${color}"></i>`;
        }
        content += `<span>${label}</span></div>`;
      }
    });
    
    this.legend.querySelector('.legend-content').innerHTML = content;
    this.hideLegendEditor();
  }

  hideLegendEditor() {
    const editor = document.querySelector('.legend-editor');
    if (editor) {
      editor.remove();
    }
    this.isEditing = false;
  }

  populateExistingItems() {
    const existingItems = this.legend.querySelectorAll('.legend-row');
    existingItems.forEach(item => {
      const img = item.querySelector('img');
      if (img) {
        this.addLegendItem(img.src);
      } else {
        const colorElement = item.querySelector('i');
        const color = colorElement?.style.background;
        this.addLegendItem();
        const newItem = document.querySelector('.legend-item');
        newItem.querySelector('.legend-color').value = color.replace('background: ', '').replace(';', '');
        newItem.querySelector('.legend-label').value = item.querySelector('span').textContent;
      }
    });
  }
}