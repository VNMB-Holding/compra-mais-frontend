'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from './aprovacao.module.css';

interface Item {
  description: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
}

interface ApprovalDetails {
  id: string;
  code: string;
  description: string;
  department: string;
  estimatedBudget: number;
  justification: string;
  approverName: string;
  approverRole: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  items: Item[];
}

export default function AprovacaoPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<ApprovalDetails | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!token) return;

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    fetch(`${backendUrl}/purchase-requests/approval-link/${token}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Link de aprovação inválido ou expirado.');
        }
        return res.json();
      })
      .then((data) => {
        setDetails(data);
        if (data.status === 'APPROVED') {
          setCompleted(true);
        }
      })
      .catch((err) => {
        setError(err.message || 'Erro ao carregar dados da aprovação.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleApprove = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${backendUrl}/purchase-requests/approval-link/${token}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });

      if (!res.ok) {
        throw new Error('Falha ao registrar aprovação.');
      }

      setCompleted(true);
    } catch (err: any) {
      alert(err.message || 'Erro ao aprovar solicitação.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card} style={{ padding: '3rem', textAlign: 'center' }}>
          <p>Carregando dados da aprovação...</p>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className={styles.container}>
        <div className={styles.card} style={{ padding: '3rem', textAlign: 'center' }}>
          <h2 style={{ color: '#ef4444' }}>Link Indisponível</h2>
          <p>{error || 'Não foi possível carregar a aprovação.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.badgeWrapper}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1' }}>
              Portal de Aprovações
            </span>
          </div>
          <h1 className={styles.title}>Aprovação de Compra #{details.code}</h1>
          <p className={styles.subtitle}>
            Olá <strong>{details.approverName}</strong> ({details.approverRole}), revise os detalhes abaixo para assinar.
          </p>
        </div>

        <div className={styles.content}>
          {completed ? (
            <div className={styles.successState}>
              <svg className={styles.successIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Aprovação Registrada com Sucesso!</h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                Sua assinatura eletrônica e os dados de auditoria (IP e Timestamp) foram gravados com sucesso.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Resumo da Solicitação</h3>
                <div className={styles.grid}>
                  <div>
                    <div className={styles.label}>Título / Descrição</div>
                    <div className={styles.value}>{details.description}</div>
                  </div>
                  <div>
                    <div className={styles.label}>Departamento</div>
                    <div className={styles.value}>{details.department}</div>
                  </div>
                  <div>
                    <div className={styles.label}>Valor Estimado</div>
                    <div className={styles.value}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(details.estimatedBudget)}
                    </div>
                  </div>
                  <div>
                    <div className={styles.label}>Justificativa</div>
                    <div className={styles.value}>{details.justification}</div>
                  </div>
                </div>
              </div>

              {details.items && details.items.length > 0 && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Itens da Solicitação</h3>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Qtd</th>
                          <th>Unidade</th>
                          <th>Preço Est. Un.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {details.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.description}</td>
                            <td>{item.quantity}</td>
                            <td>{item.unit}</td>
                            <td>
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.estimatedUnitPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className={styles.actions}>
                <button
                  onClick={handleApprove}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0284c7',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '1rem',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? 'Registrando Aprovação...' : 'Confirmar e Assinar Eletronicamente'}
                </button>

                <div className={styles.auditNote}>
                  Ao clicar em confirmar, seu IP, horário UTC e dados de dispositivo serão gravados no certificado digital/PDF de auditoria.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
