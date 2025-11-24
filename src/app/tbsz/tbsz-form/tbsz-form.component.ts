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
import { TbszService, TbszAccount } from '../../services/tbsz.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface DialogData {
  isEdit: boolean;
  account?: TbszAccount;
}

@Component({
  selector: 'app-tbsz-form',
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
  templateUrl: './tbsz-form.component.html',
  styleUrls: ['./tbsz-form.component.scss'],
})
export class TbszFormComponent implements OnInit {
  tbszForm: FormGroup;
  isEdit: boolean;
  loading = false;
  statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'MATURED', label: 'Matured' },
    { value: 'CLOSED', label: 'Closed' },
    { value: 'WITHDRAWN', label: 'Withdrawn' },
  ];

  constructor(
    private fb: FormBuilder,
    private tbszService: TbszService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<TbszFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {
    this.isEdit = data.isEdit;
    this.tbszForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.isEdit && this.data.account) {
      this.tbszForm.patchValue({
        name: this.data.account.name,
        openingDate: this.data.account.openingDate,
        status: this.data.account.status,
        initialDepositAmount: this.data.account.initialDepositAmount,
      });

      this.tbszForm.get('openingDate')?.disable();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      openingDate: [new Date(), Validators.required],
      status: ['ACTIVE', Validators.required],
      initialDepositAmount: [0, [Validators.required, Validators.min(0)]],
    });
  }

  calculateMaturityDate(openingDate: Date): Date {
    const maturityDate = new Date(openingDate);
    maturityDate.setFullYear(maturityDate.getFullYear() + 5);
    return maturityDate;
  }

  onSubmit(): void {
    if (this.tbszForm.invalid) {
      return;
    }

    this.loading = true;
    const formValue = this.tbszForm.getRawValue();
    const openingDate = new Date(formValue.openingDate);
    const maturityDate = this.calculateMaturityDate(openingDate);

    const tbszData = {
      name: formValue.name,
      openingDate,
      maturityDate,
      status: formValue.status,
      initialDepositAmount: formValue.initialDepositAmount,
    };

    if (this.isEdit && this.data.account) {
      this.tbszService.updateAccount(this.data.account.id, tbszData).subscribe({
        next: () => {
          this.snackBar.open('TBSZ account updated successfully', 'Close', {
            duration: 3000,
          });
          this.dialogRef.close(true);
          this.loading = false;
        },
        error: error => {
          console.error('Error updating TBSZ account', error);
          this.snackBar.open('Error updating TBSZ account', 'Close', {
            duration: 3000,
          });
          this.loading = false;
        },
      });
    } else {
      this.tbszService.createAccount(tbszData).subscribe({
        next: () => {
          this.snackBar.open('TBSZ account created successfully', 'Close', {
            duration: 3000,
          });
          this.dialogRef.close(true);
          this.loading = false;
        },
        error: error => {
          console.error('Error creating TBSZ account', error);
          this.snackBar.open('Error creating TBSZ account', 'Close', {
            duration: 3000,
          });
          this.loading = false;
        },
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
