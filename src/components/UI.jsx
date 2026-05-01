import { Link } from 'react-router-dom';
import { categories } from '../data/mockData';
import {
    CalendarIcon,
    ClockIcon,
    LocationIcon,
    BookOpenIcon,
    FileTextIcon,
    VideoIcon,
    LinkIcon,
    FolderIcon,
    DownloadIcon,
    getResourceTypeIcon
} from './Icons';

// Monitor/Online icon
const MonitorIcon = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
);

import { useState } from 'react';

// Custom LinkedIn-style reaction icons
const LinkedInLike = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#378FE9" />
        <path d="M8 11.5C8 11.5 8.5 7 12 7C14 7 15 8.5 15 10C15 11.5 14 12 14 12H16.5C17.328 12 18 12.672 18 13.5C18 14 17.5 14.5 17.5 14.5C17.828 14.672 18 15 18 15.5C18 16 17.5 16.5 17.5 16.5C17.828 16.672 18 17 18 17.5C18 18.328 17.328 19 16.5 19H11C9.5 19 8 18 8 16V11.5Z" fill="white" />
        <path d="M6 12H7.5V19H6C5.448 19 5 18.552 5 18V13C5 12.448 5.448 12 6 12Z" fill="white" />
    </svg>
);

const LinkedInCelebrate = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#44B553" />
        <path d="M7 9L9.5 11.5M17 9L14.5 11.5M8 6L9 8M16 6L15 8M12 5V7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 13C8 13 9 17 12 17C15 17 16 13 16 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 13L6 15M16 13L18 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9.5" cy="11" r="1" fill="white" />
        <circle cx="14.5" cy="11" r="1" fill="white" />
    </svg>
);

const LinkedInSupport = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#7A61D1" />
        <path d="M12 17C12 17 6 13.5 6 10C6 8 7.5 6.5 9.5 6.5C10.5 6.5 11.5 7 12 8C12.5 7 13.5 6.5 14.5 6.5C16.5 6.5 18 8 18 10C18 13.5 12 17 12 17Z" fill="white" />
        <path d="M6 14C5 15 5 16 6 17C7 18 9 18 10 17" stroke="white" strokeWidth="1" strokeLinecap="round" />
        <path d="M18 14C19 15 19 16 18 17C17 18 15 18 14 17" stroke="white" strokeWidth="1" strokeLinecap="round" />
    </svg>
);

const LinkedInLove = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#DF704D" />
        <path d="M12 18C12 18 5 13 5 9C5 6.5 7 5 9 5C10.5 5 11.5 6 12 7C12.5 6 13.5 5 15 5C17 5 19 6.5 19 9C19 13 12 18 12 18Z" fill="white" />
    </svg>
);

const LinkedInInsightful = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#F5A623" />
        <path d="M12 5C9 5 7 7 7 10C7 12 8 13 9 14V16C9 16.5 9.5 17 10 17H14C14.5 17 15 16.5 15 16V14C16 13 17 12 17 10C17 7 15 5 12 5Z" fill="white" />
        <path d="M10 18H14V19C14 19.5 13.5 20 13 20H11C10.5 20 10 19.5 10 19V18Z" fill="white" />
        <circle cx="10" cy="10" r="0.8" fill="#F5A623" />
        <circle cx="14" cy="10" r="0.8" fill="#F5A623" />
        <path d="M10.5 12C10.5 12 11 13 12 13C13 13 13.5 12 13.5 12" stroke="#F5A623" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
);

function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'à l\'instant';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `il y a ${days}j`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `il y a ${weeks} sem.`;
    const months = Math.floor(days / 30);
    if (months < 12) return `il y a ${months} mois`;
    const years = Math.floor(days / 365);
    return `il y a ${years} an${years > 1 ? 's' : ''}`;
}

export function PostCard({ post, favorites = [], onToggleFavorite }) {
    const categoryTitle =
        typeof post.category === 'string'
            ? post.category
            : (post.category?.title || post.category?.name || '');

    const cat = categories.find(c => c.key === post.category);
    const badgeLabel = cat?.label || categoryTitle || '—';
    const badgeKey = (cat?.key || categoryTitle || 'default').toString().toLowerCase().replace(/\s+/g, '-');

    const postId = post._id || post.id;
    const isFav = favorites.includes(postId);

    const ratingsArr = post.ratings || [];
    const avgRating = ratingsArr.length
        ? Math.round((ratingsArr.reduce((s, r) => s + (r.value || 0), 0) / ratingsArr.length) * 10) / 10
        : 0;

    const postSlugOrId = post.slug || postId;
    const imageUrl = post.featuredImage || post.articleData?.featuredImage || '';

    const handleFav = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onToggleFavorite) onToggleFavorite(postId);
    };

    return (
        <Link to={`/article/${postSlugOrId}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
            <article className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>

                {/* Heart favorite button */}
                <button onClick={handleFav} title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    style={{ position: 'absolute', top: 12, right: 12, zIndex: 5, background: 'rgba(255,255,255,.85)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.12)', transition: 'transform .2s' }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={isFav ? '#e74c3c' : 'none'} stroke={isFav ? '#e74c3c' : '#888'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                </button>

                {imageUrl ? (
                    <img src={imageUrl} alt="" className="card__image" loading="lazy" />
                ) : (
                    <div className="card__image" style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '2rem', fontWeight: 700, minHeight: '180px' }}>
                        {post.title?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                )}
                <div className="card__content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span className={`badge badge--${badgeKey}`}>{badgeLabel}</span>
                        {post.createdAt && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '1px 8px', borderRadius: '10px', fontWeight: 500 }}>
                                {timeAgo(post.createdAt)}
                            </span>
                        )}
                    </div>
                    <h3 className="card__title">{post.title}</h3>
                    <p className="card__excerpt">
                        {String(post.excerpt || post.body || post.articleData?.summary || '').slice(0, 100)}
                        {((post.excerpt || post.body || post.articleData?.summary) ? '...' : '')}
                    </p>
                    <div className="card__meta" style={{ marginTop: 'auto' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <BookOpenIcon size={14} /> {post.readTimeMinutes || post.articleData?.readTime || 0} min
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CalendarIcon size={14} />
                            {new Date(post.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {' '}
                            {new Date(post.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    {/* Rating + favorites bar */}
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            {[1, 2, 3, 4, 5].map(s => (
                                <svg key={s} width="14" height="14" viewBox="0 0 24 24"
                                    fill={s <= Math.round(avgRating) ? '#f59e0b' : 'none'}
                                    stroke="#f59e0b" strokeWidth="2">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                            ))}
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                                {avgRating > 0 ? `${avgRating}/5` : '—'}
                            </span>
                        </div>
                        {ratingsArr.length > 0 && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                ({ratingsArr.length} avis)
                            </span>
                        )}
                    </div>
                </div>
            </article>
        </Link>
    );
}

export function EventCard({ event }) {
    const d = event.eventData;
    const startDate = new Date(d.startDate);
    const isPastEvent = startDate < new Date();
    const imageUrl = d?.eventImage || event.featuredImage || '/images/placeholder-event.jpg';
    const badgeKey = (typeof event.category === 'string'
        ? event.category
        : (event.category?.title || 'event')).toString().toLowerCase().replace(/\s+/g, '-');

    const eventUrlId = event.eventNumber != null ? String(event.eventNumber) : (event._id || event.id || event.slug);

    return (
        <article className="card">
            <img src={imageUrl} alt={event.title} className="card__image" loading="lazy" style={{ background: 'linear-gradient(135deg, #1a3a4a 0%, #0d1f29 100%)' }} />
            <div className="card__content">
                <span className={`badge badge--${badgeKey}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    {d.isOnline ? <><MonitorIcon size={14} /> En ligne</> : <><LocationIcon size={14} /> {(d.location || '—').toString().split(',')[0]}</>}
                </span>
                <h3 className="card__title">
                    <Link to={`/evenement/${eventUrlId}`}>{event.title}</Link>
                </h3>
                <p className="card__excerpt">{String(event.excerpt || event.body || '').slice(0, 120)}{(event.excerpt || event.body) ? '...' : ''}</p>
                <div className="card__meta">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CalendarIcon size={14} /> {startDate.toLocaleDateString('fr-FR')}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ClockIcon size={14} /> {startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                {isPastEvent ? (
                    <Link to={`/evenement/${eventUrlId}`} className="btn btn--outline btn--sm btn--block" style={{ marginTop: '1rem' }}>
                        Voir détails
                    </Link>
                ) : (
                    <Link to={`/evenement/${eventUrlId}`} className="btn btn--primary btn--sm btn--block" style={{ marginTop: '1rem' }}>
                        S'inscrire
                    </Link>
                )}
            </div>
        </article>
    );
}

export function ResourceCard({ resource, onDownload }) {
    const normalizedType = (() => {
        const t = String(resource?.type || '').toLowerCase();
        if (t === 'doc') return 'document';
        return t;
    })();
    const actionLabel = ['link', 'image', 'video'].includes(normalizedType) ? 'Ouvrir' : 'Télécharger';

    return (
        <div className="card">
            <div className="card__content">
                <span className="resource-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                    {getResourceTypeIcon(normalizedType || resource.type, 40)}
                </span>
                <h3 className="card__title" style={{ marginTop: '0.5rem' }}>{resource.title}</h3>
                <p className="card__excerpt">{resource.description}</p>
                <div className="card__meta">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <DownloadIcon size={14} /> {resource.downloadsCount}
                    </span>
                </div>
                <button
                    className="btn btn--outline btn--sm btn--block"
                    style={{ marginTop: '1rem' }}
                    onClick={() => onDownload && onDownload(resource._id || resource.id, resource)}
                >
                    {actionLabel}
                </button>
            </div>
        </div>
    );
}

export function Toast({ message, type = 'success', show, onClose }) {
    return (
        <div className={`toast toast--${type} ${show ? 'toast--show' : ''}`} role="alert" aria-live="polite">
            {message}
        </div>
    );
}

export function Modal({ isOpen, onClose, title, children, contentClassName = '', stackOnTop = false }) {
    if (!isOpen) return null;

    return (
        <div className={`modal ${isOpen ? 'modal--open' : ''} ${stackOnTop ? 'modal--stack-top' : ''}`} onClick={onClose}>
            <div className={`modal__content${contentClassName ? ` ${contentClassName}` : ''}`} onClick={e => e.stopPropagation()}>
                <div className="modal__header">
                    <h3 className="modal__title">{title}</h3>
                    <button className="modal__close" onClick={onClose} aria-label="Fermer">&times;</button>
                </div>
                <div className="modal__body">
                    {children}
                </div>
            </div>
        </div>
    );
}

export function Badge({ type, children }) {
    return <span className={`badge badge--${type}`}>{children}</span>;
}

export function Stepper({ steps, currentStep }) {
    return (
        <div className="stepper">
            {steps.map((step, i) => (
                <div
                    key={i}
                    className={`stepper__step ${i === currentStep ? 'stepper__step--active' : ''} ${i < currentStep ? 'stepper__step--completed' : ''}`}
                >
                    <span className="stepper__indicator">{i + 1}</span>
                    <span className="stepper__label">{step}</span>
                </div>
            ))}
        </div>
    );
}

export function ProgressBar({ percent }) {
    return (
        <div className="progress">
            <div className="progress__bar" style={{ width: `${percent}%` }} />
        </div>
    );
}
