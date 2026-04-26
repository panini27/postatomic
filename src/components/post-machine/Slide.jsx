import { useBrand } from '../../contexts/BrandContext';

/* ── Helpers ── */
function rgb(h) {
    if (!h || !h.startsWith('#')) return '37,99,235';
    return `${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)}`;
}

const LIGHT = {
    t1: '#14171C', t2: '#5A6070', t3: '#9CA3AF',
    bord: '#E2E6EC',
};

const PHASE_COLORS = {
    'Atenção': '#F87171', 'Attention': '#F87171', 'Problema': '#F87171',
    'Interesse': '#60A5FA', 'Interest': '#60A5FA', 'Agitação': '#FBBF24',
    'Desejo': '#34D399', 'Desire': '#34D399', 'Impacto': '#FBBF24',
    'Solução': '#34D399', 'Solution': '#34D399',
    'Ação': '#60A5FA', 'Action': '#60A5FA', 'CTA': '#60A5FA',
};

function Grid({ w, h, op = 0.055, color = '#2563EB' }) {
    const L = [], s = 108;
    for (let x = s; x < w; x += s) L.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={h} stroke={`rgba(${rgb(color)},${op})`} strokeWidth={1} />);
    for (let y = s; y < h; y += s) L.push(<line key={`h${y}`} x1={0} y1={y} x2={w} y2={y} stroke={`rgba(${rgb(color)},${op})`} strokeWidth={1} />);
    return <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>{L}</svg>;
}

function Orb({ x, y, r, color, o = 0.2 }) {
    return (
        <div style={{
            position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2,
            borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
            background: `radial-gradient(circle,rgba(${rgb(color)},${o}) 0%,transparent 70%)`,
        }} />
    );
}

function GovBadge({ chip, modColor, fs = 20 }) {
    const text = chip || 'GESTÃO MUNICIPAL';
    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: `${Math.round(fs * .38)}px ${Math.round(fs * .88)}px`, borderRadius: 9999,
            background: modColor + '22', border: `1px solid ${modColor}28`,
            fontSize: fs, fontWeight: 800, letterSpacing: '.08em',
            color: modColor, textTransform: 'uppercase',
            whiteSpace: 'nowrap', flexShrink: 0,
        }}>
            <div style={{
                width: Math.round(fs * .38), height: Math.round(fs * .38), borderRadius: '50%',
                background: modColor, boxShadow: `0 0 9px ${modColor}90`, flexShrink: 0,
            }} />
            {text}
        </div>
    );
}

function Sig({ dark = true, fs = 19, name = 'PostAtomic' }) {
    return (
        <span style={{
            fontSize: fs, fontWeight: 800, letterSpacing: '.06em',
            color: dark ? 'rgba(255,255,255,.28)' : 'rgba(0,40,100,.32)',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap', flexShrink: 0,
        }}>{name}</span>
    );
}

/* ═══════════════════════════════════════════════════════════════
   CLASSIC TEMPLATES
═══════════════════════════════════════════════════════════════ */

/* ── TEMPLATE: HERO DARK ── */
function TplHD({ d, w, h, brand }) {
    const colors = brand?.colors || {};
    const modMap = brand?.modMap || {};
    const primary = colors.primary || '#2563EB';
    const bgDark = colors.bgDark || '#03091A';
    const accent = colors.accent || '#60A5FA';
    const mod = modMap[d.accentModule] || modMap.none || { c: accent };
    const modColor = mod.c;
    const sigName = brand?.tenantMeta?.name || 'PostAtomic';
    const p = Math.round(w * .062);
    const hfs = h > 1400 ? Math.round(w * .092) : Math.round(w * .08);
    const sfs = Math.round(w * .036);
    const stFs = Math.round(w * .17);

    return (
        <div style={{
            width: w, height: h, position: 'relative', overflow: 'hidden',
            fontFamily: "'Satoshi',sans-serif",
            background: bgDark,
        }}>
            {/* Rich layered background */}
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 120% 55% at 50% -5%, rgba(${rgb(primary)},.35) 0%, transparent 60%)`, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: h * .45, background: `radial-gradient(ellipse 80% 80% at 20% 120%, rgba(${rgb(modColor)},.18) 0%, transparent 65%)`, pointerEvents: 'none' }} />
            <Grid w={w} h={h} color={accent} op={0.04} />
            {/* Decorative rings */}
            {[.42, .58, .74].map((r, i) => (
                <div key={i} style={{ position: 'absolute', top: -w * r * .4, right: -w * r * .35, width: w * r, height: w * r, borderRadius: '50%', border: `1px solid rgba(255,255,255,${.045 - i * .012})`, pointerEvents: 'none' }} />
            ))}
            {/* Top accent line */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: w * .3, height: 3, background: `linear-gradient(90deg, ${modColor}, transparent)` }} />

            <div style={{ position: 'absolute', inset: 0, zIndex: 10, padding: p, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ flexShrink: 0 }}><GovBadge chip={d.chip} modColor={modColor} fs={20} /></div>
                <div>
                    {d.stat && <div style={{ fontSize: stFs, fontWeight: 900, lineHeight: .88, letterSpacing: '-.06em', marginBottom: Math.round(h * .012), color: '#FFFFFF' }}>{d.stat}</div>}
                    {d.statLabel && <div style={{ fontSize: Math.round(sfs * .78), color: modColor, fontWeight: 700, marginBottom: Math.round(h * .018), lineHeight: 1.3, letterSpacing: '.02em', textTransform: 'uppercase' }}>{d.statLabel}</div>}
                    {(d.stat || d.statLabel) && <div style={{ width: w * .1, height: 2, background: modColor, marginBottom: Math.round(h * .024), opacity: 0.6 }} />}
                    <div style={{ fontSize: hfs, fontWeight: 900, color: '#F2F6FF', lineHeight: 1.08, letterSpacing: '-.035em', marginBottom: Math.round(h * .018) }}>{d.headline}</div>
                    {d.subheadline && <div style={{ fontSize: sfs, color: 'rgba(255,255,255,.45)', lineHeight: 1.5, fontWeight: 400, maxWidth: w * .82 }}>{d.subheadline}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 100, padding: `${Math.round(p * .22)}px ${Math.round(p * .48)}px`, flexShrink: 0 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: modColor, boxShadow: `0 0 10px ${modColor}`, flexShrink: 0 }} />
                        <Sig dark fs={18} name={sigName} />
                    </div>
                    {d.cta && <div style={{ background: `linear-gradient(135deg, ${primary}, ${accent})`, color: '#fff', whiteSpace: 'nowrap', flexShrink: 0, padding: `${Math.round(p * .22)}px ${Math.round(p * .5)}px`, borderRadius: 100, fontSize: 21, fontWeight: 800, boxShadow: `0 4px 24px rgba(${rgb(primary)},.5), 0 0 0 1px rgba(255,255,255,.08)` }}>{d.cta} →</div>}
                </div>
            </div>
        </div>
    );
}

/* ── TEMPLATE: HERO LIGHT ── */
function TplHL({ d, w, h, brand }) {
    const colors = brand?.colors || {};
    const modMap = brand?.modMap || {};
    const primary = colors.primary || '#2563EB';
    const accent = colors.accent || '#60A5FA';
    const mod = modMap[d.accentModule] || modMap.none || { c: accent };
    const modColor = mod.c;
    const sigName = brand?.tenantMeta?.name || 'PostAtomic';
    const p = Math.round(w * .059);
    const hfs = h > 1400 ? Math.round(w * .094) : Math.round(w * .082);
    const sfs = Math.round(w * .037);

    return (
        <div style={{ width: w, height: h, position: 'relative', overflow: 'hidden', fontFamily: "'Satoshi',sans-serif", background: '#FFFFFF', borderLeft: `8px solid ${modColor}` }}>
            <div style={{ position: 'absolute', top: -w * .28, right: -w * .28, width: w * .64, height: w * .64, borderRadius: '50%', background: `radial-gradient(circle,${modColor}22 0%,transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -w * .12, left: p, width: w * .38, height: w * .38, borderRadius: '50%', background: `radial-gradient(circle,${modColor}22 0%,transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, paddingTop: p, paddingBottom: p, paddingRight: p, paddingLeft: p + 8, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <GovBadge chip={d.chip} modColor={modColor} fs={20} />
                <div>
                    {d.stat && <div style={{ fontSize: Math.round(w * .15), fontWeight: 900, lineHeight: 1, letterSpacing: '-.05em', color: modColor, marginBottom: Math.round(h * .012) }}>{d.stat}</div>}
                    {d.statLabel && <div style={{ fontSize: Math.round(sfs * .8), color: LIGHT.t2, marginBottom: Math.round(h * .02), fontWeight: 500 }}>{d.statLabel}</div>}
                    <div style={{ fontSize: hfs, fontWeight: 900, color: LIGHT.t1, lineHeight: 1.1, letterSpacing: '-.03em', marginBottom: Math.round(h * .02) }}>{d.headline}</div>
                    {d.subheadline && <div style={{ fontSize: sfs, color: LIGHT.t2, lineHeight: 1.45, fontWeight: 500 }}>{d.subheadline}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Sig dark={false} fs={19} name={sigName} />
                    {d.cta && <div style={{ background: modColor, color: '#fff', padding: `${Math.round(p * .24)}px ${Math.round(p * .52)}px`, borderRadius: 100, fontSize: 22, fontWeight: 800 }}>{d.cta} →</div>}
                </div>
            </div>
        </div>
    );
}

/* ── TEMPLATE: FEATURE DARK ── */
function TplFD({ d, w, h, brand }) {
    const colors = brand?.colors || {};
    const modMap = brand?.modMap || {};
    const accent = colors.accent || '#60A5FA';
    const mod = modMap[d.accentModule] || modMap.none || { c: accent };
    const modColor = mod.c;
    const sigName = brand?.tenantMeta?.name || 'PostAtomic';
    const p = Math.round(w * .059);
    const hfs = Math.round(w * .062), ifs = Math.round(w * .034);

    return (
        <div style={{ width: w, height: h, position: 'relative', overflow: 'hidden', fontFamily: "'Satoshi',sans-serif", background: 'linear-gradient(155deg,#03091A 0%,#060E20 100%)' }}>
            <Grid w={w} h={h} color={accent} op={.04} />
            <Orb x={w} y={0} r={w * .65} color={modColor} o={.07} />
            <div style={{ position: 'absolute', top: 0, left: p, right: p, height: 3, background: `linear-gradient(90deg,${modColor} 0%,transparent 85%)` }} />
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, padding: p, paddingTop: p + 14, display: 'flex', flexDirection: 'column', gap: Math.round(h * .03) }}>
                <div>
                    <GovBadge chip={d.chip} modColor={modColor} fs={20} />
                    <div style={{ fontSize: hfs, fontWeight: 900, color: '#FFF', lineHeight: 1.15, letterSpacing: '-.025em', marginTop: Math.round(h * .024) }}>{d.headline}</div>
                    {d.subheadline && <div style={{ fontSize: Math.round(w * .031), color: 'rgba(255,255,255,.42)', marginTop: Math.round(h * .012), lineHeight: 1.4, fontWeight: 500 }}>{d.subheadline}</div>}
                </div>
                {d.items?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(h * .016), flex: 1 }}>
                        {d.items.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: `${Math.round(h * .02)}px ${Math.round(w * .035)}px`, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.055)', borderRadius: 16, borderLeft: `3px solid ${modColor}` }}>
                                <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: modColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, color: modColor }}>{String(i + 1).padStart(2, '0')}</div>
                                <span style={{ fontSize: ifs, color: 'rgba(255,255,255,.75)', fontWeight: 500, lineHeight: 1.35 }}>{item}</span>
                            </div>
                        ))}
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: Math.round(h * .014), borderTop: '1px solid rgba(255,255,255,.07)' }}>
                    <Sig fs={19} name={sigName} />
                    {d.cta && <span style={{ fontSize: 22, color: modColor, fontWeight: 800 }}>{d.cta} →</span>}
                </div>
            </div>
        </div>
    );
}

/* ── TEMPLATE: FEATURE LIGHT ── */
function TplFL({ d, w, h, brand }) {
    const colors = brand?.colors || {};
    const modMap = brand?.modMap || {};
    const accent = colors.accent || '#60A5FA';
    const mod = modMap[d.accentModule] || modMap.none || { c: accent };
    const modColor = mod.c;
    const sigName = brand?.tenantMeta?.name || 'PostAtomic';
    const p = Math.round(w * .059);
    const hfs = Math.round(w * .062), ifs = Math.round(w * .034);

    return (
        <div style={{ width: w, height: h, position: 'relative', overflow: 'hidden', fontFamily: "'Satoshi',sans-serif", background: '#F4F6F9', borderLeft: `8px solid ${modColor}` }}>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: w * .48, height: w * .48, background: `radial-gradient(circle at bottom right,${modColor}22 0%,transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, paddingTop: p, paddingBottom: p, paddingRight: p, paddingLeft: p + 8, display: 'flex', flexDirection: 'column', gap: Math.round(h * .026) }}>
                <div>
                    <GovBadge chip={d.chip} modColor={modColor} fs={20} />
                    <div style={{ fontSize: hfs, fontWeight: 900, color: LIGHT.t1, lineHeight: 1.15, letterSpacing: '-.025em', marginTop: Math.round(h * .024) }}>{d.headline}</div>
                    {d.subheadline && <div style={{ fontSize: Math.round(w * .031), color: LIGHT.t2, marginTop: Math.round(h * .012), lineHeight: 1.4, fontWeight: 500 }}>{d.subheadline}</div>}
                </div>
                {d.items?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(h * .014), flex: 1 }}>
                        {d.items.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: `${Math.round(h * .019)}px ${Math.round(w * .03)}px`, background: 'rgba(255,255,255,.9)', border: `1px solid ${LIGHT.bord}`, borderRadius: 14, borderLeft: `3px solid ${modColor}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: modColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: modColor }}>{i + 1}</div>
                                <span style={{ fontSize: ifs, color: LIGHT.t1, fontWeight: 500, lineHeight: 1.35 }}>{item}</span>
                            </div>
                        ))}
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: Math.round(h * .012), borderTop: `1px solid ${LIGHT.bord}` }}>
                    <Sig dark={false} fs={19} name={sigName} />
                    {d.cta && <div style={{ background: modColor, color: '#fff', padding: '12px 24px', borderRadius: 100, fontSize: 20, fontWeight: 800 }}>{d.cta} →</div>}
                </div>
            </div>
        </div>
    );
}

/* ── TEMPLATE: CTA DARK ── */
function TplCTA({ d, w, h, brand }) {
    const colors = brand?.colors || {};
    const modMap = brand?.modMap || {};
    const primary = colors.primary || '#2563EB';
    const accent = colors.accent || '#60A5FA';
    const mod = modMap[d.accentModule] || modMap.none || { c: accent };
    const modColor = mod.c;
    const sigName = brand?.tenantMeta?.name || 'PostAtomic';
    const p = Math.round(w * .065);
    const hfs = h > 1400 ? Math.round(w * .098) : Math.round(w * .085);
    const sfs = Math.round(w * .038);

    return (
        <div style={{ width: w, height: h, position: 'relative', overflow: 'hidden', fontFamily: "'Satoshi',sans-serif", background: `radial-gradient(ellipse 115% 70% at 50% 108%,rgba(${rgb(primary)},.42) 0%,#03091A 55%)` }}>
            <Grid w={w} h={h} color={accent} />
            <Orb x={w * .5} y={h} r={w * .85} color={primary} o={.18} />
            {[.38, .52, .67].map((r, i) => (
                <div key={i} style={{ position: 'absolute', bottom: -w * r * .48, left: '50%', transform: 'translateX(-50%)', width: w * r, height: w * r, borderRadius: '50%', border: `1px solid rgba(255,255,255,${.06 - i * .018})`, pointerEvents: 'none' }} />
            ))}
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, padding: p, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
                    <GovBadge chip={d.chip} modColor={modColor} fs={20} />
                </div>
                <div>
                    {d.stat && <div style={{ fontSize: Math.round(w * .138), fontWeight: 900, lineHeight: 1, letterSpacing: '-.05em', marginBottom: Math.round(h * .018), color: '#FFFFFF' }}>{d.stat}</div>}
                    <div style={{ fontSize: hfs, fontWeight: 900, color: '#FFF', lineHeight: 1.1, letterSpacing: '-.03em', marginBottom: Math.round(h * .024) }}>{d.headline}</div>
                    {d.subheadline && <div style={{ fontSize: sfs, color: 'rgba(255,255,255,.46)', lineHeight: 1.5, fontWeight: 500, maxWidth: w * .8, margin: '0 auto' }}>{d.subheadline}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}>
                    {d.cta && <div style={{ background: `linear-gradient(135deg,${primary} 0%,${colors.primaryDark || '#1E40AF'} 100%)`, color: '#fff', padding: `${Math.round(p * .36)}px ${Math.round(p * .82)}px`, borderRadius: 100, fontSize: 26, fontWeight: 800, boxShadow: `0 0 44px rgba(${rgb(primary)},.58)`, letterSpacing: '-.01em' }}>{d.cta} →</div>}
                    <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start' }}>
                        <Sig fs={19} name={sigName} />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── TEMPLATE: STORY ── */
function TplStory({ d, w, h, brand }) {
    const colors = brand?.colors || {};
    const modMap = brand?.modMap || {};
    const accent = colors.accent || '#60A5FA';
    const primary = colors.primary || '#2563EB';
    const mod = modMap[d.accentModule] || modMap.none || { c: accent };
    const modColor = mod.c;
    const sigName = brand?.tenantMeta?.name || 'PostAtomic';
    const pc = PHASE_COLORS[d.phase] || modColor;
    const isCTAPhase = ['Ação', 'CTA', 'Solução'].includes(d.phase);
    const p = Math.round(w * .074), hfs = Math.round(w * .11), sfs = Math.round(w * .05);
    const bg = `radial-gradient(ellipse 110% 65% at 50% ${isCTAPhase ? '105%' : '0%'},rgba(${rgb(pc)},.22) 0%,#03091A 58%)`;

    return (
        <div style={{ width: w, height: h, position: 'relative', overflow: 'hidden', fontFamily: "'Satoshi',sans-serif", background: bg }}>
            <Grid w={w} h={h} color={accent} op={.04} />
            <Orb x={w * .5} y={isCTAPhase ? h : 0} r={w * .9} color={pc} o={.1} />
            <div style={{ position: 'absolute', top: p, left: p, right: p, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '11px 24px', borderRadius: 100, background: 'rgba(255,255,255,.06)', border: `1px solid ${pc}30`, fontSize: 20, fontWeight: 800, color: pc, letterSpacing: '.07em', textTransform: 'uppercase' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: pc, boxShadow: `0 0 9px ${pc}` }} />
                    {d.phase || d.chip || 'GESTÃO MUNICIPAL'}
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 100, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,.35)', letterSpacing: '.06em' }}>
                    {sigName}
                </div>
            </div>
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, paddingTop: p * 2.8, paddingBottom: p * 2.2, paddingLeft: p, paddingRight: p, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: Math.round(h * .027) }}>
                {d.stat && <div style={{ fontSize: Math.round(w * .19), fontWeight: 900, lineHeight: 1, letterSpacing: '-.05em', color: '#FFFFFF' }}>{d.stat}</div>}
                {d.statLabel && <div style={{ fontSize: Math.round(sfs * .75), color: 'rgba(255,255,255,.48)', fontWeight: 500, lineHeight: 1.35 }}>{d.statLabel}</div>}
                <div style={{ fontSize: hfs, fontWeight: 900, color: '#E8EDF5', lineHeight: 1.1, letterSpacing: '-.03em' }}>{d.headline}</div>
                {d.subheadline && <div style={{ fontSize: sfs, color: 'rgba(255,255,255,.5)', lineHeight: 1.45, fontWeight: 500, maxWidth: w * .92 }}>{d.subheadline}</div>}
                {d.items?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(h * .011) }}>
                        {d.items.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: `${Math.round(h * .015)}px ${Math.round(w * .037)}px`, background: 'rgba(255,255,255,.05)', borderRadius: 14, borderLeft: `3px solid ${pc}` }}>
                                <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: `${pc}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: pc }}>{i + 1}</div>
                                <span style={{ fontSize: Math.round(w * .039), color: 'rgba(255,255,255,.78)', fontWeight: 500, lineHeight: 1.35 }}>{item}</span>
                            </div>
                        ))}
                    </div>
                )}
                {d.cta && <div style={{ display: 'inline-flex', alignSelf: 'flex-start', background: `linear-gradient(135deg,${primary} 0%,${colors.primaryDark || '#1E40AF'} 100%)`, color: '#fff', padding: `${Math.round(p * .3)}px ${Math.round(p * .78)}px`, borderRadius: 100, fontSize: 28, fontWeight: 800, boxShadow: `0 4px 28px rgba(${rgb(primary)},.5)`, marginTop: Math.round(h * .01) }}>{d.cta} →</div>}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   PREMIUM TEMPLATE: IMPACT
   Stat-dominant. Giant number commands attention, minimal copy.
   Best for: data-driven posts, milestone announcements, results.
═══════════════════════════════════════════════════════════════ */
function TplImpact({ d, w, h, brand }) {
    const colors = brand?.colors || {};
    const modMap = brand?.modMap || {};
    const primary = colors.primary || '#2563EB';
    const accent = colors.accent || '#60A5FA';
    const mod = modMap[d.accentModule] || modMap.none || { c: accent };
    const modColor = mod.c;
    const sigName = brand?.tenantMeta?.name || 'PostAtomic';
    const p = Math.round(w * .07);
    const statFs = Math.round(w * .30);
    const headFs = Math.round(w * .068);
    const subFs = Math.round(w * .038);

    return (
        <div style={{
            width: w, height: h, position: 'relative', overflow: 'hidden',
            fontFamily: "'Satoshi',sans-serif",
            background: '#020810',
        }}>
            {/* Giant ghost stat behind everything */}
            <div style={{
                position: 'absolute', right: -w * .06, top: h * .08,
                fontSize: Math.round(w * .62), fontWeight: 900, lineHeight: 1,
                letterSpacing: '-.08em', color: 'rgba(255,255,255,.028)',
                pointerEvents: 'none', userSelect: 'none',
                fontFamily: "'Satoshi',sans-serif",
            }}>{d.stat || '∞'}</div>
            {/* Strong left glow */}
            <div style={{ position: 'absolute', left: -w * .2, top: h * .3, width: w * .9, height: w * .9, borderRadius: '50%', background: `radial-gradient(circle, rgba(${rgb(primary)},0.28) 0%, transparent 65%)`, pointerEvents: 'none' }} />
            {/* Right accent panel */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: 5, height: h, background: `linear-gradient(180deg, ${modColor} 0%, transparent 60%)`, pointerEvents: 'none' }} />
            {/* Top bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: w * .42, height: 4, background: `linear-gradient(90deg, ${modColor}, ${accent})`, pointerEvents: 'none' }} />
            <Grid w={w} h={h} color={primary} op={0.035} />

            <div style={{ position: 'absolute', inset: 0, zIndex: 10, padding: p, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <GovBadge chip={d.chip} modColor={modColor} fs={19} />
                    <Sig dark fs={17} name={sigName} />
                </div>

                {/* Hero stat */}
                <div>
                    {d.stat && (
                        <div style={{
                            fontSize: statFs, fontWeight: 900, lineHeight: .82,
                            letterSpacing: '-.07em', color: '#FFFFFF',
                            marginBottom: Math.round(h * .016),
                        }}>{d.stat}</div>
                    )}
                    {d.statLabel && (
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 10,
                            fontSize: Math.round(subFs * .82), color: modColor,
                            fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
                            marginBottom: Math.round(h * .028),
                            background: `${modColor}15`,
                            border: `1px solid ${modColor}30`,
                            borderRadius: 6, padding: `${Math.round(w * .012)}px ${Math.round(w * .02)}px`,
                        }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: modColor, boxShadow: `0 0 8px ${modColor}` }} />
                            {d.statLabel}
                        </div>
                    )}
                    <div style={{ width: w * .14, height: 3, background: modColor, marginBottom: Math.round(h * .028), opacity: 0.7 }} />
                    <div style={{ fontSize: headFs, fontWeight: 900, color: '#EEF4FF', lineHeight: 1.1, letterSpacing: '-.03em', maxWidth: w * .88, marginBottom: d.subheadline ? Math.round(h * .016) : 0 }}>
                        {d.headline}
                    </div>
                    {d.subheadline && (
                        <div style={{ fontSize: subFs, color: 'rgba(255,255,255,.42)', lineHeight: 1.5, fontWeight: 400, maxWidth: w * .78 }}>
                            {d.subheadline}
                        </div>
                    )}
                </div>

                {/* CTA */}
                {d.cta && (
                    <div style={{
                        display: 'inline-flex', alignSelf: 'flex-start',
                        background: `linear-gradient(135deg, ${modColor}, ${primary})`,
                        color: '#fff', padding: `${Math.round(p * .26)}px ${Math.round(p * .62)}px`,
                        borderRadius: 100, fontSize: 23, fontWeight: 800,
                        boxShadow: `0 4px 28px rgba(${rgb(modColor)}, .5), 0 0 0 1px rgba(255,255,255,.08)`,
                        letterSpacing: '-.01em',
                    }}>{d.cta} →</div>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   PREMIUM TEMPLATE: CONTRAST
   Split-panel layout. Left = dark problem, right = light solution.
   Best for: before/after, problem→solution, comparisons.
═══════════════════════════════════════════════════════════════ */
function TplContrast({ d, w, h, brand }) {
    const colors = brand?.colors || {};
    const modMap = brand?.modMap || {};
    const primary = colors.primary || '#2563EB';
    const accent = colors.accent || '#60A5FA';
    const mod = modMap[d.accentModule] || modMap.none || { c: accent };
    const modColor = mod.c;
    const sigName = brand?.tenantMeta?.name || 'PostAtomic';
    const p = Math.round(w * .06);

    const headFs = Math.round(w * .076);
    const subFs = Math.round(w * .038);
    const itemFs = Math.round(w * .034);

    // Split: left panel is dark (problem), right is accent-tinted (solution)
    const splitX = Math.round(w * .5);

    return (
        <div style={{
            width: w, height: h, position: 'relative', overflow: 'hidden',
            fontFamily: "'Satoshi',sans-serif",
            background: '#03091A',
        }}>
            {/* Right panel lighter tint */}
            <div style={{
                position: 'absolute', left: splitX, top: 0, right: 0, bottom: 0,
                background: `linear-gradient(135deg, ${modColor}14 0%, ${modColor}08 100%)`,
                borderLeft: `2px solid ${modColor}30`,
                pointerEvents: 'none',
            }} />

            {/* Diagonal connector graphic */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
                <line x1={splitX} y1={0} x2={splitX} y2={h} stroke={`${modColor}30`} strokeWidth="2" strokeDasharray="8 8" />
            </svg>

            {/* Background orbs */}
            <Orb x={splitX * 0.4} y={h * 0.3} r={w * .4} color={'#1E3560'} o={.3} />
            <Orb x={splitX + splitX * 0.6} y={h * 0.7} r={w * .35} color={modColor} o={.12} />

            <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', padding: p, gap: Math.round(h * .025) }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <GovBadge chip={d.chip} modColor={modColor} fs={18} />
                    <Sig dark fs={17} name={sigName} />
                </div>

                {/* Stat row */}
                {d.stat && (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: Math.round(w * .02) }}>
                        <span style={{ fontSize: Math.round(w * .17), fontWeight: 900, letterSpacing: '-.06em', color: '#FFF', lineHeight: 1 }}>{d.stat}</span>
                        {d.statLabel && <span style={{ fontSize: subFs, color: modColor, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase' }}>{d.statLabel}</span>}
                    </div>
                )}

                {/* Main headline */}
                <div style={{ fontSize: headFs, fontWeight: 900, color: '#F0F6FF', lineHeight: 1.08, letterSpacing: '-.03em', maxWidth: w * .9 }}>
                    {d.headline}
                </div>

                {d.subheadline && (
                    <div style={{ fontSize: subFs, color: 'rgba(255,255,255,.5)', lineHeight: 1.5, fontWeight: 400, maxWidth: w * .8 }}>
                        {d.subheadline}
                    </div>
                )}

                {/* Two-column items if present */}
                {d.items?.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Math.round(h * .018), flex: 1, alignContent: 'start' }}>
                        {d.items.map((item, i) => (
                            <div key={i} style={{
                                padding: `${Math.round(h * .016)}px ${Math.round(w * .032)}px`,
                                background: i % 2 === 0 ? 'rgba(255,255,255,.04)' : `${modColor}12`,
                                border: `1px solid ${i % 2 === 0 ? 'rgba(255,255,255,.07)' : modColor + '25'}`,
                                borderRadius: 14,
                            }}>
                                <div style={{ fontSize: itemFs, color: 'rgba(255,255,255,.75)', fontWeight: 500, lineHeight: 1.4 }}>{item}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* CTA */}
                {d.cta && (
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        paddingTop: Math.round(h * .016),
                        borderTop: '1px solid rgba(255,255,255,.07)',
                        flexShrink: 0, gap: 16,
                    }}>
                        <div style={{ fontSize: subFs, color: 'rgba(255,255,255,.35)', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>Próximo passo</div>
                        <div style={{
                            background: `linear-gradient(135deg, ${primary}, ${modColor})`,
                            color: '#fff', padding: `${Math.round(p * .25)}px ${Math.round(p * .6)}px`,
                            borderRadius: 100, fontSize: 22, fontWeight: 800,
                            boxShadow: `0 4px 20px rgba(${rgb(primary)}, .4)`,
                            whiteSpace: 'nowrap', flexShrink: 0,
                        }}>
                            {d.cta} →
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   PREMIUM TEMPLATE: MANIFESTO
   Full gradient editorial. Bold serif-style typography.
   Best for: thought leadership, opinion pieces, brand moments.
═══════════════════════════════════════════════════════════════ */
function TplManifesto({ d, w, h, brand }) {
    const colors = brand?.colors || {};
    const modMap = brand?.modMap || {};
    const primary = colors.primary || '#2563EB';
    const accent = colors.accent || '#60A5FA';
    const mod = modMap[d.accentModule] || modMap.none || { c: accent };
    const modColor = mod.c;
    const sigName = brand?.tenantMeta?.name || 'PostAtomic';
    const p = Math.round(w * .075);
    const headFs = h > 1400 ? Math.round(w * .112) : Math.round(w * .098);
    const subFs = Math.round(w * .04);

    return (
        <div style={{
            width: w, height: h, position: 'relative', overflow: 'hidden',
            fontFamily: "'Satoshi',sans-serif",
            background: '#050C1A',
        }}>
            {/* Rich layered background */}
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, rgba(${rgb(primary)},0.12) 0%, #050C1A 45%, rgba(${rgb(modColor)},0.1) 100%)`, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: h * .15, left: -w * .3, width: w * .9, height: w * .9, borderRadius: '50%', background: `radial-gradient(circle, rgba(${rgb(primary)},0.12) 0%, transparent 65%)`, pointerEvents: 'none' }} />
            {/* Ghost number */}
            <div style={{
                position: 'absolute', right: -w * .04, bottom: -h * .04,
                fontSize: Math.round(w * .55), fontWeight: 900, letterSpacing: '-.08em',
                color: 'rgba(255,255,255,.022)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
                fontFamily: "'Satoshi',sans-serif",
            }}>{(d.stat || '∞').replace(/[^0-9A-Z%×+∞]/gi, '') || '∞'}</div>
            {/* Top gradient bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${modColor}, ${primary} 60%, transparent)` }} />
            {/* Right edge accent */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: 3, height: h * .6, background: `linear-gradient(180deg, ${modColor}80, transparent)` }} />

            <div style={{ position: 'absolute', inset: 0, zIndex: 10, padding: p, paddingTop: p + 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {/* Chip label */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: `${Math.round(w * .014)}px ${Math.round(w * .026)}px`,
                    borderRadius: 6, background: 'rgba(255,255,255,.05)',
                    border: '1px solid rgba(255,255,255,.09)',
                    fontSize: 18, fontWeight: 700, letterSpacing: '.1em',
                    color: 'rgba(255,255,255,.5)', textTransform: 'uppercase',
                    alignSelf: 'flex-start', whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: modColor, flexShrink: 0 }} />
                    {d.chip || 'MANIFESTO'}
                </div>

                {/* Main block */}
                <div>
                    {d.stat && (
                        <div style={{ fontSize: Math.round(w * .19), fontWeight: 900, lineHeight: .88, letterSpacing: '-.07em', color: modColor, marginBottom: Math.round(h * .016) }}>
                            {d.stat}
                        </div>
                    )}
                    <div style={{ fontSize: headFs, fontWeight: 900, color: '#FFFFFF', lineHeight: 1.04, letterSpacing: '-.04em', marginBottom: Math.round(h * .022) }}>
                        {d.headline}
                    </div>
                    {d.subheadline && (
                        <div style={{ fontSize: subFs, color: 'rgba(255,255,255,.48)', lineHeight: 1.55, fontWeight: 400, maxWidth: w * .86, borderLeft: `3px solid ${modColor}`, paddingLeft: Math.round(w * .038), marginBottom: Math.round(h * .022) }}>
                            {d.subheadline}
                        </div>
                    )}
                    {d.items?.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(h * .013) }}>
                            {d.items.map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: Math.round(w * .028), padding: `${Math.round(h * .012)}px ${Math.round(w * .03)}px`, background: 'rgba(255,255,255,.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,.06)' }}>
                                    <div style={{ width: Math.round(w * .02), height: Math.round(w * .02), borderRadius: '50%', background: modColor, flexShrink: 0, boxShadow: `0 0 8px ${modColor}80` }} />
                                    <span style={{ fontSize: Math.round(subFs * .88), color: 'rgba(255,255,255,.68)', fontWeight: 500, lineHeight: 1.35 }}>{item}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: Math.round(h * .016), borderTop: '1px solid rgba(255,255,255,.06)', flexShrink: 0, gap: 16 }}>
                    <Sig dark fs={17} name={sigName} />
                    {d.cta && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: Math.round(subFs * .85), color: modColor, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {d.cta} <span style={{ fontSize: Math.round(subFs), lineHeight: 1 }}>→</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   TEMPLATE ROUTER
═══════════════════════════════════════════════════════════════ */
function pickTpl(fmt, idx, total, sl, templateStyle) {
    // Premium templates override everything
    if (templateStyle === 'impact')    return 'impact';
    if (templateStyle === 'contrast')  return 'contrast';
    if (templateStyle === 'manifesto') return 'manifesto';

    // Classic routing
    if (fmt === 'story') return 'story';
    const isLight = sl.theme === 'light';
    if (fmt === 'post') return isLight ? 'hero-light' : 'hero-dark';
    if (idx === 0) return 'hero-dark';
    if (idx === total - 1) return 'cta-dark';
    return isLight ? 'feature-light' : 'feature-dark';
}

export function Slide({ slide, w, h, fmt, idx, total, templateStyle = 'classic' }) {
    const brand = useBrand();
    const t = pickTpl(fmt, idx, total, slide, templateStyle);
    const props = { d: slide, w, h, brand };
    const map = {
        'hero-dark':    TplHD,
        'hero-light':   TplHL,
        'feature-dark': TplFD,
        'feature-light':TplFL,
        'cta-dark':     TplCTA,
        'story':        TplStory,
        'impact':       TplImpact,
        'contrast':     TplContrast,
        'manifesto':    TplManifesto,
    };
    const T = map[t] || TplHD;
    return <T {...props} />;
}
