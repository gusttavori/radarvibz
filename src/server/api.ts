/**
 * Radar Vibz - REST API Express Router
 * Endpoints completos e organizados por responsabilidade
 */

import { Router, Request, Response } from 'express';
import { db } from './database';
import { monitoringEngine } from './services/monitoringEngine';
import { aiAnalysisService } from './services/publicationAnalysisService';
import { notificationService } from './services/notificationService';
import { discoveryService } from './services/discoveryService';
import { MetaInstagramProvider } from './services/instagramProvider';
import { ProfileCategory } from '../types/radar';

export const apiRouter = Router();

// ==========================================
// 1. DASHBOARD
// ==========================================
apiRouter.get('/dashboard/stats', (_req: Request, res: Response) => {
  try {
    const stats = db.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro ao obter estatísticas' });
  }
});

// ==========================================
// 2. PERFIS MONITORADOS
// ==========================================
apiRouter.get('/profiles', (req: Request, res: Response) => {
  try {
    const { category, city, status, search } = req.query;
    const profiles = db.getProfiles({
      category: category as string,
      city: city as string,
      status: status as string,
      search: search as string
    });
    res.json({ success: true, data: profiles, total: profiles.length });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro ao listar perfis' });
  }
});

apiRouter.get('/profiles/:id', (req: Request, res: Response) => {
  try {
    const profile = db.getProfileById(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Perfil não encontrado' });
    }
    const publications = db.getPublications({ profileId: profile.id });
    const opportunities = db.getOpportunities().filter(o => o.profileId === profile.id || o.username === profile.username);

    res.json({
      success: true,
      data: {
        profile,
        publications,
        opportunities
      }
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro ao buscar perfil' });
  }
});

apiRouter.post('/profiles', (req: Request, res: Response) => {
  try {
    const { username, displayName, category, city, state, description, internalNotes, integrationMethod, followersCount } = req.body;

    if (!username || !displayName || !category || !city) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: Nome de usuário (@), Nome de exibição, Categoria e Cidade.'
      });
    }

    const result = db.createProfile({
      username,
      displayName,
      profileUrl: `https://instagram.com/${username.replace(/^@/, '')}`,
      category,
      city,
      state: state || 'BA',
      description: description || '',
      internalNotes: internalNotes || '',
      monitoringStatus: 'active',
      integrationMethod: integrationMethod || 'demo_simulation',
      followersCount: Number(followersCount) || 0
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro ao cadastrar perfil' });
  }
});

apiRouter.put('/profiles/:id', (req: Request, res: Response) => {
  try {
    const result = db.updateProfile(req.params.id, req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro ao atualizar perfil' });
  }
});

apiRouter.delete('/profiles/:id', (req: Request, res: Response) => {
  try {
    const deleted = db.deleteProfile(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Perfil não encontrado para exclusão' });
    }
    res.json({ success: true, message: 'Perfil removido com sucesso' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro ao deletar perfil' });
  }
});

// Importação em massa por CSV
apiRouter.post('/profiles/import-csv', (req: Request, res: Response) => {
  try {
    const { csvContent } = req.body;
    if (!csvContent || typeof csvContent !== 'string') {
      return res.status(400).json({ success: false, error: 'Conteúdo CSV inválido ou não fornecido.' });
    }

    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      return res.status(400).json({ success: false, error: 'O arquivo CSV precisa ter cabeçalho e pelo menos 1 linha de dados.' });
    }

    // Expected format: username,displayName,category,city,state,description
    const header = lines[0].toLowerCase();
    const delimiter = header.includes(';') ? ';' : ',';

    let importedCount = 0;
    let duplicateCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
      const [rawUser, displayName, category, city, state, description] = cols;

      if (!rawUser) continue;
      const cleanUser = rawUser.replace(/^@/, '');

      const existing = db.getProfileByUsername(cleanUser);
      if (existing) {
        duplicateCount++;
        continue;
      }

      const resInsert = db.createProfile({
        username: cleanUser,
        displayName: displayName || cleanUser,
        profileUrl: `https://instagram.com/${cleanUser}`,
        category: (category as ProfileCategory) || 'Outros',
        city: city || 'Vitória da Conquista',
        state: state || 'BA',
        description: description || '',
        monitoringStatus: 'active',
        integrationMethod: 'demo_simulation'
      });

      if (resInsert.success) {
        importedCount++;
      } else {
        errors.push(`Linha ${i + 1} (@${cleanUser}): ${resInsert.error}`);
      }
    }

    res.json({
      success: true,
      importedCount,
      duplicateCount,
      errorsCount: errors.length,
      errors: errors.slice(0, 5)
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro ao importar CSV' });
  }
});

// ==========================================
// 3. MONITORAMENTO DO INSTAGRAM
// ==========================================
apiRouter.post('/monitoring/run', async (_req: Request, res: Response) => {
  try {
    const result = await monitoringEngine.runCycleNow();
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    res.status(400).json({ success: false, error: err instanceof Error ? err.message : 'Falha ao executar ciclo de monitoramento' });
  }
});

apiRouter.get('/monitoring/status', (_req: Request, res: Response) => {
  const settings = db.getSettings();
  const lastLog = db.getMonitoringLogs(1)[0];
  res.json({
    success: true,
    data: {
      isBusy: monitoringEngine.isBusy(),
      settings: settings.monitoring,
      providerMode: settings.instagram.providerMode,
      lastExecution: lastLog || null
    }
  });
});

apiRouter.get('/monitoring/logs', (_req: Request, res: Response) => {
  const logs = db.getMonitoringLogs(50);
  res.json({ success: true, data: logs });
});

// ==========================================
// 4. PUBLICAÇÕES
// ==========================================
apiRouter.get('/publications', (req: Request, res: Response) => {
  try {
    const { profileId, mediaType, relevance, analysisStatus, isReviewed, search } = req.query;
    const pubs = db.getPublications({
      profileId: profileId as string,
      mediaType: mediaType as string,
      relevance: relevance as string,
      analysisStatus: analysisStatus as string,
      isReviewed: isReviewed !== undefined ? isReviewed === 'true' : undefined,
      search: search as string
    });
    res.json({ success: true, data: pubs, total: pubs.length });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro ao listar publicações' });
  }
});

apiRouter.get('/publications/:id', (req: Request, res: Response) => {
  const pub = db.getPublicationById(req.params.id);
  if (!pub) {
    return res.status(404).json({ success: false, error: 'Publicação não encontrada' });
  }
  const opp = db.getOpportunities().find(o => o.publicationId === pub.id);
  res.json({ success: true, data: { publication: pub, opportunity: opp || null } });
});

apiRouter.post('/publications/:id/analyze', async (req: Request, res: Response) => {
  try {
    const pub = db.getPublicationById(req.params.id);
    if (!pub) {
      return res.status(404).json({ success: false, error: 'Publicação não encontrada' });
    }

    const profile = db.getProfileById(pub.profileId);
    const analysis = await aiAnalysisService.analyzePublication({
      caption: pub.caption,
      username: pub.username,
      category: profile?.category,
      city: profile?.city,
      publishedAt: pub.publishedAt
    });

    const updated = db.updatePublication(pub.id, {
      analysisStatus: 'analyzed',
      relevance: analysis.relevance,
      aiAnalysis: analysis
    });

    // Create opportunity if applicable
    let opp = db.getOpportunities().find(o => o.publicationId === pub.id);
    if (!opp && analysis.is_opportunity && (analysis.relevance === 'high' || analysis.relevance === 'medium')) {
      opp = db.createOpportunity({
        publicationId: pub.id,
        profileId: pub.profileId,
        username: pub.username,
        eventName: analysis.event_name || `Evento @${pub.username}`,
        category: analysis.category || profile?.category || 'Evento',
        eventDate: analysis.event_date,
        eventTime: analysis.event_time,
        city: analysis.city || profile?.city || 'Vitória da Conquista',
        venue: analysis.venue || profile?.displayName || null,
        artists: analysis.artists || [],
        summary: analysis.summary,
        originalUrl: pub.originalUrl,
        relevance: analysis.relevance,
        commercialPotential: analysis.commercial_opportunity,
        suggestedAction: analysis.suggested_action,
        status: 'Nova',
        internalNotes: 'Criada a partir de reanálise manual de IA.',
        isDemo: pub.isDemo
      });
    }

    res.json({ success: true, data: { publication: updated, opportunity: opp || null } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Falha na análise da IA' });
  }
});

apiRouter.patch('/publications/:id', (req: Request, res: Response) => {
  const updated = db.updatePublication(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Publicação não encontrada' });
  }
  res.json({ success: true, data: updated });
});

// ==========================================
// 5. OPORTUNIDADES COMERCIAIS (CRM)
// ==========================================
apiRouter.get('/opportunities', (req: Request, res: Response) => {
  try {
    const { status, city, relevance, category, search } = req.query;
    const opps = db.getOpportunities({
      status: status as string,
      city: city as string,
      relevance: relevance as string,
      category: category as string,
      search: search as string
    });
    res.json({ success: true, data: opps, total: opps.length });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro ao listar oportunidades' });
  }
});

apiRouter.get('/opportunities/:id', (req: Request, res: Response) => {
  const opp = db.getOpportunityById(req.params.id);
  if (!opp) {
    return res.status(404).json({ success: false, error: 'Oportunidade não encontrada' });
  }
  const publication = db.getPublicationById(opp.publicationId);
  const profile = db.getProfileById(opp.profileId) || db.getProfileByUsername(opp.username);
  res.json({ success: true, data: { opportunity: opp, publication, profile } });
});

apiRouter.patch('/opportunities/:id', (req: Request, res: Response) => {
  const updated = db.updateOpportunity(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Oportunidade não encontrada' });
  }
  res.json({ success: true, data: updated });
});

apiRouter.post('/opportunities/:id/contact-logs', (req: Request, res: Response) => {
  try {
    const { responsible, channel, notes } = req.body;
    if (!notes || !responsible) {
      return res.status(400).json({ success: false, error: 'Responsável e notas do contato são obrigatórios.' });
    }
    const log = db.addContactLog(req.params.id, {
      responsible,
      channel: channel || 'WhatsApp',
      notes
    });
    if (!log) {
      return res.status(404).json({ success: false, error: 'Oportunidade não encontrada' });
    }
    res.status(201).json({ success: true, data: log });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro ao registrar contato' });
  }
});

// ==========================================
// 6. DESCOBERTA DE PERFIS CANDIDATOS
// ==========================================
apiRouter.get('/discovery/candidates', (req: Request, res: Response) => {
  const { status } = req.query;
  const list = db.getCandidates(status as string);
  res.json({ success: true, data: list, total: list.length });
});

apiRouter.post('/discovery/search', async (req: Request, res: Response) => {
  try {
    const { city, category, keyword } = req.body;
    const candidates = await discoveryService.discoverCandidates({ city, category, keyword });
    res.json({ success: true, data: candidates, count: candidates.length });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Falha na busca de descoberta' });
  }
});

apiRouter.post('/discovery/candidates/:id/approve', (req: Request, res: Response) => {
  const result = db.approveCandidate(req.params.id);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json({ success: true, data: result.profile, message: 'Candidato aprovado e adicionado aos Perfis Monitorados!' });
});

apiRouter.post('/discovery/candidates/:id/reject', (req: Request, res: Response) => {
  const ok = db.rejectCandidate(req.params.id);
  if (!ok) {
    return res.status(404).json({ success: false, error: 'Candidato não encontrado' });
  }
  res.json({ success: true, message: 'Candidato rejeitado.' });
});

apiRouter.post('/discovery/candidates', (req: Request, res: Response) => {
  const { username, displayName, probableCategory, city, state, justification, source } = req.body;
  if (!username || !displayName) {
    return res.status(400).json({ success: false, error: 'Usuário e nome de exibição são obrigatórios.' });
  }
  const cand = db.addCandidate({
    username,
    displayName,
    probableCategory: probableCategory || 'Bar',
    city: city || 'Vitória da Conquista',
    state: state || 'BA',
    justification: justification || 'Adicionado manualmente pela equipe',
    source: source || 'Entrada Manual',
    isDemo: false
  });
  res.status(201).json({ success: true, data: cand });
});

// ==========================================
// 7. NOTIFICAÇÕES & TELEGRAM
// ==========================================
apiRouter.post('/notifications/test', async (req: Request, res: Response) => {
  try {
    const { botToken, chatId } = req.body;
    const result = await notificationService.sendTestNotification(botToken, chatId);
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Erro ao testar Telegram' });
  }
});

apiRouter.post('/notifications/dispatch/:opportunityId', async (req: Request, res: Response) => {
  try {
    const opp = db.getOpportunityById(req.params.opportunityId);
    if (!opp) {
      return res.status(404).json({ success: false, message: 'Oportunidade não encontrada' });
    }
    const result = await notificationService.notifyOpportunity(opp);
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Erro ao despachar notificação' });
  }
});

// ==========================================
// 8. CONFIGURAÇÕES & DIAGNÓSTICO
// ==========================================
apiRouter.get('/settings', (_req: Request, res: Response) => {
  const settings = db.getSettings();
  // Mask secrets in response
  const sanitized = {
    ...settings,
    instagram: {
      ...settings.instagram,
      accessToken: settings.instagram.accessToken ? '••••••••••••••••' : '',
      appSecret: settings.instagram.appSecret ? '••••••••••••••••' : ''
    },
    telegram: {
      ...settings.telegram,
      botToken: settings.telegram.botToken ? '••••••••••••••••' : ''
    }
  };
  res.json({ success: true, data: sanitized });
});

apiRouter.put('/settings', (req: Request, res: Response) => {
  try {
    const updates = req.body;
    // Don't overwrite if masked
    if (updates.instagram?.accessToken?.includes('•••')) {
      delete updates.instagram.accessToken;
    }
    if (updates.instagram?.appSecret?.includes('•••')) {
      delete updates.instagram.appSecret;
    }
    if (updates.telegram?.botToken?.includes('•••')) {
      delete updates.telegram.botToken;
    }

    const saved = db.updateSettings(updates);
    res.json({ success: true, data: saved });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Falha ao salvar configurações' });
  }
});

apiRouter.post('/settings/test-instagram', async (req: Request, res: Response) => {
  try {
    const current = db.getSettings();
    const token = req.body.accessToken || current.instagram.accessToken;
    const pageId = req.body.pageId || current.instagram.pageId;
    const apiVersion = req.body.apiVersion || current.instagram.apiVersion || 'v21.0';

    const provider = new MetaInstagramProvider();
    const result = await provider.testConnection({ accessToken: token, pageId, apiVersion });
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Erro no teste da Meta API' });
  }
});

apiRouter.post('/settings/test-gemini', async (req: Request, res: Response) => {
  try {
    const testCaption = req.body.sampleCaption || 'GRANDE SHOW DE VERÃO! Dia 20 de Novembro em Vitória da Conquista com Banda Som da Serra. Ingressos à venda no 1º lote!';
    const result = await aiAnalysisService.analyzePublication({
      caption: testCaption,
      username: 'teste_radar_vibz',
      publishedAt: new Date().toISOString()
    });
    res.json({ success: true, data: result, hasApiKey: !!process.env.GEMINI_API_KEY });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro no teste do Gemini' });
  }
});

apiRouter.post('/settings/reset-demo', (_req: Request, res: Response) => {
  db.resetToDemoData();
  res.json({ success: true, message: 'Dados demonstrativos restaurados com sucesso!' });
});

apiRouter.post('/settings/clear-demo', (_req: Request, res: Response) => {
  db.clearDemoData();
  res.json({ success: true, message: 'Dados demonstrativos removidos.' });
});

apiRouter.get('/settings/export-backup', (_req: Request, res: Response) => {
  const fullBackup = db.exportFullBackup();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=radar_vibz_backup.json');
  res.send(JSON.stringify(fullBackup, null, 2));
});

// ==========================================
// 9. AUDIT & SISTEMA LOGS
// ==========================================
apiRouter.get('/logs', (_req: Request, res: Response) => {
  const sysLogs = db.getSystemLogs(100);
  const monLogs = db.getMonitoringLogs(50);
  res.json({ success: true, data: { systemLogs: sysLogs, monitoringLogs: monLogs } });
});
