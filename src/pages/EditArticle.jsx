import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { authService, api } from '../services';
import { articlesService } from '../services/articles.service';
import { Toast } from '../components/UI';
import BlogArticleForm from '../components/BlogArticleForm';

export default function EditArticle() {
    const { id } = useParams();
    const [title, setTitle] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('');
    const [level, setLevel] = useState('');
    const [categories, setCategories] = useState([]);
    const [levels, setLevels] = useState([]);
    const [imageUrl, setImageUrl] = useState('');
    const [imageUploading, setImageUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [article, setArticle] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const toastHideTimerRef = useRef(null);
    const IMPORT_SUCCESS_TOAST_MS = 10_000;
    const navigate = useNavigate();

    useEffect(() => {
        if (!authService.isAuthenticated()) {
            navigate('/auth');
            return;
        }

        const loadData = async () => {
            try {
                const [articleRes, catRes, lvlRes] = await Promise.all([
                    articlesService.getBySlug(id),
                    api.get('/categories'),
                    api.get('/levels'),
                ]);

                if (catRes?.success) setCategories(catRes.data || []);
                if (lvlRes?.success) setLevels(lvlRes.data || []);

                const a = articleRes?.data;
                if (!a) {
                    setToast({ show: true, message: 'Article introuvable', type: 'error' });
                    setTimeout(() => navigate('/compte#panier'), 1500);
                    return;
                }

                if (a.status === 'published' || a.publishedOnce) {
                    setToast({ show: true, message: 'Cet article a été publié par un administrateur et ne peut plus être modifié.', type: 'error' });
                    setTimeout(() => navigate('/compte#panier'), 2000);
                    return;
                }

                setArticle(a);
                setTitle(a.title || '');
                setExcerpt(a.articleData?.summary || '');
                setContent(a.articleData?.content || a.body || '');
                setCategory(a.category?._id || a.category || '');
                setLevel(a.level?._id || a.level || '');
                setImageUrl(a.articleData?.featuredImage || '');
            } catch (err) {
                setToast({ show: true, message: err.message || 'Erreur de chargement', type: 'error' });
                setTimeout(() => navigate('/compte#panier'), 1500);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, navigate]);

    const handleImageFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setToast({ show: true, message: "L'image est trop volumineuse (max 5Mo)", type: 'error' });
            e.target.value = '';
            return;
        }
        setImageUploading(true);
        try {
            const res = await api.upload(file, 'mahdia_bg/articles');
            if (res.success) {
                setImageUrl(res.data.url);
                if (toastHideTimerRef.current) clearTimeout(toastHideTimerRef.current);
                setToast({ show: true, message: 'Image importée avec succès', type: 'success' });
                toastHideTimerRef.current = setTimeout(() => {
                    setToast({ show: false, message: '', type: 'success' });
                    toastHideTimerRef.current = null;
                }, IMPORT_SUCCESS_TOAST_MS);
            }
        } catch (err) {
            const msg = err.status === 403
                ? err.message || 'Cette image contient du contenu inapproprié.'
                : err.message || 'Erreur upload image';
            setToast({ show: true, message: msg, type: 'error' });
            setImageUrl('');
        } finally {
            setImageUploading(false);
            e.target.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const normalizedContent = (content || '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/gi, ' ')
            .replace(/&[a-z]+;/gi, ' ')
            .trim();

        if (!title.trim() || !excerpt.trim() || !normalizedContent || !category || !level || !imageUrl) {
            const missing = [];
            if (!title.trim()) missing.push('Titre');
            if (!excerpt.trim()) missing.push('Résumé');
            if (!normalizedContent) missing.push('Contenu');
            if (!category) missing.push('Catégorie');
            if (!level) missing.push('Niveau');
            if (!imageUrl) missing.push('Image de couverture');
            setToast({ show: true, message: `Champs obligatoires manquants : ${missing.join(', ')}`, type: 'error' });
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                title,
                body: content,
                content,
                summary: excerpt,
                category,
                level: level || undefined,
                featuredImage: imageUrl || '',
            };

            await articlesService.update(article._id, payload);

            setToast({ show: true, message: 'Article mis à jour avec succès !', type: 'success' });
            setTimeout(() => navigate('/compte#panier'), 1500);
        } catch (error) {
            const msg = error.status === 403
                ? error.message || 'Cet article ne peut plus être modifié.'
                : error.message || 'Erreur lors de la mise à jour';
            setToast({ show: true, message: msg, type: 'error' });
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <section className="section section--alt">
                <div className="container" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Chargement de l'article…</p>
                </div>
            </section>
        );
    }

    return (
        <section className="section section--alt">
            <div className="container" style={{ maxWidth: '800px' }}>
                <button
                    type="button"
                    onClick={() => navigate('/compte#panier')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        border: 'none',
                        background: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                    }}
                >
                    <ArrowLeft size={16} />
                    Retour au panier
                </button>

                <div className="content-card">
                    <div
                        className="card-header"
                        style={{
                            justifyContent: 'flex-start',
                            flexWrap: 'wrap',
                            alignItems: 'baseline',
                            gap: '0.5rem 2rem',
                        }}
                    >
                        <h1 className="card-title" style={{ margin: 0 }}>
                            Modifier l'article
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem', lineHeight: 1.4 }}>
                            Modifiable tant que l'administrateur ne l'a pas publié
                        </p>
                    </div>

                    <BlogArticleForm
                        title={title}
                        excerpt={excerpt}
                        content={content}
                        category={category}
                        level={level}
                        imageUrl={imageUrl}
                        categories={categories}
                        levels={levels}
                        onTitleChange={setTitle}
                        onExcerptChange={setExcerpt}
                        onContentChange={setContent}
                        onCategoryChange={setCategory}
                        onLevelChange={setLevel}
                        onImageUrlChange={setImageUrl}
                        onImageFileChange={handleImageFileChange}
                        uploading={imageUploading}
                        fileInputId="edit-cover-upload"
                        onSubmit={handleSubmit}
                        submitLabel="Enregistrer les modifications"
                        cancelLabel="Annuler"
                        onCancel={() => navigate('/compte#panier')}
                        cancelButtonClassName="btn btn--outline"
                        disabledSubmit={isSubmitting}
                    />
                </div>
            </div>

            <Toast message={toast.message} show={toast.show} type={toast.type} />
        </section>
    );
}
