import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BuildingApiService } from '../../../core/services/building-api.service';
import { FlatApiService } from '../../../core/services/flat-api.service';
import { Building } from '../../../core/models/building.model';
import { VehicleCreate, VehicleType } from '../../../core/models/vehicle.model';

/**
 * Flat create/edit form. Create mode allows adding initial vehicles
 * inline (car/bike FormArrays). Edit mode disables the Building select
 * (a flat can't move buildings) and hides the vehicle repeaters
 * (vehicles are managed on the flat detail page).
 *
 * Building select is a `.valueChanges` subscriber — picking a Building
 * re-fetches its floor list and populates the Floor <select>.
 */
@Component({
  selector: 'bms-flat-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './flat-form.component.html',
  styleUrl: './flat-form.component.scss',
})
export class FlatFormComponent implements OnInit {
  private fb: NonNullableFormBuilder = inject(FormBuilder).nonNullable;
  private flatApi = inject(FlatApiService);
  private buildingApi = inject(BuildingApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  id = signal<number | null>(null);
  buildings = signal<Building[]>([]);
  floors = signal<number[]>([]);

  form = this.fb.group({
    building_id: [0, [Validators.required, Validators.min(1)]],
    floor: [1, [Validators.required, Validators.min(1)]],
    number: ['', [Validators.required, Validators.maxLength(50)]],
    name_on_board: [''],
    declared_member_count: [1, [Validators.required, Validators.min(1), Validators.max(50)]],
    cars: this.fb.array<FormGroup>([]),
    bikes: this.fb.array<FormGroup>([]),
  });

  ngOnInit(): void {
    this.buildingApi.list({ page_size: 100 }).subscribe({
      next: (r) => this.buildings.set(r.items),
    });

    // when building changes, refetch its floor list
    this.form.controls.building_id.valueChanges.subscribe((bId) => {
      if (bId && bId > 0) {
        this.buildingApi.floors(bId).subscribe({
          next: (r) => this.floors.set(r.floors),
          error: () => this.floors.set([]),
        });
      } else {
        this.floors.set([]);
      }
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.id.set(id);
      this.loading.set(true);
      this.flatApi.detail(id).subscribe({
        next: (f) => {
          this.form.patchValue({
            building_id: f.building_id,
            floor: f.floor,
            number: f.number,
            name_on_board: f.name_on_board ?? '',
            declared_member_count: f.declared_member_count,
          });
          this.cars.clear();
          this.bikes.clear();
          for (const v of f.vehicles) {
            (v.type === 'car' ? this.cars : this.bikes).push(this.vehicleGroup(v));
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  get cars(): FormArray<FormGroup> {
    return this.form.controls.cars;
  }
  get bikes(): FormArray<FormGroup> {
    return this.form.controls.bikes;
  }

  vehicleGroup(v?: Partial<VehicleCreate>): FormGroup {
    return this.fb.group({
      number: [v?.number ?? '', [Validators.required, Validators.maxLength(50)]],
      model: [v?.model ?? ''],
      brand: [v?.brand ?? ''],
    });
  }

  addCar(): void {
    this.cars.push(this.vehicleGroup());
  }

  addBike(): void {
    this.bikes.push(this.vehicleGroup());
  }

  removeCar(i: number): void {
    this.cars.removeAt(i);
  }

  removeBike(i: number): void {
    this.bikes.removeAt(i);
  }

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);

    const v = this.form.getRawValue();
    const vehiclesFromArray = (arr: FormGroup[], type: VehicleType): VehicleCreate[] =>
      arr.map((g) => ({
        type,
        number: g.value.number,
        model: g.value.model || null,
        brand: g.value.brand || null,
      }));

    if (this.id()) {
      // update flat core fields only; vehicles are managed on the detail page
      this.flatApi
        .update(this.id()!, {
          floor: v.floor,
          number: v.number,
          name_on_board: v.name_on_board || null,
          declared_member_count: v.declared_member_count,
        })
        .subscribe({
          next: () => this.router.navigate(['/flats']),
          error: (err) => {
            this.error.set(err?.error?.message ?? 'Save failed');
            this.saving.set(false);
          },
        });
    } else {
      this.flatApi
        .create({
          building_id: v.building_id,
          floor: v.floor,
          number: v.number,
          name_on_board: v.name_on_board || null,
          declared_member_count: v.declared_member_count,
          vehicles: [
            ...vehiclesFromArray(this.cars.controls, 'car'),
            ...vehiclesFromArray(this.bikes.controls, 'bike'),
          ],
        })
        .subscribe({
          next: (created) => this.router.navigate(['/flats', created.id]),
          error: (err) => {
            this.error.set(err?.error?.message ?? 'Save failed');
            this.saving.set(false);
          },
        });
    }
  }
}
