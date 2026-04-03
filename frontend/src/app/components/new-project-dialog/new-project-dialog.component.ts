import { Component, inject, computed } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ApiService } from 'src/app/services/api.service';
import { OrganizationService } from 'src/app/services/organization.service';
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
export class NewProjectDialogComponent {
  projectName: string;
  selectedOrgId: string;
  isCreating = false;
  errorMessage: string;

  private apiService = inject(ApiService);
  private organizationService = inject(OrganizationService);
  public dialogRef = inject(MatDialogRef<NewProjectDialogComponent>);

  readonly organizations = this.organizationService.organizations;
  readonly selectedOrgIdDefault = computed(() => {
    const orgs = this.organizations();
    if (orgs.length > 0 && !this.selectedOrgId) this.selectedOrgId = orgs[0].id;
    return this.selectedOrgId;
  });

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
}
