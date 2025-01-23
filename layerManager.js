export class LayerManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.layers = new Map();
  }

  addLayer(id, name, layer) {
    const layerItem = document.createElement('div');
    layerItem.className = 'layer-item';
    
    const visibility = document.createElement('input');
    visibility.type = 'checkbox';
    visibility.checked = true;
    visibility.addEventListener('change', (e) => {
      if (e.target.checked) {
        layer.addTo(map);
      } else {
        layer.remove();
      }
    });

    const label = document.createElement('span');
    label.textContent = name;

    const controls = document.createElement('div');
    controls.className = 'layer-controls';

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', () => this.removeLayer(id));

    controls.appendChild(deleteBtn);
    layerItem.appendChild(visibility);
    layerItem.appendChild(label);
    layerItem.appendChild(controls);

    this.container.appendChild(layerItem);
    this.layers.set(id, { element: layerItem, layer });
  }

  removeLayer(id) {
    const layerData = this.layers.get(id);
    if (layerData) {
      layerData.layer.remove();
      layerData.element.remove();
      this.layers.delete(id);
    }
  }

  updateLayerOrder() {
    // Implement drag and drop reordering
  }
}