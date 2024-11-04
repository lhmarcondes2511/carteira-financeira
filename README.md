# 🏦 Carteira Financeira API

[![NestJS](https://img.shields.io/badge/NestJS-8.0.0-red.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-20.10.0-blue.svg)](https://www.docker.com/)

Uma API robusta para gerenciamento de carteira financeira, permitindo transferências seguras entre usuários.

## ✨ Funcionalidades

- 🔐 Autenticação JWT
- 👥 Gestão de usuários
- 💰 Transferências financeiras
- 📊 Histórico de transações
- 🔍 Monitoramento de saldo
- 🐳 Containerização com Docker
- 🧪 Testes automatizados

## 🚀 Tecnologias

- [NestJS](https://nestjs.com/) - Framework Node.js progressivo
- [TypeScript](https://www.typescriptlang.org/) - Superset JavaScript tipado
- [PostgreSQL](https://www.postgresql.org/) - Banco de dados relacional
- [TypeORM](https://typeorm.io/) - ORM para TypeScript
- [Jest](https://jestjs.io/) - Framework de testes
- [Docker](https://www.docker.com/) - Containerização
- [Swagger](https://swagger.io/) - Documentação da API

## 📋 Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- PostgreSQL (se executar localmente)

## 🛠️ Instalação

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/carteira-financeira.git

# Entrar no diretório
cd carteira-financeira

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
```

## 🐳 Executando com Docker
```bash
# Desenvolvimento
docker-compose -f docker-compose.dev.yml up --build

# Produção
docker-compose up --build
```

## 🏃 Executando Localmente
```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

## 🧪 Testes
```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Cobertura de testes
npm run test:cov
```

## 📚 Documentação da API
Acesse a documentação Swagger em:
[API Local](http://localhost:3000/api)

## 🔑 Endpoints Principais
```bash
# Autenticação
POST /auth/register - Registro de usuário
POST /auth/login    - Login de usuário

# Usuários
GET    /users/profile  - Perfil do usuário
PATCH  /users/profile  - Atualizar perfil

# Transferências
POST   /transfers      - Realizar transferência
GET    /transfers      - Histórico de transferências
```

## 🔍 Monitoramento
- Health Check: GET /health
- Métricas: GET /metrics
- Logs estruturados

## 👨‍💻 Autor
Lucas Henrique
