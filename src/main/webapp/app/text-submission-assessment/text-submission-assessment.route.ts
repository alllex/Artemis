import { Injectable } from '@angular/core';
import { Routes, Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

import { UserRouteAccessService } from 'app/core';
import { TextSubmissionAssessmentComponent } from './text-submission-assessment.component';
import { StudentParticipation } from 'app/entities/participation';
import { TextAssessmentsService } from 'app/entities/text-assessments/text-assessments.service';

@Injectable({ providedIn: 'root' })
export class StudentParticipationResolver implements Resolve<StudentParticipation | null> {
    constructor(private textAssessmentsService: TextAssessmentsService) {}

    /**
     * Resolves the needed StudentParticipations for the TextSubmissionAssessmentComponent using the TextAssessmentsService.
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        const submissionId = Number(route.paramMap.get('submissionId'));

        if (submissionId) {
            return this.textAssessmentsService.getFeedbackDataForExerciseSubmission(submissionId).catch(() => Observable.of(null));
        }
        return Observable.of(null);
    }
}

export const textSubmissionAssessmentRoutes: Routes = [
    {
        path: '',
        component: TextSubmissionAssessmentComponent,
        data: {
            authorities: ['ROLE_ADMIN', 'ROLE_INSTRUCTOR', 'ROLE_TA'],
            pageTitle: 'artemisApp.textAssessment.title',
        },
        resolve: {
            studentParticipation: StudentParticipationResolver,
        },
        canActivate: [UserRouteAccessService],
    },
];
