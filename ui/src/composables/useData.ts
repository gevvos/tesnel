import { ref, onMounted } from 'vue';
import type { TesnelData } from '../types';

export const useData = () => {
  const data = ref<TesnelData | null>(null);

  const el = document.getElementById('tesnel-data');
  if (el?.textContent && el.textContent !== '__TESNEL_DATA__') {
    data.value = JSON.parse(el.textContent);
  } else if (import.meta.env.DEV) {
    onMounted(async () => {
      try {
        const res = await fetch('/dev-data.json');
        data.value = await res.json();
      } catch {}
    });
  }

  return { data };
};
