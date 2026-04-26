import { useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { useBrand } from '../../contexts/BrandContext';
import { useUsage } from '../../hooks/useUsage';
import { usePosts } from '../../hooks/usePosts';
import { useMobile } from '../../hooks/useMobile';
import { api } from '../../lib/api';
import { Slide } from './Slide';

const DIMS = {
    post:     { w: 1080, h: 1350, label: '1080 × 1350' },
    carousel: { w: 1080, h: 1350, label: '1080 × 1350 / slide' },
    story:    { w: 1080, h: 1920, label: '1080 × 1920' },
};

const TEMPLATES = [
    { v: 'classic',   l: 'Classic',   desc: 'Layout equilibrado com headline, pontos e CTA. Versátil para qualquer conteúdo.' },
    { v: 'impact',    l: 'Impact',    desc: 'Número gigante que para o scroll. Ideal para dados e resultados impressionantes.' },
    { v: 'contrast',  l: 'Contrast',  desc: 'Split visual problema vs solução. Poderoso para mostrar transformação.' },
    { v: 'manifesto', l: 'Manifesto', desc: 'Declaração de posicionamento audaciosa. Forte para autoridade e marca.' },
];

const TEMPLATE_DEMOS = {
    classic: {
        theme: 'dark', chip: 'ESTRATÉGIA',
        headline: 'Resultados reais para sua empresa crescer',
        subheadline: 'Metodologia focada em crescimento sustentável e previsível',
        items: ['Aumento consistente de leads', 'Redução de custo por aquisição', 'Conversões com mais qualidade'],
        cta: 'Saiba mais', stat: '', statLabel: '', accentModule: 'mod_0', phase: '',
    },
    impact: {
        theme: 'dark', chip: 'RESULTADO',
        stat: '3×', statLabel: 'mais conversões',
        headline: 'Multiplique seus resultados com estratégia',
        subheadline: 'Empresas que aplicam esse método crescem 3x mais rápido',
        items: [], cta: 'Quero crescer', accentModule: 'mod_0', phase: '',
    },
    contrast: {
        theme: 'dark', chip: 'COMPARATIVO',
        headline: 'Antes vs Depois da estratégia certa',
        subheadline: 'A diferença que uma decisão pode fazer',
        items: ['Sem previsibilidade', 'Leads frios e caros', 'Crescimento previsível', 'Leads qualificados'],
        cta: 'Quero mudar', stat: '', statLabel: '', accentModule: 'mod_0', phase: '',
    },
    manifesto: {
        theme: 'dark', chip: 'POSICIONAMENTO',
        headline: 'Resultados medíocres são uma escolha. Não a sua.',
        subheadline: 'Empresas que dominam mercados têm uma coisa em comum.',
        items: ['Clareza de posicionamento', 'Consistência na execução', 'Dados guiam cada decisão'],
        cta: 'Começar agora', stat: '', statLabel: '', accentModule: 'mod_0', phase: '',
    },
};

async function doExport(el, name) {
    try {
        await document.fonts.ready;
        // Run twice — first pass warms up font/image loading, second captures correctly
        await toPng(el, { pixelRatio: 2 });
        const dataUrl = await toPng(el, { pixelRatio: 2 });
        const a = document.createElement('a');
        a.href = dataUrl; a.download = name; a.click();
    } catch (e) { console.error(e); alert('Erro ao exportar.'); }
}

function SLabel({ children }) {
    return <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#616161', marginBottom: 6, paddingLeft: 2 }}>{children}</p>;
}

/* ── Reusable controls content (used in both sidebar and mobile sheet) ── */
function ControlsContent({ fmt, setFmt, fw, setFw, tpl, setTpl, topic, setTopic, custom, setCustom, topics, primaryColor, used, limit, atLimit, plan, loading, gen, err, slides, setCur }) {
    const pill = (active) => ({
        padding: '5px 11px', borderRadius: 9999, fontSize: 12, fontWeight: active ? 500 : 400,
        background: active ? '#191919' : 'transparent',
        color: active ? '#FFFFFF' : '#616161',
        border: `1px solid ${active ? 'rgba(255,255,255,0.12)' : 'transparent'}`,
        cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Format */}
            <div>
                <SLabel>Formato</SLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[{ v: 'post', l: 'Post Único', s: '1 slide' }, { v: 'carousel', l: 'Carrossel', s: 'até 10' }, { v: 'story', l: 'Story', s: '1080×1920' }].map(f => (
                        <button key={f.v} onClick={() => { setFmt(f.v); setCur(0); }}
                            style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                                background: fmt === f.v ? '#191919' : 'transparent',
                                border: `1px solid ${fmt === f.v ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
                                borderLeft: `2px solid ${fmt === f.v ? primaryColor : 'transparent'}`,
                                transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
                            }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: fmt === f.v ? '#FFFFFF' : '#A8A8A8' }}>{f.l}</span>
                            <span style={{ fontSize: 11, color: '#616161' }}>{f.s}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Story framework */}
            {fmt === 'story' && (
                <div>
                    <SLabel>Framework</SLabel>
                    <div style={{ display: 'flex', gap: 4, background: '#0F0F0F', borderRadius: 8, padding: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
                        {['AIDA', 'PAIS'].map(f => (
                            <button key={f} onClick={() => setFw(f)}
                                style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: fw === f ? 600 : 400, background: fw === f ? '#191919' : 'transparent', color: fw === f ? '#FFFFFF' : '#616161', transition: 'all 0.15s' }}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Template */}
            <div>
                <SLabel>Template</SLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                    {TEMPLATES.map(t => {
                        const cardW = 100;
                        const cardH = Math.round(cardW * (1350 / 1080));
                        const sc = cardW / 1080;
                        const active = tpl === t.v;
                        return (
                            <button key={t.v} onClick={() => setTpl(t.v)} style={{
                                position: 'relative', background: 'none', border: `2px solid ${active ? primaryColor : 'rgba(255,255,255,0.08)'}`,
                                borderRadius: 8, cursor: 'pointer', padding: 0, overflow: 'hidden',
                                transition: 'border-color 0.15s', display: 'flex', flexDirection: 'column',
                            }}>
                                {/* Mini slide preview */}
                                <div style={{ width: cardW, height: cardH, overflow: 'hidden', flexShrink: 0 }}>
                                    <div style={{ width: 1080, height: 1350, transform: `scale(${sc})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
                                        <Slide slide={TEMPLATE_DEMOS[t.v]} w={1080} h={1350} fmt="post" idx={0} total={1} templateStyle={t.v} />
                                    </div>
                                </div>
                                {/* Label bar */}
                                <div style={{ background: active ? `rgba(${primaryColor === '#0CC981' ? '12,201,129' : '37,99,235'},0.15)` : '#0F0F0F', padding: '5px 4px', borderTop: `1px solid ${active ? primaryColor + '40' : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.15s' }}>
                                    <p style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? primaryColor : '#A8A8A8', textAlign: 'center', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{t.l}</p>
                                </div>
                                {/* Active checkmark */}
                                {active && (
                                    <div style={{ position: 'absolute', top: 5, right: 5, width: 16, height: 16, borderRadius: '50%', background: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 8px ${primaryColor}80` }}>
                                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
                {/* Description of selected template */}
                <p style={{ fontSize: 11, color: '#616161', lineHeight: 1.5, marginTop: 8, paddingLeft: 2 }}>
                    {TEMPLATES.find(t => t.v === tpl)?.desc}
                </p>
            </div>

            {/* Topic */}
            <div>
                <SLabel>Foco</SLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
                    {topics.map(t => (
                        <button key={t} onClick={() => { setTopic(t); setCustom(''); }}
                            style={{
                                textAlign: 'left', padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                                fontSize: 12, fontFamily: 'Inter, sans-serif',
                                background: topic === t && !custom ? 'rgba(12,201,129,0.08)' : 'transparent',
                                color: topic === t && !custom ? '#0CC981' : '#A8A8A8',
                                border: `1px solid ${topic === t && !custom ? 'rgba(12,201,129,0.2)' : 'transparent'}`,
                                transition: 'all 0.15s',
                            }}>
                            {t}
                        </button>
                    ))}
                </div>
                <textarea rows={2} value={custom} onChange={e => setCustom(e.target.value)}
                    placeholder="Ou escreva foco customizado…"
                    style={{ width: '100%', background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, color: '#FFFFFF', fontSize: 12, padding: '8px 10px', resize: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', transition: 'border-color 0.15s', boxSizing: 'border-box' }} />
            </div>

            {/* Daily */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <SLabel>Hoje</SLabel>
                    <span style={{ fontSize: 11, fontWeight: 600, color: atLimit ? '#F87171' : '#A8A8A8' }}>{used}/{limit}</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
                    <div style={{ height: '100%', width: `${Math.min((used / limit) * 100, 100)}%`, background: atLimit ? '#EF4444' : '#0CC981', borderRadius: 99 }} />
                </div>
                <p style={{ fontSize: 10, color: '#616161' }}>Renova às 00:00 · {plan || 'trial'}</p>
            </div>

            {/* Generate */}
            <button onClick={gen} disabled={loading || atLimit}
                style={{
                    width: '100%', padding: '11px 0', borderRadius: 9999,
                    background: atLimit ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                    color: atLimit ? '#616161' : '#050505',
                    border: atLimit ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    fontSize: 13, fontWeight: 700, cursor: loading || atLimit ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1, fontFamily: 'Inter, sans-serif',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    transition: 'all 0.15s',
                }}>
                {loading
                    ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(0,0,0,0.15)', borderTopColor: '#050505', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />Gerando…</>
                    : atLimit ? 'Limite atingido' : 'Gerar Post'}
            </button>

            {err && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#F87171', lineHeight: 1.5 }}>
                    {err}
                </div>
            )}
        </div>
    );
}

export default function PostMachine() {
    const brand = useBrand();
    const { dailyUsed, dailyLimit, plan, refresh: refreshUsage } = useUsage();
    const { save: savePost } = usePosts();
    const isMobile = useMobile();

    const [fmt, setFmt] = useState('post');
    const [fw, setFw] = useState('AIDA');
    const [topic, setTopic] = useState('');
    const [custom, setCustom] = useState('');
    const [tpl, setTpl] = useState('classic');
    const [slides, setSlides] = useState([]);
    const [cap, setCap] = useState('');
    const [ht, setHt] = useState('');
    const [cur, setCur] = useState(0);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    const [copied, setCopied] = useState(false);
    const [controlsOpen, setControlsOpen] = useState(true); // mobile sheet open/close

    const topics = brand?.topics?.length ? brand.topics
        : ['Dores do público-alvo', 'Resultados e ROI', 'Como funciona', 'Cases de sucesso', 'Diferenciais'];
    const activeTopic = custom.trim() || topic || topics[0];
    const dims = DIMS[fmt];
    const colors = brand?.colors || {};
    const primaryColor = colors.primary || '#0CC981';
    const used = dailyUsed || 0;
    const limit = dailyLimit || 3;
    const atLimit = used >= limit;

    // Compute slide display scale
    const slideScale = isMobile
        ? Math.min((window.innerWidth - 32) / dims.w, 0.33)
        : 0.33;
    const pw = Math.round(dims.w * slideScale);
    const ph = Math.round(dims.h * slideScale);

    useEffect(() => {
        // Preload Satoshi font so export captures it correctly
        const lnk = document.createElement('link');
        lnk.href = 'https://api.fontshare.com/v2/css?f[]=satoshi@900,800,700,500,400&display=swap';
        lnk.rel = 'stylesheet'; document.head.appendChild(lnk);
    }, []);

    const buildPrompt = () => {
        const cta = brand?.tenantMeta?.defaultCta || 'Entre em contato';
        const modules = brand?.modules || [];
        const firstModKey = modules[0]?.key || 'none';

        let tplInstr = '';
        if (tpl === 'impact') tplInstr = `TEMPLATE: IMPACT — stat gigante é o herói. Inclua stat + statLabel impactantes obrigatoriamente. Headline curta (máx 8 palavras).`;
        else if (tpl === 'contrast') tplInstr = `TEMPLATE: CONTRAST — layout split problema/solução. 4 items (2 problemas, 2 soluções). Headline como transformação.`;
        else if (tpl === 'manifesto') tplInstr = `TEMPLATE: MANIFESTO — declaração audaciosa (8-12 palavras). Subheadline como provocação. Items como bullets de convicção.`;

        let instr = '';
        if (fmt === 'post') {
            instr = `Gere 1 slide (post único). Use stat impactante se aplicável.`;
        } else if (fmt === 'carousel') {
            instr = `Gere 5-10 slides carrossel:\nSlide 1 (theme:dark): hook que PARA o scroll\nSlides intermediários: alterne dark (problema) e light (solução)\nSlide final (theme:dark): CTA forte`;
        } else {
            const phases = fw === 'AIDA' ? ['Atenção','Interesse','Desejo','Ação'] : ['Problema','Agitação','Impacto','Solução','CTA'];
            instr = `Gere ${phases.length} slides de story, framework ${fw}, fases: ${phases.join(', ')}. Máx 2 elementos por slide. Todos theme:dark.`;
        }

        return `${instr}${tplInstr ? '\n' + tplInstr : ''}

FOCO: ${activeTopic}
MÓDULOS: ${modules.map(m => m.key).join(', ') || 'none'}

REGRAS:
- chip: rótulo curto MAIÚSCULAS do segmento (sem emojis)
- cta: "${cta}"
- accentModule: um dos módulos ou "none"
- headline: hook forte, sem emojis
- stat: número impactante quando aplicável
- Nunca use emojis em nenhum campo

JSON válido apenas:
{"slides":[{"theme":"dark","chip":"","stat":"","statLabel":"","headline":"","subheadline":"","items":[],"cta":"${cta}","accentModule":"${firstModKey}","phase":""}],"caption":"","hashtags":""}`;
    };

    const gen = async () => {
        if (atLimit) { setErr(`Limite de ${limit} posts por dia atingido. Renova à meia-noite.`); return; }
        setLoading(true); setErr(''); setSlides([]); setCur(0);
        // On mobile: collapse controls sheet when generating
        if (isMobile) setControlsOpen(false);
        try {
            const r = await api.posts.generate({
                systemPrompt: brand?.systemPrompt || '',
                messages: [{ role: 'user', content: buildPrompt() }],
                temperature: 1,
                templateStyle: tpl,
            });
            if (r.error) throw new Error(r.error);
            const txt = r.content?.find(c => c.type === 'text')?.text || '{}';
            const parsed = JSON.parse(txt.replace(/```json\n?|\n?```/g, '').trim());
            if (!parsed.slides?.length) throw new Error('Nenhum slide retornado.');
            setSlides(parsed.slides); setCap(parsed.caption || ''); setHt(parsed.hashtags || '');
            savePost({ format: fmt, framework: fw || null, topic: activeTopic, slides: parsed.slides, caption: parsed.caption, hashtags: parsed.hashtags, template_style: tpl });
            refreshUsage();
        } catch (e) { setErr(e.message || 'Erro ao gerar.'); }
        setLoading(false);
    };

    const dl = i => { const el = document.getElementById(`exp${i}`); if (el) doExport(el, `post-${fmt}-${i + 1}.png`); };
    const dlAll = async () => { for (let i = 0; i < slides.length; i++) { dl(i); await new Promise(r => setTimeout(r, 800)); } };
    const copy = () => navigator.clipboard.writeText(`${cap}\n\n${ht}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2200); });

    const controlsProps = { fmt, setFmt, fw, setFw, tpl, setTpl, topic, setTopic, custom, setCustom, topics, primaryColor, used, limit, atLimit, plan, loading, gen, err, slides, setCur };

    /* ──────────────────────────── CANVAS section ──────────────────────────── */
    const renderCanvas = () => {
        if (loading) return (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                <div style={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.08)', borderTopColor: '#0CC981', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 13, color: '#A8A8A8' }}>Pesquisando dados reais…</p>
                    <p style={{ fontSize: 11, color: '#616161', marginTop: 4 }}>Gerando conteúdo estratégico</p>
                </div>
            </div>
        );

        if (!slides.length) {
            const tplMeta = TEMPLATES.find(t => t.v === tpl) || TEMPLATES[0];
            const demoSlide = TEMPLATE_DEMOS[tpl] || TEMPLATE_DEMOS.classic;
            return (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: isMobile ? '20px 16px 80px' : 40 }}>
                    {/* Template preview */}
                    <div style={{ position: 'relative' }}>
                        <div style={{ overflow: 'hidden', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 48px rgba(0,0,0,0.7)', width: pw, height: ph, opacity: 0.7, transition: 'opacity 0.3s' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.style.opacity = 0.7}>
                            <div style={{ width: dims.w, height: dims.h, transform: `scale(${slideScale})`, transformOrigin: 'top left' }}>
                                <Slide slide={demoSlide} w={dims.w} h={dims.h} fmt="post" idx={0} total={1} templateStyle={tpl} />
                            </div>
                        </div>
                        {/* Preview badge */}
                        <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', borderRadius: 99, padding: '3px 10px', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                            <p style={{ fontSize: 10, fontWeight: 600, color: '#A8A8A8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Preview · {tplMeta.l}</p>
                        </div>
                    </div>
                    {/* Template info */}
                    <div style={{ textAlign: 'center', maxWidth: 300 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, letterSpacing: -0.2 }}>{tplMeta.l}</p>
                        <p style={{ fontSize: 13, color: '#616161', lineHeight: 1.6, marginBottom: 16 }}>{tplMeta.desc}</p>
                        <p style={{ fontSize: 12, color: '#404040', lineHeight: 1.5 }}>
                            {isMobile ? 'Toque em Configurar para ajustar e depois Gerar Post.' : 'Ajuste o foco no painel e clique em Gerar Post para criar com o DNA da sua marca.'}
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div style={{ padding: isMobile ? '16px 16px 80px' : 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Top bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                        <p style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>
                            {fmt === 'post' ? 'Post Único' : fmt === 'carousel' ? 'Carrossel' : `Story · ${fw}`}
                            <span style={{ fontSize: 12, fontWeight: 400, color: '#616161', marginLeft: 8, textTransform: 'capitalize' }}>· {tpl}</span>
                        </p>
                        <p style={{ fontSize: 11, color: '#616161', marginTop: 2 }}>{slides.length} slide{slides.length > 1 ? 's' : ''} · {dims.label}</p>
                    </div>
                    {slides.length > 1 && !isMobile && (
                        <button onClick={dlAll}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12, color: '#A8A8A8', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                            Baixar Todos
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>
                    {/* Slide preview */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, flexShrink: 0, width: isMobile ? '100%' : 'auto' }}>
                        <div style={{ overflow: 'hidden', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 40px rgba(0,0,0,0.6)', width: pw, height: ph }}>
                            <div style={{ width: dims.w, height: dims.h, transform: `scale(${slideScale})`, transformOrigin: 'top left' }}>
                                <Slide slide={slides[cur]} w={dims.w} h={dims.h} fmt={fmt} idx={cur} total={slides.length} templateStyle={tpl} />
                            </div>
                        </div>

                        {/* Navigation dots */}
                        {slides.length > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button onClick={() => setCur(c => (c - 1 + slides.length) % slides.length)}
                                    style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: '#121212', color: '#A8A8A8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 0.15s' }}>←</button>
                                <div style={{ display: 'flex', gap: 5 }}>
                                    {slides.map((_, i) => (
                                        <button key={i} onClick={() => setCur(i)}
                                            style={{ borderRadius: 99, border: 'none', cursor: 'pointer', transition: 'all 0.2s', width: i === cur ? 18 : 6, height: 6, background: i === cur ? '#0CC981' : 'rgba(255,255,255,0.15)' }} />
                                    ))}
                                </div>
                                <button onClick={() => setCur(c => (c + 1) % slides.length)}
                                    style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: '#121212', color: '#A8A8A8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 0.15s' }}>→</button>
                            </div>
                        )}

                        {/* Download current slide */}
                        <button onClick={() => dl(cur)}
                            style={{ width: pw, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12, color: '#A8A8A8', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                            Baixar Slide {cur + 1}/{slides.length}
                        </button>
                    </div>

                    {/* Slide strip (desktop only) */}
                    {slides.length > 1 && !isMobile && (
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#616161' }}>Todos os slides</p>
                            {slides.map((sl, i) => (
                                <div key={i} onClick={() => setCur(i)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                                        background: i === cur ? 'rgba(255,255,255,0.04)' : 'transparent',
                                        border: `1px solid ${i === cur ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}`,
                                        transition: 'all 0.15s',
                                    }}>
                                    <div style={{ width: 28, height: Math.round(28 * (dims.h / dims.w)), overflow: 'hidden', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                                        <div style={{ width: dims.w, height: dims.h, transform: `scale(${28 / dims.w})`, transformOrigin: 'top left' }}>
                                            <Slide slide={sl} w={dims.w} h={dims.h} fmt={fmt} idx={i} total={slides.length} templateStyle={tpl} />
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 12, fontWeight: 500, color: i === cur ? '#FFFFFF' : '#A8A8A8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {sl.phase ? `${sl.phase} — ` : `Slide ${i + 1} — `}{(sl.headline || '').substring(0, 30)}{sl.headline?.length > 30 ? '…' : ''}
                                        </p>
                                        <p style={{ fontSize: 10, color: '#616161', marginTop: 2 }}>{sl.theme === 'light' ? 'Light' : 'Dark'}</p>
                                    </div>
                                    <button onClick={e => { e.stopPropagation(); dl(i); }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#616161', fontSize: 14, flexShrink: 0, padding: '0 2px', transition: 'color 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.color = '#FFFFFF'}
                                        onMouseLeave={e => e.currentTarget.style.color = '#616161'}>↓</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Mobile slide list (horizontal scroll) */}
                    {slides.length > 1 && isMobile && (
                        <div style={{ width: '100%' }}>
                            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#616161', marginBottom: 8 }}>Todos os slides</p>
                            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
                                {slides.map((sl, i) => {
                                    const tsc = 40 / dims.w;
                                    const th = Math.round(40 * (dims.h / dims.w));
                                    return (
                                        <button key={i} onClick={() => setCur(i)}
                                            style={{ flexShrink: 0, borderRadius: 6, border: `2px solid ${i === cur ? '#0CC981' : 'rgba(255,255,255,0.08)'}`, overflow: 'hidden', background: 'none', cursor: 'pointer', padding: 0, width: 40, height: th, transition: 'border-color 0.15s' }}>
                                            <div style={{ width: dims.w, height: dims.h, transform: `scale(${tsc})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
                                                <Slide slide={sl} w={dims.w} h={dims.h} fmt={fmt} idx={i} total={slides.length} templateStyle={tpl} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Caption */}
                {cap && (
                    <div style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#616161' }}>Caption Sugerida</p>
                            <button onClick={copy}
                                style={{ fontSize: 12, padding: '5px 12px', borderRadius: 9999, border: '1px solid rgba(12,201,129,0.3)', background: 'rgba(12,201,129,0.08)', color: '#0CC981', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}>
                                {copied ? 'Copiado!' : 'Copiar Tudo'}
                            </button>
                        </div>
                        <p style={{ fontSize: 13, color: '#A8A8A8', lineHeight: 1.7, marginBottom: 8, whiteSpace: 'pre-wrap' }}>{cap}</p>
                        <p style={{ fontSize: 12, color: '#0CC981', lineHeight: 1.6 }}>{ht}</p>
                    </div>
                )}
            </div>
        );
    };

    /* ──────────────────────────── RENDER ──────────────────────────────────── */
    return (
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100%', overflow: 'hidden', background: '#050505', fontFamily: 'Inter, sans-serif', color: '#FFFFFF' }}>

            {/* ── MOBILE: collapsible controls sheet ── */}
            {isMobile && (
                <div>
                    {/* Toggle pill */}
                    <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#050505' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {[
                                { v: 'post', l: 'Post' }, { v: 'carousel', l: 'Carrossel' }, { v: 'story', l: 'Story' }
                            ].map(f => (
                                <button key={f.v} onClick={() => { setFmt(f.v); setCur(0); }}
                                    style={{ padding: '4px 10px', borderRadius: 99, fontSize: 12, fontFamily: 'Inter, sans-serif', cursor: 'pointer', transition: 'all 0.15s', fontWeight: fmt === f.v ? 600 : 400, background: fmt === f.v ? '#191919' : 'transparent', color: fmt === f.v ? '#FFFFFF' : '#616161', border: `1px solid ${fmt === f.v ? 'rgba(255,255,255,0.12)' : 'transparent'}` }}>
                                    {f.l}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setControlsOpen(v => !v)}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 500, fontFamily: 'Inter, sans-serif', cursor: 'pointer', background: controlsOpen ? 'rgba(12,201,129,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${controlsOpen ? 'rgba(12,201,129,0.25)' : 'rgba(255,255,255,0.1)'}`, color: controlsOpen ? '#0CC981' : '#A8A8A8', transition: 'all 0.15s' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" /><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                            {controlsOpen ? 'Fechar' : 'Configurar'}
                        </button>
                    </div>

                    {/* Expandable panel */}
                    <div className="pm-controls-sheet" style={{ maxHeight: controlsOpen ? 700 : 0, overflowY: controlsOpen ? 'auto' : 'hidden' }}>
                        <div style={{ padding: '16px 16px 20px' }}>
                            <ControlsContent {...controlsProps} />
                        </div>
                    </div>
                </div>
            )}

            {/* ── DESKTOP: left sidebar ── */}
            {!isMobile && (
                <div style={{ width: 240, flexShrink: 0, background: '#050505', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                    <div style={{ padding: '16px 14px' }}>
                        <ControlsContent {...controlsProps} />
                    </div>
                </div>
            )}

            {/* ── CANVAS ── */}
            <div style={{ flex: 1, overflowY: 'auto', background: '#050505', display: 'flex', flexDirection: 'column' }}>
                {renderCanvas()}
            </div>

            {/* Export targets — clipped to 0×0 at top-left so html-to-image captures children at exact true size */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: -9999 }}>
                {slides.map((sl, i) => (
                    <div key={i} id={`exp${i}`} style={{ width: dims.w, height: dims.h, overflow: 'hidden', fontFamily: "'Satoshi',sans-serif", position: 'relative' }}>
                        <Slide slide={sl} w={dims.w} h={dims.h} fmt={fmt} idx={i} total={slides.length} templateStyle={tpl} />
                    </div>
                ))}
            </div>
        </div>
    );
}
