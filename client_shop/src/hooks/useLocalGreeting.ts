import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export function greetingForHour(hour: number) {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function useLocalGreeting() {
  const [greeting, setGreeting] = useState(() => greetingForHour(new Date().getHours()));
  useEffect(() => {
    const update = () => setGreeting(greetingForHour(new Date().getHours()));
    const timer = setInterval(update, 60_000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') update(); });
    return () => { clearInterval(timer); listener.remove(); };
  }, []);
  return greeting;
}
