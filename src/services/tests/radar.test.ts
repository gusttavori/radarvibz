/**
 * Radar Vibz - Pure Logic & Integration Unit Tests
 * Executado via node:test e tsx
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../server/database';
import { aiAnalysisService } from '../../server/services/publicationAnalysisService';
import { notificationService } from '../../server/services/notificationService';
import { Opportunity } from '../../types/radar';

test('Perfis: Previne cadastro de perfis duplicados com mesmo nome de usuário', () => {
  const initialCount = db.getProfiles().length;
  // Try inserting an existing profile username (e.g. @arena_sudoeste_eventos)
  const result = db.createProfile({
    username: 'arena_sudoeste_eventos',
    displayName: 'Arena Duplicada Teste',
    profileUrl: 'https://instagram.com/arena_sudoeste_eventos',
    category: 'Casa de eventos',
    city: 'Vitória da Conquista',
    state: 'BA',
    description: 'Teste',
    monitoringStatus: 'active',
    integrationMethod: 'demo_simulation'
  });

  assert.equal(result.success, false);
  assert.match(result.error || '', /já está cadastrado/i);
  assert.equal(db.getProfiles().length, initialCount);
});

test('Publicações: Deduplicação estrita por externalId da mídia do Instagram', () => {
  const existingExternalId = 'ig_media_90812301_01';
  const initialTotal = db.getPublications().length;

  const duplicateInsert = db.insertPublication({
    profileId: 'prof-01',
    username: 'arena_sudoeste_eventos',
    externalId: existingExternalId,
    originalUrl: 'https://instagram.com/p/DB123456781',
    mediaType: 'IMAGE',
    caption: 'Tentativa de duplicação',
    publishedAt: '2026-10-29T14:30:00.000Z',
    analysisStatus: 'analyzed',
    relevance: 'high',
    isReviewed: true
  });

  assert.equal(duplicateInsert.created, false);
  assert.equal(duplicateInsert.publication.externalId, existingExternalId);
  assert.equal(db.getPublications().length, initialTotal);
});

test('Inteligência Artificial: Heurística identifica festivais e shows com relevância alta', () => {
  const festivalCaption = 'MEGA FESTIVAL DE VERÃO 2026! ☀️ Dia 18 de Novembro em Vitória da Conquista. Ingressos 1º lote já disponíveis!';
  const result = aiAnalysisService.heuristicAnalysis({
    caption: festivalCaption,
    username: 'produtora_teste',
    category: 'Produtora',
    city: 'Vitória da Conquista',
    publishedAt: '2026-10-29T12:00:00Z'
  });

  assert.equal(result.is_event, true);
  assert.equal(result.is_opportunity, true);
  assert.equal(result.relevance, 'high');
  assert.ok(result.event_name && result.event_name.length > 0);
  assert.ok(result.commercial_opportunity.length > 0);
});

test('Inteligência Artificial: Distingue retrospectivas e avisos sem oportunidade futura', () => {
  const retroCaption = 'Obrigado a todos que compareceram ontem à nossa festa! Que energia linda foi curtir com vocês até o amanhecer.';
  const result = aiAnalysisService.heuristicAnalysis({
    caption: retroCaption,
    username: 'bar_teste',
    category: 'Bar',
    city: 'Vitória da Conquista',
    publishedAt: '2026-10-29T12:00:00Z'
  });

  assert.equal(result.is_event, false);
  assert.equal(result.is_opportunity, false);
  assert.equal(result.relevance, 'low');
  assert.equal(result.category, 'Retrospectiva');
});

test('Descoberta: Aprovação de candidato o transfere para perfis monitorados', () => {
  const testUser = `cand_teste_${Date.now()}`;
  const candidate = db.addCandidate({
    username: testUser,
    displayName: 'Novo Espaço Show [Teste]',
    probableCategory: 'Casa de eventos',
    city: 'Vitória da Conquista',
    state: 'BA',
    justification: 'Show de forró programado',
    source: 'Teste Unitário'
  });

  assert.equal(candidate.status, 'Pendente');

  const approval = db.approveCandidate(candidate.id);
  assert.equal(approval.success, true);
  assert.ok(approval.profile);
  assert.equal(approval.profile?.username, testUser);

  // Verify in profiles list
  const createdProfile = db.getProfileByUsername(testUser);
  assert.ok(createdProfile);
  assert.equal(createdProfile?.monitoringStatus, 'active');
});

test('Telegram: Formatação da notificação respeita padrão editorial do Radar Vibz', () => {
  const sampleOpp: Opportunity = {
    id: 'opp-test-123',
    publicationId: 'pub-test-1',
    profileId: 'prof-test-1',
    username: 'arena_teste',
    eventName: 'Micareta Universitária Conquista',
    category: 'Festa',
    eventDate: '2026-11-20',
    eventTime: '22:00',
    city: 'Vitória da Conquista',
    venue: 'Arena Teste',
    artists: ['Banda Bahia', 'DJ Conquista'],
    summary: 'Grande micareta com trio elétrico.',
    originalUrl: 'https://instagram.com/p/test123',
    relevance: 'high',
    commercialPotential: 'Venda de 2.000 abadás com taxa Vibz.',
    suggestedAction: 'Contatar comissão de formatura.',
    detectedAt: '2026-10-29T19:00:00Z',
    status: 'Nova',
    internalNotes: '',
    contactLogs: []
  };

  const message = notificationService.formatOpportunityMessage(sampleOpp);
  assert.match(message, /RADAR VIBZ/);
  assert.match(message, /NOVA OPORTUNIDADE IDENTIFICADA/);
  assert.match(message, /@arena_teste/);
  assert.match(message, /Micareta Universitária Conquista/);
  assert.match(message, /ALTA/);
});
