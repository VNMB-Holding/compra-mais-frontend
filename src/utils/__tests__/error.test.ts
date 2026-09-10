import { describe, it, expect } from 'vitest';
import { getErrorMessage } from '@/utils';
import { ApiError } from '@/lib/api-client';

describe('Error Utilities', () => {
  describe('getErrorMessage', () => {
    it('deve retornar mensagem amigável para status 401 (não autorizado)', () => {
      const apiError = new ApiError('Unauthorized', 401);
      expect(getErrorMessage(apiError)).toBe('Sua sessão expirou. Faça login novamente.');
    });

    it('deve retornar mensagem amigável para status 403 (proibido)', () => {
      const apiError = new ApiError('Forbidden', 403);
      expect(getErrorMessage(apiError)).toBe('Você não tem permissão para realizar esta ação.');
    });

    it('deve retornar mensagem amigável para status 404 (não encontrado)', () => {
      const apiError = new ApiError('Not found', 404);
      expect(getErrorMessage(apiError)).toBe('O recurso solicitado não foi encontrado.');
    });

    it('deve retornar mensagem de instabilidade para status >= 500', () => {
      const apiError = new ApiError('Internal Server Error', 500);
      expect(getErrorMessage(apiError)).toBe('O servidor encontrou um problema. Tente novamente em instantes.');
    });

    it('deve retornar mensagem amigável de conexão para TypeError (falha de rede do fetch)', () => {
      const networkError = new TypeError('Failed to fetch');
      expect(getErrorMessage(networkError)).toBe(
        'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
      );
    });

    it('deve retornar message para Error genérico', () => {
      const err = new Error('Erro customizado de negócio');
      expect(getErrorMessage(err)).toBe('Erro customizado de negócio');
    });

    it('deve retornar mensagem de fallback para valores desconhecidos', () => {
      expect(getErrorMessage('uma string de erro')).toBe('Ocorreu um erro desconhecido. Tente novamente.');
      expect(getErrorMessage(null)).toBe('Ocorreu um erro desconhecido. Tente novamente.');
    });
  });
});
