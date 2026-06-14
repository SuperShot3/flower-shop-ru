'use client';

import { TikTokIcon } from './icons';

const TIKTOK_PAGE_URL = 'https://www.tiktok.com/@lannabloom_th';

export function SocialLinks() {
  return (
    <div className="social-links">
      <a
        href={TIKTOK_PAGE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="social-link social-link-tiktok"
        aria-label="Visit our TikTok"
        title="TikTok"
      >
        <TikTokIcon size={24} className="social-icon" />
      </a>
      <style jsx>{`
        .social-links {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .social-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          background: var(--pastel-cream);
          transition: background 0.2s, transform 0.15s;
        }
        .social-link-tiktok {
          color: #010101;
        }
        .social-link:hover {
          background: var(--accent-soft);
          transform: scale(1.05);
        }
        .social-icon {
          flex-shrink: 0;
        }
        @media (max-width: 600px) {
          .social-link {
            width: 36px;
            height: 36px;
          }
          .social-icon {
            width: 20px;
            height: 20px;
          }
        }
      `}</style>
    </div>
  );
}
