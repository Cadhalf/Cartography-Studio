import { MapManager } from './mapManager.js';
import { LayerManager } from './layerManager.js';
import { ToolManager } from './toolManager.js';
import { LegendManager } from './legendManager.js';
import { LabelManager } from './labelManager.js';
import { HistoryManager } from './historyManager.js';

class CartographyApp {
  constructor() {
    this.mapManager = new MapManager('map');
    this.layerManager = new LayerManager('layers-list');
    this.toolManager = new ToolManager(this.mapManager);
    this.legendManager = new LegendManager(this.mapManager);
    this.labelManager = new LabelManager(this.mapManager);
    this.historyManager = new HistoryManager(this.mapManager);

    this.initializeEventListeners();
    this.initializeStatusBar();
  }

  initializeEventListeners() {
    // Drawing tools
    document.getElementById('draw-polygon').addEventListener('click', () => {
      this.toolManager.activateTool('polygon');
    });

    document.getElementById('draw-line').addEventListener('click', () => {
      this.toolManager.activateTool('line');
    });

    document.getElementById('draw-point').addEventListener('click', () => {
      this.toolManager.activateTool('point');
    });

    // Labels and Legend
    document.getElementById('add-labels').addEventListener('click', () => {
      this.labelManager.toggleLabelMode();
    });

    document.getElementById('add-legend').addEventListener('click', () => {
      this.legendManager.toggleLegendEditor();
    });

    // Export map as image
    document.getElementById('export-map').addEventListener('click', () => {
      this.mapManager.exportAsImage();
    });

    // Undo/Redo buttons
    document.getElementById('undo-action').addEventListener('click', () => {
      this.historyManager.undo();
    });

    document.getElementById('redo-action').addEventListener('click', () => {
      this.historyManager.redo();
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) { // Control/Command key
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            this.historyManager.redo();
          } else {
            this.historyManager.undo();
          }
        }
      }
    });
  }

  initializeStatusBar() {
    const updateStatus = (e) => {
      const coords = e.latlng;
      document.getElementById('coordinates').textContent = 
        `Lat: ${coords.lat.toFixed(6)}, Lng: ${coords.lng.toFixed(6)}`;
      
      const zoom = this.mapManager.map.getZoom();
      const scale = this.calculateScale(zoom);
      document.getElementById('scale').textContent = `Scale: 1:${scale}`;
      
      document.getElementById('projection').textContent = 
        `Projection: Web Mercator (EPSG:3857)`;
    };

    this.mapManager.map.on('mousemove', updateStatus);
  }

  calculateScale(zoom) {
    const metersPerPixel = 156543.03392 * Math.cos(0) / Math.pow(2, zoom);
    return Math.round(metersPerPixel * 96 / 0.0254);
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  window.cartographyApp = new CartographyApp();
});