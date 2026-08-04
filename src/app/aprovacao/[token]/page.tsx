'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, Button, Badge, Icon, Loading, ErrorState } from '@/components/ui';
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
  const [rejected, setRejected] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!token) return;

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    fetch(`${backendUrl}/api/purchase-requests/approval-link/${token}`)
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
        } else if (data.status === 'REJECTED') {
          setRejected(true);
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
      const res = await fetch(`${backendUrl}/api/purchase-requests/approval-link/${token}/approve`, {
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

  const handleReject = async () => {
    if (!token) return;
    if (!rejectionReason.trim()) {
      alert('Por favor, informe a justificativa da recusa.');
      return;
    }
    setSubmitting(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${backendUrl}/api/purchase-requests/approval-link/${token}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: rejectionReason.trim() }),
      });

      if (!res.ok) {
        throw new Error('Falha ao registrar recusa.');
      }

      setRejected(true);
    } catch (err: any) {
      alert(err.message || 'Erro ao recusar solicitação.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.cardWrapper}>
          <Card style={{ padding: '48px', textAlign: 'center' }}>
            <Loading variant="inline" message="Carregando solicitação de aprovação..." size="large" />
          </Card>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className={styles.container}>
        <div className={styles.cardWrapper}>
          <Card>
            <ErrorState
              title="Link Indisponível"
              message={error || 'Não foi possível carregar os dados desta aprovação.'}
            />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.cardWrapper}>
        <Card>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.badgeTag}>
                <Icon name="check-circle" size={14} /> Portal de Aprovações
              </div>
              <h1 className={styles.title}>Solicitação #{details.code}</h1>
              <p className={styles.subtitle}>
                Aprovador: <strong>{details.approverName}</strong> ({details.approverRole})
              </p>
            </div>
            <Badge variant={completed ? 'success' : rejected ? 'danger' : 'warning'}>
              {completed ? 'Aprovada' : rejected ? 'Recusada' : 'Aguardando Aprovação'}
            </Badge>
          </div>

          {completed ? (
            <div className={styles.successBox}>
              <div className={styles.successIcon}>
                <Icon name="check" size={28} />
              </div>
              <h2 className={styles.successTitle}>Aprovação Confirmada!</h2>
              <p className={styles.successText}>
                Sua assinatura eletrônica e os dados de auditoria (IP e Timestamp) foram gravados com sucesso no histórico da solicitação.
              </p>
            </div>
          ) : rejected ? (
            <div className={styles.successBox} style={{ borderColor: 'var(--color-danger, #ef4444)' }}>
              <div className={styles.successIcon} style={{ background: '#fee2e2', color: '#dc2626' }}>
                <Icon name="close" size={28} />
              </div>
              <h2 className={styles.successTitle} style={{ color: '#dc2626' }}>Solicitação Recusada</h2>
              <p className={styles.successText}>
                A recusa desta demanda foi registrada com sucesso no histórico da solicitação.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.infoGrid}>
                <div className={styles.spanFull}>
                  <span className={styles.label}>Descrição da Demanda</span>
                  <span className={styles.value}>{details.description}</span>
                </div>
                <div>
                  <span className={styles.label}>Departamento</span>
                  <span className={styles.value}>{details.department}</span>
                </div>
                <div>
                  <span className={styles.label}>Valor Estimado</span>
                  <span className={styles.valueHighlight}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(details.estimatedBudget)}
                  </span>
                </div>
                <div className={styles.spanFull}>
                  <span className={styles.label}>Justificativa</span>
                  <span className={styles.value}>{details.justification}</span>
                </div>
              </div>

              {details.items && details.items.length > 0 && (
                <div className={styles.itemsSection}>
                  <h3 className={styles.sectionTitle}>Itens da Solicitação ({details.items.length})</h3>
                  <div className={styles.itemsList}>
                    {details.items.map((item, idx) => (
                      <div key={idx} className={styles.itemRow}>
                        <div>
                          <div className={styles.itemDesc}>{item.description}</div>
                          <div className={styles.itemMeta}>
                            Qtd: <strong>{item.quantity} {item.unit}</strong>
                          </div>
                        </div>
                        <div className={styles.itemPrice}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.estimatedUnitPrice * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showRejectInput && (
                <div style={{ marginTop: '16px', marginBottom: '8px' }}>
                  <label className={styles.label} style={{ marginBottom: '6px', display: 'block' }}>Motivo da Recusa *</label>
                  <textarea
                    rows={3}
                    placeholder="Descreva o motivo pelo qual esta solicitação está sendo recusada..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                </div>
              )}

              <div className={styles.actionBox}>
                {!showRejectInput ? (
                  <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    <Button
                      variant="primary"
                      className={styles.btnApprove}
                      onClick={handleApprove}
                      disabled={submitting}
                      style={{ flex: 1 }}
                    >
                      <Icon name="check" /> {submitting ? 'Registrando...' : 'Confirmar e Assinar'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowRejectInput(true)}
                      disabled={submitting}
                      style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                    >
                      <Icon name="close" /> Recusar Demanda
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    <Button
                      variant="primary"
                      onClick={handleReject}
                      disabled={submitting}
                      style={{ background: '#dc2626', borderColor: '#dc2626', flex: 1 }}
                    >
                      <Icon name="close" /> {submitting ? 'Enviando Recusa...' : 'Confirmar Recusa'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowRejectInput(false)}
                      disabled={submitting}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}

                <div className={styles.auditFooter}>
                  <Icon name="shield-tick" size={14} /> Assinatura protegida com registro de IP, data e hora de auditoria.
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
