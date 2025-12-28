import { useEffect, useState, useRef } from 'react';

// Simple cache en memoria
const translationCache: Record<string, string> = {};

function getCacheKey(text: string, from: string, to: string) {
  return `${from}:${to}:${text}`;
}

export default function useAutoTranslate(text: string, from: string, to: string) {
  const [translated, setTranslated] = useState<string>(text);
  const lastText = useRef<string>("");
  const lastLang = useRef<string>("");

  useEffect(() => {
    if (!text || from === to) {
      setTranslated(text);
      return;
    }
    const cacheKey = getCacheKey(text, from, to);
    if (translationCache[cacheKey]) {
      setTranslated(translationCache[cacheKey]);
      return;
    }
    // Evitar race conditions
    lastText.current = text;
    lastLang.current = to;
    fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`)
      .then(res => res.json())
      .then(data => {
        const translatedText = data[0]?.map((t: any) => t[0]).join('') || text;
        translationCache[cacheKey] = translatedText;
        // Solo actualizar si sigue siendo el texto y lang actual
        if (lastText.current === text && lastLang.current === to) {
          setTranslated(translatedText);
        }
      })
      .catch(() => setTranslated(text));
  }, [text, from, to]);

  return translated;
} 