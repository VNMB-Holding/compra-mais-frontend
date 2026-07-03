"use client";

import React, { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, Button, Badge, Icon, ConfirmDialog, Stepper, Loading, ExportButton } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import styles from "./pedido-detail.module.css";

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function PedidoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const pedidoId = (params.id as string) || "PED-000234";
  const isNewFlow = pedidoId === "PED-NOVO";

  // Estados
  const [confirmRecebimento, setConfirmRecebimento] = useState(false);
  const [recebimentoConfirmado, setRecebimentoConfirmado] = useState(false);
  const [poApproved, setPoApproved] = useState<boolean | null>(isNewFlow ? null : true);
  const [poConfirmDialog, setPoConfirmDialog] = useState<"approve" | "reject" | null>(null);

  const [exportingType, setExportingType] = useState<"PDF" | "XLS" | null>(null);
  const { toast } = useToast();

  const handleExport = (type: "PDF" | "XLS") => {
    setExportingType(type);
    setTimeout(() => {
      setExportingType(null);
      toast({
        variant: "success",
        title: "Download Iniciado!",
        message: `O relatório do pedido (${type}) foi gerado e baixado com sucesso.`
      });
    }, 1500);
  };

  // Lê os dados do fornecedor vencedor vindos da RFQ
  const fornecedorNome = searchParams.get("fornecedor") || "Fornecedor Alfa S.A.";
  const fornecedorCnpj = searchParams.get("cnpj") || "11.222.333/0001-81";
  const precoUnit = Number(searchParams.get("precoUnit") || 5.95);
  const frete = Number(searchParams.get("frete") || 0.25);
  const prazo = Number(searchParams.get("prazo") || 2);
  const pagamento = searchParams.get("pagamento") || "30 dias DDL";
  const qtdTotal = Number(searchParams.get("qtdTotal") || 512000);
  const rfqOrigem = searchParams.get("rfq") || "RFQ-2026-004";
  const solOrigem = searchParams.get("origem") || "SOL-000456";

  const valorTotal = (precoUnit + frete) * qtdTotal;

  // Data de entrega prevista (hoje + prazo)
  const dataEntrega = new Date();
  dataEntrega.setDate(dataEntrega.getDate() + prazo);
  const dataEntregaFormatada = dataEntrega.toLocaleDateString("pt-BR");

  // Vencimento do pagamento (30 dias úteis simplificado)
  const dataVencimento = new Date();
  dataVencimento.setDate(dataVencimento.getDate() + 30);
  const dataVencimentoFormatada = dataVencimento.toLocaleDateString("pt-BR");

  // Código exibido
  const displayId = isNewFlow
    ? `PED-${String(Date.now()).slice(-6)}`
    : pedidoId;

  // Handlers de Aprovação
  const handleApprovePO = () => {
    setPoApproved(true);
    setPoConfirmDialog(null);
    toast({
      variant: "success",
      title: "Pedido aprovado e emitido!",
      message: `O pedido ${pedidoId !== "PED-NOVO" ? pedidoId : displayId} foi emitido para o fornecedor.`,
    });
  };

  const handleRejectPO = () => {
    setPoApproved(false);
    setPoConfirmDialog(null);
    toast({
      variant: "error",
      title: "Pedido recusado",
      message: `O pedido ${pedidoId !== "PED-NOVO" ? pedidoId : displayId} foi recusado e não será emitido.`,
    });
  };

  return (
    <ProtectedLayout allowedRoles={["procurist", "gerente", "admin"]}>
      <div className={styles.detailContainer}>
        
        {/* Modal de Confirmação de Recebimento */}
        <ConfirmDialog
          open={confirmRecebimento}
          variant="success"
          icon="package-check"
          title="Confirmar recebimento do pedido?"
          message={
            <>Os itens de <strong>{pedidoId !== "PED-NOVO" ? pedidoId : displayId}</strong> foram conferidos e estão em conformidade com o pedido. Esta ação finaliza o ciclo de entrega.</>
          }
          confirmLabel="Confirmar recebimento"
          onConfirm={() => {
            setRecebimentoConfirmado(true);
            setConfirmRecebimento(false);
            toast({
              variant: "success",
              title: "Recebimento confirmado!",
              message: `Os itens de ${pedidoId !== "PED-NOVO" ? pedidoId : displayId} foram recebidos e conferidos. Ciclo de entrega finalizado.`,
              duration: 5000,
            });
          }}
          onCancel={() => setConfirmRecebimento(false)}
        />

        {/* Modal de Confirmação de Aprovação de PO */}
        <ConfirmDialog
          open={poConfirmDialog === "approve"}
          variant="success"
          icon="check-circle"
          title="Aprovar e Emitir Pedido de Compra?"
          message={
            <>O pedido <strong>{pedidoId !== "PED-NOVO" ? pedidoId : displayId}</strong> será aprovado e enviado ao fornecedor <strong>{fornecedorNome}</strong>.</>
          }
          confirmLabel="Sim, aprovar"
          onConfirm={handleApprovePO}
          onCancel={() => setPoConfirmDialog(null)}
        />

        {/* Modal de Confirmação de Rejeição de PO */}
        <ConfirmDialog
          open={poConfirmDialog === "reject"}
          variant="danger"
          icon="x-circle"
          title="Recusar Pedido de Compra?"
          message={
            <>O pedido <strong>{pedidoId !== "PED-NOVO" ? pedidoId : displayId}</strong> será marcado como recusado e arquivado.</>
          }
          confirmLabel="Sim, recusar"
          onConfirm={handleRejectPO}
          onCancel={() => setPoConfirmDialog(null)}
        />

        {exportingType && <Loading variant="fullscreen" message={`Gerando relatório...`} />}

        <button
          className={styles.backBtn}
          onClick={() => router.push("/compras/pedidos")}
        >
          <Icon name="chevron-left" /> Voltar para Pedidos
        </button>

        {/* Cabeçalho */}
        <div className={styles.pageHeader}>
          <div className={styles.headerTitles}>
            <span className={styles.eyebrow}>Pedido de Compra</span>
            <div className={styles.titleRow}>
              <h1>{displayId}</h1>
              <Badge
                variant={
                  poApproved === null
                    ? "warning"
                    : poApproved === false
                    ? "gray"
                    : isNewFlow
                    ? "success"
                    : "primary"
                }
                icon={
                  poApproved === null
                    ? "clock"
                    : poApproved === false
                    ? "x-close"
                    : isNewFlow
                    ? "check-circle"
                    : "receipt-check"
                }
              >
                {poApproved === null
                  ? "Aguardando Aprovação"
                  : poApproved === false
                  ? "Recusado"
                  : isNewFlow
                  ? "Emitido"
                  : "Faturado"}
              </Badge>
            </div>
            <p className={styles.subtitleLarge}>{fornecedorNome}</p>
            {isNewFlow && (
              <div className={styles.originTags}>
                <span className={styles.originTag}>
                  <Icon name="file-01" size={13} /> {solOrigem}
                </span>
                <span className={styles.originTag}>
                  <Icon name="receipt-check" size={13} /> {rfqOrigem}
                </span>
              </div>
            )}
          </div>

          <div className={styles.headerActions}>
            <ExportButton onExport={handleExport} />

            {poApproved === null && (
              <>
                <Button variant="secondary" onClick={() => setPoConfirmDialog("reject")}>
                  <Icon name="x-close" /> Recusar Pedido
                </Button>
                <Button variant="primary" onClick={() => setPoConfirmDialog("approve")}>
                  <Icon name="check" /> Aprovar Pedido
                </Button>
              </>
            )}

            {poApproved === true && (
              <>
                <Button variant="secondary">
                  <Icon name="printer" /> Imprimir PO
                </Button>
                {!recebimentoConfirmado ? (
                  <Button variant="primary" onClick={() => setConfirmRecebimento(true)}>
                    <Icon name="truck-01" /> Confirmar Recebimento
                  </Button>
                ) : (
                  <Button variant="secondary" disabled>
                    <Icon name="check-circle" /> Recebido
                  </Button>
                )}
              </>
            )}

            {poApproved === false && (
              <Button variant="secondary" disabled>
                <Icon name="x-close" /> Recusado
              </Button>
            )}
          </div>
        </div>

        {/* Grid de duas colunas padrão */}
        <div className={styles.layout2Col}>
          
          {/* Coluna Principal */}
          <div className={styles.colMain}>
            
            {/* Stepper de Fluxo */}
            <Card className={styles.flowCard}>
              <h4>Acompanhamento do Pedido</h4>
              <Stepper
                steps={[
                  {
                    label: "Aprovação e Emissão",
                    description:
                      poApproved === true
                        ? "Pedido emitido"
                        : poApproved === false
                        ? "Emissão recusada"
                        : "Aprovação pendente",
                    subDescription: new Date().toLocaleDateString("pt-BR"),
                    status:
                      poApproved === true
                        ? "completed"
                        : poApproved === false
                        ? "pending"
                        : "active",
                    icon: "file-01",
                  },
                  {
                    label: "Faturado (NF-e)",
                    description:
                      poApproved === false
                        ? "Cancelado"
                        : isNewFlow
                        ? "Aguardando fatura"
                        : "Nota emitida",
                    status:
                      poApproved === true && !isNewFlow
                        ? "completed"
                        : "pending",
                    icon: "receipt-check",
                  },
                  {
                    label: "Em Transporte",
                    description:
                      poApproved === false
                        ? "Cancelado"
                        : recebimentoConfirmado
                        ? "Entrega concluída"
                        : isNewFlow
                        ? "Pendente"
                        : "Em trânsito",
                    status:
                      poApproved === true && recebimentoConfirmado
                        ? "completed"
                        : poApproved === true && !isNewFlow
                        ? "active"
                        : "pending",
                    icon: "truck-01",
                  },
                  {
                    label: "Entregue",
                    description:
                      poApproved === false
                        ? "Cancelado"
                        : recebimentoConfirmado
                        ? "Recebido"
                        : "Pendente",
                    status:
                      poApproved === true && recebimentoConfirmado
                        ? "completed"
                        : "pending",
                    icon: "package",
                  },
                ]}
              />
            </Card>

            {/* Ficha Técnica */}
            <Card className={styles.infoCard}>
              <h4>Ficha Técnica do Pedido</h4>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>Fornecedor</label>
                  <span>{fornecedorNome} ({fornecedorCnpj})</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Condição de Pagamento</label>
                  <span>{pagamento}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Incoterm / Frete</label>
                  <span>CIF (Frete incluso no valor)</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Previsão de Entrega</label>
                  <span>{dataEntregaFormatada} (Em {prazo} dia{prazo !== 1 ? "s" : ""})</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Vencimento Estimado</label>
                  <span>{dataVencimentoFormatada}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>Origem da Demanda</label>
                  <span>{solOrigem} (Solicitação) / {rfqOrigem} (Cotação)</span>
                </div>
              </div>
            </Card>

            {/* Itens do Pedido */}
            <div className={styles.itemsCard}>
              <div className={styles.itemsCardHeader}>
                <h3><Icon name="package" size={18} /> Itens Vinculados</h3>
              </div>
              <div className={styles.itemsTableWrapper}>
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th>Material / Descrição</th>
                      <th style={{ width: "120px", textAlign: "right" }}>Quantidade</th>
                      <th style={{ width: "100px", textAlign: "center" }}>UM</th>
                      <th style={{ width: "160px", textAlign: "right" }}>Preço Unitário</th>
                      <th style={{ width: "160px", textAlign: "right" }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isNewFlow ? (
                      <>
                        <tr>
                          <td>
                            <div className={styles.itemDesc}>
                              <div className={styles.itemIconWrapper}>
                                <Icon name="droplets-02" size={20} />
                              </div>
                              <div className={styles.itemDescText}>
                                <strong>Óleo Diesel S10</strong>
                                <small>Origem: {solOrigem}</small>
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: "right", fontWeight: "600" }}>
                            {(500000).toLocaleString("pt-BR")}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span className={styles.badgeUm}>L</span>
                          </td>
                          <td style={{ textAlign: "right" }}>{formatCurrency(precoUnit)}</td>
                          <td style={{ textAlign: "right" }} className={styles.tdSubtotal}>
                            {formatCurrency(precoUnit * 500000)}
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div className={styles.itemDesc}>
                              <div className={styles.itemIconWrapper}>
                                <Icon name="package" size={20} />
                              </div>
                              <div className={styles.itemDescText}>
                                <strong>Aditivo ARLA 32</strong>
                                <small>Origem: {solOrigem}</small>
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: "right", fontWeight: "600" }}>
                            {(12000).toLocaleString("pt-BR")}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span className={styles.badgeUm}>L</span>
                          </td>
                          <td style={{ textAlign: "right" }}>{formatCurrency(frete)}</td>
                          <td style={{ textAlign: "right" }} className={styles.tdSubtotal}>
                            {formatCurrency(frete * 12000)}
                          </td>
                        </tr>
                      </>
                    ) : (
                      <>
                        <tr>
                          <td>
                            <div className={styles.itemDesc}>
                              <div className={styles.itemIconWrapper}>
                                <Icon name="package" size={20} />
                              </div>
                              <div className={styles.itemDescText}>
                                <strong>Filtro de Ar Motor X1</strong>
                                <small>Código técnico: CC-MRO-019</small>
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: "right", fontWeight: "600" }}>50</td>
                          <td style={{ textAlign: "center" }}>
                            <span className={styles.badgeUm}>UN</span>
                          </td>
                          <td style={{ textAlign: "right" }}>R$ 308,00</td>
                          <td style={{ textAlign: "right" }} className={styles.tdSubtotal}>
                            R$ 15.400,00
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div className={styles.itemDesc}>
                              <div className={styles.itemIconWrapper}>
                                <Icon name="droplets-02" size={20} />
                              </div>
                              <div className={styles.itemDescText}>
                                <strong>Óleo Lubrificante 15W40 Sintético</strong>
                                <small>Código técnico: CC-MRO-042</small>
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: "right", fontWeight: "600" }}>200</td>
                          <td style={{ textAlign: "center" }}>
                            <span className={styles.badgeUm}>L</span>
                          </td>
                          <td style={{ textAlign: "right" }}>R$ 45,00</td>
                          <td style={{ textAlign: "right" }} className={styles.tdSubtotal}>
                            R$ 9.000,00
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Coluna Lateral */}
          <div className={styles.colSide}>
            
            {/* Card de Resumo Financeiro */}
            <Card className={styles.sideCard} style={{ background: "linear-gradient(135deg, #004d4a, #007d79)", border: "none", color: "white", padding: "24px" }}>
              <div className={styles.darkCardContent}>
                <span style={{ color: "#cce5e5", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Valor Total do Pedido</span>
                <h3 style={{ fontSize: "28px", fontWeight: "900", margin: "8px 0 4px", color: "white" }}>
                  {formatCurrency(isNewFlow ? valorTotal : 24400)}
                </h3>
                <span style={{ color: "#cce5e5", fontSize: "12px" }}>Impostos e frete inclusos</span>
              </div>
            </Card>

            {/* Rastreabilidade */}
            <Card className={styles.sideCard}>
              <h4>Rastreabilidade</h4>
              <div className={styles.verticalTimeline}>
                <div className={`${styles.vtItem} ${styles.vtDone}`}>
                  <div className={styles.vtDot}></div>
                  <div className={styles.vtContent}>
                    <strong>Pedido Emitido</strong>
                    <span>Disparado para o fornecedor</span>
                    <small>{new Date().toLocaleDateString("pt-BR")} às 10:00</small>
                  </div>
                </div>

                {/* Evento de aprovação dinâmico */}
                {poApproved !== null && (
                  <div className={`${styles.vtItem} ${styles.vtDone}`}>
                    <div className={styles.vtDot}></div>
                    <div className={styles.vtContent}>
                      <strong>{poApproved ? "Pedido Aprovado" : "Pedido Recusado"}</strong>
                      <span>Por Mariana Costa (Gestão Geral)</span>
                      <small>{new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</small>
                    </div>
                  </div>
                )}

                <div className={`${styles.vtItem} ${isNewFlow && poApproved === null ? styles.vtPending : poApproved === false ? styles.vtPending : !isNewFlow ? styles.vtDone : styles.vtPending}`}>
                  <div className={styles.vtDot}></div>
                  <div className={styles.vtContent}>
                    <strong>{isNewFlow ? "Faturamento Pendente" : "NF-e Faturada"}</strong>
                    <span>{isNewFlow ? "Aguardando envio da nota pelo fornecedor" : "XML recebido da receita federal"}</span>
                    {!isNewFlow && <small>{new Date().toLocaleDateString("pt-BR")} às 14:32</small>}
                  </div>
                </div>

                <div className={`${styles.vtItem} ${recebimentoConfirmado ? styles.vtDone : poApproved === true && !isNewFlow ? styles.vtCurrent : styles.vtPending}`}>
                  <div className={styles.vtDot}></div>
                  <div className={styles.vtContent}>
                    <strong>{recebimentoConfirmado ? "Recebimento Confirmado" : "Status de Entrega"}</strong>
                    <span>{recebimentoConfirmado ? "Mercadoria conferida e aceita no almoxarifado" : "Aguardando chegada e conferência física"}</span>
                    {recebimentoConfirmado && <small>{new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</small>}
                  </div>
                </div>
              </div>
            </Card>

            {/* Documentos e Anexos */}
            <Card className={styles.sideCard}>
              <h4>Documentos do Pedido</h4>
              <div className={styles.fileRow}>
                <span style={{ fontSize: "28px", color: "#b91c1c", marginRight: "12px", display: "inline-flex", alignItems: "center" }}>
                  <Icon name="file-01" size={24} />
                </span>
                <div className={styles.fileInfo}>
                  <strong>Ordem_de_Compra_{displayId}.pdf</strong>
                  <small>PDF • 182 KB</small>
                </div>
                <button className={styles.downloadIconBtn} title="Baixar OC">
                  <Icon name="download-01" />
                </button>
              </div>
              {!isNewFlow && (
                <div className={styles.fileRow} style={{ marginTop: "12px" }}>
                  <span style={{ fontSize: "28px", color: "#b91c1c", marginRight: "12px", display: "inline-flex", alignItems: "center" }}>
                    <Icon name="file-01" size={24} />
                  </span>
                  <div className={styles.fileInfo}>
                    <strong>XML_NFe_{displayId}.xml</strong>
                    <small>XML • 45 KB</small>
                  </div>
                  <button className={styles.downloadIconBtn} title="Baixar XML">
                    <Icon name="download-01" />
                  </button>
                </div>
              )}
            </Card>

          </div>

        </div>
      </div>
    </ProtectedLayout>
  );
}
