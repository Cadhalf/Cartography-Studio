export class ToolManager {
  constructor(mapManager) {
    this.mapManager = mapManager;
    this.map = mapManager.map;
    this.currentTool = null;
    this.drawing = false;
    this.activeButton = null;
    this.drawControl = null;
    
    // Initialize marker icon
    this.markerIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    this.initializeEventListeners();
    if (L.Control.Draw) {
      this.initializeDrawingTools();
    } else {
      console.error('Leaflet.Draw not loaded');
    }
  }

  initializeEventListeners() {
    // Map click handler for point placement
    this.map.on('click', (e) => {
      if (this.drawing && this.currentTool === 'point') {
        this.addMarker(e.latlng);
        e.originalEvent.stopPropagation();
      }
    });

    // Click outside map handler
    document.addEventListener('click', (e) => {
      const isMapClick = e.target.closest('#map');
      const isToolButton = e.target.closest('.tool-btn');
      
      if (!isMapClick && !isToolButton && this.drawing) {
        this.deactivateTool();
      }
    });

    // Escape key handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.drawing) {
        this.deactivateTool();
      }
    });
  }

  initializeDrawingTools() {
    const drawOptions = {
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#e1e4e8',
            timeout: 1000
          },
          shapeOptions: {
            color: '#2b6cb0',
            fillOpacity: 0.5
          }
        },
        polyline: {
          shapeOptions: {
            color: '#2b6cb0',
            weight: 2
          }
        },
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false
      },
      edit: {
        featureGroup: this.mapManager.featureLayers,
        remove: true
      }
    };

    this.drawControl = new L.Control.Draw(drawOptions);
    this.map.addControl(this.drawControl);

    // Drawing event handlers
    this.map.on(L.Draw.Event.CREATED, (e) => {
      const layer = e.layer;
      this.mapManager.featureLayers.addLayer(layer);
      
      // Only deactivate for polygon and line tools
      if (this.currentTool === 'polygon' || this.currentTool === 'line') {
        this.deactivateTool();
      }
    });

    this.map.on(L.Draw.Event.DRAWSTART, () => {
      if (!this.drawing) {
        this.deactivateTool();
      }
    });

    this.map.on(L.Draw.Event.DRAWSTOP, () => {
      // Only deactivate for polygon and line tools
      if (this.currentTool === 'polygon' || this.currentTool === 'line') {
        this.deactivateTool();
      }
    });

    // Add handler for when a shape is completed
    this.map.on(L.Draw.Event.DRAWVERTEX, (e) => {
      // Check if this is a polygon or line being completed
      if ((this.currentTool === 'polygon' || this.currentTool === 'line') && e.layers && e.layers.length > 0) {
        // Deactivate tool after shape completion
        this.deactivateTool();
      }
    });
  }

  activateTool(toolType) {
    // If clicking the active tool, deactivate it
    if (this.currentTool === toolType && this.drawing) {
      this.deactivateTool();
      return;
    }

    // Deactivate any current tool
    this.deactivateTool();

    // Get the button element
    const buttonId = `draw-${toolType}`;
    const button = document.getElementById(buttonId);
    
    // Activate the new tool
    this.currentTool = toolType;
    this.drawing = true;
    this.activeButton = button;
    
    if (button) {
      button.classList.add('active');
    }

    if (toolType === 'point') {
      this.map.getContainer().style.cursor = 'crosshair';
    } else {
      switch (toolType) {
        case 'polygon':
          new L.Draw.Polygon(this.map, {
            ...this.drawControl.options.draw.polygon,
            // Add completion listener
            completeShape: () => {
              this.deactivateTool();
            }
          }).enable();
          break;
        case 'line':
          new L.Draw.Polyline(this.map, {
            ...this.drawControl.options.draw.polyline,
            // Add completion listener
            completeShape: () => {
              this.deactivateTool();
            }
          }).enable();
          break;
      }
      this.map.dragging.disable();
    }
  }

  deactivateTool() {
    // Remove active class from button
    if (this.activeButton) {
      this.activeButton.classList.remove('active');
      this.activeButton = null;
    }

    // Reset map state
    if (this.map) {
      this.map.getContainer().style.cursor = '';
      this.map.dragging.enable();

      // Stop any ongoing drawing
      if (this.currentTool !== 'point' && this.currentTool !== 'label' && this.currentTool !== 'legend') {
        this.map.fire('draw:deletestop');
        this.map.fire('draw:editstop');

        // Disable all draw handlers
        Object.keys(this.map._handlers).forEach(handler => {
          if (handler.includes('draw')) {
            this.map._handlers[handler].disable();
          }
        });
      }
    }

    // Only reset tool state for polygon and line
    if (this.currentTool === 'polygon' || this.currentTool === 'line') {
      this.currentTool = null;
      this.drawing = false;
    }
  }

  addMarker(latlng) {
    if (!this.drawing || this.currentTool !== 'point') return;

    const marker = L.marker(latlng, {
      icon: this.markerIcon,
      draggable: true
    }).addTo(this.mapManager.featureLayers);

    const popupContent = document.createElement('div');
    popupContent.className = 'marker-popup';
    popupContent.innerHTML = `
      <div style="padding: 10px;">
        <div style="margin-bottom: 10px;">
          <label>Marker Name:</label>
          <input type="text" class="marker-name" placeholder="Enter name" style="width: 100%; margin-top: 5px; padding: 5px;">
        </div>
        <button class="save-marker" style="background: #2b6cb0; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Save</button>
      </div>
    `;

    const popup = L.popup({
      closeButton: true,
      closeOnClick: false,
      autoClose: false
    }).setContent(popupContent);

    marker.bindPopup(popup).openPopup();

    const saveMarkerHandler = (e) => {
      const nameInput = popupContent.querySelector('.marker-name');
      const name = nameInput.value.trim();
      if (name) {
        marker.bindTooltip(name, {
          permanent: true,
          direction: 'top',
          offset: [0, -30],
          className: 'marker-label'
        });
      }
      marker.closePopup();
      e.preventDefault();
    };

    popupContent.querySelector('.save-marker').addEventListener('click', saveMarkerHandler);

    // Right-click to remove marker
    marker.on('contextmenu', (e) => {
      L.DomEvent.preventDefault(e);
      if (confirm('Remove this marker?')) {
        this.mapManager.featureLayers.removeLayer(marker);
      }
    });

    marker.on('dragend', () => {
      if (marker.getTooltip()) {
        marker.openTooltip();
      }
    });

    // Handle escape key to cancel marker placement
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        this.mapManager.featureLayers.removeLayer(marker);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }
}