import { z } from "zod";

export const solicitacaoItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(3, "A descrição do item deve ter pelo menos 3 caracteres"),
  category: z.string().optional(),
  quantity: z.number().positive("A quantidade deve ser maior que zero"),
  unit: z.string().min(1, "A unidade é obrigatória"),
  estimatedUnitPrice: z.number().min(0, "O preço estimado não pode ser negativo").optional(),
  costCenter: z.string().min(2, "O centro de custo é obrigatório"),
  requiredDate: z.string().optional(),
});

export const createSolicitacaoSchema = z.object({
  description: z.string().min(5, "O título/descrição da solicitação deve ter pelo menos 5 caracteres"),
  categoryId: z.string().optional(),
  justification: z.string().min(10, "A justificativa deve ter pelo menos 10 caracteres"),
  estimatedBudget: z.number().min(0, "O orçamento estimado não pode ser negativo"),
  deliveryLocation: z.string().min(5, "O local de entrega é obrigatório"),
  deadline: z.string().min(1, "O prazo desejado é obrigatório"),
  priority: z.enum(["Low", "Medium", "High", "Urgent", "Critical"]),
  department: z.string().default("Operações"),
  purchaseType: z.string().default("Material recorrente"),
  paymentTerms: z.string().optional(),
  preferredSupplier: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(solicitacaoItemSchema).min(1, "A solicitação deve conter pelo menos 1 item"),
});

export type SolicitacaoFormData = z.infer<typeof createSolicitacaoSchema>;
export type SolicitacaoItemFormData = z.infer<typeof solicitacaoItemSchema>;
