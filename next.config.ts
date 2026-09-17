import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: '/rfqs/:path*',
        destination: '/compras/rfqs/:path*',
        permanent: false,
      },
      {
        source: '/rfq/:path*',
        destination: '/compras/rfqs/:path*',
        permanent: false,
      },
      {
        source: '/solicitacoes/:path*',
        destination: '/compras/solicitacoes/:path*',
        permanent: false,
      },
      {
        source: '/solicitacao/:path*',
        destination: '/compras/solicitacoes/:path*',
        permanent: false,
      },
      {
        source: '/pedidos/:path*',
        destination: '/compras/pedidos/:path*',
        permanent: false,
      },
      {
        source: '/pedido/:path*',
        destination: '/compras/pedidos/:path*',
        permanent: false,
      },
      {
        source: '/orders/:path*',
        destination: '/compras/pedidos/:path*',
        permanent: false,
      },
      {
        source: '/order/:path*',
        destination: '/compras/pedidos/:path*',
        permanent: false,
      },
      {
        source: '/compras/rfq/:path*',
        destination: '/compras/rfqs/:path*',
        permanent: false,
      },
      {
        source: '/compras/pedido/:path*',
        destination: '/compras/pedidos/:path*',
        permanent: false,
      },
      {
        source: '/compras/solicitacao/:path*',
        destination: '/compras/solicitacoes/:path*',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
