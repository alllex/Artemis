import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ArtemisSharedModule } from 'app/shared/shared.module';
import { exerciseHintRoute } from 'app/exercises/shared/exercise-hint/manage/exercise-hint.route';
import { ExerciseHintDetailComponent } from 'app/exercises/shared/exercise-hint/manage/exercise-hint-detail.component';
import { ExerciseHintUpdateComponent } from 'app/exercises/shared/exercise-hint/manage/exercise-hint-update.component';
import { ArtemisMarkdownEditorModule } from 'app/shared/markdown-editor/markdown-editor.module';
import { ExerciseHintComponent } from 'app/exercises/shared/exercise-hint/manage/exercise-hint.component';

const ENTITY_STATES = [...exerciseHintRoute];

@NgModule({
    imports: [ArtemisSharedModule, RouterModule.forChild(ENTITY_STATES), FormsModule, ReactiveFormsModule, ArtemisMarkdownEditorModule],
    declarations: [ExerciseHintComponent, ExerciseHintDetailComponent, ExerciseHintUpdateComponent],
})
export class ArtemisExerciseHintManagementModule {}
