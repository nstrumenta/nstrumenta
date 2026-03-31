import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ApiService } from 'src/app/services/api.service';
import { OrganizationService } from 'src/app/services/organization.service';
import { OrganizationDoc } from 'src/app/models/organization.model';
import { Subscription } from 'rxjs';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-new-project-dialog',
    templateUrl: './new-project-dialog.component.html',
    styleUrls: ['./new-project-dialog.component.scss'],
    imports: [MatFormField, MatLabel, MatInput, MatSelect, MatOption, FormsModule, MatError, MatButton]
})
export class NewProjectDialogComponent implements OnInit, OnDestroy {
  projectName: string;
  selectedOrgId: string;
  organizations: OrganizationDoc[] = [];
  isCreating = false;
  errorMessage: string;

  private subscription: Subscription;
  private apiService = inject(ApiService);
  private organizationService = inject(OrganizationService);
  public dialogRef = inject(MatDialogRef<NewProjectDialogComponent>);

  ngOnInit(): void {
    this.subscription = this.organizationService.getUserOrganizations().subscribe({
      next: orgs => {
        this.organizations = orgs;
        if (orgs.length > 0) this.selectedOrgId = orgs[0].id;
      },
      error: err => { this.errorMessage = 'Failed to load organizations.'; }
    });
  }

  async create(): Promise<void> {
    if (this.isCreating) return;

    this.isCreating = true;
    this.errorMessage = '';

    try {
      const response = await this.apiService.createProject({
        name: this.projectName,
        orgId: this.selectedOrgId,
      });
      this.dialogRef.close(response);
    } catch (error) {
      this.errorMessage = error?.error || 'Failed to create project. Please try again.';
      this.isCreating = false;
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }
}
