import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Crosshair, Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import MapPreview from './MapPreview';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAX0hUBgfK7FvWz6UTtaLzMGUEsKTcaKB4';

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  radius?: number; // km
  onLocationChange: (lat: number, lng: number, address?: string) => void;
}


interface Suggestion {
  id: string;
  place_name: string;
  place_id: string; // Google Place ID
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  radius,
  onLocationChange,
}) => {

  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Google Services Refs
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);

  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load Google Maps Script (Shared Logic)
  useEffect(() => {
    if (window.google?.maps?.places) {
      setScriptLoaded(true);
      initServices();
      return;
    }

    // Wait for global script to load
    const interval = setInterval(() => {
      if (window.google?.maps?.places) {
        setScriptLoaded(true);
        initServices();
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const initServices = () => {
    if (window.google?.maps && !autocompleteService.current) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      geocoder.current = new google.maps.Geocoder();
    }
  };

  // Track location search in backend
  const trackLocationSearch = async (query: string, selectedLocation?: { lat: number; lng: number; address: string }) => {
    // Debug log only
    // console.log('Location search:', { query, selectedLocation });
  };

  // Fetch suggestions from Google Maps Autocomplete
  const fetchSuggestions = async (query: string) => {
    if (query.length < 2 || !autocompleteService.current) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    try {
      const request: google.maps.places.AutocompletionRequest = {
        input: query,
        componentRestrictions: { country: 'in' }, // Focus on India
      };

      console.log('Fetching suggestions for:', query);
      console.log('Autocomplete service:', autocompleteService.current);

      // Safety timeout in case Google Maps hangs
      const timeoutId = setTimeout(() => {
        if (searching) {
          console.warn('Google Maps request timed out');
          setSearching(false);
          toast({
            variant: 'destructive',
            title: 'Connection Timeout',
            description: 'Location search is taking too long. You can try typing manually.',
          });
        }
      }, 5000);

      autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
        clearTimeout(timeoutId);
        console.log('Suggestions response:', { status, predictionsCount: predictions?.length });

        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          const formatted: Suggestion[] = predictions.map(p => ({
            id: p.place_id,
            place_name: p.description,
            place_id: p.place_id
          }));
          setSuggestions(formatted);
          setShowSuggestions(true);
        } else {
          console.warn('Google Maps Autocomplete failed or empty:', status);
          setSuggestions([]);
        }
        setSearching(false);
      });

    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSearching(false);
    }
  };

  const handleManualSearch = () => {
    if (!searchQuery.trim() || !geocoder.current) return;

    setSearching(true);
    setShowSuggestions(false);

    console.log('Attempting manual geocoding for:', searchQuery);

    geocoder.current.geocode({ address: searchQuery }, (results, status) => {
      setSearching(false);
      console.log('Geocoding response:', { status, results });

      if (status === 'OK' && results && results[0]) {
        const lat = results[0].geometry.location.lat();
        const lng = results[0].geometry.location.lng();
        const addr = results[0].formatted_address;

        onLocationChange(lat, lng, addr);
        setAddress(addr);
        trackLocationSearch(searchQuery, { lat, lng, address: addr });

        toast({
          title: t('success'),
          description: 'Location found!',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Location not found',
          description: 'Could not find this location. Try moving the pin manually.',
        });
      }
    });
  };

  // Debounced search for Autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchQuery.length >= 3) { // Increased to 3 chars to save calls
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(searchQuery);
        trackLocationSearch(searchQuery);
      }, 500); // Increased debounce
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    if (!geocoder.current) return;

    setAddress(suggestion.place_name);
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);

    // Get Lat/Lng from Place ID using Geocoder
    geocoder.current.geocode({ placeId: suggestion.place_id }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const lat = results[0].geometry.location.lat();
        const lng = results[0].geometry.location.lng();

        onLocationChange(lat, lng, suggestion.place_name);
        // Track selected
        trackLocationSearch(searchQuery, { lat, lng, address: suggestion.place_name });

        toast({
          title: t('success'),
          description: 'Location selected successfully',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to get location details',
        });
      }
    });
  };

  const getCurrentLocation = () => {
    setLoading(true);

    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: 'Geolocation is not supported by your browser',
      });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setLoading(false); // Can stop loading before geocoding visual update

        // Reverse Geocode
        if (geocoder.current) {
          geocoder.current.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              const addr = results[0].formatted_address;
              setAddress(addr);
              onLocationChange(lat, lng, addr);
              toast({
                title: t('success'),
                description: 'Location detected successfully',
              });
            } else {
              // Fallback
              const addr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
              setAddress(addr);
              onLocationChange(lat, lng, addr);
            }
          });
        } else {
          onLocationChange(lat, lng);
        }

      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          variant: 'destructive',
          title: t('error'),
          description: 'Unable to get your location. Please enable location access.',
        });
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Handle location change from map drag (Reverse Geocoding)
  const handleMapLocationChange = async (lat: number, lng: number) => {
    // Just update lat/lng first to make UI snappy
    if (geocoder.current) {
      geocoder.current.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const addr = results[0].formatted_address;
          setAddress(addr);
          onLocationChange(lat, lng, addr);
        } else {
          const addr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setAddress(addr);
          onLocationChange(lat, lng, addr);
        }
      });
    } else {
      onLocationChange(lat, lng);
    }
  };

  const clearLocation = () => {
    setAddress('');
    setSearchQuery('');
    setSuggestions([]);
  };

  // Initial reverse geocode if lat/lng provided but no address
  useEffect(() => {
    if (latitude && longitude && !address && geocoder.current && scriptLoaded) {
      geocoder.current.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          setAddress(results[0].formatted_address);
        } else {
          setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      });
    }
  }, [latitude, longitude, address, scriptLoaded]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MapPin size={18} className="text-primary" />
        <span>{t('location')}</span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <button
            type="button"
            onClick={handleManualSearch}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
          >
            <Search size={18} />
          </button>
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search location (e.g., Katraj, Pune)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="pl-10 pr-10 h-12 rounded-xl border-border bg-background"
          />
          {(searchQuery || searching) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {searching ? (
                <Loader2 size={18} className="animate-spin text-muted-foreground" />
              ) : (
                <button onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionSelect(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 flex items-start gap-3"
              >
                <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground line-clamp-2">{suggestion.place_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Current Location Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 rounded-xl"
        onClick={getCurrentLocation}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin mr-2" />
            <span>Detecting location...</span>
          </>
        ) : (
          <>
            <Crosshair size={20} className="mr-2" />
            <span>{t('setLocation')}</span>
          </>
        )}
      </Button>

      {/* Map Preview with Draggable Pin */}
      {latitude && longitude && (
        <div className="space-y-3">
          <MapPreview
            latitude={latitude}
            longitude={longitude}
            radius={radius}
            onLocationChange={handleMapLocationChange}
            draggable={true}
          />


          {/* Selected Location Display */}
          {address && (
            <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={16} className="text-primary" />
                    <p className="text-sm font-medium text-foreground">Selected Location</p>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{address}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearLocation}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
