'use client';

import React, { useEffect, useRef, useState } from 'react';

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
}

interface YandexAddressPickerProps {
  initialAddress?: string;
  initialLatitude?: number;
  initialLongitude?: number;
  onChange: (data: LocationData) => void;
}

export default function YandexAddressPicker({
  initialAddress = '',
  initialLatitude = 41.311081, // Tashkent center
  initialLongitude = 69.240562,
  onChange
}: YandexAddressPickerProps) {
  const [address, setAddress] = useState(initialAddress);
  const [coords, setCoords] = useState<[number, number]>([initialLatitude, initialLongitude]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingMap, setLoadingMap] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const placemarkRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initialAddress prop changes
  useEffect(() => {
    if (initialAddress && initialAddress !== address) {
      setAddress(initialAddress);
    }
  }, [initialAddress]);

  // Load Yandex Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '';
    const scriptId = 'yandex-maps-api-script';
    
    const initYmaps = () => {
      const ymaps = (window as any).ymaps;
      if (!ymaps) return;

      ymaps.ready(() => {
        setLoadingMap(false);
        if (!mapRef.current || mapInstanceRef.current) return;

        // Initialize map
        const map = new ymaps.Map(mapRef.current, {
          center: coords,
          zoom: 15,
          controls: ['zoomControl']
        });
        mapInstanceRef.current = map;

        // Initialize draggable placemark
        const placemark = new ymaps.Placemark(coords, {
          balloonContent: address || 'Место доставки'
        }, {
          preset: 'islands#redDotIconWithCaption',
          draggable: true
        });
        placemarkRef.current = placemark;
        map.geoObjects.add(placemark);

        // Map Click Event
        map.events.add('click', (e: any) => {
          const newCoords = e.get('coords') as [number, number];
          updatePin(newCoords, true);
        });

        // Placemark Drag Event
        placemark.events.add('dragend', () => {
          const newCoords = placemark.geometry.getCoordinates() as [number, number];
          updatePin(newCoords, true);
        });
      });
    };

    if (!(window as any).ymaps) {
      const existingScript = document.getElementById(scriptId);
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
        script.onload = initYmaps;
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', initYmaps);
      }
    } else {
      initYmaps();
    }

    return () => {
      // Clean up map instance if unmounting
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
          mapInstanceRef.current = null;
        } catch (e) {
          console.error('Error destroying map:', e);
        }
      }
    };
  }, []);

  // Update Placemark Position and Geocode Address
  const updatePin = (newCoords: [number, number], shouldGeocode: boolean, customAddress?: string) => {
    setCoords(newCoords);
    
    if (placemarkRef.current) {
      placemarkRef.current.geometry.setCoordinates(newCoords);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(newCoords);
    }

    if (shouldGeocode) {
      const ymaps = (window as any).ymaps;
      if (ymaps) {
        ymaps.geocode(newCoords).then((res: any) => {
          const firstGeoObject = res.geoObjects.get(0);
          const geocodedAddress = firstGeoObject ? firstGeoObject.getAddressLine() : '';
          setAddress(geocodedAddress);
          onChange({
            address: geocodedAddress,
            latitude: newCoords[0],
            longitude: newCoords[1]
          });
        });
      }
    } else if (customAddress) {
      setAddress(customAddress);
      onChange({
        address: customAddress,
        latitude: newCoords[0],
        longitude: newCoords[1]
      });
    }
  };

  // Autocomplete Suggestions Query (Geosuggest or Geocoder)
  const handleInputChange = (val: string) => {
    setAddress(val);
    onChange({ address: val, latitude: coords[0], longitude: coords[1] });

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      const ymaps = (window as any).ymaps;
      if (!ymaps) return;

      if (ymaps.suggest) {
        ymaps.suggest(val).then((items: any[]) => {
          setSuggestions(
            items.map((item) => ({
              displayName: item.displayName || item.value,
              value: item.value
            }))
          );
          setShowSuggestions(items.length > 0);
        }).catch((e: any) => {
          fallbackGeocode(val);
        });
      } else {
        fallbackGeocode(val);
      }
    }, 500);
  };

  const fallbackGeocode = (query: string) => {
    const ymaps = (window as any).ymaps;
    if (!ymaps) return;

    ymaps.geocode(query).then((res: any) => {
      const results: any[] = [];
      res.geoObjects.each((obj: any) => {
        results.push({
          displayName: obj.getAddressLine(),
          value: obj.getAddressLine(),
          coords: obj.geometry.getCoordinates()
        });
      });
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    });
  };

  // Handle Suggestion Item Click
  const handleSuggestionClick = (item: any) => {
    setShowSuggestions(false);
    setSuggestions([]);
    
    if (item.coords) {
      updatePin(item.coords, false, item.value);
    } else {
      const ymaps = (window as any).ymaps;
      if (ymaps) {
        ymaps.geocode(item.value).then((res: any) => {
          const firstGeoObject = res.geoObjects.get(0);
          if (firstGeoObject) {
            const geocodedCoords = firstGeoObject.geometry.getCoordinates() as [number, number];
            updatePin(geocodedCoords, false, item.value);
          }
        });
      }
    }
  };

  // Detect My Location
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Геолокация не поддерживается вашим браузером');
      return;
    }

    setLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newCoords: [number, number] = [latitude, longitude];
        updatePin(newCoords, true);
        setLocating(false);
      },
      (err) => {
        console.error('Error detecting location:', err);
        setError('Не удалось определить местоположение. Пожалуйста, найдите адрес на карте.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            className="form-input"
            value={address}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            placeholder="Введите улицу, дом, ориентир..."
            style={{ width: '100%', boxSizing: 'border-box' }}
          />

          {showSuggestions && suggestions.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'var(--card-bg, #ffffff)',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: 'var(--radius-md, 8px)',
                boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1))',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1010,
                marginTop: '5px',
              }}
            >
              {suggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSuggestionClick(item)}
                  style={{
                    padding: '0.6rem 1rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border, #e2e8f0)',
                    color: 'var(--foreground, #0f172a)'
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  📍 {item.displayName}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={locating}
          style={{
            padding: '0.65rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--primary-color, #10b981)',
            backgroundColor: 'transparent',
            color: 'var(--primary-color, #10b981)',
            cursor: 'pointer',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '42px',
            width: '42px',
            flexShrink: 0
          }}
          title="Определить мое местоположение"
        >
          {locating ? '⏳' : '📍'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--danger, #ef4444)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Map Container */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '220px',
          borderRadius: 'var(--radius-md, 8px)',
          overflow: 'hidden',
          marginTop: '10px',
          border: '1px solid var(--border, #e2e8f0)',
          backgroundColor: 'var(--muted-light, #f1f5f9)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'var(--muted, #64748b)',
          fontSize: '0.9rem'
        }}
      >
        {loadingMap && <span>Загрузка интерактивной карты...</span>}
      </div>
    </div>
  );
}
