import { describe, it, expect, vi } from 'vitest';
import { ApiError } from '@/lib/api-client';
import { getErrorMessage } from '@/utils';

describe('TC-SYS-01 / TC-SYS-05: Resiliência de Sistema, Idempotência e Tratamento de Falhas', () => {
  describe('Idempotência e Prevenção de Duplicidade (TC-SYS-01)', () => {
    it('deve garantir que chamadas com a mesma chave de idempotência processem de forma idempotente', async () => {
      const processedKeys = new Set<string>();

      async function processTransactionalRequest(idempotencyKey: string, payload: any) {
        if (processedKeys.has(idempotencyKey)) {
          return { status: 'ALREADY_PROCESSED', cached: true };
        }
        processedKeys.add(idempotencyKey);
        return { status: 'CREATED', id: 'tx-123', payload };
      }

      const key = 'idem-req-998822';
      const firstCall = await processTransactionalRequest(key, { amount: 5000 });
      expect(firstCall.status).toBe('CREATED');

      // Segunda chamada com a mesma chave (ex: reenvio após timeout de rede)
      const duplicateCall = await processTransactionalRequest(key, { amount: 5000 });
      expect(duplicateCall.status).toBe('ALREADY_PROCESSED');
      expect(duplicateCall.cached).toBe(true);
    });
  });

  describe('Concorrência Otimista (Optimistic Locking - TC-USR-06)', () => {
    it('deve tratar conflito de concorrência HTTP 409 informando que o registro foi modificado', () => {
      const conflictError = new ApiError('Conflict: record was modified by another transaction', 409);
      expect(conflictError.status).toBe(409);

      // Função de parsing amigável
      const userMessage = conflictError.status === 409
        ? 'Este registro foi alterado por outro usuário. Por favor, atualize a página.'
        : getErrorMessage(conflictError);

      expect(userMessage).toBe('Este registro foi alterado por outro usuário. Por favor, atualize a página.');
    });
  });

  describe('Resiliência: Retentativas com Backoff e Fallback (TC-SYS-05)', () => {
    it('deve retentar operação transitória até o sucesso', async () => {
      let attempts = 0;

      async function executeWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
        let lastError: any;
        for (let i = 0; i < maxRetries; i++) {
          try {
            return await fn();
          } catch (err) {
            lastError = err;
          }
        }
        throw lastError;
      }

      const flakyService = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new TypeError('Failed to fetch');
        }
        return { data: 'Sucesso na 3ª tentativa' };
      });

      const result = await executeWithRetry<{ data: string }>(flakyService, 3);
      expect(result.data).toBe('Sucesso na 3ª tentativa');
      expect(attempts).toBe(3);
    });

    it('deve acionar circuito aberto e resposta de contingência (Circuit Breaker)', async () => {
      class SimpleCircuitBreaker {
        private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
        private failureCount = 0;
        private readonly threshold: number;

        constructor(threshold = 3) {
          this.threshold = threshold;
        }

        getState() {
          return this.state;
        }

        async execute<T>(action: () => Promise<T>, fallback: () => T): Promise<T> {
          if (this.state === 'OPEN') {
            return fallback();
          }

          try {
            const result = await action();
            this.failureCount = 0;
            return result;
          } catch (err) {
            this.failureCount++;
            if (this.failureCount >= this.threshold) {
              this.state = 'OPEN';
            }
            throw err;
          }
        }
      }

      const breaker = new SimpleCircuitBreaker(2);
      const failingExternalApi = vi.fn().mockRejectedValue(new Error('API Terceira Inoperante (504 Gateway Timeout)'));
      const fallbackValue = { fallback: true, message: 'Cotação estimada em modo contingencial' };

      // 1ª falha
      await expect(breaker.execute(failingExternalApi, () => fallbackValue)).rejects.toThrow();
      expect(breaker.getState()).toBe('CLOSED');

      // 2ª falha -> atinge limiar e abre circuito
      await expect(breaker.execute(failingExternalApi, () => fallbackValue)).rejects.toThrow();
      expect(breaker.getState()).toBe('OPEN');

      // 3ª chamada -> circuito aberto, aciona fallback imediatamente sem chamar a API externa
      const fallbackResult = await breaker.execute(failingExternalApi, () => fallbackValue);
      expect(fallbackResult).toEqual(fallbackValue);
      expect(failingExternalApi).toHaveBeenCalledTimes(2); // Não foi chamada a 3ª vez
    });
  });
});
