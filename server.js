import cors from 'cors';
import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '4mb' }));

const db = neon(process.env.DATABASE_URL);
const JWT_SECRET  = process.env.JWT_SECRET || 'dev_secret_change_me';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const PLANS       = { trial: 10, starter: 20, pro: 100, agency: 500 };
const DAILY_LIMIT = 3; // Global: 3 posts per user per day, resets at 00:00

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function slugify(name) {
    return name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
}

function auth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Não autenticado' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Token inválido ou expirado' });
    }
}

function getMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getToday() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

async function anthropic(body) {
    if (!ANTHROPIC_KEY) throw new Error('ANTHROPIC_API_KEY não configurada no servidor');
    const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_KEY,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
    });
    if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Anthropic API error ${r.status}`);
    }
    return r.json();
}

/* ─── Research step: get real data before generation ─────────────────── */
const OPENERS = [
    'Comece com uma pergunta provocativa que desafia uma crença comum',
    'Comece com um dado estatístico surpreendente e específico',
    'Comece com uma afirmação polêmica ou contra-intuitiva',
    'Comece com uma analogia forte e inesperada',
    'Comece com um cenário hipotético impactante',
    'Comece com uma comparação de antes/depois com números',
    'Comece com uma verdade desconfortável do setor',
    'Comece com uma promessa concreta e mensurável',
];

async function researchTopic(topic, segment, tags) {
    try {
        const result = await anthropic({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 500,
            temperature: 1,
            messages: [{
                role: 'user',
                content: `Forneça 4 dados estatísticos reais e específicos sobre "${topic}" no contexto de "${segment}" no Brasil.
Use apenas dados que você tem alta confiança que são reais e verificáveis.
Inclua percentuais, números concretos ou comparações mensuráveis.
Contexto adicional: ${tags?.slice(0, 5).join(', ') || topic}

Retorne APENAS a lista, sem introdução, sem fonte, sem explicação:
- [dado 1 com número específico]
- [dado 2 com número específico]
- [dado 3 com número específico]
- [dado 4 com número específico]`,
            }],
        });
        const text = result.content?.find(c => c.type === 'text')?.text || '';
        return text.trim();
    } catch {
        return ''; // Não bloqueia a geração
    }
}

/* ─── AUTH ────────────────────────────────────────────────────────────── */
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, name, companyName } = req.body;
        if (!email || !password || !companyName)
            return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
        if (password.length < 6)
            return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });

        const existing = await db`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
        if (existing.length) return res.status(409).json({ error: 'Email já cadastrado' });

        const hash = await bcrypt.hash(password, 10);

        let baseSlug = slugify(companyName);
        let slug = baseSlug, suffix = 1;
        while (true) {
            const taken = await db`SELECT id FROM tenants WHERE slug = ${slug}`;
            if (!taken.length) break;
            slug = `${baseSlug}-${suffix++}`;
        }

        const tenantId = randomUUID(), userId = randomUUID();
        await db`INSERT INTO tenants (id, slug, name) VALUES (${tenantId}, ${slug}, ${companyName})`;
        await db`INSERT INTO users (id, tenant_id, email, password_hash, name, role)
                 VALUES (${userId}, ${tenantId}, ${email.toLowerCase()}, ${hash},
                         ${name || email.split('@')[0]}, 'owner')`;

        const token = jwt.sign(
            { userId, tenantId, tenantSlug: slug, role: 'owner', email: email.toLowerCase() },
            JWT_SECRET, { expiresIn: '30d' }
        );
        res.json({ token, user: { id: userId, email: email.toLowerCase(), name, role: 'owner' }, tenant: { id: tenantId, slug, name: companyName } });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: err.message || 'Erro interno' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios' });

        const rows = await db`
            SELECT u.*, t.slug as tenant_slug, t.name as tenant_name,
                   t.description, t.segment, t.target_audience, t.tone,
                   t.default_cta, t.platforms, t.tags, t.brand_config, t.logo_url,
                   t.plan, t.trial_ends_at
            FROM users u
            JOIN tenants t ON u.tenant_id = t.id
            WHERE u.email = ${email.toLowerCase()}`;

        if (!rows.length) return res.status(401).json({ error: 'Email ou senha inválidos' });
        const user = rows[0];
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return res.status(401).json({ error: 'Email ou senha inválidos' });

        const token = jwt.sign(
            { userId: user.id, tenantId: user.tenant_id, tenantSlug: user.tenant_slug, role: user.role, email: user.email },
            JWT_SECRET, { expiresIn: '30d' }
        );
        res.json({
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            tenant: {
                id: user.tenant_id, slug: user.tenant_slug, name: user.tenant_name,
                description: user.description, segment: user.segment,
                target_audience: user.target_audience, tone: user.tone,
                default_cta: user.default_cta, platforms: user.platforms,
                tags: user.tags, brand_config: user.brand_config, logo_url: user.logo_url,
                plan: user.plan, trial_ends_at: user.trial_ends_at,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message || 'Erro interno' });
    }
});

app.get('/api/auth/me', auth, async (req, res) => {
    try {
        const rows = await db`
            SELECT u.id, u.email, u.name, u.role,
                   t.id as tid, t.slug, t.name as tname,
                   t.description, t.segment, t.target_audience,
                   t.tone, t.default_cta, t.platforms, t.tags,
                   t.brand_config, t.logo_url, t.plan, t.trial_ends_at
            FROM users u
            JOIN tenants t ON u.tenant_id = t.id
            WHERE u.id = ${req.user.userId}`;
        if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado' });
        const r = rows[0];
        res.json({
            user: { id: r.id, email: r.email, name: r.name, role: r.role },
            tenant: {
                id: r.tid, slug: r.slug, name: r.tname,
                description: r.description, segment: r.segment,
                target_audience: r.target_audience, tone: r.tone,
                default_cta: r.default_cta, platforms: r.platforms,
                tags: r.tags, brand_config: r.brand_config, logo_url: r.logo_url,
                plan: r.plan, trial_ends_at: r.trial_ends_at,
            },
        });
    } catch (err) {
        console.error('Me error:', err);
        res.status(500).json({ error: err.message || 'Erro interno' });
    }
});

/* ─── TENANTS ─────────────────────────────────────────────────────────── */
app.get('/api/tenants/:slug', auth, async (req, res) => {
    try {
        const rows = await db`SELECT * FROM tenants WHERE slug = ${req.params.slug}`;
        if (!rows.length) return res.status(404).json({ error: 'Workspace não encontrado' });
        if (rows[0].id !== req.user.tenantId) return res.status(403).json({ error: 'Acesso negado' });
        res.json(rows[0]);
    } catch (err) {
        console.error('Get tenant error:', err);
        res.status(500).json({ error: err.message || 'Erro interno' });
    }
});

app.patch('/api/tenants/:slug', auth, async (req, res) => {
    try {
        if (req.user.role !== 'owner') return res.status(403).json({ error: 'Apenas o owner pode editar as configurações' });
        const rows = await db`SELECT id FROM tenants WHERE slug = ${req.params.slug}`;
        if (!rows.length || rows[0].id !== req.user.tenantId) return res.status(403).json({ error: 'Acesso negado' });

        const { name, description, segment, target_audience, tone, default_cta, platforms, tags, brand_config, logo_url } = req.body;

        await db`UPDATE tenants SET
            name            = COALESCE(${name ?? null}, name),
            description     = COALESCE(${description ?? null}, description),
            segment         = COALESCE(${segment ?? null}, segment),
            target_audience = COALESCE(${target_audience ?? null}, target_audience),
            tone            = COALESCE(${tone ?? null}, tone),
            default_cta     = COALESCE(${default_cta ?? null}, default_cta),
            platforms       = COALESCE(${platforms ? JSON.stringify(platforms) : null}::text[], platforms),
            tags            = COALESCE(${tags ? JSON.stringify(tags) : null}::text[], tags),
            brand_config    = COALESCE(${brand_config ? JSON.stringify(brand_config) : null}::jsonb, brand_config),
            logo_url        = COALESCE(${logo_url ?? null}, logo_url)
        WHERE id = ${req.user.tenantId}`;

        const updated = await db`SELECT * FROM tenants WHERE id = ${req.user.tenantId}`;
        res.json(updated[0]);
    } catch (err) {
        console.error('Update tenant error:', err);
        res.status(500).json({ error: err.message || 'Erro interno' });
    }
});

/* ─── ONBOARDING ─────────────────────────────────────────────────────── */
app.post('/api/onboarding/step', auth, async (req, res) => {
    try {
        if (req.user.role !== 'owner') return res.status(403).json({ error: 'Apenas o owner pode configurar o workspace' });
        const { name, description, segment, target_audience, tone, default_cta, platforms, tags, brand_config, logo_url } = req.body;

        await db`UPDATE tenants SET
            name            = COALESCE(${name ?? null}, name),
            description     = COALESCE(${description ?? null}, description),
            segment         = COALESCE(${segment ?? null}, segment),
            target_audience = COALESCE(${target_audience ?? null}, target_audience),
            tone            = COALESCE(${tone ?? null}, tone),
            default_cta     = COALESCE(${default_cta ?? null}, default_cta),
            platforms       = COALESCE(${platforms ? JSON.stringify(platforms) : null}::text[], platforms),
            tags            = COALESCE(${tags ? JSON.stringify(tags) : null}::text[], tags),
            brand_config    = CASE
                WHEN ${brand_config ? JSON.stringify(brand_config) : null}::jsonb IS NOT NULL
                THEN brand_config || ${brand_config ? JSON.stringify(brand_config) : '{}'}::jsonb
                ELSE brand_config END,
            logo_url        = COALESCE(${logo_url ?? null}, logo_url)
        WHERE id = ${req.user.tenantId}`;

        res.json({ ok: true });
    } catch (err) {
        console.error('Onboarding step error:', err);
        res.status(500).json({ error: err.message || 'Erro interno' });
    }
});

/* ─── POSTS ───────────────────────────────────────────────────────────── */
app.post('/api/posts/generate', auth, async (req, res) => {
    try {
        // 1. Check daily limit (3/day per user, resets at 00:00)
        const today = getToday();
        const dailyRows = await db`SELECT posts_generated FROM daily_usage WHERE user_id = ${req.user.userId} AND date = ${today}`;
        const dailyUsed = dailyRows[0]?.posts_generated ?? 0;

        if (dailyUsed >= DAILY_LIMIT) {
            return res.status(429).json({
                error: `Limite diário atingido. Você pode criar até ${DAILY_LIMIT} posts por dia. O limite reinicia à meia-noite.`,
                limitReached: true,
                dailyUsed,
                dailyLimit: DAILY_LIMIT,
            });
        }

        // 2. Research step — get real data before generating
        const { messages, model, max_tokens, temperature, systemPrompt, topic, templateStyle } = req.body;
        const tenantRows = await db`SELECT segment, tags FROM tenants WHERE id = ${req.user.tenantId}`;
        const { segment, tags } = tenantRows[0] || {};

        const researchData = await researchTopic(topic || 'conteúdo de marketing', segment, tags);

        // 3. Pick a random opener style for variety
        const opener = OPENERS[Math.floor(Math.random() * OPENERS.length)];

        // 4. Inject research + variety instructions into the user message
        const enrichedMessages = messages.map((m, idx) => {
            if (m.role === 'user' && idx === messages.length - 1) {
                let extra = `\n\nESTILO DE ABERTURA: ${opener}`;
                if (researchData) {
                    extra += `\n\nDADOS REAIS PARA USAR NO CONTEÚDO (incorpore naturalmente, sem citar a fonte):\n${researchData}`;
                }
                if (templateStyle && templateStyle !== 'classic') {
                    const templateInstructions = {
                        impact:    'TEMPLATE VISUAL: IMPACTO — use stat numérico dominante (campo stat obrigatório), headline curto e direto, subheadline mínimo.',
                        contrast:  'TEMPLATE VISUAL: CONTRASTE — estruture como problema vs solução, use items[] para listar 2-3 contrastes claros.',
                        manifesto: 'TEMPLATE VISUAL: MANIFESTO — headline como declaração de posicionamento forte, sem stat, subheadline expande a tese.',
                    };
                    extra += `\n\n${templateInstructions[templateStyle] || ''}`;
                }
                return { ...m, content: m.content + extra };
            }
            return m;
        });

        // 5. Generate
        const result = await anthropic({
            model: model || 'claude-sonnet-4-20250514',
            max_tokens: max_tokens || 2500,
            temperature: temperature ?? 1,
            system: systemPrompt,
            messages: enrichedMessages,
        });

        if (result.error) return res.status(500).json({ error: result.error.message || 'Erro na API da IA' });

        // 6. Increment daily + monthly usage
        await db`INSERT INTO daily_usage (user_id, date, posts_generated)
                 VALUES (${req.user.userId}, ${today}, 1)
                 ON CONFLICT (user_id, date)
                 DO UPDATE SET posts_generated = daily_usage.posts_generated + 1`;

        const month = getMonth();
        await db`INSERT INTO usage (tenant_id, month, posts_generated) VALUES (${req.user.tenantId}, ${month}, 1)
                 ON CONFLICT (tenant_id, month) DO UPDATE SET posts_generated = usage.posts_generated + 1`;

        res.json(result);
    } catch (err) {
        console.error('Generate error:', err);
        res.status(500).json({ error: err.message || 'Erro ao gerar conteúdo' });
    }
});

app.post('/api/posts/save', auth, async (req, res) => {
    try {
        const { format, framework, topic, template_style, slides, caption, hashtags } = req.body;
        const id = randomUUID();
        await db`INSERT INTO posts (id, tenant_id, user_id, format, framework, topic, template_style, slides, caption, hashtags)
                 VALUES (${id}, ${req.user.tenantId}, ${req.user.userId},
                         ${format}, ${framework ?? null}, ${topic ?? null}, ${template_style ?? 'classic'},
                         ${JSON.stringify(slides)}::jsonb, ${caption ?? null}, ${hashtags ?? null})`;
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/posts', auth, async (req, res) => {
    try {
        const rows = await db`
            SELECT id, format, framework, topic, template_style, caption, hashtags, slides, created_at
            FROM posts
            WHERE tenant_id = ${req.user.tenantId}
            ORDER BY created_at DESC LIMIT 20`;
        res.json(rows);
    } catch (err) {
        console.error('List posts error:', err);
        res.status(500).json({ error: err.message || 'Erro interno' });
    }
});

/* ─── USAGE ───────────────────────────────────────────────────────────── */
app.get('/api/usage', auth, async (req, res) => {
    try {
        const month = getMonth();
        const today = getToday();

        const [monthRows, planRows, dailyRows] = await Promise.all([
            db`SELECT posts_generated FROM usage WHERE tenant_id = ${req.user.tenantId} AND month = ${month}`,
            db`SELECT plan FROM tenants WHERE id = ${req.user.tenantId}`,
            db`SELECT posts_generated FROM daily_usage WHERE user_id = ${req.user.userId} AND date = ${today}`,
        ]);

        const plan      = planRows[0]?.plan ?? 'trial';
        const monthUsed = monthRows[0]?.posts_generated ?? 0;
        const dailyUsed = dailyRows[0]?.posts_generated ?? 0;

        res.json({
            used:       monthUsed,
            limit:      PLANS[plan] ?? 10,
            plan,
            dailyUsed,
            dailyLimit: DAILY_LIMIT,
        });
    } catch (err) {
        console.error('Usage error:', err);
        res.status(500).json({ error: err.message || 'Erro interno' });
    }
});

/* ─── PALETTE SUGGESTION ─────────────────────────────────────────────── */
app.post('/api/palette/suggest', auth, async (req, res) => {
    const { name, segment, description, tone } = req.body;
    try {
        const result = await anthropic({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 800,
            temperature: 1,
            messages: [{
                role: 'user',
                content: `Você é um designer de marca especialista. Sugira 3 paletas de cores premium para esta empresa:

Nome: ${name}
Segmento: ${segment}
Descrição: ${description}
Tom: ${tone}

Responda APENAS JSON válido sem markdown:
{"palettes":[{"name":"Nome Criativo","rationale":"Frase curta","primary":"#hex","accent":"#hex","bgDark":"#hex","bgLight":"#hex"}]}

Regras: bgDark muito escuro (<15% luminosidade), bgLight claro (>90%), as 3 paletas distintas.`,
            }],
        });

        const txt = result.content?.find(c => c.type === 'text')?.text || '{}';
        const parsed = JSON.parse(txt.replace(/```json\n?|\n?```/g, '').trim());
        res.json(parsed);
    } catch {
        res.json({ palettes: getFallbackPalettes(segment) });
    }
});

function getFallbackPalettes(segment) {
    const defaults = [
        { name: 'Oceano Profundo', rationale: 'Confiança e inovação', primary: '#0057B7', accent: '#4D9AFF', bgDark: '#040C1A', bgLight: '#F4F6F9' },
        { name: 'Índigo Premium',  rationale: 'Sofisticação criativa', primary: '#6366F1', accent: '#A78BFA', bgDark: '#0A0A1A', bgLight: '#F8F7FF' },
        { name: 'Âmbar Executivo', rationale: 'Energia e resultado',   primary: '#D97706', accent: '#FBBF24', bgDark: '#140C02', bgLight: '#FFFBF0' },
    ];
    return defaults;
}

/* ─── START ───────────────────────────────────────────────────────────── */
if (!process.env.VERCEL) {
    const port = process.env.PORT || 3001;

    // Validate required env vars before accepting requests
    if (!process.env.DATABASE_URL) {
        console.error('❌  DATABASE_URL não definida. Crie um arquivo .env com DATABASE_URL=...');
        process.exit(1);
    }
    if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('⚠️   ANTHROPIC_API_KEY não definida — geração de conteúdo não funcionará.');
    }

    // Quick DB connectivity check
    db`SELECT 1`.then(() => {
        console.log('✅  Database conectado');
    }).catch(err => {
        console.error('❌  Falha ao conectar ao banco de dados:', err.message);
    });

    app.listen(port, () => console.log(`🚀  API rodando em http://localhost:${port}`));
}

export default app;
