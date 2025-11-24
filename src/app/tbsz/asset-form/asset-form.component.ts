import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { TbszService, Asset } from '../../services/tbsz.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { provideNativeDateAdapter } from '@angular/material/core';

interface DialogData {
  isEdit: boolean;
  asset?: Asset;
  tbszAccountId: string;
}

@Component({
  selector: 'app-asset-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    MatNativeDateModule,
    MatSnackBarModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './asset-form.component.html',
  styleUrls: ['./asset-form.component.scss'],
})
export class AssetFormComponent implements OnInit {
  assetForm: FormGroup;
  isEdit: boolean;
  loading = false;
  assetTypes = [
    { value: 'STOCK', label: 'Stock' },
    { value: 'BOND', label: 'Bond' },
    { value: 'ETF', label: 'ETF' },
    { value: 'CRYPTO', label: 'Cryptocurrency' },
    { value: 'CASH', label: 'Cash' },
    { value: 'MUTUAL_FUND', label: 'Mutual Fund' },
    { value: 'REAL_ESTATE', label: 'Real Estate' },
    { value: 'OTHER', label: 'Other' },
  ];
  constructor(
    private fb: FormBuilder,
    private tbszService: TbszService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<AssetFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {
    this.isEdit = data.isEdit;
    this.assetForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.isEdit && this.data.asset) {
      this.assetForm.patchValue({
        name: this.data.asset.name,
        symbol: this.data.asset.symbol,
        type: this.data.asset.type,
        purchaseDate: this.data.asset.purchaseDate,
        purchasePrice: this.data.asset.purchasePrice,
        quantity: this.data.asset.quantity,
        currentValue: this.data.asset.currentValue,
      });
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      symbol: [''],
      type: ['STOCK', Validators.required],
      purchaseDate: [new Date(), Validators.required],
      purchasePrice: [0, [Validators.required, Validators.min(0)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      currentValue: [0, [Validators.min(0)]],
    });
  }

  calculateTotalValue(): number {
    const purchasePrice = this.assetForm.get('purchasePrice')?.value || 0;
    const quantity = this.assetForm.get('quantity')?.value || 0;
    return purchasePrice * quantity;
  }

  onSubmit(): void {
    if (this.assetForm.invalid) {
      return;
    }

    this.loading = true;
    const formValue = this.assetForm.value;
    const assetData = {
      name: formValue.name,
      symbol: formValue.symbol || '',
      type: formValue.type,
      purchaseDate: new Date(formValue.purchaseDate),
      purchasePrice: formValue.purchasePrice,
      quantity: formValue.quantity,
      currentValue: formValue.currentValue || this.calculateTotalValue(),
      tbszAccountId: this.data.tbszAccountId,
    };

    if (this.isEdit && this.data.asset) {
      this.tbszService
        .updateAsset(this.data.tbszAccountId, this.data.asset.id, assetData)
        .subscribe({
          next: () => {
            this.snackBar.open('Asset updated successfully', 'Close', {
              duration: 3000,
            });
            this.dialogRef.close(true);
            this.loading = false;
          },
          error: error => {
            console.error('Error updating asset', error);
            this.snackBar.open('Error updating asset', 'Close', {
              duration: 3000,
            });
            this.loading = false;
          },
        });
    } else {
      this.tbszService.addAsset(this.data.tbszAccountId, assetData).subscribe({
        next: () => {
          this.snackBar.open('Asset added successfully', 'Close', {
            duration: 3000,
          });
          this.dialogRef.close(true);
          this.loading = false;
        },
        error: error => {
          console.error('Error adding asset', error);
          this.snackBar.open('Error adding asset', 'Close', { duration: 3000 });
          this.loading = false;
        },
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
