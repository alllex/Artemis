import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { RouterModule } from '@angular/router';

import { ArTEMiSSharedModule } from '../shared';
import { CourseComponent, CourseService } from '../entities/course';
import { JhiAlertService } from 'ng-jhipster';
import { ArTEMiSResultModule } from '../entities/result';
import { HomeComponent } from '../home';
import { MomentModule } from 'angular2-moment';
import { JhiMainComponent } from '../layouts';
import { ClipboardModule } from 'ngx-clipboard';
import { exampleTextSubmissionRoute } from 'app/example-text-submission/example-text-submission.route';
import { ExampleTextSubmissionComponent } from 'app/example-text-submission/example-text-submission.component';
import { ArTEMiSTextAssessmentModule } from 'app/text-assessment';

const ENTITY_STATES = [...exampleTextSubmissionRoute];

@NgModule({
    imports: [BrowserModule, ArTEMiSSharedModule, ArTEMiSResultModule, MomentModule, ClipboardModule, RouterModule.forChild(ENTITY_STATES), ArTEMiSTextAssessmentModule],
    declarations: [ExampleTextSubmissionComponent],
    exports: [],
    entryComponents: [HomeComponent, CourseComponent, JhiMainComponent],
    providers: [
        CourseService,
        JhiAlertService,
    ],
    schemas: []
})
export class ArTEMiSExampleSubmissionModule {}