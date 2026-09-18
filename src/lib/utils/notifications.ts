import { NotificationItem } from '../api/notifications';


export function resolveNotificationUrl(notif: Partial<NotificationItem>): string {
  let url = notif.actionUrl?.trim() || '';

  // Se não houver actionUrl definida, deriva com base no tipo da notificação
  if (!url) {
    switch (notif.type) {
      case 'rfq':
        return '/compras/rfqs';
      case 'order':
        return '/compras/pedidos';
      case 'approval':
        return '/compras/solicitacoes';
      case 'info':
      default:
        return '/dashboard';
    }
  }

  
  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      url = parsed.pathname + parsed.search + parsed.hash;
    } catch {
      
    }
  }

  
  const match = url.match(/^([^?#]*)(.*)$/);
  let pathname = match ? match[1] : url;
  const rest = match ? match[2] : '';

  // Se a URL for apenas um identificador/UUID/código sem barra inicial
  if (!pathname.startsWith('/')) {
    switch (notif.type) {
      case 'rfq':
        return `/compras/rfqs/${pathname}${rest}`;
      case 'order':
        return `/compras/pedidos/${pathname}${rest}`;
      case 'approval':
        return `/compras/solicitacoes/${pathname}${rest}`;
      default:
        pathname = `/${pathname}`;
    }
  }

  
  pathname = pathname
    .replace(/^\/compras\/rfq(?:\/|$)/, (m) => m.endsWith('/') ? '/compras/rfqs/' : '/compras/rfqs')
    .replace(/^\/compras\/pedido(?:\/|$)/, (m) => m.endsWith('/') ? '/compras/pedidos/' : '/compras/pedidos')
    .replace(/^\/compras\/order(?:s)?(?:\/|$)/, (m) => m.endsWith('/') ? '/compras/pedidos/' : '/compras/pedidos')
    .replace(/^\/compras\/quote(?:s)?(?:\/|$)/, (m) => m.endsWith('/') ? '/compras/rfqs/' : '/compras/rfqs')
    .replace(/^\/compras\/solicitac(?:ao|ão)(?:\/|$)/, (m) => m.endsWith('/') ? '/compras/solicitacoes/' : '/compras/solicitacoes');

  
  pathname = pathname
    .replace(/^\/rfq(?:s)?(?:\/|$)/, (m) => m.endsWith('/') ? '/compras/rfqs/' : '/compras/rfqs')
    .replace(/^\/pedido(?:s)?(?:\/|$)/, (m) => m.endsWith('/') ? '/compras/pedidos/' : '/compras/pedidos')
    .replace(/^\/order(?:s)?(?:\/|$)/, (m) => m.endsWith('/') ? '/compras/pedidos/' : '/compras/pedidos')
    .replace(/^\/quote(?:s)?(?:\/|$)/, (m) => m.endsWith('/') ? '/compras/rfqs/' : '/compras/rfqs')
    .replace(/^\/solicitac(?:ao|oes|ão|ões)(?:\/|$)/, (m) => m.endsWith('/') ? '/compras/solicitacoes/' : '/compras/solicitacoes')
    .replace(/^\/fornecedor(?:\/|$)/, (m) => m.endsWith('/') ? '/fornecedores/' : '/fornecedores');

  return `${pathname}${rest}`;
}
