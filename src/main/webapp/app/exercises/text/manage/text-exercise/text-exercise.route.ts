import { ActivatedRouteSnapshot, Resolve, Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access-service';
import { TextExerciseComponent } from './text-exercise.component';
import { TextExerciseDetailComponent } from './text-exercise-detail.component';
import { TextExerciseUpdateComponent } from './text-exercise-update.component';
import { TextExercise } from 'app/entities/text-exercise.model';
import { Injectable } from '@angular/core';
import { TextExerciseService } from 'app/exercises/text/manage/text-exercise/text-exercise.service';
import { CourseManagementService } from 'app/course/manage/course-management.service';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { filter, map } from 'rxjs/operators';
import { Course } from 'app/entities/course.model';

@Injectable({ providedIn: 'root' })
export class TextExerciseResolver implements Resolve<TextExercise> {
    constructor(private textExerciseService: TextExerciseService, private courseService: CourseManagementService) {}

    /**
     * Resolves the route and initializes text exercise
     * @param route
     */
    resolve(route: ActivatedRouteSnapshot) {
        if (route.params['exerciseId']) {
            return this.textExerciseService.find(route.params['exerciseId']).pipe(
                filter((res) => !!res.body),
                map((textExercise: HttpResponse<TextExercise>) => textExercise.body!),
            );
        } else if (route.params['courseId']) {
            return this.courseService.find(route.params['courseId']).pipe(
                filter((res) => !!res.body),
                map((course: HttpResponse<Course>) => new TextExercise(course.body!)),
            );
        }
        return Observable.of(new TextExercise());
    }
}

export const textExerciseRoute: Routes = [
    // Create New Text Exercise
    {
        path: ':courseId/text-exercises/new',
        component: TextExerciseUpdateComponent,
        resolve: {
            textExercise: TextExerciseResolver,
        },
        data: {
            authorities: ['ROLE_TA', 'ROLE_INSTRUCTOR', 'ROLE_ADMIN'],
            pageTitle: 'artemisApp.textExercise.home.title',
        },
        canActivate: [UserRouteAccessService],
    },
    // View Text Exercise
    {
        path: ':courseId/text-exercises/:exerciseId',
        component: TextExerciseDetailComponent,
        data: {
            authorities: ['ROLE_TA', 'ROLE_INSTRUCTOR', 'ROLE_ADMIN'],
            pageTitle: 'artemisApp.textExercise.home.title',
        },
        canActivate: [UserRouteAccessService],
    },
    // Edit Text Exercise
    {
        path: ':courseId/text-exercises/:exerciseId/edit',
        component: TextExerciseUpdateComponent,
        resolve: {
            textExercise: TextExerciseResolver,
        },
        data: {
            authorities: ['ROLE_TA', 'ROLE_INSTRUCTOR', 'ROLE_ADMIN'],
            pageTitle: 'artemisApp.textExercise.home.title',
        },
        canActivate: [UserRouteAccessService],
    },
    // View list of Text Exercises for Course
    {
        path: ':courseId/text-exercises',
        component: TextExerciseComponent,
        data: {
            authorities: ['ROLE_TA', 'ROLE_INSTRUCTOR', 'ROLE_ADMIN'],
            pageTitle: 'artemisApp.textExercise.home.title',
        },
        canActivate: [UserRouteAccessService],
    },
];
