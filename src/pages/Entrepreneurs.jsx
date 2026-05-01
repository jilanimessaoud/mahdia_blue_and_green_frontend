import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { entrepreneurService } from '../services';
import { testimonials } from '../data/mockData';
import profileAvatar from '../assets/profile_avatar.png';

export default function Entrepreneurs() {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await entrepreneurService.getAll();
                if (!cancelled && res?.success) {
                    setList(Array.isArray(res.data) ? res.data : []);
                }
            } catch (e) {
                if (!cancelled) setError(e?.message || 'Impossible de charger les profils.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const sorted = [...list].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
    const legacyEntrepreneurs = testimonials.map((item) => ({
        _id: `legacy-${item.id}`,
        name: item.name,
        role: item.role,
        organization: item.organization,
        quote: item.quote,
        avatar: item.avatar,
        sortOrder: item.id ?? 999,
    }));
    const displayList = sorted.length > 0 ? sorted : legacyEntrepreneurs;

    return (
        <>
            <section className="hero" style={{ minHeight: '40vh' }}>
                <div className="container text-center" style={{ padding: '4rem 0' }}>
                    <h1 style={{ color: 'var(--text-primary)' }}>Entrepreneurs</h1>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '1.5rem auto' }}>
                        Découvrez les success stories de notre communauté d&apos;entrepreneurs engagés dans l&apos;économie durable.
                    </p>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    {loading && (
                        <p className="text-center" style={{ color: 'var(--text-secondary)' }}>
                            Chargement…
                        </p>
                    )}
                    {error && !loading && (
                        <p className="text-center" style={{ color: 'var(--color-danger, #c0392b)' }}>
                            {error} Affichage de la version sauvegardée.
                        </p>
                    )}
                    {!loading && displayList.length === 0 && (
                        <p className="text-center" style={{ color: 'var(--text-secondary)' }}>
                            Aucun profil pour le moment. Revenez bientôt.
                        </p>
                    )}
                    {!loading && displayList.length > 0 && (
                        <div className="grid grid--3">
                            {displayList.map((entrepreneur) => {
                                const imgSrc = entrepreneur.avatar?.trim() ? entrepreneur.avatar : profileAvatar;
                                return (
                                    <article key={entrepreneur._id} className="card">
                                        <div className="card__content text-center">
                                            <img
                                                src={imgSrc}
                                                alt={entrepreneur.name}
                                                style={{
                                                    width: '120px',
                                                    height: '120px',
                                                    borderRadius: '50%',
                                                    margin: '0 auto 1.5rem',
                                                    border: '4px solid var(--color-accent-lime)',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                            <h3 style={{ marginBottom: '0.5rem' }}>{entrepreneur.name}</h3>
                                            {entrepreneur.role && (
                                                <p style={{ color: 'var(--color-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                                                    {entrepreneur.role}
                                                </p>
                                            )}
                                            {entrepreneur.organization && (
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                                                    {entrepreneur.organization}
                                                </p>
                                            )}
                                            {entrepreneur.quote && (
                                                <blockquote
                                                    style={{
                                                        fontStyle: 'italic',
                                                        fontSize: '0.9375rem',
                                                        color: 'var(--text-primary)',
                                                        position: 'relative',
                                                        paddingTop: '1.5rem',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: '50%',
                                                            transform: 'translateX(-50%)',
                                                            fontSize: '2rem',
                                                            color: 'var(--color-accent-lime)',
                                                        }}
                                                    >
                                                        &quot;
                                                    </span>
                                                    {entrepreneur.quote}
                                                </blockquote>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            <section className="section section--alt">
                <div className="container text-center">
                    <h2>Contactez-nous</h2>
                    <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '1rem auto 2rem' }}>
                        Vous avez des questions ou souhaitez en savoir plus ? Notre équipe est à votre disposition.
                    </p>
                    <Link to="/contact" className="btn btn--primary btn--lg">
                        Nous contacter
                    </Link>
                </div>
            </section>
        </>
    );
}
