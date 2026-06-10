'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

const METRICA_ID = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID?.trim();
const SHOULD_LOAD = process.env.NODE_ENV === 'production' && Boolean(METRICA_ID);

/**
 * Yandex Metrica counter (replaces GTM/GA4 for Russia storefront).
 * Loads only in production when NEXT_PUBLIC_YANDEX_METRICA_ID is set.
 */
export function YandexMetrica() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;
  if (!SHOULD_LOAD || !METRICA_ID) return null;

  return (
    <>
      <Script id="yandex-metrica" strategy="afterInteractive">
        {`
(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();
for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
ym(${METRICA_ID}, "init", {
  clickmap:true,
  trackLinks:true,
  accurateTrackBounce:true,
  webvisor:true,
  ecommerce:"dataLayer"
});
        `}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${METRICA_ID}`}
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
