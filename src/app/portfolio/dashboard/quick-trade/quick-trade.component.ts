import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { MaterialSharedModule } from '../../../shared/material-shared.module';
import { MaterialFormsModule } from '../../../shared/material-forms.module';

export interface QuickTrade {
  assetType: 'stock' | 'crypto';
  symbol: string;
  quantity: number;
  tradeType: 'buy' | 'sell';
}

@Component({
  selector: 'app-quick-trade',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialSharedModule,
    MaterialFormsModule,
  ],
  templateUrl: './quick-trade.component.html',
  styleUrls: ['./quick-trade.component.scss'],
})
export class QuickTradeComponent {
  @Output() tradeSubmitted = new EventEmitter<QuickTrade>();
  @Output() tradeCancelled = new EventEmitter<void>();

  trade: QuickTrade = {
    assetType: 'stock',
    symbol: '',
    quantity: 0,
    tradeType: 'buy',
  };

  private defaultTrade: QuickTrade = {
    assetType: 'stock',
    symbol: '',
    quantity: 0,
    tradeType: 'buy',
  };

  onSubmit(form: NgForm) {
    if (form.valid) {
      this.tradeSubmitted.emit(this.trade);
      this.resetForm(form);
    }
  }

  cancelTrade(form: NgForm) {
    this.resetForm(form);
    this.tradeCancelled.emit();
  }

  private resetForm(form: NgForm) {
    form.resetForm();
    this.trade = { ...this.defaultTrade };
  }
}
