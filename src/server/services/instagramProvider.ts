/**
 * Radar Vibz - Instagram Provider Interface & Implementations
 * Meta Graph API (Oficial) & Demo Simulation Provider
 */

import { Profile, Publication, IntegrationMethod } from '../../types/radar';

export interface InstagramMediaItem {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  permalink: string;
  timestamp: string;
}

export interface InstagramProvider {
  name: IntegrationMethod;
  testConnection(config: { accessToken: string; pageId: string; apiVersion: string }): Promise<{
    success: boolean;
    message: string;
    accountDetails?: Record<string, unknown>;
  }>;
  fetchProfilePosts(
    profile: Profile,
    config: { accessToken: string; pageId: string; apiVersion: string }
  ): Promise<{
    success: boolean;
    posts: Omit<Publication, 'id' | 'detectedAt'>[];
    error?: string;
  }>;
}

/**
 * Provedor Oficial Meta Graph API com Business Discovery
 * Não realiza scraping nem bypass de credenciais.
 */
export class MetaInstagramProvider implements InstagramProvider {
  public name: IntegrationMethod = 'meta_graph_api';

  async testConnection(config: { accessToken: string; pageId: string; apiVersion: string }): Promise<{
    success: boolean;
    message: string;
    accountDetails?: Record<string, unknown>;
  }> {
    if (!config.accessToken || !config.pageId) {
      return {
        success: false,
        message: 'Credenciais ausentes. Forneça o Access Token e o Page ID da conta Business no Meta for Developers.'
      };
    }

    try {
      const url = `https://graph.facebook.com/${config.apiVersion || 'v21.0'}/${config.pageId}?fields=name,username,instagram_business_account&access_token=${config.accessToken}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'RadarVibz-Client/1.0' } });
      const data = await res.json();

      if (!res.ok || data.error) {
        return {
          success: false,
          message: data.error?.message || 'Falha ao autenticar na Meta Graph API.'
        };
      }

      return {
        success: true,
        message: `Conexão bem-sucedida! Página: ${data.name || data.id}`,
        accountDetails: data
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Erro de rede ao conectar com a Meta Graph API.'
      };
    }
  }

  async fetchProfilePosts(
    profile: Profile,
    config: { accessToken: string; pageId: string; apiVersion: string }
  ): Promise<{
    success: boolean;
    posts: Omit<Publication, 'id' | 'detectedAt'>[];
    error?: string;
  }> {
    if (!config.accessToken || !config.pageId) {
      return {
        success: false,
        posts: [],
        error: 'Meta Graph API não configurada. Configure o Access Token nas Configurações.'
      };
    }

    try {
      const cleanUsername = profile.username.replace(/^@/, '').trim();
      // Endpoint oficial Business Discovery
      const fields = `business_discovery.username(${cleanUsername}){name,username,followers_count,media.limit(10){id,caption,media_type,media_url,permalink,timestamp}}`;
      const url = `https://graph.facebook.com/${config.apiVersion || 'v21.0'}/${config.pageId}?fields=${encodeURIComponent(fields)}&access_token=${config.accessToken}`;

      const res = await fetch(url, { headers: { 'User-Agent': 'RadarVibz-Client/1.0' } });
      const data = await res.json();

      if (!res.ok || data.error) {
        return {
          success: false,
          posts: [],
          error: data.error?.message || 'Erro na consulta do perfil via Business Discovery.'
        };
      }

      const mediaList: InstagramMediaItem[] = data.business_discovery?.media?.data || [];
      const posts: Omit<Publication, 'id' | 'detectedAt'>[] = mediaList.map(item => ({
        profileId: profile.id,
        username: profile.username,
        externalId: item.id,
        originalUrl: item.permalink || `https://instagram.com/p/${item.id}`,
        mediaType: item.media_type === 'CAROUSEL_ALBUM' ? 'CAROUSEL_ALBUM' : item.media_type === 'VIDEO' ? 'VIDEO' : 'IMAGE',
        caption: item.caption || '',
        publishedAt: item.timestamp || new Date().toISOString(),
        mediaUrl: item.media_url,
        thumbnailUrl: item.media_url,
        analysisStatus: 'pending',
        relevance: 'none',
        isReviewed: false,
        isDemo: false
      }));

      return { success: true, posts };
    } catch (err: unknown) {
      return {
        success: false,
        posts: [],
        error: err instanceof Error ? err.message : 'Falha na requisição à Meta API.'
      };
    }
  }
}

/**
 * Provedor de Demonstração e Simulação
 * Permite demonstrar o ciclo de monitoramento sem requisições reais ou quando as credenciais ainda não foram fornecidas.
 */
export class DemoSimulationProvider implements InstagramProvider {
  public name: IntegrationMethod = 'demo_simulation';

  async testConnection(): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'Modo de Demonstração pronto. Simula publicações fictícias no Sudoeste Baiano.'
    };
  }

  async fetchProfilePosts(profile: Profile): Promise<{
    success: boolean;
    posts: Omit<Publication, 'id' | 'detectedAt'>[];
    error?: string;
  }> {
    // Generate 1-2 realistic mock candidate posts tailored to profile category
    const now = new Date();
    const cleanUser = profile.username.replace(/^@/, '');
    const posts: Omit<Publication, 'id' | 'detectedAt'>[] = [];

    // Fictional realistic templates
    const templates: Record<string, { caption: string; type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' }[]> = {
      'Casa de eventos': [
        {
          caption: `GRANDIOSO FESTIVAL DE FIM DE ANO 2026! 🎆 No dia 19 de Dezembro de 2026, a ${profile.displayName} recebe o mega show com grandes nomes da música baiana. Ingressos antecipados disponíveis em breve no Vibz. Garanta sua presença em ${profile.city}!`,
          type: 'IMAGE'
        }
      ],
      'Bar': [
        {
          caption: `QUINTA ACÚSTICA no ${profile.displayName}! Nesta quinta 05 de Novembro tem voz e violão a partir das 19h30. Chopp em dobro até as 21h. Venha curtir a noite em ${profile.city}! Reservas pelo direct.`,
          type: 'IMAGE'
        }
      ],
      'Produtora': [
        {
          caption: `NOVA DATA CONFIRMADA! 🚀 A maior micareta indoor do Sudoeste Baiano desembarca em ${profile.city} no dia 16 de Janeiro de 2027. Primeiro lote de ingressos será liberado na próxima semana. Fique ligado!`,
          type: 'CAROUSEL_ALBUM'
        }
      ],
      'Artista': [
        {
          caption: `Passando para agradecer o carinho de todos em ${profile.city}! Próxima parada neste sábado com show ao vivo no Lounge Imperial. Quem vem cantar comigo?`,
          type: 'VIDEO'
        }
      ],
      'Banda': [
        {
          caption: `Arrasta-pé garantido neste fim de semana! Sábado estamos em ${profile.city} fazendo aquele piseiro diferenciado. Início às 22h. Não percam!`,
          type: 'IMAGE'
        }
      ]
    };

    const chosenList = templates[profile.category] || templates['Bar'];
    const chosen = chosenList[Math.floor(Math.random() * chosenList.length)];

    const simId = `sim_${cleanUser}_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours()}`;

    posts.push({
      profileId: profile.id,
      username: profile.username,
      externalId: simId,
      originalUrl: `https://instagram.com/p/${simId}`,
      mediaType: chosen.type,
      caption: chosen.caption,
      publishedAt: now.toISOString(),
      mediaUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop',
      analysisStatus: 'pending',
      relevance: 'none',
      isReviewed: false,
      isDemo: true
    });

    return {
      success: true,
      posts
    };
  }
}
