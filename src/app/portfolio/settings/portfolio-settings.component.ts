import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MaterialSharedModule } from '../../shared/material-shared.module';
import { MaterialFormsModule } from '../../shared/material-forms.module';
import { MatCheckboxModule } from '@angular/material/checkbox';

interface PriceAlert {
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
}

interface PortfolioSettings {
  defaultCurrency: string;
  priceAlerts: PriceAlert[];
  notifications: {
    email: boolean;
    push: boolean;
    frequency: 'realtime' | 'daily' | 'weekly';
  };
}

@Component({
  selector: 'app-portfolio-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialSharedModule,
    MaterialFormsModule,
    MatCheckboxModule,
  ],
  templateUrl: './portfolio-settings.component.html',
  styleUrls: ['./portfolio-settings.component.scss'],
})
export class PortfolioSettingsComponent implements OnInit {
  settingsForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.settingsForm = this.fb.group({
      defaultCurrency: ['USD', Validators.required],
      notifications: this.fb.group({
        email: [false],
        push: [false],
        frequency: ['daily', Validators.required],
      }),
      priceAlerts: this.fb.array([]),
    });
  }

  ngOnInit() {
    this.addAlert();
  }

  get priceAlerts() {
    return this.settingsForm.get('priceAlerts') as FormArray;
  }

  addAlert() {
    const alertGroup = this.fb.group({
      symbol: [
        '',
        [Validators.required, Validators.pattern('^[A-Za-z0-9.]+$')],
      ],
      targetPrice: ['', [Validators.required, Validators.min(0)]],
      condition: ['above', Validators.required],
    });

    this.priceAlerts.push(alertGroup);
  }

  removeAlert(index: number) {
    this.priceAlerts.removeAt(index);
  }

  onSubmit() {
    if (this.settingsForm.valid) {
      console.log(this.settingsForm.value);
    }
  }
}
