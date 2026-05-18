import { JsonPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { Module } from 'src/app/models/firebase.model';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { ApiService } from 'src/app/services/api.service';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-module-details',
    templateUrl: './module-details.component.html',
        styleUrls: ['./module-details.component.scss'],
    imports: [JsonPipe, MatButton]
})
export class ModuleDetailsComponent {
    private route = inject(ActivatedRoute);
    private firebaseDataService = inject(FirebaseDataService);
    private apiService = inject(ApiService);
    private sanitizer = inject(DomSanitizer);

    readonly isApproving = signal(false);
    readonly approvalError = signal('');
    readonly approvalConfirmed = signal(false);

    readonly moduleId = toSignal(
        this.route.paramMap.pipe(map((params) => params.get('moduleId') ?? '')),
        { initialValue: this.route.snapshot.paramMap.get('moduleId') ?? '' },
    );

    readonly module = computed<Module | null>(() => {
        const moduleId = this.moduleId();
        if (!moduleId) return null;
        return this.firebaseDataService.modules().find((entry) => entry.id === moduleId) ?? null;
    });

    readonly canPreview = computed(() => {
        return this.previewUrl() !== null;
    });

    readonly previewUrl = computed(() => {
        const module = this.module();
        if (module?.type !== 'web' || typeof module.url !== 'string' || !module.url) return null;

        try {
            const previewUrl = new URL(module.url);
            const isLocalhost = previewUrl.hostname === 'localhost' || previewUrl.hostname === '127.0.0.1';
            const isAllowedProtocol = previewUrl.protocol === 'https:' || (isLocalhost && previewUrl.protocol === 'http:');

            if (!isAllowedProtocol) {
                return null;
            }

            return this.sanitizer.bypassSecurityTrustResourceUrl(previewUrl.toString());
        } catch {
            return null;
        }
    });

    readonly isApproved = computed(() => Boolean(this.module()?.approved || this.approvalConfirmed()));

    readonly metadata = computed(() => {
        const module = this.module();
        if (!module) return [] as Array<{ label: string; value: string | number | boolean; isDate?: boolean }>;

        const fields: Array<{ label: string; value: string | number | boolean | undefined; isDate?: boolean }> = [
            { label: 'Name', value: module.name },
            { label: 'Version', value: module.version },
            { label: 'Type', value: module.type },
            { label: 'Path', value: module.path },
            { label: 'Entry', value: module.entry },
            { label: 'Hosted URL', value: module.url },
            { label: 'Approved', value: module.approved },
            { label: 'Approved By', value: module.approvedBy },
            { label: 'Approved At', value: module.approvedAt, isDate: true },
            { label: 'Last Modified', value: module.lastModified, isDate: true },
        ];

        return fields.filter((field): field is { label: string; value: string | number | boolean; isDate?: boolean } => field.value !== undefined && field.value !== null && field.value !== '');
    });

    readonly extraData = computed(() => {
        const module = this.module();
        if (!module) return {};

        const {
            id,
            name,
            version,
            type,
            path,
            entry,
            url,
            approved,
            approvedBy,
            approvedAt,
            lastModified,
            ...rest
        } = module;

        return rest;
    });

    constructor() {
        effect(() => {
            this.moduleId();
            this.approvalError.set('');
            this.approvalConfirmed.set(false);
            this.isApproving.set(false);
        });
    }

    formatFieldValue(field: { value: string | number | boolean; isDate?: boolean }): string {
        if (field.isDate) {
            return new Date(field.value as string | number).toLocaleString();
        }
        return String(field.value);
    }

    async approveModule(): Promise<void> {
        const selectedModule = this.module();
        const projectId = this.firebaseDataService.projectId();

        if (!selectedModule?.name || !projectId || this.isApproving()) return;

        this.isApproving.set(true);
        this.approvalError.set('');

        try {
            await this.apiService.approveModule(projectId, selectedModule.name, selectedModule.version);
            this.approvalConfirmed.set(true);
        } catch (error) {
            this.approvalError.set(error instanceof Error ? error.message : 'Failed to approve module');
        } finally {
            this.isApproving.set(false);
        }
    }
}