import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ArtemisAssessmentSharedModule } from '../assessment-shared/assessment-shared.module';
import { textSubmissionAssessmentRoutes } from './text-submission-assessment.route';
import { TextSubmissionAssessmentComponent } from './text-submission-assessment.component';
import { ArtemisSharedModule } from 'app/shared';
import { AssessmentInstructionsModule } from 'app/assessment-instructions/assessment-instructions.module';
import { TextAssessmentAreaComponent } from './text-assessment-area/text-assessment-area.component';
import { TextblockAssessmentCardComponentComponent } from './textblock-assessment-card/textblock-assessment-card-component.component';

const ENTITY_STATES = [...textSubmissionAssessmentRoutes];

@NgModule({
    imports: [RouterModule.forChild(ENTITY_STATES), CommonModule, ArtemisAssessmentSharedModule, ArtemisSharedModule, AssessmentInstructionsModule],
    declarations: [TextSubmissionAssessmentComponent, TextAssessmentAreaComponent, TextblockAssessmentCardComponentComponent],
})
export class ArtemisTextSubmissionAssessmentModule {}
