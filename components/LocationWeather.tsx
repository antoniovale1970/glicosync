import React, { useState, useEffect } from 'react';
import type { WeatherData } from '../types';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { Spinner } from './Spinner';
import { MapPinIcon } from './icons/MapPinIcon';
import { ClockIcon } from './icons/ClockIcon';
import { WeatherIcon } from './icons/WeatherIcon';

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


export const LocationWeather: React.FC = () => {
    const { formattedDate, formattedTime } = useCurrentTime();
    const [location, setLocation] = useState<string | null>(null);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const [weatherResponse, locationResponse] = await Promise.all([
                        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`),
                        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                    ]);

                    if (!weatherResponse.ok) throw new Error('Falha ao buscar dados do clima.');
                    if (!locationResponse.ok) throw new Error('Falha ao buscar dados de localização.');

                    const weatherData = await weatherResponse.json();
                    const locationData = await locationResponse.json();
                    
                    setWeather({
                        temperature: Math.round(weatherData.current.temperature_2m),
                        code: weatherData.current.weather_code,
                        description: weatherDescriptions[weatherData.current.weather_code] || 'Não disponível'
                    });

                    setLocation(locationData.address.city || locationData.address.town || locationData.address.village || 'Localização desconhecida');
                    setError(null);
                } catch (err) {
                    if (err instanceof Error) {
                        setError('Não foi possível carregar os dados. Tente recarregar a página.');
                    } else {
                        setError('Ocorreu um erro desconhecido.');
                    }
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                setError('A permissão de localização é necessária para exibir o clima.');
                setLoading(false);
            },
            { timeout: 10000 }
        );
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                <Spinner size="sm" color="sky" />
                Carregando...
            </div>
        );
    }

    if (error) {
        return <p className="text-sm text-red-500 font-medium">{error}</p>;
    }

    return (
        <div className="flex flex-col lg:flex-row justify-between items-center gap-2 lg:gap-4 text-sm text-slate-300">
            <div className="flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-sky-400" />
                <span className="font-semibold">{location}</span>
            </div>
            <div className="hidden xl:block border-l border-slate-600 h-6"></div>
            <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-sky-400" />
                <span className="font-medium text-center sm:text-left">{formattedDate}, {formattedTime}</span>
            </div>
            <div className="hidden xl:block border-l border-slate-600 h-6"></div>
            {weather && (
                <div className="flex items-center gap-2">
                    <WeatherIcon code={weather.code} className="w-7 h-7 text-yellow-400" />
                    <span className="font-bold text-base">{weather.temperature}°C</span>
                    <span className="font-medium hidden md:inline">{weather.description}</span>
                </div>
            )}
        </div>
    );
};