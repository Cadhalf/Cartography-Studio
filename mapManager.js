export class MapManager {
  constructor(mapId) {
    this.map = L.map(mapId, {
      center: [0, 0],
      zoom: 2
    });

    // Add base layers
    this.baseLayers = {
      'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ' OpenStreetMap contributors'
      }),
      'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: ' Esri'
      }),
      'Terrain': L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg', {
        attribution: 'Map tiles by Stamen Design'
      })
    };

    this.baseLayers['OpenStreetMap'].addTo(this.map);
    
    this.featureLayers = new L.FeatureGroup().addTo(this.map);
    
    L.control.layers(this.baseLayers, null).addTo(this.map);
    L.control.scale().addTo(this.map);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.map.dragging.enabled()) {
          return;
        }
        this.map.fire(L.Draw.Event.DRAWSTOP);
      }
    });

    // Add import event listener
    document.addEventListener('map:import', (e) => {
      this.importData(e.detail.data);
    });
  }

  addFeature(feature, style = {}) {
    const layer = L.geoJSON(feature, {
      style: style
    }).addTo(this.featureLayers);
    return layer;
  }

  removeFeature(layer) {
    this.featureLayers.removeLayer(layer);
  }

  getMapData() {
    return {
      features: this.featureLayers.toGeoJSON(),
      bounds: this.map.getBounds(),
      zoom: this.map.getZoom(),
      baseLayer: this.getCurrentBaseLayer()
    };
  }

  getCurrentBaseLayer() {
    for (let key in this.baseLayers) {
      if (this.map.hasLayer(this.baseLayers[key])) {
        return key;
      }
    }
    return null;
  }

  importData(data) {
    try {
      // Clear existing layers if needed
      this.featureLayers.clearLayers();
      
      // Add new features from imported data
      L.geoJSON(data, {
        style: (feature) => {
          return feature.properties?.style || {};
        },
        pointToLayer: (feature, latlng) => {
          if (feature.properties?.type === 'marker') {
            const marker = L.marker(latlng, {
              icon: L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })
            });
            
            if (feature.properties.label) {
              marker.bindTooltip(feature.properties.label, {
                permanent: true,
                direction: 'top',
                offset: [0, -30],
                className: 'marker-label'
              });
            }
            
            return marker;
          }
          return L.circleMarker(latlng);
        }
      }).addTo(this.featureLayers);

      // Set map view if metadata is present
      if (data.metadata?.bounds) {
        const bounds = L.latLngBounds(
          data.metadata.bounds._southWest,
          data.metadata.bounds._northEast
        );
        this.map.fitBounds(bounds);
      }
      
      // Set base layer if specified
      if (data.metadata?.baseLayer && this.baseLayers[data.metadata.baseLayer]) {
        Object.values(this.baseLayers).forEach(layer => this.map.removeLayer(layer));
        this.baseLayers[data.metadata.baseLayer].addTo(this.map);
      }

    } catch (error) {
      console.error('Error importing data:', error);
      alert('Failed to import map data. Please check the file format and try again.');
    }
  }

  exportAsImage() {
    // Hide any controls that might interfere with the export
    const controls = document.querySelectorAll('.leaflet-control');
    controls.forEach(control => {
      control.style.display = 'none';
    });

    // Wait for any pending tile loads and animations
    setTimeout(() => {
      html2canvas(this.map.getContainer(), {
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
        scale: window.devicePixelRatio, // Ensure high resolution
        logging: false,
        backgroundColor: null,
        onclone: function(clonedDoc) {
          // Ensure map container is visible in cloned document
          const mapContainer = clonedDoc.getElementById('map');
          if (mapContainer) {
            mapContainer.style.width = '100%';
            mapContainer.style.height = '100%';
          }
        }
      }).then(canvas => {
        try {
          // Create a high-quality PNG
          const imageData = canvas.toDataURL('image/png', 1.0);
          
          // Create and trigger download
          const link = document.createElement('a');
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          link.download = `map-export-${timestamp}.png`;
          link.href = imageData;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
        } catch (err) {
          console.error('Error creating download link:', err);
          alert('Failed to create download link. Please try again.');
        }

        // Show controls again
        controls.forEach(control => {
          control.style.display = '';
        });
      }).catch(err => {
        console.error('Error generating canvas:', err);
        alert('Failed to generate map image. Please try again.');
        
        // Ensure controls are shown even if there's an error
        controls.forEach(control => {
          control.style.display = '';
        });
      });
    }, 500); // Give time for any tile loading to complete
  }
}