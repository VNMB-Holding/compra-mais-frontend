'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, Button, Badge, Icon, ErrorState, Skeleton } from '@/components/ui';
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  if (loading) {
    return (
      <div className={styles.portalContainer}>
        <header className={styles.portalHeader}>
          <div className={styles.headerContent}>
            <div className={styles.brandArea}>
              <img src="/images/logo-compra-mais.svg" alt="Compra+" className={styles.logo} />
              <div className={styles.brandDivider} />
              <span className={styles.portalTitle}>Portal de Governança e Alçadas</span>
            </div>
            <Badge variant="gray" className={styles.badgeSecurity}>
              <Icon name="shield-tick" size={13} /> Ambiente Seguro
            </Badge>
          </div>
        </header>
        <main className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <Card className={styles.approvalCard}>
              <Skeleton variant="title" width="45%" height={26} style={{ marginBottom: 12 }} />
              <Skeleton variant="text" width="70%" style={{ marginBottom: 20 }} />
              <Skeleton variant="rectangular" height={140} style={{ borderRadius: 8, marginBottom: 16 }} />
              <Skeleton variant="rectangular" height={40} style={{ borderRadius: 6 }} />
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className={styles.portalContainer}>
        <header className={styles.portalHeader}>
          <div className={styles.headerContent}>
            <div className={styles.brandArea}>
              <img src="/images/logo-compra-mais.svg" alt="Compra+" className={styles.logo} />
              <div className={styles.brandDivider} />
              <span className={styles.portalTitle}>Portal de Governança e Alçadas</span>
            </div>
            <Badge variant="gray" className={styles.badgeSecurity}>
              <Icon name="shield-tick" size={13} /> Ambiente Seguro
            </Badge>
          </div>
        </header>
        <main className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <Card className={styles.approvalCard}>
              <ErrorState
                title="Link Indisponível ou Expirado"
                message={error || 'Não foi possível carregar os dados desta aprovação. O link pode ter sido finalizado ou expirado.'}
              />
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.portalContainer}>
      <header className={styles.portalHeader}>
        <div className={styles.headerContent}>
          <div className={styles.brandArea}>
            <img src="/images/logo-compra-mais.svg" alt="Compra+" className={styles.logo} />
            <div className={styles.brandDivider} />
            <span className={styles.portalTitle}>Portal de Governança e Alçadas</span>
          </div>
          <Badge variant="gray" className={styles.badgeSecurity}>
            <Icon name="shield-tick" size={13} /> Ambiente Seguro
          </Badge>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <Card className={styles.approvalCard}>
            
            {}
            <div className={styles.cardHeader}>
              <div className={styles.titleRow}>
                <div className={styles.codeGroup}>
                  <h1>Solicitação #{details.code}</h1>
                  <Badge variant={completed ? 'success' : rejected ? 'danger' : 'warning'}>
                    {completed ? 'Aprovada' : rejected ? 'Recusada' : 'Aguardando Assinatura'}
                  </Badge>
                </div>
              </div>
              <p className={styles.demandDescription}>{details.description}</p>
              
              <div className={styles.metadataTags}>
                <span className={styles.infoTag}>
                  <Icon name="building-01" /> {details.department || 'Geral'}
                </span>
                <span className={styles.infoTag}>
                  <Icon name="user-01" /> Aprovador: <strong>{details.approverName}</strong> ({details.approverRole})
                </span>
                <span className={styles.infoTag}>
                  <Icon name="coins-stacked-01" /> Valor Estimado: <strong>{formatCurrency(details.estimatedBudget)}</strong>
                </span>
              </div>
            </div>

            {}
            {completed ? (
              <div className={styles.resultStateBox}>
                <div className={styles.successIconWrapper}>
                  <Icon name="check" size={28} />
                </div>
                <h2>Aprovação Registrada com Sucesso</h2>
                <p>
                  Sua assinatura eletrônica e os registros de auditoria foram gravados no fluxo de compras. A solicitação segue para a próxima alçada / cotação.
                </p>
              </div>
            ) : rejected ? (
              <div className={styles.resultStateBox}>
                <div className={styles.rejectIconWrapper}>
                  <Icon name="x-close" size={28} />
                </div>
                <h2>Solicitação Recusada</h2>
                <p>
                  A recusa desta demanda foi registrada formalmente no histórico da solicitação com a sua justificativa gravada.
                </p>
              </div>
            ) : (
              <>
                {}
                {details.justification && (
                  <div className={styles.justificationBox}>
                    <div className={styles.sectionLabel}>
                      <Icon name="file-01" size={14} /> Justificativa da Aquisição
                    </div>
                    <p>{details.justification}</p>
                  </div>
                )}

                {}
                {details.items && details.items.length > 0 && (
                  <div className={styles.itemsSection}>
                    <div className={styles.sectionHeader}>
                      <h4>
                        <Icon name="package" size={16} /> Itens da Demanda ({details.items.length})
                      </h4>
                    </div>
                    <div className={styles.tableWrapper}>
                      <table className={styles.itemsTable}>
                        <thead>
                          <tr>
                            <th style={{ width: 44, textAlign: 'center' }}>#</th>
                            <th>Descrição do Item</th>
                            <th style={{ width: 80, textAlign: 'right' }}>Qtd</th>
                            <th style={{ width: 70, textAlign: 'center' }}>Unid</th>
                            <th style={{ width: 130, textAlign: 'right' }}>Preço Unit.</th>
                            <th style={{ width: 130, textAlign: 'right' }}>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {details.items.map((item, idx) => (
                            <tr key={idx}>
                              <td style={{ textAlign: 'center', color: '#64748b', fontSize: 12, fontWeight: 600 }}>
                                {idx + 1}
                              </td>
                              <td>
                                <strong className={styles.itemDesc}>{item.description}</strong>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                                {item.quantity}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span className={styles.unitBadge}>{item.unit}</span>
                              </td>
                              <td style={{ textAlign: 'right', color: '#475569', fontSize: 12 }}>
                                {formatCurrency(item.estimatedUnitPrice)}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                                {formatCurrency(item.estimatedUnitPrice * item.quantity)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'right', fontWeight: 600, color: '#475569', fontSize: 13 }}>
                              Total Estimado:
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary, #007d79)', fontSize: 14 }}>
                              {formatCurrency(details.estimatedBudget)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {}
                {showRejectInput && (
                  <div className={styles.rejectInputArea}>
                    <label>Informe a justificativa da recusa *</label>
                    <textarea
                      rows={3}
                      placeholder="Descreva detalhadamente por que esta solicitação está sendo rejeitada..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>
                )}

                {}
                <div className={styles.actionsFooter}>
                  {!showRejectInput ? (
                    <div className={styles.actionButtonsRow}>
                      <Button
                        variant="primary"
                        onClick={handleApprove}
                        disabled={submitting}
                        loading={submitting}
                        loadingText="Assinando eletronicamente..."
                      >
                        <Icon name="check" /> Aprovar e Assinar
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setShowRejectInput(true)}
                        disabled={submitting}
                      >
                        <Icon name="x-close" /> Recusar Demanda
                      </Button>
                    </div>
                  ) : (
                    <div className={styles.actionButtonsRow}>
                      <Button
                        variant="danger"
                        onClick={handleReject}
                        disabled={submitting}
                        loading={submitting}
                        loadingText="Gravando recusa..."
                      >
                        <Icon name="x-close" /> Confirmar Recusa
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

                  <div className={styles.securityNote}>
                    <Icon name="shield-tick" size={14} />
                    <span>Assinatura digital com registro auditável de IP, geolocalização e data/hora de conformidade.</span>
                  </div>
                </div>
              </>
            )}

          </Card>
        </div>
      </main>
    </div>
  );
}
