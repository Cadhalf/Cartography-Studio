export class LabelManager {
  constructor(mapManager) {
    this.mapManager = mapManager;
    this.map = mapManager.map;
    this.labelMode = false;
    this.labels = new Map();
    
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    this.map.on('click', (e) => {
      if (this.labelMode) {
        this.addLabel(e.latlng);
      }
    });
  }

  toggleLabelMode() {
    this.labelMode = !this.labelMode;
    const button = document.getElementById('add-labels');
    
    if (this.labelMode) {
      button.classList.add('active');
      this.map.getContainer().style.cursor = 'crosshair';
    } else {
      button.classList.remove('active');
      this.map.getContainer().style.cursor = '';
    }
  }

  addLabel(latlng) {
    const text = prompt('Enter label text:');
    if (!text) return;

    const label = L.marker(latlng, {
      icon: L.divIcon({
        className: 'map-label',
        html: `<div class="label-content">${text}</div>`,
        iconSize: null
      })
    }).addTo(this.map);

    const id = Date.now().toString();
    this.labels.set(id, label);

    // Make label draggable
    label.dragging.enable();

    // Add right-click to edit
    label.on('contextmenu', (e) => {
      L.DomEvent.preventDefault(e);
      const newText = prompt('Edit label text:', text);
      if (newText) {
        label.setIcon(L.divIcon({
          className: 'map-label',
          html: `<div class="label-content">${newText}</div>`,
          iconSize: null
        }));
      }
    });
  }

  removeLabel(id) {
    const label = this.labels.get(id);
    if (label) {
      this.map.removeLayer(label);
      this.labels.delete(id);
    }
  }
}