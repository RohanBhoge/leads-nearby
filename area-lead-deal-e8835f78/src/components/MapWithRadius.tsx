import React, { useEffect, useRef, useState } from 'react';

interface MapWithRadiusProps {
  latitude: number;
  longitude: number;
  radiusKm: number;
  className?: string;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyAX0hUBgfK7FvWz6UTtaLzMGUEsKTcaKB4';

const MapWithRadius: React.FC<MapWithRadiusProps> = ({
  latitude,
  longitude,
  radiusKm,
  className = ''
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const circleInstance = useRef<google.maps.Circle | null>(null);
  const markerInstance = useRef<google.maps.Marker | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load Google Maps Script
  useEffect(() => {
    if (window.google?.maps) {
      setScriptLoaded(true);
      return;
    }

    // Wait for global script to load
    const interval = setInterval(() => {
      if (window.google?.maps) {
        setScriptLoaded(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!scriptLoaded || !mapContainer.current) return;

    if (!mapInstance.current) {
      mapInstance.current = new google.maps.Map(mapContainer.current, {
        center: { lat: latitude, lng: longitude },
        zoom: getZoomForRadius(radiusKm),
        disableDefaultUI: true, // Clean look like the previous map
        zoomControl: true,
      });

      markerInstance.current = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: mapInstance.current,
      });

      circleInstance.current = new google.maps.Circle({
        strokeColor: '#8b5cf6', // hsl(271, 91%, 65%) approx
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#8b5cf6',
        fillOpacity: 0.15,
        map: mapInstance.current,
        center: { lat: latitude, lng: longitude },
        radius: radiusKm * 1000, // Google Maps uses meters
      });
    }
  }, [scriptLoaded]);

  // Update Map on Prop Change
  useEffect(() => {
    if (!mapInstance.current || !circleInstance.current || !markerInstance.current) return;

    const center = { lat: latitude, lng: longitude };

    markerInstance.current.setPosition(center);
    mapInstance.current.setCenter(center);
    mapInstance.current.setZoom(getZoomForRadius(radiusKm));

    circleInstance.current.setCenter(center);
    circleInstance.current.setRadius(radiusKm * 1000);

  }, [latitude, longitude, radiusKm]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-[350px] rounded-xl overflow-hidden" />

      {/* Radius Label - positioned on the map */}
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-200 shadow-sm z-10">
        <span className="text-sm font-medium text-gray-900">
          {radiusKm} km radius
        </span>
      </div>
    </div>
  );
};

// Calculate appropriate zoom level for radius
function getZoomForRadius(radiusKm: number): number {
  if (radiusKm <= 2) return 13;
  if (radiusKm <= 5) return 12;
  if (radiusKm <= 10) return 11;
  if (radiusKm <= 20) return 10;
  if (radiusKm <= 30) return 9;
  return 8;
}

export default MapWithRadius;
