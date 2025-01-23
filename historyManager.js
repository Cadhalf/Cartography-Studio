export class HistoryManager {
  constructor(mapManager) {
    this.mapManager = mapManager;
    this.undoStack = [];
    this.redoStack = [];
    this.isUndoRedoOperation = false;
    this.maxHistorySize = 1000; // Large history size

    this.initializeListeners();
    this.updateButtonStates();
  }

  initializeListeners() {
    // Listen for feature additions
    this.mapManager.featureLayers.on('layeradd', (e) => {
      if (!this.isUndoRedoOperation) {
        this.pushState({
          type: 'add',
          layer: e.layer,
          data: this.serializeLayer(e.layer)
        });
      }
    });

    // Listen for feature removals
    this.mapManager.featureLayers.on('layerremove', (e) => {
      if (!this.isUndoRedoOperation) {
        this.pushState({
          type: 'remove',
          layer: e.layer,
          data: this.serializeLayer(e.layer)
        });
      }
    });

    // Listen for style changes
    this.mapManager.featureLayers.on('layerstylechange', (e) => {
      if (!this.isUndoRedoOperation) {
        this.pushState({
          type: 'style',
          layer: e.layer,
          oldStyle: e.oldStyle,
          newStyle: e.newStyle
        });
      }
    });
  }

  pushState(state) {
    // Add timestamp to state
    state.timestamp = Date.now();
    
    this.undoStack.push(state);
    
    // Limit stack size if needed
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
    
    // Clear redo stack when new action is performed
    this.redoStack = [];
    
    this.updateButtonStates();
  }

  undo() {
    if (this.undoStack.length === 0) return;

    const state = this.undoStack.pop();
    this.redoStack.push(state);

    this.isUndoRedoOperation = true;
    try {
      switch (state.type) {
        case 'add':
          this.mapManager.featureLayers.removeLayer(state.layer);
          break;
          
        case 'remove':
          const restoredLayer = this.deserializeLayer(state.data);
          this.mapManager.featureLayers.addLayer(restoredLayer);
          break;
          
        case 'style':
          state.layer.setStyle(state.oldStyle);
          break;
      }
    } finally {
      this.isUndoRedoOperation = false;
    }

    this.updateButtonStates();
  }

  redo() {
    if (this.redoStack.length === 0) return;

    const state = this.redoStack.pop();
    this.undoStack.push(state);

    this.isUndoRedoOperation = true;
    try {
      switch (state.type) {
        case 'add':
          const restoredLayer = this.deserializeLayer(state.data);
          this.mapManager.featureLayers.addLayer(restoredLayer);
          break;
          
        case 'remove':
          this.mapManager.featureLayers.removeLayer(state.layer);
          break;
          
        case 'style':
          state.layer.setStyle(state.newStyle);
          break;
      }
    } finally {
      this.isUndoRedoOperation = false;
    }

    this.updateButtonStates();
  }

  serializeLayer(layer) {
    if (layer instanceof L.Marker) {
      const data = {
        type: 'marker',
        latlng: layer.getLatLng(),
        options: { ...layer.options }
      };

      // Save tooltip if exists
      const tooltip = layer.getTooltip();
      if (tooltip) {
        data.tooltip = {
          content: tooltip.getContent(),
          options: tooltip.options
        };
      }

      return data;
    } else {
      return {
        type: 'feature',
        geojson: layer.toGeoJSON(),
        options: { ...layer.options }
      };
    }
  }

  deserializeLayer(data) {
    if (data.type === 'marker') {
      const marker = L.marker(data.latlng, data.options);
      
      // Restore tooltip if existed
      if (data.tooltip) {
        marker.bindTooltip(data.tooltip.content, data.tooltip.options);
      }
      
      return marker;
    } else {
      return L.geoJSON(data.geojson, data.options);
    }
  }

  updateButtonStates() {
    const undoButton = document.getElementById('undo-action');
    const redoButton = document.getElementById('redo-action');

    if (undoButton && redoButton) {
      undoButton.disabled = this.undoStack.length === 0;
      redoButton.disabled = this.redoStack.length === 0;

      // Update tooltips with more detailed information
      if (this.undoStack.length > 0) {
        const lastAction = this.undoStack[this.undoStack.length - 1];
        undoButton.title = `Undo ${this.getActionDescription(lastAction)} (Ctrl+Z)`;
      } else {
        undoButton.title = 'Nothing to undo';
      }

      if (this.redoStack.length > 0) {
        const nextAction = this.redoStack[this.redoStack.length - 1];
        redoButton.title = `Redo ${this.getActionDescription(nextAction)} (Ctrl+Shift+Z)`;
      } else {
        redoButton.title = 'Nothing to redo';
      }
    }
  }

  getActionDescription(state) {
    const timeAgo = this.getTimeAgo(state.timestamp);
    switch (state.type) {
      case 'add':
        return `addition (${timeAgo})`;
      case 'remove':
        return `deletion (${timeAgo})`;
      case 'style':
        return `style change (${timeAgo})`;
      default:
        return `action (${timeAgo})`;
    }
  }

  getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }
}