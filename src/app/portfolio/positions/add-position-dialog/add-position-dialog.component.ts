import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatNativeDateModule,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { PositionService } from '../../../services/position.service';

@Component({
  selector: 'app-add-position-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
  ],
  providers: [MatDatepickerModule, provideNativeDateAdapter()],
  templateUrl: './add-position-dialog.component.html',
  styleUrls: ['./add-position-dialog.component.css'],
})
export class AddPositionDialogComponent {
  positionForm: FormGroup;
  isLoading = false;
  error = '';
  maxDate: Date = new Date();

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddPositionDialogComponent>,
    private positionService: PositionService,
  ) {
    this.positionForm = this.fb.group({
      stockName: ['', Validators.required],
      tickerSymbol: [
        '',
        [Validators.required, Validators.pattern(/^[A-Z]+(\.[A-Z]+)?$/)],
      ],
      numberOfShares: ['', [Validators.required, Validators.min(0.01)]],
      priceAtPurchase: ['', [Validators.required, Validators.min(0.01)]],
      dateOfAcquisition: [new Date(), Validators.required],
      type: ['buy', Validators.required],
    });
  }

  onSubmit() {
    if (this.positionForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.error = '';

      const position = {
        userId: 1, // TODO: Get from auth service
        stockName: this.positionForm.value.stockName,
        symbol: this.positionForm.value.tickerSymbol.toUpperCase(),
        shares: this.positionForm.value.numberOfShares,
        priceAtPurchase: this.positionForm.value.priceAtPurchase,
        dateAcquired: this.positionForm.value.dateOfAcquisition.toISOString(),
        type: this.positionForm.value.type.toUpperCase(),
      };

      this.positionService.addPosition(position).subscribe({
        next: result => {
          this.dialogRef.close(result);
        },
        error: err => {
          console.error('Error adding position:', err);
          this.error =
            err.error?.message || 'Failed to add position. Please try again.';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        },
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
