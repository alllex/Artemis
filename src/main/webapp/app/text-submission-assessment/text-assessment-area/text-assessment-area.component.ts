import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { TextSubmission } from 'app/entities/text-submission';
import { TextBlockRef } from 'app/entities/text-assessments/text-block-ref.model';
import { TextBlock } from 'app/entities/text-block/text-block.model';

@Component({
    selector: 'jhi-text-assessment-area',
    templateUrl: './text-assessment-area.component.html',
    styleUrls: ['./text-assessment-area.component.scss'],
})
export class TextAssessmentAreaComponent implements OnChanges {
    @Input() submission: TextSubmission;
    @Input() textBlockRefs: TextBlockRef[];
    @Output() textBlockRefsChange = new EventEmitter<TextBlockRef[]>();

    ngOnChanges(changes: SimpleChanges): void {
        this.textBlockRefs.sort((a, b) => a.block.startIndex - b.block.startIndex);
    }

    private textBlockRefsChangeEmit(): void {
        this.textBlockRefsChange.emit(this.textBlockRefs);
    }

    deleteAtIndex(index: number): void {
        const ref = this.textBlockRefs[index];
        const prev = index > 0 ? this.textBlockRefs[index - 1] : undefined;
        const next = index + 1 < this.textBlockRefs.length ? this.textBlockRefs[index + 1] : undefined;

        const newBlock = new TextBlock();
        newBlock.startIndex = prev && !prev.feedback ? prev.block.startIndex : ref.block.startIndex;
        newBlock.endIndex = next && !next.feedback ? next.block.endIndex : ref.block.endIndex;
        newBlock.submission = this.submission;
        newBlock.setTextFromSubmission();
        ref.block = newBlock;
        ref.feedback = undefined;

        if (next && !next.feedback) {
            this.textBlockRefs.splice(index + 1, 1);
        }
        if (prev && !prev.feedback) {
            this.textBlockRefs.splice(index - 1, 1);
        }

        this.textBlockRefsChangeEmit();
    }
}
