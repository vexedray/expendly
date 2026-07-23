import { Injectable, NotImplementedException } from '@nestjs/common';

export interface ConnectToken {
  token: string;
  expiresAt: string;
}
export interface OpenFinanceItem {
  id: string;
  status: string;
}
export interface OpenFinanceTransaction {
  id: string;
  nomeOriginal: string;
  valor: string;
  data: string;
}
export interface OpenFinanceProvider {
  createConnectToken(userId: string): Promise<ConnectToken>;
  getItem(itemId: string): Promise<OpenFinanceItem>;
  getTransactions(itemId: string): Promise<OpenFinanceTransaction[]>;
  deleteItem(itemId: string): Promise<void>;
}
export const OPEN_FINANCE_PROVIDER = Symbol('OPEN_FINANCE_PROVIDER');

@Injectable()
export class UnsupportedOpenFinanceProvider implements OpenFinanceProvider {
  createConnectToken(_userId: string): Promise<ConnectToken> {
    void _userId;
    throw new NotImplementedException('Provider Open Finance não configurado');
  }

  getItem(_itemId: string): Promise<OpenFinanceItem> {
    void _itemId;
    throw new NotImplementedException('Provider Open Finance não configurado');
  }

  getTransactions(_itemId: string): Promise<OpenFinanceTransaction[]> {
    void _itemId;
    throw new NotImplementedException('Provider Open Finance não configurado');
  }

  deleteItem(_itemId: string): Promise<void> {
    void _itemId;
    throw new NotImplementedException('Provider Open Finance não configurado');
  }
}
