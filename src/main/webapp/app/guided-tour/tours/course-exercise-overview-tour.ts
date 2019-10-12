import { GuidedTour } from 'app/guided-tour/guided-tour.model';
import { Orientation, UserInteractionEvent } from 'app/guided-tour/guided-tour.constants';
import { TextTourStep, VideoTourStep } from 'app/guided-tour/guided-tour-step.model';

export const courseExerciseOverviewTour: GuidedTour = {
    courseShortName: 'artemistutorial',
    exerciseShortName: 'tutorial',
    settingsKey: 'course_exercise_overview_tour',
    steps: [
        new TextTourStep({
            headlineTranslateKey: 'tour.courseExerciseOverview.installPrerequisites.headline',
            contentTranslateKey: 'tour.courseExerciseOverview.installPrerequisites.content',
            hintTranslateKey: 'tour.courseExerciseOverview.installPrerequisites.hint',
        }),
        new VideoTourStep({
            headlineTranslateKey: 'tour.courseExerciseOverview.installPrerequisites.sourceTreeSetup.headline',
            contentTranslateKey: 'tour.courseExerciseOverview.installPrerequisites.sourceTreeSetup.content',
            hintTranslateKey: 'tour.courseExerciseOverview.installPrerequisites.sourceTreeSetup.hint',
            videoUrl: 'https://www.youtube.com/embed/KKGuYVRIe-Y',
        }),
        new TextTourStep({
            highlightSelector: '.tab-item.exercises',
            headlineTranslateKey: 'tour.courseExerciseOverview.exercises.headline',
            contentTranslateKey: 'tour.courseExerciseOverview.exercises.content',
            highlightPadding: 10,
            orientation: Orientation.RIGHT,
        }),
        new TextTourStep({
            highlightSelector: '.tab-item.lectures',
            headlineTranslateKey: 'tour.courseExerciseOverview.lectures.headline',
            contentTranslateKey: 'tour.courseExerciseOverview.lectures.content',
            highlightPadding: 10,
            orientation: Orientation.RIGHT,
        }),
        new TextTourStep({
            highlightSelector: '.tab-item.statistics',
            headlineTranslateKey: 'tour.courseExerciseOverview.statistics.headline',
            contentTranslateKey: 'tour.courseExerciseOverview.statistics.content',
            highlightPadding: 10,
            orientation: Orientation.RIGHT,
        }),
        new TextTourStep({
            highlightSelector: '.exercise-row-container .control-label',
            headlineTranslateKey: 'tour.courseExerciseOverview.exerciseRow.headline',
            contentTranslateKey: 'tour.courseExerciseOverview.exerciseRow.content',
            highlightPadding: 10,
            orientation: Orientation.TOP,
        }),
        new TextTourStep({
            highlightSelector: '.row.guided-tour',
            headlineTranslateKey: 'tour.courseExerciseOverview.currentExercise.headline',
            contentTranslateKey: 'tour.courseExerciseOverview.currentExercise.content',
            highlightPadding: 10,
            orientation: Orientation.TOP,
        }),
        new TextTourStep({
            highlightSelector: '.guided-tour .exercise-row-icon',
            headlineTranslateKey: 'tour.courseExerciseOverview.exerciseType.headline',
            contentTranslateKey: 'tour.courseExerciseOverview.exerciseType.content',
            highlightPadding: 10,
            orientation: Orientation.TOPLEFT,
        }),
        new TextTourStep({
            highlightSelector: '.guided-tour .exercise-tags',
            headlineTranslateKey: 'tour.courseExerciseOverview.exerciseTags.headline',
            contentTranslateKey: 'tour.courseExerciseOverview.exerciseTags.content',
            highlightPadding: 10,
            orientation: Orientation.TOP,
        }),
        new TextTourStep({
            highlightSelector: '.course-information .panel-wrapper',
            headlineTranslateKey: 'tour.courseExerciseOverview.courseInformation.headline',
            contentTranslateKey: 'tour.courseExerciseOverview.courseInformation.content',
            highlightPadding: 10,
            orientation: Orientation.LEFT,
        }),
        new TextTourStep({
            highlightSelector: '.course-information .exercise-panel .panel-wrapper',
            headlineTranslateKey: 'tour.courseExerciseOverview.upcomingDeadlines.headline',
            contentTranslateKey: 'tour.courseExerciseOverview.upcomingDeadlines.content',
            highlightPadding: 10,
            orientation: Orientation.LEFT,
        }),
        new TextTourStep({
            highlightSelector: '.guided-tour .start-exercise div',
            headlineTranslateKey: 'tour.courseExerciseOverview.startExercise.headline',
            contentTranslateKey: 'tour.courseExerciseOverview.startExercise.content',
            highlightPadding: 15,
            orientation: Orientation.TOPLEFT,
            userInteractionEvent: UserInteractionEvent.CLICK,
        }),
        new VideoTourStep({
            headlineTranslateKey: 'tour.courseExerciseOverview.cloneRepository.headline',
            contentTranslateKey: 'tour.courseExerciseOverview.cloneRepository.content',
            videoUrl: 'https://www.youtube.com/embed/pDBl-vSCveM',
        }),
        new VideoTourStep({
            headlineTranslateKey: 'tour.courseExerciseOverview.inspectSourceTree.headline',
            contentTranslateKey: 'tour.courseExerciseOverview.inspectSourceTree.content',
            videoUrl: 'https://www.youtube.com/embed/7ugt0k0Qa7Y',
        }),
        new VideoTourStep({
            headlineTranslateKey: 'tour.courseExerciseOverview.importEclipse.headline',
            contentTranslateKey: 'tour.courseExerciseOverview.importEclipse.content',
            videoUrl: 'https://www.youtube.com/embed/xl0lyV_IHzY',
        }),
        new VideoTourStep({
            headlineTranslateKey: 'tour.courseExerciseOverview.inspectProject.headline',
            contentTranslateKey: 'tour.courseExerciseOverview.inspectProject.content',
            videoUrl: 'https://www.youtube.com/embed/qW9Tc-AYBH8',
        }),
        new VideoTourStep({
            headlineTranslateKey: 'tour.courseExerciseOverview.commitAndPush.headline',
            contentTranslateKey: 'tour.courseExerciseOverview.commitAndPush.content',
            videoUrl: 'https://www.youtube.com/embed/iFRHdp8ozh4',
        }),
        new TextTourStep({
            highlightSelector: '.row.guided-tour',
            headlineTranslateKey: 'tour.courseExerciseOverview.reviewResult.headline',
            contentTranslateKey: 'tour.courseExerciseOverview.reviewResult.content',
            highlightPadding: 10,
            orientation: Orientation.TOP,
            userInteractionEvent: UserInteractionEvent.CLICK,
        }),
    ],
};
