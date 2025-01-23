export class StyleEditor {
  constructor(modalId) {
    this.modal = document.getElementById(modalId);
    this.currentFeature = null;
    
    this.initializeControls();
  }

  initializeControls() {
    document.getElementById('apply-style').addEventListener('click', () => {
      this.applyStyle();
      this.hide();
    });

    document.getElementById('close-style-editor').addEventListener('click', () => {
      this.hide();
    });
  }

  show(feature) {
    this.currentFeature = feature;
    if (feature) {
      this.loadFeatureStyle(feature);
    }
    this.modal.style.display = 'block';
  }

  hide() {
    this.modal.style.display = 'none';
    this.currentFeature = null;
  }

  loadFeatureStyle(feature) {
    const style = feature.options;
    document.getElementById('fill-color').value = style.fillColor || '#ff0000';
    document.getElementById('stroke-color').value = style.color || '#000000';
    document.getElementById('stroke-width').value = style.weight || 2;
    document.getElementById('opacity').value = style.opacity || 1;
  }

  applyStyle() {
    if (!this.currentFeature) return;

    const style = {
      fillColor: document.getElementById('fill-color').value,
      color: document.getElementById('stroke-color').value,
      weight: parseFloat(document.getElementById('stroke-width').value),
      opacity: parseFloat(document.getElementById('opacity').value),
      fillOpacity: parseFloat(document.getElementById('opacity').value)
    };

    this.currentFeature.setStyle(style);
  }
}