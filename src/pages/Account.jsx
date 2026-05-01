import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { User, Settings, Shield, Calendar, LogOut, Trash2, Mail, MapPin, Camera, Upload, FileText, Edit3, Eye, Clock, CheckCircle, CalendarPlus } from 'lucide-react';
import { Toast, Modal } from '../components/UI';
import authService from '../services/auth.service';
import usersService from '../services/users.service';
import { articlesService } from '../services/articles.service';
import { eventsService } from '../services/events.service';
import { api } from '../services';
import { canDisplayProfileImage, getUserInitialsFromName } from '../utils/userAvatar';
export default function Account() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [profileLoadState, setProfileLoadState] = useState('loading'); // loading | ready
    const location = useLocation();
    const initialTab = location.hash === '#panier' ? 'panier' : 'profile';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [registrations, setRegistrations] = useState([]);
    const [isEditingPhoto, setIsEditingPhoto] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [pwdErrors, setPwdErrors] = useState({});
    const [pwdLoading, setPwdLoading] = useState(false);
    const [myArticles, setMyArticles] = useState([]);
    const [articlesLoading, setArticlesLoading] = useState(false);
    const [myEvents, setMyEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const fileInputRef = useRef(null);
    const toastHideTimerRef = useRef(null);
    const IMPORT_SUCCESS_TOAST_MS = 10_000;
    const navigate = useNavigate();

    const normalizeUser = (rawUser) => {
        if (!rawUser) return null;
        return {
            ...rawUser,
            bio: rawUser.bio ?? rawUser.personalInfo?.bio ?? '',
            city: rawUser.city ?? rawUser.personalInfo?.address?.city ?? '',
            firstName: rawUser.firstName ?? rawUser.personalInfo?.firstName ?? '',
            lastName: rawUser.lastName ?? rawUser.personalInfo?.lastName ?? ''
        };
    };

    useEffect(() => {
        const initializeProfile = async () => {
            const stored = localStorage.getItem('mbg_user');
            if (!stored) {
                navigate('/auth');
                return;
            }

            try {
                setProfileLoadState('loading');
                const parsedData = JSON.parse(stored);
                if (parsedData.token) setToken(parsedData.token);

                const profileResponse = await authService.getProfile();
                const profileUser = normalizeUser(profileResponse?.data);
                if (!profileUser) throw new Error('Profil introuvable');

                setUser(profileUser);
                setProfileLoadState('ready');

                // Keep local storage synchronized with latest backend user.
                const updatedStored = parsedData.user
                    ? { ...parsedData, user: profileUser }
                    : { ...parsedData, ...profileUser };
                localStorage.setItem('mbg_user', JSON.stringify(updatedStored));
            } catch (error) {
                console.error('Error loading profile:', error);
                if (error.requiresQuestionnaire) {
                    setToast({
                        show: true,
                        message: 'Vous devez d’abord compléter le questionnaire d’inscription.',
                        type: 'info'
                    });
                    setTimeout(() => navigate('/auth/complete-profile', { replace: true }), 800);
                    return;
                }
                try {
                    await authService.logout();
                } catch {
                    /* ignore API logout failure */
                }
                localStorage.removeItem('mbg_registrations');
                navigate('/auth', { replace: true });
            }
        };

        initializeProfile();

        const regs = localStorage.getItem('mbg_registrations');
        if (regs) setRegistrations(JSON.parse(regs));
    }, [navigate]);

    const loadMyArticles = async () => {
        setArticlesLoading(true);
        try {
            const res = await articlesService.getMyArticles();
            setMyArticles(res.data || []);
        } catch (err) {
            console.error('Error loading articles:', err);
        } finally {
            setArticlesLoading(false);
        }
    };

    const loadMyEvents = async () => {
        setEventsLoading(true);
        try {
            const res = await eventsService.getMyEvents();
            setMyEvents(res.data || []);
        } catch (err) {
            console.error('Error loading events:', err);
        } finally {
            setEventsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'panier') {
            loadMyArticles();
            loadMyEvents();
        }
    }, [activeTab]);

    const PWD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    const handleChangePassword = async (e) => {
        e.preventDefault();
        const errs = {};

        if (!pwdForm.currentPassword) errs.currentPassword = 'Requis.';
        if (!pwdForm.newPassword) errs.newPassword = 'Le nouveau mot de passe est obligatoire.';
        else if (!PWD_RE.test(pwdForm.newPassword)) errs.newPassword = '8 car. min. avec majuscule, minuscule, chiffre et symbole.';
        if (!pwdForm.confirmPassword) errs.confirmPassword = 'Confirmez votre mot de passe.';
        else if (pwdForm.newPassword !== pwdForm.confirmPassword) errs.confirmPassword = 'Les mots de passe ne correspondent pas.';

        if (Object.keys(errs).length) {
            setPwdErrors(errs);
            return;
        }
        setPwdErrors({});
        setPwdLoading(true);

        try {
            await authService.changePassword(pwdForm.currentPassword, pwdForm.newPassword);
            setToast({ show: true, message: 'Mot de passe modifié avec succès !', type: 'success' });
            setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setToast({ show: true, message: error.message || 'Erreur lors du changement de mot de passe', type: 'error' });
        } finally {
            setPwdLoading(false);
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('mbg_user');
        navigate('/');
        window.location.reload();
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            bio: formData.get('bio'),
            city: formData.get('city'),
            profilePicture: user.profilePicture || ''
        };

        try {
            const response = await usersService.updateProfile(payload);
            const updatedUser = normalizeUser(response?.data);

            if (!updatedUser) {
                throw new Error('Réponse invalide après mise à jour');
            }

            const storedData = localStorage.getItem('mbg_user');
            if (storedData) {
                const parsed = JSON.parse(storedData);
                if (parsed.user) {
                    parsed.user = updatedUser;
                    localStorage.setItem('mbg_user', JSON.stringify(parsed));
                } else {
                    localStorage.setItem('mbg_user', JSON.stringify({ ...parsed, ...updatedUser }));
                }
            }

            setUser(updatedUser);
            setToast({ show: true, message: 'Profil mis à jour !', type: 'success' });
        } catch (error) {
            setToast({ show: true, message: error.message || 'Erreur lors de la mise à jour', type: 'error' });
        } finally {
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
        }
    };

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setToast({ show: true, message: 'L\'image est trop volumineuse (max 5Mo)', type: 'error' });
            return;
        }

        setToast({ show: true, message: 'Import en cours…', type: 'info' });

        try {
            const uploadRes = await api.upload(file, 'mahdia_bg/profiles');
            if (!uploadRes?.success || !uploadRes?.data?.url) {
                throw new Error('Upload échoué');
            }

            const newPhotoUrl = uploadRes.data.url;

            await usersService.updateProfile({ profilePicture: newPhotoUrl });

            const updatedUser = { ...user, profilePicture: newPhotoUrl };
            const storedData = localStorage.getItem('mbg_user');
            if (storedData) {
                const parsed = JSON.parse(storedData);
                if (parsed.user) {
                    parsed.user = { ...parsed.user, profilePicture: newPhotoUrl };
                } else {
                    parsed.profilePicture = newPhotoUrl;
                }
                localStorage.setItem('mbg_user', JSON.stringify(parsed));
            }

            setUser(updatedUser);
            if (toastHideTimerRef.current) clearTimeout(toastHideTimerRef.current);
            setToast({ show: true, message: 'Photo importée avec succès', type: 'success' });
            toastHideTimerRef.current = setTimeout(() => {
                setToast({ show: false, message: '', type: 'success' });
                toastHideTimerRef.current = null;
            }, IMPORT_SUCCESS_TOAST_MS);
        } catch (err) {
            setToast({ show: true, message: err.message || 'Erreur lors de l\'import de la photo', type: 'error' });
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await usersService.deleteProfile();
            localStorage.removeItem('mbg_user');
            localStorage.removeItem('mbg_registrations');
            setToast({ show: true, message: 'Compte supprimé avec succès', type: 'success' });
            setShowDeleteModal(false);
            setTimeout(() => {
                navigate('/');
                window.location.reload();
            }, 500);
        } catch (error) {
            setToast({ show: true, message: error.message || 'Erreur lors de la suppression du compte', type: 'error' });
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
        }
    };

    if (profileLoadState !== 'ready' || !user) {
        return (
            <section className="section section--alt">
                <div className="container" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Chargement de votre espace…</p>
                </div>
                <Toast message={toast.message} show={toast.show} type={toast.type} />
            </section>
        );
    }

    const tabs = [
        { id: 'profile', label: 'Profil', icon: User },
        { id: 'panier', label: 'Panier Pro', icon: FileText },
        { id: 'prefs', label: 'Préférences', icon: Settings },
        { id: 'registrations', label: 'Mes inscriptions', icon: Calendar },
        { id: 'security', label: 'Sécurité', icon: Shield },
    ];

    // Determine values for inputs (fallback to parsing name if first/last not set)
    const defaultFirstName = user.firstName || (user.name ? user.name.split(' ')[0] : '');
    const defaultLastName = user.lastName || (user.name ? user.name.split(' ').slice(1).join(' ') : '');
    const normalizedRole = (user.role || '').toLowerCase();
    const canDeleteOwnAccount = normalizedRole === 'user';

    return (
        <section className="section section--alt">
            <div className="container">
                <div className="dashboard-layout">
                    {/* Sidebar */}
                    <aside className="dashboard-sidebar">
                        <div className="user-snippet">
                            <div className="user-avatar-container" style={{ position: 'relative', width: '80px', margin: '0 auto 1rem' }}>
                                <div className="user-avatar" style={{ marginBottom: 0 }}>
                                    {canDisplayProfileImage(user) ? (
                                        <img src={user.profilePicture} alt="Profile" />
                                    ) : (
                                        getUserInitialsFromName(user)
                                    )}
                                </div>
                                <button
                                    className="avatar-edit-btn"
                                    onClick={handlePhotoClick}
                                    style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        background: 'var(--color-primary)',
                                        color: 'white',
                                        border: '2px solid var(--bg-surface)',
                                        borderRadius: '50%',
                                        width: '28px',
                                        height: '28px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}
                                    title="Modifier la photo"
                                >
                                    <Camera size={14} />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handlePhotoChange}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                />
                            </div>
                            <h3 className="user-snippet__name">
                                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name}
                            </h3>
                            <p className="user-snippet__email">{user.email}</p>
                        </div>

                        <nav className="dashboard-nav">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`nav-item ${activeTab === tab.id ? 'nav-item--active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <tab.icon />
                                    <span>{tab.label}</span>
                                </button>
                            ))}

                            <div style={{ height: '1px', background: 'var(--border-color)', margin: '1rem 0' }}></div>

                            <button className="nav-item" onClick={handleLogout}>
                                <LogOut />
                                <span>Déconnexion</span>
                            </button>
                            {canDeleteOwnAccount ? (
                                <button className="nav-item nav-item--danger" onClick={() => setShowDeleteModal(true)}>
                                    <Trash2 />
                                    <span>Supprimer le compte</span>
                                </button>
                            ) : null}
                        </nav>
                    </aside>

                    {/* Content Area */}
                    <main className="dashboard-content">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="content-card">
                                <div className="card-header">
                                    <h2 className="card-title">Informations personnelles</h2>
                                </div>
                                <form onSubmit={handleSaveProfile}>
                                    <div className="grid grid--2" style={{ gap: '2rem', marginBottom: '2rem' }}>
                                        <div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                <div className="form-group">
                                                    <label className="form-label">Prénom</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        name="firstName"
                                                        defaultValue={defaultFirstName}
                                                        placeholder="Votre prénom"
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Nom</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        name="lastName"
                                                        defaultValue={defaultLastName}
                                                        placeholder="Votre nom"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Email</label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="email"
                                                        className="form-input"
                                                        name="email"
                                                        value={user.email || ''}
                                                        readOnly
                                                        style={{ paddingLeft: '2.5rem' }}
                                                        disabled
                                                    />
                                                    <Mail style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '18px', color: 'var(--text-muted)' }} />
                                                </div>
                                                <p className="form-help">L'adresse email ne peut pas être modifiée.</p>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Ville</label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        name="city"
                                                        defaultValue={user.city || ''}
                                                        placeholder="Votre ville"
                                                        style={{ paddingLeft: '2.5rem' }}
                                                    />
                                                    <MapPin style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '18px', color: 'var(--text-muted)' }} />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="form-group">
                                                <label className="form-label">Bio (À propos de vous)</label>
                                                <textarea
                                                    className="form-textarea"
                                                    name="bio"
                                                    rows="8"
                                                    defaultValue={user.bio || ''}
                                                    placeholder="Dites-nous en plus sur vous..."
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button type="submit" className="btn btn--primary btn--lg">
                                            Enregistrer les modifications
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Panier Professionnel Tab */}
                        {activeTab === 'panier' && (
                            <>
                            {/* --- Mes Articles --- */}
                            <div className="content-card">
                                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                    <h2 className="card-title">Mes Articles</h2>
                                    <button className="btn btn--primary btn--sm" onClick={() => navigate('/blog/creer')}>
                                        + Nouvel article
                                    </button>
                                </div>

                                {articlesLoading ? (
                                    <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                                        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                                        <p style={{ color: 'var(--text-secondary)' }}>Chargement de vos articles…</p>
                                    </div>
                                ) : myArticles.length > 0 ? (
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        {myArticles.map((article) => {
                                            const isDraft = article.status === 'draft';
                                            const isPublished = article.status === 'published';
                                            const isArchived = article.status === 'archived';
                                            const wasPublished = !!article.publishedOnce;
                                            const canEdit = isDraft && !wasPublished;

                                            return (
                                                <div
                                                    key={article._id}
                                                    style={{
                                                        display: 'flex',
                                                        gap: '1rem',
                                                        padding: '1rem',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: 'var(--radius-md)',
                                                        background: 'var(--bg-base)',
                                                        alignItems: 'center',
                                                        flexWrap: 'wrap',
                                                    }}
                                                >
                                                    {article.articleData?.featuredImage && (
                                                        <img
                                                            src={article.articleData.featuredImage}
                                                            alt=""
                                                            style={{
                                                                width: '80px',
                                                                height: '60px',
                                                                objectFit: 'cover',
                                                                borderRadius: 'var(--radius-sm)',
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                    )}

                                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                                        <h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>
                                                            {article.title}
                                                        </h4>
                                                        {article.articleData?.summary && (
                                                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                                                {article.articleData.summary.substring(0, 100)}{article.articleData.summary.length > 100 ? '…' : ''}
                                                            </p>
                                                        )}
                                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                                            <span
                                                                className={`badge ${isPublished ? 'badge--green' : canEdit ? 'badge--yellow' : 'badge--gray'}`}
                                                                style={{ fontSize: '0.75rem' }}
                                                            >
                                                                {isPublished && <><CheckCircle size={12} style={{ marginRight: '0.25rem' }} />Publié</>}
                                                                {isDraft && !wasPublished && <><Clock size={12} style={{ marginRight: '0.25rem' }} />Brouillon</>}
                                                                {isDraft && wasPublished && <><CheckCircle size={12} style={{ marginRight: '0.25rem' }} />Déjà publié</>}
                                                                {isArchived && 'Archivé'}
                                                            </span>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                                {new Date(article.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                                        {canEdit && (
                                                            <button
                                                                className="btn btn--outline btn--sm"
                                                                onClick={() => navigate(`/blog/modifier/${article._id}`)}
                                                                title="Modifier cet article"
                                                            >
                                                                <Edit3 size={14} style={{ marginRight: '0.35rem' }} />
                                                                Modifier
                                                            </button>
                                                        )}
                                                        {(isPublished || wasPublished) && article.slug && (
                                                            <Link
                                                                to={`/article/${article.slug}`}
                                                                className="btn btn--outline btn--sm"
                                                                title="Voir l'article"
                                                            >
                                                                <Eye size={14} style={{ marginRight: '0.35rem' }} />
                                                                Voir
                                                            </Link>
                                                        )}
                                                        {(isPublished || wasPublished) && (
                                                            <span
                                                                style={{
                                                                    fontSize: '0.75rem',
                                                                    color: 'var(--text-muted)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    fontStyle: 'italic',
                                                                }}
                                                            >
                                                                Non modifiable
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
                                        <FileText style={{ width: '48px', height: '48px', marginBottom: '1rem', opacity: '0.5' }} />
                                        <p>Vous n&apos;avez pas encore d&apos;article.</p>
                                        <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                                            Créez votre premier article — il restera modifiable tant qu&apos;un administrateur ne l&apos;a pas publié.
                                        </p>
                                        <button className="btn btn--primary btn--sm" onClick={() => navigate('/blog/creer')}>
                                            Créer un article
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* --- Mes Événements --- */}
                            <div className="content-card" style={{ marginTop: '1.5rem' }}>
                                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                    <h2 className="card-title">Mes Événements</h2>
                                    <button className="btn btn--primary btn--sm" onClick={() => navigate('/evenements/creer')}>
                                        + Nouvel événement
                                    </button>
                                </div>

                                {eventsLoading ? (
                                    <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                                        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                                        <p style={{ color: 'var(--text-secondary)' }}>Chargement de vos événements…</p>
                                    </div>
                                ) : myEvents.length > 0 ? (
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        {myEvents.map((evt) => {
                                            const isDraft = evt.status === 'draft';
                                            const isPublished = evt.status === 'published';
                                            const isArchived = evt.status === 'archived';
                                            const wasPublished = !!evt.publishedOnce;
                                            const canEdit = isDraft && !wasPublished;
                                            const evImg = evt.eventData?.eventImage;
                                            const startD = evt.eventData?.startDate
                                                ? new Date(evt.eventData.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                : '';

                                            return (
                                                <div
                                                    key={evt._id}
                                                    style={{
                                                        display: 'flex',
                                                        gap: '1rem',
                                                        padding: '1rem',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: 'var(--radius-md)',
                                                        background: 'var(--bg-base)',
                                                        alignItems: 'center',
                                                        flexWrap: 'wrap',
                                                    }}
                                                >
                                                    {evImg ? (
                                                        <img
                                                            src={evImg}
                                                            alt=""
                                                            style={{
                                                                width: '80px',
                                                                height: '60px',
                                                                objectFit: 'cover',
                                                                borderRadius: 'var(--radius-sm)',
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                    ) : (
                                                        <div style={{
                                                            width: '80px',
                                                            height: '60px',
                                                            borderRadius: 'var(--radius-sm)',
                                                            background: 'var(--bg-surface)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0,
                                                        }}>
                                                            <CalendarPlus size={24} style={{ color: 'var(--text-muted)' }} />
                                                        </div>
                                                    )}

                                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                                        <h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>
                                                            {evt.title}
                                                        </h4>
                                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                            {startD && <span>{startD}</span>}
                                                            {evt.eventData?.location && <span>• {evt.eventData.location}</span>}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                                            <span
                                                                className={`badge ${isPublished ? 'badge--green' : canEdit ? 'badge--yellow' : 'badge--gray'}`}
                                                                style={{ fontSize: '0.75rem' }}
                                                            >
                                                                {isPublished && <><CheckCircle size={12} style={{ marginRight: '0.25rem' }} />Publié</>}
                                                                {isDraft && !wasPublished && <><Clock size={12} style={{ marginRight: '0.25rem' }} />Brouillon</>}
                                                                {isDraft && wasPublished && <><CheckCircle size={12} style={{ marginRight: '0.25rem' }} />Déjà publié</>}
                                                                {isArchived && 'Archivé'}
                                                            </span>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                                {new Date(evt.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                                        {canEdit && (
                                                            <button
                                                                type="button"
                                                                className="btn btn--outline btn--sm"
                                                                onClick={() => navigate(`/evenements/modifier/${evt._id}`)}
                                                                title="Modifier cet événement"
                                                            >
                                                                <Edit3 size={14} style={{ marginRight: '0.35rem' }} />
                                                                Modifier
                                                            </button>
                                                        )}
                                                        {(isPublished || wasPublished) && (
                                                            <Link
                                                                to={`/evenement/${evt.eventNumber != null ? evt.eventNumber : (evt._id || evt.slug)}`}
                                                                className="btn btn--outline btn--sm"
                                                                title="Voir l'événement"
                                                            >
                                                                <Eye size={14} style={{ marginRight: '0.35rem' }} />
                                                                Voir
                                                            </Link>
                                                        )}
                                                        {(isPublished || wasPublished) && (
                                                            <span
                                                                style={{
                                                                    fontSize: '0.75rem',
                                                                    color: 'var(--text-muted)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    fontStyle: 'italic',
                                                                }}
                                                            >
                                                                Non modifiable
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
                                        <Calendar style={{ width: '48px', height: '48px', marginBottom: '1rem', opacity: '0.5' }} />
                                        <p>Vous n&apos;avez pas encore d&apos;événement.</p>
                                        <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                                            Proposez un événement — il restera modifiable en brouillon tant qu&apos;un administrateur ne l&apos;a pas publié.
                                        </p>
                                        <button className="btn btn--primary btn--sm" onClick={() => navigate('/evenements/creer')}>
                                            Créer un événement
                                        </button>
                                    </div>
                                )}
                            </div>
                            </>
                        )}

                        {/* Preferences Tab */}
                        {activeTab === 'prefs' && (
                            <div className="content-card">
                                <div className="card-header">
                                    <h2 className="card-title">Préférences de notification</h2>
                                </div>
                                <div style={{ maxWidth: '600px' }}>
                                    <label className="form-checkbox" style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                        <input type="checkbox" defaultChecked />
                                        <div>
                                            <span style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Newsletter</span>
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Recevez nos dernières actualités et mises à jour.</span>
                                        </div>
                                    </label>
                                    <label className="form-checkbox" style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                        <input type="checkbox" defaultChecked />
                                        <div>
                                            <span style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Événements</span>
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Soyez notifié des nouveaux événements à venir.</span>
                                        </div>
                                    </label>
                                    <label className="form-checkbox" style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                        <input type="checkbox" />
                                        <div>
                                            <span style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Articles de blog</span>
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Recevez une alerte lorsqu'un nouvel article est publié.</span>
                                        </div>
                                    </label>
                                    <button className="btn btn--primary">Sauvegarder mes préférences</button>
                                </div>
                            </div>
                        )}

                        {/* Registrations Tab */}
                        {activeTab === 'registrations' && (
                            <div className="content-card">
                                <div className="card-header">
                                    <h2 className="card-title">Mes inscriptions aux événements</h2>
                                </div>
                                {registrations.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Événement</th>
                                                    <th>Date d'inscription</th>
                                                    <th>Statut</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {registrations.map((reg, i) => (
                                                    <tr key={i}>
                                                        <td>
                                                            <div style={{ fontWeight: '500' }}>{reg.eventTitle}</div>
                                                        </td>
                                                        <td>{new Date(reg.registeredAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                                        <td>
                                                            <span className="badge badge--green">Confirmé</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
                                        <Calendar style={{ width: '48px', height: '48px', marginBottom: '1rem', opacity: '0.5' }} />
                                        <p>Vous n'êtes inscrit à aucun événement pour le moment.</p>
                                        <button className="btn btn--outline btn--sm" style={{ marginTop: '1rem' }} onClick={() => navigate('/evenements')}>
                                            Voir l'agenda
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="content-card">
                                <div className="card-header">
                                    <h2 className="card-title">Sécurité et Connexion</h2>
                                </div>

                                <div className="info-grid">
                                    <div className="info-item">
                                        <div className="info-label">Méthode de connexion</div>
                                        <div className="info-value" style={{ textTransform: 'capitalize' }}>
                                            {user.authProvider || 'Email/Mot de passe'}
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <div className="info-label">Dernière connexion</div>
                                        <div className="info-value">Aujourd'hui</div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Authentification à deux facteurs (2FA)</h3>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                                Ajoutez une couche de sécurité supplémentaire à votre compte.
                                            </p>
                                            {user.twoFactorEnabled ? (
                                                <div className="security-status">
                                                    <Shield size={18} />
                                                    Authentification à deux facteurs activée
                                                </div>
                                            ) : (
                                                <div className="security-status security-status--warning">
                                                    <Shield size={18} />
                                                    Authentification à deux facteurs désactivée
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            className="btn btn--primary"
                                            onClick={() => navigate('/compte/2fa')}
                                        >
                                            {user.twoFactorEnabled ? 'Gérer la 2FA' : 'Activer la 2FA'}
                                        </button>
                                    </div>
                                </div>

                                {(!user.authProvider || user.authProvider === 'local') && (
                                    <div style={{ marginTop: '2rem' }}>
                                        <h3 style={{ marginBottom: '1.5rem' }}>Changer de mot de passe</h3>
                                        <form onSubmit={handleChangePassword}>
                                            <div className="form-group">
                                                <label className="form-label">Mot de passe actuel *</label>
                                                <input
                                                    type="password"
                                                    className="form-input"
                                                    name="currentPassword"
                                                    required
                                                    value={pwdForm.currentPassword}
                                                    onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid--2" style={{ gap: '1.5rem' }}>
                                                <div className="form-group">
                                                    <label className="form-label">Nouveau mot de passe *</label>
                                                    <input
                                                        type="password"
                                                        className="form-input"
                                                        name="newPassword"
                                                        required
                                                        value={pwdForm.newPassword}
                                                        onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                                                        style={pwdErrors.newPassword ? { borderColor: 'var(--color-error, #e53e3e)' } : {}}
                                                    />
                                                    {pwdErrors.newPassword && (
                                                        <p style={{ color: 'var(--color-error, #e53e3e)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                                            {pwdErrors.newPassword}
                                                        </p>
                                                    )}
                                                    {pwdForm.newPassword && !pwdErrors.newPassword && (
                                                        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                            {[
                                                                { test: /.{8,}/, label: '8 caractères minimum' },
                                                                { test: /[A-Z]/, label: 'Une majuscule' },
                                                                { test: /[a-z]/, label: 'Une minuscule' },
                                                                { test: /\d/, label: 'Un chiffre' },
                                                                { test: /[\W_]/, label: 'Un symbole' },
                                                            ].map(({ test, label }) => (
                                                                <span key={label} style={{ fontSize: '0.75rem', color: test.test(pwdForm.newPassword) ? 'var(--color-success, #38a169)' : 'var(--text-muted)' }}>
                                                                    {test.test(pwdForm.newPassword) ? '✓' : '○'} {label}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Confirmer le mot de passe *</label>
                                                    <input
                                                        type="password"
                                                        className="form-input"
                                                        name="confirmPassword"
                                                        required
                                                        value={pwdForm.confirmPassword}
                                                        onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                                                        style={pwdErrors.confirmPassword ? { borderColor: 'var(--color-error, #e53e3e)' } : {}}
                                                    />
                                                    {pwdErrors.confirmPassword && (
                                                        <p style={{ color: 'var(--color-error, #e53e3e)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                                            {pwdErrors.confirmPassword}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                                                <button type="submit" className="btn btn--primary" disabled={pwdLoading}>
                                                    {pwdLoading ? 'Modification…' : 'Mettre à jour le mot de passe'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            <Toast message={toast.message} show={toast.show} type={toast.type} />
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Confirmer la suppression"
            >
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <p>Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible.</p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button className="btn btn--ghost" onClick={() => setShowDeleteModal(false)}>Annuler</button>
                        <button className="btn btn--primary" onClick={handleDeleteAccount}>Confirmer</button>
                    </div>
                </div>
            </Modal>
        </section>
    );
}
