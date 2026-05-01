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

export default function AdminNewsletterPage() {
    const {
        ADMIN_PAGE_SIZE,
        fetchNewsletterSubs,
        filteredNewsletterSubs,
        handleDeleteNewsletterSub,
        newsletterDateFrom,
        newsletterFilterQ,
        newsletterPage,
        newsletterSubs,
        newsletterTotalPages,
        openNewsletterEditModal,
        pagedNewsletterSubs,
        setNewsletterBroadcastOpen,
        setNewsletterDateFrom,
        setNewsletterDateTo,
        setNewsletterFilterQ,
        setNewsletterPage,
        showToast
    } = useAdminPanel();

    return (
                            <>
                                <div
                                    className="admin-header"
                                    style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        alignItems: 'flex-start',
                                        justifyContent: 'space-between',
                                        gap: '1rem',
                                    }}
                                >
                                    <div>
                                        <h1 style={{ color: 'var(--text-primary)', fontSize: '1.75rem', margin: 0 }}>
                                            Abonnés newsletter
                                        </h1>
                                      
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                                        <span
                                            style={{
                                                fontSize: '0.85rem',
                                                color: 'var(--text-muted)',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {newsletterSubs.length} abonné{newsletterSubs.length === 1 ? '' : 's'}
                                        </span>
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                alignItems: 'center',
                                                justifyContent: 'flex-end',
                                                gap: '0.5rem',
                                            }}
                                        >
                                            <button
                                                className="btn btn--ghost"
                                                type="button"
                                                onClick={() => {
                                                    void fetchNewsletterSubs();
                                                    showToast('🔄 Liste actualisée', 'success');
                                                }}
                                                title="Actualiser"
                                            >
                                                🔄 Actualiser
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn--primary"
                                                disabled={newsletterSubs.length === 0}
                                                onClick={() => setNewsletterBroadcastOpen(true)}
                                            >
                                                Envoyer un email à tous les abonnés
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <AdminListFilters
                                    idPrefix="admin-newsletter"
                                    title="Filtres newsletter"
                                    searchPlaceholder="Recherche sur les abonnés"
                                    searchValue={newsletterFilterQ}
                                    onSearchChange={setNewsletterFilterQ}
                                    dateMode="single"
                                    singleDate={newsletterDateFrom}
                                    onSingleDateChange={(value) => {
                                        setNewsletterDateFrom(value);
                                        setNewsletterDateTo(value);
                                    }}
                                    singleDateTitle="Filtrer par jour (inscription)"
                                />
                                <div className="table-container" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)' }}>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '150px', whiteSpace: 'nowrap' }}>Date</th>
                                                <th>Email</th>
                                                <th style={{ width: '120px' }}>Source</th>
                                                <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {newsletterSubs.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                                                        Aucun abonné pour l’instant.
                                                    </td>
                                                </tr>
                                            ) : filteredNewsletterSubs.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                                                        Aucun résultat pour ces critères
                                                    </td>
                                                </tr>
                                            ) : (
                                                pagedNewsletterSubs.map((s) => (
                                                    <tr key={s._id}>
                                                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                                            {s.createdAt
                                                                ? new Date(s.createdAt).toLocaleString('fr-FR', {
                                                                    dateStyle: 'short',
                                                                    timeStyle: 'short',
                                                                })
                                                                : '—'}
                                                        </td>
                                                        <td>
                                                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.email}</span>
                                                        </td>
                                                        <td>
                                                            {s.source ? (
                                                                <span className="badge badge--green">{s.source}</span>
                                                            ) : (
                                                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>—</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn--sm btn--ghost btn--action-edit"
                                                                    title="Modifier"
                                                                    onClick={() => openNewsletterEditModal(s)}
                                                                >
                                                                    <EditIcon size={16} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn--sm btn--ghost btn--action-delete"
                                                                    title="Supprimer"
                                                                    onClick={() => handleDeleteNewsletterSub(s._id)}
                                                                >
                                                                    <TrashIcon size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <AdminPagination
                                    currentPage={newsletterPage}
                                    totalPages={newsletterTotalPages}
                                    totalItems={filteredNewsletterSubs.length}
                                    pageSize={ADMIN_PAGE_SIZE}
                                    onPageChange={setNewsletterPage}
                                />
                            </>
    );
}
