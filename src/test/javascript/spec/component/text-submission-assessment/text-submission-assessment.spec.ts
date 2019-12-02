import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { TextSubmissionAssessmentComponent } from 'app/text-submission-assessment/text-submission-assessment.component';
import { ArtemisAssessmentSharedModule } from 'app/assessment-shared/assessment-shared.module';
import { ArtemisTestModule } from '../../test.module';
import { By } from '@angular/platform-browser';
import { AssessmentLayoutComponent } from 'app/assessment-shared/assessment-layout/assessment-layout.component';
import { AssessmentInstructionsModule } from 'app/assessment-instructions/assessment-instructions.module';
import { ArtemisSharedModule } from 'app/shared';

describe('TextSubmissionAssessmentComponent', () => {
    let component: TextSubmissionAssessmentComponent;
    let fixture: ComponentFixture<TextSubmissionAssessmentComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [ArtemisTestModule, ArtemisSharedModule, ArtemisAssessmentSharedModule, AssessmentInstructionsModule],
            declarations: [TextSubmissionAssessmentComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TextSubmissionAssessmentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should not print default message', () => {
        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.querySelector('p').textContent).not.toContain('text-submission-assessment works!');
    });

    it('should use jhi-assessment-layout', () => {
        const sharedLayout = fixture.debugElement.query(By.directive(AssessmentLayoutComponent));
        expect(sharedLayout).toBeTruthy();
    });
});
