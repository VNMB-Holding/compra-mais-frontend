import { describe, it, expect } from 'vitest';
import {
  PURCHASE_REQUEST_STATUS_MAP,
  PRIORITY_MAP,
  PURCHASE_ORDER_STATUS_MAP,
  mapRfqStatus,
  getStatusBadgeVariant,
} from '@/lib/constants/status';

describe('Status & Priority Constants & Mappings', () => {
  describe('PURCHASE_REQUEST_STATUS_MAP', () => {
    it('deve mapear status principais em português', () => {
      expect(PURCHASE_REQUEST_STATUS_MAP.Draft).toBe('Rascunho');
      expect(PURCHASE_REQUEST_STATUS_MAP.AwaitingApproval).toBe('Aguardando aprovação');
      expect(PURCHASE_REQUEST_STATUS_MAP.Approved).toBe('Aprovada');
      expect(PURCHASE_REQUEST_STATUS_MAP.Rejected).toBe('Rejeitada');
      expect(PURCHASE_REQUEST_STATUS_MAP.InQuote).toBe('Em Cotação');
      expect(PURCHASE_REQUEST_STATUS_MAP.Finished).toBe('Atendida');
    });
  });

  describe('PRIORITY_MAP', () => {
    it('deve traduzir todas as prioridades', () => {
      expect(PRIORITY_MAP.Low).toBe('Baixa');
      expect(PRIORITY_MAP.Medium).toBe('Média');
      expect(PRIORITY_MAP.High).toBe('Alta');
      expect(PRIORITY_MAP.Urgent).toBe('Urgente');
      expect(PRIORITY_MAP.Critical).toBe('Crítica');
    });
  });

  describe('PURCHASE_ORDER_STATUS_MAP', () => {
    it('deve mapear os status do pedido de compra', () => {
      expect(PURCHASE_ORDER_STATUS_MAP.Sent).toBe('Emitido');
      expect(PURCHASE_ORDER_STATUS_MAP.AwaitingSignature).toBe('Emitido');
      expect(PURCHASE_ORDER_STATUS_MAP.Signed).toBe('Faturado');
      expect(PURCHASE_ORDER_STATUS_MAP.Delivered).toBe('Entregue');
    });
  });

  describe('mapRfqStatus', () => {
    it('deve retornar Encerrada para Closed e Finished', () => {
      expect(mapRfqStatus({ status: 'Closed' })).toBe('Encerrada');
      expect(mapRfqStatus({ status: 'Finished' })).toBe('Encerrada');
    });

    it('deve retornar Cancelada para Cancelled', () => {
      expect(mapRfqStatus({ status: 'Cancelled' })).toBe('Cancelada');
    });

    it('deve retornar Em análise para UnderAnalysis', () => {
      expect(mapRfqStatus({ status: 'UnderAnalysis' })).toBe('Em análise');
    });

    it('deve retornar Aberta por padrão', () => {
      expect(mapRfqStatus({ status: 'Open' })).toBe('Aberta');
    });

    it('deve identificar cotação encerrando hoje', () => {
      const today = new Date().toISOString();
      expect(mapRfqStatus({ status: 'Open', closesAt: today })).toBe('Encerrando hoje');
    });
  });

  describe('getStatusBadgeVariant', () => {
    it('deve mapear status de sucesso para variante success', () => {
      expect(getStatusBadgeVariant('Approved')).toBe('success');
      expect(getStatusBadgeVariant('aprovada')).toBe('success');
      expect(getStatusBadgeVariant('finished')).toBe('success');
      expect(getStatusBadgeVariant('entregue')).toBe('success');
    });

    it('deve mapear status de aviso para warning', () => {
      expect(getStatusBadgeVariant('AwaitingApproval')).toBe('warning');
      expect(getStatusBadgeVariant('em análise')).toBe('warning');
      expect(getStatusBadgeVariant('pending')).toBe('warning');
    });

    it('deve mapear status em andamento para primary', () => {
      expect(getStatusBadgeVariant('InQuote')).toBe('primary');
      expect(getStatusBadgeVariant('em cotação')).toBe('primary');
      expect(getStatusBadgeVariant('open')).toBe('primary');
      expect(getStatusBadgeVariant('emitido')).toBe('primary');
    });

    it('deve mapear erros e rejeições para danger', () => {
      expect(getStatusBadgeVariant('Rejected')).toBe('danger');
      expect(getStatusBadgeVariant('cancelada')).toBe('danger');
      expect(getStatusBadgeVariant('crítico')).toBe('danger');
    });

    it('deve retornar gray para rascunho ou nulo', () => {
      expect(getStatusBadgeVariant('Draft')).toBe('gray');
      expect(getStatusBadgeVariant(null)).toBe('gray');
      expect(getStatusBadgeVariant('')).toBe('gray');
    });
  });
});
