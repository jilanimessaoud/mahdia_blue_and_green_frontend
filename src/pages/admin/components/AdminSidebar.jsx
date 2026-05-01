import { Link, NavLink } from 'react-router-dom';
import { House, ChevronLeft, ChevronRight } from 'lucide-react';
import logo from '../../../assets/logo.png';
import { adminSidebarRoleTitle } from '../utils/helpers';

/**
 * Barre latérale navigation admin (liens vers `/admin/:section`).
 * @param {{ navItems: Array<{ key: string, label: string, icon: React.ReactNode }>, sidebarCollapsed: boolean, setSidebarCollapsed: (v: boolean | ((b: boolean) => boolean)) => void, currentUserRole: string | null }} props
 */
export default function AdminSidebar({
    navItems,
    sidebarCollapsed,
    setSidebarCollapsed,
    currentUserRole,
}) {
    return (
        <aside className="admin-sidebar" aria-label="Navigation administration">
            <div className="admin-sidebar__inner">
                <div className="admin-sidebar__brand">
                    <div className="admin-sidebar__logo-mark" aria-hidden="true">
                        <img src={logo} alt="" className="admin-sidebar__logo-img" />
                    </div>
                    <div className="admin-sidebar__brand-text">
                        <span className="admin-sidebar__title">{adminSidebarRoleTitle(currentUserRole)}</span>
                        <span className="admin-sidebar__subtitle">Espace administration</span>
                    </div>
                    <button
                        type="button"
                        className="admin-sidebar__toggle"
                        onClick={() => setSidebarCollapsed((v) => !v)}
                        aria-expanded={!sidebarCollapsed}
                        aria-controls="admin-sidebar-nav"
                        title={sidebarCollapsed ? 'Développer le menu' : 'Réduire le menu'}
                    >
                        {sidebarCollapsed ? <ChevronRight size={18} strokeWidth={2.5} /> : <ChevronLeft size={18} strokeWidth={2.5} />}
                    </button>
                </div>
                <nav className="admin-sidebar__scroll" aria-label="Sections">
                    <ul id="admin-sidebar-nav" className="admin-nav">
                        {navItems.map((item) => (
                            <li key={item.key} className="admin-nav__item">
                                <NavLink
                                    to={`/admin/${item.key}`}
                                    title={item.label}
                                    className={({ isActive }) => `admin-nav__link ${isActive ? 'admin-nav__link--active' : ''}`}
                                    onMouseEnter={(e) => {
                                        if (!e.currentTarget.classList.contains('admin-nav__link--active')) {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                            e.currentTarget.style.backdropFilter = 'blur(10px)';
                                            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                                            e.currentTarget.style.transform = 'translateX(5px)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!e.currentTarget.classList.contains('admin-nav__link--active')) {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.backdropFilter = 'none';
                                            e.currentTarget.style.border = '1px solid transparent';
                                            e.currentTarget.style.transform = 'translateX(0)';
                                        }
                                    }}
                                    style={({ isActive }) => ({
                                        width: '100%',
                                        textAlign: 'left',
                                        display: 'flex',
                                        alignItems: 'center',
                                        textDecoration: 'none',
                                        color: '#ffffff',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        border: isActive ? '1px solid rgba(185, 254, 27, 0.3)' : '1px solid transparent',
                                        background: isActive
                                            ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))'
                                            : 'transparent',
                                        boxShadow: isActive ? '0 4px 12px rgba(0, 125, 144, 0.3)' : 'none',
                                    })}
                                >
                                    <span className="admin-nav__link-icon" aria-hidden>
                                        {item.icon}
                                    </span>
                                    <span className="admin-nav__link-text">{item.label}</span>
                                </NavLink>
                            </li>
                        ))}
                        <li className="admin-nav__item admin-nav__item--back">
                            <Link to="/" className="admin-nav__link admin-nav__link--back" title="Site public — Retour au site">
                                <span className="admin-nav__link--back-icon-wrap" aria-hidden>
                                    <House size={18} strokeWidth={2} />
                                </span>
                                <span className="admin-nav__link--back-label">
                                    <span className="admin-nav__link--back-title">Site public</span>
                                    <span className="admin-nav__link--back-sub">Quitter l&apos;administration</span>
                                </span>
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </aside>
    );
}
