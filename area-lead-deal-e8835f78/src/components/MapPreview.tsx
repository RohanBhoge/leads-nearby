import React, { useEffect, useRef, useState } from 'react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  radius?: number; // km
  onLocationChange: (lat: number, lng: number) => void;
  draggable?: boolean;
}

const MapPreview: React.FC<MapPreviewProps> = ({
  latitude,
  longitude,
  onLocationChange,
  draggable = true,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
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
        zoom: 15,
        disableDefaultUI: false,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });

      markerInstance.current = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: mapInstance.current,
        draggable: draggable,
        animation: google.maps.Animation.DROP,
      });

      // Handle marker drag
      if (draggable) {
        markerInstance.current.addListener('dragend', () => {
          const position = markerInstance.current?.getPosition();
          if (position) {
            onLocationChange(position.lat(), position.lng());
          }
        });

        // Handle map click
        mapInstance.current.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            markerInstance.current?.setPosition(e.latLng);
            onLocationChange(e.latLng.lat(), e.latLng.lng());
            mapInstance.current?.panTo(e.latLng);
          }
        });
      }
    }
  }, [scriptLoaded]);

  // Update marker position when props change
  useEffect(() => {
    if (!mapInstance.current || !markerInstance.current) return;

    const newPos = { lat: latitude, lng: longitude };

    // Check if we need to move the marker (avoid loops if update came from drag)
    const currentPos = markerInstance.current.getPosition();
    if (currentPos && (Math.abs(currentPos.lat() - latitude) > 0.0001 || Math.abs(currentPos.lng() - longitude) > 0.0001)) {
      markerInstance.current.setPosition(newPos);
      mapInstance.current.panTo(newPos);
    }
  }, [latitude, longitude]);

  return (
    <div className="relative w-full h-48 rounded-xl overflow-hidden border border-border">
      <div ref={mapContainer} className="absolute inset-0" />
      {draggable && (
        <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-500 text-center shadow-sm z-10">
          Drag the pin or click on map to adjust location
        </div>
      )}
    </div>
  );
};

export default MapPreview;