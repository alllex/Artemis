import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { JhiAlertService } from 'ng-jhipster';
import * as moment from 'moment';

import { AccountService } from 'app/core/auth/account.service';
import { StudentParticipation } from 'app/entities/participation';
import { TextSubmission } from 'app/entities/text-submission';
import { TextExercise } from 'app/entities/text-exercise';
import { Result } from 'app/entities/result';
import { Complaint, ComplaintService } from 'app/entities/complaint';
import { TextAssessmentsService } from 'app/entities/text-assessments/text-assessments.service';
import { TextBlockRef } from 'app/entities/text-assessments/text-block-ref.model';
import { Feedback } from 'app/entities/feedback';
import { notUndefined } from 'app/utils/global.utils';

@Component({
    selector: 'jhi-text-submission-assessment',
    templateUrl: './text-submission-assessment.component.html',
    styleUrls: ['./text-submission-assessment.component.scss'],
})
export class TextSubmissionAssessmentComponent implements OnInit {
    private userId: number | null;
    participation: StudentParticipation | null;
    submission: TextSubmission | null;
    exercise: TextExercise | null;
    result: Result | null;
    generalFeedback: Feedback;
    textBlockRefs: TextBlockRef[] = [];

    isLoading = true;
    busy = false;
    isAssessor = false;
    isAtLeastInstructor = false;
    canOverride = false;
    assessmentsAreValid = false;
    complaint: Complaint;

    private get referencedFeedback(): Feedback[] {
        return this.textBlockRefs.map(({ feedback }) => feedback).filter(notUndefined) as Feedback[];
    }

    private get assessments(): Feedback[] {
        return [this.generalFeedback, ...this.referencedFeedback];
    }

    constructor(
        private activatedRoute: ActivatedRoute,
        private jhiAlertService: JhiAlertService,
        private accountService: AccountService,
        private complaintService: ComplaintService,
    ) {}

    public async ngOnInit() {
        // Used to check if the assessor is the current user
        const identity = await this.accountService.identity();
        this.userId = identity ? identity.id : null;

        this.isAtLeastInstructor = this.accountService.hasAnyAuthorityDirect(['ROLE_ADMIN', 'ROLE_INSTRUCTOR']);

        this.activatedRoute.data.subscribe(({ studentParticipation }) => {
            this.participation = studentParticipation;
            if (this.participation != null) {
                this.submission = this.participation.submissions[0] as TextSubmission;
                this.exercise = this.participation.exercise as TextExercise;
                this.result = this.submission.result;
                this.prepareTextBlocksAndFeedbacks();
                this.getComplaintIfNeeded();
            } else {
                this.submission = null;
                this.exercise = null;
                this.result = null;
            }

            this.checkPermissions();
            this.isLoading = false;
        });
    }

    public navigateBack(): void {
        history.back();
    }

    public save(): void {
        console.log(this.assessments);
    }
    public submit(): void {}
    public cancel(): void {}
    public nextSubmission(): void {}
    public updateAssessmentAfterComplaint(): void {}
    public validateFeedback(): void {
        const hasReferencedFeedback = this.referencedFeedback.length > 0;
        const hasGeneralFeedback = this.generalFeedback.detailText !== null && this.generalFeedback.detailText.length > 0;

        this.assessmentsAreValid = hasReferencedFeedback || hasGeneralFeedback;
    }

    private prepareTextBlocksAndFeedbacks(): void {
        if (!this.result) {
            return;
        }
        const feedbacks = this.result.feedbacks || [];
        const generalFeedbackIndex = feedbacks.findIndex(({ reference }) => reference == null);
        if (generalFeedbackIndex !== -1) {
            this.generalFeedback = feedbacks[generalFeedbackIndex];
            feedbacks.splice(generalFeedbackIndex, 1);
        } else {
            this.generalFeedback = new Feedback();
        }

        if (!this.submission || !this.submission.blocks) {
            return;
        }
        const textBlocks = this.submission.blocks;
        this.textBlockRefs = TextAssessmentsService.matchBlocksWithFeedbacks(textBlocks, feedbacks);
    }

    private getComplaintIfNeeded() {
        if (this.result && this.result.hasComplaint) {
            this.getComplaint();
        }
    }

    private getComplaint(): void {
        if (this.result === null) {
            return;
        }

        this.complaintService.findByResultId(this.result.id).subscribe(
            res => {
                if (!res.body) {
                    return;
                }
                this.complaint = res.body;
            },
            (err: HttpErrorResponse) => {
                this.onError(err.message);
            },
        );
    }

    private checkPermissions() {
        this.isAssessor = this.result !== null && this.result.assessor && this.result.assessor.id === this.userId;
        const isBeforeAssessmentDueDate = this.exercise && this.exercise.assessmentDueDate && moment().isBefore(this.exercise.assessmentDueDate);
        // tutors are allowed to override one of their assessments before the assessment due date, instructors can override any assessment at any time
        this.canOverride = (this.isAssessor && isBeforeAssessmentDueDate) || this.isAtLeastInstructor;
    }

    private onError(error: string) {
        console.error(error);
        this.jhiAlertService.error(error, null, undefined);
    }
}
