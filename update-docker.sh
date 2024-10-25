#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para exibir mensagens
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Função para verificar se o comando anterior foi bem-sucedido
check_status() {
    if [ $? -eq 0 ]; then
        log "$1"
    else
        error "$2"
        exit 1
    fi
}

# Verifica se o Docker está rodando
if ! docker info >/dev/null 2>&1; then
    error "Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

# Início da atualização
log "Iniciando processo de atualização..."

# Backup dos volumes (opcional)
warning "Deseja fazer backup dos volumes? (s/n)"
read -r make_backup
if [ "$make_backup" = "s" ]; then
    log "Iniciando backup dos volumes..."
    backup_date=$(date +'%Y%m%d_%H%M%S')
    docker run --rm \
        --volumes-from carteira-financeira-postgres-dev \
        -v "$(pwd)/backups:/backup" \
        alpine tar cvf "/backup/postgres_backup_$backup_date.tar" /var/lib/postgresql/data
    check_status "Backup concluído com sucesso!" "Erro ao fazer backup"
fi

# Para os containers
log "Parando containers..."
docker-compose -f docker-compose.dev.yml down
check_status "Containers parados com sucesso!" "Erro ao parar containers"

# Remove containers antigos e imagens não utilizadas
log "Limpando recursos não utilizados..."
docker system prune -f
check_status "Limpeza concluída!" "Erro ao limpar recursos"

# Puxa as últimas alterações do git (opcional)
warning "Deseja atualizar o código do repositório? (s/n)"
read -r update_code
if [ "$update_code" = "s" ]; then
    log "Atualizando código..."
    git pull
    check_status "Código atualizado com sucesso!" "Erro ao atualizar código"
fi

# Reconstrói as imagens
log "Reconstruindo imagens..."
docker-compose -f docker-compose.dev.yml build --no-cache
check_status "Imagens reconstruídas com sucesso!" "Erro ao reconstruir imagens"

# Inicia os containers
log "Iniciando containers..."
docker-compose -f docker-compose.dev.yml up -d
check_status "Containers iniciados com sucesso!" "Erro ao iniciar containers"

# Aguarda o postgres iniciar
log "Aguardando postgres iniciar..."
sleep 10

# Verifica se os containers estão rodando
log "Verificando status dos containers..."
if docker ps | grep -q "carteira-financeira-app-dev" && docker ps | grep -q "carteira-financeira-postgres-dev"; then
    log "Todos os containers estão rodando!"
else
    error "Alguns containers não estão rodando. Verificando logs..."
    docker-compose -f docker-compose.dev.yml logs
    exit 1
fi

# Testa a conexão com a API
log "Testando conexão com a API..."
if curl -f http://localhost:3000/health >/dev/null 2>&1; then
    log "API está respondendo corretamente!"
else
    error "API não está respondendo. Verificando logs..."
    docker logs carteira-financeira-app-dev
    exit 1
fi

log "Atualização concluída com sucesso!"

# Pergunta se quer ver os logs
warning "Deseja acompanhar os logs? (s/n)"
read -r show_logs
if [ "$show_logs" = "s" ]; then
    docker-compose -f docker-compose.dev.yml logs -f
fi