import { User } from "@/types/auth";

interface MockCredential {
  password: string;
  user: User;
}

export const MOCK_USERS: Record<string, MockCredential> = {
  "procurista@compra.com": {
    password: "123456",
    user: {
      id: "1",
      name: "Maria Silva",
      email: "procurista@compra.com",
      role: "procurist",
      department: "Compras",
      avatar: "https://ui-avatars.com/api/?name=Maria+Silva",
    },
  },
  "joao@fazenda.com": {
    password: "123456",
    user: {
      id: "2",
      name: "João da Fazenda",
      email: "joao@fazenda.com",
      role: "solicitante",
      department: "Fazenda",
      avatar: "https://ui-avatars.com/api/?name=Joao+Fazenda",
    },
  },
  "gerente@compra.com": {
    password: "123456",
    user: {
      id: "3",
      name: "Carlos Gerente",
      email: "gerente@compra.com",
      role: "gerente",
      department: "Aprovações",
      avatar: "https://ui-avatars.com/api/?name=Carlos+Gerente",
    },
  },
  "admin@compra.com": {
    password: "123456",
    user: {
      id: "4",
      name: "Ana Lima",
      email: "admin@compra.com",
      role: "admin",
      department: "Operações e Suprimentos",
      avatar: "https://ui-avatars.com/api/?name=Ana+Lima",
    },
  },
};

export function findMockUser(email: string, password: string): User {
  const credential = MOCK_USERS[email];
  if (!credential || credential.password !== password) {
    throw new Error("Email ou senha inválidos");
  }
  return credential.user;
}
