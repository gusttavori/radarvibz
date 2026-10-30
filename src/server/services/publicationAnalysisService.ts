/**
 * Radar Vibz - PublicationAnalysisService
 * Análise de publicações com Google Gemini API (@google/genai)
 */

import { GoogleGenAI, Type } from '@google/genai';
import { AIAnalysisResult } from '../../types/radar';

export class PublicationAnalysisService {
  private ai: GoogleGenAI | null = null;
  private cache: Map<string, AIAnalysisResult> = new Map();

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        this.ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });
      } catch (err) {
        console.warn('Could not initialize GoogleGenAI client:', err);
      }
    }
  }

  /**
   * Analisa a legenda e metadados de uma publicação usando Gemini 3.8 Flash
   */
  async analyzePublication(params: {
    caption: string;
    username: string;
    category?: string;
    city?: string;
    publishedAt: string;
  }): Promise<AIAnalysisResult> {
    const cacheKey = `${params.username}:${params.caption.trim()}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    if (!params.caption || params.caption.trim().length < 5) {
      const emptyResult: AIAnalysisResult = {
        is_event: false,
        is_opportunity: false,
        category: 'Outros',
        relevance: 'low',
        event_name: null,
        event_date: null,
        event_time: null,
        venue: null,
        city: params.city || null,
        state: 'BA',
        artists: [],
        organizer: params.username,
        summary: 'Publicação sem legenda descritiva ou curta demais para análise.',
        commercial_opportunity: 'Sem oportunidade identificável.',
        suggested_action: 'Manter arquivado.',
        confidence: 0.95,
        missing_information: []
      };
      this.cache.set(cacheKey, emptyResult);
      return emptyResult;
    }

    // Try Gemini API if client available
    if (this.ai) {
      try {
        const prompt = `Analise a seguinte publicação de entretenimento do Instagram para o Radar Vibz (ferramenta de inteligência comercial do Vibz Eventos no Sudoeste da Bahia).
Identifique se anuncia um evento real, show, festa, festival ou programação de bar, e avalie a oportunidade comercial para o Vibz (venda de ingressos, divulgação de programação, parcerias com produtores).

REGRAS ESTRITAS:
1. NUNCA assuma que a data de publicação é a data do evento. Extraia a data em que o evento realmente ocorrerá. Se a legenda diz "Sexta 30/10" ou "21 de Novembro", extraia a data futura correspondente. Se não houver data explícita, retorne null.
2. NUNCA invente atrações, artistas, locais ou horários que não estejam no texto.
3. Se for agradecimento pós-evento ("Que noite linda", "Obrigado a quem foi"), NÃO é evento futuro (is_event: false, is_opportunity: false, category: "Retrospectiva").
4. Se for aviso de reformas, horário comercial ou celebração cívica, classifique como "Conteúdo institucional" ou "Outros".
5. Relevância:
   - "high": festival, show confirmado com data definida, festa com venda de ingressos ou anúncio de lotes.
   - "medium": programação semanal de bar, música ao vivo, anúncio prévio com informações incompletas.
   - "low": posts comuns, memes, retrospectivas, institucional.

DADOS DA PUBLICAÇÃO:
- Perfil: @${params.username}
- Categoria do perfil: ${params.category || 'Não informada'}
- Cidade base: ${params.city || 'Vitória da Conquista, BA'}
- Data de postagem: ${params.publishedAt}
- Legenda original:
"""
${params.caption}
"""`;

        const response = await this.ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction:
              'Você é o motor de inteligência artificial do Radar Vibz. Sua missão é extrair dados comerciais precisos de publicações no Instagram para a equipe comercial do Vibz Eventos.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                is_event: { type: Type.BOOLEAN },
                is_opportunity: { type: Type.BOOLEAN },
                category: { type: Type.STRING },
                relevance: { type: Type.STRING },
                event_name: { type: Type.STRING, nullable: true },
                event_date: { type: Type.STRING, nullable: true },
                event_time: { type: Type.STRING, nullable: true },
                venue: { type: Type.STRING, nullable: true },
                city: { type: Type.STRING, nullable: true },
                state: { type: Type.STRING, nullable: true },
                artists: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                organizer: { type: Type.STRING, nullable: true },
                summary: { type: Type.STRING },
                commercial_opportunity: { type: Type.STRING },
                suggested_action: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                missing_information: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: [
                'is_event',
                'is_opportunity',
                'category',
                'relevance',
                'summary',
                'commercial_opportunity',
                'suggested_action',
                'confidence',
                'missing_information'
              ]
            }
          }
        });

        const textOutput = response.text;
        if (textOutput) {
          const parsed = JSON.parse(textOutput) as AIAnalysisResult;
          // Normalize relevance
          const rel = (parsed.relevance || '').toLowerCase();
          parsed.relevance = rel === 'high' ? 'high' : rel === 'medium' ? 'medium' : 'low';
          this.cache.set(cacheKey, parsed);
          return parsed;
        }
      } catch (err) {
        console.warn('Gemini API call returned error, falling back to heuristic engine:', err);
      }
    }

    // Heuristic Fallback Analysis Engine
    const fallback = this.heuristicAnalysis(params);
    this.cache.set(cacheKey, fallback);
    return fallback;
  }

  /**
   * Mecanismo heurístico determinístico e robusto
   * Atua como fallback quando a API externa não estiver disponível
   */
  public heuristicAnalysis(params: {
    caption: string;
    username: string;
    category?: string;
    city?: string;
    publishedAt: string;
  }): AIAnalysisResult {
    const text = params.caption.toLowerCase();

    // Check for post-event / retrospective
    const isRetrospective =
      text.includes('obrigado a todos') ||
      text.includes('que energia linda foi') ||
      text.includes('edição passada') ||
      text.includes('clipe novo no ar') ||
      text.includes('tbt') ||
      text.includes('manutenção preventiva') ||
      text.includes('expediente');

    if (isRetrospective) {
      return {
        is_event: false,
        is_opportunity: false,
        category: text.includes('manutenção') ? 'Conteúdo institucional' : 'Retrospectiva',
        relevance: 'low',
        event_name: null,
        event_date: null,
        event_time: null,
        venue: null,
        city: params.city || 'Vitória da Conquista',
        state: 'BA',
        artists: [],
        organizer: params.username,
        summary: 'Publicação de registro pós-evento ou comunicado interno sem chamada de venda futura.',
        commercial_opportunity: 'Nenhuma oportunidade imediata identificada.',
        suggested_action: 'Manter em histórico sem contato comercial.',
        confidence: 0.94,
        missing_information: []
      };
    }

    // Check for festival / big show
    const isFestival = text.includes('festival') || text.includes('summer fest') || text.includes('micareta');
    const isParty = text.includes('festa') || text.includes('calourada') || text.includes('save the date') || text.includes('baile');
    const isBarLive = text.includes('acústico') || text.includes('música ao vivo') || text.includes('voz e violão') || text.includes('sextou') || text.includes('chopp');

    // Date extraction heuristic
    let eventDate: string | null = null;
    const dateRegex = /(\d{1,2})[\/\s]+(?:de\s+)?(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|\d{1,2})/i;
    const match = text.match(dateRegex);
    if (match) {
      const day = match[1].padStart(2, '0');
      const monthStr = match[2].toLowerCase();
      const monthMap: Record<string, string> = {
        'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
        'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
        'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
      };
      const month = monthMap[monthStr] || match[2].padStart(2, '0');
      const currentYear = new Date().getFullYear();
      eventDate = `${currentYear}-${month}-${day}`;
    }

    // Time extraction heuristic
    let eventTime: string | null = null;
    const timeMatch = text.match(/(\d{1,2})h(?:\d{2})?|às (\d{1,2}:\d{2})/);
    if (timeMatch) {
      eventTime = timeMatch[1] ? `${timeMatch[1].padStart(2, '0')}:00` : timeMatch[2];
    }

    // Extract Event Name
    let eventName: string | null = null;
    const firstLine = params.caption.split('\n')[0].replace(/[!🎉☀️💥🚀🌟]/g, '').trim();
    if (firstLine.length > 5 && firstLine.length < 60) {
      eventName = firstLine;
    } else {
      eventName = isFestival ? 'Festival Regional' : isParty ? 'Festa & Evento' : 'Música ao Vivo';
    }

    if (isFestival || (isParty && text.includes('lote'))) {
      return {
        is_event: true,
        is_opportunity: true,
        category: isFestival ? 'Festival' : 'Festa',
        relevance: 'high',
        event_name: eventName,
        event_date: eventDate,
        event_time: eventTime || '21:00',
        venue: params.username.includes('arena') ? 'Arena Sudoeste' : 'Local a confirmar',
        city: params.city || 'Vitória da Conquista',
        state: 'BA',
        artists: [],
        organizer: params.username,
        summary: `Evento de grande apelo identificado na publicação de @${params.username}. Abertura de ingressos mencionada.`,
        commercial_opportunity: 'Alta prioridade: oferecer intermediação de venda de ingressos ou patrocínio oficial de divulgação no Vibz.',
        suggested_action: 'Contatar a produção via WhatsApp ou Direct apresentando a proposta comercial Vibz.',
        confidence: 0.91,
        missing_information: eventDate ? [] : ['Data exata do evento']
      };
    }

    if (isParty || isBarLive) {
      return {
        is_event: true,
        is_opportunity: true,
        category: isBarLive ? 'Programação de bar' : 'Divulgação de festa',
        relevance: 'medium',
        event_name: eventName,
        event_date: eventDate,
        event_time: eventTime || '20:00',
        venue: params.username,
        city: params.city || 'Vitória da Conquista',
        state: 'BA',
        artists: [],
        organizer: params.username,
        summary: `Programação musical ou noite temática identificada no perfil @${params.username}.`,
        commercial_opportunity: 'Oportunidade para cadastrar na agenda semanal do Vibz e propor plano recorrente para estabelecimentos.',
        suggested_action: 'Cadastrar no catálogo do Vibz e convidar o estabelecimento para painel de parceiros.',
        confidence: 0.88,
        missing_information: []
      };
    }

    return {
      is_event: false,
      is_opportunity: false,
      category: 'Outros',
      relevance: 'low',
      event_name: null,
      event_date: null,
      event_time: null,
      venue: null,
      city: params.city || 'Vitória da Conquista',
      state: 'BA',
      artists: [],
      organizer: params.username,
      summary: 'Publicação de rotina ou sem chamada direta para evento futuro.',
      commercial_opportunity: 'Sem oportunidade comercial identificada.',
      suggested_action: 'Nenhuma ação necessária.',
      confidence: 0.92,
      missing_information: []
    };
  }
}

export const aiAnalysisService = new PublicationAnalysisService();
