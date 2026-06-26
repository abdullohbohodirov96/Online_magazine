'use client';

import React, { useEffect, useRef, useState } from 'react';

interface LocationData {
  address: string;
  yandexAddress: string;
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
  const [loadingMap, setLoadingMap] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [hasSelected, setHasSelected] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null); // This is the ymaps Map instance!
  const placemarkRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSelectingSuggestionRef = useRef(false);

  // Sync initialAddress prop changes
  useEffect(() => {
    if (initialAddress && initialAddress !== address) {
      setAddress(initialAddress);
    }
  }, [initialAddress]);

  function buildSearchQuery(value: string) {
    const v = value.trim();
    const lower = v.toLowerCase();

    if (
      lower.includes("toshkent") ||
      lower.includes("ташкент") ||
      lower.includes("tashkent")
    ) {
      return v;
    }

    return `Toshkent, ${v}`;
  }

  async function searchAddress(value: string) {
    const ymaps = (window as any).ymaps;
    if (!ymaps) return [];

    const searchQuery = buildSearchQuery(value);
    console.log("ADDRESS INPUT CHANGED:", value);
    console.log("YANDEX SEARCH START:", value);

    try {
      const res = await ymaps.geocode(searchQuery, {
        results: 7,
        boundedBy: [[41.15, 68.95], [41.45, 69.45]],
        strictBounds: false
      });

      const items = res.geoObjects.toArray().map((obj: any) => {
        const coords = obj.geometry.getCoordinates();
        const address = obj.getAddressLine();

        return {
          address,
          latitude: coords[0],
          longitude: coords[1]
        };
      });

      console.log("YANDEX SEARCH QUERY:", searchQuery);
      console.log("YANDEX SEARCH RESULTS:", items);

      setSuggestions(items);
      return items;
    } catch (err) {
      console.error("Yandex geocode error:", err);
      return [];
    }
  }

  const createPlacemark = (newCoords: [number, number], customAddress?: string) => {
    const ymaps = (window as any).ymaps;
    if (!ymaps || !mapRef.current) return;

    const placemark = new ymaps.Placemark(newCoords, {
      balloonContent: customAddress || address || 'Место доставки'
    }, {
      preset: 'islands#redDotIconWithCaption',
      draggable: true
    });
    placemarkRef.current = placemark;
    mapRef.current.geoObjects.add(placemark);

    // Placemark Drag Event
    placemark.events.add('dragend', () => {
      const dragCoords = placemark.geometry.getCoordinates() as [number, number];
      updatePin(dragCoords, true);
    });
  };

  // Update Placemark Position and Geocode Address
  const updatePin = (newCoords: [number, number], shouldGeocode: boolean, customAddress?: string) => {
    setCoords(newCoords);
    setHasSelected(true);
    
    const ymaps = (window as any).ymaps;
    if (!ymaps) return;

    if (mapRef.current) {
      mapRef.current.setCenter(newCoords, 16);
    }

    if (!placemarkRef.current && mapRef.current) {
      createPlacemark(newCoords, customAddress);
    } else if (placemarkRef.current) {
      placemarkRef.current.geometry.setCoordinates(newCoords);
    }

    if (shouldGeocode) {
      ymaps.geocode(newCoords).then((res: any) => {
        const firstGeoObject = res.geoObjects.get(0);
        const geocodedAddress = firstGeoObject ? firstGeoObject.getAddressLine() : '';
        setAddress(geocodedAddress);
        onChange({
          address: geocodedAddress,
          yandexAddress: geocodedAddress,
          latitude: newCoords[0],
          longitude: newCoords[1]
        });
      });
    } else if (customAddress) {
      setAddress(customAddress);
      onChange({
        address: customAddress,
        yandexAddress: customAddress,
        latitude: newCoords[0],
        longitude: newCoords[1]
      });
    }
  };

  // Load Yandex Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '';
    if (!apiKey) {
      setError('Yandex Maps API key topilmadi');
      setLoadingMap(false);
      return;
    }

    const scriptId = 'yandex-maps-api-script';
    
    const initYmaps = () => {
      const ymaps = (window as any).ymaps;
      if (!ymaps) return;

      ymaps.ready(() => {
        setLoadingMap(false);
        if (!mapContainerRef.current || mapRef.current) return;

        // Initialize map
        const map = new ymaps.Map(mapContainerRef.current, {
          center: coords,
          zoom: 15,
          controls: ['zoomControl']
        });
        mapRef.current = map;

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
        script.src = 'https://api-maps.yandex.ru/2.1/?apikey=' + apiKey + '&lang=ru_RU';
        script.onload = initYmaps;
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', initYmaps);
      }
    } else {
      initYmaps();
    }

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.destroy();
          mapRef.current = null;
        } catch (e) {
          console.error('Error destroying map:', e);
        }
      }
    };
  }, []);

  const handleInputChange = (val: string) => {
    setAddress(val);
    setHasSelected(false);
    console.log("ADDRESS INPUT CHANGED:", val);

    onChange({
      address: val,
      yandexAddress: val,
      latitude: coords[0],
      longitude: coords[1]
    });

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      searchAddress(val);
    }, 500);
  };

  function selectSuggestion(item: any) {
    setAddress(item.address);
    setSuggestions([]);
    setHasSelected(true);

    const coords: [number, number] = [item.latitude, item.longitude];

    if (mapRef.current) {
      mapRef.current.setCenter(coords, 16, { duration: 300 });
    }

    if (placemarkRef.current) {
      placemarkRef.current.geometry.setCoordinates(coords);
    } else {
      createPlacemark(coords, item.address);
    }

    onChange({
      address: item.address,
      yandexAddress: item.address,
      latitude: item.latitude,
      longitude: item.longitude
    });
  }

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (suggestions && suggestions.length > 0) {
        selectSuggestion(suggestions[0]);
      } else {
        const results = await searchAddress(address);
        if (results && results.length > 0) {
          selectSuggestion(results[0]);
        }
      }
    }
  };

  const handleBlur = () => {
    setTimeout(async () => {
      if (!isSelectingSuggestionRef.current) {
        if (!hasSelected && address.trim().length >= 3) {
          const results = await searchAddress(address);
          if (results && results.length > 0) {
            selectSuggestion(results[0]);
          }
        }
      }
      setSuggestions([]);
      isSelectingSuggestionRef.current = false;
    }, 300);
  };

  const handleSearchClick = async () => {
    setError('');
    if (!address.trim()) {
      setError('Manzil topilmadi. Masalan: Toshkent, Nurziyo 32 deb yozib ko‘ring.');
      return;
    }
    const results = await searchAddress(address);
    if (results && results.length > 0) {
      selectSuggestion(results[0]);
    } else {
      setError('Manzil topilmadi. Masalan: Toshkent, Nurziyo 32 deb yozib ko‘ring.');
    }
  };

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
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            className="form-input"
            value={address}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="Введите улицу, дом, ориентир..."
            style={{ width: '100%', boxSizing: 'border-box' }}
          />

          {suggestions.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#ffffff',
                color: '#111827',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                zIndex: 99999,
                maxHeight: '260px',
                overflowY: 'auto',
                marginTop: '4px',
              }}
            >
              {suggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => selectSuggestion(item)}
                  onMouseDown={() => {
                    isSelectingSuggestionRef.current = true;
                  }}
                  style={{
                    padding: '10px 16px',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    borderBottom: idx === suggestions.length - 1 ? 'none' : '1px solid #f3f4f6',
                    textAlign: 'left',
                  }}
                >
                  📍 {item.address}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSearchClick}
          style={{
            padding: '0.65rem',
            borderRadius: '12px',
            border: '1px solid #10b981',
            backgroundColor: '#10b981',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '42px',
            width: '42px',
            flexShrink: 0
          }}
          title="Qidirish"
        >
          🔍
        </button>

        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={locating}
          style={{
            padding: '0.65rem',
            borderRadius: '12px',
            border: '1px solid #3b82f6',
            backgroundColor: 'transparent',
            color: '#3b82f6',
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
          {locating ? '⏳' : '🎯'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--danger, #ef4444)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Map Container */}
      <div
        ref={mapContainerRef}
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
          fontSize: '0.9rem',
          position: 'relative',
          zIndex: 10
        }}
      >
        {loadingMap && <span>Загрузка интерактивной карты...</span>}
      </div>
    </div>
  );
}
