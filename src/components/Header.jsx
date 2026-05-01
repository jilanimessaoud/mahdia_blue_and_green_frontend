import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTheme, THEMES } from '../context/ThemeContext';
import { ChevronDown, LogOut, UserCircle, LayoutDashboard } from 'lucide-react';
import authService from '../services/auth.service';
import questionnaireService from '../services/questionnaire.service';
import logoDark from '../assets/logo.png';
import logoLight from '../assets/logo_blanc.png';
import { canDisplayProfileImage, getUserInitialsFromName } from '../utils/userAvatar';

// Theme icons as SVG components
const SunIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);

const MoonIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

const SystemIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
);

function parseNavSession() {
    try {
        const raw = localStorage.getItem('mbg_user');
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data?.token) return null;
        const account = data.user || data;
        return { data, account };
    } catch {
        return null;
    }
}

function displayNameFromAccount(account) {
    if (!account) return '';
    if (account.firstName || account.lastName) {
        return [account.firstName, account.lastName].filter(Boolean).join(' ').trim();
    }
    if (account.username) return account.username;
    if (account.email) return account.email.split('@')[0];
    return 'Membre';
}

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const [themeMenuOpen, setThemeMenuOpen] = useState(false);
    const [economiesOpen, setEconomiesOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [navSession, setNavSession] = useState(() => parseNavSession());
    const [pendingSurveyCount, setPendingSurveyCount] = useState(0);
    const themeMenuRef = useRef(null);
    const userMenuRef = useRef(null);
    const location = useLocation();
    const { theme, setTheme, resolvedTheme } = useTheme();

    const account = navSession?.account;
    const role = account?.role;
    const isStaffRole = !!(role && ['superadmin', 'analyst', 'moderator'].includes(role));

    const refreshSession = () => setNavSession(parseNavSession());

    useEffect(() => {
        refreshSession();
    }, [location.pathname]);

    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === 'mbg_user') refreshSession();
        };
        window.addEventListener('storage', onStorage);
        const interval = setInterval(refreshSession, 2000);
        return () => { window.removeEventListener('storage', onStorage); clearInterval(interval); };
    }, []);

    useEffect(() => {
        if (!navSession || authService.needsQuestionnaireCompletion() || isStaffRole) {
            setPendingSurveyCount(0);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const r = await questionnaireService.getPending();
                if (cancelled || !r.success) return;
                setPendingSurveyCount(r.count ?? 0);
            } catch {
                if (!cancelled) setPendingSurveyCount(0);
            }
        })();
        return () => { cancelled = true; };
    }, [location.pathname, navSession, isStaffRole]);

    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === 'mbg_user' || e.key === null) refreshSession();
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
                setThemeMenuOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        setThemeMenuOpen(false);
    };

    const getCurrentThemeIcon = () => {
        if (theme === THEMES.SYSTEM) return <SystemIcon />;
        if (resolvedTheme === 'light') return <SunIcon />;
        return <MoonIcon />;
    };

    const displayName = displayNameFromAccount(account);
    const initials = getUserInitialsFromName(account);
    const showAvatarImage = canDisplayProfileImage(account);
    const showAdminEntry = isStaffRole;
    const showQuestionnairesNav =
        !!navSession &&
        !isStaffRole &&
        !authService.needsQuestionnaireCompletion();

    const handleLogout = async () => {
        setUserMenuOpen(false);
        setIsOpen(false);
        await authService.logout();
        refreshSession();
        window.location.href = '/';
    };

    return (
        <>
            <a href="#main-content" className="skip-link">Aller au contenu principal</a>
            <header className={`header${navSession ? ' header--session' : ''}`} role="banner">
                <div className="header__container">
                    <Link to="/" className="header__logo" aria-label="Mahdia Blue & Green - Accueil">
                        <img src={resolvedTheme === 'light' ? logoDark : logoLight} alt="" width="80" height="80" />
                    </Link>

                    <nav className={`nav ${isOpen ? 'nav--open' : ''}`} role="navigation" aria-label="Navigation principale">
                        <button
                            className={`nav__toggle ${isOpen ? 'open' : ''}`}
                            aria-expanded={isOpen}
                            aria-controls="nav-list"
                            aria-label="Menu"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>

                        <ul className="nav__list" id="nav-list">
                            <li>
                                <NavLink to="/" className={({ isActive }) => `nav__link ${isActive ? 'nav__link--active' : ''}`} end onClick={() => setIsOpen(false)}>
                                    Accueil
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/a-propos" className={({ isActive }) => `nav__link ${isActive ? 'nav__link--active' : ''}`} onClick={() => setIsOpen(false)}>
                                    À propos
                                </NavLink>
                            </li>
                            <li className={`nav__dropdown ${economiesOpen ? 'nav__dropdown--open' : ''}`}>
                                <button
                                    className="nav__link nav__dropdown-toggle"
                                    aria-haspopup="true"
                                    aria-expanded={economiesOpen}
                                    onClick={() => setEconomiesOpen(!economiesOpen)}
                                >
                                    Économies
                                    <svg className="nav__dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>
                                {economiesOpen && (
                                    <ul className="nav__dropdown-menu" role="menu">
                                        <li><Link to="/economies/bleue" className="nav__dropdown-item" role="menuitem" onClick={() => { setEconomiesOpen(false); setIsOpen(false); }}>Économie Bleue</Link></li>
                                        <li><Link to="/economies/verte" className="nav__dropdown-item" role="menuitem" onClick={() => { setEconomiesOpen(false); setIsOpen(false); }}>Économie Verte</Link></li>
                                        <li><Link to="/economies/circulaire" className="nav__dropdown-item" role="menuitem" onClick={() => { setEconomiesOpen(false); setIsOpen(false); }}>Économie Circulaire</Link></li>
                                    </ul>
                                )}
                            </li>
                            <li>
                                <NavLink to="/blog" className={({ isActive }) => `nav__link ${isActive ? 'nav__link--active' : ''}`} onClick={() => setIsOpen(false)}>
                                    Blog
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/evenements" className={({ isActive }) => `nav__link ${isActive ? 'nav__link--active' : ''}`} onClick={() => setIsOpen(false)}>
                                    Événements
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/ressources" className={({ isActive }) => `nav__link ${isActive ? 'nav__link--active' : ''}`} onClick={() => setIsOpen(false)}>
                                    Ressources
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/entrepreneurs" className={({ isActive }) => `nav__link ${isActive ? 'nav__link--active' : ''}`} onClick={() => setIsOpen(false)}>
                                    Entrepreneurs
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/contact" className={({ isActive }) => `nav__link ${isActive ? 'nav__link--active' : ''}`} onClick={() => setIsOpen(false)}>
                                    Contact
                                </NavLink>
                            </li>
                            {showQuestionnairesNav && (
                                <li>
                                    <NavLink to="/questionnaire" className={({ isActive }) => `nav__link ${isActive ? 'nav__link--active' : ''}`} onClick={() => setIsOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                        Questionnaires
                                        {pendingSurveyCount > 0 && (
                                            <span
                                                style={{
                                                    minWidth: '1.15rem',
                                                    height: '1.15rem',
                                                    padding: '0 5px',
                                                    borderRadius: '999px',
                                                    background: '#dc2626',
                                                    color: '#fff',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 800,
                                                    lineHeight: '1.15rem',
                                                    textAlign: 'center'
                                                }}
                                                title="Enquêtes à compléter"
                                            >
                                                {pendingSurveyCount > 9 ? '9+' : pendingSurveyCount}
                                            </span>
                                        )}
                                    </NavLink>
                                </li>
                            )}

                            <li className="nav__theme-switcher" ref={themeMenuRef}>
                                <button
                                    className="theme-toggle"
                                    onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                                    aria-label="Changer le thème"
                                    aria-expanded={themeMenuOpen}
                                    aria-haspopup="true"
                                    title="Thème"
                                >
                                    {getCurrentThemeIcon()}
                                </button>
                                {themeMenuOpen && (
                                    <div className="theme-menu" role="menu">
                                        <button
                                            className={`theme-menu__item ${theme === THEMES.LIGHT ? 'theme-menu__item--active' : ''}`}
                                            onClick={() => handleThemeChange(THEMES.LIGHT)}
                                            role="menuitem"
                                        >
                                            <SunIcon />
                                            <span>Clair</span>
                                        </button>
                                        <button
                                            className={`theme-menu__item ${theme === THEMES.DARK ? 'theme-menu__item--active' : ''}`}
                                            onClick={() => handleThemeChange(THEMES.DARK)}
                                            role="menuitem"
                                        >
                                            <MoonIcon />
                                            <span>Sombre</span>
                                        </button>
                                        <button
                                            className={`theme-menu__item ${theme === THEMES.SYSTEM ? 'theme-menu__item--active' : ''}`}
                                            onClick={() => handleThemeChange(THEMES.SYSTEM)}
                                            role="menuitem"
                                        >
                                            <SystemIcon />
                                            <span>Système</span>
                                        </button>
                                    </div>
                                )}
                            </li>

                            <li className="nav__user-area" ref={userMenuRef}>
                                {navSession ? (
                                    <div className="nav-user">
                                        <button
                                            type="button"
                                            className="nav-user__trigger"
                                            aria-expanded={userMenuOpen}
                                            aria-haspopup="true"
                                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        >
                                            <span className="nav-user__avatar" aria-hidden="true">
                                                {showAvatarImage
                                                    ? <img src={account.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                    : initials}
                                            </span>
                                            <span className="nav-user__meta">
                                                <span className="nav-user__label">Connecté</span>
                                                <span className="nav-user__name" title={displayName}>{displayName}</span>
                                            </span>
                                            <ChevronDown size={18} className={`nav-user__chevron ${userMenuOpen ? 'nav-user__chevron--open' : ''}`} aria-hidden="true" />
                                        </button>
                                        {userMenuOpen && (
                                            <div className="nav-user__dropdown" role="menu">
                                                <Link to="/compte" className="nav-user__dropdown-item" role="menuitem" onClick={() => { setUserMenuOpen(false); setIsOpen(false); }}>
                                                    <UserCircle size={18} />
                                                    Mon compte
                                                </Link>
                                                {showAdminEntry ? (
                                                    <Link
                                                        to="/admin"
                                                        className="nav-user__dropdown-item nav-user__dropdown-item--dashboard"
                                                        role="menuitem"
                                                        onClick={() => { setUserMenuOpen(false); setIsOpen(false); }}
                                                    >
                                                        <LayoutDashboard size={18} />
                                                        Tableau de bord
                                                    </Link>
                                                ) : (
                                                    <>
                                                        <Link to="/blog/creer" className="nav-user__dropdown-item" role="menuitem" onClick={() => { setUserMenuOpen(false); setIsOpen(false); }}>
                                                            Créer un article
                                                        </Link>
                                                        <Link to="/evenements/creer" className="nav-user__dropdown-item" role="menuitem" onClick={() => { setUserMenuOpen(false); setIsOpen(false); }}>
                                                            Créer un événement
                                                        </Link>
                                                    </>
                                                )}
                                                <button type="button" className="nav-user__dropdown-item nav-user__dropdown-item--danger" role="menuitem" onClick={handleLogout}>
                                                    <LogOut size={18} />
                                                    Déconnexion
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Link to="/auth" className="btn btn--sm btn--primary" onClick={() => setIsOpen(false)}>
                                        Connexion
                                    </Link>
                                )}
                            </li>
                        </ul>
                    </nav>
                </div>
            </header>
        </>
    );
}
