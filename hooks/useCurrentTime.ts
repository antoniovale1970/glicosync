import { useState, useEffect } from 'react';

export const useCurrentTime = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => {
            setTime(new Date());
        }, 60000); // Update every minute

        return () => {
            clearInterval(timerId);
        };
    }, []);

    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(time);

    const formattedTime = new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(time);

    return { formattedDate, formattedTime };
};
