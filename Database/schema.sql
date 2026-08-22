-- =========================================================
-- BANCO DE DADOS DO E-COMMERCE
-- PostgreSQL
-- =========================================================

-- =========================================================
-- USUÁRIOS
-- =========================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    telefone VARCHAR(30),
    avatar_url TEXT,
    role VARCHAR(30) NOT NULL DEFAULT 'cliente',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email
ON usuarios(email);


-- =========================================================
-- PRODUTOS
-- =========================================================

CREATE TABLE IF NOT EXISTS produtos (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100),
    preco NUMERIC(12,2) NOT NULL DEFAULT 0,
    preco_antigo NUMERIC(12,2),
    imagem TEXT,
    estoque INTEGER NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT produtos_preco_check
        CHECK (preco >= 0),

    CONSTRAINT produtos_estoque_check
        CHECK (estoque >= 0)
);

CREATE INDEX IF NOT EXISTS idx_produtos_categoria
ON produtos(categoria);

CREATE INDEX IF NOT EXISTS idx_produtos_ativo
ON produtos(ativo);


-- =========================================================
-- FAVORITOS
-- =========================================================

CREATE TABLE IF NOT EXISTS favoritos (
    id BIGSERIAL PRIMARY KEY,

    usuario_id BIGINT NOT NULL,
    produto_id BIGINT NOT NULL,

    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT favoritos_usuario_fk
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT favoritos_produto_fk
        FOREIGN KEY (produto_id)
        REFERENCES produtos(id)
        ON DELETE CASCADE,

    CONSTRAINT favorito_unico
        UNIQUE (usuario_id, produto_id)
);

CREATE INDEX IF NOT EXISTS idx_favoritos_usuario
ON favoritos(usuario_id);


-- =========================================================
-- CARRINHOS
-- =========================================================

CREATE TABLE IF NOT EXISTS carrinhos (
    id BIGSERIAL PRIMARY KEY,

    usuario_id BIGINT NOT NULL UNIQUE,

    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT carrinhos_usuario_fk
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);


-- =========================================================
-- ITENS DO CARRINHO
-- =========================================================

CREATE TABLE IF NOT EXISTS carrinho_itens (
    id BIGSERIAL PRIMARY KEY,

    carrinho_id BIGINT NOT NULL,
    produto_id BIGINT NOT NULL,

    quantidade INTEGER NOT NULL DEFAULT 1,

    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT carrinho_itens_carrinho_fk
        FOREIGN KEY (carrinho_id)
        REFERENCES carrinhos(id)
        ON DELETE CASCADE,

    CONSTRAINT carrinho_itens_produto_fk
        FOREIGN KEY (produto_id)
        REFERENCES produtos(id)
        ON DELETE CASCADE,

    CONSTRAINT quantidade_carrinho_check
        CHECK (quantidade > 0),

    CONSTRAINT produto_unico_no_carrinho
        UNIQUE (carrinho_id, produto_id)
);


-- =========================================================
-- ENDEREÇOS
-- =========================================================

CREATE TABLE IF NOT EXISTS enderecos (
    id BIGSERIAL PRIMARY KEY,

    usuario_id BIGINT NOT NULL,

    nome VARCHAR(150) NOT NULL,
    cep VARCHAR(20) NOT NULL,
    rua VARCHAR(255) NOT NULL,
    numero VARCHAR(30) NOT NULL,
    complemento VARCHAR(255),
    bairro VARCHAR(150) NOT NULL,
    cidade VARCHAR(150) NOT NULL,
    uf VARCHAR(2) NOT NULL,

    principal BOOLEAN NOT NULL DEFAULT TRUE,

    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT enderecos_usuario_fk
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_enderecos_usuario
ON enderecos(usuario_id);


-- =========================================================
-- PEDIDOS
-- =========================================================

CREATE TABLE IF NOT EXISTS pedidos (
    id BIGSERIAL PRIMARY KEY,

    usuario_id BIGINT NOT NULL,

    numero VARCHAR(30) NOT NULL UNIQUE,

    status VARCHAR(50) NOT NULL DEFAULT 'Em Separação',

    pagamento VARCHAR(100) NOT NULL,

    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    frete NUMERIC(12,2) NOT NULL DEFAULT 0,
    desconto NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,

    endereco_nome VARCHAR(150),
    endereco_cep VARCHAR(20),
    endereco_rua VARCHAR(255),
    endereco_numero VARCHAR(30),
    endereco_complemento VARCHAR(255),
    endereco_bairro VARCHAR(150),
    endereco_cidade VARCHAR(150),
    endereco_uf VARCHAR(2),

    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pedidos_usuario_fk
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE RESTRICT,

    CONSTRAINT pedidos_subtotal_check
        CHECK (subtotal >= 0),

    CONSTRAINT pedidos_frete_check
        CHECK (frete >= 0),

    CONSTRAINT pedidos_desconto_check
        CHECK (desconto >= 0),

    CONSTRAINT pedidos_total_check
        CHECK (total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario
ON pedidos(usuario_id);

CREATE INDEX IF NOT EXISTS idx_pedidos_status
ON pedidos(status);


-- =========================================================
-- ITENS DOS PEDIDOS
-- =========================================================

CREATE TABLE IF NOT EXISTS pedido_itens (
    id BIGSERIAL PRIMARY KEY,

    pedido_id BIGINT NOT NULL,
    produto_id BIGINT,

    nome_produto VARCHAR(255) NOT NULL,
    preco NUMERIC(12,2) NOT NULL,
    quantidade INTEGER NOT NULL,

    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pedido_itens_pedido_fk
        FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE,

    CONSTRAINT pedido_itens_produto_fk
        FOREIGN KEY (produto_id)
        REFERENCES produtos(id)
        ON DELETE SET NULL,

    CONSTRAINT pedido_itens_preco_check
        CHECK (preco >= 0),

    CONSTRAINT pedido_itens_quantidade_check
        CHECK (quantidade > 0)
);

CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido
ON pedido_itens(pedido_id);


-- =========================================================
-- SESSÕES DE LOGIN
-- =========================================================

CREATE TABLE IF NOT EXISTS sessoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    usuario_id BIGINT NOT NULL,

    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_acesso TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_em TIMESTAMP NOT NULL,

    CONSTRAINT sessoes_usuario_fk
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessoes_usuario
ON sessoes(usuario_id);


-- =========================================================
-- CUPONS
-- =========================================================

CREATE TABLE IF NOT EXISTS cupons (
    id BIGSERIAL PRIMARY KEY,

    codigo VARCHAR(50) NOT NULL UNIQUE,

    desconto_porcentagem NUMERIC(5,2) NOT NULL,

    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    validade_inicio TIMESTAMP,
    validade_fim TIMESTAMP,

    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT cupom_desconto_check
        CHECK (
            desconto_porcentagem >= 0
            AND desconto_porcentagem <= 100
        )
);

CREATE INDEX IF NOT EXISTS idx_cupons_codigo
ON cupons(codigo);


-- =========================================================
-- CUPONS UTILIZADOS
-- =========================================================

CREATE TABLE IF NOT EXISTS cupons_utilizados (
    id BIGSERIAL PRIMARY KEY,

    cupom_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    pedido_id BIGINT NOT NULL,

    utilizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT cupons_utilizados_cupom_fk
        FOREIGN KEY (cupom_id)
        REFERENCES cupons(id)
        ON DELETE RESTRICT,

    CONSTRAINT cupons_utilizados_usuario_fk
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE RESTRICT,

    CONSTRAINT cupons_utilizados_pedido_fk
        FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE
);


-- =========================================================
-- TRIGGER PARA ATUALIZAR atualizado_em
-- =========================================================

CREATE OR REPLACE FUNCTION atualizar_data_modificacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS trigger_usuarios_atualizado ON usuarios;

CREATE TRIGGER trigger_usuarios_atualizado
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_modificacao();


DROP TRIGGER IF EXISTS trigger_produtos_atualizado ON produtos;

CREATE TRIGGER trigger_produtos_atualizado
BEFORE UPDATE ON produtos
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_modificacao();


DROP TRIGGER IF EXISTS trigger_carrinhos_atualizado ON carrinhos;

CREATE TRIGGER trigger_carrinhos_atualizado
BEFORE UPDATE ON carrinhos
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_modificacao();


DROP TRIGGER IF EXISTS trigger_carrinho_itens_atualizado ON carrinho_itens;

CREATE TRIGGER trigger_carrinho_itens_atualizado
BEFORE UPDATE ON carrinho_itens
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_modificacao();


DROP TRIGGER IF EXISTS trigger_enderecos_atualizado ON enderecos;

CREATE TRIGGER trigger_enderecos_atualizado
BEFORE UPDATE ON enderecos
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_modificacao();


DROP TRIGGER IF EXISTS trigger_pedidos_atualizado ON pedidos;

CREATE TRIGGER trigger_pedidos_atualizado
BEFORE UPDATE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_modificacao();


-- =========================================================
-- PRODUTOS DE TESTE
-- =========================================================

INSERT INTO produtos
(nome, descricao, categoria, preco, preco_antigo, imagem, estoque, ativo)
VALUES

(
    'Fone de Ouvido Bluetooth Premium',
    'Fone de ouvido sem fio com cancelamento de ruído ativo, bateria de até 30 horas e Bluetooth 5.2.',
    'Eletrônicos',
    189.90,
    229.90,
    '🎧',
    50,
    TRUE
),

(
    'Luminária de Mesa Minimalista',
    'Luminária LED minimalista com ajuste de intensidade, haste flexível e carregamento USB-C.',
    'Casa',
    120.00,
    NULL,
    '💡',
    30,
    TRUE
)

ON CONFLICT DO NOTHING;


-- =========================================================
-- CUPOM DE TESTE
-- =========================================================

INSERT INTO cupons
(codigo, desconto_porcentagem, ativo)
VALUES
('BEMVINDO10', 10.00, TRUE)
ON CONFLICT (codigo) DO NOTHING;


-- =========================================================
-- VERIFICAÇÃO
-- =========================================================

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;