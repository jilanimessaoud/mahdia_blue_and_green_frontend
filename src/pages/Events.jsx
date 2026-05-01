import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle, Clock } from 'lucide-react';
import { EventCard, Modal } from '../components/UI';
import { postsService } from '../services';

function localDateKey(d) {
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return null;
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, '0');
    const day = String(x.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function eventUrlId(event) {
    return event.eventNumber != null ? String(event.eventNumber) : String(event._id || event.id || event.slug || '');
}

export default function Events() {
    const [currentMonth, setCurrentMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [events, setEvents] = useState([]);
    const [upcomingPage, setUpcomingPage] = useState(1);
    const [pastPage, setPastPage] = useState(1);
    const perPage = 6;
    const [user, setUser] = useState(null);
    const [agendaDayKey, setAgendaDayKey] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const stored = localStorage.getItem('mbg_user');
        if (stored) {
            try {
                const parsedData = JSON.parse(stored);
                setUser(parsedData.user || parsedData);
            } catch {
                setUser(null);
            }
        } else {
            setUser(null);
        }
    }, [location.pathname]);

    useEffect(() => {
        const loadAll = async () => {
            try {
                const merged = [];
                let page = 1;
                const limit = 100;
                while (true) {
                    const res = await postsService.getAll({ type: 'event', status: 'published', limit, page });
                    if (!res.success) break;
                    const chunk = res.data || [];
                    merged.push(...chunk);
                    if (chunk.length < limit) break;
                    page += 1;
                    if (page > 20) break;
                }
                merged.sort((a, b) => {
                    const ta = new Date(a?.eventData?.startDate || 0).getTime();
                    const tb = new Date(b?.eventData?.startDate || 0).getTime();
                    return ta - tb;
                });
                setEvents(merged);
            } catch (e) {
                console.error('Error loading events:', e);
            }
        };
        loadAll();
    }, []);

    const eventsByDay = useMemo(() => {
        const map = new Map();
        for (const e of events) {
            const start = e?.eventData?.startDate;
            if (!start) continue;
            const key = localDateKey(start);
            if (!key) continue;
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(e);
        }
        for (const [, list] of map) {
            list.sort((a, b) => new Date(a.eventData.startDate) - new Date(b.eventData.startDate));
        }
        return map;
    }, [events]);

    const getCalendarDays = useCallback(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDow = new Date(year, month, 1).getDay();
        const firstMondayBased = firstDow === 0 ? 6 : firstDow - 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];

        for (let i = 0; i < firstMondayBased; i++) {
            days.push({ day: null, isOther: true, dateKey: null, dayEvents: [] });
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const dateKey = localDateKey(date);
            const dayEvents = dateKey ? (eventsByDay.get(dateKey) || []) : [];
            days.push({
                day: d,
                isOther: false,
                dateKey,
                date,
                isToday: localDateKey(new Date()) === dateKey,
                dayEvents,
            });
        }

        while (days.length % 7 !== 0) {
            days.push({ day: null, isOther: true, dateKey: null, dayEvents: [] });
        }

        return days;
    }, [currentMonth, eventsByDay]);

    const goPrevMonth = () => {
        setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    };

    const goNextMonth = () => {
        setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
    };

    const agendaModalEvents = agendaDayKey ? (eventsByDay.get(agendaDayKey) || []) : [];
    const agendaModalTitle = agendaDayKey
        ? `Événements du ${new Date(agendaDayKey + 'T12:00:00').toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })}`
        : '';

    const upcomingEvents = events.filter((e) => {
        const startDate = e.eventData?.startDate;
        return startDate && new Date(startDate) > new Date();
    });

    const pastEvents = events.filter((e) => {
        const startDate = e.eventData?.startDate;
        return startDate && new Date(startDate) <= new Date();
    });
    const upcomingTotalPages = Math.max(1, Math.ceil(upcomingEvents.length / perPage));
    const pastTotalPages = Math.max(1, Math.ceil(pastEvents.length / perPage));
    const paginatedUpcoming = upcomingEvents.slice((upcomingPage - 1) * perPage, upcomingPage * perPage);
    const paginatedPast = pastEvents.slice((pastPage - 1) * perPage, pastPage * perPage);

    return (
        <section className="section">
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ marginBottom: '0.35rem' }}>Événements</h1>
                    </div>
                    <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => {
                            if (user) {
                                navigate('/evenements/creer');
                            } else {
                                navigate('/auth');
                            }
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <PlusCircle size={20} />
                        Créer un événement
                    </button>
                </div>

                <div className="events-layout">
                    <div className="calendar calendar--agenda">
                        <div className="calendar__header">
                            <button type="button" className="calendar__nav-btn" onClick={goPrevMonth} aria-label="Mois précédent">
                                ←
                            </button>
                            <span className="calendar__title">
                                {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                            </span>
                            <button type="button" className="calendar__nav-btn" onClick={goNextMonth} aria-label="Mois suivant">
                                →
                            </button>
                        </div>
                        <div className="calendar__weekdays">
                            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
                                <div key={d} className="calendar__weekday">
                                    {d}
                                </div>
                            ))}
                        </div>
                        <div className="calendar__days calendar__days--agenda">
                            {getCalendarDays().map((dayInfo, i) => {
                                if (dayInfo.isOther) {
                                    return <div key={`o-${i}`} className="calendar__day calendar__day--other calendar__day--agenda-empty" aria-hidden="true" />;
                                }
                                const { day, dateKey, isToday, dayEvents } = dayInfo;
                                const has = dayEvents.length > 0;
                                return (
                                    <div
                                        key={dateKey}
                                        className={`calendar__day calendar__day--agenda ${has ? 'calendar__day--has-event' : ''} ${isToday ? 'calendar__day--today' : ''}`}
                                    >
                                        <button
                                            type="button"
                                            className="calendar__day-num"
                                            onClick={() => setAgendaDayKey(dateKey)}
                                            aria-label={`Voir l'agenda du ${day}`}
                                        >
                                            {day}
                                        </button>
                                        {has ? (
                                            <div className="calendar__day-chips">
                                                {dayEvents.slice(0, 3).map((ev) => {
                                                    const st = new Date(ev.eventData.startDate);
                                                    return (
                                                        <Link
                                                            key={ev._id || ev.id}
                                                            to={`/evenement/${eventUrlId(ev)}`}
                                                            className="calendar-event-chip"
                                                            title={ev.title}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <span className="calendar-event-chip__time">
                                                                {st.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            <span className="calendar-event-chip__title">{ev.title}</span>
                                                        </Link>
                                                    );
                                                })}
                                                {dayEvents.length > 3 && (
                                                    <button
                                                        type="button"
                                                        className="calendar-event-chip calendar-event-chip--more"
                                                        onClick={() => setAgendaDayKey(dateKey)}
                                                    >
                                                        +{dayEvents.length - 3} autre{dayEvents.length - 3 > 1 ? 's' : ''}
                                                    </button>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="events-content">
                        <h2>À venir</h2>
                        {upcomingEvents.length > 0 ? (
                            <div className="events-grid" style={{ marginBottom: '3rem', marginTop: '1rem' }}>
                                {paginatedUpcoming.map((event) => (
                                    <EventCard key={event._id || event.id} event={event} />
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', marginBottom: '3rem' }}>
                                Aucun événement à venir pour le moment.
                            </p>
                        )}
                        {upcomingEvents.length > 0 && upcomingTotalPages > 1 && (
                            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                                <button className="btn btn--outline btn--sm" disabled={upcomingPage <= 1} onClick={() => setUpcomingPage((p) => Math.max(1, p - 1))}>
                                    Précédent
                                </button>
                                <div style={{ alignSelf: 'center' }}>
                                    Page {upcomingPage} / {upcomingTotalPages}
                                </div>
                                <button className="btn btn--outline btn--sm" disabled={upcomingPage >= upcomingTotalPages} onClick={() => setUpcomingPage((p) => Math.min(upcomingTotalPages, p + 1))}>
                                    Suivant
                                </button>
                            </div>
                        )}

                        {pastEvents.length > 0 && (
                            <>
                                <h2>Archives</h2>
                                <div className="events-grid" style={{ marginTop: '1rem' }}>
                                    {paginatedPast.map((event) => (
                                        <EventCard key={event._id || event.id} event={event} />
                                    ))}
                                </div>
                                {pastTotalPages > 1 && (
                                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                                        <button className="btn btn--outline btn--sm" disabled={pastPage <= 1} onClick={() => setPastPage((p) => Math.max(1, p - 1))}>
                                            Précédent
                                        </button>
                                        <div style={{ alignSelf: 'center' }}>
                                            Page {pastPage} / {pastTotalPages}
                                        </div>
                                        <button className="btn btn--outline btn--sm" disabled={pastPage >= pastTotalPages} onClick={() => setPastPage((p) => Math.min(pastTotalPages, p + 1))}>
                                            Suivant
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <Modal isOpen={!!agendaDayKey} onClose={() => setAgendaDayKey(null)} title={agendaModalTitle} contentClassName="modal__content--lg">
                {agendaDayKey && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {agendaModalEvents.length === 0 ? (
                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Aucun événement ce jour-là.</p>
                        ) : (
                            agendaModalEvents.map((ev) => {
                                const st = new Date(ev.eventData?.startDate);
                                const en = ev.eventData?.endDate ? new Date(ev.eventData.endDate) : null;
                                const loc = ev.eventData?.location;
                                return (
                                    <Link
                                        key={ev._id || ev.id}
                                        to={`/evenement/${eventUrlId(ev)}`}
                                        style={{
                                            display: 'block',
                                            padding: '1rem 1.1rem',
                                            borderRadius: '10px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-base)',
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            transition: 'background 0.15s, border-color 0.15s',
                                        }}
                                        className="events-agenda-modal-row"
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                            <Clock size={18} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '0.1rem' }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                                    {st.toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    {en && en.getTime() !== st.getTime()
                                                        ? ` — ${en.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                                                        : ''}
                                                </div>
                                                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{ev.title}</div>
                                                {loc ? (
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>{loc}</div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                )}
            </Modal>
        </section>
    );
}
