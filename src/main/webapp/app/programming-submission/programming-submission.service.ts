import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, from, merge, Observable, of, Subject, Subscription, timer } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, reduce, switchMap, tap } from 'rxjs/operators';
import { JhiWebsocketService } from 'app/core';
import { SERVER_API_URL } from 'app/app.constants';
import { ParticipationWebsocketService } from 'app/entities/participation/participation-websocket.service';
import { Result } from 'app/entities/result';
import { ProgrammingSubmission } from 'app/entities/programming-submission';

export enum ProgrammingSubmissionState {
    // The last submission of participation has a result.
    HAS_NO_PENDING_SUBMISSION = 'HAS_NO_PENDING_SUBMISSION',
    // The submission was created on the server, we assume that the build is running within an expected time frame.
    IS_BUILDING_PENDING_SUBMISSION = 'IS_BUILDING_PENDING_SUBMISSION',
    // A failed submission is a pending submission that has not received a result within an expected time frame.
    HAS_FAILED_SUBMISSION = 'HAS_FAILED_SUBMISSION',
}

export type ProgrammingSubmissionStateObj = { participationId: number; submissionState: ProgrammingSubmissionState; submission: ProgrammingSubmission | null };

export type ExerciseSubmissionState = { [participationId: number]: ProgrammingSubmissionStateObj };

type ProgrammingSubmissionError = { error: string; participationId: number };

/**
 * Type guard for checking if the submission received through the websocket is an error object.
 * @param toBeDetermined either a ProgrammingSubmission or a ProgrammingSubmissionError.
 */
const checkIfSubmissionIsError = (toBeDetermined: ProgrammingSubmission | ProgrammingSubmissionError): toBeDetermined is ProgrammingSubmissionError => {
    return !!(toBeDetermined as ProgrammingSubmissionError).error;
};

export interface IProgrammingSubmissionService {
    getLatestPendingSubmissionByParticipationId: (participationId: number, exerciseId: number) => Observable<ProgrammingSubmissionStateObj>;
    getSubmissionStateOfExercise: (exerciseId: number) => Observable<ExerciseSubmissionState>;
    getResultEtaInMs: () => Observable<number>;
    triggerBuild: (participationId: number) => Observable<Object>;
    triggerInstructorBuild: (participationId: number) => Observable<Object>;
    triggerInstructorBuildForAllParticipationsOfExercise: (exerciseId: number) => Observable<void>;
    triggerInstructorBuildForParticipationsOfExercise: (exerciseId: number, participationIds: number[]) => Observable<void>;
}

@Injectable({ providedIn: 'root' })
export class ProgrammingSubmissionService implements IProgrammingSubmissionService, OnDestroy {
    public SUBMISSION_RESOURCE_URL = SERVER_API_URL + 'api/programming-submissions/';
    public PROGRAMMING_EXERCISE_RESOURCE_URL = SERVER_API_URL + 'api/programming-exercises/';
    // Default value: 2 minutes.
    private DEFAULT_EXPECTED_RESULT_ETA = 2 * 60 * 1000;
    private SUBMISSION_TEMPLATE_TOPIC = '/topic/participation/%participationId%/newSubmission';

    private resultSubscriptions: { [participationId: number]: Subscription } = {};
    private submissionTopicsSubscribed: { [participationId: number]: string } = {};
    // Null describes the case where no pending submission exists, undefined is used for the setup process and will not be emitted to subscribers.
    private submissionSubjects: { [participationId: number]: BehaviorSubject<ProgrammingSubmissionStateObj | undefined> } = {};
    private exerciseBuildStateSubjects: { [exerciseId: number]: BehaviorSubject<ExerciseSubmissionState | undefined> } = {};
    private resultTimerSubjects: { [participationId: number]: Subject<null> } = {};
    private resultTimerSubscriptions: { [participationId: number]: Subscription } = {};
    private resultEtaSubject = new BehaviorSubject<number>(this.DEFAULT_EXPECTED_RESULT_ETA);

    private exerciseBuildStateValue: { [exerciseId: number]: ExerciseSubmissionState } = {};
    private currentExpectedResultETA = this.DEFAULT_EXPECTED_RESULT_ETA;

    constructor(private websocketService: JhiWebsocketService, private http: HttpClient, private participationWebsocketService: ParticipationWebsocketService) {}

    ngOnDestroy(): void {
        Object.values(this.resultSubscriptions).forEach(sub => sub.unsubscribe());
        Object.values(this.resultTimerSubscriptions).forEach(sub => sub.unsubscribe());
        Object.values(this.submissionTopicsSubscribed).forEach(topic => this.websocketService.unsubscribe(topic));
    }

    get exerciseBuildState() {
        return this.exerciseBuildStateValue;
    }

    set exerciseBuildState(exerciseBuildState: { [exerciseId: number]: ExerciseSubmissionState }) {
        this.exerciseBuildStateValue = exerciseBuildState;
        this.updateResultEta();
    }

    /**
     * Based on the number of building submissions, calculate the result eta.
     *
     */
    private updateResultEta() {
        const buildingSubmissionCount = Object.values(this.exerciseBuildStateValue).reduce((acc, exerciseSubmissionState) => {
            const buildingSubmissionsOfExercise = exerciseSubmissionState
                ? Object.values(exerciseSubmissionState).filter(({ submissionState }) => submissionState === ProgrammingSubmissionState.IS_BUILDING_PENDING_SUBMISSION).length
                : 0;
            return acc + buildingSubmissionsOfExercise;
        }, 0);

        // For every 100 submissions, we increase the expected time by 1 minute.
        this.currentExpectedResultETA = this.DEFAULT_EXPECTED_RESULT_ETA + Math.floor(buildingSubmissionCount / 100) * 4000 * 60;
        this.resultEtaSubject.next(this.currentExpectedResultETA);
    }

    /**
     * Fetch the latest pending submission for a participation, which means:
     * - Submission is the newest one (by submissionDate)
     * - Submission does not have a result (yet)
     * - Submission is not older than DEFAULT_EXPECTED_RESULT_ETA (in this case it could be that never a result will come due to an error)
     *
     * This method is private on purpose as subscribers should not try to load initial data!
     * A separate initial fetch is not necessary as this service takes care of it and provides a BehaviorSubject.
     *
     * @param participationId
     */
    private fetchLatestPendingSubmissionByParticipationId = (participationId: number): Observable<ProgrammingSubmission | null> => {
        return this.http
            .get<ProgrammingSubmission>(SERVER_API_URL + 'api/programming-exercise-participations/' + participationId + '/latest-pending-submission')
            .pipe(catchError(() => of(null)));
    };

    /**
     * Fetch the latest pending submission for all participations of a given exercise.
     * Returns an empty array if the api request fails.
     *
     * This method is private on purpose as subscribers should not try to load initial data!
     * A separate initial fetch is not necessary as this service takes care of it and provides a BehaviorSubject.
     *
     * @param exerciseId of programming exercise.
     */
    private fetchLatestPendingSubmissionByExerciseId = (exerciseId: number): Observable<{ [participationId: number]: ProgrammingSubmission | null }> => {
        return this.http
            .get<{ [participationId: number]: ProgrammingSubmission | null }>(SERVER_API_URL + `api/programming-exercises/${exerciseId}/latest-pending-submissions`)
            .pipe(catchError(() => of([])));
    };

    /**
     * Start a timer after which the timer subject will notify the corresponding subject.
     * Side effect: Timer will also emit an alert when the time runs out as it means here that no result came for a submission.
     *
     * @param participationId
     * @param time
     */
    private startResultWaitingTimer = (participationId: number, time = this.currentExpectedResultETA) => {
        this.resetResultWaitingTimer(participationId);
        this.resultTimerSubscriptions[participationId] = timer(time)
            .pipe(
                tap(() => {
                    this.resultTimerSubjects[participationId].next(null);
                }),
            )
            .subscribe();
    };

    private resetResultWaitingTimer = (participationId: number) => {
        if (this.resultTimerSubscriptions[participationId]) {
            this.resultTimerSubscriptions[participationId].unsubscribe();
        }
    };

    /**
     * Set up a submission subscription for the latest pending submission if not yet existing.
     *
     * @param participationId that is connected to the submission.
     * @param exerciseId that is connected to the participation.
     */
    private setupWebsocketSubscription = (participationId: number, exerciseId: number): void => {
        if (!this.submissionTopicsSubscribed[participationId]) {
            const newSubmissionTopic = this.SUBMISSION_TEMPLATE_TOPIC.replace('%participationId%', participationId.toString());
            this.submissionTopicsSubscribed[participationId] = newSubmissionTopic;
            this.websocketService.subscribe(newSubmissionTopic);
            this.resultTimerSubjects[participationId] = new Subject<null>();
            this.websocketService
                .receive(newSubmissionTopic)
                .pipe(
                    tap((submission: ProgrammingSubmission | ProgrammingSubmissionError) => {
                        if (checkIfSubmissionIsError(submission)) {
                            this.emitFailedSubmission(participationId, exerciseId);
                            return;
                        }
                        this.emitBuildingSubmission(participationId, exerciseId, submission);
                        // Now we start a timer, if there is no result when the timer runs out, it will notify the subscribers that no result was received and show an error.
                        this.startResultWaitingTimer(participationId);
                    }),
                )
                .subscribe();
        }
    };

    /**
     * Waits for a new result to come in while a pending submission exists.
     * Will stop waiting after the timer subject has emited a value.
     *
     * @param participationId that is connected to the result.
     * @param exerciseId that is connected to the participation.
     */
    private subscribeForNewResult = (participationId: number, exerciseId: number) => {
        if (this.resultSubscriptions[participationId]) {
            return;
        }
        const resultObservable = this.participationWebsocketService.subscribeForLatestResultOfParticipation(participationId).pipe(
            // Make sure that the incoming result belongs the latest submission!
            filter((result: Result | null) => {
                if (!result || !result.submission) {
                    return false;
                }
                const { submission } = this.exerciseBuildState[exerciseId][participationId];
                return !!submission && result.submission.id === submission.id;
            }),
            distinctUntilChanged(),
            tap(() => {
                // This is the normal case - the last pending submission received a result, so we emit null as the message that there is no pending submission anymore.
                this.emitNoPendingSubmission(participationId, exerciseId);
            }),
        );

        // If the timer runs out, we will emit an error as we assume the result is lost.
        const timerObservable = this.resultTimerSubjects[participationId].pipe(
            tap(() => {
                this.emitFailedSubmission(participationId, exerciseId);
            }),
        );

        this.resultSubscriptions[participationId] = merge(timerObservable, resultObservable)
            .pipe(
                filter(() => !!this.exerciseBuildState[exerciseId][participationId]),
                tap(() => {
                    // We reset the timer when a new result came through OR the timer ran out. The stream will then be inactive until the next submission comes in.
                    this.resetResultWaitingTimer(participationId);
                }),
            )
            .subscribe();
    };

    private emitNoPendingSubmission = (participationId: number, exerciseId: number) => {
        const newSubmissionState = { participationId, submissionState: ProgrammingSubmissionState.HAS_NO_PENDING_SUBMISSION, submission: null };
        this.notifySubscribers(participationId, exerciseId, newSubmissionState);
    };

    private emitBuildingSubmission = (participationId: number, exerciseId: number, submission: ProgrammingSubmission) => {
        const newSubmissionState = { participationId, submissionState: ProgrammingSubmissionState.IS_BUILDING_PENDING_SUBMISSION, submission };
        this.notifySubscribers(participationId, exerciseId, newSubmissionState);
    };

    private emitFailedSubmission = (participationId: number, exerciseId: number) => {
        const submissionStateObj = this.exerciseBuildState[exerciseId] && this.exerciseBuildState[exerciseId][participationId];
        const newSubmissionState = {
            participationId,
            submissionState: ProgrammingSubmissionState.HAS_FAILED_SUBMISSION,
            submission: submissionStateObj ? submissionStateObj.submission : null,
        };
        this.notifySubscribers(participationId, exerciseId, newSubmissionState);
    };

    /**
     * Notifies both the exercise and participation specific subscribers about a new SubmissionState.
     *
     * @param participationId id of ProgrammingExerciseStudentParticipation
     * @param exerciseId id of ProgrammingExercise
     * @param newSubmissionState to inform subscribers about.
     */
    private notifySubscribers = (participationId: number, exerciseId: number, newSubmissionState: ProgrammingSubmissionStateObj) => {
        // Inform participation subscribers.
        this.submissionSubjects[participationId].next(newSubmissionState);
        // Inform exercise subscribers.
        this.exerciseBuildState = { ...this.exerciseBuildState, [exerciseId]: { ...(this.exerciseBuildState[exerciseId] || {}), [participationId]: newSubmissionState } };
        const exerciseBuildStateSubject = this.exerciseBuildStateSubjects[exerciseId];
        if (exerciseBuildStateSubject) {
            exerciseBuildStateSubject.next(this.exerciseBuildState[exerciseId]);
        }
    };

    /**
     * Check how much time is still left for the build.
     *
     * @param submission for which to check the passed build time.
     * @return the expected rest time to wait for the build.
     */
    private getExpectedRemainingTimeForBuild = (submission: ProgrammingSubmission): number => {
        return this.currentExpectedResultETA - (Date.now() - Date.parse(submission.submissionDate as any));
    };

    /**
     * Subscribe for the latest pending submission for the given participation.
     * A latest pending submission is characterized by the following properties:
     * - Submission is the newest one (by submissionDate)
     * - Submission does not have a result (yet)
     * - Submission is not older than DEFAULT_EXPECTED_RESULT_ETA (in this case it could be that never a result will come due to an error)
     *
     * Will emit:
     * - A submission if a last pending submission exists.
     * - A null value when there is no pending submission.
     * - A null value when no result arrived in time for the submission.
     *
     * This method will execute a REST call to the server so that the subscriber will always receive the latest information from the server.
     *
     * @param participationId id of ProgrammingExerciseStudentParticipation
     * @param exerciseId id of ProgrammingExercise
     */
    public getLatestPendingSubmissionByParticipationId = (participationId: number, exerciseId: number) => {
        const subject = this.submissionSubjects[participationId];
        if (subject) {
            return subject.asObservable().pipe(filter(stateObj => stateObj !== undefined)) as Observable<ProgrammingSubmissionStateObj>;
        }
        // The setup process is difficult, because it should not happen that multiple subscribers trigger the setup process at the same time.
        // There the subject is returned before the REST call is made, but will emit its result as soon as it returns.
        this.submissionSubjects[participationId] = new BehaviorSubject<ProgrammingSubmissionStateObj | undefined>(undefined);
        this.fetchLatestPendingSubmissionByParticipationId(participationId)
            .pipe(switchMap(submission => this.processPendingSubmission(submission, participationId, exerciseId)))
            .subscribe();
        // We just remove the initial undefined from the pipe as it is only used to make the setup process easier.
        return this.submissionSubjects[participationId].asObservable().pipe(filter(stateObj => stateObj !== undefined)) as Observable<ProgrammingSubmissionStateObj>;
    };

    /**
     * Will retrieve and cache all pending submissions for all student participations of given exercise.
     * After calling this method, subscribers for single pending submissions will be able to use the cached submissions so that we don't execute a GET request to the server for every participation.
     *
     * Will emit once at the end so the subscriber knows that the loading & setup process is done.
     * If the user is not an instructor, this method will not be able to retrieve any pending submission.
     *
     * This method will execute a REST call to the server so that the subscriber will always receive the latest information from the server.
     *
     * @param exerciseId id of programming exercise for which to retrieve all pending submissions.
     */
    public getSubmissionStateOfExercise = (exerciseId: number): Observable<ExerciseSubmissionState> => {
        // We need to check if the submissions for the given exercise are already being fetched, otherwise the call would be done multiple done.
        const preloadingSubject = this.exerciseBuildStateSubjects[exerciseId];
        if (preloadingSubject) {
            return preloadingSubject.asObservable().filter(val => val !== undefined) as Observable<ExerciseSubmissionState>;
        }
        this.exerciseBuildStateSubjects[exerciseId] = new BehaviorSubject<ExerciseSubmissionState | undefined>(undefined);
        this.fetchLatestPendingSubmissionByExerciseId(exerciseId)
            .pipe(
                map(Object.entries),
                map(this.mapParticipationIdToNumber),
                switchMap((submissions: Array<[number, ProgrammingSubmission | null]>) => {
                    if (!submissions.length) {
                        // This needs to be done as from([]) would stop the stream.
                        return of([]);
                    }
                    return from(submissions).pipe(
                        switchMap(
                            ([participationId, submission]): Observable<ProgrammingSubmissionStateObj> => {
                                this.submissionSubjects[participationId] = new BehaviorSubject<ProgrammingSubmissionStateObj | undefined>(undefined);
                                return this.processPendingSubmission(submission, participationId, exerciseId);
                            },
                        ),
                    );
                }),
                reduce(this.mapToExerciseBuildState, {}),
                catchError(() => of({})),
            )
            .subscribe((exerciseBuildState: ExerciseSubmissionState) => {
                this.exerciseBuildState = { ...this.exerciseBuildState, [exerciseId]: exerciseBuildState };
                this.exerciseBuildStateSubjects[exerciseId].next(exerciseBuildState);
            });
        return this.exerciseBuildStateSubjects[exerciseId].asObservable().pipe(filter(val => val !== undefined)) as Observable<ExerciseSubmissionState>;
    };

    getResultEtaInMs = () => {
        return this.resultEtaSubject.asObservable().pipe(distinctUntilChanged());
    };

    public triggerBuild(participationId: number) {
        return this.http.post(this.SUBMISSION_RESOURCE_URL + participationId + '/trigger-build', {});
    }

    public triggerInstructorBuild(participationId: number) {
        return this.http.post(this.SUBMISSION_RESOURCE_URL + participationId + '/trigger-instructor-build', {});
    }

    public triggerInstructorBuildForAllParticipationsOfExercise(exerciseId: number) {
        return this.http.post<void>(this.PROGRAMMING_EXERCISE_RESOURCE_URL + exerciseId + '/trigger-instructor-build-all', {});
    }

    public triggerInstructorBuildForParticipationsOfExercise(exerciseId: number, participationIds: number[]) {
        return this.http.post<void>(this.PROGRAMMING_EXERCISE_RESOURCE_URL + exerciseId + '/trigger-instructor-build', participationIds);
    }

    /**
     * Get the count of submission state type for exercise.
     *
     * @param exerciseId ProgrammingExercise
     */
    public getSubmissionCountByType(exerciseId: number, state: ProgrammingSubmissionState) {
        const exerciseBuildState = this.exerciseBuildState[exerciseId];
        return Object.entries(exerciseBuildState)
            .filter(([, buildState]) => {
                const { submissionState } = buildState;
                return submissionState === state;
            })
            .map(([participationId]) => parseInt(participationId, 10));
    }

    /**
     * Cache a retrieved pending submission and setup the websocket connections and timer.
     *
     * @param submissionToBeProcessed to cache and use for the websocket subscriptions
     * @param participationId that serves as an identifier for caching the submission.
     * @param exerciseId of the given participationId.
     */
    private processPendingSubmission = (
        submissionToBeProcessed: ProgrammingSubmission | null,
        participationId: number,
        exerciseId: number,
    ): Observable<ProgrammingSubmissionStateObj> => {
        return of(submissionToBeProcessed).pipe(
            tap(() => {
                this.setupWebsocketSubscription(participationId, exerciseId);
                this.subscribeForNewResult(participationId, exerciseId);
            }),
            map((submission: ProgrammingSubmission | null) => {
                if (submission) {
                    const remainingTime = this.getExpectedRemainingTimeForBuild(submission);
                    if (remainingTime > 0) {
                        this.emitBuildingSubmission(participationId, exerciseId, submission);
                        this.startResultWaitingTimer(participationId, remainingTime);
                        return { participationId, submission: submissionToBeProcessed, submissionState: ProgrammingSubmissionState.IS_BUILDING_PENDING_SUBMISSION };
                    }
                    // The server sends the latest submission without a result - so it could be that the result is too old. In this case the error is shown directly.
                    this.emitFailedSubmission(participationId, exerciseId);
                    return { participationId, submission: submissionToBeProcessed, submissionState: ProgrammingSubmissionState.HAS_FAILED_SUBMISSION };
                }
                this.emitNoPendingSubmission(participationId, exerciseId);
                return { participationId, submission: null, submissionState: ProgrammingSubmissionState.HAS_NO_PENDING_SUBMISSION };
            }),
            tap((submissionStateObj: ProgrammingSubmissionStateObj) => {
                this.exerciseBuildState[exerciseId][participationId] = submissionStateObj;
                this.exerciseBuildState = { ...this.exerciseBuildState, [exerciseId]: { [participationId]: submissionStateObj, ...(this.exerciseBuildState[exerciseId] || {}) } };
            }),
        );
    };

    private mapParticipationIdToNumber = (submissions: Array<[string, ProgrammingSubmission | null]>) => {
        return submissions.map(([participationId, submission]) => [parseInt(participationId, 10), submission]);
    };

    private mapToExerciseBuildState = (acc: ExerciseSubmissionState, val: ProgrammingSubmissionStateObj) => {
        if (!Object.keys(val).length) {
            return {};
        }
        const { participationId, submission, submissionState } = val;
        return { ...acc, [participationId]: { participationId, submissionState, submission } };
    };
}