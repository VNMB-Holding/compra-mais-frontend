import { describe, it, expect } from 'vitest';
import { resolveNotificationUrl } from '../notifications';

describe('resolveNotificationUrl', () => {
  describe('URLs sem prefixo /compras/', () => {
    it('resolve /rfqs/:id para /compras/rfqs/:id', () => {
      expect(resolveNotificationUrl({ actionUrl: '/rfqs/rfq-123' })).toBe('/compras/rfqs/rfq-123');
    });

    it('resolve /rfq/:id para /compras/rfqs/:id', () => {
      expect(resolveNotificationUrl({ actionUrl: '/rfq/rfq-123' })).toBe('/compras/rfqs/rfq-123');
    });

    it('resolve /rfqs para /compras/rfqs', () => {
      expect(resolveNotificationUrl({ actionUrl: '/rfqs' })).toBe('/compras/rfqs');
    });

    it('resolve /solicitacoes/:id para /compras/solicitacoes/:id', () => {
      expect(resolveNotificationUrl({ actionUrl: '/solicitacoes/sol-999' })).toBe('/compras/solicitacoes/sol-999');
    });

    it('resolve /solicitacao/:id para /compras/solicitacoes/:id', () => {
      expect(resolveNotificationUrl({ actionUrl: '/solicitacao/sol-999' })).toBe('/compras/solicitacoes/sol-999');
    });

    it('resolve /solicitacoes para /compras/solicitacoes', () => {
      expect(resolveNotificationUrl({ actionUrl: '/solicitacoes' })).toBe('/compras/solicitacoes');
    });

    it('resolve /pedidos/:id para /compras/pedidos/:id', () => {
      expect(resolveNotificationUrl({ actionUrl: '/pedidos/ped-456' })).toBe('/compras/pedidos/ped-456');
    });

    it('resolve /pedido/:id para /compras/pedidos/:id', () => {
      expect(resolveNotificationUrl({ actionUrl: '/pedido/ped-456' })).toBe('/compras/pedidos/ped-456');
    });

    it('resolve /orders/:id para /compras/pedidos/:id', () => {
      expect(resolveNotificationUrl({ actionUrl: '/orders/ord-456' })).toBe('/compras/pedidos/ord-456');
    });

    it('resolve /order/:id para /compras/pedidos/:id', () => {
      expect(resolveNotificationUrl({ actionUrl: '/order/ord-456' })).toBe('/compras/pedidos/ord-456');
    });
  });

  describe('URLs singulares dentro de /compras/', () => {
    it('resolve /compras/rfq/:id para /compras/rfqs/:id', () => {
      expect(resolveNotificationUrl({ actionUrl: '/compras/rfq/123' })).toBe('/compras/rfqs/123');
    });

    it('resolve /compras/pedido/:id para /compras/pedidos/:id', () => {
      expect(resolveNotificationUrl({ actionUrl: '/compras/pedido/123' })).toBe('/compras/pedidos/123');
    });

    it('resolve /compras/solicitacao/:id para /compras/solicitacoes/:id', () => {
      expect(resolveNotificationUrl({ actionUrl: '/compras/solicitacao/123' })).toBe('/compras/solicitacoes/123');
    });
  });

  describe('URLs absolutas com domínio / porta', () => {
    it('extrai path e preserva parâmetros de busca e hash', () => {
      expect(resolveNotificationUrl({ actionUrl: 'https://api.vnmbholding.com/rfqs/123?tab=propostas#items' }))
        .toBe('/compras/rfqs/123?tab=propostas#items');
    });

    it('trata localhost corretamente', () => {
      expect(resolveNotificationUrl({ actionUrl: 'http://localhost:3000/solicitacoes/99' }))
        .toBe('/compras/solicitacoes/99');
    });
  });

  describe('Fallback quando actionUrl é omitido ou vazio', () => {
    it('redireciona para /compras/rfqs quando type é rfq', () => {
      expect(resolveNotificationUrl({ type: 'rfq' })).toBe('/compras/rfqs');
    });

    it('redireciona para /compras/pedidos quando type é order', () => {
      expect(resolveNotificationUrl({ type: 'order' })).toBe('/compras/pedidos');
    });

    it('redireciona para /compras/solicitacoes quando type é approval', () => {
      expect(resolveNotificationUrl({ type: 'approval' })).toBe('/compras/solicitacoes');
    });

    it('redireciona para /dashboard quando type é info ou não especificado', () => {
      expect(resolveNotificationUrl({ type: 'info' })).toBe('/dashboard');
      expect(resolveNotificationUrl({})).toBe('/dashboard');
    });
  });

  describe('Quando actionUrl é apenas um identificador bruto', () => {
    it('anexa o id à rota do tipo correspondente', () => {
      expect(resolveNotificationUrl({ actionUrl: 'uuid-1234', type: 'order' })).toBe('/compras/pedidos/uuid-1234');
      expect(resolveNotificationUrl({ actionUrl: 'uuid-5678', type: 'rfq' })).toBe('/compras/rfqs/uuid-5678');
      expect(resolveNotificationUrl({ actionUrl: 'uuid-9999', type: 'approval' })).toBe('/compras/solicitacoes/uuid-9999');
    });
  });

  describe('Rotas já corretas', () => {
    it('mantém URLs já no formato correto intactas', () => {
      expect(resolveNotificationUrl({ actionUrl: '/compras/rfqs/123' })).toBe('/compras/rfqs/123');
      expect(resolveNotificationUrl({ actionUrl: '/compras/pedidos/456' })).toBe('/compras/pedidos/456');
      expect(resolveNotificationUrl({ actionUrl: '/compras/solicitacoes/789' })).toBe('/compras/solicitacoes/789');
      expect(resolveNotificationUrl({ actionUrl: '/fornecedores/12' })).toBe('/fornecedores/12');
    });
  });
});
