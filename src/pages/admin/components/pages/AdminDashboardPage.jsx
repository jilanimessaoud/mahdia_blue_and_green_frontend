import { Link } from 'react-router-dom';
import { Upload, X, Mail, Users, Newspaper, Handshake, Briefcase, BarChart3, Loader, CheckCircle, AlertTriangle } from 'lucide-react';
import {
    ArticlesIcon,
    EventsIcon,
    ResourcesIcon,
    UsersIcon,
    EditIcon,
    TrashIcon,
    EyeIcon,
    DownloadIcon
} from '../../../../components/Icons';
import { adminService, eventsService, articlesService, resourcesService, contactService, teamService, newsletterService, partnerService, entrepreneurService, api } from '../../../../services';
import { downloadFileResource } from '../../../../utils/cloudinaryDelivery';
import { canDisplayProfileImage, getUserInitialsFromName } from '../../../../utils/userAvatar';
import { Modal } from '../../../../components/UI';
import BlogArticleForm from '../../../../components/BlogArticleForm';
import RichTextEditor from '../../../../components/RichTextEditor';
import AdminPagination from '../../../../components/AdminPagination';
import AdminListFilters from '../../../../components/AdminListFilters';
import AdminAnalyticsDashboard from '../../../../components/AdminAnalyticsDashboard';
import { matchesCreatedAtRange, textIncludes } from '../../../../utils/adminListFilters';
import {
    getTomorrowMidnightLocalString,
    addMinutesToDatetimeLocalString,
    validateEventSchedule,
    getDatetimeLocalMinForStartEdit,
} from '../../../../utils/eventScheduling';
import {
    ADMIN_PAGE_SIZE,
    EMPTY_PARTNER_FORM,
    EMPTY_PUBLIC_TEAM_FORM,
    EMPTY_ENTREPRENEUR_FORM,
    DEFAULT_ADMIN_ARTICLE_FORM,
    emptyPaginated,
    QUESTION_CATEGORY_OPTIONS,
    SIDEBAR_COLLAPSED_KEY,
    PERSONAL_INFO_FIELD_VALUES,
    QUESTIONNAIRE_PREVIEW_FALLBACK_DESC,
} from '../../constants';
import {
    formatAdminTeamDateTime,
    adminTeamDisplayValue,
    formatArticleStatus,
    staffRolePillClass,
    adminUserRoleSelectClass,
    adminUserStatusSelectClass,
} from '../../utils/helpers';
import DashboardIcon from '../DashboardIcon';
import StaffRolePill from '../StaffRolePill';
import { useAdminPanel } from '../../AdminPanelContext';

export default function AdminDashboardPage() {
    const {
        canManageQuestionnaires,
        dashboardData,
        error,
        fetchDashboardData,
        formatArticleStatus,
        goToSection,
        handleViewPost,
        handleViewUser,
        loading,
        showToast,
    } = useAdminPanel();

    return (
                            <>
                                <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <h1 style={{ margin: 0 }}>Dashboard</h1>
                                    <button
                                        className="btn btn--ghost"
                                        type="button"
                                        onClick={() => {
                                            void fetchDashboardData({ silent: true });
                                            showToast('🔄 Données actualisées', 'success');
                                        }}
                                        title="Actualiser tout le tableau de bord"
                                    >
                                        🔄 Actualiser tout
                                    </button>
                                </div>
        
                                {loading && (
                                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                                        <div className="spinner" style={{ margin: '0 auto 1rem', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                        <p>Chargement des données du tableau de bord...</p>
                                        <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>Si cela prend trop de temps, vérifiez la console du navigateur (F12)</p>
                                    </div>
                                )}
        
                                {error && !loading && (
                                    <div style={{ padding: '1.5rem', background: '#fee', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #fcc' }}>
                                        <p style={{ color: '#c00', fontWeight: 'bold', marginBottom: '0.5rem' }}>⚠️ Erreur</p>
                                        <p style={{ color: '#c00' }}>{error}</p>
                                        <button
                                            onClick={() => window.location.reload()}
                                            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#c00', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Réessayer
                                        </button>
                                    </div>
                                )}
        
                                {!loading && dashboardData && (() => {
                                    const recentArticles = (dashboardData.recentPosts || []).filter(p => p.type === 'article');
                                    const recentEvents = (dashboardData.recentPosts || []).filter(p => p.type === 'event');
                                    const refreshDashboard = () => {
                                        void fetchDashboardData({ silent: true });
                                        showToast('🔄 Données actualisées', 'success');
                                    };
                                    return (
                                    <>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                flexWrap: 'wrap',
                                                gap: '0.5rem',
                                                marginBottom: '1rem',
                                            }}
                                        >
                                            <h2 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: '600', fontSize: '1.15rem' }}>
                                                Indicateurs clés
                                            </h2>
                                            <button className="btn btn--sm btn--ghost" type="button" onClick={refreshDashboard} title="Actualiser les indicateurs">
                                                🔄 Actualiser
                                            </button>
                                        </div>

                                        <div className="admin-kpi-grid">
                                            <div
                                                className="admin-kpi"
                                                style={{ background: 'linear-gradient(135deg, #007d90 0%, #00a5b5 100%)', color: '#fff', cursor: 'pointer' }}
                                                onClick={() => goToSection('users')}
                                            >
                                                <div className="admin-kpi__value" style={{ color: '#fff' }}>{dashboardData.stats.totalUsers}</div>
                                                <div className="admin-kpi__label" style={{ color: 'rgba(255,255,255,0.9)' }}>👥 Utilisateurs</div>
                                            </div>
                                            <div
                                                className="admin-kpi"
                                                style={{ background: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)', color: '#fff', cursor: 'pointer' }}
                                                onClick={() => goToSection('articles')}
                                            >
                                                <div className="admin-kpi__value" style={{ color: '#fff' }}>{dashboardData.stats.totalArticles}</div>
                                                <div className="admin-kpi__label" style={{ color: 'rgba(255,255,255,0.9)' }}>📄 Articles</div>
                                            </div>
                                            <div
                                                className="admin-kpi"
                                                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', color: '#fff', cursor: 'pointer' }}
                                                onClick={() => goToSection('events')}
                                            >
                                                <div className="admin-kpi__value" style={{ color: '#fff' }}>{dashboardData.stats.totalEvents}</div>
                                                <div className="admin-kpi__label" style={{ color: 'rgba(255,255,255,0.9)' }}>📅 Événements</div>
                                            </div>
                                            <div
                                                className="admin-kpi"
                                                style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', color: '#fff', cursor: 'pointer' }}
                                                onClick={() => goToSection('articles')}
                                            >
                                                <div className="admin-kpi__value" style={{ color: '#fff' }}>{dashboardData.stats.publishedPosts}</div>
                                                <div className="admin-kpi__label" style={{ color: 'rgba(255,255,255,0.9)' }}>✅ Posts publiés</div>
                                            </div>
                                            <div
                                                className="admin-kpi"
                                                style={{
                                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                                                    color: '#fff',
                                                    cursor: canManageQuestionnaires ? 'pointer' : 'default',
                                                    opacity: canManageQuestionnaires ? 1 : 0.85,
                                                }}
                                                onClick={canManageQuestionnaires ? () => goToSection('questionnaire') : undefined}
                                                title={canManageQuestionnaires ? 'Voir les questionnaires et réponses' : 'Réservé au super administrateur et à l’analyste'}
                                            >
                                                <div className="admin-kpi__value" style={{ color: '#fff' }}>{dashboardData.stats.totalResponses}</div>
                                                <div className="admin-kpi__label" style={{ color: 'rgba(255,255,255,0.9)' }}>📋 Réponses questionnaires</div>
                                            </div>
                                        </div>
        
                                        {/* Articles récents */}
                                        <div className="table-container" style={{ marginBottom: '2rem', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)' }}>
                                            <div className="table-header" style={{ background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                <h2 style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '1.25rem', margin: 0 }}>Articles récents</h2>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <button
                                                        className="btn btn--sm btn--ghost"
                                                        type="button"
                                                        onClick={refreshDashboard}
                                                        title="Actualiser"
                                                    >
                                                        🔄 Actualiser
                                                    </button>
                                                    <button className="btn btn--sm btn--ghost" style={{ color: 'var(--color-primary)', fontWeight: 500 }} type="button" onClick={() => goToSection('articles')}>
                                                        Voir tout →
                                                    </button>
                                                </div>
                                            </div>
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: '60px', textAlign: 'center' }}>Photo</th>
                                                        <th>Article</th>
                                                        <th style={{ width: '100px' }}>Statut</th>
                                                        <th style={{ width: '100px' }}>Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recentArticles.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Aucun article récent</td>
                                                        </tr>
                                                    ) : (
                                                        recentArticles.slice(0, 5).map(post => (
                                                            <tr key={post._id} style={{ cursor: 'pointer' }} onClick={() => handleViewPost(post)}>
                                                                <td style={{ textAlign: 'center' }}>
                                                                    <div style={{
                                                                        width: '40px', height: '40px', borderRadius: '8px', margin: '0 auto',
                                                                        background: post.articleData?.featuredImage ? 'transparent' : 'linear-gradient(135deg, #2563eb, #60a5fa)',
                                                                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        fontSize: '1rem', overflow: 'hidden',
                                                                        border: post.articleData?.featuredImage ? '2px solid var(--color-primary)' : 'none',
                                                                    }}>
                                                                        {post.articleData?.featuredImage
                                                                            ? <img src={post.articleData.featuredImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                            : '📄'}
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{post.title}</span>
                                                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                                            {post.author?.username || 'N/A'}
                                                                            {post.category?.title ? ` · ${post.category.title}` : ''}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className={`badge badge--${post.status === 'published' ? 'green' : 'yellow'}`}>
                                                                        {formatArticleStatus(post.status)}
                                                                    </span>
                                                                </td>
                                                                <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                                    {new Date(post.createdAt).toLocaleDateString('fr-FR')}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
        
                                        {/* Événements récents */}
                                        <div className="table-container" style={{ marginBottom: '2rem', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)' }}>
                                            <div className="table-header" style={{ background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                <h2 style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '1.25rem', margin: 0 }}>Événements récents</h2>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <button
                                                        className="btn btn--sm btn--ghost"
                                                        type="button"
                                                        onClick={refreshDashboard}
                                                        title="Actualiser"
                                                    >
                                                        🔄 Actualiser
                                                    </button>
                                                    <button className="btn btn--sm btn--ghost" style={{ color: 'var(--color-primary)', fontWeight: 500 }} type="button" onClick={() => goToSection('events')}>
                                                        Voir tout →
                                                    </button>
                                                </div>
                                            </div>
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: '60px', textAlign: 'center' }}>Photo</th>
                                                        <th>Événement</th>
                                                        <th style={{ width: '100px' }}>Statut</th>
                                                        <th style={{ width: '100px' }}>Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recentEvents.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Aucun événement récent</td>
                                                        </tr>
                                                    ) : (
                                                        recentEvents.slice(0, 5).map(post => {
                                                            const eventThumb = post.eventData?.eventImage || post.eventData?.coverImage;
                                                            return (
                                                            <tr key={post._id} style={{ cursor: 'pointer' }} onClick={() => handleViewPost(post)}>
                                                                <td style={{ textAlign: 'center' }}>
                                                                    <div style={{
                                                                        width: '40px', height: '40px', borderRadius: '8px', margin: '0 auto',
                                                                        background: eventThumb ? 'transparent' : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                                                                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        fontSize: '1rem', overflow: 'hidden',
                                                                        border: eventThumb ? '2px solid var(--color-primary)' : 'none',
                                                                    }}>
                                                                        {eventThumb
                                                                            ? <img src={eventThumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                            : '📅'}
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{post.title}</span>
                                                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                                            {post.author?.username || 'N/A'}
                                                                            {post.eventData?.location ? ` · ${post.eventData.location}` : ''}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className={`badge badge--${post.status === 'published' ? 'green' : 'yellow'}`}>
                                                                        {formatArticleStatus(post.status)}
                                                                    </span>
                                                                </td>
                                                                <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                                    {new Date(post.createdAt).toLocaleDateString('fr-FR')}
                                                                </td>
                                                            </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
        
                                        {/* Utilisateurs récents */}
                                        <div className="table-container" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)' }}>
                                            <div className="table-header" style={{ background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                <h2 style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '1.25rem', margin: 0 }}>Utilisateurs récents</h2>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <button
                                                        className="btn btn--sm btn--ghost"
                                                        type="button"
                                                        onClick={refreshDashboard}
                                                        title="Actualiser"
                                                    >
                                                        🔄 Actualiser
                                                    </button>
                                                    <button className="btn btn--sm btn--ghost" style={{ color: 'var(--color-primary)', fontWeight: 500 }} type="button" onClick={() => goToSection('users')}>
                                                        Voir tout →
                                                    </button>
                                                </div>
                                            </div>
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: '60px', textAlign: 'center' }}>Photo</th>
                                                        <th>Utilisateur</th>
                                                        <th>Rôle</th>
                                                        <th style={{ width: '100px' }}>Statut</th>
                                                        <th style={{ width: '100px' }}>Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {dashboardData.recentUsers.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Aucun utilisateur récent</td>
                                                        </tr>
                                                    ) : (
                                                        dashboardData.recentUsers.map(user => {
                                                            const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
                                                            const uInitials = getUserInitialsFromName(user);
                                                            const showPhoto = canDisplayProfileImage(user);
                                                            return (
                                                            <tr key={user._id} style={{ cursor: 'pointer' }} onClick={() => handleViewUser(user._id)}>
                                                                <td style={{ textAlign: 'center' }}>
                                                                    <div style={{
                                                                        width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto',
                                                                        background: showPhoto ? 'transparent' : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light, #00a5b5))',
                                                                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        fontSize: '0.8rem', fontWeight: 700, overflow: 'hidden',
                                                                        border: showPhoto ? '2px solid var(--color-primary)' : 'none',
                                                                    }}>
                                                                        {showPhoto
                                                                            ? <img src={user.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                            : uInitials}
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                                                            {fullName || user.username}
                                                                        </span>
                                                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                                            {user.email}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className={`badge badge--${user.role === 'superadmin' ? 'red' : user.role === 'moderator' ? 'purple' : user.role === 'analyst' ? 'blue' : 'yellow'}`}>
                                                                        {user.role === 'superadmin' ? 'Super Admin' : user.role === 'moderator' ? 'Modérateur' : user.role === 'analyst' ? 'Analyste' : 'Utilisateur'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className={`badge badge--${user.isActive ? 'green' : 'red'}`}>
                                                                        {user.isActive ? 'Actif' : 'Inactif'}
                                                                    </span>
                                                                </td>
                                                                <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                                                                </td>
                                                            </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                    );
                                })()}
                            </>
    );
}
