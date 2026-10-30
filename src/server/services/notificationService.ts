/**
 * Radar Vibz - Notification Service (Telegram Bot API)
 * Envio de alertas de novas oportunidades identificadas
 */

import { Opportunity } from '../../types/radar';
import { db } from '../database';

export interface TelegramDispatchResult {
  success: boolean;
  message: string;
  telegramMessageId?: number;
  simulated?: boolean;
}

export class NotificationService {
  private sentOpportunities: Set<string> = new Set();

  /**
   * Formata a mensagem de notificação de acordo com o padrão editorial do Radar Vibz
   */
  public formatOpportunityMessage(opp: Opportunity): string {
    const artistsStr = opp.artists && opp.artists.length > 0 ? opp.artists.join(', ') : 'Não especificadas na legenda';
    const dateStr = opp.eventDate
      ? new Date(opp.eventDate + 'T12:00:00Z').toLocaleDateString('pt-BR')
      : 'A confirmar';

    const relevanceMap: Record<string, string> = {
      high: 'ALTA',
      medium: 'MÉDIA',
      low: 'BAIXA'
    };
    const relevanceStr = relevanceMap[opp.relevance.toLowerCase()] || opp.relevance.toUpperCase();

    return `*RADAR VIBZ*
🚨 *NOVA OPORTUNIDADE IDENTIFICADA*

*Perfil:* @${opp.username}
*Categoria:* ${opp.category}
*Cidade:* ${opp.city}

*Evento:* ${opp.eventName}
*Data:* ${dateStr}${opp.eventTime ? ` às ${opp.eventTime}` : ''}
*Local:* ${opp.venue || 'A confirmar'}
*Atrações:* ${artistsStr}

*Relevância:* ${relevanceStr}

*Oportunidade:*
${opp.commercialPotential || opp.summary}

*Ação Sugerida:*
${opp.suggestedAction || 'Entrar em contato com o organizador.'}

*Publicação original:*
${opp.originalUrl}`;
  }

  /**
   * Envia uma oportunidade via Telegram Bot API
   */
  async notifyOpportunity(opp: Opportunity): Promise<TelegramDispatchResult> {
    const settings = db.getSettings();
    if (!settings.telegram.enabled) {
      return { success: false, message: 'Notificações do Telegram estão desabilitadas nas Configurações.' };
    }

    if (this.sentOpportunities.has(opp.id)) {
      return { success: false, message: 'Notificação já enviada anteriormente para esta oportunidade (deduplicada).' };
    }

    // Check minimum relevance
    if (settings.telegram.minRelevance === 'high' && opp.relevance !== 'high') {
      return { success: false, message: 'Relevância da oportunidade abaixo do limiar configurado para Telegram.' };
    }

    const text = this.formatOpportunityMessage(opp);
    const result = await this.sendTelegramRaw(settings.telegram.botToken, settings.telegram.chatId, text);

    if (result.success) {
      this.sentOpportunities.add(opp.id);
      db.logSystem('TELEGRAM', 'SUCCESS', `Notificação enviada com sucesso para o evento "${opp.eventName}" (@${opp.username}).`);
    } else {
      db.logSystem('TELEGRAM', 'WARN', `Falha no envio Telegram para "${opp.eventName}": ${result.message}`);
    }

    return result;
  }

  /**
   * Envia mensagem de teste
   */
  async sendTestNotification(botToken?: string, chatId?: string): Promise<TelegramDispatchResult> {
    const settings = db.getSettings();
    const token = botToken || settings.telegram.botToken;
    const chat = chatId || settings.telegram.chatId;

    const sampleText = `*RADAR VIBZ*
🔔 *TESTE DE INTEGRAÇÃO TELEGRAM*

Sistema de inteligência comercial do Vibz Eventos conectado com sucesso!
Horário do teste: ${new Date().toLocaleString('pt-BR')}
Ambiente: Produção Radar Vibz`;

    const result = await this.sendTelegramRaw(token, chat, sampleText);
    if (result.success) {
      db.logSystem('TELEGRAM', 'SUCCESS', 'Disparo de teste do Telegram concluído com êxito.');
    } else {
      db.logSystem('TELEGRAM', 'WARN', `Falha no disparo de teste do Telegram: ${result.message}`);
    }
    return result;
  }

  /**
   * Disparo HTTP para a Telegram Bot API com contingência para modo de demonstração
   */
  private async sendTelegramRaw(token: string, chatId: string, text: string): Promise<TelegramDispatchResult> {
    if (!token || !chatId) {
      // Return clear feedback with simulation log
      return {
        success: true,
        simulated: true,
        message: 'Modo Simulado: Telegram Bot Token ou Chat ID não preenchidos. Mensagem formatada e registrada nos logs com sucesso.'
      };
    }

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        return {
          success: false,
          message: data.description || 'Erro desconhecido retornado pela Telegram Bot API.'
        };
      }

      return {
        success: true,
        message: 'Mensagem entregue com sucesso no Telegram!',
        telegramMessageId: data.result?.message_id
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Erro de rede ao conectar com o Telegram.'
      };
    }
  }
}

export const notificationService = new NotificationService();
