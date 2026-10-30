/**
 * Radar Vibz - Monitoring Engine
 * Motor de orquestração periódica e varredura de perfis do Instagram
 */

import { db } from '../database';
import { MetaInstagramProvider, DemoSimulationProvider, InstagramProvider } from './instagramProvider';
import { aiAnalysisService } from './publicationAnalysisService';
import { notificationService } from './notificationService';
import { Profile } from '../../types/radar';

export class MonitoringEngine {
  private metaProvider: MetaInstagramProvider;
  private demoProvider: DemoSimulationProvider;
  private isRunning: boolean = false;

  constructor() {
    this.metaProvider = new MetaInstagramProvider();
    this.demoProvider = new DemoSimulationProvider();
  }

  private getActiveProvider(): InstagramProvider {
    const settings = db.getSettings();
    if (settings.instagram.providerMode === 'meta_graph_api') {
      return this.metaProvider;
    }
    return this.demoProvider;
  }

  /**
   * Executa uma rodada completa de verificação para os perfis ativos
   */
  async runCycleNow(): Promise<{
    durationMs: number;
    profilesChecked: number;
    newPostsFound: number;
    newOpportunitiesCount: number;
    errorsCount: number;
    details: string;
  }> {
    if (this.isRunning) {
      throw new Error('Uma varredura de monitoramento já está em andamento no momento.');
    }

    this.isRunning = true;
    const startTime = Date.now();
    const settings = db.getSettings();
    const activeProfiles = db.getProfiles({ status: 'active' }).slice(0, settings.monitoring.maxProfilesPerCycle);

    let profilesChecked = 0;
    let newPostsFound = 0;
    let newOpportunitiesCount = 0;
    let errorsCount = 0;
    const errorDetails: string[] = [];

    const provider = this.getActiveProvider();
    db.logSystem(
      'MONITORING',
      'INFO',
      `Iniciando ciclo de varredura com ${activeProfiles.length} perfis ativos via ${provider.name}.`
    );

    for (const profile of activeProfiles) {
      try {
        profilesChecked++;
        const fetchResult = await provider.fetchProfilePosts(profile, {
          accessToken: settings.instagram.accessToken,
          pageId: settings.instagram.pageId,
          apiVersion: settings.instagram.apiVersion
        });

        if (!fetchResult.success) {
          errorsCount++;
          errorDetails.push(`@${profile.username}: ${fetchResult.error || 'Erro desconhecido'}`);
          db.updateProfile(profile.id, { monitoringStatus: 'failed' });
          continue;
        }

        // Process newly detected posts
        for (const postData of fetchResult.posts) {
          const insertResult = db.insertPublication(postData);

          if (insertResult.created) {
            newPostsFound++;
            const publication = insertResult.publication;

            // Trigger AI analysis if enabled
            if (settings.gemini.autoAnalyzeNewPosts) {
              try {
                const analysis = await aiAnalysisService.analyzePublication({
                  caption: publication.caption,
                  username: publication.username,
                  category: profile.category,
                  city: profile.city,
                  publishedAt: publication.publishedAt
                });

                // Update publication with AI result
                const updatedPub = db.updatePublication(publication.id, {
                  analysisStatus: 'analyzed',
                  relevance: analysis.relevance,
                  aiAnalysis: analysis
                });

                // Create commercial opportunity if qualifies
                if (analysis.is_opportunity && (analysis.relevance === 'high' || analysis.relevance === 'medium')) {
                  const opp = db.createOpportunity({
                    publicationId: publication.id,
                    profileId: profile.id,
                    username: profile.username,
                    eventName: analysis.event_name || `Evento em ${profile.displayName}`,
                    category: analysis.category || profile.category,
                    eventDate: analysis.event_date,
                    eventTime: analysis.event_time,
                    city: analysis.city || profile.city,
                    venue: analysis.venue || profile.displayName,
                    artists: analysis.artists || [],
                    summary: analysis.summary,
                    originalUrl: publication.originalUrl,
                    relevance: analysis.relevance,
                    commercialPotential: analysis.commercial_opportunity,
                    suggestedAction: analysis.suggested_action,
                    status: 'Nova',
                    internalNotes: 'Detectada automaticamente pelo motor de monitoramento do Radar Vibz.',
                    isDemo: profile.isDemo
                  });

                  newOpportunitiesCount++;

                  // Telegram notification if relevant
                  if (analysis.relevance === 'high' && settings.telegram.enabled) {
                    await notificationService.notifyOpportunity(opp);
                  }
                }
              } catch (aiErr) {
                console.warn(`Erro na análise de IA para post ${publication.id}:`, aiErr);
              }
            }
          }
        }

        // Update profile status & last checked
        db.updateProfile(profile.id, {
          lastCheckedAt: new Date().toISOString(),
          monitoringStatus: 'active'
        });
      } catch (err: unknown) {
        errorsCount++;
        errorDetails.push(`@${profile.username}: ${err instanceof Error ? err.message : 'Falha na verificação'}`);
      }
    }

    const durationMs = Date.now() - startTime;
    this.isRunning = false;

    // Update settings timestamps
    const now = new Date();
    const nextRun = new Date(now.getTime() + settings.monitoring.intervalMinutes * 60 * 1000);
    db.updateSettings({
      monitoring: {
        ...settings.monitoring,
        lastRunAt: now.toISOString(),
        nextRunAt: nextRun.toISOString()
      }
    });

    const status = errorsCount === 0 ? 'success' : errorsCount < profilesChecked ? 'partial_failure' : 'failed';
    const details = `Varredura finalizada em ${durationMs}ms. ${profilesChecked} perfis verificados, ${newPostsFound} novas publicações, ${newOpportunitiesCount} novas oportunidades comerciais. ${
      errorsCount > 0 ? `Falhas (${errorsCount}): ${errorDetails.slice(0, 3).join('; ')}` : 'Sem erros.'
    }`;

    db.addMonitoringLog({
      durationMs,
      profilesChecked,
      newPostsFound,
      errorsCount,
      status,
      details,
      provider: provider.name
    });

    db.logSystem(
      'MONITORING',
      status === 'success' ? 'SUCCESS' : 'WARN',
      `Ciclo de varredura concluído. ${newPostsFound} publicações novas encontradas.`
    );

    return {
      durationMs,
      profilesChecked,
      newPostsFound,
      newOpportunitiesCount,
      errorsCount,
      details
    };
  }

  public isBusy(): boolean {
    return this.isRunning;
  }
}

export const monitoringEngine = new MonitoringEngine();
