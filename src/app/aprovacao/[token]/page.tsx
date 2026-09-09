'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, Button, Badge, Icon, Loading, ErrorState, Skeleton } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import styles from './aprovacao.module.css';

import { purchaseRequestsApi } from '@/lib/api/purchase-requests';

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

    purchaseRequestsApi
      .getApprovalByToken(token)
      .then((data: any) => {
        setDetails(data);
        if (data.status === 'APPROVED') {
          setCompleted(true);
        } else if (data.status === 'REJECTED') {
          setRejected(true);
        }
      })
      .catch((err: any) => {
        setError(err.message || 'Link de aprovação inválido ou expirado.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const { toast } = useToast();

  const handleApprove = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      await purchaseRequestsApi.approveByToken(token);
      setCompleted(true);
      toast({
        variant: "success",
        title: "Demanda Aprovada",
        message: "Assinatura registrada com sucesso.",
      });
    } catch (err: any) {
      toast({
        variant: "error",
        title: "Erro ao aprovar",
        message: err.message || "Erro ao aprovar solicitação.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!token) return;
    if (!rejectionReason.trim()) {
      toast({
        variant: "warning",
        title: "Campo obrigatório",
        message: "Por favor, informe a justificativa da recusa.",
      });
      return;
    }
    setSubmitting(true);
    try {
      await purchaseRequestsApi.rejectByToken(token, rejectionReason.trim());
      setRejected(true);
      toast({
        variant: "info",
        title: "Demanda Recusada",
        message: "A recusa da solicitação foi registrada.",
      });
    } catch (err: any) {
      toast({
        variant: "error",
        title: "Erro ao recusar",
        message: err.message || "Erro ao recusar solicitação.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.portalContainer}>
        <header className={styles.portalHeader}>
          <div className={styles.brandArea}>
            <img src="/images/logo-compra-mais.svg" alt="Compra+" className={styles.logo} />
            <span className={styles.badgePortal}>
              <Icon name="shield-tick" size={13} /> Portal de Assinatura Digital
            </span>
          </div>
        </header>
        <main className={styles.mainContent}>
          <div className={styles.card}>
            <div className={styles.cardBody}>
              <Skeleton variant="title" width="40%" height={28} style={{ marginBottom: 12 }} />
              <Skeleton variant="text" width="60%" style={{ marginBottom: 24 }} />
              <Skeleton variant="rectangular" height={160} style={{ borderRadius: 12, marginBottom: 20 }} />
              <Skeleton variant="rectangular" height={44} style={{ borderRadius: 8 }} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className={styles.portalContainer}>
        <header className={styles.portalHeader}>
          <div className={styles.brandArea}>
            <img src="/images/logo-compra-mais.svg" alt="Compra+" className={styles.logo} />
            <span className={styles.badgePortal}>
              <Icon name="shield-tick" size={13} /> Portal de Assinatura Digital
            </span>
          </div>
        </header>
        <main className={styles.mainContent}>
          <div className={styles.card}>
            <div className={styles.cardBody}>
              <ErrorState
                title="Link Indisponível ou Expirado"
                message={error || 'Não foi possível carregar os dados desta aprovação. O link pode ter sido finalizado ou expirado.'}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.portalContainer}>
      
      <header className={styles.portalHeader}>
        <div className={styles.brandArea}>
          <img src="/images/logo-compra-mais.svg" alt="Compra+" className={styles.logo} />
          <span className={styles.badgePortal}>
            <Icon name="shield-tick" size={13} /> Portal de Assinatura Digital
          </span>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.card}>
          <div className={styles.accentBar} />

          <div className={styles.cardBody}>
            
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.titleRow}>
                  <h1>Solicitação #{details.code}</h1>
                  <Badge variant={completed ? 'success' : rejected ? 'gray' : 'warning'}>
                    {completed ? 'Aprovada' : rejected ? 'Recusada' : 'Aguardando Assinatura'}
                  </Badge>
                </div>
                <p className={styles.approverText}>
                  Aprovador Designado: <strong>{details.approverName}</strong> · <span className={styles.roleText}>{details.approverRole}</span>
                </p>
              </div>
            </div>

            {completed ? (
              <div className={styles.resultStateBox}>
                <div className={styles.successIconWrapper}>
                  <Icon name="check-circle" size={32} />
                </div>
                <h2>Aprovação Confirmada com Sucesso!</h2>
                <p>
                  Sua assinatura eletrônica e os registros de auditoria foram gravados no fluxo de compras. A solicitação segue para a próxima alçada / cotação.
                </p>
              </div>
            ) : rejected ? (
              <div className={styles.resultStateBox}>
                <div className={styles.rejectIconWrapper}>
                  <Icon name="x-circle" size={32} />
                </div>
                <h2 style={{ color: '#dc2626' }}>Solicitação Recusada</h2>
                <p>
                  A recusa desta demanda foi registrada formalmente no histórico da solicitação com a sua justificativa.
                </p>
              </div>
            ) : (
              <>
                
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItemFull}>
                    <label>Descrição da Demanda</label>
                    <p className={styles.demandTitle}>{details.description}</p>
                  </div>

                  <div className={styles.detailItem}>
                    <label>Departamento / Centro</label>
                    <span>{details.department || "Geral"}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <label>Valor Estimado</label>
                    <strong className={styles.budgetValue}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(details.estimatedBudget)}
                    </strong>
                  </div>

                  {details.justification && (
                    <div className={styles.detailItemFull}>
                      <label>Justificativa da Aquisição</label>
                      <p className={styles.justificationText}>{details.justification}</p>
                    </div>
                  )}
                </div>

                
                {details.items && details.items.length > 0 && (
                  <div className={styles.itemsBlock}>
                    <div className={styles.itemsBlockHeader}>
                      <h4><Icon name="package" size={16} /> Itens da Demanda ({details.items.length})</h4>
                    </div>
                    <div className={styles.itemsList}>
                      {details.items.map((item, idx) => (
                        <div key={idx} className={styles.itemCard}>
                          <div className={styles.itemInfo}>
                            <strong>{item.description}</strong>
                            <small>Quantidade: {item.quantity} {item.unit}</small>
                          </div>
                          <span className={styles.itemTotal}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.estimatedUnitPrice * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                
                {showRejectInput && (
                  <div className={styles.rejectInputArea}>
                    <label>Informe o motivo da recusa *</label>
                    <textarea
                      rows={3}
                      placeholder="Descreva por que esta solicitação está sendo rejeitada..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>
                )}

                
                <div className={styles.actionsContainer}>
                  {!showRejectInput ? (
                    <div className={styles.actionButtonsRow}>
                      <Button
                        variant="primary"
                        onClick={handleApprove}
                        disabled={submitting}
                        className={styles.approveBtn}
                      >
                        <Icon name="check" /> {submitting ? 'Assinando eletronicamente...' : 'Confirmar e Assinar'}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setShowRejectInput(true)}
                        disabled={submitting}
                        className={styles.rejectBtn}
                      >
                        <Icon name="x-close" /> Recusar Demanda
                      </Button>
                    </div>
                  ) : (
                    <div className={styles.actionButtonsRow}>
                      <Button
                        variant="primary"
                        onClick={handleReject}
                        disabled={submitting}
                        style={{ background: '#dc2626', borderColor: '#dc2626', flex: 1 }}
                      >
                        <Icon name="x-close" /> {submitting ? 'Gravando recusa...' : 'Confirmar Recusa'}
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

                  <div className={styles.securityFooter}>
                    <Icon name="shield-tick" size={14} /> Assinatura digital com registro de IP, geolocalização e data/hora de auditoria.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
