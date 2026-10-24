import React from 'react';

export const GITHUB_CONFIG = {
  repoUrl: 'https://github.com/gpamdani-git/noted',
  forkUrl: 'https://github.com/gpamdani-git/noted/fork',
  issuesUrl: 'https://github.com/gpamdani-git/noted/issues',
  releasesUrl: 'https://github.com/gpamdani-git/noted/releases',
  starsCount: '★ Star'
};

export function GithubIcon({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export function GithubNavPill({ label = 'Star' }) {
  return (
    <a
      href={GITHUB_CONFIG.repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="noted-nav-github-pill"
      title="Star Noted on GitHub"
      aria-label="Star Noted on GitHub"
    >
      <GithubIcon size={15} />
      <span className="github-text">{label}</span>
      <span className="github-star-icon">★</span>
    </a>
  );
}

export const COMMON_NAV_TEXTS = {
  id: {
    download: 'Unduh',
    docs: 'Bantuan',
    star: 'Star',
    login: 'Log in',
    startFree: 'Mulai Gratis',
    openWorkspace: 'Buka Workspace',
    backHome: 'Beranda',
    footer: {
      workspace: 'Workspace',
      docs: 'Dokumentasi',
      platform: 'Platform',
      openSource: 'Open Source',
      account: 'Akun & Privasi',
      desc: 'Workspace pencatatan bebas distraksi dengan vault lokal 0ms dan sinkronisasi real-time ke cloud.',
      githubRepo: 'GitHub Repository',
      fork: 'Fork di GitHub',
      starRepo: 'Beri Bintang di GitHub (★)',
      issues: 'Buka Issue / Lapor Bug',
      releases: 'Catatan Rilis & Changelog',
      license: 'Lisensi MIT (Bebas & Terbuka)'
    }
  },
  en: {
    download: 'Download',
    docs: 'Docs',
    star: 'Star',
    login: 'Log in',
    startFree: 'Get Started',
    openWorkspace: 'Open Workspace',
    backHome: 'Home',
    footer: {
      workspace: 'Workspace',
      docs: 'Documentation',
      platform: 'Platform',
      openSource: 'Open Source',
      account: 'Account & Privacy',
      desc: 'Distraction-free markdown workspace with local-first vault and real-time cloud synchronization.',
      githubRepo: 'GitHub Repository',
      fork: 'Fork on GitHub',
      starRepo: 'Star on GitHub (★)',
      issues: 'Open an Issue / Report Bug',
      releases: 'Releases & Changelog',
      license: 'MIT License (Open Source)'
    }
  }
};

