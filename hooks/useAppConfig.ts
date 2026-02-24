import { useState, useEffect } from 'react';

export type ViewMode = 'table' | 'calendar' | 'analytics' | 'budget';

export interface VersionHistory {
    version: string;
    date: string;
    changes: string;
}

export function useAppConfig() {
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [compactMode, setCompactMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Metadata & Updates
    const [appVersion, setAppVersion] = useState('3.0.0');
    const [versionHistory, setVersionHistory] = useState<VersionHistory[]>([]);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [remoteVersion, setRemoteVersion] = useState('');
    const [remoteChangelog, setRemoteChangelog] = useState('');
    const [githubInfo, setGithubInfo] = useState({ username: '', repo: '', branch: '' });
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [showUpdateToast, setShowUpdateToast] = useState(false);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Load User Preferences
    useEffect(() => {
        const pref = localStorage.getItem('ohmonsea_prefs');
        if (pref) {
            try {
                const p = JSON.parse(pref);
                setCompactMode(p.compactMode ?? false);
            } catch (e) { }
        }

        // Apply static light theme
        document.body.className = "antialiased transition-colors duration-300 bg-stone-50 text-stone-900";
        document.documentElement.classList.remove('dark');
    }, []);

    // Save Prefs
    useEffect(() => {
        localStorage.setItem('ohmonsea_prefs', JSON.stringify({ compactMode }));
    }, [compactMode]);

    // Check version and updates
    useEffect(() => {
        fetch('./metadata.json')
            .then(res => res.ok ? res.json() : null)
            .then(localMeta => {
                if (localMeta) {
                    setAppVersion(localMeta.version);
                    setVersionHistory(localMeta.versionHistory || []);

                    if (localMeta.github) {
                        setGithubInfo(localMeta.github);
                        const { username, repo, branch } = localMeta.github;
                        const remoteUrl = `https://raw.githubusercontent.com/${username}/${repo}/${branch}/metadata.json`;

                        fetch(remoteUrl)
                            .then(res => res.ok ? res.json() : null)
                            .then(remoteMeta => {
                                if (remoteMeta && remoteMeta.version !== localMeta.version) {
                                    setUpdateAvailable(true);
                                    setRemoteVersion(remoteMeta.version);
                                    setRemoteChangelog(remoteMeta.changelog || 'Tidak ada informasi perubahan.');
                                    setShowUpdateToast(true);
                                }
                            })
                            .catch(err => console.error("Gagal cek update:", err));
                    }
                }
            })
            .catch(err => console.error("Gagal muat metadata:", err));
    }, []);

    return {
        viewMode, setViewMode,
        compactMode, setCompactMode,
        searchQuery, setSearchQuery,
        isModalOpen, setIsModalOpen,
        isSettingsOpen, setIsSettingsOpen,
        appVersion,
        versionHistory,
        updateAvailable,
        remoteVersion,
        remoteChangelog,
        githubInfo,
        isUpdateModalOpen, setIsUpdateModalOpen,
        showUpdateToast, setShowUpdateToast,
        isMobile
    };
}
