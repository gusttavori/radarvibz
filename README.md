# RADAR VIBZ
### Sistema de Inteligência e Monitoramento de Oportunidades do Instagram para o Vibz Eventos

O **Radar Vibz** é uma ferramenta interna de inteligência comercial e prospecção do Vibz Eventos (com atuação inicial em Vitória da Conquista e região Sudoeste da Bahia).

Seu objetivo é monitorar perfis de bares, casas de eventos, produtoras de festas, promotores, artistas e divulgadores, identificando automaticamente novos eventos por meio de inteligência artificial e convertendo essas informações em oportunidades comerciais no funil de vendas do Vibz.

---

## 🚀 Arquitetura do Sistema

O projeto é dividido em módulos independentes:
1. **Dashboard Executivo:** 8 KPIs em tempo real, monitoramento de saúde do motor, distribuição geográfica (Conquista, Jequié, Itabuna, Poções) e análise por categorias.
2. **Perfis Monitorados:** Cadastro, edição, status de monitoramento (ativo, pausado, falha), importação em lote por CSV e drawer com histórico completo.
3. **Descoberta de Perfis:** Prospecção regional e qualificação de estabelecimentos com aprovação direta para a lista de monitorados.
4. **Motor de Monitoramento (InstagramProvider):** Abstração oficial via `MetaInstagramProvider` (Meta Graph API / Business Discovery) e contingência com `DemoSimulationProvider`. Sem scraping, roubo de cookies ou invasão de senhas.
5. **Publicações:** Rastreamento de mídias, unicidade por `external_id` (Instagram Media ID), categorização e filtros.
6. **Inteligência Artificial (Google Gemini):** Análise semântica com o modelo `gemini-3.8-flash` via `@google/genai` gerando JSON validado, distinguindo rigorosamente data de postagem de data do evento.
7. **Oportunidades (CRM de Prospecção):** Pipeline Kanban com status comerciais (Nova, Em análise, Contato necessário, Em negociação, Convertida, Descartada) e registro de contatos (WhatsApp, Direct, Telefone, Presencial).
8. **Notificações Telegram:** Bot oficial do Telegram disparando cards editoriais padronizados para o grupo comercial.
9. **Configurações & Diagnóstico:** Gerenciamento de credenciais, testes de conexão em tempo real, restauração e limpeza de dados fictícios.
10. **Auditoria & Logs:** Histórico completo de auditoria por módulo com timestamps e latências.

---

## 🛠️ Stack Tecnológica

- **Frontend:** React, Vite, Lucide React, Tailwind CSS design system com paleta Vibz (`#4C01B5`, preto e neutros escuros).
- **Backend (Node.js/Express na prévia & Python FastAPI em repositório):**
  - Servidor Express em `server.ts` servindo `/api/*` e orquestrando o app em tempo real.
  - Repositório completo Python FastAPI em `/backend/` com SQLAlchemy, Pydantic, Alembic e PostgreSQL.
- **Banco de Dados:** Engine persistente com chaveamento atômico em JSON/SQLite e suporte nativo a PostgreSQL via Docker Compose.
- **Inteligência Artificial:** Google Gemini API (`@google/genai` com `gemini-3.8-flash`).
- **Notificações:** Telegram Bot API (`https://api.telegram.org`).

---

## 📦 Como Executar Localmente

### Opção 1: Aplicação Web Integrada (Node/React/Express)
```bash
# 1. Instalar dependências
npm install

# 2. Executar em modo de desenvolvimento
npm run dev
# Acesse em: http://localhost:3000
```

### Opção 2: Backend Python FastAPI com PostgreSQL (Docker)
```bash
# Subir todo o ambiente com Postgres, FastAPI e Frontend
docker-compose up --build
# Backend FastAPI: http://localhost:8000/docs
# Frontend: http://localhost:3000
```

---

## 🔑 Configuração das APIs Externas

### 1. Google Gemini API
- Obtenha sua chave no [Google AI Studio](https://aistudio.google.com).
- No arquivo `.env`:
  ```env
  GEMINI_API_KEY="sua_chave_aqui"
  ```
- O Radar Vibz utiliza o modelo recomendado `gemini-3.8-flash` no backend com cabeçalho `User-Agent: aistudio-build`.

### 2. Meta Instagram Graph API
- Acesse o Meta for Developers e crie um App do tipo "Business".
- Vincule sua Página do Facebook conectada à conta comercial do Instagram.
- Obtenha o Access Token de longa duração com as permissões:
  - `instagram_basic`
  - `pages_show_list`
- Preencha o `Page ID` e o `Access Token` na aba **Configurações > Meta Instagram API**.

### 3. Telegram Bot API
- Crie um bot no Telegram falando com `@BotFather` e obtenha o `Bot Token`.
- Adicione o bot ao grupo comercial do Vibz e obtenha o `Chat ID` (ex: `-100...`).
- Preencha os campos na aba **Configurações > Telegram** e clique em **Disparar Mensagem de Teste**.

---

## 🧪 Testes Unitários

Para rodar a suíte de testes de deduplicação, análise de IA e formatação:
```bash
npx --yes tsx --test src/services/tests/radar.test.ts
```

---

## 📋 Relatório de Funcionalidades & Limitações

### Implementado:
✅ Todos os 9 módulos funcionais com navegação fluida.
✅ 12 estabelecimentos demonstrativos fictícios no Sudoeste Baiano devidamente rotulados com `[DEMO]`.
✅ Deduplicação garantida por nome de usuário e `external_id` de publicação.
✅ CRM com Kanban, timeline de interações e registro de contatos.
✅ Varredura imediata e agendamento configurável (30m, 60m, 3h).
✅ Importação em massa de perfis por CSV com detecção de duplicidades.
✅ Testes unitários com `node:test` passando com 100% de sucesso.

### Limitações Conhecidas da API da Meta:
- Contas privadas ou perfis pessoais do Instagram não podem ser consultados pela Meta Graph API oficial (apenas contas Business e Creator públicas via Business Discovery). O Radar Vibz identifica perfis indisponíveis e os marca com status `Falha` para revisão humana.
