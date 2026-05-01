import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { partners as staticPartners } from '../data/mockData';
import { PostCard, EventCard, Toast } from '../components/UI';
import { useTheme } from '../context/ThemeContext';
import { postsService, newsletterService, partnerService } from '../services';
import logoDark from '../assets/logo.png';
import logoLight from '../assets/logo_blanc.png';
import logo_oit from '../assets/logo_oit.png';

export default function Home() {
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
    const countersRef = useRef(null);
    const [countersAnimated, setCountersAnimated] = useState(false);
    const { resolvedTheme } = useTheme();
    const [featuredPosts, setFeaturedPosts] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [partners, setPartners] = useState(staticPartners);

    useEffect(() => {
        const loadHome = async () => {
            try {
                const [artRes, evtRes, partRes] = await Promise.all([
                    postsService.getAll({ type: 'article', status: 'published', limit: 4 }),
                    postsService.getAll({ type: 'event', status: 'published', limit: 3 }),
                    partnerService.getAll().catch(() => null),
                ]);
                if (artRes.success) setFeaturedPosts(artRes.data || []);
                if (evtRes.success) setUpcomingEvents(evtRes.data || []);
                if (partRes?.success && partRes.data?.length) {
                    const apiPartners = partRes.data.filter((p) => p.logo);
                    if (apiPartners.length) setPartners(
                        apiPartners
                            .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
                            .map((p) => ({ id: p._id, name: p.shortName || p.name, logo: p.logo, website: p.website || '' }))
                    );
                }
            } catch (e) {
                console.error('Error loading home data:', e);
            }
        };
        loadHome();
    }, []);

    // Counter animation
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !countersAnimated) {
                    setCountersAnimated(true);
                    animateCounters();
                }
            },
            { threshold: 0.5 }
        );

        if (countersRef.current) {
            observer.observe(countersRef.current);
        }

        return () => observer.disconnect();
    }, [countersAnimated]);

    const animateCounters = () => {
        const counters = document.querySelectorAll('.counter__number');
        counters.forEach(counter => {
            const target = +counter.dataset.target;
            let current = 0;
            const increment = target / 50;
            const timer = setInterval(() => {
                current += increment;
                counter.textContent = Math.floor(current);
                if (current >= target) {
                    counter.textContent = target;
                    clearInterval(timer);
                }
            }, 30);
        });
    };

    const handleNewsletterSubmit = async (e) => {
        e.preventDefault();
        const email = newsletterEmail.trim();
        if (!email) return;
        setNewsletterSubmitting(true);
        try {
            const res = await newsletterService.subscribe(email, 'home');
            if (res.success) {
                const msg =
                    res.alreadySubscribed === true
                        ? (res.message || 'Cette adresse est déjà inscrite.')
                        : 'Merci pour votre inscription !';
                setToast({ show: true, message: msg, type: 'success' });
                setNewsletterEmail('');
            }
        } catch (err) {
            setToast({
                show: true,
                message: err.message || 'Inscription impossible. Réessayez plus tard.',
                type: 'error',
            });
        } finally {
            setNewsletterSubmitting(false);
            setTimeout(() => setToast((t) => ({ ...t, show: false })), 4000);
        }
    };

    return (
        
        <>
            {/* Hero Section */}
            <section className="hero">
                <div className="hero__container container">
                    <div className="hero__content">
                        <span className="hero__badge"> <img src={logo_oit} alt="" width="50" height="50" /> Initiative OIT Mahdia</span>
                        <h1 className="hero__title">
                            Mahdia <span>Blue</span> & <span>Green</span>
                        </h1>
                        <p className="hero__subtitle">
                            Accompagner la transition vers une économie durable à travers l'économie bleue, verte et circulaire.
                        </p>
                        <div className="hero__buttons">
                            <Link to="/contact" className="btn btn--secondary btn--lg">Rejoindre le mouvement</Link>
                            <Link to="/evenements" className="btn btn--outline btn--lg">
                                Découvrir les événements
                            </Link>
                        </div>
                    </div>
                    <div className="hero__visual">
                        <img src={resolvedTheme === 'light' ? logoDark : logoLight} alt="Mahdia Blue & Green" className="hero__image" />
                    </div>
                </div>
            </section>

            {/* Latest Articles */}
            <section className="section">
                <div className="container">
                    <div className="section__header">
                        <h2 className="section__title">Derniers Articles</h2>
                        <p className="section__subtitle">Restez informé sur l'économie durable à Mahdia</p>
                    </div>
                    <div className="grid grid--4">
                        {featuredPosts.map(post => (
                            <PostCard key={post._id || post.id} post={post} />
                        ))}
                    </div>
                    <div className="text-center" style={{ marginTop: '3rem' }}>
                        <Link to="/blog" className="btn btn--outline">Voir tous les articles</Link>
                    </div>
                </div>
            </section>

            {/* Upcoming Events */}
            <section className="section section--alt">
                <div className="container">
                    <div className="section__header">
                        <h2 className="section__title">Événements à venir</h2>
                        <p className="section__subtitle">Participez à nos ateliers et formations</p>
                    </div>
                    <div className="grid grid--3">
                        {upcomingEvents.map(event => (
                            <EventCard key={event._id || event.id} event={event} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Counters */}
            <section className="section section--dark" ref={countersRef}>
                <div className="container">
                    <div className="counters">
                        <div className="counter">
                            <div className="counter__number" data-target="150">0</div>
                            <div className="counter__label">Entrepreneurs accompagnés</div>
                        </div>
                        <div className="counter">
                            <div className="counter__number" data-target="45">0</div>
                            <div className="counter__label">Ateliers organisés</div>
                        </div>
                        <div className="counter">
                            <div className="counter__number" data-target="240">0</div>
                            <div className="counter__label">Ressources partagées</div>
                        </div>
                        <div className="counter">
                            <div className="counter__number" data-target="1200">0</div>
                            <div className="counter__label">Membres de la communauté</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Partners */}
            <section className="section section--alt">
                <div className="container">
                    <div className="section__header">
                        <h2 className="section__title">Nos Partenaires</h2>
                    </div>
                    <div className="partners">
                        {partners.map(p => {
                            const Wrapper = p.website ? 'a' : 'div';
                            const wrapperProps = p.website
                                ? { href: p.website, target: '_blank', rel: 'noopener noreferrer' }
                                : {};
                            return (
                                <Wrapper key={p.id} className="partner-logo" title={p.name} {...wrapperProps}>
                                    <img 
                                        src={p.logo} 
                                        alt={p.name} 
                                        className="partners__logo"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                    <span className="partner-fallback" style={{ display: 'none' }}>
                                        {p.name}
                                    </span>
                                </Wrapper>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Newsletter */}
            <section className="section">
                <div className="container">
                    <div className="section__header">
                        <h2 className="section__title">Newsletter</h2>
                        <p className="section__subtitle">Recevez nos actualités et événements</p>
                    </div>
                    <div className="newsletter">
                        <form className="newsletter__form" onSubmit={handleNewsletterSubmit}>
                            <div className="newsletter__form-row">
                                <input
                                    type="email"
                                    className="newsletter__input"
                                    placeholder="Votre email"
                                    required
                                    aria-label="Adresse email"
                                    value={newsletterEmail}
                                    onChange={(e) => setNewsletterEmail(e.target.value)}
                                    disabled={newsletterSubmitting}
                                />
                                <button type="submit" className="btn btn--primary" disabled={newsletterSubmitting}>
                                    {newsletterSubmitting ? 'Envoi…' : "S'abonner"}
                                </button>
                            </div>
                            <label className="newsletter__consent form-checkbox">
                                <input type="checkbox" name="newsletter-consent" required aria-required="true" />
                                <span>J'accepte de recevoir des emails de Mahdia Blue & Green</span>
                            </label>
                        </form>
                    </div>
                </div>
            </section>

            <Toast message={toast.message} show={toast.show} type={toast.type} />
        </>
    );
}
