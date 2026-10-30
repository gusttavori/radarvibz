/**
 * Radar Vibz - Discovery Service
 * Motor de busca e identificação de perfis candidatos no Sudoeste Baiano
 */

import { db } from '../database';
import { ProfileCandidate, ProfileCategory } from '../../types/radar';

export class DiscoveryService {
  /**
   * Executa uma varredura de novos candidatos com base em filtros de cidade e categoria
   */
  async discoverCandidates(params: {
    city?: string;
    category?: ProfileCategory;
    keyword?: string;
  }): Promise<ProfileCandidate[]> {
    const existingUsernames = new Set(db.getProfiles().map(p => p.username.toLowerCase()));

    // Realistic database of regional prospects in Bahia
    const candidatePool: Array<{
      username: string;
      displayName: string;
      category: ProfileCategory;
      city: string;
      state: string;
      justification: string;
      source: string;
      followers: number;
    }> = [
      {
        username: 'sunset_lounge_conquista',
        displayName: 'Sunset Lounge & Rooftop [Fictício]',
        category: 'Bar',
        city: 'Vitória da Conquista',
        state: 'BA',
        justification: 'Postagens frequentes com atrações de Pagode de Mesa e DJ aos domingos.',
        source: 'Varredura por Palavra-chave (Rooftop Conquista)',
        followers: 18400
      },
      {
        username: 'arenashow_jequie',
        displayName: 'Arena Show Hall Jequié [Fictício]',
        category: 'Casa de eventos',
        city: 'Jequié',
        state: 'BA',
        justification: 'Anúncio recente de festival de forró para o mês de dezembro.',
        source: 'Mapeamento Regional (Jequié/Médio Rio de Contas)',
        followers: 24900
      },
      {
        username: 'bloco_pipoca_sudoeste',
        displayName: 'Bloco Pipoca Conquista [Fictício]',
        category: 'Organizador',
        city: 'Vitória da Conquista',
        state: 'BA',
        justification: 'Comissão de micareta independente organizando abadás para 2027.',
        source: 'Menções em Perfis Parceiros',
        followers: 15300
      },
      {
        username: 'cervejaria_serrana_vca',
        displayName: 'Cervejaria Serrana Bier [Fictício]',
        category: 'Bar',
        city: 'Vitória da Conquista',
        state: 'BA',
        justification: 'Programação de Rock ao vivo toda sexta-feira e festival de chopes especiais.',
        source: 'Busca por Categoria (Bares Musicais)',
        followers: 12100
      },
      {
        username: 'itapetinga_eventos_producoes',
        displayName: 'Itapetinga Music & Produções [Fictício]',
        category: 'Produtora',
        city: 'Itapetinga',
        state: 'BA',
        justification: 'Produtora de vaquejadas e shows sertanejos no Parque Juvino Oliveira.',
        source: 'Expansão Sudoeste (Itapetinga)',
        followers: 21800
      },
      {
        username: 'dj_carlos_mix',
        displayName: 'DJ Carlos Mix Bahia [Fictício]',
        category: 'Artista',
        city: 'Vitória da Conquista',
        state: 'BA',
        justification: 'DJ residente em eventos universitários de medicina e engenharia da UESB.',
        source: 'Rede de Contatos Vibz',
        followers: 9700
      }
    ];

    const added: ProfileCandidate[] = [];

    for (const item of candidatePool) {
      if (params.city && item.city.toLowerCase() !== params.city.toLowerCase()) continue;
      if (params.category && item.category !== params.category) continue;
      if (params.keyword && !item.displayName.toLowerCase().includes(params.keyword.toLowerCase()) && !item.justification.toLowerCase().includes(params.keyword.toLowerCase())) continue;

      // Check if already in candidates
      const alreadyCand = db.getCandidates().some(c => c.username.toLowerCase() === item.username.toLowerCase());
      if (alreadyCand) continue;

      const isMonitored = existingUsernames.has(item.username.toLowerCase());

      const cand = db.addCandidate({
        username: item.username,
        displayName: item.displayName,
        probableCategory: item.category,
        city: item.city,
        state: item.state,
        justification: item.justification,
        source: item.source,
        followersEstimated: item.followers,
        isDemo: true
      });

      if (isMonitored) {
        cand.status = 'Já cadastrado';
      }

      added.push(cand);
    }

    db.logSystem(
      'PROFILES',
      'INFO',
      `Busca de descoberta finalizada. ${added.length} novos perfis candidatos identificados.`
    );

    return added;
  }
}

export const discoveryService = new DiscoveryService();
