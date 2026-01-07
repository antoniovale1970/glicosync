
import React, { useState, useEffect } from 'react';
import type { WeatherData } from '../types';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { Spinner } from './Spinner';
import { MapPinIcon } from './icons/MapPinIcon';
import { ClockIcon } from './icons/ClockIcon';
import { WeatherIcon } from './icons/WeatherIcon';
import { WifiIcon } from './icons/WifiIcon';

const weatherDescriptions: Record<number, string> = {
    0: 'Céu limpo',
    1: 'Quase limpo',
    2: 'Parcialmente nublado',
    3: 'Nublado',
    45: 'Nevoeiro',
    48: 'Nevoeiro com gelo',
    51: 'Chuvisco leve',
    53: 'Chuvisco moderado',
    55: 'Chuvisco forte',
    61: 'Chuva leve',
    63: 'Chuva moderada',
    65: 'Chuva forte',
    80: 'Pancadas de chuva leves',
    81: 'Pancadas de chuva moderadas',
    82: 'Pancadas de chuva violentas',
};

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos em milissegundos

export const LocationWeather: React.FC = () => {
    const { formattedDate, formattedTime } = useCurrentTime();
    const [location, setLocation] = useState<string | null>(null);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        // Monitoramento de conexão
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const fetchWeather = async () => {
            // 1. Tentar carregar do cache primeiro
            const cachedWeather = localStorage.getItem('glicosync_weather_cache');
            const cachedLocation = localStorage.getItem('glicosync_location_cache');
            const cachedTime = localStorage.getItem('glicosync_weather_timestamp');

            const now = Date.now();

            if (cachedWeather && cachedLocation && cachedTime) {
                const age = now - parseInt(cachedTime, 10);
                if (age < CACHE_DURATION) {
                    setWeather(JSON.parse(cachedWeather));
                    setLocation(cachedLocation);
                    setLoading(false);
                    return;
                }
            }

            // 2. Se offline e sem cache válido, não tenta buscar
            if (!navigator.onLine && (!cachedWeather || !cachedLocation)) {
                setLoading(false);
                return;
            }

            if (!navigator.geolocation) {
                setError('Geolocalização não suportada.');
                setLoading(false);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const [weatherResponse, locationResponse] = await Promise.all([
                            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`),
                            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                        ]);

                        if (!weatherResponse.ok) throw new Error('Falha ao buscar clima.');
                        
                        const weatherData = await weatherResponse.json();
                        let locationName = 'Sua Localização';
                        
                        if (locationResponse.ok) {
                            const locationData = await locationResponse.json();
                            locationName = locationData.address.city || locationData.address.town || locationData.address.village || locationData.address.municipality || 'Localização Detectada';
                        }
                        
                        const newWeatherData = {
                            temperature: Math.round(weatherData.current.temperature_2m),
                            code: weatherData.current.weather_code,
                            description: weatherDescriptions[weatherData.current.weather_code] || 'Não disponível'
                        };

                        setWeather(newWeatherData);
                        setLocation(locationName);

                        localStorage.setItem('glicosync_weather_cache', JSON.stringify(newWeatherData));
                        localStorage.setItem('glicosync_location_cache', locationName);
                        localStorage.setItem('glicosync_weather_timestamp', now.toString());

                        setError(null);
                    } catch (err) {
                        if (cachedWeather && cachedLocation) {
                             setWeather(JSON.parse(cachedWeather));
                             setLocation(cachedLocation);
                        } else {
                             setError('Erro ao atualizar clima.');
                        }
                    } finally {
                        setLoading(false);
                    }
                },
                (err) => {
                    setError('Localização indisponível.');
                    setLoading(false);
                },
                { timeout: 10000 }
            );
        };

        fetchWeather();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                <Spinner size="sm" color="sky" />
                <span className="hidden sm:inline">Carregando informações...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row justify-between items-center gap-2 lg:gap-4 text-sm text-slate-300 animate-fadeIn">
            <div className="flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-sky-400" />
                <span className="font-semibold truncate max-w-[150px] sm:max-w-none">{location || 'Modo Offline'}</span>
            </div>
            <div className="hidden xl:block border-l border-slate-600 h-6"></div>
            <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-sky-400" />
                <span className="font-medium text-center sm:text-left">{formattedDate}, {formattedTime}</span>
            </div>
            <div className="hidden xl:block border-l border-slate-600 h-6"></div>
            
            <div className="flex items-center gap-4">
                {weather && (
                    <div className="flex items-center gap-2">
                        <WeatherIcon code={weather.code} className="w-7 h-7 text-yellow-400" />
                        <span className="font-bold text-base">{weather.temperature}°C</span>
                        <span className="font-medium hidden md:inline">{weather.description}</span>
                    </div>
                )}
                
                {/* Indicador de Conexão */}
                <div className="flex items-center gap-2 pl-3 border-l border-slate-700">
                    {isOnline ? (
                        <>
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-green-500 leading-none">Sistema Online</span>
                        </>
                    ) : (
                        <>
                            <div className="h-2 w-2 rounded-full bg-red-500"></div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-red-500 leading-none">Sistema Offline</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
